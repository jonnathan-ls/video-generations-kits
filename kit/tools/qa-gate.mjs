import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const digest=b=>createHash('sha256').update(b).digest('hex');
export const QA_DOMAINS=['hook','direction','visual-progression','animation','art-lighting','camera-editing','fx','voice','sound','delivery'];
export async function qaFingerprint(file,catalog){const full=path.resolve(file),base=path.dirname(full),raw=await fs.readFile(full),project=JSON.parse(raw);const rows=[digest(raw)];
 const ids=[...new Set([...(project.scenes||[]).flatMap(s=>(s.assets||[]).map(a=>a.id)),...(project.audio?.events||[]).map(a=>a.assetId)])].sort();
 for(const id of ids){const a=catalog.assets.find(a=>a.id===id);if(!a)throw new Error('QA: recurso inexistente '+id);rows.push(id+':'+a.revision);if(a.sound)rows.push(id+':sound:'+digest(await fs.readFile(new URL('../audio/previews/'+a.sound+'.wav',import.meta.url))));}
 if(project.audio?.voice)rows.push('voice:'+digest(await fs.readFile(path.resolve(base,project.audio.voice))));
 // Alterações no runtime/exportador também invalidam o parecer da imagem anterior.
 for(const name of ['../engine/composition.js','../engine/behaviors.js','../engine/shot-motion.js','../engine/captions.js','export-hyperframes.mjs','segment-plan.mjs','render-segments.mjs','storyboard-compile.mjs'])rows.push(digest(await fs.readFile(new URL(name,import.meta.url))));
 for(const name of project.qaSources||[]){const source=name.startsWith('kit/')?fileURLToPath(new URL('../../'+name,import.meta.url)):path.resolve(base,name);rows.push(name+':'+digest(await fs.readFile(source)));}
 return digest(rows.join('\n'));}
export async function validateQa(file,catalog,{reportPath,artifactPath}={}){const errors=[],base=path.dirname(path.resolve(file));let report;try{report=JSON.parse(await fs.readFile(reportPath||path.join(base,'qa/report.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;return {ok:false,errors:['QA profissional ausente; executar revisão real antes da entrega.']};}
 if(report.sourceFingerprint!==await qaFingerprint(file,catalog))errors.push('QA desatualizado: projeto, áudio, recursos ou runtime mudaram.');
 const project=JSON.parse(await fs.readFile(file,'utf8'));
 if(report.scope!=='whole-video'||!Number.isFinite(report.reviewedDuration)||report.reviewedDuration<(project.duration||0))errors.push('QA parcial não libera o vídeo completo.');
 if(report.status!=='ready-for-creator-review')errors.push('QA não liberado: '+report.status);
 for(const domain of QA_DOMAINS){const c=report.checks?.[domain];if(c?.status!=='pass')errors.push('QA obrigatório não aprovado: '+domain);if(!c?.method||!c?.evidence?.length)errors.push('QA sem método/evidência: '+domain);for(const evidence of c?.evidence||[]){try{await fs.access(path.resolve(base,evidence));}catch{errors.push('Evidência de QA ausente: '+evidence);}}}
 for(const f of report.findings||[])if(['P0','P1'].includes(f.severity)&&f.status!=='resolved')errors.push('QA bloqueador aberto: '+f.id);
 if(artifactPath&&report.artifact?.path&&path.resolve(artifactPath)!==path.resolve(base,report.artifact.path))errors.push('O arquivo solicitado para entrega não é o vídeo revisado.');
 if(!report.artifact?.path||!report.artifact?.sha256)errors.push('QA sem arquivo renderizado identificado.');else try{if(digest(await fs.readFile(path.resolve(base,report.artifact.path)))!==report.artifact.sha256)errors.push('O vídeo revisado mudou desde o QA.');}catch{errors.push('O vídeo revisado não existe.');}
 return {ok:errors.length===0,errors};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {buildCatalog}=await import('./build-catalog.mjs');const file=process.argv[2];if(!file)throw new Error('Informe project.json');const result=await validateQa(file,await buildCatalog(),{artifactPath:process.argv.includes('--artifact')?process.argv[process.argv.indexOf('--artifact')+1]:undefined});console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
