import {z} from 'zod';
import {database} from '@/db/raw';
import {loggedIn,sameOrigin} from '@/lib/auth';
import {canManageRoster,canViewProject} from '@/lib/permissions';
import {projectSchema,rosterMemberSchema} from '@/lib/project';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 try{const user=await loggedIn();if(!user)return Response.json({error:'Please log in.'},{status:401});
 const id=new URL(req.url).searchParams.get('projectId');if(!id)return Response.json({error:'Choose a project.'},{status:400});
 const row=await database().prepare('SELECT id,data,revision FROM projects WHERE id=?').bind(id).first<{id:string;data:string;revision:number}>();
 if(!row)return Response.json({error:'Project not found.'},{status:404});const project={...projectSchema.parse(JSON.parse(row.data)),id:row.id,revision:row.revision};
 if(!canViewProject(user,project))return Response.json({error:'Project not found.'},{status:404});
 const accounts=canManageRoster(user)?(await database().prepare('SELECT user_id,username FROM accounts ORDER BY username').all<{user_id:string;username:string}>()).results:[];
 return Response.json({project,accounts:accounts.map(a=>({id:a.user_id,username:a.username}))},{headers:{'Cache-Control':'no-store'}});
 }catch{console.error('Roster unavailable');return Response.json({error:'Could not load the roster.'},{status:503});}
}
export async function PUT(req:Request){
 try{const user=await loggedIn();if(!user)return Response.json({error:'Please log in.'},{status:401});if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});if(!canManageRoster(user))return Response.json({error:'Only an admin can assign project teams.'},{status:403});
 const input=z.object({projectId:z.string().min(1).max(100),revision:z.number().int(),roster:z.array(rosterMemberSchema).max(200)}).safeParse(await req.json());if(!input.success)return Response.json({error:'Check the member names and teams.'},{status:400});
 const row=await database().prepare('SELECT data FROM projects WHERE id=?').bind(input.data.projectId).first<{data:string}>();if(!row)return Response.json({error:'Project not found.'},{status:404});
 const parsed=projectSchema.safeParse({...JSON.parse(row.data),roster:input.data.roster});if(!parsed.success)return Response.json({error:'Check the roster assignments.'},{status:400});
 const names=(team:string)=>parsed.data.roster.filter(m=>m.team===team).map(m=>m.name).join(', ').slice(0,160);
 parsed.data.team={...parsed.data.team,pm:names('Project Lead'),me:names('ME'),ee:names('EE'),sw:names('SW'),other:parsed.data.roster.filter(m=>!['Project Lead','ME','EE','SW'].includes(m.team)).map(m=>m.name).join(', ').slice(0,1000)};
 const linked=[...new Set(parsed.data.roster.map(m=>m.accountId).filter(Boolean))];
 if(linked.length){const accounts=(await database().prepare('SELECT user_id FROM accounts').all<{user_id:string}>()).results;if(linked.some(id=>!accounts.some(a=>a.user_id===id)))return Response.json({error:'A linked account no longer exists.'},{status:400});}
 const result=await database().prepare('UPDATE projects SET data=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(parsed.data),input.data.projectId,input.data.revision).run();if(!result.meta.changes)return Response.json({error:'The project changed. Reload the roster before saving.'},{status:409});
 return Response.json({...parsed.data,id:input.data.projectId,revision:input.data.revision+1});
 }catch{console.error('Roster save unavailable');return Response.json({error:'Could not save the roster. Your changes are still here.'},{status:503});}
}
