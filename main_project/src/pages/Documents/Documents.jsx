import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import RecentDocuments from "../../components/RecentDocuments";
import UploadModal from "../../components/UploadModal";
import PromptDialog from "../../components/PromptDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import { fetchDocuments, uploadDocument, createTextDocument, renameDocument, deleteDocument, downloadDocumentFile } from "../../api/client";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs.map((d) => ({ ...d, modified: formatDate(d.modified) })));
    } catch (err) {
      setError(err.message || "Couldn't load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleUploadFile(file) {
    setUploading(true);
    setError("");
    try {
      await uploadDocument(file);
      setUploadOpen(false);
      await refresh();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateBlank(name) {
    setUploading(true);
    try {
      const created = await createTextDocument(name);
      setUploadOpen(false);
      navigate(`/documents/${created.id}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleRename(name) {
    await renameDocument(renameTarget.id, name);
    setRenameTarget(null);
    await refresh();
  }

  async function handleDelete() {
    await deleteDocument(deleteTarget.id);
    setDeleteTarget(null);
    await refresh();
  }

  const filtered = documents.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: 0 }}>Documents</h1>
        <div className="search-box" style={{ maxWidth: 280 }}>
          <span>🔍</span>
          <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>Loading…</div>
      ) : (
        <RecentDocuments
          documents={filtered}
          title="All Documents"
          onOpen={(doc) => navigate(`/documents/${doc.id}`)}
          onUpload={() => setUploadOpen(true)}
          onDownload={(doc) => downloadDocumentFile(doc.id, doc.name)}
          onRename={(doc) => setRenameTarget(doc)}
          onDelete={(doc) => setDeleteTarget(doc)}
        />
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUpload={handleUploadFile}
          onCreateBlank={() => { setUploadOpen(false); setCreateOpen(true); }}
          uploading={uploading}
        />
      )}

      {createOpen && (
        <PromptDialog
          title="New document"
          label="Document name"
          confirmLabel="Create"
          onSubmit={(name) => { setCreateOpen(false); handleCreateBlank(name); }}
          onCancel={() => setCreateOpen(false)}
        />
      )}

      {renameTarget && (
        <PromptDialog
          title="Rename document"
          label="New name"
          initialValue={renameTarget.name}
          confirmLabel="Rename"
          onSubmit={handleRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete document?"
          message={`"${deleteTarget.name}" will move to Trash. You can restore it later.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  );
}
