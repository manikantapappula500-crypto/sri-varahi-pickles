
const API_URL=import.meta.env.VITE_API_URL||"https://sri-varahi-pickles.onrender.com";
export async function adminFetch(path,options={}){
 const token=localStorage.getItem("svp_admin_token");
 const res=await fetch(`${API_URL}/api/admin${path}`,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})}});
 const data=await res.json().catch(()=>({}));
 if(res.status===401){localStorage.removeItem("svp_admin_token");localStorage.removeItem("svp_admin");window.location.href="/admin/login";}
 if(!res.ok) throw new Error(data.message||"Request failed");
 return data;
}
export {API_URL};
