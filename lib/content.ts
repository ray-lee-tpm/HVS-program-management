import {z} from 'zod';
export const richPrefix='HVSRT:';
export const richSchema=z.array(z.discriminatedUnion('type',[
 z.object({type:z.literal('text'),text:z.string().max(20000),bold:z.boolean().optional(),italic:z.boolean().optional(),underline:z.boolean().optional(),color:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),size:z.enum(['14','16','20','24']).optional()}),
 z.object({type:z.literal('file'),id:z.string().uuid(),name:z.string().max(200),image:z.boolean()})
])).max(1000);
export type RichNode=z.infer<typeof richSchema>[number];
export function richNodes(content:string):RichNode[]{if(!content.startsWith(richPrefix))return [{type:'text',text:content}];try{return richSchema.parse(JSON.parse(content.slice(richPrefix.length)));}catch{return [{type:'text',text:content}];}}
export function plainText(content:string){return richNodes(content).map(n=>n.type==='text'?n.text:n.name).join('');}
export function attachmentIds(content:string){return richNodes(content).flatMap(n=>n.type==='file'?[n.id]:[]);}
export function validContent(content:string){if(!content.startsWith(richPrefix))return true;try{richSchema.parse(JSON.parse(content.slice(richPrefix.length)));return true;}catch{return false;}}
