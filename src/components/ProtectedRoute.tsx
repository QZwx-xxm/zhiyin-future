import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { Role } from "../types";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactElement;
  roles?: Role[];
}) {
  const { isAuthenticated, role, loading } = useAppContext();

  if (loading) {
    return <div className="card">正在校验登录状态...</div>;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/dashboard"} replace />;
  }

  return children;
}
