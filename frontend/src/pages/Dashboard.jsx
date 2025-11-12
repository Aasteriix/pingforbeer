import React, { useEffect, useState } from "react";
import { me, inbox, respond, friends, createPing } from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard(){
  const [user,setUser]=useState(null);
  const [items,setItems]=useState([]);
  const [title,setTitle]=useState("Beer?");
  const [location,setLocation]=useState("Local pub");
  const [startsAt,setStartsAt]=useState("");
  const navigate=useNavigate();

  useEffect(()=>{
    (async()=>{
      try{
        const u = await me();
        setUser(u);
        setItems(await inbox());
      }catch{
        navigate("/login");
      }
    })();
  },[]);

  if(!user) return null;

  return (
    <div style={{maxWidth:800, margin:"0 auto", padding:16}}>
      <header style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h1>🍻 Ping for Beer</h1>
        <button onClick={()=>{ localStorage.removeItem("token"); navigate("/login"); }}>
          Logout
        </button>
      </header>

      <div style={{marginBottom:16}}>Logged in as <b>{user.name}</b> ({user.email})</div>

      <h3>New Ping</h3>
      <div style={{display:"grid", gap:8, marginBottom:16}}>
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
        <input type="datetime-local" onChange={e=>setStartsAt(e.target.value)} />
        <button onClick={async ()=>{
          const fr = await friends();
          const invitee_ids = fr.map(f=>f.id); // demo: invite all friends
          const payload={title, location, starts_at:new Date(startsAt).toISOString(), invitee_ids};
          await createPing(payload);
          setItems(await inbox());
        }}>Send Ping</button>
      </div>

      <h3>Inbox</h3>
      <div style={{display:"grid", gap:8}}>
        {items.map(p=>(
          <div key={p.id} style={{padding:12, border:"1px solid #555", borderRadius:8}}>
            <div><b>{p.title}</b> • {new Date(p.starts_at).toLocaleString()} • {p.location}</div>
            <div>Invited: {p.invites.map(i=>`${i.user.name} (${i.status})`).join(", ")}</div>
            <div style={{display:"flex", gap:8, marginTop:8}}>
              <button onClick={async()=>{await respond(p.id,"declined"); setItems(await inbox());}}>No</button>
              <button onClick={async()=>{await respond(p.id,"maybe"); setItems(await inbox());}}>Maybe</button>
              <button onClick={async()=>{await respond(p.id,"accepted"); setItems(await inbox());}}>Yes</button>
              <a href={p.ics_public_url}>Add to calendar</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
