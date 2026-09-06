export default function StatsRow({ stats }) {
  return (
    <div className="stat-grid">
      {stats.map((s) => (
        <div key={s.label} className="card stat-card">
          <div>
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
            <div className="delta">{s.delta || "\u00A0"}</div>
          </div>
          <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>
            {s.glyph}
          </div>
        </div>
      ))}
    </div>
  );
}
