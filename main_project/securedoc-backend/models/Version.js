import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    versionNo: { type: Number, required: true },
    sha256Hash: { type: String, required: true },
    // Path to the stored (encrypted) file on disk for this version, OR the
    // raw text content for text-based docs edited in-browser. In production
    // this would be replaced/complemented by an IPFS CID from the teammate's
    // blockchain module.
    storagePath: { type: String },
    content: { type: String },
    iv: { type: String }, 
    contentIv: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

versionSchema.index({ document: 1, versionNo: -1 });

export default mongoose.model("Version", versionSchema);
