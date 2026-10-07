import {unzipSync,strFromU8} from 'fflate';
import {extractText} from 'unpdf';
export async function extractDocument(name:string,bytes:Uint8Array):Promise<{text:string;status:string}>{
 try{
 const extension=name.split('.').pop()?.toLowerCase();let text='';
 if(['txt','md','csv','tsv','json','log'].includes(extension||''))text=new TextDecoder().decode(bytes);
 else if(extension==='pdf'){const result=await extractText(bytes,{mergePages:true});text=result.text;}
 else if(['docx','xlsx','pptx'].includes(extension||'')){
 let budget=20000000;const files=unzipSync(bytes,{filter:file=>file.originalSize<2000000&&(budget-=file.originalSize)>0&&/^(word\/document\.xml|ppt\/slides\/slide\d+\.xml|xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(file.name)});
 text=Object.values(files).map(data=>strFromU8(data).replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ')).join('\n');
 }
 text=text.trim().slice(0,50000);return {text,status:text?'indexed':'Attachment saved; no readable text. Scans and images are not searchable.'};
 }catch{return {text:'',status:'Attachment saved; text extraction unavailable.'};}
}
