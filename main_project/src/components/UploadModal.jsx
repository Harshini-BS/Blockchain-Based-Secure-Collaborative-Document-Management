import { useRef, useState } from "react";

export default function UploadModal({ onClose, onUpload, onCreateBlank, uploading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload Document</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div
          className="upload-drop"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {file ? `Selected: ${file.name}` : "Drag a file here, or click to browse"}
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 10 }}>
          The file is encrypted (AES-256) client-side before it ever reaches the server.
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
          disabled={!file || uploading}
          onClick={() => onUpload(file)}
        >
          {uploading ? "Encrypting & uploading…" : "Upload"}
        </button>

        {onCreateBlank && (
          <button
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            disabled={uploading}
            onClick={onCreateBlank}
          >
            Or start a blank text document
          </button>
        )}
      </div>
    </div>
  );
}
