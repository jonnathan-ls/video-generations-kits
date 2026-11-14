import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {createReadStream} from 'node:fs';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';import {isIP} from 'node:net';
import {buildCatalog,ROOT} from './build-catalog.mjs';import {ReviewStore,statusFor} from './reviews.mjs';import {BacklogStore,textHash} from './backlog.mjs';import {analyzeNarrative} from '../engine/narrative.js';
import {projectPlan,approveProjectPlan} from './project-plan-review.mjs';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav','.mp4':'video/mp4','.srt':'application/x-subrip; charset=utf-8','.md':'text/plain; charset=utf-8','.ttf':'font/ttf','.woff2':'font/woff2'};
async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
async function liveRenderPlan(projectId){
 const runtimeDir=process.env.XDG_RUNTIME_DIR||'/tmp',lockFile=path.join(runtimeDir,`video-kit-gpu-${process.getuid?.()??'user'}.lock`),owner=await readJson(lockFile,null);
 if(!owner?.pid||!owner.cacheRoot)return null;
 try{process.kill(Number(owner.pid),0);}catch{return null;}
 const cacheRoot=path.resolve(owner.cacheRoot),plan=await readJson(path.join(cacheRoot,'plan.json'),null);
 if(!plan?.projectFile||!Array.isArray(plan.segments))return null;
 const projectRoot=path.join(ROOT,'kit/projects',projectId,'production-v3'),projectFile=path.resolve(plan.projectFile);
 if(!projectFile.startsWith(projectRoot+path.sep))return null;
 return {owner,cacheRoot,plan,project:await readJson(projectFile,{scenes:[]})};
}
async function packetAvailable(live,segment){
 if(!segment?.cached)return false;
 const file=path.resolve(segment.output||''),root=live.cacheRoot;
 if(!file.startsWith(root+path.sep)||path.basename(file)!=='clip.mp4')return false;
 const [receipt,stat]=await Promise.all([readJson(path.join(path.dirname(file),'receipt.json'),null),fs.stat(file).catch(()=>null)]);
 return !!stat&&stat.isFile()&&stat.size>0&&receipt?.hash===segment.hash&&receipt?.frames===segment.frameCount&&Boolean(receipt?.videoHash);
}
async function productionSnapshot(projectId){
 if(projectId!=='titanic-completo')return null;
 const base=path.join(ROOT,'kit/projects',projectId),fullVersion=await readJson(path.join(base,'production-v4/source-project.json'),null),full=fullVersion||await readJson(path.join(base,'production-v3/source-project.json'),null)||await readJson(path.join(base,'project.json'),null);
 if(!full)return null;
 const board=await readJson(path.join(base,fullVersion?'storyboard-v4-full.json':'storyboard-v3.json'),{scenes:[]}),sampleReview=await readJson(path.join(base,'sample-review.json'),null);
 const blockStoryboard=fullVersion?board:await readJson(path.join(base,'storyboard-v3-block-01.json'),null);
 const stagePreviewPath=fullVersion?'/preview/titanic-completo/qa-full-v4/index.html':'/preview/titanic-completo/previs-bloco-01/index.html',stagePreviewFile=path.join(base,'hyperframes',fullVersion?'qa-full-v4':'previs-bloco-01','index.html');
 const stagePreviewAvailable=!!(await fs.stat(stagePreviewFile).catch(()=>null));
 const previews=[
  {path:'/preview/titanic-completo/qa-v14/titanic-v14-diagnostico.mp4',file:path.join(base,'hyperframes/qa-v14/titanic-v14-diagnostico.mp4')},
  {path:'/preview/titanic-completo/qa-v13/titanic-v13-diagnostico.mp4',file:path.join(base,'hyperframes/qa-v13/titanic-v13-diagnostico.mp4')},
  {path:'/preview/titanic-completo/qa-v12/titanic-v12-diagnostico.mp4',file:path.join(base,'hyperframes/qa-v12/titanic-v12-diagnostico.mp4')}
 ];
 let previewPath=null,previewFile=null,receipt=null;
 for(const candidate of previews){const candidateReceipt=await readJson(candidate.file+'.receipt.json',null),exists=!!candidateReceipt&&!!(await fs.stat(candidate.file).catch(()=>null));if(exists){previewPath=candidate.path;previewFile=candidate.file;receipt=candidateReceipt;break;}}
 const previewExists=!!receipt&&!!previewFile;
 const fps=Number(full.fps)||24,previewDuration=previewExists?Number(receipt.frames)/fps:0;
 const live=await liveRenderPlan(projectId),livePackets=new Map(),activeSegment=live?.plan.segments.find(s=>!s.cached)||null;
 if(live){for(const segment of live.plan.segments){if(!(await packetAvailable(live,segment)))continue;const packetFps=Number(live.plan.fps||fps),start=segment.startFrame/packetFps;for(const id of segment.sceneIds||[]){const sourceScene=live.project.scenes?.find(s=>s.id===id);if(!sourceScene)continue;const localStart=sourceScene.start-start,localEnd=localStart+sourceScene.duration;if(localStart>=-.02&&localEnd<=segment.frameCount/packetFps+.02)livePackets.set(id,{previewUrl:`/api/production/${projectId}/packets/${segment.hash}.mp4`,previewStart:Math.max(0,localStart),previewEnd:Math.min(segment.frameCount/packetFps,localEnd),previewFrameStep:1/packetFps,previewLabel:'Pacote interno concluído; revisão visual pendente'});}}}
 const storyboardById=new Map((blockStoryboard?.scenes||board.scenes||[]).map(s=>[s.id,s]));
 const scenes=[...(full.scenes||[])].sort((a,b)=>a.start-b.start);
 const totalDuration=Number(full.duration)||Math.max(0,...scenes.map(s=>s.start+s.duration));
 const blockSeconds=180,renderedIds=new Set(),activeSceneIds=new Set(activeSegment?.sceneIds||[]);
 const sceneItems=scenes.map(scene=>{
  const end=scene.start+scene.duration,packet=livePackets.get(scene.id),previewable=Boolean(packet)||(previewExists&&end<=previewDuration+.01);
  if(previewable)renderedIds.add(scene.id);
  const row=storyboardById.get(scene.id),withinActiveBlock=Boolean(fullVersion)||scene.start<blockSeconds;
  const isolated=packet|| (previewable?{previewUrl:previewPath,previewStart:Math.max(0,scene.start),previewEnd:Math.min(previewDuration,end),previewFrameStep:1/fps,previewLabel:'Amostra interna; trecho delimitado pela cena'}:{});
  const preRenderPreviewUrl=stagePreviewAvailable&&row&&withinActiveBlock?`${stagePreviewPath}?scene=${encodeURIComponent(scene.id)}&rev=${encodeURIComponent(blockStoryboard?.revision||'pre-render')}`:null;
  const sceneStatus=previewable?'rendered':activeSceneIds.has(scene.id)?'rendering':withinActiveBlock&&stagePreviewAvailable&&row?.visualPlan?.visibleEvent?'review':withinActiveBlock?'in_progress':'pending';
  const qaStatus=previewable?'Revisão da cena pendente':sceneStatus==='review'?'Prévia 3D pronta; revisão visual pendente':row?.visualPlan?.visibleEvent?'Storyboard pronto; prévia visual pendente':'Direção visual pendente';
  return {id:scene.id,title:scene.label||scene.title||scene.explanation?.slice(0,90)||scene.id,start:scene.start,duration:scene.duration,narration:scene.sourceText||scene.explanation||'',visualEvent:row?.visualPlan?.visibleEvent||'',attentionTarget:row?.visualPlan?.attentionTarget||'',cameraReveal:row?.visualPlan?.cameraReveal||'',plannedAssets:(row?.assets||[]).map(a=>a.id),status:sceneStatus,qaStatus,preRenderPreviewUrl,...(isolated)};
 });
 const blocks=[];let sceneOffset=0,blockStart=0;
 while(sceneOffset<sceneItems.length){
  const target=blockStart+blockSeconds;let boundary=sceneOffset;
  while(boundary<sceneItems.length&&sceneItems[boundary].start<target)boundary++;
  if(boundary===sceneOffset)boundary++;
  const items=sceneItems.slice(sceneOffset,boundary),start=items[0].start,last=items.at(-1),end=Math.min(totalDuration,last.start+last.duration),index=blocks.length;
  const isFirst=index===0,hasAuthoredBlock=isFirst&&Array.isArray(blockStoryboard?.scenes)&&blockStoryboard.scenes.length>0;
  const fmt=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  const renderedCount=items.filter(s=>Boolean(s.previewUrl)).length,isRendering=items.some(s=>s.status==='rendering');
  const status=(isFirst||fullVersion)?(renderedCount===items.length?'rendered':isRendering?'rendering':stagePreviewAvailable?'review':'in_progress'):'pending';
  const description=(isFirst||fullVersion)?(renderedCount===items.length?'Bloco completo disponível para revisão visual; assets e aprovação profissional permanecem pendentes.':isRendering?`Renderizando pacote de cenas; ${renderedCount}/${items.length} trechos já podem ser conferidos.`:stagePreviewAvailable?`Prévia 3D disponível para as ${items.length} cenas; ${renderedCount} também têm imagem no render diagnóstico. Captura do bloco aguarda autorização.`:`${renderedCount}/${items.length} cenas têm imagem disponível; storyboard dirigido, construção do bloco ainda continua.`):'Aguardando conclusão e revisão do bloco anterior.';
  blocks.push({id:`block-${String(index+1).padStart(2,'0')}`,title:`${fmt(start)}–${fmt(end)}`,start,end,status,description,scenes:items});
  sceneOffset=boundary;blockStart=end;
 }
 const planFile=path.join(base,fullVersion?'storyboard-v4-full.json':'storyboard-v3-block-01.json');
 const firstBlock=blocks[0],activeBlockProject=live?.plan.projectFile?.includes('/block-01/'),activeProgress=live?live.plan.segments.filter(s=>s.cached).length:0;
 let step=blockStoryboard?.scenes?.length
  ?`Construir e renderizar as cenas dirigidas do bloco 1 (${firstBlock?.title||'00:00–03:00'}); depois revisar os trechos isolados.`
  :`Direção cena a cena do bloco 1 (${firstBlock?.title||'00:00–aprox. 03:00'}), preservando a cena que cruza o marco de 3 minutos.`;
 if(live)step=activeSegment?`${activeBlockProject?'Bloco 01':'Prévia da abertura'} · pacote ${activeProgress+1}/${live.plan.segments.length}: ${activeSegment.id}`:`Montando a prévia de ${activeBlockProject?'Bloco 01':'abertura'} após ${live.plan.segments.length} pacotes.`;
 else if(stagePreviewAvailable)step=fullVersion?'Longa completo composto; revisão interna de cenas, narração e junções em andamento.':'Prévia 3D cena a cena disponível · revisão interna pendente.';
 const queue=[
  {label:sampleReview?'Amostra aprovada como direção e ritmo':'Amostra aguardando aprovação',status:sampleReview?'completed':'pending',detail:sampleReview?.note||'A produção integral continua sujeita ao gate visual, sonoro e de assets.'},
  {label:'Bloco 01 · storyboard exclusivo',status:blockStoryboard?.scenes?.length?'completed':'in_progress',detail:`${itemsCountInRange(scenes,0,blockSeconds)} cenas previstas neste trecho.`},
  {label:'Bloco 01 · prévia 3D antes do render',status:stagePreviewAvailable?'completed':'queued',detail:stagePreviewAvailable?'Cenas isoladas abertas no navegador em tempo real; nenhuma captura de vídeo iniciada.':'Preparando uma tela para conferir cada cena antes de autorizar a captura.'},
  {label:'Prévia interna da abertura',status:live&&!activeBlockProject?(activeSegment?'rendering':'assembling'):previewPath?.includes('qa-v14')?'completed':'queued',detail:`${previewExists?previewDuration.toFixed(1):'40,4'} s disponíveis; atualização não altera a aprovação de direção da amostra.`},
  {label:'Bloco 01 · inspeção da prévia por cena',status:activeBlockProject?(activeSegment?'rendering':'assembling'):(stagePreviewAvailable?'review':blocks[0]?.status==='rendered'?'review':'queued'),detail:blocks[0]?.description||'Storyboard cena a cena registrado; aguardando produção.'},
  ...blocks.slice(1).map(b=>({label:`${b.id.toUpperCase()} · ${b.title}`,status:fullVersion?'review':'queued',detail:fullVersion?'Encenação integrada ao longa; inspeção em movimento e correções em andamento.':'Aguardando o bloco anterior e a revisão visual.'}))
 ];
 const preRenderSceneCount=sceneItems.filter(s=>Boolean(s.preRenderPreviewUrl)).length;
 const preRenderDuration=blockStoryboard?.scenes?.length?Math.max(...blockStoryboard.scenes.map(s=>Number(s.start)+Number(s.duration))):0;
 const formatSeconds=seconds=>`${Math.floor(seconds/60)} min ${String(Math.round(seconds%60)).padStart(2,'0')} s`;
 const availableVisualIds=new Set(sceneItems.filter(s=>s.previewUrl||s.preRenderPreviewUrl).map(s=>s.id));
 const updateFiles=[path.join(base,'production-v3/source-project.json'),path.join(base,'project.json'),path.join(base,'storyboard-v3-block-01.json'),stagePreviewFile,path.join(base,'state.json')];
 const updateStats=(await Promise.all(updateFiles.map(file=>fs.stat(file).catch(()=>null)))).filter(Boolean).sort((a,b)=>b.mtimeMs-a.mtimeMs);
 const stat=updateStats[0]||{mtime:new Date(0)};
 return {project:{id:projectId,title:full.title||'Titanic',status:live?'Em produção':stagePreviewAvailable?'Em revisão interna':'Em produção',updatedAt:stat.mtime.toISOString(),previewScope:{duration:previewDuration,label:stagePreviewAvailable?`Prévia 3D: ${preRenderSceneCount} cenas · ${formatSeconds(preRenderDuration)} · ${renderedIds.size}/${scenes.length} com vídeo renderizado`:`${previewExists?'Amostra renderizada':'Nenhuma amostra renderizada'}: ${previewDuration.toFixed(1)} s de ${(totalDuration/60).toFixed(1)} min · ${renderedIds.size}/${scenes.length} cenas com vídeo`},sampleApproval:sampleReview},progress:{completed:availableVisualIds.size,total:scenes.length,percent:scenes.length?Math.round(availableVisualIds.size/scenes.length*1000)/10:0,label:`${preRenderSceneCount} cenas com prévia 3D; montagem completa em revisão interna`},blocks,queue,currentStep:step,updatedAt:stat.mtime.toISOString(),source:{previewSeconds:previewDuration,previewArtifact:previewExists?previewPath:null,previewIsInternal:true,preRenderSceneCount,blockStoryboardFile:planFile,blockStoryboardReady:Boolean(blockStoryboard?.scenes?.length),fullNarrationSeconds:totalDuration}};
}
function itemsCountInRange(scenes,start,end){return scenes.filter(s=>s.start>=start&&s.start<end).length;}
export async function startServer({port=4173,host=process.env.HOST||'127.0.0.1',reviewsFile=path.join(ROOT,'kit/catalog/reviews.json'),backlogFile=path.join(ROOT,'kit/catalog/backlog.json')}={}){
 if(host!=='localhost'&&isIP(host)!==4)throw new Error('Use localhost, 127.0.0.1 ou um IPv4 específico da interface; 0.0.0.0 não é permitido.');
 if(host==='0.0.0.0')throw new Error('Vincule o servidor a um IPv4 específico, não a todas as interfaces.');
 let listeningPort=port,allowedHosts=new Set();
 const store=new ReviewStore(reviewsFile),backlog=new BacklogStore(backlogFile);let catalog=await buildCatalog();
 const server=http.createServer(async(req,res)=>{
  const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   const requestHost=(req.headers.host||'').toLowerCase();if(!allowedHosts.has(requestHost))return json(403,{error:'Host não autorizado.'});
   const url=new URL(req.url,'http://localhost'),p=decodeURIComponent(url.pathname);
   if(req.method==='POST'){
    const origin=req.headers.origin;if(!origin||new URL(origin).host.toLowerCase()!==requestHost)return json(403,{error:'Origem não autorizada.'});
    if(req.headers['content-type']!=='application/json')return json(415,{error:'Envie JSON.'});
    let raw='';for await(const c of req){raw+=c;if(Buffer.byteLength(raw)>200000)return json(413,{error:'Pedido muito grande.'});}let data;try{data=JSON.parse(raw);}catch{return json(400,{error:'JSON inválido.'});}
    if(p==='/api/scene-corrections'){
     if(!/^[a-z0-9-]+$/.test(data.projectId||'')||!/^[a-zA-Z0-9_-]{1,100}$/.test(data.id||''))return json(400,{error:'Identificação inválida.'});
     const base=path.join(ROOT,'kit/projects',data.projectId),project=await readJson(path.join(base,'production-v4/source-project.json'),null)||await readJson(path.join(base,'production-v3/source-project.json'),null),shot=project?.scenes?.find(s=>s.id===data.sceneId);
     if(!shot)return json(404,{error:'Cena não encontrada.'});
     if(!Number.isFinite(data.globalTime)||!Number.isFinite(data.localTime)||data.localTime<0||data.localTime>shot.duration+.1||data.globalTime<shot.start-.1||data.globalTime>shot.start+shot.duration+.1)return json(400,{error:'Instante fora da cena.'});
     if(!['scene-note','scene-direction'].includes(data.kind)||typeof data.note!=='string'||data.note.length>4000)return json(400,{error:'Correção inválida.'});
     let proposedOverride=null;
     if(data.proposedOverride){const v=data.proposedOverride,vec=a=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isFinite(n)&&Math.abs(n)<100000);if(!vec(v.camera?.from)||!vec(v.camera?.target)||!Number.isFinite(v.camera?.fov)||v.camera.fov<5||v.camera.fov>140||!Number.isFinite(v.render?.exposure)||v.render.exposure<.05||v.render.exposure>10||!Number.isFinite(v.render?.lightMultiplier)||v.render.lightMultiplier<0||v.render.lightMultiplier>10)return json(400,{error:'Direção de câmera ou luz inválida.'});proposedOverride={camera:{from:v.camera.from,target:v.camera.target,fov:v.camera.fov},render:{exposure:v.render.exposure,lightMultiplier:v.render.lightMultiplier},scope:'scene-local-instant'};}
     const saved={schemaVersion:1,id:data.id,createdAt:new Date().toISOString(),projectId:data.projectId,sceneId:data.sceneId,globalTime:data.globalTime,localTime:data.localTime,sourceGlobalTime:Number.isFinite(data.sourceGlobalTime)?data.sourceGlobalTime:data.globalTime,note:data.note.trim(),kind:data.kind,proposedOverride,status:'requested',source:'creator-preview',approval:false},dir=path.join(base,'scene-corrections');await fs.mkdir(dir,{recursive:true});try{await fs.writeFile(path.join(dir,saved.id+'.json'),JSON.stringify(saved,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code==='EEXIST')return json(409,{error:'Correção já registrada.'});throw e;}return json(201,{saved:true,correction:saved});
    }
    const sceneReviewWrite=/^\/api\/scene-review\/([a-z0-9-]+)$/.exec(p);if(sceneReviewWrite){const projectId=sceneReviewWrite[1];if(projectId!=='casa-sertao-calor')return json(404,{error:'Projeto sem revisão de cena configurada.'});const base=path.join(ROOT,'kit/projects',projectId),beats=await readJson(path.join(base,'beats.json'),null);if(!beats?.scenes?.some(s=>s.id===data.sceneId))return json(404,{error:'Cena não encontrada.'});if(!['approved','changes'].includes(data.status))return json(400,{error:'Decisão inválida.'});const note=typeof data.note==='string'?data.note.trim():'';if(note.length>1500)return json(400,{error:'A observação excede o limite.'});if(data.status==='changes'&&!note)return json(400,{error:'Descreva o ajuste pedido.'});const reviewFile=path.join(base,'scene-review.json'),saved=await readJson(reviewFile,{schemaVersion:1,projectId,scenes:{}});saved.scenes[data.sceneId]={status:data.status,note,reviewedAt:new Date().toISOString(),reviewer:'usuario-local',channel:'scene-preview'};saved.updatedAt=new Date().toISOString();await fs.writeFile(reviewFile+'.tmp',JSON.stringify(saved,null,2)+'\n');await fs.rename(reviewFile+'.tmp',reviewFile);const stateFile=path.join(base,'state.json'),state=await readJson(stateFile,{}),allApproved=beats.scenes.every(s=>saved.scenes[s.id]?.status==='approved');state.approvals={...(state.approvals||{}),scenes:allApproved};if(allApproved){state.stage='scene-approval-complete-assets-pending';state.label='As 13 cenas foram aprovadas; revisões individuais dos assets e escolha da voz continuam pendentes.';state.pending=['Concluir aprovação individual dos assets e do plano de recursos.','Escolher a voz; depois fixar tempos, montar e revisar o vídeo renderizado.'];state.next_action='Validar os recursos individuais em cena e escolher a voz antes da composição final.';}else{state.stage='scene-review-awaiting-validation';state.label='Cenas 3D em revisão visual do criador.';state.next_action='Continuar revisando as cenas na prévia visual.';}await fs.writeFile(stateFile+'.tmp',JSON.stringify(state,null,2)+'\n');await fs.rename(stateFile+'.tmp',stateFile);return json(200,{sceneId:data.sceneId,decision:saved.scenes[data.sceneId],reviews:saved.scenes,approvedCount:beats.scenes.filter(s=>saved.scenes[s.id]?.status==='approved').length,total:beats.scenes.length});}
    if(p==='/api/reviews'){catalog=await buildCatalog();const a=catalog.assets.find(a=>a.id===data.id);if(!a)return json(404,{error:'Recurso não encontrado.'});return json(200,await store.save(a,data));}
 if(p==='/api/project-plan-review'){catalog=await buildCatalog();const result=await approveProjectPlan(ROOT,data.projectId,catalog,data.fingerprint,'studio');return json(200,{fingerprint:result.fingerprint,approved:true,reviewedAt:result.reviewedAt});}
    if(p==='/api/analyze'){if(typeof data.text!=='string'||data.text.length>50000)return json(400,{error:'Roteiro inválido.'});catalog=await buildCatalog();return json(200,analyzeNarrative(data.text,catalog));}
    return json(404,{error:'Rota não encontrada.'});
   }
   if(req.method!=='GET')return json(405,{error:'Método não permitido.'});
   const packetMatch=/^\/api\/production\/([a-z0-9-]+)\/packets\/([a-f0-9]{64})\.mp4$/.exec(p);if(packetMatch){const live=await liveRenderPlan(packetMatch[1]),segment=live?.plan.segments.find(s=>s.hash===packetMatch[2]);if(!live||!(await packetAvailable(live,segment)))return json(404,{error:'Pacote de prévia ainda não está disponível.'});const file=path.resolve(segment.output),stat=await fs.stat(file),headers={'Content-Type':'video/mp4','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Accept-Ranges':'bytes'};if(req.headers.range){const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range)return json(416,{error:'Intervalo inválido.'});const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${stat.size}`});createReadStream(file,{start,end}).pipe(res);return;}res.writeHead(200,{...headers,'Content-Length':stat.size});createReadStream(file).pipe(res);return;}
   if(p==='/api/catalog'){catalog=await buildCatalog();return json(200,{...catalog,reviews:await store.read(),backlog:await backlog.read()});}
   if(p==='/api/backlog'){
    catalog=await buildCatalog();const data=await backlog.read(),reviews=await store.read();return json(200,{...data,items:data.items.map(item=>{const asset=catalog.assets.find(a=>a.id===item.assetId);if(!asset)return item;const variants=asset.variants.length?asset.variants:[''],states=variants.map(v=>statusFor(asset,v,reviews));return {...item,stage:states.every(s=>s==='approved')?'ready':states.includes('changes')?'changes':'review',revision:asset.revision};})});
   }
   const sceneReviewRead=/^\/api\/scene-review\/([a-z0-9-]+)$/.exec(p);if(sceneReviewRead){const projectId=sceneReviewRead[1];if(projectId!=='casa-sertao-calor')return json(404,{error:'Projeto sem revisão de cena configurada.'});const base=path.join(ROOT,'kit/projects',projectId),beats=await readJson(path.join(base,'beats.json'),null),saved=await readJson(path.join(base,'scene-review.json'),{scenes:{}});if(!beats?.scenes)return json(404,{error:'Cenas ainda não dirigidas.'});return json(200,{projectId,scenes:beats.scenes,reviews:saved.scenes||{},approvedCount:beats.scenes.filter(s=>saved.scenes?.[s.id]?.status==='approved').length,total:beats.scenes.length});}
   if(p==='/api/projects'){const dirs=await fs.readdir(path.join(ROOT,'kit/projects'),{withFileTypes:true}),projects=[];for(const dir of dirs.filter(d=>d.isDirectory())){const base=path.join(ROOT,'kit/projects',dir.name);const state=await readJson(path.join(base,'state.json'),null);if(state){let narration='';try{narration=await fs.readFile(path.join(base,'narration.txt'),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}const plan=await readJson(path.join(base,'asset-plan.json'),null);const planCurrent=plan?.narrative===false?narration.trim()===''&&plan.narrationHash===null:!!plan&&plan.narrationHash===textHash(narration);projects.push({...state,id:dir.name,narration,plan,planCurrent});}}return json(200,{projects});}
   const productionMatch=/^\/api\/production\/([a-z0-9-]+)$/.exec(p);if(productionMatch){const snapshot=await productionSnapshot(productionMatch[1]);return snapshot?json(200,snapshot):json(404,{error:'Projeto não encontrado.'});}
   if(p==='/api/project-plan-review'){catalog=await buildCatalog();const result=await projectPlan(ROOT,url.searchParams.get('projectId')||'',catalog);return json(200,{fingerprint:result.fingerprint,approved:result.approved,reviewedAt:result.reviewedAt});}
   if(p==='/preview/historia-rockstar'||p==='/preview/historia-rockstar/'){res.writeHead(302,{Location:'/preview/historia-rockstar/index.html'}).end();return;}
   if(p==='/preview/casa-sertao-calor'||p==='/preview/casa-sertao-calor/'){res.writeHead(302,{Location:'/preview/casa-sertao-calor/index.html'}).end();return;}
   const routes=[['/studio/',path.join(ROOT,'studio')],['/vendor/three/',path.join(ROOT,'node_modules/three')],['/vendor/gsap/',path.join(ROOT,'node_modules/gsap')],['/kit-video-3d/assets/',path.join(ROOT,'kit-video-3d/assets')],['/kit/assets/',path.join(ROOT,'kit/assets')],['/kit/engine/',path.join(ROOT,'kit/engine')],['/kit/audio/previews/',path.join(ROOT,'kit/audio/previews')],['/preview/casa-sertao-calor/',path.join(ROOT,'kit/projects/casa-sertao-calor/preview')],['/preview/historia-rockstar/',path.join(ROOT,'kit/projects/historia-rockstar/preview')],['/preview/wan2gp-clips/',path.join(ROOT,'kit/projects/arco-alvenaria-wan2gp/wan2gp-output')],['/preview/wan2gp-comparison/',path.join(ROOT,'kit/projects/arco-alvenaria-wan2gp/render')],['/preview/arco-alvenaria/',path.join(ROOT,'kit/projects/arco-alvenaria/hyperframes')],['/preview/titanic-completo/final/',path.join(ROOT,'kit/projects/titanic-completo/production-v4/render')],['/preview/titanic-completo/',path.join(ROOT,'kit/projects/titanic-completo/hyperframes')],['/preview/titanic-pilot/',path.join(ROOT,'kit/projects/titanic-pilot/player')]];
   if(p==='/'){res.writeHead(302,{Location:'/studio/index.html'}).end();return;}
   const route=routes.find(([prefix])=>p.startsWith(prefix));if(!route)return json(404,{error:'Arquivo não encontrado.'});
   const candidate=path.resolve(route[1],p.slice(route[0].length));if(!candidate.startsWith(route[1]+path.sep))return json(403,{error:'Caminho inválido.'});
   const file=await fs.realpath(candidate),base=await fs.realpath(route[1]);if(!file.startsWith(base+path.sep)||path.relative(base,file).split(path.sep).some(v=>v.startsWith('.')))return json(403,{error:'Caminho não permitido.'});
   const stat=await fs.stat(file);if(!stat.isFile()||!types[path.extname(file)])return json(404,{error:'Arquivo não encontrado.'});
   const html=path.extname(file)==='.html'?await fs.readFile(file,'utf8'):'';
   const scriptHashes=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].filter(m=>m[1].trim()).map(m=>`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`).join(' ');
   const headers={'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':`default-src 'self'; script-src 'self' ${scriptHashes}; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`,'Accept-Ranges':'bytes'};
   if(req.headers.range){const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!range)return json(416,{error:'Intervalo inválido.'});const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${stat.size}`});createReadStream(file,{start,end}).pipe(res);return;}
   res.writeHead(200,{...headers,'Content-Length':stat.size});createReadStream(file).pipe(res);
  }catch(e){json(e.status||(['ENOENT','ENOTDIR'].includes(e.code)?404:500),{error:e.code==='ENOENT'?'Arquivo não encontrado.':e.message});}
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});listeningPort=server.address().port;allowedHosts=new Set([`${host}:${listeningPort}`.toLowerCase(),`127.0.0.1:${listeningPort}`,`localhost:${listeningPort}`]);return {server,port:listeningPort,host};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const host=process.env.HOST||'127.0.0.1';const {port}=await startServer({port:Number(process.env.PORT)||4173,host});console.log(`Biblioteca 3D · http://${host}:${port}`);}
