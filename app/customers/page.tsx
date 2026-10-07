import {redirect} from 'next/navigation';
import AppShell from '@/components/app-shell';
import CustomerWorkspace from '@/components/customer-workspace';
import { requireLogin } from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Customers(){const user=await requireLogin('/customers');if(user.role==='customer')redirect('/projects');return <AppShell title="Customers"><CustomerWorkspace/></AppShell>;}
