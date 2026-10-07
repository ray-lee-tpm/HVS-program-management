import type { Project } from './project';
import type { Minute } from './customer';
import type { TaskNote } from './task-notes';
export type SharedTask=Project['actions'][number]&{project:Pick<Project,'id'|'name'|'customer'>};
export type SharedSnapshot=
 |{kind:'tasks';tasks:SharedTask[];taskProjects?:Pick<Project,'id'|'name'|'customer'|'milestones'>[];notes:TaskNote[];updates?:{id:string;author:string;content:string;createdAt:number}[]}
 |{kind:'projects';projects:Project[]}
 |{kind:'minutes'|'minute';customerName:string;minutes:Minute[]};
