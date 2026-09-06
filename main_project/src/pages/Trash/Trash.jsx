import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import ConfirmDialog from "../../components/ConfirmDialog";
import { fetchTrash, restoreFromTrash, permanentlyDeleteDocument } from "../../api/client";

export default function Trash() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wipeTarget, setWipeTarget] = useState(null);

  async function refresh() {
    setDocuments(await fetchTrash());
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleRestore(doc) {
    await restoreFromTrash(doc.id);
    await refresh();
  }

  async function handleWipe() {
    await permanentlyDeleteDocument(wipeTarget.id);
    setWipeTarget(null);
    await refresh();
  }

  return (
    <Layout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 4px" }}>Trash</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 4px" }}>
        Deleted documents you own. Restore them, or delete permanently.
      </p>

      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>Loading…</div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>Trash is empty.</div>
      ) : (
        <div className="card">
          <table className="doc-table">
            <thead><tr><th>Name</th><th>Last Modified</th><th></th></tr></thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td><div className="doc-name">📄 {d.name}</div></td>
                  <td>{new Date(d.modified).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRestore(d)}>Restore</button>
                      <button className="btn btn-sm" style={{ background: "#dc2626", color: "white" }} onClick={() => setWipeTarget(d)}>
                        Delete forever
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {wipeTarget && (
        <ConfirmDialog
          title="Delete permanently?"
          message={`"${wipeTarget.name}" and all its versions will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete forever"
          danger
          onConfirm={handleWipe}
          onCancel={() => setWipeTarget(null)}
        />
      )}
    </Layout>
  );
}
