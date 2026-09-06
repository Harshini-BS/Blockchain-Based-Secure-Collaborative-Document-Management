
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="main-column">{children}</div>
    </div>
  );
}
