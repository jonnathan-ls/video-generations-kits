import {$,el,json} from './ui.js';
import {KIND_LABELS} from '/kit/engine/resources.js';

const stages={queued:'Aguardando construção',building:'Em construção',review:'Pronto para revisão',changes:'Melhoria solicitada',ready:'Aprovado para uso'};
let currentLoad=0;

function reusedItems(project,catalog,reviews){
 return (project.plan?.decisions||[]).filter(d=>d.action==='reuse').map(d=>{
  const asset=catalog?.assets.find(a=>a.id===d.assetId);
  const variant=d.variant??(asset?.variants?.length===1?asset.variants[0]:'');
  const hasVariant=!asset?.variants?.length||asset.variants.includes(variant);
  const review=asset&&hasVariant?reviews[`${asset.id}::${variant}`]:null;
  const state=review?.revision===asset?.revision?review.status:'pending';
  return {id:`${project.id}:${d.id}`,projectId:project.id,kind:d.kind,label:asset?.label||d.assetId,
   specification:!asset?'Este recurso não está mais no catálogo. A lista precisa ser atualizada antes da validação.':!hasVariant?'A variação deste recurso ainda precisa ser definida.':d.reason,
   evidence:[{phrase:d.phrase}],assetId:asset?.id,variant,source:'catalog',stage:state==='approved'?'ready':state==='changes'?'changes':'review'};
 });
}

function newItems(project,data,catalog,reviews){
 return (project.plan?.decisions||[]).filter(d=>d.action==='create').map(d=>{
  const id=project.plan?.narrative===false?d.id:`${project.id}:${d.id}`;
  const stored=data.items.find(entry=>entry.id===id);
  const evidence=stored?.evidence?.length?stored.evidence:[{phrase:project.plan?.narrative===false?`Mapa visual: ${(d.terms||[]).join(' · ')||'sem narração'}`:d.phrase}];
  const item={id,projectId:project.id,kind:d.kind,label:d.label,specification:d.specification,evidence,baselineIds:d.baselineIds,stage:'queued',...stored,label:stored?.label||d.label,evidence};
  const asset=catalog?.assets.find(a=>a.id===item.assetId);
  if(!asset)return {...item,source:'new'};
  const variant=d.variant??(asset.variants.length===1?asset.variants[0]:'');
  if(asset.variants.length&&!asset.variants.includes(variant))return {...item,source:'new',stage:'queued',specification:item.specification+' A variação deste recurso ainda precisa ser definida.'};
  const review=reviews[`${asset.id}::${variant}`],state=review?.revision===asset.revision?review.status:'pending';
  return {...item,source:'new',variant,stage:state==='approved'?'ready':state==='changes'?'changes':'review'};
 });
}

function renderItem(item,{planApproved}){
 const article=el('article',undefined,'backlog-item');article.dataset.requirement=item.id;
 const heading=el('div',undefined,'backlog-heading');
 const status=item.source==='catalog'&&!planApproved?'Reuso proposto':stages[item.stage]||item.stage;
 heading.append(el('h3',item.label),el('span',status,'badge '+(item.stage==='ready'&&planApproved?'approved':'')));
 article.append(heading,el('p',`${KIND_LABELS[item.kind]||item.kind}${item.variant?' · '+item.variant:''}`,'backlog-meta'));
 if(item.specification)article.append(el('p',item.specification));
 article.append(el('blockquote',(item.evidence||[]).map(e=>'“'+e.phrase+'”').join(' · ')));
 if(item.assetId&&planApproved){const button=el('button','Inspecionar recurso');button.onclick=()=>window.dispatchEvent(new CustomEvent('kit:inspect-asset',{detail:{id:item.assetId,variant:item.variant}}));article.append(button);}
 else if(item.assetId)article.append(el('p','O recurso já foi construído; valide a lista para liberar sua inspeção individual.','backlog-meta'));
 else if(item.source==='new')article.append(el('p','Ainda será construído; a revisão visual acontece quando estiver pronto.','backlog-meta'));
 return article;
}

