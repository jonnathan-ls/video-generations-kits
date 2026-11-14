import {statusFor} from './reviews.mjs';
import {validateShotMotion} from '../engine/shot-motion.js';

const VISUAL_PLAN_FIELDS = [
 'beatId', 'attentionTarget', 'visualQuestion', 'visibleEvent',
 'stateBefore', 'stateAfter', 'cameraReveal', 'soundIntent'
];
const RETURN_FUNCTIONS = new Set(['orientation','clue','state-change','payoff']);
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();

function validateVisualProgression(scenes, errors){
 const byComposition=new Map(),byEvent=new Map(),byAttentionTarget=new Map(),order=new Map(),missingPlans=[],unjustified=new Map(),repeated=new Set();
 const orderedScenes=[...scenes].sort((a,b)=>(a.start||0)-(b.start||0));
 orderedScenes.forEach((scene,index)=>order.set(scene.id,index));
 for(const [i,scene] of orderedScenes.entries()){
  if(typeof scene.id!=='string'||!scene.id.trim())errors.push(`Cena ${i+1}: id estável é obrigatório para rastrear retornos visuais.`);
  const plan=scene.visualPlan;
  if(!plan||typeof plan!=='object'){
   missingPlans.push(scene.id||String(i+1));
  }
  if(plan&&typeof plan==='object')for(const field of VISUAL_PLAN_FIELDS){
   if(typeof plan[field]!=='string'||plan[field].trim().length<8)errors.push(`Cena ${scene.id||i+1}: visualPlan.${field} precisa descrever a encenação com especificidade.`);
  }
  // The subject can return with a new action. Ignore camera/text, but compare
  // the actual staging and physical motion rather than just asset inventory.
  const staging=(scene.assets||[]).map(({id,variant,position,rotation,scale,instanceId,target,params,timeOffset})=>({id,variant,position,rotation,scale,instanceId,target,params,timeOffset})).sort((a,b)=>(a.instanceId||a.id).localeCompare(b.instanceId||b.id));
  const composition=JSON.stringify({staging,motion:scene.motion||[]});
  if(composition){const list=byComposition.get(composition)||[];list.push(scene);byComposition.set(composition,list);}
  const event=normalize(plan?.visibleEvent);
  if(event){const list=byEvent.get(event)||[];list.push(scene);byEvent.set(event,list);}
  const target=normalize(plan?.attentionTarget)+'|'+normalize(plan?.visibleEvent);
  if(target){const list=byAttentionTarget.get(target)||[];list.push(scene);byAttentionTarget.set(target,list);}
 }

 // Returning to the same setup can be intentional, but only when the script names
 // the earlier shot, the dramatic function, and a visible state change.
 for(const [kind,groups] of [['composição e ação',byComposition],['evento',byEvent],['alvo e evento',byAttentionTarget]]){
  for(const [signature,group] of groups){
   if(group.length<2)continue;
   for(let i=1;i<group.length;i++){
    const scene=group[i],plan=scene.visualPlan||{},visit=plan.returnVisit;
    const key=scene.id||String(order.get(scene.id)+1);
    repeated.add(key);
    const earlier=group.slice(0,i).some(prior=>prior.id===visit?.priorSceneId);
    if(!visit||!earlier||!RETURN_FUNCTIONS.has(visit.function)||typeof visit.visibleDelta!=='string'||visit.visibleDelta.trim().length<16){
     const reasons=unjustified.get(key)||new Set();reasons.add(kind);unjustified.set(key,reasons);
     continue;
    }
    if(normalize(plan.stateBefore)===normalize(plan.stateAfter)){const reasons=unjustified.get(key)||new Set();reasons.add(`${kind}, sem mudança de estado`);unjustified.set(key,reasons);}
   }
  }
 }
 if(missingPlans.length)errors.push(`${missingPlans.length} cenas sem visualPlan ligado aos beats (exemplos: ${missingPlans.slice(0,8).join(', ')}${missingPlans.length>8?', …':''}).`);
 if(unjustified.size)errors.push(`${unjustified.size} retornos visuais sem justificativa rastreável (exemplos: ${[...unjustified.keys()].slice(0,8).join(', ')}${unjustified.size>8?', …':''}); declare returnVisit, função narrativa e diferença de estado.`);
 return {missingVisualPlans:missingPlans.length,repeatedScenes:repeated.size,unjustifiedReturns:unjustified.size,compositionGroups:[...byComposition.values()].filter(group=>group.length>1).length,eventGroups:[...byEvent.values()].filter(group=>group.length>1).length,attentionTargetGroups:[...byAttentionTarget.values()].filter(group=>group.length>1).length,examples:[...unjustified.keys()].slice(0,8)};
}

