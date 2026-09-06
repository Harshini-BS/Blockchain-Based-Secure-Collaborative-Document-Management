function initialsOf(name = "") {
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function CollaboratorsPanel({ collaborators, activity, onShare, canShare = true }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="section-title">Collaborators ({collaborators.length})</div>
          {canShare && <button className="btn btn-ghost btn-sm" onClick={onShare}>Share</button>}
        </div>
        <div className="panel-list">
          {collaborators.length === 0 && (
            <div style={{ color: "var(--text-dim)", fontSize: 12.5 }}>Open a document to see who has access.</div>
          )}
          {collaborators.map((c) => (
            <div key={c.id || c.email} className="collab-row">
              <div className="who">
                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{c.initials || initialsOf(c.name)}</div>
                <div>
                  <div style={{ fontSize: 13 }}>{c.name}</div>
                  <div className="role">{c.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Live Activity</div>
        <div className="panel-list">
          {activity.length === 0 && (
            <div style={{ color: "var(--text-dim)", fontSize: 12.5 }}>
              No live activity yet — this feeds from the real-time collaboration server.
            </div>
          )}
          {activity.map((a, i) => (
            <div key={i} className="activity-row">
              <div className="dot">●</div>
              <div>
                <div><strong>{a.who}</strong> {a.action}</div>
                <div className="time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
