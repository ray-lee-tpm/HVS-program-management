import {loggedIn} from '@/lib/auth';
import {database} from '@/db/raw';
import {projectSchema} from '@/lib/project';
import {customerSchema} from '@/lib/customer';
import {canViewProject} from '@/lib/permissions';
import {inRoster} from '@/lib/collaboration';
import {plainText} from '@/lib/content';
export const dynamic='force-dynamic';
type Source={title:string;text:string;url:string;type:string};
export async function GET(req:Request){try{
 const user=await loggedIn();if(!user)return Response.json({error:'Please log in.'},{status:401});const q=(new URL(req.url).searchParams.get('q')||'').trim().slice(0,300);if(q.length<2)return Response.json({error:'Enter at least two characters.'},{status:400});
 const db=database(),sources:Source[]=[],stop=new Set('what when where who how is are was were the a an to of for in on my our does do please tell me about and can you has have it with'.split(' '));
 const tokens=[...new Set(q.toLowerCase().match(/[\p{L}\p{N}_]+/gu)||[])].filter(t=>!stop.has(t));if(!tokens.length)return Response.json({answer:'Include a project name, topic, or document keyword.',sources:[],mode:'source-excerpts'});
 const {results:rows}=await db.prepare('SELECT id,data,revision FROM projects ORDER BY created_at DESC').all<{id:string;data:string;revision:number}>();const projects=rows.map(r=>({...projectSchema.parse(JSON.parse(r.data)),id:r.id,revision:r.revision})).filter(p=>canViewProject(user,p));const visible=new Set(projects.map(p=>p.id)),chats=new Set(projects.filter(p=>inRoster(user,p)).map(p=>p.id));
 for(const p of projects){sources.push({title:p.name,text:`Customer: ${p.customer}\nStatus: ${p.status}\nPM: ${p.team.pm}\nME: ${p.team.me}\nEE: ${p.team.ee}\nSW: ${p.team.sw}\nRFQ received: ${p.dates.rfq||'Not entered'}\nQ&A submitted: ${p.dates.qa||'Not entered'}\nDFM submitted: ${p.dates.dfm||'Not entered'}\nQuote submitted: ${p.dates.quote||'Not entered'}\nLead-time submitted: ${p.dates.leadTime||'Not entered'}`,url:'/projects/'+p.id,type:'Project'});for(const a of p.actions)sources.push({title:p.name+' · '+a.title,text:`${a.title}\nOwner: ${a.owner}\nRisk: ${a.risk}\nProgress: ${a.progress}%\nDue: ${a.due||'Not entered'}\n${plainText(a.notes)}`,url:'/tasks',type:'Task'});}
 if(user.role!=='customer'){
 const {results:customers}=await db.prepare('SELECT id,data FROM customers').all<{id:string;data:string}>();for(const c of customers){const data=customerSchema.parse(JSON.parse(c.data));for(const m of data.minutes)sources.push({title:data.name+' · '+m.title,text:`${m.date}\nAttendees: ${m.attendees}\n${plainText(m.notes)}`,url:'/customers/'+c.id,type:'Meeting minutes'});}
 const {results:notes}=await db.prepare('SELECT kind,content FROM task_notes WHERE user_id=?').bind(user.userId).all<{kind:string;content:string}>();for(const n of notes)sources.push({title:n.kind+' notes',text:plainText(n.content),url:'/tasks',type:'Notes'});
 const {results:updates}=await db.prepare('SELECT author,content,created_at FROM status_updates WHERE user_id=? ORDER BY created_at DESC LIMIT 200').bind(user.userId).all<{author:string;content:string;created_at:number}>();for(const u of updates)sources.push({title:u.author+' · '+new Date(u.created_at).toISOString().slice(0,10),text:plainText(u.content),url:'/tasks',type:'Status update'});
 }
 const {results:files}=await db.prepare('SELECT id,scope,resource_id,name,extracted_text,extraction FROM attachments ORDER BY created_at DESC LIMIT 200').all<{id:string;scope:string;resource_id:string;name:string;extracted_text:string;extraction:string}>();
 for(const f of files){const permitted=f.scope==='project'?visible.has(f.resource_id):f.scope==='chat'?chats.has(f.resource_id):f.scope==='notes'?f.resource_id===user.userId&&user.role!=='customer':f.scope==='customer'&&user.role!=='customer';if(permitted)sources.push({title:f.name,text:f.extracted_text||f.extraction,url:'/api/files?id='+f.id,type:'Document'});}
 const hits=sources.map(s=>{const text=(s.title+' '+s.text).toLowerCase(),score=tokens.reduce((n,t)=>n+(text.includes(t)?1:0)+(s.title.toLowerCase().includes(t)?2:0),0);return {...s,score};}).filter(s=>s.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(s=>{const idx=tokens.map(t=>s.text.toLowerCase().indexOf(t)).filter(i=>i>=0).sort((a,b)=>a-b)[0]||0;const start=Math.max(0,idx-120);return {title:s.title,url:s.url,type:s.type,excerpt:(start?'…':'')+s.text.slice(start,start+900)+(s.text.length>start+900?'…':'')};});
 return Response.json({mode:'source-excerpts',answer:hits.length?'Here is what your saved information says. Open a source to see the full record.':'No matching information found in the records and readable documents you can access.',sources:hits},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Search is temporarily unavailable.'},{status:503});}}
