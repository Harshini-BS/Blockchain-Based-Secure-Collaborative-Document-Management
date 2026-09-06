import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Global default role for documents this user owns. Per-document role
    // (Owner/Editor/Viewer) actually lives on Document.collaborators.
    defaultRole: { type: String, enum: ["Owner", "Editor", "Viewer"], default: "Owner" },
    avatarInitials: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    recentDownloads: { type: [Date], default: [] }, // rolling window for the download-rate risk check
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.defaultRole,
    initials: this.avatarInitials,
  };
};

export default mongoose.model("User", userSchema);
