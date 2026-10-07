import type { RequestDetails } from '@/lib/login-audit';
import InviteUser from '@/components/invite-user';
import { requireLogin } from '@/lib/auth';
import { isSiteOwner } from '@/lib/access-policy';
import { database } from '@/db/raw';
import { notFound } from 'next/navigation';
import AppShell from '@/components/app-shell';
export const dynamic='force-dynamic';
type LoginEvent={id:string;email:string|null;username:string;action:string;outcome:string;reason:string;ip_address:string|null;request_details:string|null;occurred_at:number};
const reasons:Record<string,string>={credentials:'Incorrect credentials',fields:'Invalid username or password format',attempts:'Too many attempts',exists:'Username already taken',confirm:'Passwords did not match',invite:'Invitation invalid or already used',registration:'Username or invitation unavailable',origin:'Request origin rejected',access:'Private access missing',unavailable:'Login unavailable',ok:'Signed in'};
function LocationDetails({raw}:{raw:string|null}){
 let d:RequestDetails={};try{d=raw?JSON.parse(raw):{};}catch{}
 if(!d||typeof d!=='object')d={};
 const location=[d.city,d.region,d.country].filter(Boolean).join(', ');
 const coords=typeof d.latitude==='number'&&Number.isFinite(d.latitude)&&Math.abs(d.latitude)<=90&&typeof d.longitude==='number'&&Number.isFinite(d.longitude)&&Math.abs(d.longitude)<=180;
 return <><strong>{location||'Location unavailable'}</strong>{location&&<span className="customer">Approximate IP location</span>}<details><summary>Location &amp; device details</summary><dl><dt>Postal area</dt><dd>{d.postalCode||'Unavailable'}</dd><dt>IP time zone</dt><dd>{d.timezone||'Unavailable'}</dd><dt>Network provider</dt><dd>{d.network||'Unavailable'}{d.asn?' (AS'+d.asn+')':''}</dd><dt>Estimated coordinates</dt><dd>{coords?<>{d.latitude}, {d.longitude} · <a href={'https://www.google.com/maps?q='+d.latitude+','+d.longitude} target="_blank" rel="noopener noreferrer">View approximate area</a></>:'Unavailable'}</dd><dt>Browser / device (reported)</dt><dd style={{maxWidth:'32rem',overflowWrap:'anywhere'}}>{d.userAgent||'Unavailable'}</dd><dt>Language (reported)</dt><dd>{d.language||'Unavailable'}</dd></dl></details></>;
}
export default async function AccessHistory({searchParams}:{searchParams:Promise<{page?:string}>}){
 const user=await requireLogin('/access-history');
 if(!isSiteOwner(user.userId,user.username))notFound();
 const params=await searchParams;
 const requestedPage=/^\d{1,5}$/.test(params.page||'')?Number(params.page):1;
 let page=Math.max(1,Math.min(10000,requestedPage)),total=0,rows:LoginEvent[]=[],unavailable=false;
 try{
  const db=database(),cutoff=Date.now()-90*86400000;
  total=(await db.prepare('SELECT COUNT(*) AS total FROM login_events WHERE occurred_at>=?').bind(cutoff).first<{total:number}>())?.total??0;
  page=Math.min(page,Math.max(1,Math.ceil(total/50)));
  rows=(await db.prepare('SELECT id,email,username,action,outcome,reason,ip_address,request_details,occurred_at FROM login_events WHERE occurred_at>=? ORDER BY occurred_at DESC,id DESC LIMIT 50 OFFSET ?').bind(cutoff,(page-1)*50).all<LoginEvent>()).results;
 }catch{console.error('Access history could not be loaded.');unavailable=true;}
 const formatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'});
 return <AppShell title="Access History"><div className="content"><div className="page-heading"><div><div className="eyebrow">OWNER ONLY</div><h1>Access History<span className="title-dot">.</span></h1><p>Successful and failed app login attempts from the last 90 days.</p></div><a className="secondary" href="/access-history" target="_self">Refresh</a></div><InviteUser/><p className="access-history-note">Location estimates come from the hosting service when available. VPNs, mobile networks, and proxies can show a different area; coordinates are not a home address or device GPS. Older entries have no location details. Attempts blocked before reaching the app are not included.</p>{unavailable?<div className="error" role="alert">Access history is temporarily unavailable. Please refresh to try again.</div>:<section className="panel"><div className="panel-heading"><h2>Login activity <span className="count">{total}</span></h2><p>Times shown in Pacific Time</p></div>{rows.length?<><div className="table-scroll"><table className="access-history-table"><thead><tr><th scope="col">Date &amp; time</th><th scope="col">Username</th><th scope="col">Account</th><th scope="col">Activity</th><th scope="col">Result</th><th scope="col">IP address</th><th scope="col">Location &amp; device</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><time dateTime={new Date(row.occurred_at).toISOString()}>{formatter.format(new Date(row.occurred_at))}</time></td><td>{row.username||'Not supplied'}</td><td>{row.email||row.username||'Not signed in'}</td><td>{row.action==='account_setup'?'Account setup':'Login'}</td><td><span className={'badge '+(row.outcome==='success'?'complete':'production')}>{row.outcome==='success'?'Successful':'Failed'}</span>{row.outcome!=='success'&&<span className="customer">{reasons[row.reason]||'Request rejected'}</span>}</td><td className="ip-address">{row.ip_address||'Unavailable'}</td><td><LocationDetails raw={row.request_details}/></td></tr>)}</tbody></table></div><div className="history-pagination"><span>Showing {(page-1)*50+1}–{Math.min(page*50,total)} of {total}</span><nav aria-label="Access history pagination">{page>1&&<a className="secondary small-button" href={'/access-history?page='+(page-1)} target="_self">Previous</a>}{page*50<total&&<a className="secondary small-button" href={'/access-history?page='+(page+1)} target="_self">Next</a>}</nav></div></>:<div className="empty compact"><h3>No login activity yet</h3><p>New login attempts will appear here. Log out and sign in again to record your first entry.</p></div>}</section>}</div></AppShell>;
}
