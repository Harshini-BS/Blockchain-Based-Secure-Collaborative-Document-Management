import fs from "fs";
import path from "path";
import Document from "../models/Document.js";
import Version from "../models/Version.js";
import User from "../models/User.js";
import { hashBuffer, hashContent } from "../utils/hashFile.js";
import { encryptBuffer, decryptBuffer, encryptText, decryptText } from "../utils/encryption.js";
import { extractEditableContent } from "../utils/extractContent.js";
import crypto from "crypto";

// GET /api/documents — every document the user owns or collaborates on
export async function listDocuments(req, res) {
  const docs = await Document.find({
    isDeleted: false,
    $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
  })
    .populate("owner", "name")
    .sort({ updatedAt: -1 });

  res.json(
    docs.map((d) => ({
      id: d._id,
      name: d.name,
      owner: d.owner.name,
      modified: d.updatedAt,
      status: d.status,
      role: d.roleFor(req.user._id),
      isOwner: d.owner._id.toString() === req.user._id.toString(),
    }))
  );
}

// GET /api/documents/trash — soft-deleted docs you own
export async function listTrash(req, res) {
  const docs = await Document.find({ isDeleted: true, owner: req.user._id })
    .populate("owner", "name")
    .sort({ updatedAt: -1 });

  res.json(
    docs.map((d) => ({ id: d._id, name: d.name, owner: d.owner.name, modified: d.updatedAt }))
  );
}

// POST /api/documents/:id/restore — bring a soft-deleted doc back (Owner only)
export async function restoreFromTrash(req, res) {
  req.document.isDeleted = false;
  await req.document.save();
  res.json({ ok: true });
}

// DELETE /api/documents/:id/permanent — permanently wipe a trashed doc + its versions/file (Owner only)
export async function permanentlyDelete(req, res) {
  const versions = await Version.find({ document: req.document._id });
  versions.forEach((v) => {
    if (v.storagePath && fs.existsSync(v.storagePath)) fs.unlinkSync(v.storagePath);
  });
  await Version.deleteMany({ document: req.document._id });
  await Document.findByIdAndDelete(req.document._id);
  res.json({ ok: true });
}

