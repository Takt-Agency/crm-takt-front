import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { getMe } from "../utils/api";
import { canAccessModule, normalizeRole } from "../utils/accessControl";

function RoleBasedRoute({ children, allowedRoles, requiredPermission }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Vérification des permissions..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const userRole = normalizeRole(user.role);
  const normalizedAllowedRoles = (allowedRoles || []).map((role) => normalizeRole(role));

  const hasRoleAccess =
    !allowedRoles || normalizedAllowedRoles.includes(userRole);
  const hasPermissionAccess = requiredPermission
    ? canAccessModule(user, requiredPermission)
    : true;

  if (!hasRoleAccess || !hasPermissionAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleBasedRoute;
