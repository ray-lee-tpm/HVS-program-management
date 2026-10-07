import { database } from '@/db/raw';
import type { AppUser } from '@/lib/auth';

export type RequestDetails={city?:string;region?:string;country?:string;postalCode?:string;timezone?:string;latitude?:number;longitude?:number;network?:string;asn?:number;userAgent?:string;language?:string};
export function requestDetails(req:Request):RequestDetails{
 const cf=(req as Request & {cf?:Record<string,unknown>}).cf||{};
 const details:RequestDetails={};
 const text=(v:unknown,max=160)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,max):undefined;
 for(const key of ['city','region','country','postalCode','timezone'] as const)details[key]=text(cf[key]);
 details.network=text(cf.asOrganization);
 if(typeof cf.asn==='number'&&Number.isSafeInteger(cf.asn)&&cf.asn>0)details.asn=cf.asn;
 for(const [key,limit] of [['latitude',90],['longitude',180]] as const){const raw=cf[key];const value=typeof raw==='string'&&raw.trim()?Number(raw):raw;if(typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=limit)details[key]=value;}
 details.userAgent=text(req.headers.get('user-agent'),500);
 details.language=text(req.headers.get('accept-language'),160);
 return details;
}

export function requestIp(headers:Headers){
 // Use the hosting edge's single IP header, never a client-supplied forwarding chain.
 const value=headers.get('cf-connecting-ip')?.trim();
 if(!value||value.length>45)return null;
 const v4=(ip:string)=>ip.split('.').length===4&&ip.split('.').every(n=>/^\d{1,3}$/.test(n)&&Number(n)<=255);
 if(v4(value))return value;
 if(!/^[0-9a-f:.]+$/i.test(value)||!value.includes(':'))return null;
 const normalized=value.includes('.')?value.replace(/[^:]+$/,tail=>v4(tail)?'0:0':'invalid'):value;
 const halves=normalized.split('::');
 if(halves.length>2)return null;
 const groups=halves.flatMap(h=>h?h.split(':'):[]);
 if(!groups.every(g=>/^[0-9a-f]{1,4}$/i.test(g)))return null;
 if(halves.length===1?groups.length!==8:groups.length>=8)return null;
 return value;
}

export async function recordLogin(req:Request,user:AppUser|null,username:string,action:'login'|'account_setup',outcome:'success'|'failed',reason:string){
 try{
  const now=Date.now(),db=database();
  await db.batch([
   db.prepare('DELETE FROM login_events WHERE occurred_at<?').bind(now-90*86400000),
   db.prepare('INSERT INTO login_events (id,user_id,email,username,action,outcome,reason,ip_address,request_details,occurred_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),user?.userId??null,user?.email??null,username.slice(0,60),action,outcome,reason,requestIp(req.headers),JSON.stringify(requestDetails(req)),now)
  ]);
 }catch{console.error('Login activity could not be recorded.');}
}
