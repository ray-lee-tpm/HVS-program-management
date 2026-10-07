const DAY=86400000;
export const dayNumber=(date:string)=>Date.parse(date+'T00:00:00Z')/DAY;
export const isoDay=(day:number)=>new Date(day*DAY).toISOString().slice(0,10);
export function timelineRange(tasks:{start:string;due:string}[]){
 if(!tasks.length)return null;
 const first=Math.min(...tasks.map(t=>dayNumber(t.start))),last=Math.max(...tasks.map(t=>dayNumber(t.due)));
 return {first,last,days:last-first+1};
}
export function barPosition(start:string,due:string,range:{first:number;days:number}){
 return {left:100*(dayNumber(start)-range.first)/range.days,width:100*(dayNumber(due)-dayNumber(start)+1)/range.days};
}
