import {riskLevels,type Project} from '@/lib/project';
export function projectRisk(actions:Project['actions']){return [...actions].sort((a,b)=>riskLevels.indexOf(b.risk||'N/A')-riskLevels.indexOf(a.risk||'N/A'))[0]?.risk||'N/A';}
export default function RiskBadge({risk='N/A'}:{risk?:string}){return <span className={'risk-badge risk-'+risk.toLowerCase().replace('/','')}><i aria-hidden="true"/>{risk}</span>;}
