
import React,{useState} from "react";
import {useNavigate} from "react-router-dom";
import {adminFetch} from "./api";
import "./AdminLayout.css";
export default function Login(){
 const [username,setUsername]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),nav=useNavigate();
 const submit=async e=>{e.preventDefault();setBusy(true);setError("");try{const d=await adminFetch("/login",{method:"POST",body:JSON.stringify({username,password})});localStorage.setItem("svp_admin_token",d.token);localStorage.setItem("svp_admin",JSON.stringify(d.admin));nav("/admin");}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className="admin-login"><form className="admin-login-box" onSubmit={submit}><h1>🌶 Sri Vaarahi</h1><p>Shop Owner Admin Login</p>{error&&<div className="admin-alert">{error}</div>}<div className="admin-field"><label>Username</label><input className="admin-input" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/></div><div className="admin-field"><label>Password</label><input type="password" className="admin-input" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></div><button className="admin-btn" disabled={busy}>{busy?"Signing in...":"Sign In"}</button></form></div>
}
