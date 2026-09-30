import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", fontSize: "1.2rem", color: "#64748b" }}>
        Loading account...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect user to their own role dashboard if unauthorized for this route
    if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === "owner") return <Navigate to="/owner/dashboard" replace />;
    if (user?.role === "agency") return <Navigate to="/agency/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
