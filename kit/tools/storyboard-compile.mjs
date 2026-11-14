import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {buildCatalog} from './build-catalog.mjs';import {validateShotMotion} from '../engine/shot-motion.js';

/** Compile only authored, executable scenes. No category recipes or fallback sets. */
export function compileStoryboard(source,board,catalog,{until=Infinity,diagnostic=false}={}){
 const errors=[],scenes=[];const rows=new Map(board.scenes.map(row=>[row.id,row]));
 if(rows.size!==board.scenes.length)errors.push('Storyboard com IDs duplicados.');
 const selected=source.scenes.filter(scene=>scene.start<until);
 for(const sourceScene of selected){
  const row=rows.get(sourceScene.id),label=sourceScene.id;if(!row){errors.push(`${label}: beat ausente.`);continue;}
  if(row.start!==sourceScene.start||row.duration!==sourceScene.duration||row.sourceText!==sourceScene.sourceText)errors.push(`${label}: storyboard diverge do texto/tempo de origem.`);
  if(row.implementation!=='available'&&!diagnostic)errors.push(`${label}: encenação pendente (${row.implementation}).`);
  if(!row.camera?.from||!row.camera?.target)errors.push(`${label}: câmera executável ausente.`);
  if(!row.visualPlan?.visibleEvent||!row.visualPlan?.stateAfter)errors.push(`${label}: acontecimento visual ausente.`);
  const assets=structuredClone(row.assets||[]),instanceIds=new Set();
  for(const use of assets){const definition=catalog.assets.find(a=>a.id===use.id);if(!definition){errors.push(`${label}: recurso inexistente ${use.id}.`);continue;}
   if(use.variant&&!definition.variants?.includes(use.variant))errors.push(`${label}: variante inexistente ${use.id}/${use.variant}.`);
   if(['object','scene','character','overlay'].includes(definition.kind)){const id=use.instanceId||use.id;if(instanceIds.has(id))errors.push(`${label}: instanceId duplicado ${id}.`);instanceIds.add(id);}
   if(['object','scene','character'].includes(definition.kind)&&(!Array.isArray(use.position)||use.position.length!==3||!use.position.every(Number.isFinite)))errors.push(`${label}: posição explícita ausente para ${use.id}.`);
   use.revision=definition.revision;delete use.approval;delete use.role;
  }
  const scene={...structuredClone(sourceScene),assets,camera:structuredClone(row.camera),motion:structuredClone(row.motion||[]),visualPlan:structuredClone(row.visualPlan),action:row.visualPlan?.visibleEvent,render:row.renderOptions||sourceScene.render,storyboardStatus:row.implementation==='available'?'implemented':'diagnostic',productionGaps:row.construction?.pending||row.requirements||[],storyboardSet:row.primaryVisualSet};
  errors.push(...validateShotMotion(scene));scenes.push(scene);
 }
 if(!scenes.length)errors.push('Seleção sem cenas.');if(errors.length)return {ok:false,errors,scenes:[]};
 const project=structuredClone(source);project.scenes=scenes;project.duration=scenes.at(-1).start+scenes.at(-1).duration;
 // Sound design cues are the authored editorial timing. Convert them to the
 // audio track consumed by HyperFrames so the preview and final composition
 // actually play the effects at those cue times.
 const soundEvents=[...(project.audio?.events||[]),...(project.soundDesign?.cues||[])].filter(event=>{
  const definition=catalog.assets.find(asset=>asset.id===event.assetId);
  return Boolean(definition?.sound)&&Number.isFinite(Number(event.time))&&Number(event.time)<project.duration;
 }).map(event=>({...event,time:Number(event.time),duration:Math.min(Number(event.duration)||.01,project.duration-Number(event.time)),volume:Number(event.volume??.35)})).filter(event=>event.duration>.005);
 const uniqueSounds=new Map();for(const event of soundEvents){const key=[event.assetId,event.time.toFixed(3),event.contact||'',event.duration.toFixed(3)].join('|');if(!uniqueSounds.has(key))uniqueSounds.set(key,event);}
 project.audio={...(project.audio||{}),events:[...uniqueSounds.values()]};
 project.captions=(project.captions||[]).filter(c=>c.start<project.duration-1/project.fps).map(c=>({...c,duration:Math.min(c.duration,project.duration-c.start)}));
 project.titleCards=(project.titleCards||[]).filter(c=>c.start<project.duration).map(c=>({...c,duration:Math.min(c.duration,project.duration-c.start)}));
 for(const row of board.scenes){
  const graphics=row.titleGraphics;if(!graphics||!Number.isFinite(row.start)||row.start>=project.duration)continue;
  const graphicTitle=graphics.text||graphics.title||'',graphicSubtitle=graphics.date||graphics.subtitle||'';if(!graphicTitle&&!graphicSubtitle)continue;
  const existing=project.titleCards.find(card=>Math.abs(card.start-row.start)<.05);
  if(existing){
   if(graphicTitle&&existing.title==='')existing.title=graphicTitle;
   if(graphicSubtitle)existing.subtitle=graphicSubtitle;
   continue;
  }
  const sourceScene=source.scenes.find(scene=>scene.id===row.id);if(!sourceScene)continue;
  project.titleCards.push({
   start:row.start,
   duration:Math.min(project.duration-row.start,graphics.title?Math.max(2.8,Number(graphics.duration)||3.2):Math.min(sourceScene.duration,Number(graphics.duration)||2.2)),
   eyebrow:graphics.eyebrow||'MARCO HISTÓRICO',
   title:graphicTitle,
   subtitle:graphicSubtitle,
   ...(graphics.title?{layout:'evidence'}:{}),
   ...(Number.isFinite(graphics.topPercent)?{topPercent:graphics.topPercent}:{})
  });
 }
 project.titleCards.sort((a,b)=>a.start-b.start);
 for(let i=0;i<project.titleCards.length-1;i++)project.titleCards[i].duration=Math.min(project.titleCards[i].duration,project.titleCards[i+1].start-project.titleCards[i].start);
 project.assetPlan={reviewed:false,unresolved:['Mudança de encenação: revisão visual dos recursos e plano vinculados à nova montagem.']};
 project.storyboard={revision:board.revision,sourceSceneCount:source.scenes.length,implementedSceneCount:scenes.length,scope:scenes.length===source.scenes.length?'whole-video':'prefix',professionalQa:'not-verified'};
 return {ok:true,errors:[],project};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [sourceFile,boardFile,output]=process.argv.slice(2);if(!output)throw new Error('Informe projeto, storyboard e projeto de saída.');
 const source=JSON.parse(await fs.readFile(sourceFile,'utf8')),board=JSON.parse(await fs.readFile(boardFile,'utf8'));
 const at=process.argv.indexOf('--until'),result=compileStoryboard(source,board,await buildCatalog(),{until:at>=0?Number(process.argv[at+1]):Infinity,diagnostic:process.argv.includes('--diagnostic')});
 if(!result.ok){console.log(JSON.stringify(result,null,2));process.exitCode=1;}else{
  await fs.mkdir(path.dirname(path.resolve(output)),{recursive:true});
  // Resource paths remain explicit: clone fonts and retain audio location for the operator.
  const base=path.dirname(path.resolve(sourceFile)),dest=path.dirname(path.resolve(output));
  for(const font of result.project.fonts||[]){const source=path.resolve(base,font.source),target=path.join(dest,'fonts',path.basename(font.source));await fs.mkdir(path.dirname(target),{recursive:true});if(source!==path.resolve(target))await fs.copyFile(source,target);font.source='fonts/'+path.basename(target);}
  if(result.project.audio?.voice)result.project.audio.voice=path.relative(dest,path.resolve(base,result.project.audio.voice));
  await fs.writeFile(output,JSON.stringify(result.project,null,2)+'\n');console.log(JSON.stringify({output,duration:result.project.duration,scenes:result.project.scenes.length,scope:result.project.storyboard.scope}));
 }
}
