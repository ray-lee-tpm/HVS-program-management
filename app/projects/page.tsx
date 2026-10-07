import AppShell from '@/components/app-shell';
import ProjectWorkspace from '@/components/project-workspace';
import { requireLogin } from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Projects(){await requireLogin('/projects');return <AppShell title="My Projects"><ProjectWorkspace/></AppShell>;}
