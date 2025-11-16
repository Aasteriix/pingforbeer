// src/pages/CreatePing.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { me, friends, createPing } from "../api";

const VIBE_OPTIONS = [
  { value: "DRINK", label: "🍻 Drink", defaultTitle: "Ping for a drink?" },
  { value: "COFFEE", label: "☕ Coffee", defaultTitle: "Coffee hang?" },
  { value: "DINNER", label: "🍽️ Dinner", defaultTitle: "Dinner tonight?" },
  { value: "WALK", label: "🚶 Walk", defaultTitle: "Walk & talk?" },
  { value: "GYM", label: "💪 Gym", defaultTitle: "Gym session?" },
  { value: "GAME", label: "🎮 Game night", defaultTitle: "Game night?" },
  { value: "STUDY", label: "📚 Study", defaultTitle: "Study session?" },
  { value: "CHILL", label: "🛋️ Chill", defaultTitle: "Just chill?" },
  { value: "CUSTOM", label: "✨ Custom vibe", defaultTitle: "" },
];

const WHEN_PRESETS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "day_after", label: "Day after" },
];

function combinePresetAndTime(preset, timeStr) {
  const now = new Date();
  const d = new Date(now);

  if (preset === "tomorrow") {
    d.setDate(d.getDate() + 1);
  } else if (preset === "day_after") {
    d.setDate(d.getDate() + 2);
  }

  const [h, m] = (timeStr || "18:00").split(":").map(Number);
  d.setHours(Number.isFinite(h) ? h : 18, Number.isFinite(m) ? m : 0, 0, 0);

  return d.toISOString();
}

