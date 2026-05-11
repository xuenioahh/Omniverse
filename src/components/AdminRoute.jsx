import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function AdminRoute({ children }) {
  const { isLoadingAuth, authChecked, isAuthenticated, isAdmin, user } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin || user?.role !== "admin") {
    return <Navigate to="/profile" replace state={{ deniedAdminFor: user?.email || "" }} />;
  }

  return children;
}
