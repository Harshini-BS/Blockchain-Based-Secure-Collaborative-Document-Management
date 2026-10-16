import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Document from "./models/Document.js"; 
import mongoose from "mongoose";

let io = null;
const roomOf = (docId) => `doc:${docId}`;
const feedOf = (docId) => `feed:${docId}`;

const nowTime = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function initialsOf(name = "") {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * CHANGE THIS to match your Document schema.
 * Return "Owner" | "Editor" | "Viewer", or null if the user has no access.
 */
async function getRole(docId, userId) {
  try {
    const doc = await Document.findOne({ _id: docId, isDeleted: false });
    if (!doc) return null;
    return doc.roleFor(userId); // "Owner" | "Editor" | "Viewer" | null
  } catch {
    return null; // invalid id or DB error, so deny access
  }
}

async function broadcastPresence(docId) {
  const sockets = await io.in(roomOf(docId)).fetchSockets();
  const unique = new Map();
  for (const s of sockets) {
    const u = s.data.user;
    unique.set(u.id, { id: u.id, name: u.name, initials: initialsOf(u.name) });
  }
  io.to(roomOf(docId)).emit("doc:presence", [...unique.values()]);
}

function emitActivity(docId, who, action) {
  try {
    mongoose.connection
      .collection("live_feed")
      .insertOne({
        doc: new mongoose.Types.ObjectId(docId),
        who,
        action,
        createdAt: new Date(),
      })
      .catch((e) => console.log("feed save failed:", e.message));
  } catch (e) {
    console.log("feed save failed:", e.message);
  }

  io.to(roomOf(docId)).to(feedOf(docId)).emit("doc:activity", {
    docId,
    who,
    action,
    time: nowTime(),
  });
}
export function getIO() {
  return io;
}

export function notifyAccessChanged(docId, accessList) {
  if (io) io.to(roomOf(docId)).emit("access:changed", { docId, accessList });
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" },
  });

  // Authenticate with the same JWT as the REST API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authenticated"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (!user) return next(new Error("User no longer exists"));
      socket.data.user = { id: user._id.toString(), name: user.name || user.email };
      socket.data.docs = new Map(); // docId -> role
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const me = socket.data.user;

    socket.on("doc:join", async ({ docId }) => {
      if (!docId) return;
      const role = await getRole(docId, me.id);
      if (!role) return socket.emit("doc:error", { docId, message: "No access" });

      socket.join(roomOf(docId));
      socket.data.docs.set(docId, role);
      await broadcastPresence(docId);
     
     emitActivity(docId, me.name, "joined the document");
    });

    socket.on("doc:leave", async ({ docId }) => {
      if (!socket.data.docs.has(docId)) return;
      socket.leave(roomOf(docId));
      socket.data.docs.delete(docId);
      await broadcastPresence(docId);
      emitActivity(docId, me.name, "left the document");
    });

   socket.on("doc:edit", ({ docId, patch }) => {
  const role = socket.data.docs.get(docId);
  if (!role || role === "Viewer") return;

  socket.to(roomOf(docId)).emit("doc:update", { docId, patch, byUser: me });
  emitActivity(docId, me.name, "saved a new version");
});

socket.on("feed:join", async () => {
  const docs = await Document.find({
    isDeleted: false,
    $or: [{ owner: me.id }, { "collaborators.user": me.id }],
  }).select("_id name owner collaborators");

  socket.data.feedDocs = docs.map((d) => d._id.toString());
  socket.data.feedDocs.forEach((id) => socket.join(feedOf(id)));
  socket.emit(
  "feed:ready",
  docs.map((d) => ({ id: d._id.toString(), name: d.name, role: d.roleFor(me.id) }))
);
});

socket.on("feed:leave", () => {
  (socket.data.feedDocs || []).forEach((id) => socket.leave(feedOf(id)));
  socket.data.feedDocs = [];
});

    socket.on("disconnect", async () => {
      for (const docId of socket.data.docs.keys()) {
        await broadcastPresence(docId);
        emitActivity(docId, me.name, "went offline");
      }
    });
  });

  return io;
}