function renderGroup(container,title,description,items,options){
 if(!items.length)return;
 const section=el('section',undefined,'backlog-group');
 section.append(el('h2',`${title} · ${items.length}`),el('p',description,'backlog-group-description'));
 for(const item of items)section.append(renderItem(item,options));
 container.append(section);
}

function createdGroupCopy(items){
 const unique=[...new Set(items.map(item=>item.stage))];
 if(unique.length===1){
  const stage=unique[0];
  if(stage==='queued')return ['Recursos para construir','A narrativa precisa destes recursos. Cada item será apresentado para revisão visual quando estiver pronto.'];
  if(stage==='building')return ['Recursos em construção','Os recursos deste grupo estão sendo preparados para inspeção visual.'];
  if(stage==='review')return ['Recursos prontos para revisão','Os recursos foram construídos e estão disponíveis para inspeção visual individual.'];
  if(stage==='changes')return ['Recursos com melhorias solicitadas','Cada item permanece em revisão até que os ajustes pedidos sejam feitos.'];
  if(stage==='ready')return ['Recursos aprovados para uso','A revisão visual individual foi registrada para estes recursos.'];
 }
 return ['Novos recursos da narrativa','O estado de cada recurso aparece no cartão; abra um item para inspecionar ou acompanhar a construção.'];
}

