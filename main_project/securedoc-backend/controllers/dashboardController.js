import Document from "../models/Document.js";
import Version from "../models/Version.js";

// GET /api/dashboard/stats — everything computed live from MongoDB for the
// logged-in user. No hardcoded numbers anywhere.
export async function getDashboardStats(req, res) {
  const userId = req.user._id;

  const docs = await Document.find({
    isDeleted: false,
    $or: [{ owner: userId }, { "collaborators.user": userId }],
  });

  const docIds = docs.map((d) => d._id);
  const totalVersions = await Version.countDocuments({ document: { $in: docIds } });

  const collaboratorIds = new Set();
  docs.forEach((d) => {
    collaboratorIds.add(d.owner.toString());
    d.collaborators.forEach((c) => collaboratorIds.add(c.user.toString()));
  });
  // Includes yourself, same as each document's own Collaborators panel does —
  // so the dashboard number and the per-document number always agree.

  const totalViews = docs.reduce((sum, d) => sum + (d.views || 0), 0);

  res.json([
    { label: "Total Documents", value: docs.length, glyph: "📁", color: "#6366f1" },
    { label: "Total Collaborators", value: collaboratorIds.size, glyph: "👥", color: "#22d3ee" },
    { label: "Total Versions", value: totalVersions, glyph: "🧱", color: "#fbbf24" },
    { label: "Total Views", value: totalViews, glyph: "👁", color: "#a78bfa" },
  ]);
}