function prettyWhenPreview(preset, timeStr) {
  const iso = combinePresetAndTime(preset, timeStr);
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreatePing() {
  const [user, setUser] = useState(null);
  const [myFriends, setMyFriends] = useState([]);
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [vibeType, setVibeType] = useState("DRINK");
  const [customTitle, setCustomTitle] = useState("");
  const [location, setLocation] = useState("Local spot");
  const [whenPreset, setWhenPreset] = useState("today");
  const [timeOfDay, setTimeOfDay] = useState("18:00");

  const [sending, setSending] = useState(false);

  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await me();
      setUser(u);
      const fr = await friends();
      setMyFriends(fr);
      // default: invite all friends, user can unselect
      setSelectedInvitees(fr.map((f) => f.id));
      setErr("");
    } catch (e) {
      console.error(e);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  function buildTitle() {
    const opt = VIBE_OPTIONS.find((o) => o.value === vibeType);
    if (vibeType === "CUSTOM") {
      return (customTitle || "Set the vibe ✨").trim();
    }
    const base = (opt?.defaultTitle || "Set the vibe ✨").trim();
    if (customTitle.trim()) {
      return `${base} – ${customTitle.trim()}`;
    }
    return base;
  }

  const title = buildTitle();
  const hasFriends = myFriends.length > 0;

  const canSend =
    !loading &&
    !sending &&
    hasFriends &&
    selectedInvitees.length > 0 &&
    location.trim() &&
    whenPreset &&
    timeOfDay &&
    (vibeType !== "CUSTOM" || customTitle.trim());

  function toggleInvite(id) {
    setSelectedInvitees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedInvitees(myFriends.map((f) => f.id));
  }

  function clearAll() {
    setSelectedInvitees([]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      await createPing({
        title,
        location: location.trim(),
        starts_at: combinePresetAndTime(whenPreset, timeOfDay),
        invitee_ids: selectedInvitees,
      });
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Failed to send aura");
    } finally {
      setSending(false);
    }
  }

  if (loading && !user) {
    return (
      <div className="theme-purple">
        <Navbar />
        <div className="container shell">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="theme-purple">
      <Navbar
        onCreatePing={() => {}}
        onLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

      <div className="container shell section">
        <h1 className="section-title">Set a new Aura</h1>
        <p className="kicker">
          Pick a vibe, a day (today / tomorrow / day after), a time and who to ping.
        </p>

        <form className="section" onSubmit={onSubmit}>
          {/* Vibe dropdown */}
          <label className="field">
            <div className="field-label">Vibe</div>
            <select
              className="input"
              value={vibeType}
              onChange={(e) => setVibeType(e.target.value)}
            >
              {VIBE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Message / custom vibe */}
          <label className="field">
            <div className="field-label">
              {vibeType === "CUSTOM"
                ? "Describe your vibe"
                : "Short message (optional)"}
            </div>
            <input
              className="input"
              placeholder={
                vibeType === "CUSTOM"
                  ? "e.g. Ping for beer at Andra Lång 🍻"
                  : "e.g. After work at Andra Lång 🍻"
              }
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
            <div className="kicker" style={{ marginTop: 4 }}>
              Final title preview: <b>{title}</b>
            </div>
          </label>

          {/* Location */}
          <label className="field">
            <div className="field-label">Location</div>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bar, café, park…"
            />
          </label>

          {/* When: day preset + time of day */}
          <div className="field">
            <div className="field-label">When</div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              {WHEN_PRESETS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  className={`btn ${whenPreset === w.value ? "" : "secondary"}`}
                  onClick={() => setWhenPreset(w.value)}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <div style={{ maxWidth: 220 }}>
              <label className="field">
                <div className="field-label">Time of day</div>
                <input
                  className="input"
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                />
              </label>
            </div>

            <div className="kicker" style={{ marginTop: 4 }}>
              We’ll schedule it for:{" "}
              <b>{prettyWhenPreview(whenPreset, timeOfDay)}</b>
            </div>
          </div>

          {/* Who to invite */}
          <div className="field" style={{ marginTop: 16 }}>
            <div className="field-label">Who to invite</div>

            {!hasFriends && (
              <div className="kicker">
                You don’t have any connections yet — add friends first.
              </div>
            )}

            {hasFriends && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    alignItems: "center",
                  }}
                >
                  <div className="kicker">
                    Selected {selectedInvitees.length} / {myFriends.length}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={selectAll}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={clearAll}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Tap-to-select grid (name only, with avatar & sparkle) */}
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                  }}
                >
                  {myFriends.map((f) => {
                    const active = selectedInvitees.includes(f.id);

                    return (
                      <div
                        key={f.id}
                        onClick={() => toggleInvite(f.id)}
                        style={{
                          cursor: "pointer",
                          padding: "14px 10px",
                          borderRadius: "14px",
                          border: active
                            ? "2px solid #b57bff"
                            : "2px solid rgba(255,255,255,0.1)",
                          background: active
                            ? "linear-gradient(135deg, #b57bff33, #ffffff10)"
                            : "rgba(255,255,255,0.02)",
                          transition: "0.18s",
                          textAlign: "center",
                          position: "relative",
                          userSelect: "none",
                        }}
                      >
                        {active && (
                          <div
                            style={{
                              position: "absolute",
                              top: "6px",
                              right: "6px",
                              fontSize: "18px",
                              opacity: 0.95,
                            }}
                          >
                            ✨
                          </div>
                        )}

                        {/* Avatar bubble with initial */}
                        <div
                          style={{
                            margin: "0 auto 8px auto",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: active ? "#b57bff" : "#ffffff15",
                            color: active ? "#fff" : "#ddd",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            transition: "0.2s",
                          }}
                        >
                          {f.name?.[0]?.toUpperCase() || "?"}
                        </div>

                        {/* Name only */}
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "15px",
                            color: active ? "#fff" : "#ddd",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {err && (
            <div style={{ color: "#ff6a6a", marginTop: 8 }}>{err}</div>
          )}

          <div
            className="modal-actions"
            style={{ marginTop: 16, display: "flex", gap: 8 }}
          >
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={!canSend}>
              {sending ? "Sending…" : "Send Aura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
