import React, { useEffect, useState } from "react";
import { me, friends, createPing } from "../api";
import { useNavigate } from "react-router-dom";

export default function CreatePing() {
  const [user, setUser] = useState(null);
  const [myFriends, setMyFriends] = useState([]);
  const [title, setTitle] = useState("✨ Set the vibe?");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const u = await me();
        setUser(u);
        setMyFriends(await friends());
      } catch {
        navigate("/login");
      }
    })();
  }, [navigate]);

  async function submit() {
    if (!title.trim() || !location.trim() || !startsAt || selectedIds.length === 0) return;
    setSending(true);
    try {
      await createPing({
        title: title.trim(),
        location: location.trim(),
        starts_at: new Date(startsAt).toISOString(),
        invitee_ids: selectedIds,
        notes: notes.trim(),
      });
      navigate("/dashboard");
    } catch (e) {
      setErr(e.message || "Failed to send aura");
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="container shell">
      <header className="header section">
        <h1 className="brand">✨ Send an Aura</h1>
        <button className="btn secondary" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
      </header>

      <section className="section" style={{ width: "100%", maxWidth: 600 }}>
        <input
          className="input"
          placeholder="What's the vibe?"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="input"
          placeholder="Where are we meeting?"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <input
          className="input"
          type="datetime-local"
          value={startsAt}
          onChange={e => setStartsAt(e.target.value)}
          min={new Date(Date.now() - 60_000).toISOString().slice(0, 16)}
        />

        <textarea
          className="input"
          rows={3}
          placeholder="Add a note or mood for everyone (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ resize: "vertical" }}
        />

        <div className="card-title" style={{ marginTop: 10 }}>
          Choose who to share this vibe with
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))" }}>
          {myFriends.map(f => (
            <label
              key={f.id}
              className="friend-chip"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #2a2a40",
                borderRadius: 10,
                padding: "8px 10px",
                background: selectedIds.includes(f.id) ? "var(--purple-3)" : "#0f0f19",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(f.id)}
                onChange={e => {
                  const checked = e.target.checked;
                  setSelectedIds(prev =>
                    checked ? [...prev, f.id] : prev.filter(id => id !== f.id)
                  );
                }}
              />
              <span>{f.name}</span>
            </label>
          ))}
        </div>

        {err && <div style={{ color: "#ff6a6a", marginTop: 8 }}>{err}</div>}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={() => navigate("/dashboard")}>Cancel</button>
          <button className="btn" disabled={sending} onClick={submit}>
            {sending ? "Sending..." : "Send Aura"}
          </button>
        </div>
      </section>
    </div>
  );
}
