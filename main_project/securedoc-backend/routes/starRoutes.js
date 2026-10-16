import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import Star from "../models/star.js";
import Document from "../models/Document.js";


const router = Router();
router.use(protect);

// list my starred documents
router.get("/", async (req, res, next) => {
  try {
    const stars = await Star.find({ user: req.user._id }).sort({ createdAt: -1 });
    const docs = await Document.find({
      _id: { $in: stars.map((s) => s.doc) },
      isDeleted: false,
    });
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));

    const out = [];
    for (const s of stars) {
      const d = byId.get(s.doc.toString());
      const role = d?.roleFor(req.user._id);
      if (d && role) {
        out.push({ id: d._id.toString(), name: d.name, role, modified: d.updatedAt });
      }
    }
    res.json(out);
  } catch (err) {
    next(err);
  }
});

// is this document starred?
router.get("/:id", async (req, res, next) => {
  try {
    const s = await Star.findOne({ user: req.user._id, doc: req.params.id });
    res.json({ starred: !!s });
  } catch (err) {
    next(err);
  }
});

// toggle star
router.post("/:id", async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc || !doc.roleFor(req.user._id)) {
      return res.status(403).json({ message: "No access to this document" });
    }
    const existing = await Star.findOne({ user: req.user._id, doc: doc._id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ starred: false });
    }
    await Star.create({ user: req.user._id, doc: doc._id });
    res.json({ starred: true });
  } catch (err) {
    next(err);
  }
});

export default router;