export function validateProduction(project,catalog,reviews){
 const errors=[];if(!Array.isArray(project.scenes)||!project.scenes.length)errors.push('Projeto sem cenas.');
 const minAssetsPerScene=Number(project.qualityPolicy?.minAssetsPerScene||0);
 const maxSceneSeconds=Number(project.qualityPolicy?.maxSceneSeconds||0);
 const maxConsecutiveSameWorld=Number(project.qualityPolicy?.maxConsecutiveSameWorld||0);
 const minDistinctWorlds=Number(project.qualityPolicy?.minDistinctWorlds||0);
 const worlds=new Set();let worldRun=0,lastWorld=null;
 for(const [i,scene]of (project.scenes||[]).entries()){
  if(maxConsecutiveSameWorld>0||minDistinctWorlds>0){const world=String(scene.world||'').trim();if(!world)errors.push(`Cena ${scene.id||i+1}: declare world/set para a política de variedade.`);else{worlds.add(world);if(world===lastWorld)worldRun++;else{worldRun=1;lastWorld=world;}if(maxConsecutiveSameWorld>0&&worldRun>maxConsecutiveSameWorld)errors.push(`Cena ${scene.id||i+1}: ${worldRun} cenas consecutivas no mundo “${world}”; máximo ${maxConsecutiveSameWorld}. Troque de mundo ou de ação física.`);}}
  if(!(Number.isFinite(scene.start)&&Number.isFinite(scene.duration)&&scene.duration>0&&scene.start>=0))errors.push(`Cena ${i+1}: intervalo inválido.`);
  if(maxSceneSeconds>0&&Number(scene.duration)>maxSceneSeconds)errors.push(`Cena ${scene.id||i+1}: duração de ${Number(scene.duration).toFixed(2)}s excede o máximo de ${maxSceneSeconds}s por cena; divida a fala em cenas ou registre uma justificativa no projeto.`);
  if(!scene.explanation||!scene.action)errors.push(`Cena ${i+1}: explicação e ação visual são obrigatórias.`);
  if(!scene.assets?.length)errors.push(`Cena ${i+1}: precisa compor assets.`);
  if(minAssetsPerScene>0&&(scene.assets?.length||0)<minAssetsPerScene)errors.push(`Cena ${scene.id||i+1}: mínimo de ${minAssetsPerScene} recursos por cena (encontrados ${scene.assets?.length||0}); não há limite máximo.`);
  if(scene.storyboardStatus&&scene.storyboardStatus!=='implemented')errors.push(`Cena ${scene.id||i+1}: storyboard ainda não implementado.`);
  errors.push(...validateShotMotion(scene));
  for(const use of scene.assets||[]){const a=catalog.assets.find(a=>a.id===use.id);if(!a){errors.push(`Asset inexistente: ${use.id}`);continue;}
   if(a.introducedBy&&(!a.quality?.ok||!a.quality?.current))errors.push(`Qualidade técnica desatualizada: ${use.id}`);
   if(use.target&&!scene.assets.some(other=>(other.instanceId||other.id)===use.target))errors.push(`Alvo inexistente: ${use.id} → ${use.target}`);
   if(use.variant&&!a.variants.includes(use.variant))errors.push(`Variação inexistente: ${use.id}/${use.variant}`);
   if(a.kind==='character'){const clipId=`anim_${use.clip||'talk'}`;if(!scene.assets.some(r=>r.id===clipId))errors.push(`Declare a animação do personagem como recurso aprovado: ${clipId}`);}
   if(use.timeOffset!==undefined&&(!Number.isFinite(use.timeOffset)||use.timeOffset<0))errors.push(`timeOffset inválido: ${use.id}`);
   if(use.revision!==a.revision)errors.push(`Revisão não fixada ou desatualizada: ${use.id}`);
   if(statusFor(a,use.variant||'',reviews)!=='approved')errors.push(`Aprovação humana pendente: ${use.id}${use.variant?'/'+use.variant:''}`);
  }
 }
 if(minDistinctWorlds>0&&worlds.size<minDistinctWorlds)errors.push(`A abertura usa ${worlds.size} mundos distintos; mínimo ${minDistinctWorlds}. Trocar câmera/cartão no mesmo set não conta.`);
 const visualProgression=validateVisualProgression(project.scenes||[],errors);
 for(const e of project.audio?.events||[]){const a=catalog.assets.find(a=>a.id===e.assetId);if(!a||a.kind!=='sound')errors.push(`Som inexistente: ${e.assetId}`);else {if(e.revision!==a.revision)errors.push(`Revisão do som desatualizada: ${e.assetId}`);if(statusFor(a,'',reviews)!=='approved')errors.push(`Aprovação do som pendente: ${e.assetId}`);}if(!Number.isFinite(e.time)||e.time<0||e.time>=project.duration)errors.push('Tempo de efeito sonoro inválido.');}
 const sorted=[...(project.scenes||[])].sort((a,b)=>a.start-b.start);let end=0;for(const s of sorted){if(Math.abs(s.start-end)>.05)errors.push(`Lacuna ou sobreposição antes de ${s.id||s.start}.`);end=s.start+s.duration;}
 if(!Number.isFinite(project.duration)||Math.abs(end-project.duration)>.05)errors.push('Duração do projeto diverge das cenas.');
 if(project.assetPlan?.unresolved?.length)errors.push('Resolver lacunas semânticas do plano de assets.');
 if(!project.assetPlan?.reviewed)errors.push('Plano semântico da narrativa não revisado.');
 const uniqueErrors=[...new Set(errors)];
 return {ok:uniqueErrors.length===0,errors:uniqueErrors,visualProgression};
}
