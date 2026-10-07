import {z} from 'zod';
import {database} from '@/db/raw';
import {loggedIn,sameOrigin} from '@/lib/auth';
import {canManageAccess} from '@/lib/permissions';
import {isSiteOwner} from '@/lib/access-policy';
import {accessRoles} from '@/lib/roles';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await loggedIn();if(!user)return Response.json({error:'Please log in.'},{status:401});if(!canManageAccess(user))return Response.json({error:'Only Raymond can manage account access.'},{status:403});
 const {results}=await database().prepare('SELECT user_id,username,role FROM accounts ORDER BY username').all<{user_id:string;username:string;role:string}>();return Response.json(results.map(a=>({id:a.user_id,username:a.username,role:isSiteOwner(a.user_id,a.username)?'admin':a.role,isOwner:isSiteOwner(a.user_id,a.username)})),{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Could not load account access.'},{status:503});}}
export async function PUT(req:Request){try{const user=await loggedIn();if(!user)return Response.json({error:'Please log in.'},{status:401});if(!sameOrigin(req)||!canManageAccess(user))return Response.json({error:'Only Raymond can manage account access.'},{status:403});
 const parsed=z.object({id:z.string().min(1).max(100),role:z.enum(accessRoles)}).safeParse(await req.json());if(!parsed.success)return Response.json({error:'Choose a valid account role.'},{status:400});
 const account=await database().prepare('SELECT username FROM accounts WHERE user_id=?').bind(parsed.data.id).first<{username:string}>();if(!account)return Response.json({error:'Account not found.'},{status:404});if(isSiteOwner(parsed.data.id,account.username))return Response.json({error:'The owner account always retains admin access.'},{status:403});
 await database().prepare('UPDATE accounts SET role=? WHERE user_id=?').bind(parsed.data.role,parsed.data.id).run();return Response.json({ok:true});
 }catch{return Response.json({error:'Could not save the access role.'},{status:503});}}

