import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Documents from "../pages/Documents/Documents";
import DocumentDetails from "../pages/DocumentDetails/DocumentDetails";
import Shared from "../pages/Shared/Shared";
import Starred from "../pages/Starred/Starred";
import Activity from "../pages/Activity/Activity";
import AccessControl from "../pages/AccessControl/AccessControl";
import VersionHistoryPage from "../pages/VersionHistoryPage/VersionHistoryPage";
import Trash from "../pages/Trash/Trash";
import Profile from "../pages/Profile/Profile";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function wrap(Component) {
  return (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={wrap(Dashboard)} />
      <Route path="/documents" element={wrap(Documents)} />
      <Route path="/documents/:id" element={wrap(DocumentDetails)} />
      <Route path="/shared" element={wrap(Shared)} />
      <Route path="/starred" element={wrap(Starred)} />
      <Route path="/activity" element={wrap(Activity)} />
      <Route path="/access-control" element={wrap(AccessControl)} />
      <Route path="/version-history" element={wrap(VersionHistoryPage)} />
      <Route path="/trash" element={wrap(Trash)} />
      <Route path="/profile" element={wrap(Profile)} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
