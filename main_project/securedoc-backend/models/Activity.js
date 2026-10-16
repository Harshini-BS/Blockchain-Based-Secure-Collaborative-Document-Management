import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    doc: { type: mongoose.Schema.Types.ObjectId, ref: "Document", index: true },
    who: String,
    action: String,
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model("Activity", activitySchema);