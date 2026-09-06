export default function ComingSoon({ title, note }) {
  return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🚧</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, margin: "0 0 6px" }}>{title}</h2>
      <p style={{ color: "var(--text-dim)", fontSize: 13, maxWidth: 420, margin: "0 auto" }}>{note}</p>
    </div>
  );
}
