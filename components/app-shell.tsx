import { loggedIn } from '@/lib/auth';
import { isSiteOwner } from '@/lib/access-policy';
import AppShellClient from './app-shell-client';
export default async function AppShell({children,title}:{children:React.ReactNode;title:string}){
 const user=await loggedIn();
 return <AppShellClient title={title} role={user?.role||'executive'} isOwner={isSiteOwner(user?.userId,user?.username)} displayName={user?.displayName||'HVS'}>{children}</AppShellClient>;
}
