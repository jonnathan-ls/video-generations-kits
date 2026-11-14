import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const digest = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stable(value)).digest('hex');
export function stable(value) { return JSON.stringify(value, (_, v) => v && !Array.isArray(v) && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v); }
const frame = (seconds, fps) => Math.round(seconds * fps);
export function quantizeProject(project) {
  const copy=structuredClone(project),fps=copy.fps;
  if(!Number.isInteger(fps)||fps<=0)throw new Error('fps inteiro obrigatório para quantizar.');
  const report=[];
  const sourceCuts=[...copy.scenes.map(s=>s.start),copy.duration];
  const cuts=sourceCuts.map((sourceTime,index)=>{const frameTime=Math.round(sourceTime*fps)/fps,deltaSeconds=frameTime-sourceTime;report.push({cut:index,sourceTime,frameTime,frame:Math.round(sourceTime*fps),deltaSeconds});return frameTime;});
  for(const [index,scene]of copy.scenes.entries()){
    const sourceStart=scene.start,sourceDuration=scene.duration;
    scene.start=cuts[index];scene.duration=cuts[index+1]-cuts[index];
    if(scene.duration<=0)throw new Error(`Cena ${scene.id} colapsa durante quantização.`);
    scene.sourceLocalOffset=Number(scene.sourceLocalOffset||0)+scene.start-sourceStart;
    scene.sourceDuration=scene.sourceDuration??sourceDuration;
  }
  copy.duration=cuts.at(-1);
  return {project:copy,report};
}

export function planSegments(project, { targetSeconds = 20, reviewSeconds = 180 } = {}) {
  const fps = project.fps;
  if (!Number.isInteger(fps) || fps <= 0 || !project.scenes?.length) throw new Error('Projeto exige fps inteiro positivo e cenas.');
  if (!(targetSeconds > 0) || !(reviewSeconds >= targetSeconds)) throw new Error('Durações de pacote/revisão inválidas.');
  const scenes = project.scenes.map((scene, index) => ({ id: scene.id, index, startFrame: frame(scene.start, fps), endFrame: frame(scene.start + scene.duration, fps) }));
  const totalFrames = frame(project.duration, fps);
  let previous = 0;
  for (const scene of scenes) {
    if (!scene.id || scene.startFrame !== previous || scene.endFrame <= scene.startFrame) throw new Error(`Cena ${scene.id || scene.index} não contígua em frames.`);
    const original = project.scenes[scene.index];
    if (Math.abs(original.start * fps - scene.startFrame) > .001 || Math.abs((original.start + original.duration) * fps - scene.endFrame) > .001) throw new Error(`Cena ${scene.id} precisa alinhar cortes a frames inteiros antes de segmentar.`);
    previous = scene.endFrame;
  }
  if (previous !== totalFrames) throw new Error('Cenas não cobrem a duração do projeto.');
  if (new Set(scenes.map(s => s.id)).size !== scenes.length) throw new Error('IDs de cenas duplicados.');
  const segments = [];
  let pending = [];
  const flush = () => {
    if (!pending.length) return;
    const startFrame = pending[0].startFrame, endFrame = pending.at(-1).endFrame;
    segments.push({ id: `shotpack-${pending[0].id}-${pending.at(-1).id}`, startFrame, endFrame, frameCount: endFrame - startFrame, sceneIds: pending.map(s => s.id), sceneIndexes: pending.map(s => s.index), reviewBlock: Math.floor(startFrame / frame(reviewSeconds, fps)) });
    pending = [];
  };
  for (const scene of scenes) {
    if (pending.length && (scene.endFrame - pending[0].startFrame > targetSeconds * fps || Math.floor(scene.startFrame / (reviewSeconds * fps)) !== Math.floor(pending[0].startFrame / (reviewSeconds * fps)))) flush();
    pending.push(scene);
    if (scene.endFrame - pending[0].startFrame >= targetSeconds * fps) flush();
  }
  flush();
  return { schemaVersion: 1, fps, width: project.width, height: project.height, totalFrames, targetSeconds, reviewSeconds, segments };
}

function cropRows(rows, begin, end, key = 'start') {
  return (rows || []).flatMap(row => {
    const start = Number(row[key]), stop = start + Number(row.duration);
    if (stop <= begin || start >= end) return [];
    const copy = { ...row, [key]: Math.max(start, begin) - begin, duration: Math.min(stop, end) - Math.max(start, begin), sourceDuration: row.sourceDuration ?? row.duration };
    if (row.words) copy.words = row.words.map(w => ({ ...w, start: w.start - begin, ...(w.end != null ? { end: w.end - begin } : {}) }));
    // Keep reveal age for a caption/title that straddles a package cut.
    if (start < begin) copy.timeOffset = Number(row.timeOffset || 0) + begin - start;
    return [copy];
  });
}
export function createSegmentProject(project, segment) {
  const begin = segment.startFrame / project.fps, end = segment.endFrame / project.fps;
  const copy = structuredClone(project);
  copy.duration = segment.frameCount / project.fps;
  copy.timelineOffset = Number(project.timelineOffset || 0) + begin;
  copy.scenes = segment.sceneIndexes.map(i => ({ ...structuredClone(project.scenes[i]), start: (frame(project.scenes[i].start, project.fps) - segment.startFrame) / project.fps }));
  copy.captions = cropRows(project.captions, begin, end);
  copy.titleCards = cropRows(project.titleCards, begin, end);
  if (project.captionWords) copy.captionWords = project.captionWords.filter(w => (w.end ?? w.start + w.duration) > Math.min(begin, ...copy.captions.map(c => begin+c.start-(c.timeOffset||0))) && w.start < Math.max(end, ...copy.captions.map(c => begin+c.start-(c.timeOffset||0)+c.sourceDuration))).map(w => ({...w,start:w.start-begin,...(w.end!=null?{end:w.end-begin}:{})}));
  // Audio is mixed globally and then cut sample-accurately. Never restart an overlapping SFX.
  copy.audio = {};
  return copy;
}

