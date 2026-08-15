
import React,{useEffect,useState} from "react";
import {adminFetch} from "./api";
export default function Dashboard(){
 const [d,setD]=useState(null);
 useEffect(()=>{adminFetch("/dashboard").then(setD).catch(console.error)},[]);
 if(!d)return <div className="admin-content"><h1 className="admin-title">Dashboard</h1><p>Loading...</p></div>;
 return <div className="admin-content"><h1 className="admin-title">Dashboard</h1><p className="admin-subtitle">Your shop at a glance.</p><div className="admin-grid"><div className="admin-card"><label>Today's Sales</label><strong>₹{Number(d.stats.todaySales).toLocaleString("en-IN")}</strong></div><div className="admin-card"><label>Total Orders</label><strong>{d.stats.orders}</strong></div><div className="admin-card"><label>Active Products</label><strong>{d.stats.products}</strong></div><div className="admin-card"><label>Customers</label><strong>{d.stats.customers}</strong></div></div><div className="admin-card"><h3>Low Stock</h3><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Weight</th><th>Stock</th><th>Price</th></tr></thead><tbody>{d.lowStock.map(x=><tr key={x.Id}><td>{x.Name}</td><td>{x.Weight}</td><td>{x.StockQuantity}</td><td>₹{Number(x.Price).toLocaleString("en-IN")}</td></tr>)}</tbody></table></div></div></div>
}
