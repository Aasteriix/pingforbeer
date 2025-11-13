import React, { useState } from "react";
import { login, setToken } from "../api";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const r = await login(email, password);
      setToken(r.access_token);
      window.location.href = "/dashboard";
    } catch (e) {
      setErr(e.message || "Something went wrong. Try again.");
    }
  }

  return (
    <div style={wrap}>
      <h2 style={{ textAlign: "center" }}>✨ Welcome Back</h2>

      <form onSubmit={onSubmit} style={form}>
        <input
          placeholder="Your email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit">Enter Aura</button>

        {err && (
          <div style={{ color: "#ff6a6a", whiteSpace: "pre-wrap" }}>
            {err}
          </div>
        )}
      </form>

      <p style={{ textAlign: "center" }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}

const wrap = {
  maxWidth: 360,
  margin: "80px auto",
  display: "grid",
  gap: 12,
};

const form = {
  display: "grid",
  gap: 10,
};
