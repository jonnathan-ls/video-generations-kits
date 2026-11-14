#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { once } from 'node:events';
import { planSegments, segmentDependencies, createSegmentProject, digest, quantizeProject, segmentFontLayout } from './segment-plan.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
async function json(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
async function write(file, value) { await fs.mkdir(path.dirname(file), {recursive:true}); const tmp = `${file}.${process.pid}.tmp`; await fs.writeFile(tmp, JSON.stringify(value,null,2)+'\n'); await fs.rename(tmp,file); }
export function run(command, args, options = {}) {
  return new Promise((resolve,reject) => {
    const child = spawn(command,args,{stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32',...options}); let output=''; const sink=options.logFile?createWriteStream(options.logFile,{flags:'w'}):null; let escalation;const signal=()=>{try{process.platform==='win32'?child.kill('SIGTERM'):process.kill(-child.pid,'SIGTERM');}catch{} escalation=setTimeout(()=>{try{process.platform==='win32'?child.kill('SIGKILL'):process.kill(-child.pid,'SIGKILL');}catch{}},5000);};process.once('SIGINT',signal);process.once('SIGTERM',signal); const cleanup=()=>{clearTimeout(escalation);process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);sink?.end();};
    for (const stream of [child.stdout,child.stderr]) stream.on('data',chunk=>{ output+=chunk;sink?.write(chunk); if(!options.quiet)process.stderr.write(chunk); });
    child.on('error',error=>{cleanup();reject(error);}); child.on('close',async code=>{cleanup();if(sink&&!sink.writableFinished)await once(sink,'finish');code===0?resolve(output):reject(new Error(`${command} terminou ${code}: ${output.slice(-5000)}`));});
  });
}
export async function assertDeliveryReady(projectFile,catalog) {
  const [{validateProduction},{ReviewStore},{BacklogStore},{validateProjectPlanUse},{validateQa,qaFingerprint}]=await Promise.all([import('./production.mjs'),import('./reviews.mjs'),import('./backlog.mjs'),import('./project-plan-review.mjs'),import('./qa-gate.mjs')]);
  const original=await json(projectFile),reviews=await new ReviewStore(path.join(ROOT,'kit/catalog/reviews.json')).read(),backlog=await new BacklogStore(path.join(ROOT,'kit/catalog/backlog.json')).read();
  const validation=validateProduction(original,catalog,reviews),qa=await validateQa(projectFile,catalog);
  const errors=[...validation.errors,...await validateProjectPlanUse(ROOT,projectFile,original,catalog,backlog),...qa.errors];
  if(errors.length)throw new Error('Delivery bloqueado: '+errors.join('\n'));
  return {sourceFingerprint:await qaFingerprint(projectFile,catalog),status:'authorized-for-clean-render',finalArtifactQa:'pending'};
}
const renderCodeFiles=()=>[fileURLToPath(import.meta.url),path.join(ROOT,'kit/tools/segment-plan.mjs'),path.join(ROOT,'kit/tools/export-hyperframes.mjs'),path.join(ROOT,'package.json')];
async function assertSegmentCurrent(plan,segment){
  const raw=await fs.readFile(plan.projectFile);if(digest(raw)!==plan.sourceHash)throw new Error('Projeto mudou durante render; pacote não será registrado no cache.');
  let project=JSON.parse(raw);if(plan.quantization)project=quantizeProject(project).project;
  const {hash}=await segmentDependencies(project,segment,{root:ROOT,projectFile:plan.projectFile,catalog:await json(path.join(ROOT,'kit/catalog/registry.json')),codeFiles:renderCodeFiles()});
  if(digest({visualHash:hash,mode:plan.mode})!==segment.hash)throw new Error('Código/asset mudou durante render; replanejar antes de reutilizar pacote.');
}
export function cacheReceiptValid(receipt,segment,mode,videoHash,size) { return receipt.hash===segment.hash&&(receipt.mode||'internal-qa')===mode&&receipt.frames===segment.frameCount&&receipt.videoHash===videoHash&&size>0; }
export async function planProject(projectFile, options = {}) {
  projectFile = path.resolve(projectFile);
  let project = await json(projectFile);
  const quantization=options.quantize?quantizeProject(project):null;if(quantization)project=quantization.project;
  const catalog = options.catalog || (options.mode==='delivery'?await (await import('./build-catalog.mjs')).buildCatalog():await json(path.join(ROOT,'kit/catalog/registry.json')));
  const mode=options.mode||'internal-qa';if(!['internal-qa','delivery'].includes(mode))throw new Error('Modo inválido.');
  const readiness=mode==='delivery'?await assertDeliveryReady(projectFile,catalog):null;
  const plan = planSegments(project,options);
  plan.projectFile = projectFile;
  plan.cacheRoot = path.resolve(options.cacheRoot || path.join(path.dirname(projectFile),'.render-segments'));
  plan.mode = mode;if(readiness)plan.readiness=readiness;plan.sourceHash=digest(await fs.readFile(projectFile));
  if(quantization)plan.quantization=quantization.report;
  for (const segment of plan.segments) {
    Object.assign(segment,await segmentDependencies(project,segment,{root:ROOT,projectFile,catalog,codeFiles:renderCodeFiles()}));
    segment.hash=digest({visualHash:segment.hash,mode});
    segment.directory = path.join(plan.cacheRoot,segment.hash);
    segment.output = path.join(segment.directory,'clip.mp4');
    try {
      const receipt=await json(path.join(segment.directory,'receipt.json'));
      const info=await fs.stat(segment.output);
      segment.cached = cacheReceiptValid(receipt,segment,mode,digest(await fs.readFile(segment.output)),info.size);
    } catch { segment.cached=false; }
  }
  return plan;
}
export async function exportSegmentProjects(plan) {
  if(digest(await fs.readFile(plan.projectFile))!==plan.sourceHash)throw new Error('Projeto mudou após planejamento; replanejar.');
  let project = await json(plan.projectFile);if(plan.quantization)project=quantizeProject(project).project;
  for (const segment of plan.segments) {
    await fs.mkdir(segment.directory,{recursive:true});
    const clip=createSegmentProject(project,segment);
    // Font sources must remain local to the exported project directory.
    if(clip.fonts?.length) {
      await fs.mkdir(path.join(segment.directory,'fonts'),{recursive:true});
      for(const [index,font]of clip.fonts.entries()) {
        const source=path.resolve(path.dirname(plan.projectFile),font.source),name=`${index}-${path.basename(source)}`;
        await fs.copyFile(source,path.join(segment.directory,'fonts',name)); font.source=`fonts/${name}`;
      }
    }
    clip.segmentSource={project:plan.projectFile,sourceHash:plan.sourceHash,mode:plan.mode,quantize:Boolean(plan.quantization),startFrame:segment.startFrame,endFrame:segment.endFrame,hash:segment.hash};
    await write(path.join(segment.directory,'project.json'),clip);
    await write(path.join(segment.directory,'dependencies.json'),{hash:segment.hash,files:segment.dependencies,usedAssetIds:segment.usedAssetIds});
  }
  await write(path.join(plan.cacheRoot,'plan.json'),plan);
  return plan;
}
export async function withGpuLock(cacheRoot, callback) {
  // Global per-user lock, not per project: two chats cannot saturate the same GPU.
  const lock=path.join(process.env.XDG_RUNTIME_DIR || '/tmp',`video-kit-gpu-${process.getuid?.() ?? 'user'}.lock`);
  let handle;
  try { handle=await fs.open(lock,'wx'); }
  catch(error) {
    if(error.code!=='EEXIST')throw error;
    let owner;try{owner=await json(lock);}catch{throw new Error(`GPU lock ilegível ${lock}; verificar processo antes de remover.`);}
    try { process.kill(owner.pid,0); } catch(error) { if(error.code==='ESRCH'){await fs.unlink(lock);return withGpuLock(cacheRoot,callback);} throw error; }
    throw new Error(`GPU ocupada pela fila PID ${owner.pid}. Nenhum segundo render iniciado.`);
  }
  try { await handle.writeFile(JSON.stringify({pid:process.pid,cacheRoot}));return await callback(); }
  finally {await handle.close();await fs.unlink(lock).catch(()=>{});}
}
export async function probeVideo(file) {
  const info=JSON.parse(await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{quiet:true}));
  const video=info.streams.find(s=>s.codec_type==='video');if(!video)throw new Error(`Sem vídeo ${file}.`);
  return {video,info};
}
async function latestCheckReport(directory) {
  const root=path.join(directory,'.hyperframes','artifacts','checks');
  let files;try{files=(await fs.readdir(root)).filter(name=>name.endsWith('.json'));}catch{return null;}
  const reports=await Promise.all(files.map(async name=>{const file=path.join(root,name);try{return {file,mtime:(await fs.stat(file)).mtimeMs,value:await json(file)};}catch{return null;}}));
  return reports.filter(Boolean).sort((a,b)=>b.mtime-a.mtime)[0]?.value||null;
}
function isBrowserCleanupOnly(report) {
  if(!report?.runtime?.findings?.length)return false;
  const cleanupCodes=new Set(['check_runtime_failure','check_cleanup_failure']);
  if(report.runtime.findings.some(finding=>!cleanupCodes.has(finding.code)||!/browser process did not exit after forced shutdown/i.test(finding.message||'')))return false;
  return Object.entries(report).every(([name,section])=>name==='runtime'||!section||typeof section!=='object'||Number(section.errorCount||0)===0);
}
export async function renderPlan(plan,{cli,only=[]}={}) {
  if(only.some(id=>!plan.segments.some(s=>s.id===id)))throw new Error('Pacote --only inexistente.');
  if(plan.mode==='delivery'){const catalog=await json(path.join(ROOT,'kit/catalog/registry.json'));await assertDeliveryReady(plan.projectFile,catalog);}
  if(!cli)throw new Error('Informe --cli /caminho/hyperframes/dist/cli.js (instalação local existente).');
  await exportSegmentProjects(plan);
  return withGpuLock(plan.cacheRoot,async()=>{
    for(const segment of plan.segments.filter(s=>!only.length||only.includes(s.id))) {
      if(segment.cached)continue;
      await assertSegmentCurrent(plan,segment);
      const out=path.join(segment.directory,'hyperframes');
      await run(process.execPath,[path.join(ROOT,'kit/tools/export-hyperframes.mjs'),path.join(segment.directory,'project.json'),...(plan.mode==='delivery'?['--segment-origin',plan.projectFile]:['--internal-qa']),'--output',out]);
      // Diagnostic review UI is a separate HTML player. Internal MP4 capture
      // must stay visually clean; QA state lives in receipts/player metadata.
      try {
        await run(process.execPath,[cli,'check','--json','--no-contrast','--browser-gpu'],{cwd:out,env:{...process.env,__NV_PRIME_RENDER_OFFLOAD:'1',__GLX_VENDOR_LIBRARY_NAME:'nvidia'}});
      } catch(error) {
        const report=await latestCheckReport(out);
        if(!isBrowserCleanupOnly(report))throw error;
        console.warn(`[QA] ${segment.id}: HyperFrames concluiu as verificações da página, mas falhou ao encerrar o navegador auxiliar. Sem erros de composição no relatório; validação de GPU, captura e frames continua obrigatória.`);
      }
      const temporary=path.join(segment.directory,'rendering.mp4');
      const log=await run(process.execPath,[cli,'render','--fps',String(plan.fps),'--browser-gpu','--gpu','--no-low-memory-mode','--workers','1','--quality','high','--output',temporary],{cwd:out,logFile:path.join(segment.directory,'render.log'),env:{...process.env,__NV_PRIME_RENDER_OFFLOAD:'1',__GLX_VENDOR_LIBRARY_NAME:'nvidia'}});
      if(/SwiftShader|software gpu|screenshot capture|Error creating WebGL/i.test(log)||!/browserGpuMode probe.*hardware/i.test(log)||!/NVIDIA|RTX/i.test(log)||!(/beginframe capture/i.test(log)||(/captureMode[\"\s:=]+beginframe/i.test(log)&&/captureOperation[\"\s:=]+beginFrame/i.test(log))))throw new Error('Prova de composição GPU ausente/incorreta. Clip não entra no cache.');
      const {video}=await probeVideo(temporary);
      if(!/h264_nvenc|hevc_nvenc/i.test(video.tags?.encoder||''))throw new Error('Encoder NVENC não comprovado no arquivo. Clip não entra no cache.');
      if(video.width!==plan.width||video.height!==plan.height||!Number.isFinite(Number(video.nb_frames))||Number(video.nb_frames)!==segment.frameCount)throw new Error(`Clip ${segment.id} incompatível com plano/frame count.`);
      await assertSegmentCurrent(plan,segment);
      await fs.rename(temporary,segment.output);
      await write(path.join(segment.directory,'receipt.json'),{hash:segment.hash,frames:segment.frameCount,videoHash:digest(await fs.readFile(segment.output)),mode:plan.mode,internalQa:plan.mode!=='delivery',approved:false});
      segment.cached=true;await write(path.join(plan.cacheRoot,'plan.json'),plan);
    }
    return plan;
  });
}
export function concatLine(file) { if(/[\r\n]/.test(file))throw new Error('Nome de arquivo contém quebra de linha.');return `file '${file.replaceAll("'", "'\\''")}'`; }
export async function assemblePlan(plan,output,{audioFile}={}) {
  if(plan.mode==='delivery')await assertDeliveryReady(plan.projectFile,await json(path.join(ROOT,'kit/catalog/registry.json')));
  if(plan.segments.some(s=>!s.cached))throw new Error('Montagem bloqueada: pacotes ausentes ou inválidos.');
  for (const segment of plan.segments) { const receipt=await json(path.join(segment.directory,'receipt.json')); if(receipt.hash!==segment.hash||(receipt.mode||'internal-qa')!==(plan.mode||'internal-qa')||receipt.videoHash!==digest(await fs.readFile(segment.output)))throw new Error(`Clip alterado/sem recibo íntegro: ${segment.id}.`); }
  const probes=await Promise.all(plan.segments.map(s=>probeVideo(s.output)));
  const signature=v=>JSON.stringify([v.codec_name,v.width,v.height,v.pix_fmt,v.r_frame_rate,v.time_base,v.profile,v.level,v.extradata_size]);
  if(probes.some(p=>signature(p.video)!==signature(probes[0].video)))throw new Error('Clips incompatíveis para concat copy. Renderize com configuração única.');
  for(const [i,p]of probes.entries())if(Number(p.video.nb_frames)!==plan.segments[i].frameCount)throw new Error('Contagem de frames mudou desde render.');
  const list=path.join(plan.cacheRoot,'concat.ffconcat');await fs.writeFile(list,'ffconcat version 1.0\n'+plan.segments.map(s=>concatLine(s.output)).join('\n')+'\n');
  output=path.resolve(output);await fs.mkdir(path.dirname(output),{recursive:true});
  const tmp=path.join(path.dirname(output),`.assembling-${process.pid}.mp4`);
  const args=['-y','-v','error','-f','concat','-safe','0','-i',list];
  if(audioFile)args.push('-i',path.resolve(audioFile),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-af',`apad,atrim=duration=${plan.totalFrames/plan.fps}`);
  else args.push('-map','0:v:0','-an','-c:v','copy');
  args.push('-t',String(plan.totalFrames/plan.fps),'-movflags','+faststart',tmp);await run('ffmpeg',args);
  const {video}=await probeVideo(tmp);if(Number(video.nb_frames)!==plan.totalFrames)throw new Error('Montagem final com frame count incorreto.');
  await fs.rename(tmp,output);
  await write(output+'.receipt.json',{mode:plan.mode,internalQa:plan.mode!=='delivery',approved:false,sourceHash:plan.sourceHash,readiness:plan.readiness,artifactSha256:digest(await fs.readFile(output)),finalArtifactQa:'pending',frames:plan.totalFrames,segments:plan.segments.map(s=>({id:s.id,hash:s.hash})),audioFile:audioFile||null});
  return output;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,input,...argv]=process.argv.slice(2);
  const option=name=>{const i=argv.indexOf(name);return i>=0?argv[i+1]:undefined;};
  if(!['plan','status','export','render','assemble'].includes(command)||!input)throw new Error('Uso: render-segments.mjs plan|status|export|render|assemble project.json [--target-seconds 20] [--cache-root dir] [--cli file] [--only id,id] [--output file] [--audio mix.wav]. Tudo é QA interno.');
  const plan=await planProject(input,{targetSeconds:Number(option('--target-seconds')||20),cacheRoot:option('--cache-root'),quantize:argv.includes('--quantize'),mode:argv.includes('--delivery')?'delivery':'internal-qa'});
  if(command==='export')await exportSegmentProjects(plan);
  if(command==='render')await renderPlan(plan,{cli:option('--cli'),only:option('--only')?.split(',')});
  if(command==='assemble'){if(!option('--output'))throw new Error('--output obrigatório.');await assemblePlan(plan,option('--output'),{audioFile:option('--audio')});}
  console.log(JSON.stringify({command,mode:plan.mode,packets:plan.segments.length,cached:plan.segments.filter(s=>s.cached).length,totalFrames:plan.totalFrames,quantization:plan.quantization,segments:plan.segments.map(({id,startFrame,endFrame,hash,cached,reviewBlock})=>({id,startFrame,endFrame,hash,cached,reviewBlock}))},null,2));
}
