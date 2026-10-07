import {env} from 'cloudflare:workers';
// Configure the owner in the hosting environment; never trust a submitted username alone.
export function isSiteOwner(userId:string|undefined,username:string|undefined){
 const id=env.HVS_OWNER_USER_ID,owner=env.HVS_OWNER_USERNAME;
 return !!id&&!!owner&&userId===id&&username?.toLowerCase()===owner.toLowerCase();
}
