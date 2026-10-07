import {canEdit} from '@/lib/permissions';
import { z } from 'zod';
import { database } from '@/db/raw';
import { loggedIn,sameOrigin,randomToken,digest } from '@/lib/auth';
import { projectSchema } from '@/lib/project';
import { customerSchema } from '@/lib/customer';
import { noteSections,type TaskNote } from '@/lib/task-notes';
import type { SharedSnapshot } from '@/lib/shared-view';
export const dynamic='force-dynamic';
const inputSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('tasks')}),z.object({kind:z.literal('projects')}),
 z.object({kind:z.literal('minutes'),customerId:z.string().min(1).max(100)}),
 z.object({kind:z.literal('minute'),customerId:z.string().min(1).max(100),minuteId:z.string().min(1).max(100)}),
]);
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
 try{
  const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401});
  if(!canEdit(user))return Response.json({error:'Your role cannot create share links.'},{status:403});
  const parsed=inputSchema.safeParse(await req.json());if(!parsed.success)return Response.json({error:'Choose tasks, projects, or meeting minutes to share.'},{status:400});
  const input=parsed.data,db=database();let snapshot:SharedSnapshot;
  if(input.kind==='tasks'||input.kind==='projects'){
   const {results}=await db.prepare('SELECT id,data,revision FROM projects ORDER BY created_at DESC').all<{id:string;data:string;revision:number}>();
   const projects=results.map(r=>({...projectSchema.parse(JSON.parse(r.data)),id:r.id,revision:r.revision}));
   if(input.kind==='projects')snapshot={kind:'projects',projects};
   else{
    const {results:rows}=await db.prepare('SELECT kind,content,revision,updated_at FROM task_notes WHERE user_id=?').bind(user.userId).all<{kind:string;content:string;revision:number;updated_at:string}>();
    const notes=noteSections.map(([kind])=>{const row=rows.find(r=>r.kind===kind);return {kind,content:row?.content||'',revision:row?.revision||0,updatedAt:row?.updated_at||null} satisfies TaskNote;});
    const {results:updates}=await db.prepare('SELECT id,author,content,created_at AS createdAt FROM status_updates WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 200').bind(user.userId).all<{id:string;author:string;content:string;createdAt:number}>();
    snapshot={kind:'tasks',updates,taskProjects:projects.map(p=>({id:p.id,name:p.name,customer:p.customer,milestones:p.milestones})),tasks:projects.flatMap(p=>p.actions.map(a=>({...a,project:{id:p.id,name:p.name,customer:p.customer}}))),notes};
   }
  }else{
   const row=await db.prepare('SELECT data FROM customers WHERE id=?').bind(input.customerId).first<{data:string}>();
   if(!row)return Response.json({error:'Customer not found.'},{status:404});
   const customer=customerSchema.parse(JSON.parse(row.data)),minutes=input.kind==='minute'?customer.minutes.filter(m=>m.id===input.minuteId):customer.minutes;
   if(input.kind==='minute'&&!minutes.length)return Response.json({error:'Meeting minutes not found.'},{status:404});
   snapshot={kind:input.kind,customerName:customer.name,minutes};
  }
  const now=Date.now(),expiresAt=now+7*86400000,id=crypto.randomUUID(),token=randomToken();
  const serialized=JSON.stringify(snapshot);
  if(new TextEncoder().encode(serialized).byteLength>1500000)return Response.json({error:'This page is too large to share in one link.'},{status:413});
  await db.prepare('INSERT INTO shared_views (id,token_hash,created_by,kind,snapshot,created_at,expires_at) VALUES (?,?,?,?,?,?,?)').bind(id,await digest(token),user.userId,input.kind,serialized,now,expiresAt).run();
  return Response.json({id,url:new URL('/shared/'+token,req.url).toString(),expiresAt},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{console.error('Shared link unavailable');return Response.json({error:'Could not create a share link. Please try again.'},{status:503});}
}
export async function DELETE(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
 try{
  const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401});
  const input=z.object({id:z.string().uuid()}).safeParse(await req.json());if(!input.success)return Response.json({error:'Invalid share link.'},{status:400});
  const result=await database().prepare('UPDATE shared_views SET revoked=1 WHERE id=? AND created_by=?').bind(input.data.id,user.userId).run();
  if(!result.meta.changes)return Response.json({error:'Share link not found.'},{status:404});
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{console.error('Shared link revocation unavailable');return Response.json({error:'Could not revoke this link. Please try again.'},{status:503});}
}
