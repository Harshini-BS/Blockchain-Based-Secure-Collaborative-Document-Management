
import { recordAudit } from "../blockchain/auditService.js";
import {
  uploadToIPFS,
  getFromIPFS,
} from "../blockchain/ipfsService.js";
import fs from "fs";
import path from "path";
import Document from "../models/Document.js";
import Version from "../models/Version.js";
import User from "../models/User.js";
import {
  hashBuffer,
  hashContent,
} from "../utils/hashFile.js";
import {
  encryptBuffer,
  decryptBuffer,
  encryptText,
  decryptText,
} from "../utils/encryption.js";
import { extractEditableContent } from "../utils/extractContent.js";
import crypto from "crypto";

// Record blockchain audit events without failing the main request.
async function auditSafely(documentId, action, userId) {
  try {
    await recordAudit(
      documentId.toString(),
      action,
      userId.toString()
    );
  } catch (error) {
    console.error(
      `[blockchain] ${action} audit failed:`,
      error.message
    );
  }
}

// GET /api/documents
export async function listDocuments(req, res) {
  const docs = await Document.find({
    isDeleted: false,
    $or: [
      { owner: req.user._id },
      { "collaborators.user": req.user._id },
    ],
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
      isOwner:
        d.owner._id.toString() === req.user._id.toString(),
    }))
  );
}

// GET /api/documents/trash
export async function listTrash(req, res) {
  const docs = await Document.find({
    isDeleted: true,
    owner: req.user._id,
  })
    .populate("owner", "name")
    .sort({ updatedAt: -1 });

  res.json(
    docs.map((d) => ({
      id: d._id,
      name: d.name,
      owner: d.owner.name,
      modified: d.updatedAt,
    }))
  );
}

// POST /api/documents/:id/restore
export async function restoreFromTrash(req, res) {
  req.document.isDeleted = false;
  await req.document.save();

  await auditSafely(
    req.document._id,
    "DOCUMENT_RESTORED",
    req.user._id
  );

  res.json({ ok: true });
}

// DELETE /api/documents/:id/permanent
export async function permanentlyDelete(req, res) {
  const versions = await Version.find({
    document: req.document._id,
  });

  versions.forEach((v) => {
    if (v.storagePath && fs.existsSync(v.storagePath)) {
      fs.unlinkSync(v.storagePath);
    }
  });

  await Version.deleteMany({
    document: req.document._id,
  });

  await auditSafely(
    req.document._id,
    "DOCUMENT_PERMANENTLY_DELETED",
    req.user._id
  );

  await Document.findByIdAndDelete(req.document._id);

  res.json({ ok: true });
}

// POST /api/documents
export async function createDocument(req, res) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  const doc = await Document.create({
    name: file.originalname,
    owner: req.user._id,
    collaborators: [],
  });

  const sha256Hash = hashBuffer(file.buffer);
  const { encrypted, iv } = encryptBuffer(file.buffer);

  const ipfsCid = await uploadToIPFS(encrypted);
  console.log("[IPFS] CID:", ipfsCid);

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname)}`;
  const storagePath = path.resolve("uploads", filename);

  fs.writeFileSync(storagePath, encrypted);

  const extractedHtml = await extractEditableContent(file);
  let contentCipher = null;

  if (extractedHtml) {
    contentCipher = encryptText(extractedHtml);
  }

  const version = await Version.create({
    document: doc._id,
    versionNo: 1,
    sha256Hash,
    storagePath,
    ipfsCid,
    iv,
    content: contentCipher?.encrypted,
    contentIv: contentCipher?.iv,
    createdBy: req.user._id,
    note: "Initial upload",
  });

  doc.currentVersion = version._id;
  await doc.save();

  await auditSafely(
    doc._id,
    "DOCUMENT_CREATED",
    req.user._id
  );

  res.status(201).json({
    id: doc._id,
    name: doc.name,
    status: doc.status,
    sha256Hash,
  });
}

// POST /api/documents/text
export async function createTextDocument(req, res) {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      message: "Document name is required",
    });
  }

  const doc = await Document.create({
    name: name.trim(),
    owner: req.user._id,
    collaborators: [],
  });

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

  await auditSafely(
    doc._id,
    "DOCUMENT_CREATED",
    req.user._id
  );

  res.status(201).json({
    id: doc._id,
    name: doc.name,
    status: doc.status,
  });
}

// GET /api/documents/:id
export async function getDocument(req, res) {
  req.document.views += 1;
  await req.document.save();

  const version = await Version.findById(
    req.document.currentVersion
  );

  const plainContent = version?.content
    ? decryptText(version.content, version.contentIv)
    : undefined;

  res.json({
    id: req.document._id,
    name: req.document.name,
    role: req.docRole,
    hasTextContent: Boolean(version?.content),
    isExtractedFromFile:
      Boolean(version?.storagePath) &&
      Boolean(version?.content),
    currentVersion: version
      ? {
          versionNo: version.versionNo,
          sha256Hash: version.sha256Hash,
          content: plainContent,
        }
      : null,
  });
}

// PATCH /api/documents/:id/rename
export async function renameDocument(req, res) {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      message: "New name is required",
    });
  }

  req.document.name = name.trim();
  await req.document.save();

  await auditSafely(
    req.document._id,
    "DOCUMENT_RENAMED",
    req.user._id
  );

  res.json({
    id: req.document._id,
    name: req.document.name,
  });
}

// DELETE /api/documents/:id
export async function deleteDocument(req, res) {
  req.document.isDeleted = true;
  await req.document.save();

  await auditSafely(
    req.document._id,
    "DOCUMENT_DELETED",
    req.user._id
  );

  res.json({ ok: true });
}

// Download rate limit
const DOWNLOAD_WINDOW_MS = 2 * 60 * 1000;
const DOWNLOAD_LIMIT = 15;

// GET /api/documents/:id/download
export async function downloadDocument(req, res) {
  console.log("[DOWNLOAD] downloadDocument called");

  const now = Date.now();

  const recent = (req.user.recentDownloads || []).filter(
    (d) =>
      now - new Date(d).getTime() < DOWNLOAD_WINDOW_MS
  );

  if (recent.length >= DOWNLOAD_LIMIT) {
    return res.status(429).json({
      message:
        "Unusual download activity detected. Please wait a couple of minutes and try again.",
      riskLevel: "restricted",
    });
  }

  recent.push(new Date(now));
  req.user.recentDownloads = recent;
  await req.user.save();

  const version = await Version.findById(
    req.document.currentVersion
  );

  console.log("[DOWNLOAD] Storage path:", version?.storagePath);
  console.log(
    "[DOWNLOAD] Local file exists:",
    version?.storagePath
      ? fs.existsSync(version.storagePath)
      : false
  );

  // Prefer the local encrypted file when it exists.
  if (
    version?.storagePath &&
    fs.existsSync(version.storagePath)
  ) {
    const encrypted = fs.readFileSync(version.storagePath);
    const decrypted = decryptBuffer(encrypted, version.iv);

    console.log("[DOWNLOAD] Decrypted bytes:", decrypted.length);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(req.document.name)}"`
    );
    res.setHeader(
      "Content-Type",
      "application/octet-stream"
    );

    return res.send(decrypted);
  }

  // Otherwise retrieve the encrypted file from IPFS.
  console.log("[IPFS] Local file missing; using IPFS fallback");

  if (version?.ipfsCid) {
    const encrypted = await getFromIPFS(version.ipfsCid);
    const decrypted = decryptBuffer(encrypted, version.iv);

    console.log("[DOWNLOAD] Decrypted bytes:", decrypted.length);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(req.document.name)}"`
    );
    res.setHeader(
      "Content-Type",
      "application/octet-stream"
    );

    return res.send(decrypted);
  }

  // Export text-only versions as HTML.
  if (version?.content) {
    const plainHtml = decryptText(
      version.content,
      version.contentIv
    );

    const baseName = req.document.name.replace(
      /\.[^/.]+$/,
      ""
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(baseName)}.html"`
    );
    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    return res.send(
      `<!doctype html><meta charset="utf-8"><title>${baseName}</title>${plainHtml}`
    );
  }

  return res.status(404).json({
    message: "File not available for this version",
  });
}

