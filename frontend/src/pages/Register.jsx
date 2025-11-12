import React, { useState } from "react";
import { registerAccount, setToken } from "../api";
import { Link } from "react-router-dom";

export default function Register(){
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");

  async function onSubmit(e){
    e.preventDefault();
    try{
      const r = await registerAccount(email, name, password, "Europe/Stockholm");
      setToken(r.access_token);              // save token
      window.location.href = "/dashboard";   // hard reload
    }catch(e){
      setErr(e.message || "Registration failed");
    }
  }

  return (
    <div style={wrap}>
      <h2>Create account</h2>
      <form onSubmit={onSubmit} style={form}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Register</button>
        {err && <div style={{color:"red",whiteSpace:"pre-wrap"}}>{err}</div>}
      </form>
      <p>Already have an account? <Link to="/login">Back to login</Link></p>
    </div>
  );
}

const wrap={maxWidth:360,margin:"80px auto",display:"grid",gap:12};
const form={display:"grid",gap:10};
