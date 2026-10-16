import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { getSocket } from "../../api/socket";
import { fetchActivity } from "../../api/client";

const ROLE_STYLE = {
  Owner: { background: "var(--accent-soft)", color: "var(--accent)" },
  Editor: { background: "#dcfce7", color: "#15803d" },
  Viewer: { background: "var(--surface-2)", color: "var(--text-dim)" },
};

function kindOf(action = "") {
  if (action.includes("saved")) return "save";
  if (action.includes("joined")) return "join";
  if (action.includes("left") || action.includes("offline")) return "leave";
  return "other";
}

const KIND_STYLE = {
  save: { color: "#16a34a", label: "💾" },
  join: { color: "#2563eb", label: "→" },
  leave: { color: "#94a3b8", label: "←" },
  other: { color: "#f59e0b", label: "•" },
};

function EventRow({ e }) {
  const k = KIND_STYLE[kindOf(e.action)];
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0" }}>
      <div
        style={{
          width: 24, height: 24, borderRadius: 12, flexShrink: 0,
          display: "grid", placeItems: "center", fontSize: 12,
          background: "var(--surface-2)", color: k.color,
        }}
      >
        {k.label}
      </div>
      <div style={{ fontSize: 13 }}>
        <strong>{e.who}</strong> {e.action}
        <div style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{e.time}</div>
      </div>
    </div>
  );
}

function DocCard({ group, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? group.events : group.events.slice(0, 4);
  const saves = group.events.filter((e) => kindOf(e.action) === "save").length;
  const roleStyle = ROLE_STYLE[group.role] || ROLE_STYLE.Viewer;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div
            onClick={onOpen}
            title="Open document"
            style={{ fontWeight: 600, fontSize: 14, cursor: "pointer", wordBreak: "break-word" }}
          >
            📄 {group.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
            {group.events.length} event{group.events.length !== 1 ? "s" : ""}
            {saves > 0 && ` · ${saves} save${saves !== 1 ? "s" : ""}`} · last {group.events[0].time}
          </div>
        </div>
        {group.role && (
          <span
            style={{
              ...roleStyle, fontSize: 11, fontWeight: 600,
              padding: "3px 9px", borderRadius: 999, flexShrink: 0,
            }}
          >
            {group.role}
          </span>
        )}
      </div>

      <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
        {shown.map((e, i) => (
          <EventRow key={i} e={e} />
        ))}
      </div>

      {group.events.length > 4 && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 6 }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : `Show ${group.events.length - 4} more`}
        </button>
      )}
    </div>
  );
}

export default function Activity() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [showPresence, setShowPresence] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivity()
      .then((list) => setItems(list.filter((a) => a.who && a.action)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const s = getSocket();
    if (!s.connected) s.connect();

    const subscribe = () => s.emit("feed:join");
    const onReady = (docs) =>
      setMeta(Object.fromEntries(docs.map((d) => [d.id, { name: d.name, role: d.role }])));
    const onActivity = (a) => setItems((prev) => [a, ...prev].slice(0, 200));

    s.on("connect", subscribe);
    s.on("feed:ready", onReady);
    s.on("doc:activity", onActivity);
    if (s.connected) subscribe();

    return () => {
      s.off("connect", subscribe);
      s.off("feed:ready", onReady);
      s.off("doc:activity", onActivity);
      s.emit("feed:leave");
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    for (const a of items) {
      const kind = kindOf(a.action);
      if (!showPresence && (kind === "join" || kind === "leave")) continue;
      if (!map.has(a.docId)) {
        map.set(a.docId, {
          id: a.docId,
          name: a.docName || meta[a.docId]?.name || "Untitled document",
          role: a.role || meta[a.docId]?.role,
          events: [],
        });
      }
      map.get(a.docId).events.push(a);
    }
    return [...map.values()];
  }, [items, meta, showPresence]);

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 12px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: 0 }}>Activity</h1>
        <label style={{ fontSize: 12.5, color: "var(--text-dim)", display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showPresence}
            onChange={(e) => setShowPresence(e.target.checked)}
          />
          Show joins &amp; leaves
        </label>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ padding: 24, color: "var(--text-dim)", fontSize: 13 }}>
          No activity yet. Saves and edits on documents you can access will appear here.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {groups.map((g) => (
            <DocCard key={g.id} group={g} onOpen={() => navigate(`/documents/${g.id}`)} />
          ))}
        </div>
      )}
    </Layout>
  );
}