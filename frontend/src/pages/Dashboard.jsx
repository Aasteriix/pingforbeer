// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { me, inbox, respond, friends, createPing, API_ORIGIN } from "../api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Dashboard(){
  const [user,setUser] = useState(null);
  const [items,setItems] = useState([]);
  const [myFriends,setMyFriends] = useState([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState("");

  // (optional) modal state if you re-enable inline create
  const [showNew,setShowNew] = useState(false);
  const [sending,setSending] = useState(false);

  // (modal form fields)
  const [title,setTitle] = useState("Set the vibe ✨");
  const [location,setLocation] = useState("Local spot");
  const [startsAt,setStartsAt] = useState("");

  const navigate = useNavigate();

  async function loadAll(){
    setLoading(true);
    try{
      const u = await me();
      setUser(u);
      const [data, fr] = await Promise.all([inbox(), friends()]);
      data.sort((a,b)=> new Date(a.starts_at) - new Date(b.starts_at));
      setItems(data);
      setMyFriends(fr);
      setErr("");
    }catch{
      navigate("/login");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ loadAll(); /* eslint-disable-next-line */ },[]);

  const pendingCount = useMemo(()=> {
    const myId = user?.id; if(!myId) return 0;
    let c=0;
    for(const p of items){
      const mine = p.invites.find(i => i.user.id === myId);
      if (mine && (mine.status === "pending" || mine.status === "maybe")) c++;
    }
    return c;
  }, [items, user]);

  const nextPing = useMemo(()=>{
    const future = items.filter(p=> new Date(p.starts_at) > new Date());
    return future.length ? future[0] : null;
  }, [items]);

  function localPickerToUTCISO(localStr){ return new Date(localStr).toISOString(); }
  const canSend = title.trim() && location.trim() && startsAt && !sending;

  async function submitNewPing(){
    if(!canSend) return;
    setSending(true);
    try{
      const invitee_ids = myFriends.map(f => f.id); // MVP: invite all friends
      await createPing({
        title: title.trim(),
        location: location.trim(),
        starts_at: localPickerToUTCISO(startsAt),
        invitee_ids
      });
      setShowNew(false);
      setStartsAt("");
      await loadAll();
    }catch(e){
      setErr(e?.message || "Failed to set the vibe");
    }finally{
      setSending(false);
    }
  }

  async function onRespond(id, status){
    try{
      await respond(id, status);
      await loadAll();
    }catch(e){
      setErr(e?.message || "Failed to respond");
    }
  }

  if(loading) return <div className="container shell">Loading…</div>;
  if(!user) return null;

  return (
    <div className="theme-purple">
      <Navbar
        onCreatePing={() => navigate("/create-ping")}
        onLogout={() => { localStorage.removeItem("token"); navigate("/login"); }}
      />

      <div className="container shell">
        <div className="kicker section">
          Logged in as <b>{user.name}</b> ({user.email})
        </div>

        {/* Overview cards */}
        <section className="cards section">
          <div className="card">
            <div className="card-title">Connections</div>
            <div className="card-value">{myFriends.length}</div>
            <div className="card-sub">Total</div>
          </div>
          <div className="card">
            <div className="card-title">Pending replies</div>
            <div className="card-value">{pendingCount}</div>
            <div className="card-sub">Needs your energy</div>
          </div>
          <div className="card">
            <div className="card-title">Next vibe</div>
            <div className="card-value">
              {nextPing ? new Date(nextPing.starts_at).toLocaleString() : "—"}
            </div>
            <div className="card-sub">
              {nextPing ? nextPing.title : "No upcoming vibes"}
            </div>
          </div>
        </section>

        {/* Upcoming list */}
        <section className="list section">
          <h3 className="section-title">Upcoming vibes</h3>
          {items.length === 0 && <div className="kicker">No vibes yet. Set the first one ✨</div>}
          {items.map(p=>(
            <div key={p.id} className="item">
              <div className="item-head" style={{width:"100%"}}>
                <div>
                  <b>{p.title}</b>{" "}
                  <span className="kicker">
                    • {new Date(p.starts_at).toLocaleString()} • {p.location}
                  </span>
                </div>
              </div>
              <div className="kicker" style={{marginTop:6}}>
                Invited: {p.invites.map(i=>`${i.user.name} (${i.status})`).join(", ")}
              </div>
              <div className="item-actions">
                <button className="btn ghost" onClick={()=>onRespond(p.id,"declined")}>No</button>
                <button className="btn secondary" onClick={()=>onRespond(p.id,"maybe")}>Maybe</button>
                <button className="btn" onClick={()=>onRespond(p.id,"accepted")}>Yes</button>
                <a
                  className="btn ghost"
                  href={`${API_ORIGIN}${p.ics_public_url}`}
                  target="_blank" rel="noreferrer"
                >
                  Add to calendar
                </a>
              </div>
            </div>
          ))}
        </section>

        {/* Optional inline “Set the Vibe” modal */}
        {showNew && (
          <div className="modal-overlay" onClick={()=>setShowNew(false)}>
            <div className="modal" onClick={(e)=>e.stopPropagation()}>
              <div className="modal-head">
                <h3 style={{margin:0}}>Set the vibe</h3>
                <button className="btn ghost" onClick={()=>setShowNew(false)}>✕</button>
              </div>
              <div className="inputs">
                <input
                  className="input"
                  placeholder="What's the vibe?"
                  value={title}
                  onChange={e=>setTitle(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Where?"
                  value={location}
                  onChange={e=>setLocation(e.target.value)}
                />
                <input
                  className="input"
                  type="datetime-local"
                  value={startsAt}
                  min={new Date(Date.now() - 60_000).toISOString().slice(0,16)}
                  onChange={e=>setStartsAt(e.target.value)}
                />
                <div className="kicker">Invites: all connections ({myFriends.length}).</div>
                {err && <div style={{color:"#ff6a6a"}}>{err}</div>}
                <div className="modal-actions">
                  <button className="btn secondary" onClick={()=>setShowNew(false)} disabled={sending}>Cancel</button>
                  <button className="btn" onClick={submitNewPing} disabled={!canSend}>
                    {sending ? "Setting the vibe…" : "Set the vibe"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