// POST /api/documents  (multipart form: file) — create doc + version 1
export async function createDocument(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const doc = await Document.create({
    name: file.originalname,
    owner: req.user._id,
    collaborators: [],
  });

  // Hash the ORIGINAL bytes first (that's the fingerprint of the real
  // content), then encrypt with AES-256 before anything touches disk.
  const sha256Hash = hashBuffer(file.buffer);
  const { encrypted, iv } = encryptBuffer(file.buffer);

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname)}`;
  const storagePath = path.resolve("uploads", filename);
  fs.writeFileSync(storagePath, encrypted);

  // Word docs and PDFs get their text pulled out so they're actually
  // editable in the browser, in addition to keeping the original file
  // downloadable exactly as uploaded. Other formats (images, zips, etc.)
  // just stay as pure encrypted binary — nothing to extract there.
  const extractedHtml = await extractEditableContent(file);
  let contentCipher = null;
  if (extractedHtml) contentCipher = encryptText(extractedHtml);

  const version = await Version.create({
    document: doc._id,
    versionNo: 1,
    sha256Hash,
    storagePath,
    iv,
    content: contentCipher?.encrypted,
    // Binary file's IV and text content's IV are different (two separate
    // encrypt calls) — store the text one separately so both can decrypt
    // independently. See Version model: contentIv.
    contentIv: contentCipher?.iv,
    createdBy: req.user._id,
    note: "Initial upload",
  });

  doc.currentVersion = version._id;
  await doc.save();

  res.status(201).json({ id: doc._id, name: doc.name, status: doc.status, sha256Hash });
}

// POST /api/documents/text  { name } — create a blank text document you can edit inline
export async function createTextDocument(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Document name is required" });

  const doc = await Document.create({ name: name.trim(), owner: req.user._id, collaborators: [] });
  const { encrypted, iv } = encryptText("");
  const version = await Version.create({
    document: doc._id,
    versionNo: 1,
    sha256Hash: hashContent(""),
    content: encrypted,
    contentIv: iv,
    createdBy: req.user._id,
    note: "Created",
  });
  doc.currentVersion = version._id;
  await doc.save();

  res.status(201).json({ id: doc._id, name: doc.name, status: doc.status });
}

// GET /api/documents/:id — full doc, requires loadDocument middleware first
export async function getDocument(req, res) {
  req.document.views += 1;
  await req.document.save();

  const version = await Version.findById(req.document.currentVersion);
  const plainContent = version?.content ? decryptText(version.content, version.contentIv) : undefined;

  res.json({
    id: req.document._id,
    name: req.document.name,
    role: req.docRole,
    // Editable whenever this version has extracted/native text content —
    // true for app-created text docs AND for uploaded docx/PDF we could pull
    // text from. Pure binary uploads (images, zips, etc.) stay download-only.
    hasTextContent: Boolean(version?.content),
    // True when BOTH the original file and extracted text exist together —
    // lets the UI explain "this is a preview; editing starts a new SecureDoc
    // version and the original file format is preserved in this version."
    isExtractedFromFile: Boolean(version?.storagePath) && Boolean(version?.content),
    currentVersion: version
      ? { versionNo: version.versionNo, sha256Hash: version.sha256Hash, content: plainContent }
      : null,
  });
}

// PATCH /api/documents/:id/rename  { name }
export async function renameDocument(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "New name is required" });
  req.document.name = name.trim();
  await req.document.save();
  res.json({ id: req.document._id, name: req.document.name });
}

// DELETE /api/documents/:id  (soft delete — moves to Trash)
export async function deleteDocument(req, res) {
  req.document.isDeleted = true;
  await req.document.save();
  res.json({ ok: true });
}

// GET /api/documents/:id/download — streams the current version's file
// Also enforces the "unusual downloads" risk check: a normal user downloading
// a handful of files is fine; someone pulling dozens in a couple minutes
// looks like scripted/suspicious access, so we throttle it.
const DOWNLOAD_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const DOWNLOAD_LIMIT = 15;

export async function downloadDocument(req, res) {
  const now = Date.now();
  const recent = (req.user.recentDownloads || []).filter((d) => now - new Date(d).getTime() < DOWNLOAD_WINDOW_MS);

  if (recent.length >= DOWNLOAD_LIMIT) {
    return res.status(429).json({
      message: "Unusual download activity detected. Please wait a couple of minutes and try again.",
      riskLevel: "restricted",
    });
  }

  recent.push(new Date(now));
  req.user.recentDownloads = recent;
  await req.user.save();

  const version = await Version.findById(req.document.currentVersion);

  // Prefer the real original file (exact bytes as uploaded) whenever it
  // still exists on this version.
  if (version?.storagePath && fs.existsSync(version.storagePath)) {
    const encrypted = fs.readFileSync(version.storagePath);
    const decrypted = decryptBuffer(encrypted, version.iv);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(req.document.name)}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    return res.send(decrypted);
  }

  // Otherwise (a version that only has edited SecureDoc text — e.g. after
  // you edited an uploaded docx/PDF and saved) export it as HTML.
  if (version?.content) {
    const plainHtml = decryptText(version.content, version.contentIv);
    const baseName = req.document.name.replace(/\.[^/.]+$/, "");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(baseName)}.html"`);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!doctype html><meta charset="utf-8"><title>${baseName}</title>${plainHtml}`);
  }

  res.status(404).json({ message: "File not available for this version" });
}

// PATCH /api/documents/:id — text edits (e.g. from the in-browser editor)
// Creates a NEW version rather than mutating the current one, so history stays
// intact. If the previous version was an uploaded docx/PDF (had both a file
// AND extracted text), the saved edit becomes a pure SecureDoc text version —
// we can't regenerate a real .docx/.pdf from edited HTML, so the original
// file format only survives in whichever version you don't edit.
export async function editDocumentContent(req, res) {
  const { content } = req.body;
  if (content === undefined) return res.status(400).json({ message: "content is required" });

  const latest = await Version.findOne({ document: req.document._id }).sort({ versionNo: -1 });
  const nextVersionNo = (latest?.versionNo || 0) + 1;

  // Hash the real plaintext (that's the meaningful fingerprint), then encrypt
  // for storage — the database never holds readable text at rest.
  const sha256Hash = hashContent(content);
  const { encrypted, iv } = encryptText(content);

  const version = await Version.create({
    document: req.document._id,
    versionNo: nextVersionNo,
    sha256Hash,
    content: encrypted,
    contentIv: iv,
    createdBy: req.user._id,
    note: "Edited via editor",
  });

  req.document.currentVersion = version._id;
  await req.document.save();

  res.json({ ok: true, versionNo: version.versionNo, sha256Hash: version.sha256Hash });
}

// GET /api/documents/:id/access — Owner/Editor/Viewer list, for the Share modal
export async function listAccess(req, res) {
  const doc = await req.document.populate("owner collaborators.user", "name email");
  const list = [
    { id: doc.owner._id, name: doc.owner.name, email: doc.owner.email, role: "Owner" },
    ...doc.collaborators.map((c) => ({ id: c.user._id, name: c.user.name, email: c.user.email, role: c.role })),
  ];
  res.json(list);
}

// POST /api/documents/:id/share  { email, role }  — Owner only (see routes)
export async function shareDocument(req, res) {
  const { email, role } = req.body;
  if (!email || !["Editor", "Viewer"].includes(role)) {
    return res.status(400).json({ message: "email and a valid role (Editor/Viewer) are required" });
  }
  const target = await User.findOne({ email: email.toLowerCase() });
  if (!target) return res.status(404).json({ message: "No user with that email" });

  const existing = req.document.collaborators.find((c) => c.user.toString() === target._id.toString());
  if (existing) existing.role = role;
  else req.document.collaborators.push({ user: target._id, role });

  await req.document.save();
  res.json({ ok: true });
}

// DELETE /api/documents/:id/collaborators/:userId — Owner only
export async function revokeAccess(req, res) {
  req.document.collaborators = req.document.collaborators.filter(
    (c) => c.user.toString() !== req.params.userId
  );
  await req.document.save();
  res.json({ ok: true });
}