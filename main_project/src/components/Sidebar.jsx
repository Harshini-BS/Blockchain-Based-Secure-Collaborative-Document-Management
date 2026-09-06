import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { icon: "🏠", label: "Dashboard", path: "/dashboard" },
  { icon: "📄", label: "Documents", path: "/documents" },
  { icon: "🔗", label: "Shared With Me", path: "/shared" },
  { icon: "⭐", label: "Starred", path: "/starred" },
  { icon: "📈", label: "Activity", path: "/activity" },
  { icon: "🛡", label: "Access Control", path: "/access-control" },
  { icon: "🧱", label: "Version History", path: "/version-history" },
  { icon: "🗑", label: "Trash", path: "/trash" },
  { icon: "⚙", label: "Settings", path: "/profile" },
];

export default function Sidebar({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.initials || user?.name?.[0] || "?";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">SD</div>
        <div>
          <div className="name">SecureDoc</div>
          <div className="tag">BlockSecure</div>
        </div>
      </div>

      <nav className="nav-group">
        {NAV.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name || "Not signed in"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{user?.role || ""}</div>
        </div>
        <button
          className="icon-btn"
          title="Log out"
          onClick={handleLogout}
          style={{ fontSize: 15 }}
        >
          ⏻
        </button>
      </div>
    </aside>
  );
}