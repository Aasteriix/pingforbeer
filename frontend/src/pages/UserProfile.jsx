// src/pages/UserProfile.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { getUser, requestFriend } from "../api";
import { useAuth } from "../useAuth.jsx";

export default function UserProfile() {
  const { id } = useParams();
  const { token, me } = useAuth();
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setUser(await getUser(token, id));
      } catch (e) {
        setErr(e?.message || "Failed to load user");
      }
    })();
  }, [id, token]);

  if (err) return <div className="container shell section">{err}</div>;
  if (!user) return <div className="container shell section">Loading…</div>;

  const isMe = me && me.id === user.id;

  return (
    <>
      <Navbar />
      <div className="container shell section">
        <div className="header">
          <h1 className="brand">{user.name}</h1>
          <div className="header-actions">
            <Link className="btn ghost" to="/friends">← Back to connections</Link>
            {!isMe && (
              <button
                className="btn"
                onClick={async () => {
                  await requestFriend(token, user.id);
                  alert("Connection request sent ✨");
                }}
              >
                Connect
              </button>
            )}
          </div>
        </div>

        <div className="cards section">
          <div className="card">
            <div className="card-title">Email</div>
            <div className="card-value">{user.email}</div>
          </div>
          <div className="card">
            <div className="card-title">Timezone</div>
            <div className="card-value">{user.timezone || "—"}</div>
          </div>
        </div>
      </div>
    </>
  );
}
