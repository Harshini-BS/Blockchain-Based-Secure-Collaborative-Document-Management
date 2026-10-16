import mongoose from "mongoose";

const starSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doc: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
  },
  { timestamps: true }
);
starSchema.index({ user: 1, doc: 1 }, { unique: true });

export default mongoose.models.Star || mongoose.model("Star", starSchema);