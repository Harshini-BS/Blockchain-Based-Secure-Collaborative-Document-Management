import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import RecentDocuments from "../../components/RecentDocuments";
import { fetchDocuments, downloadDocumentFile } from "../../api/client";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Shared() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments()
      .then((docs) => setDocuments(docs.filter((d) => !d.isOwner).map((d) => ({ ...d, modified: formatDate(d.modified) }))))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 4px" }}>Shared With Me</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 4px" }}>
        Documents someone else owns but shared with you as Editor or Viewer.
      </p>
      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>Loading…</div>
      ) : (
        <RecentDocuments
          documents={documents}
          title="Shared With Me"
          showUpload={false}
          onOpen={(doc) => navigate(`/documents/${doc.id}`)}
          onDownload={(doc) => downloadDocumentFile(doc.id, doc.name)}
        />
      )}
    </Layout>
  );
}
