import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import ShareModal from "../../components/ShareModal";
import { fetchDocuments, fetchAccessList, shareDocument, revokeAccess } from "../../api/client";

export default function AccessControl() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const [accessList, setAccessList] = useState([]);

  useEffect(() => {
    fetchDocuments()
      .then((docs) => setDocuments(docs.filter((d) => d.isOwner)))
      .finally(() => setLoading(false));
  }, []);

  async function openManage(doc) {
    setActiveDoc(doc);
    setAccessList(await fetchAccessList(doc.id));
  }

  async function handleAdd(email, role) {
    await shareDocument(activeDoc.id, email, role);
    setAccessList(await fetchAccessList(activeDoc.id));
  }

  async function handleRevoke(userId) {
    await revokeAccess(activeDoc.id, userId);
    setAccessList(await fetchAccessList(activeDoc.id));
  }

  return (
    <Layout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 4px" }}>Access Control</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 4px" }}>
        Manage who can view or edit documents you own.
      </p>

      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>Loading…</div>
      ) : documents.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>
          You don't own any documents yet — access control only applies to documents you own.
        </div>
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
                    <button className="btn btn-ghost btn-sm" onClick={() => openManage(d)}>Manage Access</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeDoc && (
        <ShareModal
          docName={activeDoc.name}
          accessList={accessList}
          onClose={() => setActiveDoc(null)}
          onAdd={handleAdd}
          onRevoke={handleRevoke}
        />
      )}
    </Layout>
  );
}
