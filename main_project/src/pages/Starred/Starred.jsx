import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { fetchStarred } from "../../api/client";

export default function Starred() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStarred()
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 12px" }}>Starred</h1>
      <div className="card">
        {loading && <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Loading…</div>}
        {!loading && docs.length === 0 && (
          <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
            No starred documents yet. Open a document and click ☆ Star.
          </div>
        )}
        <div className="panel-list">
          {docs.map((d) => (
            <div
              key={d.id}
              className="collab-row"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/documents/${d.id}`)}
            >
              <div>
                <div style={{ fontSize: 13.5 }}>★ {d.name}</div>
                <div className="role">
                  {d.role} · {new Date(d.modified).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}