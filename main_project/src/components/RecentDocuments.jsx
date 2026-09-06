export default function RecentDocuments({ documents, onOpen, onUpload, onDownload, onRename, onDelete, title = "Recent Documents", showUpload = true }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title">{title}</div>
        {showUpload && <button className="btn btn-primary btn-sm" onClick={onUpload}>+ Upload</button>}
      </div>
      {documents.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
          No documents here yet.
        </div>
      ) : (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Last Modified</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const canRename = doc.role === "Owner";
              const canDelete = doc.role === "Owner";
              return (
                <tr key={doc.id} onClick={() => onOpen(doc)}>
                  <td>
                    <div className="doc-name">📄 {doc.name}</div>
                  </td>
                  <td>{doc.owner}</td>
                  <td>{doc.modified}</td>
                  <td>
                    <span className="status-pill">🔒 {doc.status}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="icon-btn" title="Download" onClick={() => onDownload(doc)}>⬇</button>
                      {canRename && onRename && (
                        <button className="icon-btn" title="Rename" onClick={() => onRename(doc)}>✎</button>
                      )}
                      {canDelete && onDelete && (
                        <button className="icon-btn" title="Delete" onClick={() => onDelete(doc)}>🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
