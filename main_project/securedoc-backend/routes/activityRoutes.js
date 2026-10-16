import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import Document from "../models/Document.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const docs = await Document.find({
      isDeleted: false,
      $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
    }).select("_id name owner collaborators");

    const names = Object.fromEntries(docs.map((d) => [d._id.toString(), d.name]));

    const roles = Object.fromEntries(
    docs.map((d) => [d._id.toString(), d.roleFor(req.user._id)])
    );

    const items = await mongoose.connection
      .collection("live_feed")
      .find({ doc: { $in: docs.map((d) => d._id) } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json(
      items.map((a) => ({
        docId: String(a.doc),
        docName: names[String(a.doc)],
        role: roles[String(a.doc)],
        who: a.who,
        action: a.action,
        time: new Date(a.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }))
    );
  } catch (err) {
    next(err);
  }
});


export default router;