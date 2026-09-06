import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import TopBar from "../../components/TopBar";
import StatsRow from "../../components/StatsRow";
import RecentDocuments from "../../components/RecentDocuments";
import FeatureStrip from "../../components/FeatureStrip";
import UploadModal from "../../components/UploadModal";
import PromptDialog from "../../components/PromptDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { features } from "../../mockData";
import {
  fetchDashboardStats, fetchDocuments, uploadDocument, createTextDocument,
  renameDocument, deleteDocument, downloadDocumentFile,
} from "../../api/client";
import { getSocket } from "../../api/socket";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function refresh() {
    const [s, docs] = await Promise.all([fetchDashboardStats(), fetchDocuments()]);
    setStats(s);
    setDocuments(docs.map((d) => ({ ...d, modified: formatDate(d.modified) })));
  }

  useEffect(() => {
    setLoading(true);
    refresh().catch((err) => console.error(err)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.connect();
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  async function handleUploadFile(file) {
    setUploading(true);
    try {
      await uploadDocument(file);
      setUploadOpen(false);
      await refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateBlank(name) {
    setUploading(true);
    try {
      const created = await createTextDocument(name);
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

  const filtered = documents.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  return (
    <Layout>
      <TopBar connected={connected} query={query} onQueryChange={setQuery} user={user} />
      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-dim)" }}>Loading…</div>
      ) : (
        <>
          <StatsRow stats={stats} />
          <RecentDocuments
            documents={filtered}
            onOpen={(doc) => navigate(`/documents/${doc.id}`)}
            onUpload={() => setUploadOpen(true)}
            onDownload={(doc) => downloadDocumentFile(doc.id, doc.name)}
            onRename={(doc) => setRenameTarget(doc)}
            onDelete={(doc) => setDeleteTarget(doc)}
          />
          <FeatureStrip features={features} />
        </>
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
