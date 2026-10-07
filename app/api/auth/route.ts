import { z } from 'zod';
import { database } from '@/db/raw';
import { cookieValue,digest,equalHash,passwordHash,randomToken,sameOrigin,sessionCookie,safeNext,type AppUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { recordLogin,requestIp } from '@/lib/login-audit';
export const dynamic='force-dynamic';
const credentials=z.object({username:z.string().trim().min(3).max(60).regex(/^[a-zA-Z0-9_.@-]+$/),password:z.string().min(12).max(128),setup:z.boolean(),invite:z.string().optional(),confirm:z.string().optional()});
export async function POST(req:Request){
 const formSubmission=req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')||req.headers.get('content-type')?.includes('multipart/form-data');
 let next='/dashboard',invite='',attemptedUsername='',user:AppUser|null=null,action:'login'|'account_setup'='login';
 async function fail(message:string,status:number,code:string){
  await recordLogin(req,user,attemptedUsername,action,'failed',code);
  if(!formSubmission)return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
  const url=new URL('/',req.url);url.searchParams.set('error',code);url.searchParams.set('next',next);
  if(action==='account_setup'&&/^[a-f0-9]{64}$/.test(invite))url.searchParams.set('invite',invite);
  return new Response(null,{status:303,headers:{Location:url.toString(),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }
 try{
  if(!sameOrigin(req))return fail('Please sign in from this site.',403,'origin');
  let raw:unknown;
  if(formSubmission){const form=await req.formData();next=safeNext(typeof form.get('next')==='string'?String(form.get('next')):null);raw={username:form.get('username'),password:form.get('password'),confirm:form.get('confirm')||undefined,invite:form.get('invite')||undefined,setup:form.get('setup')==='true'};}
  else{try{raw=await req.json();}catch{return fail('Check your login fields.',400,'fields');}}
  if(raw&&typeof raw==='object'){const v=raw as Record<string,unknown>;attemptedUsername=typeof v.username==='string'?v.username.trim().slice(0,60):'';invite=typeof v.invite==='string'?v.invite:'';action=v.setup===true?'account_setup':'login';}
  const input=credentials.safeParse(raw);if(!input.success)return fail('Use a username with 3–60 letters, numbers, dots, underscores, @, or hyphens, and a password with 12–128 characters.',400,'fields');
  const db=database(),now=Date.now(),username=input.data.username.toLowerCase();
  const accountKey='name:'+await digest(username),ip=requestIp(req.headers);
  const keys=[{key:accountKey,max:10},...(ip?[{key:'ip:'+await digest(ip),max:50}]:[])];
  for(const {key,max} of keys){const limit=await db.prepare('INSERT INTO login_limits (user_id,attempts,window_start) VALUES (?,1,?) ON CONFLICT(user_id) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END, window_start=CASE WHEN window_start<? THEN ? ELSE window_start END RETURNING attempts').bind(key,now,now-900000,now-900000,now).first<{attempts:number}>();if(limit&&limit.attempts>max)return fail('Too many login attempts. Please try again in 15 minutes.',429,'attempts');}
  const account=await db.prepare('SELECT user_id,username,salt,password_hash FROM accounts WHERE username=?').bind(username).first<{user_id:string;username:string;salt:string;password_hash:string}>();
  let userId:string;
  if(input.data.setup){
   if(input.data.confirm!==input.data.password)return fail('The passwords do not match.',400,'confirm');
   if(!/^[a-f0-9]{64}$/.test(invite))return fail('A valid invitation is required to create an account.',403,'invite');
   const inviteHash=await digest(invite);
   const invitation=await db.prepare('SELECT token_hash,role FROM invitations WHERE token_hash=? AND used_by IS NULL AND expires_at>?').bind(inviteHash,now).first<{token_hash:string;role:string}>();
   if(!invitation)return fail('This invitation has expired or was already used. Ask the owner for a new link.',403,'invite');
   if(account)return fail('That username is already taken. Choose another.',409,'exists');
   userId=crypto.randomUUID();const salt=randomToken(),hash=await passwordHash(input.data.password,salt);
   const created=await db.batch([
    db.prepare('INSERT OR IGNORE INTO accounts (user_id,username,salt,password_hash,role) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM invitations WHERE token_hash=? AND used_by IS NULL AND expires_at>?)').bind(userId,username,salt,hash,invitation.role,inviteHash,now),
    db.prepare('UPDATE invitations SET used_by=? WHERE token_hash=? AND used_by IS NULL AND EXISTS (SELECT 1 FROM accounts WHERE user_id=?)').bind(userId,inviteHash,userId)
   ]);
   if(!created[0].meta.changes)return fail('The username or invitation is no longer available. Try another username or ask for a new invitation.',409,'registration');
  }else{
   const computed=await passwordHash(input.data.password,account?.salt||'unregistered-account');
   if(!account||!equalHash(computed,account.password_hash))return fail('Incorrect username or password.',401,'credentials');
   userId=account.user_id;
  }
  user={role:'member',userId,username,displayName:username,email:null};
  const token=randomToken();
  await db.batch([
   db.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now),
   db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token),userId,now+28800000),
   db.prepare('DELETE FROM login_limits WHERE user_id=?').bind(accountKey)
  ]);
  await recordLogin(req,user,username,action,'success','ok');
  if(formSubmission)return new Response(null,{status:303,headers:{Location:new URL(next,req.url).toString(),'Set-Cookie':cookieValue(token),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
  return Response.json({ok:true},{headers:{'Set-Cookie':cookieValue(token),'Cache-Control':'no-store'}});
 }catch{console.error('Login unavailable');return fail('Login is temporarily unavailable. Please try again.',503,'unavailable');}
}
export async function DELETE(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Request not allowed.'},{status:403});
 try{
  const token=(await cookies()).get(sessionCookie)?.value;
  if(token)await database().prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
  return Response.json({ok:true},{headers:{'Set-Cookie':cookieValue('',0),'Cache-Control':'no-store'}});
 }catch{console.error('Logout unavailable');return Response.json({error:'Could not log out. Please try again.'},{status:503});}
}