// PATCH /api/documents/:id
export async function editDocumentContent(req, res) {
  const { content } = req.body;

  if (content === undefined) {
    return res.status(400).json({
      message: "content is required",
    });
  }

  const latest = await Version.findOne({
    document: req.document._id,
  }).sort({ versionNo: -1 });

  const nextVersionNo = (latest?.versionNo || 0) + 1;

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

  await auditSafely(
    req.document._id,
    "DOCUMENT_EDITED",
    req.user._id
  );

  res.json({
    ok: true,
    versionNo: version.versionNo,
    sha256Hash: version.sha256Hash,
  });
}

// GET /api/documents/:id/access
export async function listAccess(req, res) {
  const doc = await req.document.populate(
    "owner collaborators.user",
    "name email"
  );

  const list = [
    {
      id: doc.owner._id,
      name: doc.owner.name,
      email: doc.owner.email,
      role: "Owner",
    },
    ...doc.collaborators.map((c) => ({
      id: c.user._id,
      name: c.user.name,
      email: c.user.email,
      role: c.role,
    })),
  ];

  res.json(list);
}

// POST /api/documents/:id/share
export async function shareDocument(req, res) {
  const { email, role } = req.body;

  if (!email || !["Editor", "Viewer"].includes(role)) {
    return res.status(400).json({
      message:
        "email and a valid role (Editor/Viewer) are required",
    });
  }

  const target = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!target) {
    return res.status(404).json({
      message: "No user with that email",
    });
  }

  const existing = req.document.collaborators.find(
    (c) => c.user.toString() === target._id.toString()
  );

  if (existing) {
    existing.role = role;
  } else {
    req.document.collaborators.push({
      user: target._id,
      role,
    });
  }

  await req.document.save();

  await auditSafely(
    req.document._id,
    "DOCUMENT_SHARED",
    req.user._id
  );

  res.json({ ok: true });
}

// DELETE /api/documents/:id/collaborators/:userId
export async function revokeAccess(req, res) {
  req.document.collaborators =
    req.document.collaborators.filter(
      (c) =>
        c.user.toString() !== req.params.userId
    );

  await req.document.save();

  await auditSafely(
    req.document._id,
    "ACCESS_REVOKED",
    req.user._id
  );

  res.json({ ok: true });
}

// GET /api/documents/:id/audit
export async function getDocumentAudit(req, res) {
  try {
    const { getAuditHistory } = await import(
      "../blockchain/auditService.js"
    );

    const items = await getAuditHistory(req.params.id);

    return res.json(items);
  } catch (error) {
    console.error(
      "[audit] Failed to load audit history:",
      error
    );

    return res.status(500).json({
      message: "Failed to load blockchain audit history",
    });
  }
}
