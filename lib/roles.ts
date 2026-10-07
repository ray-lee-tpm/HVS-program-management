export const accessRoles=['admin','customer','member','executive'] as const;
export type AccessRole=typeof accessRoles[number];
export const roleDescriptions={admin:'View and edit all project/customer data and manage project rosters.',member:'View and edit project/customer data. View rosters.',executive:'View all project/customer data. No editing or sharing.',customer:'View only projects and tasks assigned through their roster. No customer directory, editing, or sharing.'} as const;
export const roleCanEdit=(role:AccessRole)=>role==='admin'||role==='member';
