import type {Project} from './project';
import {dayNumber} from './task-timeline';
type Action=Project['actions'][number];
export function taskWbs(project:Pick<Project,'actions'|'milestones'>){
 const groups=[...project.milestones.map(m=>m.id),...(project.actions.some(a=>!a.milestoneId)?['']:[])];
 const result=new Map<string,string>();groups.forEach((id,i)=>project.actions.filter(a=>a.milestoneId===id).forEach((a,j)=>result.set(a.id,`${i+1}.${j+1}`)));return result;
}
export function predecessorChoices(actions:Action[],taskId:string){
 const tasks=new Map(actions.map(a=>[a.id,a]));
 return actions.filter(a=>{const seen=new Set<string>();let id=a.id;while(id&&tasks.has(id)){if(id===taskId||seen.has(id))return false;seen.add(id);id=tasks.get(id)!.predecessorId||'';}return true;});
}
export function waitingForPredecessor(task:Action,actions:Action[]){return !!(task.waitForPredecessor&&task.predecessorId&&!actions.find(a=>a.id===task.predecessorId)?.done);}
export function blockedTaskChange(actions:Action[],previous:Action[]=[]){
 return actions.find(a=>{const old=previous.find(v=>v.id===a.id);return waitingForPredecessor(a,actions)&&(a.done&&!old?.done||(a.progress||0)>(old?.progress||0));});
}
export function workingDays(start:string,finish:string){
 if(!start||!finish||start>finish)return null;const first=dayNumber(start),days=dayNumber(finish)-first+1;
 if(!Number.isFinite(days))return null;let count=Math.floor(days/7)*5;const weekday=new Date(start+'T00:00:00Z').getUTCDay();for(let i=0;i<days%7;i++){const day=(weekday+i)%7;if(day!==0&&day!==6)count++;}return count;
}
