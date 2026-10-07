import {isSiteOwner} from './access-policy';
import {accessRoles,type AccessRole} from './roles';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { database } from '@/db/raw';
export const sessionCookie='__Host-hvs-session';
const encoder=new TextEncoder();
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(value:string){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
export function randomToken(){return hex(crypto.getRandomValues(new Uint8Array(32)).buffer);}
export async function passwordHash(password:string,salt:string){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256));
}
export function equalHash(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
export async function loggedIn(){
 const token=(await cookies()).get(sessionCookie)?.value;if(!token)return null;
 const session=await database().prepare('SELECT a.user_id,a.username,a.role FROM sessions s JOIN accounts a ON a.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first<{user_id:string;username:string;role:string}>();
 const role:AccessRole=session&&isSiteOwner(session.user_id,session.username)?'admin':session&&accessRoles.some(r=>r===session.role)?session.role as AccessRole:'customer';
 return session?{role,userId:session.user_id,username:session.username,displayName:session.username,email:null}:null;
}
export type AppUser=NonNullable<Awaited<ReturnType<typeof loggedIn>>>;
export async function requireLogin(returnTo='/dashboard'){
 const user=await loggedIn();if(!user)redirect('/?next='+encodeURIComponent(returnTo));return user;
}
export function safeNext(value:string|null){return ['/dashboard','/tasks','/projects','/customers','/access-history'].includes(value||'')||/^\/(?:projects|customers)\/[a-zA-Z0-9-]+$/.test(value||'')?value!:'/dashboard';}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export function cookieValue(token:string,maxAge=28800){return `${sessionCookie}=${token}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${maxAge}`;}
