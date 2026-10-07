import AppShell from '@/components/app-shell';
import TaskWorkspace from '@/components/task-workspace';
import { requireLogin } from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Tasks(){await requireLogin('/tasks');return <AppShell title="My Tasks"><TaskWorkspace/></AppShell>;}
