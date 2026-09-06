import { useState } from "react";

export default function PromptDialog({ title, label, initialValue = "", confirmLabel = "Save", onSubmit, onCancel }) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            {label && <label>{label}</label>}
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!value.trim()}>{confirmLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
