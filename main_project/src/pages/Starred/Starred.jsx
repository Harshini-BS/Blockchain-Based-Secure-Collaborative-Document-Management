import Layout from "../../components/Layout";
import ComingSoon from "../../components/ComingSoon";

export default function Starred() {
  return (
    <Layout>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 12px" }}>Starred</h1>
      <ComingSoon
        title="Starred documents — not built yet"
        note="Pinning favorite documents for quick access isn't wired up yet. It's a small addition on top of the existing Document model whenever you're ready to add it."
      />
    </Layout>
  );
}
