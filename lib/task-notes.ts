export const noteSections=[
 ['results','Results & Summary','Record outcomes, deliverables, and key takeaways.'],
 ['goals','Goals & Objectives','Capture goals, priorities, and success criteria.'],
 ['lessons','Lessons Learned','Record what worked, challenges, and improvements.'],
 ['status','Status Update','Summarize progress, blockers, and next steps.'],
] as const;
export type NoteKind=typeof noteSections[number][0];
export type TaskNote={kind:NoteKind;content:string;revision:number;updatedAt:string|null};
