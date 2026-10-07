'use client';
import SiteSearch from './site-search';
import {AccessContext} from './access-context';
import type {AccessRole} from '@/lib/roles';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard,ClipboardList,FolderKanban,Users,ShieldCheck } from 'lucide-react';
const standardNavigation=[['/dashboard','Dashboard',LayoutDashboard],['/tasks','My Tasks',ClipboardList],['/projects','My Projects',FolderKanban],['/customers','Customers',Users]] as const;
export default function AppShellClient({children,title,isOwner,displayName,role}:{children:React.ReactNode;title:string;isOwner:boolean;displayName:string;role:AccessRole}){
 const baseNavigation=role==='customer'?standardNavigation.filter(([href])=>href!=='/customers'):standardNavigation;
 const navigation=isOwner?[...baseNavigation,['/access-history','Access History',ShieldCheck] as const]:baseNavigation;
 const path=usePathname();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function logout(){setBusy(true);setError('');try{const r=await fetch('/api/auth',{method:'DELETE'});if(!r.ok)throw Error('Could not log out. Please try again.');window.location.assign('/');}catch(e){setError(e instanceof Error?e.message:'Could not log out.');setBusy(false);}}
 return <AccessContext.Provider value={{role,isOwner}}><div className="app-shell table-layout"><header className="workspace-header"><div className="header-main"><a target="_self" className="brand" aria-label="HVS Program Management System" href="/dashboard"><img className="brand-logo" src="/hyvision-logo.png" alt="HyVISION logo"/><span className="site-brand-name">HyVISION | US<span className="brand-sub">{title}</span></span></a><SiteSearch/><div className="header-account"><span className="account-role">{isOwner?'Owner':role}</span><span className="account-avatar" aria-label={'Signed in as '+displayName} title={displayName}>{displayName.slice(0,1).toUpperCase()}</span><button className="secondary" onClick={logout} disabled={busy}>{busy?'Logging out…':'Log out'}</button></div></div><nav className="header-navigation" aria-label="Workspace pages">{navigation.map(([href,label,Icon])=>{const active=path===href||path.startsWith(href+'/');return <a target="_self" key={href} href={href} className={active?'active':''} aria-current={active?'page':undefined}><Icon size={17}/><span>{label}</span></a>})}</nav></header><main>{(role==='customer'||role==='executive')&&<div className="access-banner">Read-only access · {role==='customer'?'Only assigned projects and tasks are visible.':'Executive view'}</div>}{error&&<div className="content"><div className="error" role="alert">{error}</div></div>}{children}</main></div></AccessContext.Provider>;
}
