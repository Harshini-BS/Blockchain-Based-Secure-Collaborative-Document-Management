import Document from "../models/Document.js";

// Loads the document referenced by :id (or :docId) and resolves the
// requesting user's role on it. Attaches req.document and req.docRole so
// downstream handlers don't repeat the lookup.
export async function loadDocument(req, res, next) {
  const docId = req.params.id || req.params.docId;
  const doc = await Document.findById(docId);
  if (!doc || doc.isDeleted) return res.status(404).json({ message: "Document not found" });

  const role = doc.roleFor(req.user._id);
  if (!role) return res.status(403).json({ message: "You don't have access to this document" });

  req.document = doc;
  req.docRole = role;
  next();
}

// Same as loadDocument but also allows already-deleted (trashed) documents —
// used for restore/permanent-delete routes where isDeleted:true is expected.
export async function loadAnyDocument(req, res, next) {
  const docId = req.params.id || req.params.docId;
  const doc = await Document.findById(docId);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const role = doc.roleFor(req.user._id);
  if (!role) return res.status(403).json({ message: "You don't have access to this document" });

  req.document = doc;
  req.docRole = role;
  next();
}

// Usage: requireRole("Owner") or requireRole("Owner", "Editor")
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.docRole || !allowed.includes(req.docRole)) {
      return res.status(403).json({
        message: `This action requires one of these roles: ${allowed.join(", ")}`,
      });
    }
    next();
  };
}
