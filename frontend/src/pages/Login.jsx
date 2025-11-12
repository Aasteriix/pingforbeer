import React, { useState } from "react";
import { login, setToken } from "../api";
import { Link } from "react-router-dom";

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");

  async function onSubmit(e){
    e.preventDefault();
    try{
      const r = await login(email, password);
      setToken(r.access_token);              // save token to localStorage
      window.location.href = "/dashboard";   // hard reload so token is applied
    }catch(e){
      setErr(e.message || "Login failed");
    }
  }

  return (
    <div style={wrap}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={form}>
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
        {err && <div style={{color:"red",whiteSpace:"pre-wrap"}}>{err}</div>}
      </form>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}

const wrap={maxWidth:360,margin:"80px auto",display:"grid",gap:12};
const form={display:"grid",gap:10};
