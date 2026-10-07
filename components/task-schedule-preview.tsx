'use client';
import {useRef} from 'react';
import DependencyLines from './dependency-lines';
import {timelineRange,barPosition} from '@/lib/task-timeline';
import type {Project} from '@/lib/project';
type Action=Project['actions'][number];
export default function TaskSchedulePreview({task,actions}:{task:Action;actions:Action[]}){
 const container=useRef<HTMLDivElement>(null);
 const predecessor=actions.find(a=>a.id===task.predecessorId),successors=actions.filter(a=>a.predecessorId===task.id&&a.id!==task.id);
 const tasks=[...(predecessor?[predecessor]:[]),task,...successors];
 const dates=tasks.filter(a=>a.start||a.due).map(a=>({start:a.start||a.due,due:a.due||a.start})),original=timelineRange(dates);
 const range=original?{first:original.first-2,last:original.last+2,days:original.days+4}:null;
 return <section className="task-plan-preview" aria-label="Task and predecessor schedule"><div className="task-preview-heading"><strong>Task connections</strong><span>Predecessor → Current task → Following tasks</span></div><div className="table-scroll"><div className="task-preview-grid" ref={container}>{tasks.map(a=>{
 const position=range&&(a.start||a.due)?barPosition(a.start||a.due,a.due||a.start,range):null;
 return <div className={'task-preview-row '+(a.id===task.id?'current':'')} key={a.id}><span>{a.title||'Current task'}<small>{a.id===task.id?'Current task':a.id===task.predecessorId?'Predecessor':'Following task'}</small></span><div className="milestone-timeline">{position?<div data-task-bar={a.id} className="milestone-bar" style={{left:position.left+'%',width:position.width+'%'}}><span style={{width:(a.done?100:a.progress||0)+'%'}}/><b>{a.done?100:a.progress||0}%</b></div>:<span className="timeline-unscheduled">Set start / finish dates</span>}</div></div>;
 })}<DependencyLines tasks={tasks} container={container}/></div></div>{range&&<div className="task-preview-dates"><span>{dates.map(a=>a.start).sort()[0]}</span><span>{dates.map(a=>a.due).sort().at(-1)}</span></div>}</section>;
}
