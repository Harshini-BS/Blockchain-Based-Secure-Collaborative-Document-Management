import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import VersionHistory from "../../components/VersionHistory";
import { fetchDocuments, fetchDocument, fetchVersions } from "../../api/client";

export default function VersionHistoryPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const [currentDoc, setCurrentDoc] = useState(null); // full doc, for the content preview
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    fetchDocuments().then(setDocuments).finally(() => setLoading(false));
  }, []);

  async function select(doc) {
    setActiveDoc(doc);
    const [vers, full] = await Promise.all([fetchVersions(doc.id), fetchDocument(doc.id)]);
    setVersions(vers);
    setCurrentDoc(full);
  }

  // No commit happens here — this hands off to the real editor, which loads
  // that version as a preview. Nothing is saved until you click Save there.
  function handleOpenVersion(versionNo) {
    navigate(`/documents/${activeDoc.id}`, { state: { loadVersion: versionNo } });
  }

  return (
    <Layout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 4px" }}>Version History</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 4px" }}>
        Pick a document to see every saved version, with SHA-256 fingerprints. Opening an old version previews
        it in the editor — nothing changes until you save it there.
      </p>

      <div className="content-grid">
        <div className="card">
          <div className="section-title">Documents</div>
          {loading ? (
            <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Loading…</div>
          ) : documents.length === 0 ? (
            <div style={{ color: "var(--text-dim)", fontSize: 13 }}>No documents yet.</div>
          ) : (
            <div className="panel-list">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="collab-row"
                  style={{ cursor: "pointer", opacity: activeDoc?.id === d.id ? 1 : 0.85 }}
                  onClick={() => select(d)}
                >
                  <div className="who">📄 {d.name}</div>
                  {activeDoc?.id === d.id && <span className="status-pill">Selected</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {activeDoc ? (
          <VersionHistory versions={versions} onRestore={handleOpenVersion} actionLabel="Open in editor" />
        ) : (
          <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
            Select a document on the left to see its version history.
          </div>
        )}
      </div>

      {activeDoc && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div className="section-title" style={{ margin: 0 }}>
              Current content — Version {currentDoc?.currentVersion?.versionNo ?? "…"}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/documents/${activeDoc.id}`)}>
              Open full editor →
            </button>
          </div>
          {currentDoc?.hasTextContent ? (
            <div
              className="editor-body"
              style={{ padding: 0, minHeight: "auto" }}
              dangerouslySetInnerHTML={{ __html: currentDoc.currentVersion?.content || "<em>Empty document.</em>" }}
            />
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
              This is a binary file — no text content to preview here.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
