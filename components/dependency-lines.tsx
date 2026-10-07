'use client';
import {useEffect,useId,useState,type RefObject} from 'react';
import type {Project} from '@/lib/project';
export default function DependencyLines({tasks,container,layoutKey=''}:{tasks:Project['actions'];container:RefObject<HTMLDivElement|null>;layoutKey?:string}){
 const marker=useId().replace(/:/g,''),[drawing,setDrawing]=useState<{width:number;height:number;paths:{id:string;title:string;d:string}[]}>({width:0,height:0,paths:[]});
 useEffect(()=>{
  const root=container.current;if(!root)return;
  function measure(){if(!root)return;const bounds=root.getBoundingClientRect(),bars=new Map(Array.from(root.querySelectorAll<HTMLElement>('[data-task-bar]')).map(el=>[el.dataset.taskBar!,el.getBoundingClientRect()]));
   const paths=tasks.flatMap(task=>{const source=bars.get(task.predecessorId||''),target=bars.get(task.id);if(!source||!target)return [];const sx=source.right-bounds.left,sy=source.top+source.height/2-bounds.top,tx=target.left-bounds.left,ty=target.top+target.height/2-bounds.top,mid=(sy+ty)/2;
    return [{id:task.id,title:(tasks.find(a=>a.id===task.predecessorId)?.title||'Predecessor')+' → '+task.title,d:`M ${sx} ${sy} H ${sx+12} V ${mid} H ${tx-12} V ${ty} H ${tx}`}];});setDrawing({width:bounds.width,height:bounds.height,paths});
  }
  measure();const observer=new ResizeObserver(measure);observer.observe(root);root.querySelectorAll('[data-task-bar]').forEach(el=>observer.observe(el));return ()=>observer.disconnect();
 },[tasks,container,layoutKey]);
 return <svg className="dependency-lines" width={drawing.width} height={drawing.height} aria-hidden="true"><defs><marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="#9f2357"/></marker></defs>{drawing.paths.map(path=><path key={path.id} d={path.d} fill="none" stroke="#9f2357" strokeWidth="1.8" strokeLinejoin="round" markerEnd={'url(#'+marker+')'}><title>{path.title}</title></path>)}</svg>;
}