export async function showBacklog(context={},projectId){
 try{
  const load=++currentLoad;
  const [data,{projects}]=await Promise.all([json('/api/backlog'),json('/api/projects')]);
  if(load!==currentLoad)return;
  const select=$('backlog-project'),previous=projectId||select.value;
  select.replaceChildren(...projects.map(p=>new Option(p.title||p.id,p.id)));
  if(projects.some(p=>p.id===previous))select.value=previous;
  const project=projects.find(p=>p.id===select.value);
  const container=$('backlog-items');container.replaceChildren();
  $('approve-plan').disabled=true;$('approve-plan').onclick=null;
  const backlogTab=document.querySelector('[data-tab="backlog"]');
  if(backlogTab)backlogTab.textContent=project?.pipeline==='wan2gp-ai-video'?'Revisar geração IA':'Validar recursos';
  if(!project){$('backlog-count').textContent='';$('backlog-project-title').textContent='';$('backlog-project-status').textContent='Peça um vídeo ou estudo pelo chat para começar.';$('backlog-step-label').textContent='ETAPA ATUAL · NARRATIVA';$('backlog-title').textContent='Validar recursos deste vídeo';$('plan-review-step').textContent='O QUE VOCÊ FAZ AGORA';$('plan-review-title').textContent='Confirme a lista de recursos';$('plan-review-help').textContent='Revise os recursos necessários para este vídeo e confirme a lista para liberar a inspeção individual.';$('plan-review-status').textContent='Aguardando plano.';return;}
  const filterDisclosure=document.querySelector('.backlog-filter-disclosure');
  if(filterDisclosure)filterDisclosure.hidden=project.pipeline==='wan2gp-ai-video';
  const currentUrl=new URL(location.href);
  if(currentUrl.searchParams.get('project')!==project.id){currentUrl.searchParams.set('project',project.id);history.replaceState(null,'',currentUrl);}

  if(project.pipeline==='wan2gp-ai-video'){
   $('backlog-project-title').textContent=project.title||project.id;
   $('backlog-count').textContent='0 assets 3D para validar';
   $('backlog-project-status').textContent='Produção visual por IA local com Wan2GP.';
   $('backlog-step-label').textContent='ETAPA ATUAL · GERAÇÃO IA';
   $('backlog-title').textContent='Revisar geração por IA';
   $('plan-review-step').textContent='LISTA DE RECURSOS';
   $('plan-review-title').textContent='Esta etapa não tem assets 3D';
   $('plan-review-help').textContent='A imagem e o movimento serão gerados pelo Wan2GP local. Roteiro visual, estilo e prompts são revisados como direção; o primeiro resultado para revisão será um clipe de prova.';
   $('plan-review-status').textContent='A lista de dez itens da revisão 02 foi cancelada junto com a rota Three.js. Não é necessário validar recursos nesta tela.';
   $('approve-plan').textContent='Sem assets para validar';
   $('approve-plan').disabled=true;
   container.append(el('p','A próxima revisão criativa será do clipe gerado pelo Wan2GP, após a etapa de modelagem e quando a GPU estiver disponível.'));
   return;
  }

  const created=newItems(project,data,context.getCatalog(),context.getReviews());
  const reused=reusedItems(project,context.getCatalog(),context.getReviews());
  const all=[...created,...reused];
  const kind=$('backlog-kind').value,status=$('backlog-stage').value;
  const items=all.filter(i=>(!kind||i.kind===kind)&&(!status||i.stage===status));
  $('backlog-project-title').textContent=project.title||project.id;
  $('backlog-count').textContent=`${created.length} novos · ${reused.length} do catálogo`;
  $('backlog-project-status').textContent=!project.plan?'A narrativa ainda não tem uma lista de recursos.':!project.planCurrent?'A narrativa mudou; a lista precisa ser atualizada antes da validação.':'Confira apenas os recursos necessários para este vídeo.';
  $('plan-review-status').textContent=project.planCurrent?'Conferindo lista…':'A lista será liberada depois que a narrativa for atualizada.';
  if(project.planCurrent){
   try{
    const review=await json('/api/project-plan-review?projectId='+encodeURIComponent(project.id));
    if(load!==currentLoad)return;
    const planApproved=review.approved;
    $('backlog-step-label').textContent=planApproved?'ETAPA ATUAL · REVISÃO VISUAL':'ETAPA ATUAL · NARRATIVA';
    $('backlog-title').textContent=planApproved?'Revisar recursos deste vídeo':'Validar recursos deste vídeo';
    $('plan-review-step').textContent=planApproved?'ETAPA ATUAL · REVISÃO VISUAL':'O QUE VOCÊ FAZ AGORA';
    $('plan-review-title').textContent=planApproved?'Revise os recursos deste vídeo':'Confirme a lista de recursos';
    $('plan-review-help').textContent=planApproved
     ?'A lista do projeto já foi confirmada. Abra cada recurso abaixo e registre sua decisão visual individual.'
     :'Revise os recursos necessários para este vídeo e confirme a lista para liberar a inspeção individual.';
    const reusedCount=reused.length===1?'1 recurso':`${reused.length} recursos`;
    $('plan-review-status').textContent=planApproved
     ?`Lista validada. ${created.length} novos recursos e ${reusedCount} do catálogo estão disponíveis abaixo.`
     :kind||status
      ?'Remova os filtros para conferir a lista completa antes de validá-la.'
      :`Confira os ${all.length} itens abaixo: ${created.length} novos e ${reused.length} do catálogo. Você valida esta lista uma vez; cada recurso será apresentado para revisão visual depois.`;
    $('approve-plan').textContent=planApproved?'Lista validada':`Validar lista · ${all.length} recursos`;
    $('approve-plan').disabled=planApproved||!!kind||!!status;
    $('approve-plan').onclick=async()=>{
     const button=$('approve-plan');button.disabled=true;
     try{await json('/api/project-plan-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:project.id,fingerprint:review.fingerprint})});await showBacklog(context,project.id);}
     catch(e){$('plan-review-status').textContent=e.message;button.disabled=false;}
    };
    if(!items.length){container.append(el('p',all.length?'Nenhum recurso corresponde aos filtros.':'Este vídeo ainda não tem recursos no plano.'));return;}
    const createdItems=items.filter(i=>i.source==='new'),[createdTitle,createdDescription]=createdGroupCopy(createdItems);
    renderGroup(container,createdTitle,createdDescription,createdItems,{planApproved});
    renderGroup(container,'Recurso reaproveitado do catálogo','Esta sugestão já existe na biblioteca e aparece separada dos recursos novos.',items.filter(i=>i.source==='catalog'),{planApproved});
   }catch(e){$('plan-review-status').textContent='A lista precisa ser atualizada: '+e.message;}
  }
 }catch(e){$('backlog-items').textContent=e.message;}
}

export function mountBacklog(context){
 for(const id of ['backlog-project','backlog-kind','backlog-stage'])$(id).onchange=()=>showBacklog(context);
 window.addEventListener('kit:inspect-asset',event=>context.openAsset(event.detail.id,event.detail.variant));
}
