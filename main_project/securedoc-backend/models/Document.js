import mongoose from "mongoose";

const collaboratorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["Owner", "Editor", "Viewer"], required: true },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [collaboratorSchema],
    currentVersion: { type: mongoose.Schema.Types.ObjectId, ref: "Version", default: null },
    status: { type: String, enum: ["Encrypted"], default: "Encrypted" },
    isDeleted: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Helper used by controllers/middleware to resolve a user's effective role
// on a document without duplicating the lookup logic everywhere.
documentSchema.methods.roleFor = function (userId) {
  if (this.owner.toString() === userId.toString()) return "Owner";
  const collab = this.collaborators.find((c) => c.user.toString() === userId.toString());
  return collab ? collab.role : null;
};

export default mongoose.model("Document", documentSchema);
