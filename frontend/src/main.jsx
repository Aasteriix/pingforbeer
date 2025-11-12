// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import "./styles/theme.css";
import CreatePing from "./pages/CreatePing.jsx";
import Friends from "./pages/Friends.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import { AuthProvider } from "./useAuth.jsx";

function NotFound() {
  return <div style={{ padding: 24 }}>404 – Not found</div>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />

          {/* protected */}
          <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/create-ping" element={<ProtectedRoute><CreatePing/></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends/></ProtectedRoute>} />
          <Route path="/u/:id" element={<ProtectedRoute><UserProfile/></ProtectedRoute>} />

          {/* fallback */}
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
