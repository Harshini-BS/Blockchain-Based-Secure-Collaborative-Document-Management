export default function VersionHistory({ versions, onRestore, restoring, actionLabel = "Restore" }) {
  return (
    <div className="card">
      <div className="section-title">Version History</div>
      {versions.length === 0 ? (
        <div style={{ color: "var(--text-dim)", fontSize: 12.5, padding: "8px 0" }}>
          Open a document to see its version history.
        </div>
      ) : (
        <div>
          {versions.map((v) => (
            <div key={v.version} className="version-item">
              <div className="version-marker">🧱</div>
              <div className="version-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div className="version-title">
                    Version {v.version} {v.current && <span className="current-pill">Current</span>}
                  </div>
                  <div className="version-meta">{v.date} by {v.by}</div>
                </div>
                {!v.current && (
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={restoring}
                    onClick={() => onRestore(v.version)}
                  >
                    {actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
