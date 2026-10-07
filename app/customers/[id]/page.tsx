import {redirect} from 'next/navigation';
import AppShell from '@/components/app-shell';
import CustomerWorkspace from '@/components/customer-workspace';
import { requireLogin } from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function CustomerPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProtectedCustomer id={id}/>;}
async function ProtectedCustomer({id}:{id:string}){const user=await requireLogin('/customers/'+id);if(user.role==='customer')redirect('/projects');return <AppShell title="Customer details"><CustomerWorkspace customerId={id}/></AppShell>;}
