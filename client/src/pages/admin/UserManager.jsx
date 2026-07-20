import { useCallback, useEffect, useState } from 'react';
import { getAdminUsers, updateAdminUser } from '../../api/adminApi';
import './AdminShared.css';
const money=n=>`₹${Number(n||0).toLocaleString('en-IN')}`;
export default function UserManager(){
 const [users,setUsers]=useState([]),[q,setQ]=useState(''),[role,setRole]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);try{setUsers((await getAdminUsers({q,role,limit:100})).users)}catch{setError('Could not load users.')}finally{setLoading(false)}},[q,role]);
 useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
 const patch=async(id,payload)=>{try{const {user}=await updateAdminUser(id,payload);setUsers(x=>x.map(u=>u._id===id?{...u,...user}:u))}catch(e){setError(e.response?.data?.message||'Could not update user.')}};
 return <div><div className="admin-header-row"><div><h1>Customers</h1><p className="admin-subtitle">Manage access and account roles.</p></div></div>{error&&<div className="error-banner">{error}</div>}
 <div className="admin-toolbar"><input placeholder="Search name or email…" value={q} onChange={e=>setQ(e.target.value)}/><select value={role} onChange={e=>setRole(e.target.value)}><option value="">All roles</option><option value="customer">Customers</option><option value="admin">Admins</option></select></div>
 {loading?<div className="empty-state">Loading users…</div>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Orders</th><th>Total spent</th><th>Joined</th><th>Access</th></tr></thead><tbody>{users.map(u=><tr key={u._id}><td><strong>{u.name}</strong><div className="order-manager-email">{u.email}</div></td><td><select value={u.role} onChange={e=>patch(u._id,{role:e.target.value})}><option value="customer">Customer</option><option value="admin">Admin</option></select></td><td>{u.orderCount}</td><td>{money(u.totalSpent)}</td><td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td><td><button className={`btn btn-sm ${u.isBlocked?'btn-primary':'btn-danger'}`} onClick={()=>patch(u._id,{isBlocked:!u.isBlocked})}>{u.isBlocked?'Unblock':'Block'}</button></td></tr>)}</tbody></table></div>}
 </div>
}