async function filesBelow(directory) {
  const result = [];
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(file)); else result.push(file);
  }
  return result;
}
async function moduleFiles(file, seen = new Set()) {
  file = path.resolve(file); if (seen.has(file)) return seen; seen.add(file);
  const content = await fs.readFile(file, 'utf8');
  for (const match of content.matchAll(/(?:from\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)) if (match[1].startsWith('.')) await moduleFiles(path.resolve(path.dirname(file), match[1]), seen);
  return seen;
}
export async function segmentDependencies(project, segment, { root, projectFile, catalog, codeFiles = [] }) {
  const used = new Set(segment.sceneIndexes.flatMap(i => project.scenes[i].assets.map(a => a.id)));
  const assetFiles = new Set(), definitions = [];
  for (const id of [...used].sort()) {
    const def = catalog.assets.find(a => a.id === id); if (!def) throw new Error(`Asset desconhecido ${id}.`);
    // Catalog revision can be broad (all legacy assets). Use actual source bytes instead.
    const { revision, quality, ...definition } = def; definitions.push(definition);
    if (def.module) for (const file of await moduleFiles(path.join(root, 'kit/assets', def.module))) assetFiles.add(file);
    if (def.source === 'legacy') for (const file of await filesBelow(path.join(root, 'kit-video-3d/assets'))) assetFiles.add(file);
    for (const dependency of def.files || []) assetFiles.add(path.resolve(root, dependency));
  }
  const engineFiles = (await filesBelow(path.join(root, 'kit/engine'))).filter(f => /\.(js|mjs)$/.test(f));
  const inputs = [...new Set([...codeFiles, ...engineFiles, ...assetFiles, ... (project.fonts || []).map(f => path.resolve(path.dirname(projectFile), f.source))])].sort();
  const dependencies = await Promise.all(inputs.map(async file => ({ file: path.relative(root, file), hash: digest(await fs.readFile(file)) })));
  const clip = createSegmentProject(project, segment);
  // Global clock only invalidates a segment whose resources actually depend on it.
  // Retain conservatively until resources explicitly declare local-clock-only behavior.
  const { assetPlan, narration, soundDesign, voice, segmentSource, production, qa, title, id, ...renderProject } = clip;
  return { dependencies, usedAssetIds: [...used].sort(), hash: digest({ renderProject, definitions, dependencies }) };
}

export function segmentFontLayout(project) {
  const copy=structuredClone(project);
  if(copy.fonts)copy.fonts=copy.fonts.map((font,index)=>({...font,source:`fonts/${index}-${path.basename(font.source)}`}));
  return copy;
}
/** Proves that the served subproject is the exact canonical range of the gated origin. */
export async function verifySegmentOrigin(segmentFile, originFile) {
  const originPath=path.resolve(originFile),segmentPath=path.resolve(segmentFile);
  if(originPath===segmentPath)throw new Error('Origem de segmento precisa ser o projeto mestre, não ele próprio.');
  const raw=await fs.readFile(originPath),original=JSON.parse(raw),actual=JSON.parse(await fs.readFile(segmentPath,'utf8')),proof=actual.segmentSource;
  if(!proof||proof.project!==originPath||proof.sourceHash!==digest(raw)||proof.mode!=='delivery')throw new Error('Origem/fingerprint/modo de segmento inválido ou desatualizado.');
  if(!Number.isInteger(proof.startFrame)||!Number.isInteger(proof.endFrame)||proof.startFrame<0||proof.endFrame<=proof.startFrame)throw new Error('Faixa de segmento inválida.');
  const source=proof.quantize?quantizeProject(original).project:original;
  const indexes=source.scenes.flatMap((scene,index)=>frame(scene.start,source.fps)>=proof.startFrame&&frame(scene.start+scene.duration,source.fps)<=proof.endFrame?[index]:[]);
  if(!indexes.length||frame(source.scenes[indexes[0]].start,source.fps)!==proof.startFrame||frame(source.scenes[indexes.at(-1)].start+source.scenes[indexes.at(-1)].duration,source.fps)!==proof.endFrame)throw new Error('Faixa não corresponde a cortes íntegros da origem.');
  const expected=segmentFontLayout(createSegmentProject(source,{startFrame:proof.startFrame,endFrame:proof.endFrame,frameCount:proof.endFrame-proof.startFrame,sceneIndexes:indexes}));
  const {segmentSource,...served}=actual;
  if(stable(served)!==stable(expected))throw new Error('Subprojeto diverge da faixa canônica da origem; QA de origem não o aprova.');
  for(const [index,font]of (original.fonts||[]).entries()){
    const a=await fs.readFile(path.resolve(path.dirname(originPath),font.source)),b=await fs.readFile(path.resolve(path.dirname(segmentPath),expected.fonts[index].source));
    if(digest(a)!==digest(b))throw new Error('Fonte do subprojeto difere da origem.');
  }
  return {originFile:originPath,original,sourceHash:proof.sourceHash,startFrame:proof.startFrame,endFrame:proof.endFrame};
}
