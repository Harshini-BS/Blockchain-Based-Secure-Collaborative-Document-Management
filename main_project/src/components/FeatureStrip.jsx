export default function FeatureStrip({ features }) {
  return (
    <div className="feature-strip">
      {features.map((f) => (
        <div key={f.title} className="card feature-card">
          <div className="glyph" style={{ background: `${f.color}22`, color: f.color }}>{f.glyph}</div>
          <h4>{f.title}</h4>
          <p>{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
