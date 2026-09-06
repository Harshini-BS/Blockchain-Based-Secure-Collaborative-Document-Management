// ---------------------------------------------------------------------------
// SOCKET.IO CLIENT
// Connects to the teammate's Socket.IO server for live collaboration events.
// Events below are the contract — see API_CONTRACT.md "Socket.IO Events".
// Safe to import even before the server exists: connection will just retry
// quietly, and the UI (see App.jsx `connected` state) shows an offline dot.
// ---------------------------------------------------------------------------
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function joinDocument(docId, user) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit("doc:join", { docId, user });
}

export function leaveDocument(docId) {
  const s = getSocket();
  s.emit("doc:leave", { docId });
}

export function emitDocEdit(docId, patch) {
  getSocket().emit("doc:edit", { docId, patch });
}

// Expected server -> client events:
//  "doc:update"      { docId, patch, byUser }         someone else edited
//  "doc:presence"     [{ id, name, initials }]         who's currently viewing
//  "doc:activity"     { who, action, time }            feeds the Live Activity panel
//  "access:changed"   { docId, accessList }            share/revoke happened
