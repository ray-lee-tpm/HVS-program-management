import AppShell from '@/components/app-shell';
import ProjectWorkspace from '@/components/project-workspace';
import { requireLogin } from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function ProjectPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 return <ProtectedProject id={id}/>;
}
async function ProtectedProject({id}:{id:string}){
 await requireLogin('/projects/'+id);
 return <AppShell title="Project details"><ProjectWorkspace projectId={id}/></AppShell>;
}
