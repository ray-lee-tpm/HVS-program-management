import type { Project } from './project';
import type { Customer } from './customer';
export const customerKey=(name:string)=>name.trim().toLowerCase().replace(/\s+/g,' ');
export function localDay(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-');}
export function formatDay(value:string){return value?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):'—';}
export function scheduleLabel(due:string,done:boolean,today:string){return done?'Completed':!due?'Not scheduled':due<today?'Overdue':due===today?'Due today':'On schedule';}
export function statusClass(status:string){return status==='Completed'?'complete':status==='On hold'?'hold':status==='In production'||status==='Bring-up'?'production':'planning';}
export function customerRows(projects:Project[],customers:Customer[]){
 const rows=new Map<string,{name:string;customer?:Customer;projects:number;latestMeeting:string}>();
 for(const c of customers)rows.set(customerKey(c.name),{name:c.name,customer:c,projects:0,latestMeeting:c.minutes.map(m=>m.date).sort().at(-1)||''});
 for(const p of projects){const key=customerKey(p.customer),row=rows.get(key)||{name:p.customer,projects:0,latestMeeting:''};row.projects++;rows.set(key,row);}
 return [...rows.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
