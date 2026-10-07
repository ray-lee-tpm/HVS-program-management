import {database} from '@/db/raw';
import {projectSchema,type Project} from './project';
import {canViewProject,canEdit} from './permissions';
import type {AppUser} from './auth';
import {attachmentIds,validContent} from './content';
export type Scope='project'|'chat'|'notes'|'customer';
export async function getProject(id:string){const row=await database().prepare('SELECT id,data,revision FROM projects WHERE id=?').bind(id).first<{id:string;data:string;revision:number}>();return row?{...projectSchema.parse(JSON.parse(row.data)),id:row.id,revision:row.revision}:null;}
export const inRoster=(user:AppUser,p:Project)=>p.roster.some(m=>m.accountId===user.userId);
export async function allowedScope(user:AppUser,scope:string,id:string,write=false){
 if(scope==='notes')return id===user.userId&&user.role!=='customer'&&(!write||canEdit(user));
 if(scope==='customer')return user.role!=='customer'&&(!write||canEdit(user))&&!!await database().prepare('SELECT id FROM customers WHERE id=?').bind(id).first();
 if(scope==='project'||scope==='chat'){const p=await getProject(id);return !!p&&(scope==='chat'?inRoster(user,p):canViewProject(user,p)&&(!write||canEdit(user)));}
 return false;
}
export async function validAttachments(user:AppUser,content:string,scope:string,id:string){
 if(!validContent(content))return false;
 for(const file of attachmentIds(content)){const row=await database().prepare('SELECT scope,resource_id FROM attachments WHERE id=?').bind(file).first<{scope:string;resource_id:string}>();if(!row||row.scope!==scope||row.resource_id!==id||!await allowedScope(user,scope,id))return false;}
 return true;
}
