import {canViewProject} from '@/lib/permissions';
import { requireLogin } from '@/lib/auth';
import { database } from '@/db/raw';
import AppShell from '@/components/app-shell';
import DashboardOverview from '@/components/dashboard-overview';
import { projectSchema,type Project } from '@/lib/project';
import { customerSchema,type Customer } from '@/lib/customer';
export const dynamic='force-dynamic';
export default async function Dashboard(){
 const user=await requireLogin('/dashboard');let projects:Project[]=[],customers:Customer[]=[],unavailable=false;
 try{
 const [p,c]=await Promise.all([database().prepare('SELECT id,data,revision FROM projects ORDER BY created_at DESC').all<{id:string;data:string;revision:number}>(),database().prepare('SELECT id,data,revision FROM customers').all<{id:string;data:string;revision:number}>()]);
 projects=p.results.map(r=>({...projectSchema.parse(JSON.parse(r.data)),id:r.id,revision:r.revision})).filter(p=>canViewProject(user,p));
 customers=user.role==='customer'?[]:c.results.map(r=>({...customerSchema.parse(JSON.parse(r.data)),id:r.id,revision:r.revision}));
 }catch{console.error('Dashboard data unavailable');unavailable=true;}
 return <AppShell title="Dashboard"><DashboardOverview projects={projects} customers={customers} unavailable={unavailable}/></AppShell>;
}
