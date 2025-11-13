// src/pages/Friends.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../useAuth.jsx";
import Navbar from "../components/Navbar.jsx";
import {
  searchUsers,
  getIncomingRequests,
  getFriends,
  requestFriend,
  approveFriend,
  declineFriend,
  deleteFriend,
} from "../api";

export default function Friends() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const [tab, setTab] = useState("search"); // search | requests | friends
  const [loading, setLoading] = useState(false);

  const friendIds = useMemo(() => new Set(friends.map(f => f.id)), [friends]);

  async function refresh() {
    const [reqs, frs] = await Promise.all([
      getIncomingRequests(token),
      getFriends(token),
    ]);
    setIncoming(reqs);
    setFriends(frs);
  }

  useEffect(() => { if (token) refresh(); }, [token]);

  async function doSearch(e) {
    e?.preventDefault();
    if (!q.trim()) return setResults([]);
    setLoading(true);
    try {
      setResults(await searchUsers(token, q.trim()));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest(id) {
    await requestFriend(token, id);
    alert("Request sent ✨");
  }
  async function handleApprove(id) { await approveFriend(token, id); refresh(); }
  async function handleDecline(id) { await declineFriend(token, id); refresh(); }
  async function handleRemove(id) {
    if (!confirm("Remove this connection?")) return;
    await deleteFriend(token, id);
    refresh();
  }

  return (
    <>
      <Navbar />

      <div className="container shell section">
        <div className="header">
          <h1 className="brand">Find your people ✨ ✨</h1>
          <div className="header-actions">
            <button
              className={`btn ${tab==="search" ? "" : "ghost"}`}
              onClick={()=>setTab("search")}
            >
              Search
            </button>
            <button
              className={`btn ${tab==="requests" ? "" : "ghost"}`}
              onClick={()=>setTab("requests")}
            >
              Requests ({incoming.length})
            </button>
            <button
              className={`btn ${tab==="friends" ? "" : "ghost"}`}
              onClick={()=>setTab("friends")}
            >
              Connections ({friends.length})
            </button>
          </div>
        </div>

        {tab==="search" && (
          <form onSubmit={doSearch} className="section">
            <input
              className="input"
              placeholder="Search by name or email…"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
            <div style={{height:8}} />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </button>
            <div className="list" style={{marginTop:12}}>
              {results.map(u=>(
                <div key={u.id} className="item">
                  <div className="item-head">
                    <div>
                      <div className="card-value">{u.name}</div>
                      <div className="card-sub">{u.email}</div>
                    </div>
                    <div className="item-actions">
                      <a className="btn ghost" href={`/u/${u.id}`}>View profile</a>
                      <button
                        className="btn"
                        type="button"
                        disabled={friendIds.has(u.id)}
                        title={friendIds.has(u.id) ? "Already connected" : ""}
                        onClick={()=>handleRequest(u.id)}
                      >
                        {friendIds.has(u.id) ? "Connected" : "Connect"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </form>
        )}

        {tab==="requests" && (
          <div className="list section">
            {incoming.length===0 && (
              <div className="kicker">No incoming requests right now.</div>
            )}
            {incoming.map(u=>(
              <div key={u.id} className="item">
                <div className="item-head">
                  <div>
                    <div className="card-value">{u.name}</div>
                    <div className="card-sub">{u.email}</div>
                  </div>
                  <div className="item-actions">
                    <button className="btn" onClick={()=>handleApprove(u.id)} type="button">
                      Accept
                    </button>
                    <button className="btn secondary" onClick={()=>handleDecline(u.id)} type="button">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="friends" && (
          <div className="list section">
            {friends.length===0 && (
              <div className="kicker">You haven’t added any connections yet.</div>
            )}
            {friends.map(u=>(
              <div key={u.id} className="item">
                <div className="item-head">
                  <div>
                    <div className="card-value">{u.name}</div>
                    <div className="card-sub">{u.email}</div>
                  </div>
                  <div className="item-actions">
                    <a className="btn ghost" href={`/u/${u.id}`}>View profile</a>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={()=>handleRemove(u.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
