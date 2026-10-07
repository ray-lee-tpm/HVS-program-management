'use client';
import {createContext,useContext} from 'react';
import {roleCanEdit,type AccessRole} from '@/lib/roles';
export const AccessContext=createContext<{role:AccessRole;isOwner:boolean}>({role:'executive',isOwner:false});
export function useAccess(){const value=useContext(AccessContext);return {...value,canEdit:roleCanEdit(value.role),canManageRoster:value.role==='admin'};}
