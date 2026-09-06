import { useEffect, useRef, useState } from "react";

const TOOLBAR = [
  { label: "B", command: "bold" },
  { label: "I", command: "italic" },
  { label: "U", command: "underline" },
  { label: "•", command: "insertUnorderedList" },
  { label: "1.", command: "insertOrderedList" },
  { label: "❝", command: "quote" },
];

export default function DocumentEditor({ doc, saving, onSave, onDownload, previewSignal, previewingVersion }) {
  const bodyRef = useRef(null);
  const [dirty, setDirty] = useState(false);
  const canEdit = doc && doc.role !== "Viewer";

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = doc?.currentVersion?.content || "";
    }
    setDirty(false);
  }, [doc?.id, doc?.currentVersion?.versionNo]);

  useEffect(() => {
    if (!previewSignal) return;
    if (bodyRef.current) bodyRef.current.innerHTML = previewSignal.content || "";
    setDirty(true);
  }, [previewSignal?.nonce]);

  function handleInput() {
    setDirty(true);
  }

  function handleSave() {
    onSave(bodyRef.current?.innerHTML ?? "");
    setDirty(false);
  }

  function handleDiscard() {
    if (bodyRef.current) bodyRef.current.innerHTML = doc?.currentVersion?.content || "";
    setDirty(false);
  }

  function runCommand(command) {
    bodyRef.current?.focus();
    if (command === "quote") {
      document.execCommand("formatBlock", false, "blockquote");
    } else {
      document.execCommand(command, false);
    }
    setDirty(true);
  }

  if (!doc) {
    return (
      <div className="editor-shell" style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>
        Select a document to open it here, or upload a new one.
      </div>
    );
  }

  if (!doc.hasTextContent) {
    return (
      <div className="editor-shell" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>📄 {doc.name}</div>
        <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 18 }}>
          No editable text could be extracted from this file (e.g. an image, zip, or scanned PDF) — download it to view the contents.
        </div>
        <button className="btn btn-primary btn-sm" onClick={onDownload}>⬇ Download</button>
      </div>
    );
  }

  return (
    <div className="editor-shell">
      <div className="editor-header">
        <div className="title">📄 {doc.name} <span className="status-pill">🔒 Encrypted</span></div>
        {canEdit && (
          <div style={{ display: "flex", gap: 8 }}>
            {dirty && (
              <button className="btn btn-ghost btn-sm" onClick={handleDiscard} disabled={saving}>
                Discard
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        )}
      </div>

      {previewingVersion && (
        <div style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12.5, padding: "8px 18px" }}>
          Previewing Version {previewingVersion} — this isn't saved yet. Click <strong>Save changes</strong> to make it
          the new current version, or <strong>Discard</strong> to go back to what's actually live.
        </div>
      )}

      {!previewingVersion && doc.isExtractedFromFile && canEdit && (
        <div style={{ background: "var(--surface-2)", color: "var(--text-dim)", fontSize: 12.5, padding: "8px 18px", borderBottom: "1px solid var(--border)" }}>
          This is text extracted from your uploaded file, shown for editing. The original file is still safely
          downloadable exactly as uploaded — saving an edit here creates a new SecureDoc text version, it doesn't
          modify the original.
        </div>
      )}

      {canEdit && (
        <div className="toolbar">
          {TOOLBAR.map((t) => (
            <button key={t.label} onClick={() => runCommand(t.command)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="editor-body"
        ref={bodyRef}
        contentEditable={canEdit}
        suppressContentEditableWarning
        onInput={handleInput}
      />

      <div className="editor-footer">
        <span>Version {doc.currentVersion?.versionNo ?? 1} · {doc.role}</span>
        <span>{saving ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}</span>
      </div>
    </div>
  );
}