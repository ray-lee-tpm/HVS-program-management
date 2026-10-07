import {z} from 'zod';
import {accessRoles} from '@/lib/roles';
import { loggedIn,sameOrigin,randomToken,digest } from '@/lib/auth';
import { isSiteOwner } from '@/lib/access-policy';
import { database } from '@/db/raw';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
 try{
  const user=await loggedIn();
  if(!user)return Response.json({error:'Please log in to continue.'},{status:401});
  if(!isSiteOwner(user.userId,user.username))return Response.json({error:'Only the owner can create invitations.'},{status:403});
  const input=z.object({role:z.enum(accessRoles).default('member')}).safeParse(req.headers.get('content-type')?.includes('application/json')?await req.json():{});if(!input.success)return Response.json({error:'Choose a valid invitation role.'},{status:400});
  const token=randomToken(),expiresAt=Date.now()+7*86400000;
  await database().batch([
   database().prepare('DELETE FROM invitations WHERE expires_at<=?').bind(Date.now()),
   database().prepare('INSERT INTO invitations (token_hash,created_by,expires_at,role) VALUES (?,?,?,?)').bind(await digest(token),user.userId,expiresAt,input.data.role)
  ]);
  const url=new URL('/',req.url);url.searchParams.set('invite',token);
  return Response.json({url:url.toString(),expiresAt},{headers:{'Cache-Control':'no-store'}});
 }catch{console.error('Invitation unavailable');return Response.json({error:'Could not create an invitation. Please try again.'},{status:503});}
}
