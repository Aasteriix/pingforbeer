// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../useAuth.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, token } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}
