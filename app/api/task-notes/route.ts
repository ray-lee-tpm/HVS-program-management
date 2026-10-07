import {validAttachments} from '@/lib/collaboration';
import {canEdit} from '@/lib/permissions';
import { z } from 'zod';
import { loggedIn,sameOrigin } from '@/lib/auth';
import { database } from '@/db/raw';
import { noteSections,type TaskNote } from '@/lib/task-notes';
export const dynamic='force-dynamic';
export async function GET(){
 try{
 const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401});
 if(user.role==='customer')return Response.json({error:'Internal notes are restricted.'},{status:403});
 const {results}=await database().prepare('SELECT kind,content,revision,updated_at FROM task_notes WHERE user_id=?').bind(user.userId).all<{kind:string;content:string;revision:number;updated_at:string}>();
 return Response.json(noteSections.map(([kind])=>{const row=results.find(r=>r.kind===kind);return {kind,content:row?.content||'',revision:row?.revision||0,updatedAt:row?.updated_at||null} satisfies TaskNote;}),{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Task notes could not be loaded. Please try again.'},{status:503});}
}
const inputSchema=z.object({kind:z.enum(['results','goals','lessons','status']),content:z.string().max(20000),revision:z.number().int().min(0)});
export async function PUT(req:Request){
 try{
 const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401});
 if(!canEdit(user))return Response.json({error:'Your role has read-only access.'},{status:403});
 if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
 const parsed=inputSchema.safeParse(await req.json());if(!parsed.success)return Response.json({error:'Check the section and keep notes within 20,000 characters.'},{status:400});
 if(!await validAttachments(user,parsed.data.content,'notes',user.userId))return Response.json({error:'Check the notes and attachments.'},{status:400});
 const {kind,content,revision}=parsed.data,updatedAt=new Date().toISOString(),db=database();
 const result=revision===0?await db.prepare('INSERT OR IGNORE INTO task_notes (user_id,kind,content,revision,updated_at) VALUES (?,?,?,1,?)').bind(user.userId,kind,content,updatedAt).run():await db.prepare('UPDATE task_notes SET content=?,revision=revision+1,updated_at=? WHERE user_id=? AND kind=? AND revision=?').bind(content,updatedAt,user.userId,kind,revision).run();
 if(!result.meta.changes)return Response.json({error:'These notes changed in another window. Copy your changes, cancel, and refresh the notes before editing again.'},{status:409});
 return Response.json({kind,content,revision:revision+1,updatedAt},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Notes could not be saved. Your changes are still in the form.'},{status:503});}
}
