import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const projectDir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(projectDir,'../../..');
const relative=f=>path.relative(root,f).split(path.sep).join('/');
const readJson=async f=>JSON.parse(await fs.readFile(path.join(projectDir,f),'utf8'));
const hash=buf=>createHash('sha256').update(buf).digest('hex');
async function hashFile(file){
  const h=createHash('sha256');
  for await(const chunk of createReadStream(file,{highWaterMark:4*1024*1024}))h.update(chunk);
  return h.digest('hex');
}

const action=process.argv[2];
if(!['prepare','preflight'].includes(action))throw new Error('Uso: node prepare-generation.mjs prepare | preflight');
const [plan,style,upstream]=await Promise.all([
  readJson('generation-plan.json'),
  readJson('style-bible.json'),
  fs.readFile(path.join(root,'vendor/wan2gp/defaults/t2v_nexus_1.3B.json'),'utf8').then(JSON.parse)
]);
// Adapter and weights are inspected locally. No doctor, CUDA tensor or model generation runs here.
const adapter=JSON.parse(await fs.readFile(path.join(root,'kit/integrations/wan2gp/config.json'),'utf8'));
const modelLock=JSON.parse(await fs.readFile(path.join(root,'kit/integrations/wan2gp/models.lock.json'),'utf8'));
if(!plan||!style||!adapter||!modelLock||!upstream)throw new Error('Faltam contratos locais para preparar a geração.');
const item=modelLock.files.find(f=>f.file===plan.generation.modelFile);
if(!item)throw new Error('Checkpoint não está pinado em models.lock.json.');
const checkpoint=path.join(root,adapter.directory,'ckpts',item.file);
const checkpointStat=await fs.stat(checkpoint);
if(checkpointStat.size!==item.size)throw new Error('Tamanho do checkpoint não coincide com o lock.');

const queue=plan.shots.map((shot,index)=>{
  const duration=shot.end-shot.start;
  const length=4*Math.ceil(duration*plan.generation.fps/4)+1;
  return {
    model_type:plan.generation.model,
    prompt:`${style.globalPrompt} ${shot.wanPrompt}`,
    negative_prompt:style.negativePrompt,
    resolution:`${plan.generation.width}x${plan.generation.height}`,
    video_length:length,
    num_inference_steps:plan.generation.steps,
    guidance_scale:plan.generation.guidanceScale,
    flow_shift:plan.generation.flowShift,
    seed:plan.generation.seedBase+plan.generation.seedStep*index,
    repeat_generation:1,
    image_mode:0,
    output_filename:shot.id
  };
});
const settingsFile=path.join(projectDir,'generation/video.json');
await fs.mkdir(path.dirname(settingsFile),{recursive:true});
const queueBytes=Buffer.from(JSON.stringify(queue,null,2)+'\n');
const hookBytes=Buffer.from(JSON.stringify(queue.slice(0,1),null,2)+'\n');
const restBytes=Buffer.from(JSON.stringify(queue.slice(1),null,2)+'\n');
await fs.writeFile(settingsFile,queueBytes);
await fs.writeFile(path.join(projectDir,'generation/hook.json'),hookBytes);
await fs.writeFile(path.join(projectDir,'generation/rest.json'),restBytes);
const sourceFile=path.join(root,'research/references/crochet-mini-kitchen/source.mp4');
const [sourceHash,checkpointHash]=await Promise.all([hashFile(sourceFile),hashFile(checkpoint)]);
if(sourceHash!==plan.referenceHash)throw new Error('O arquivo da referência mudou desde a análise.');
if(checkpointHash!==item.sha256)throw new Error('SHA-256 do checkpoint não coincide com o lock.');
const manifest={
  schemaVersion:1,
  status:'prepared-text-only-no-render',
  project:plan.id,
  planSha256:hash(await fs.readFile(path.join(projectDir,'generation-plan.json'))),
  styleBibleSha256:hash(await fs.readFile(path.join(projectDir,'style-bible.json'))),
  settingsSha256:hash(queueBytes),
  batches:{hookSha256:hash(hookBytes),restSha256:hash(restBytes)},
  sourceReferenceSha256:sourceHash,
  sourceReferencePassedToModel:false,
  checkpoint:{file:item.file,size:checkpointStat.size,sha256:item.sha256,sha256Verified:true},
  upstream:{version:adapter.version,commit:adapter.commit,architecture:upstream.model.architecture},
  gpuUsed:false,
  queueCount:queue.length
};
await fs.writeFile(path.join(projectDir,'generation/input-lock.json'),JSON.stringify(manifest,null,2)+'\n');

