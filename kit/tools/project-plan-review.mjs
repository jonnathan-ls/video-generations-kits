import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {planBacklog} from './backlog.mjs';
import {RESOURCE_KINDS} from '../engine/resources.js';

async function validateNonNarrativePlan(base,projectId,narration,plan,catalog){
 if(plan.narrative!==false||narration.trim()!==''||plan.narrationHash!==null)return false;
 if(!Array.isArray(plan.decisions)||!plan.decisions.length)throw new Error('Plano sem narrativa precisa listar recursos visuais.');
 const backlog=JSON.parse(await fs.readFile(path.join(base,'backlog.json'),'utf8'));
 const items=new Map((backlog.items||[]).map(item=>[item.id,item]));
 const seen=new Set(),created=new Set();
 for(const d of plan.decisions){
  if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(d.id)||seen.has(d.id))throw new Error('Decisões precisam de IDs únicos e estáveis.');
  seen.add(d.id);
  if(!['create','reuse','ignore'].includes(d.action)||typeof d.reason!=='string'||!d.reason.trim())throw new Error('Toda decisão precisa de ação e justificativa.');
  if(d.action==='ignore')continue;
  if(!RESOURCE_KINDS.includes(d.kind))throw new Error(`Tipo não reconhecido em ${d.id}.`);
  if(d.action==='reuse'){
   if(!d.assetId||!catalog.assets.some(a=>a.id===d.assetId&&a.kind===d.kind))throw new Error(`Reutilização inexistente ou tipo incorreto: ${d.assetId||d.id}`);
   continue;
  }
  const item=items.get(d.id);
  if(!item||item.kind!==d.kind||typeof item.specification!=='string'||!item.specification.trim())throw new Error(`Requisito de backlog ausente ou divergente em ${d.id}.`);
  created.add(d.id);
 }
 for(const id of items.keys())if(!created.has(id))throw new Error(`Requisito sem decisão no plano: ${id}`);
 return true;
}

export async function projectPlan(root,projectId,catalog){
 if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(projectId))throw Object.assign(new Error('Projeto inválido.'),{status:400});
 const base=path.join(root,'kit/projects',projectId);
 const [narration,planText]=await Promise.all([fs.readFile(path.join(base,'narration.txt'),'utf8'),fs.readFile(path.join(base,'asset-plan.json'),'utf8')]);
 const plan=JSON.parse(planText);
 const nonNarrative=await validateNonNarrativePlan(base,projectId,narration,plan,catalog);
 if(!nonNarrative)planBacklog({projectId,narration,plan,catalog});
 if(!plan.decisions.some(d=>d.action==='create'||d.action==='reuse'))throw Object.assign(new Error('O plano não contém recursos para revisão.'),{status:400});
 let fingerprintInput={projectId,narration,plan};
 if(nonNarrative){
  const backlog=JSON.parse(await fs.readFile(path.join(base,'backlog.json'),'utf8'));
  const requirements=(backlog.items||[]).map(({id,kind,specification,dependsOn})=>({id,kind,specification,dependsOn:dependsOn||[]}));
  fingerprintInput={...fingerprintInput,requirements};
 }
 const fingerprint=createHash('sha256').update(JSON.stringify(fingerprintInput)).digest('hex');
 let saved=null;try{saved=JSON.parse(await fs.readFile(path.join(base,'plan-review.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 return {base,plan,fingerprint,approved:saved?.fingerprint===fingerprint,reviewedAt:saved?.fingerprint===fingerprint?saved.reviewedAt:null};
}

export async function approveProjectPlan(root,projectId,catalog,expected,channel='chat'){
 if(!['chat','studio'].includes(channel))throw new Error('Canal de aprovação inválido.');
 const result=await projectPlan(root,projectId,catalog);
 if(result.fingerprint!==expected)throw Object.assign(new Error('O plano mudou. Atualize e confira novamente.'),{status:409});
 const review={fingerprint:result.fingerprint,reviewedAt:new Date().toISOString(),reviewer:'usuario-local',channel};
 const target=path.join(result.base,'plan-review.json'),temporary=`${target}.${process.pid}.tmp`;
 await fs.writeFile(temporary,JSON.stringify(review,null,2)+'\n');await fs.rename(temporary,target);
 return {...result,approved:true,reviewedAt:review.reviewedAt};
}

export async function validateProjectPlanUse(root,file,project,catalog,backlog){
 const parent=path.dirname(path.resolve(file)),projects=path.resolve(root,'kit/projects');
 if(path.dirname(parent)!==projects)return ['O vídeo precisa pertencer a um projeto do kit com plano validado.'];
 const projectId=path.basename(parent);let state;
 try{state=await projectPlan(root,projectId,catalog);}catch(e){return [`Plano de recursos indisponível ou desatualizado: ${e.message}`];}
 const errors=[];if(!state.approved)errors.push('O usuário ainda não validou o plano de recursos deste vídeo.');
 const allowed=new Set();
 for(const d of state.plan.decisions.filter(d=>d.action==='reuse'||d.action==='create')){
  const id=d.action==='reuse'?d.assetId:backlog.items.find(i=>i.id===`${projectId}:${d.id}`)?.assetId;
  const asset=catalog.assets.find(a=>a.id===id);
  if(!asset){errors.push(`Recurso planejado ainda não implementado: ${d.label||d.phrase}`);continue;}
  const variant=d.variant??(asset.variants.length===1?asset.variants[0]:'');
  if(asset.variants.length&&!asset.variants.includes(variant)){errors.push(`Variação do plano precisa ser definida: ${asset.id}`);continue;}
  allowed.add(`${id}::${variant}`);
 }
 for(const scene of project.scenes||[])for(const use of scene.assets||[])if(!allowed.has(`${use.id}::${use.variant||''}`))errors.push(`Recurso fora do plano validado: ${use.id}/${use.variant||''}`);
 for(const event of project.audio?.events||[])if(!allowed.has(`${event.assetId}::`))errors.push(`Som fora do plano validado: ${event.assetId}`);
 return errors;
}
