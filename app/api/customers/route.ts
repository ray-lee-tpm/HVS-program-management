import {validAttachments} from '@/lib/collaboration';
import {canEdit} from '@/lib/permissions';
import { z } from 'zod';
import { database } from '@/db/raw';
import { loggedIn,sameOrigin } from '@/lib/auth';
import { customerSchema } from '@/lib/customer';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 try{
 const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401});
 if(user.role==='customer')return Response.json({error:'The customer directory is restricted to internal users.'},{status:403});
 const id=new URL(req.url).searchParams.get('id');
 if(id){const r=await database().prepare('SELECT id,data,revision FROM customers WHERE id=?').bind(id).first<{id:string;data:string;revision:number}>();if(!r)return Response.json({error:'Customer not found. Return to Customers to open another record.'},{status:404});return Response.json({...JSON.parse(r.data),id:r.id,revision:r.revision},{headers:{'Cache-Control':'no-store'}});}
 const {results}=await database().prepare('SELECT id,data,revision FROM customers ORDER BY name_key').all<{id:string;data:string;revision:number}>();
 return Response.json(results.map(r=>({...JSON.parse(r.data),id:r.id,revision:r.revision})),{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Customer records could not be loaded. Please try again.'},{status:503});}
}
export async function POST(req:Request){return save(req,false);}
export async function PUT(req:Request){return save(req,true);}
async function save(req:Request,editing:boolean){
 try{
 const user=await loggedIn();if(!user)return Response.json({error:'Please log in to continue.'},{status:401});
 if(!canEdit(user))return Response.json({error:'Your role has read-only access.'},{status:403});
 if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
 const raw=await req.json(),parsed=customerSchema.safeParse(raw),identity=z.object({id:z.string(),revision:z.number().int()}).safeParse(raw);
 if(!parsed.success||(editing&&!identity.success))return Response.json({error:'Check the customer name, contacts, email addresses, and meeting dates.'},{status:400});
 const db=database(),nameKey=parsed.data.name.toLowerCase().replace(/\s+/g,' '),id=editing&&identity.success?identity.data.id:crypto.randomUUID();
 for(const m of parsed.data.minutes)if(!await validAttachments(user,m.notes,'customer',id))return Response.json({error:'Check minutes and attachments.'},{status:400});
 const duplicate=await db.prepare('SELECT id FROM customers WHERE name_key=? AND id<>?').bind(nameKey,id).first();
 if(duplicate)return Response.json({error:'A customer with this name already exists. Open that customer to edit its record.'},{status:409});
 if(editing&&identity.success){
 const r=await db.prepare('UPDATE customers SET name_key=?,data=?,revision=revision+1 WHERE id=? AND revision=?').bind(nameKey,JSON.stringify(parsed.data),id,identity.data.revision).run();
 if(!r.meta.changes)return Response.json({error:'This customer was changed elsewhere. Close the form and refresh the page before editing again.'},{status:409});
 return Response.json({...parsed.data,id,revision:identity.data.revision+1});
 }
 await db.prepare('INSERT INTO customers (id,name_key,data,revision,created_at) VALUES (?,?,?,1,?)').bind(id,nameKey,JSON.stringify(parsed.data),new Date().toISOString()).run();
 return Response.json({...parsed.data,id,revision:1},{status:201});
 }catch(e){console.error(e);return Response.json({error:'Customer changes could not be saved. Your entries are still here.'},{status:503});}
}
