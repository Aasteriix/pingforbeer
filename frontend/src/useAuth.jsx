// src/useAuth.jsx
import React, {createContext, useContext, useEffect, useState} from "react";
import { me, login as apiLogin, register as apiRegister, logout as apiLogout } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    let cancelled = false;
    async function fetchMe() {
      try {
        if (!token) { setUser(null); setLoading(false); return; }
        const u = await me(token);
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMe();
    return () => { cancelled = true; };
  }, [token]);

  const login = async (email, password) => {
    const { access_token } = await apiLogin(email, password);
    localStorage.setItem("token", access_token);
    setToken(access_token);
    return access_token;
  };

  const register = async (email, password) => {
    const res = await apiRegister(email, password);
    return res;
  };

  const logout = () => {
    apiLogout(); // optional, if you implemented it
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
