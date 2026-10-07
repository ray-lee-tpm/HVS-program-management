export async function requestJSON<T>(url:string,options?:RequestInit):Promise<T>{
 const r=await fetch(url,{...options,credentials:'same-origin'});
 if(r.status===401){const next=window.location.pathname;window.location.assign('/?next='+encodeURIComponent(next));throw Error('Your session has ended. Please log in again.');}
 if(!r.headers.get('content-type')?.includes('application/json'))throw Error('The request did not reach the app. Refresh this page or open the app in a new tab, then try again.');
 const data=await r.json() as T & {error?:string};if(!r.ok)throw Error(data.error||'The request could not be completed. Please try again.');return data;
}
