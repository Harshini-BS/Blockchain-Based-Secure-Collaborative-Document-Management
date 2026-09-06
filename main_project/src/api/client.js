// ---------------------------------------------------------------------------
// API CLIENT
// This is the ONLY file (besides socket.js) that talks to the backend.
// Every function below is a stub returning mock data. Your teammate's job is
// to build the real Express endpoints described in API_CONTRACT.md — once
// those exist, flip USE_MOCKS to false and these functions call `fetch()`
// against the real API instead. Nothing in the UI components needs to change.
// ---------------------------------------------------------------------------
import {
  stats, documents, activeDocument, collaborators,
  versions, accessList, auditTrail,
} from "../mockData";

const USE_MOCKS = false; // now wired to the real backend
const BASE_URL = "/api"; // proxied to http://localhost:4000 in dev (see vite.config.js)

function authHeaders() {
  const token = localStorage.getItem("sd_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers },
  });
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function login(email, password) {
  if (USE_MOCKS) return { token: "mock-token", user: { name: "Harshini R", role: "Owner", initials: "HR" } };
  // POST /api/auth/login { email, password } -> { token, user }
  return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function register(name, email, password) {
  if (USE_MOCKS) return { token: "mock-token", user: { name, role: "Owner", initials: name[0] } };
  // POST /api/auth/register { name, email, password } -> { token, user }
  return request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
}

export async function fetchProfile() {
  if (USE_MOCKS) return { name: "Harshini R", email: "harshini@example.com", role: "Owner" };
  // GET /api/users/me -> { id, name, email, role, initials }
  return request("/users/me");
}

export async function updateProfile(patch) {
  if (USE_MOCKS) return { ok: true };
  // PATCH /api/users/me { name?, password? } -> updated user
  return request("/users/me", { method: "PATCH", body: JSON.stringify(patch) });
}

export async function fetchDashboardStats() {
  if (USE_MOCKS) return stats;
  // GET /api/dashboard/stats -> [{ label, value, delta }]
  return request("/dashboard/stats");
}

export async function fetchDocuments() {
  if (USE_MOCKS) return documents;
  // GET /api/documents -> [{ id, name, owner, modified, status }]
  return request("/documents");
}

export async function fetchDocument(id) {
  if (USE_MOCKS) return activeDocument;
  // GET /api/documents/:id -> full doc incl. decrypted body (server decrypts AES-256 after auth check)
  return request(`/documents/${id}`);
}

export async function uploadDocument(file) {
  if (USE_MOCKS) return { id: "d-new", name: file.name, status: "Encrypted" };
  // POST /api/documents (multipart/form-data) -> encrypts client-fetched file, pins to IPFS,
  // writes SHA-256 hash + metadata to chain. Returns created document.
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/documents`, { method: "POST", headers: authHeaders(), body: form });
  if (!res.ok) {
    let message = "Upload failed. Please try again.";
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function createTextDocument(name) {
  if (USE_MOCKS) return { id: "d-new", name, status: "Encrypted" };
  // POST /api/documents/text { name } -> blank editable document
  return request("/documents/text", { method: "POST", body: JSON.stringify({ name }) });
}

export async function fetchAccessList(docId) {
  if (USE_MOCKS) return accessList;
  // GET /api/documents/:id/access -> [{ name, email, role }]
  return request(`/documents/${docId}/access`);
}

export async function shareDocument(docId, email, role) {
  if (USE_MOCKS) return { ok: true };
  // POST /api/documents/:id/share { email, role } -> Owner only, adds a collaborator
  return request(`/documents/${docId}/share`, { method: "POST", body: JSON.stringify({ email, role }) });
}

export async function revokeAccess(docId, userId) {
  if (USE_MOCKS) return { ok: true };
  // DELETE /api/documents/:id/collaborators/:userId — Owner only
  return request(`/documents/${docId}/collaborators/${userId}`, { method: "DELETE" });
}

export async function fetchVersions(docId) {
  if (USE_MOCKS) return versions;
  // GET /api/documents/:id/versions -> [{ version, current, date, by, sha256Hash }]
  return request(`/documents/${docId}/versions`);
}

export async function restoreVersion(docId, versionNo) {
  if (USE_MOCKS) return { ok: true };
  // POST /api/documents/:id/versions/:versionNo/restore -> creates a new version copying the old content
  return request(`/documents/${docId}/versions/${versionNo}/restore`, { method: "POST" });
}

export async function saveDocumentEdit(docId, patch) {
  if (USE_MOCKS) return { ok: true };
  // PATCH /api/documents/:id { content } -> also broadcast via Socket.IO "doc:update" (see socket.js)
  return request(`/documents/${docId}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function renameDocument(docId, name) {
  if (USE_MOCKS) return { ok: true };
  // PATCH /api/documents/:id/rename { name }
  return request(`/documents/${docId}/rename`, { method: "PATCH", body: JSON.stringify({ name }) });
}

export async function deleteDocument(docId) {
  if (USE_MOCKS) return { ok: true };
  // DELETE /api/documents/:id — soft delete
  return request(`/documents/${docId}`, { method: "DELETE" });
}

export async function fetchTrash() {
  if (USE_MOCKS) return [];
  // GET /api/documents/trash
  return request(`/documents/trash`);
}

export async function restoreFromTrash(docId) {
  if (USE_MOCKS) return { ok: true };
  // POST /api/documents/:id/restore
  return request(`/documents/${docId}/restore`, { method: "POST" });
}

export async function permanentlyDeleteDocument(docId) {
  if (USE_MOCKS) return { ok: true };
  // DELETE /api/documents/:id/permanent
  return request(`/documents/${docId}/permanent`, { method: "DELETE" });
}

export async function downloadDocumentFile(docId, fallbackName) {
  const res = await fetch(`${BASE_URL}/documents/${docId}/download`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fallbackName || "document";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
