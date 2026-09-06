import Layout from "../../components/Layout";
import ComingSoon from "../../components/ComingSoon";

export default function Activity() {
  return (
    <Layout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 12px" }}>Activity</h1>
      <ComingSoon
        title="Not connected yet"
        note="Live activity feeds (who's editing, viewing, or commenting right now) come from the real-time collaboration server — that's your teammate's Socket.IO module. The frontend is already wired to listen for it in src/api/socket.js."
      />
    </Layout>
  );
}