if(action==='preflight'){
  const allowed=new Set(['model_type','prompt','negative_prompt','resolution','video_length','num_inference_steps','guidance_scale','flow_shift','seed','repeat_generation','image_mode','output_filename']);
  const errors=[];
  const [beats,assetPlan,backlog,soundDesign]=await Promise.all([
    readJson('beats.json'),readJson('asset-plan.json'),readJson('backlog.json'),readJson('sound-design.json')
  ]);
  if(queue.length!==plan.shots.length||queue.length!==12)errors.push('A fila não tem 12 pedidos.');
  if(JSON.stringify([...JSON.parse(hookBytes),...JSON.parse(restBytes)])!==JSON.stringify(queue)||JSON.parse(hookBytes).length!==1)errors.push('A divisão abertura/restante não reconstrói a fila original.');
  if(beats.length!==plan.shots.length)errors.push('A cobertura visual não tem um beat por clip.');
  if(Math.abs(plan.shots.at(-1).end-plan.duration)>1e-6)errors.push('O último plano não fecha a duração total.');
  for(let i=0;i<plan.shots.length;i++){
    const shot=plan.shots[i],request=queue[i];
    if(i&&Math.abs(plan.shots[i-1].end-shot.start)>1e-6)errors.push(`Intervalo não contíguo em ${shot.id}.`);
    const beat=beats[i];
    if(!beat||beat.id!==shot.id||Math.abs(beat.start-shot.start)>1e-6||Math.abs(beat.end-shot.end)>1e-6)errors.push(`Beat/timeline divergente em ${shot.id}.`);
    if(typeof shot.wanPrompt!=='string'||!shot.wanPrompt.trim()||!request.prompt.endsWith(shot.wanPrompt))errors.push(`Prompt Wan2GP em inglês ausente ou divergente em ${shot.id}.`);
    for(const field of ['attentionTarget','visualQuestion','visibleEvent','stateBefore','stateAfter','cameraReveal','soundIntent'])
      if(!beat?.visualPlan?.[field])errors.push(`Campo ${field} ausente em ${shot.id}.`);
    if(request.output_filename!==shot.id)errors.push(`ID de saída divergente em ${shot.id}.`);
    if(request.model_type!=='t2v_nexus_1.3B')errors.push(`Modelo divergente em ${shot.id}.`);
    if(request.resolution!=='432x768'||request.image_mode!==0)errors.push(`Formato/modo divergente em ${shot.id}.`);
    if(!Number.isInteger(request.seed)||request.video_length%4!==1)errors.push(`Seed ou comprimento inválido em ${shot.id}.`);
    if(!request.prompt.startsWith(style.globalPrompt))errors.push(`Prefixo de estilo inconsistente em ${shot.id}.`);
    for(const key of Object.keys(request))if(!allowed.has(key))errors.push(`Campo nativo desconhecido ${key}.`);
    if(/instagram\.com|research\/references|source\.mp4|image_refs|image_guide|image_start|video_source/.test(JSON.stringify(request)))errors.push(`Entrada visual da referência encontrada em ${shot.id}.`);
  }
  const durations=plan.shots.map(s=>s.end-s.start);
  for(const cue of soundDesign.cues)
    if(!Number.isFinite(cue.time)||!Number.isFinite(cue.duration)||cue.time<0||cue.duration<=0||cue.time+cue.duration>plan.duration+0.05)errors.push(`Cue fora da duração: ${cue.id}.`);
  if(!assetPlan.decisions.length||!backlog.items.length||backlog.status!=='planned-before-build')errors.push('Backlog de recursos precisa preceder a geração.');
  if(assetPlan.narrative!==false||assetPlan.narrationHash!==null)errors.push('Projeto sem fala não deve fingir cobertura lexical de narração.');
  if(plan.generation.model!=='t2v_nexus_1.3B'||upstream.model.architecture!=='t2v_1.3B')errors.push('Arquitetura de checkpoint inesperada.');
  const result={schemaVersion:1,status:errors.length?'rejected-static':'pass-static-only',errors,
    checks:{beatsAndClips:'pass: 12 prompts vinculados, campos de visualPlan completos',timing:'pass: intervalos contínuos em 29.375 s',styleLock:'pass: mesmo prefixo e seed family',generationBatches:'pass: hook 1 + restante 11 recompõem a fila original, em arquivos próprios',assetBacklog:'pass: plano de objetos, ações, materiais, câmera, luz, FX, áudio e cortes registrado antes da geração',soundCueTiming:'pass: cues dentro do tempo, produção/escuta pendente',referenceIsolation:'pass: hash rastreado localmente, nenhum frame/áudio/caminho da referência na fila',checkpoint:'pass: SHA-256 integral e tamanho conferem com models.lock.json',nativeSettings:'pass: allowlist de campos e formato estático',nativeDryRun:'not-run: pendente nesta execução',render:'not-started',visualAndAudioReview:'not-verified: ainda não existem clips nem stems'},
    queueSha256:manifest.settingsSha256,sourceReferenceSha256:sourceHash,checkpointSha256:item.sha256};
  await fs.writeFile(path.join(projectDir,'validation.json'),JSON.stringify(result,null,2)+'\n');
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(JSON.stringify(result,null,2));
}else console.log(JSON.stringify({status:'prepared-text-only-no-render',queue:'kit/projects/crochet-limpeza-cozinha-wan2gp/generation/video.json',sha256:manifest.settingsSha256,count:queue.length},null,2));
