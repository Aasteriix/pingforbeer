// src/components/Navbar.jsx
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar({ onCreatePing, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (to) => { setOpen(false); navigate(to); };

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
    <nav className="topbar">
      <button className="brand btn ghost" onClick={()=>go("/dashboard")}>🍻 Ping for Beer</button>

      {/* desktop links */}
      <div className="nav-links">
        <NavLink to="/dashboard" className={linkClass}>🏠 Dashboard</NavLink>
        <NavLink to="/create-ping" className={linkClass}>🍺 Create Ping</NavLink>
        <NavLink to="/friends" className={linkClass}>👥 Friends</NavLink>
      </div>

      {/* right actions (desktop) */}
      <div className="actions">
        <button className="btn" onClick={onCreatePing}>🍺 Ping For Beer!</button>
        <button className="btn secondary" onClick={onLogout}>Logout</button>
      </div>

      {/* mobile hamburger */}
      <button className="hamburger btn ghost" onClick={()=>setOpen(v=>!v)} aria-label="Menu">☰</button>

      {/* mobile dropdown */}
      {open && (
        <div className="dropdown">
          <button className="drop-item" onClick={()=>go("/dashboard")}>🏠 Dashboard</button>
          <button className="drop-item" onClick={()=>go("/create-ping")}>🍺 Create Ping</button>
          <button className="drop-item" onClick={()=>go("/friends")}>👥 Friends</button>
          <hr className="drop-sep" />
          <button className="drop-item" onClick={()=>{ setOpen(false); onCreatePing(); }}>Ping For Beer!</button>
          <button className="drop-item danger" onClick={()=>{ setOpen(false); onLogout(); }}>Logout</button>
        </div>
      )}
    </nav>
  );
}
