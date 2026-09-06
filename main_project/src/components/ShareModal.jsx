import { useState } from "react";

export default function ShareModal({ docName, accessList, onClose, onAdd, onRevoke }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!email.trim()) return;
    setError("");
    setAdding(true);
    try {
      await onAdd(email.trim(), role);
      setEmail("");
    } catch (err) {
      setError(err.message || "Couldn't add that person.");
    } finally {
      setAdding(false);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(`https://securedoc.app/d/${encodeURIComponent(docName)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share “{docName}”</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="share-input-row">
          <input
            placeholder="Add by email (must already have an account)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Editor</option>
            <option>Viewer</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={adding}>
            {adding ? "Adding…" : "Add"}
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginTop: -6 }}>{error}</div>}

        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>
          People with access ({accessList.length})
        </div>
        <div>
          {accessList.length === 0 && (
            <div style={{ color: "var(--text-dim)", fontSize: 12.5, padding: "6px 0" }}>Nobody yet — add someone above.</div>
          )}
          {accessList.map((p) => (
            <div key={p.id || p.email} className="access-row">
              <div className="who">
                <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{p.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="role">{p.role}</span>
                {p.role !== "Owner" && (
                  <button className="icon-btn" onClick={() => onRevoke(p.id)}>🗑</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 13 }}>Access Link</div>
            <div style={{ fontSize: 11.5, color: "var(--text-dim)" }}>Only people added above can access</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleCopy}>{copied ? "Copied!" : "Copy Link"}</button>
        </div>
      </div>
    </div>
  );
}
