import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import DocumentEditor from "../../components/DocumentEditor";
import CollaboratorsPanel from "../../components/CollaboratorsPanel";
import VersionHistory from "../../components/VersionHistory";
import AuditTrail from "../../components/AuditTrail";
import ShareModal from "../../components/ShareModal";
import PromptDialog from "../../components/PromptDialog";
import ConfirmDialog from "../../components/ConfirmDialog";

import {
  fetchDocument, fetchAccessList, fetchVersions, saveDocumentEdit,
  shareDocument, revokeAccess, renameDocument, deleteDocument, downloadDocumentFile,
} from "../../api/client";
import { joinDocument, leaveDocument, emitDocEdit } from "../../api/socket";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [accessList, setAccessList] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);
  const [previewSignal, setPreviewSignal] = useState(null); // version loaded but not yet saved
  const [shareOpen, setShareOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function load() {
    setError("");
    try {
      const [d, access, vers] = await Promise.all([
        fetchDocument(id),
        fetchAccessList(id),
        fetchVersions(id),
      ]);
      setDoc(d);
      setAccessList(access);
      setVersions(vers);
    } catch (err) {
      setError(err.message || "Couldn't load this document.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    setPreviewSignal(null);
    load();
    joinDocument(id, {});
    return () => leaveDocument(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // If we arrived here from the Version History page asking to preview a
  // specific version, load it in once the document + versions have arrived.
  useEffect(() => {
    const requestedVersion = location.state?.loadVersion;
    if (requestedVersion && versions.length > 0) {
      handleLoadVersion(requestedVersion);
      navigate(location.pathname, { replace: true, state: {} }); // don't re-trigger on refresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions]);

  async function handleSave(html) {
    setSaving(true);
    try {
      await saveDocumentEdit(id, { content: html });
      emitDocEdit(id, { content: html });
      setPreviewSignal(null); // it's genuinely saved now, no longer just a preview
      await load();
    } finally {
      setSaving(false);
    }
  }

  // Loads an old version's content into the editor for you to look at / keep
  // editing — nothing is written to the database yet. A version only gets
  // created when you actually click Save (or Discard to bail out).
  function handleLoadVersion(versionNo) {
    const v = versions.find((v) => v.version === versionNo);
    if (!v) return;
    setPreviewSignal({ content: v.content || "", nonce: Date.now(), versionNo });
  }

  async function handleShare(email, role) {
    await shareDocument(id, email, role);
    setAccessList(await fetchAccessList(id));
  }

  async function handleRevoke(userId) {
    await revokeAccess(id, userId);
    setAccessList(await fetchAccessList(id));
  }

  async function handleRename(name) {
    await renameDocument(id, name);
    setRenameOpen(false);
    await load();
  }

  async function handleDelete() {
    await deleteDocument(id);
    setDeleteOpen(false);
    navigate("/documents");
  }

  async function handleDownload() {
    if (doc) await downloadDocumentFile(doc.id, doc.name);
  }

  if (loading) {
    return (
      <Layout>
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>
          Loading document…
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ color: "#dc2626", fontSize: 13.5, marginBottom: 14 }}>{error}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/documents")}>Back to Documents</button>
        </div>
      </Layout>
    );
  }

  const canRename = doc.role === "Owner";
  const canDelete = doc.role === "Owner";

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleDownload}>⬇ Download</button>
          {canRename && <button className="btn btn-ghost btn-sm" onClick={() => setRenameOpen(true)}>✎ Rename</button>}
          {canDelete && <button className="btn btn-ghost btn-sm" onClick={() => setDeleteOpen(true)}>🗑 Delete</button>}
        </div>
      </div>

      <div className="content-grid">
        <DocumentEditor
          doc={doc}
          saving={saving}
          onSave={handleSave}
          onDownload={handleDownload}
          previewSignal={previewSignal}
          previewingVersion={previewSignal?.versionNo}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <VersionHistory versions={versions} onRestore={handleLoadVersion} actionLabel="Load" />
          <AuditTrail items={[]} />
        </div>
      </div>

      <CollaboratorsPanel
        collaborators={accessList}
        activity={[]}
        onShare={() => setShareOpen(true)}
        canShare={doc.role === "Owner"}
      />

      {shareOpen && (
        <ShareModal
          docName={doc.name}
          accessList={accessList}
          onClose={() => setShareOpen(false)}
          onAdd={handleShare}
          onRevoke={handleRevoke}
        />
      )}

      {renameOpen && (
        <PromptDialog
          title="Rename document"
          label="New name"
          initialValue={doc.name}
          confirmLabel="Rename"
          onSubmit={handleRename}
          onCancel={() => setRenameOpen(false)}
        />
      )}

      {deleteOpen && (
        <ConfirmDialog
          title="Delete document?"
          message={`"${doc.name}" will move to Trash. You can restore it from there later.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </Layout>
  );
}
