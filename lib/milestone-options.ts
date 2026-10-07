import {milestonePresets,type Project} from './project';
type Milestone=Project['milestones'][number];
const prefix='preset:';
export function taskMilestoneOptions(milestones:Milestone[]){
 const used=new Set<string>();
 const presets=milestonePresets.map(title=>{
  const existing=milestones.find(m=>m.category===title||m.title===title);
  if(existing)used.add(existing.id);
  return {value:existing?.id||prefix+title,label:existing&&existing.title!==title?title+' · '+existing.title:title};
 });
 return [...presets,...milestones.filter(m=>!used.has(m.id)).map(m=>({value:m.id,label:m.title}))];
}
export function resolveTaskMilestone(milestones:Milestone[],selection:string){
 if(!selection||milestones.some(m=>m.id===selection))return {milestoneId:selection,milestones};
 const title=milestonePresets.find(title=>selection===prefix+title);
 if(!title)throw new Error('Choose a milestone in this project.');
 const existing=milestones.find(m=>m.category===title||m.title===title);
 if(existing)return {milestoneId:existing.id,milestones};
 if(milestones.length>=100)throw new Error('This project has reached its limit of 100 milestones. Choose an existing milestone.');
 const milestone={id:crypto.randomUUID(),title,category:title,start:'',due:''};
 return {milestoneId:milestone.id,milestones:[...milestones,milestone]};
}
