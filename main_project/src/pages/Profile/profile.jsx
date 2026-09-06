import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile, updateProfile } from "../../api/client";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile().then((p) => setName(p.name)).catch(() => {});
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateProfile({ name, ...(password ? { password } : {}) });
      const updated = { ...user, name };
      setUser(updated);
      localStorage.setItem("sd_user", JSON.stringify(updated));
      setPassword("");
      setSaved(true);
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      setError(err.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Layout>
      <div className="profile-shell">
        <div className="profile-header">
          <div className="avatar">{user?.initials || name?.[0]}</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", margin: 0, fontSize: 20 }}>{name}</h1>
            <div style={{ color: "var(--text-dim)", fontSize: 13 }}>{user?.role}</div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Account details</div>
          {saved && <div style={{ color: "var(--success)", fontSize: 12.5, marginBottom: 12 }}>Profile updated.</div>}
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>New password (leave blank to keep current)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title">Session</div>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </Layout>
  );
}
