import Document from "../models/Document.js";
import Version from "../models/Version.js";
import { decryptText } from "../utils/encryption.js";

// GET /api/documents/:id/versions
export async function listVersions(req, res) {
  const versions = await Version.find({ document: req.document._id })
    .populate("createdBy", "name")
    .sort({ versionNo: -1 });

  res.json(
    versions.map((v) => ({
      version: v.versionNo,
      current: req.document.currentVersion?.toString() === v._id.toString(),
      date: v.createdAt,
      by: v.createdBy?.name,
      sha256Hash: v.sha256Hash,
      content: v.content ? decryptText(v.content, v.contentIv) : undefined,
    }))
  );
}

// POST /api/documents/:id/versions/:versionNo/restore
export async function restoreVersion(req, res) {
  const targetVersionNo = Number(req.params.versionNo);
  const target = await Version.findOne({ document: req.document._id, versionNo: targetVersionNo });
  if (!target) return res.status(404).json({ message: "Version not found" });

  const latest = await Version.findOne({ document: req.document._id }).sort({ versionNo: -1 });
  const restored = await Version.create({
    document: req.document._id,
    versionNo: (latest?.versionNo || 0) + 1,
    sha256Hash: target.sha256Hash,
    storagePath: target.storagePath,
    iv: target.iv,
    content: target.content,
    contentIv: target.contentIv,
    createdBy: req.user._id,
    note: `Restored from version ${targetVersionNo}`,
  });

  await Document.findByIdAndUpdate(req.document._id, { currentVersion: restored._id });
  res.json({ ok: true, newVersion: restored.versionNo });
}