import React, { useState } from "react";
import { registerAccount, setToken } from "../api";
import { Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const r = await registerAccount(email, name, password, "Europe/Stockholm");
      setToken(r.access_token);
      window.location.href = "/dashboard";
    } catch (e) {
      setErr(e.message || "Something went wrong. Try again.");
    }
  }

  return (
    <div style={wrap}>
      <h2 style={{ textAlign: "center" }}>✨ Create Your Aura</h2>

      <form onSubmit={onSubmit} style={form}>
        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          placeholder="Your email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          placeholder="Choose a password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit">Join Aura</button>

        {err && (
          <div style={{ color: "#ff6a6a", whiteSpace: "pre-wrap" }}>
            {err}
          </div>
        )}
      </form>

      <p style={{ textAlign: "center" }}>
        Already have an account? <Link to="/login">Log in</Link>
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
