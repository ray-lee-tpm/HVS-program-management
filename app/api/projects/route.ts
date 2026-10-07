import {validAttachments} from '@/lib/collaboration';
import {canEdit,canManageRoster,canViewProject} from '@/lib/permissions';
import { loggedIn,sameOrigin } from '@/lib/auth';
import { z } from 'zod';
import { database } from '@/db/raw';
import { blockedTaskChange } from '@/lib/task-dependencies';
import { projectSchema } from '@/lib/project';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401,headers:{'Cache-Control':'no-store'}});
    const id=new URL(req.url).searchParams.get('id');
    if(id){
      const row=await database().prepare('SELECT id, data, revision FROM projects WHERE id=?').bind(id).first<{id:string;data:string;revision:number}>();
      if(!row)return Response.json({error:'Project not found. Return to the dashboard to open another project.'},{status:404});
      const project={...projectSchema.parse(JSON.parse(row.data)),id:row.id,revision:row.revision};
      if(!canViewProject(user,project))return Response.json({error:'Project not found.'},{status:404});
      return Response.json([project],{headers:{'Cache-Control':'no-store'}});
    }
    const {results} = await database().prepare('SELECT id, data, revision FROM projects ORDER BY created_at DESC').all<{id:string;data:string;revision:number}>();
    return Response.json(results.map(r=>({...projectSchema.parse(JSON.parse(r.data)),id:r.id,revision:r.revision})).filter(p=>canViewProject(user,p)), {headers:{'Cache-Control':'no-store'}});
  } catch(e) {console.error(e);return Response.json({error:'Projects could not be loaded. Please try again.'},{status:503});}
}
export async function POST(req: Request) {
  try {
    const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401,headers:{'Cache-Control':'no-store'}});
    if(!canEdit(user))return Response.json({error:'Your role has read-only access.'},{status:403});
    if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
    const input = await req.json();
    const parsed = projectSchema.safeParse(input);
    if(!parsed.success) return Response.json({error:'Check the project fields and dates.'},{status:400});
    if(!canManageRoster(user)&&parsed.data.roster.length)return Response.json({error:'Only an admin can assign the roster.'},{status:403});
    if(parsed.data.actions.some(a=>a.notes))return Response.json({error:'Save the project first, then add task details.'},{status:400});
    if(blockedTaskChange(parsed.data.actions))return Response.json({error:'Complete the predecessor before advancing a task marked Wait for Predecessor.'},{status:400});
    const id=crypto.randomUUID();
    await database().prepare('INSERT INTO projects (id,data,revision,created_at) VALUES (?,?,1,?)').bind(id,JSON.stringify(parsed.data),new Date().toISOString()).run();
    return Response.json({...parsed.data,id,revision:1},{status:201});
  }catch(e){console.error(e);return Response.json({error:'Project could not be saved. Your entries are still here.'},{status:503});}
}
export async function PUT(req: Request) {
  try {
    const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401,headers:{'Cache-Control':'no-store'}});
    if(!canEdit(user))return Response.json({error:'Your role has read-only access.'},{status:403});
    if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
    const raw=await req.json();const identity=z.object({id:z.string(),revision:z.number().int()}).safeParse(raw);const parsed=projectSchema.safeParse(raw);
    if(!parsed.success || !identity.success) return Response.json({error:'Check the project fields and dates.'},{status:400});
    for(const a of parsed.data.actions)if(!await validAttachments(user,a.notes,'project',identity.data.id))return Response.json({error:'Check task details and attachments.'},{status:400});
    const existing=await database().prepare('SELECT data FROM projects WHERE id=?').bind(identity.data.id).first<{data:string}>();
    if(existing&&JSON.stringify(parsed.data.roster)!==JSON.stringify(projectSchema.parse(JSON.parse(existing.data)).roster))return Response.json({error:'Use the Roster button to change team assignments.'},{status:403});
    if(existing&&blockedTaskChange(parsed.data.actions,projectSchema.parse(JSON.parse(existing.data)).actions))return Response.json({error:'Complete the predecessor before advancing a task marked Wait for Predecessor.'},{status:400});
    const result=await database().prepare('UPDATE projects SET data=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(parsed.data),identity.data.id,identity.data.revision).run();
    if(!result.meta.changes) return Response.json({error:'This project has changed since you opened it. Close the form and refresh the dashboard before editing again.'},{status:409});
    return Response.json({...parsed.data,id:identity.data.id,revision:identity.data.revision+1});
  }catch(e){console.error(e);return Response.json({error:'Changes could not be saved. Your entries are still here.'},{status:503});}
}
