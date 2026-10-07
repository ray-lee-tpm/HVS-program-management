import { z } from 'zod';
export const riskLevels=['N/A','Low','Medium','High','Critical'] as const;
export const statuses = ['RFQ received', 'Q&A in progress', 'DFM in progress', 'Quote submitted', 'Awaiting PO', 'In production', 'Bring-up', 'Completed', 'On hold'] as const;
export const milestonePresets = ['RFQ & Go/No-Go', 'Q&A & DFM Prep', 'DFM Review & OK2Build', 'Manufacturing', 'Validation & OK2Ship', 'MBU & OK2Use', 'Completed', 'Rejected', 'Declined'] as const;
export const milestoneCategories = [...milestonePresets, 'RFQ received', 'Q&A submitted', 'DFM submitted', 'Quote submitted', 'Lead-time submitted', 'Awaiting PO', 'In production', 'Bring-up', 'Custom'] as const;
export const rosterTeams=['Project Lead','Engineering Lead','Commercial Lead','ME','EE','SW','Vision','Project Member','Supporting Member','Customer'] as const;
export const rosterMemberSchema=z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(160),title:z.string().trim().max(100),team:z.enum(rosterTeams),accountId:z.string().max(100).default('')});
const name = z.string().trim().max(160);
const date = z.string().refine(v => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v), 'Enter a valid date');
export const projectSchema = z.object({
  customer: name.min(1), name: name.min(1), status: z.enum(statuses),
  team: z.object({pm:name,me:name,ee:name,sw:name,other:z.string().trim().max(1000)}),
  dates: z.object({rfq:date,qa:date,dfm:date,quote:date,leadTime:date}),
  roster:z.array(rosterMemberSchema).max(200).default([]),
  milestones:z.array(z.object({id:z.string().min(1).max(100),title:name.min(1),category:z.enum(milestoneCategories).default('Custom'),start:date,due:date}).refine(m=>!m.start||!m.due||m.start<=m.due,{message:'Start date must be on or before due date',path:['due']})).max(100).default([]),
  actions:z.array(z.object({id:z.string().max(100),title:z.string().trim().min(1).max(500),owner:name,risk:z.enum(riskLevels).default('N/A'),notes:z.string().max(20000).default(''),milestoneId:z.string().max(100).default(''),predecessorId:z.string().max(100).default(''),waitForPredecessor:z.boolean().default(false),deadline:date.default(''),start:date.default(''),due:date,progress:z.number().int().min(0).max(100).default(0),done:z.boolean()}).refine(a=>!a.start||!a.due||a.start<=a.due,{message:'Start date must be on or before due date',path:['due']}).transform(a=>({...a,progress:a.done?100:a.progress===100?0:a.progress}))).max(200)
}).superRefine((p,ctx)=>{
 if(new Set(p.roster.map(m=>m.id)).size!==p.roster.length)ctx.addIssue({code:'custom',path:['roster'],message:'Roster IDs must be unique'});
 const ids=new Set(p.milestones.map(m=>m.id));
 if(ids.size!==p.milestones.length)ctx.addIssue({code:'custom',path:['milestones'],message:'Milestone IDs must be unique'});
 const tasks=new Map(p.actions.map(a=>[a.id,a]));
 if(tasks.size!==p.actions.length)ctx.addIssue({code:'custom',path:['actions'],message:'Task IDs must be unique'});
 p.actions.forEach((a,i)=>{
  if(a.predecessorId===a.id||a.predecessorId&&!tasks.has(a.predecessorId))ctx.addIssue({code:'custom',path:['actions',i,'predecessorId'],message:'Choose another task in this project as predecessor'});
  const seen=new Set([a.id]);let id=a.predecessorId;
  while(id&&tasks.has(id)){if(seen.has(id)){ctx.addIssue({code:'custom',path:['actions',i,'predecessorId'],message:'Predecessor links cannot form a cycle'});break;}seen.add(id);id=tasks.get(id)!.predecessorId;}
 });
 p.actions.forEach((a,i)=>{if(a.milestoneId&&!ids.has(a.milestoneId))ctx.addIssue({code:'custom',path:['actions',i,'milestoneId'],message:'Choose a milestone in this project'});});
});
export type ProjectData = z.infer<typeof projectSchema>;
export type Project = ProjectData & {id:string; revision:number};
export const blankProject = (): ProjectData => ({customer:'',name:'',status:'RFQ received',team:{pm:'',me:'',ee:'',sw:'',other:''},dates:{rfq:'',qa:'',dfm:'',quote:'',leadTime:''},roster:[],milestones:[],actions:[]});
