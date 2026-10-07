'use client';
import { useState } from 'react';
import { requestJSON } from '@/lib/client-api';
export default function InviteUser(){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 async function create(){setBusy(true);setError('');setCopied(false);try{const result=await requestJSON<{url:string}>('/api/invitations',{method:'POST'});setUrl(result.url);}catch(e){setError(e instanceof Error?e.message:'Could not create an invitation.');}finally{setBusy(false);}}
 async function copy(){try{await navigator.clipboard.writeText(url);setCopied(true);}catch{setError('Select and copy the invitation link below.');}}
 return <section className="panel invitation-panel"><div className="panel-heading"><div><h2>Invite a user</h2><p>Let someone create their own username and password without ChatGPT.</p></div><button className="primary" onClick={create} disabled={busy}>{busy?'Creating…':'Create invitation link'}</button></div><div className="invitation-body"><p>The recipient can view and edit shared projects and customers. Each link can be used once and expires after 7 days.</p>{url&&<><label>Share this link<input readOnly value={url} onFocus={e=>e.target.select()}/></label><button className="secondary" onClick={copy}>{copied?'Copied':'Copy link'}</button><span role="status" className="muted">{copied?'Invitation link copied.':''}</span></>}{error&&<div className="error" role="alert">{error}</div>}</div></section>;
}
