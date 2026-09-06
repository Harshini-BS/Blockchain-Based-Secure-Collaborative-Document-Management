export default function AuditTrail({ items }) {
  return (
    <div className="card">
      <div className="section-title">Blockchain Audit Trail</div>
      {items.length === 0 ? (
        <div style={{ color: "var(--text-dim)", fontSize: 12.5, padding: "8px 0" }}>
          Not connected yet — this panel lights up once the blockchain module (Solidity/Hardhat) is wired in.
        </div>
      ) : (
        <div className="panel-list">
          {items.map((a, i) => (
            <div key={i} className="audit-item">
              <div className="audit-icon">⛓</div>
              <div>
                <div className="audit-title">{a.title}</div>
                <div className="audit-meta">{a.time}</div>
                <div className="audit-tx">Tx: {a.tx}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
