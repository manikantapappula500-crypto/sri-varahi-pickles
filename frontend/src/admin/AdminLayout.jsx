
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout(){
  const nav=useNavigate();
  const admin=JSON.parse(localStorage.getItem("svp_admin")||"null");
  const logout=()=>{localStorage.removeItem("svp_admin");localStorage.removeItem("svp_admin_token");nav("/admin/login");};
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><strong>🌶 SRI VAARAHI</strong><span>PICKLES ADMIN</span></div>
      <nav className="admin-nav">
        <NavLink to="/admin"><span>📊 </span>Dashboard</NavLink>
        <NavLink to="/admin/products"><span>🫙 </span>Products</NavLink>
        <NavLink to="/admin/categories"><span>📂 </span>Categories</NavLink>
        <NavLink to="/admin/banners"><span>🖼 </span>Banners</NavLink>
        <NavLink to="/admin/orders"><span>🛒 </span>Orders</NavLink>
      </nav>
    </aside>
    <main className="admin-main">
      <header className="admin-top"><strong>Sri Vaarahi Shop Management</strong><span className="admin-user">{admin?.fullName||admin?.username||"Admin"} · <button className="admin-btn secondary" onClick={logout}>Logout</button></span></header>
      <Outlet/>
    </main>
  </div>
}
