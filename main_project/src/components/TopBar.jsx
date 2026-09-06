export default function TopBar({ connected, query, onQueryChange, user }) {
  const initials = user?.initials || user?.name?.[0] || "?";
  return (
    <div className="topbar">
      <div className="welcome">
        <div className="eyebrow">Welcome back</div>
        <h1>{user?.name || "there"} 👋</h1>
      </div>

      <div className="search-box">
        <span>🔍</span>
        <input
          placeholder="Search documents…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="conn-dot">
          <span className={`d ${connected ? "on" : "off"}`} />
          {connected ? "Live" : "Offline"}
        </span>
        <div className="avatar">{initials}</div>
      </div>
    </div>
  );
}
