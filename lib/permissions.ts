import type {AppUser} from './auth';
import type {Project} from './project';
import {isSiteOwner} from './access-policy';
import {roleCanEdit} from './roles';
export const canEdit=(user:AppUser)=>roleCanEdit(user.role);
export const canManageRoster=(user:AppUser)=>user.role==='admin';
export const canManageAccess=(user:AppUser)=>isSiteOwner(user.userId,user.username);
export const canViewProject=(user:AppUser,p:Pick<Project,'roster'>)=>user.role!=='customer'||p.roster.some(m=>m.accountId===user.userId);
