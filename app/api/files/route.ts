import {env} from 'cloudflare:workers';
import {database} from '@/db/raw';
import {loggedIn,sameOrigin} from '@/lib/auth';
import {allowedScope} from '@/lib/collaboration';
import {extractDocument} from '@/lib/extract-document';
export const dynamic='force-dynamic';
function imageType(data:Uint8Array){if(data[0]===0x89&&data[1]===0x50&&data[2]===0x4e&&data[3]===0x47)return 'image/png';if(data[0]===0xff&&data[1]===0xd8&&data[2]===0xff)return 'image/jpeg';if(new TextDecoder().decode(data.slice(0,6)).match(/^GIF8[79]a$/))return 'image/gif';if(new TextDecoder().decode(data.slice(0,4))==='RIFF'&&new TextDecoder().decode(data.slice(8,12))==='WEBP')return 'image/webp';return 'application/octet-stream';}
export async function POST(req:Request){let storedId='';try{
 const user=await loggedIn();if(!user)return Response.json({error:'Please log in.'},{status:401});if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>11*1024*1024)return Response.json({error:'Files must be 10 MB or smaller.'},{status:413});
 const form=await req.formData(),file=form.get('file'),scope=String(form.get('scope')||''),resourceId=scope==='notes'?user.userId:String(form.get('resourceId')||'');
 if(!await allowedScope(user,scope,resourceId,true))return Response.json({error:'You cannot attach files here.'},{status:403});
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024)return Response.json({error:'Choose a file up to 10 MB.'},{status:400});
 if(!env.BUCKET)return Response.json({error:'File storage is unavailable.'},{status:503});
 const name=file.name.replace(/[\x00-\x1f\/\\]/g,'_').slice(0,200),id=crypto.randomUUID(),bytes=new Uint8Array(await file.arrayBuffer()),mime=imageType(bytes);
 const extraction=await extractDocument(name,bytes.slice());
 await env.BUCKET.put(id,bytes,{httpMetadata:{contentType:mime}});storedId=id;
 await database().prepare('INSERT INTO attachments (id,scope,resource_id,user_id,name,mime,bytes,extracted_text,extraction,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,scope,resourceId,user.userId,name,mime,file.size,extraction.text,extraction.status,Date.now()).run();
 return Response.json({id,name,image:mime.startsWith('image/'),extraction:extraction.status},{status:201});
 }catch(e){if(storedId)await env.BUCKET?.delete(storedId);console.error(e);return Response.json({error:'File could not be uploaded. Please try again.'},{status:503});}}
export async function GET(req:Request){try{const user=await loggedIn();if(!user)return Response.json({error:'Please log in.'},{status:401});const id=new URL(req.url).searchParams.get('id')||'';const row=await database().prepare('SELECT scope,resource_id,name,mime FROM attachments WHERE id=?').bind(id).first<{scope:string;resource_id:string;name:string;mime:string}>();if(!row||!await allowedScope(user,row.scope,row.resource_id))return Response.json({error:'Attachment not found.'},{status:404});const file=await env.BUCKET?.get(id);if(!file)return Response.json({error:'Attachment not found.'},{status:404});return new Response(file.body,{headers:{'Content-Type':row.mime,'Content-Disposition':(row.mime.startsWith('image/')?'inline':'attachment')+"; filename*=UTF-8''"+encodeURIComponent(row.name),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox"}});}catch(e){console.error(e);return Response.json({error:'Attachment unavailable.'},{status:503});}}
