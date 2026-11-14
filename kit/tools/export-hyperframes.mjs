import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCatalog, ROOT } from './build-catalog.mjs';
import { ReviewStore } from './reviews.mjs';
import { validateProduction } from './production.mjs';
import { BacklogStore } from './backlog.mjs';
import { validateProjectPlanUse } from './project-plan-review.mjs';
import { validateQa } from './qa-gate.mjs';
import { compileCaption } from '../engine/captions.js';
import { verifySegmentOrigin } from './segment-plan.mjs';

async function wavDuration(file) {
  const buffer = await fs.readFile(file);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`Arquivo de áudio local não é WAV: ${file}`);
  }
  let offset = 12, byteRate = 0, dataBytes = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + size > buffer.length) break;
    if (id === 'fmt ' && size >= 16) byteRate = buffer.readUInt32LE(start + 8);
    if (id === 'data') dataBytes = size;
    offset = start + size + (size % 2);
  }
  if (!byteRate || !dataBytes) throw new Error(`Cabeçalho WAV sem duração legível: ${file}`);
  return dataBytes / byteRate;
}

const input = process.argv[2];
if (!input) throw new Error('Uso: node kit/tools/export-hyperframes.mjs projeto.json [--preview]');
const preview = process.argv.includes('--preview');
const file = path.resolve(input);
const project = JSON.parse(await fs.readFile(file, 'utf8'));
const segmentOriginIndex=process.argv.indexOf('--segment-origin');
if(segmentOriginIndex>=0&&(!process.argv[segmentOriginIndex+1]||process.argv[segmentOriginIndex+1].startsWith('--')))throw new Error('--segment-origin exige o projeto mestre.');
if(segmentOriginIndex>=0&&preview)throw new Error('--segment-origin destina-se apenas a render delivery limpo.');
if(project.segmentSource&&!preview&&segmentOriginIndex<0&&!process.argv.includes('--internal-qa'))throw new Error('Subprojeto delivery exige prova --segment-origin.');
const originProof=segmentOriginIndex>=0?await verifySegmentOrigin(file,process.argv[segmentOriginIndex+1]):null;
const gateFile=originProof?.originFile||file,gateProject=originProof?.original||project;
const catalog = await buildCatalog();
const reviews = await new ReviewStore(path.join(ROOT, 'kit/catalog/reviews.json')).read();
const internalQa = process.argv.includes('--internal-qa');
if(!internalQa){const qa=await validateQa(gateFile,catalog);if(!qa.ok)throw new Error('Entrega bloqueada pelo QA profissional:\n'+qa.errors.join('\n'));}

const validation = validateProduction(gateProject, catalog, reviews);
if (!preview && !internalQa) {
  const backlog = await new BacklogStore(path.join(ROOT, 'kit/catalog/backlog.json')).read();
  validation.errors.push(...await validateProjectPlanUse(ROOT, gateFile, gateProject, catalog, backlog));
  validation.ok = validation.errors.length === 0;
}
if (!preview && !internalQa && !validation.ok) throw new Error('Produção bloqueada:\n' + validation.errors.join('\n'));
for (const value of ['width', 'height', 'fps', 'duration']) {
  if (!Number.isFinite(project[value]) || project[value] <= 0) throw new Error(`${value} inválido.`);
}

const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0 && (!process.argv[outputIndex + 1] || process.argv[outputIndex + 1].startsWith('--'))) throw new Error('--output exige uma pasta.');
const out = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.join(path.dirname(file), 'hyperframes');
await fs.mkdir(path.join(out, 'assets/source/kit'), { recursive: true });
await fs.mkdir(path.join(out, 'assets/lib'), { recursive: true });
for (const dir of ['assets', 'engine']) {
  await fs.cp(path.join(ROOT, 'kit', dir), path.join(out, 'assets/source/kit', dir), { recursive: true });
}
await fs.cp(path.join(ROOT, 'kit-video-3d/assets'), path.join(out, 'assets/source/kit-video-3d/assets'), { recursive: true });
await fs.cp(path.join(ROOT, 'node_modules/three'), path.join(out, 'assets/lib/three'), { recursive: true });
await fs.copyFile(path.join(ROOT, 'node_modules/gsap/dist/gsap.min.js'), path.join(out, 'assets/lib/gsap.min.js'));
const fonts=project.fonts||[];
if(fonts.length){await fs.mkdir(path.join(out,'assets/fonts'),{recursive:true});for(const font of fonts){if(typeof font.source!=='string'||typeof font.family!=='string')throw new Error('Fonte local inválida no projeto.');const source=path.resolve(path.dirname(file),font.source),relative=path.relative(path.dirname(file),source);if(relative==='..'||relative.startsWith(`..${path.sep}`)||path.isAbsolute(relative))throw new Error('A fonte precisa estar dentro da pasta do projeto.');await fs.copyFile(source,path.join(out,'assets/fonts',path.basename(source)));}}

const usedIds = new Set(project.scenes.flatMap(scene => scene.assets.map(asset => asset.id)));
const registry = catalog.assets.filter(asset => usedIds.has(asset.id));
await fs.writeFile(path.join(out, 'assets/project.js'), `export const project=${JSON.stringify(project)};\nexport const registry=${JSON.stringify(registry)};\n`);

let audio = '';
for (const [index, event] of (project.audio?.events || []).entries()) {
  const definition = catalog.assets.find(asset => asset.id === event.assetId);
  if (!definition?.sound) throw new Error(`Som desconhecido: ${event.assetId}`);
  await fs.mkdir(path.join(out, 'assets/audio'), { recursive: true });
  await fs.copyFile(path.join(ROOT, 'kit/audio/previews', definition.sound + '.wav'), path.join(out, 'assets/audio', definition.sound + '.wav'));
  const source = path.join(out, 'assets/audio', definition.sound + '.wav');
  const mediaDuration = await wavDuration(source);
  const duration = Math.min(Number(event.duration || mediaDuration), mediaDuration);
  audio += `<audio id="fx-${index}" class="clip" data-start="${Number(event.time)}" data-duration="${duration}" data-track-index="2" data-volume="${Number(event.volume || .35)}" src="assets/audio/${definition.sound}.wav"></audio>\n`;
}
if (project.audio?.voice) {
  await fs.mkdir(path.join(out, 'assets/audio'), { recursive: true });
  await fs.copyFile(path.resolve(path.dirname(file), project.audio.voice), path.join(out, 'assets/audio/voice.wav'));
  audio += `<audio id="voice" class="clip" data-start="0" data-duration="${project.duration}" data-track-index="1" preload="auto" src="assets/audio/voice.wav"></audio>`;
}

const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const bundleRevision = encodeURIComponent(project.storyboard?.revision || project.revision || 'current');
const captions = project.captions || [];
const captionModels = captions.map(cue => compileCaption(cue, project.captionStyle, project.captionWords));
const captionTiming = { modes: [...new Set(captionModels.map(cue => cue.mode))], sources: [...new Set(captionModels.map(cue => cue.timingSource))], estimatedCues: captionModels.filter(cue => cue.timingSource === 'estimated-grapheme').length, note: 'Word boundaries may be aligned; character timing within a spoken word is interpolated deterministically.' };
if (captionTiming.estimatedCues && captionTiming.modes.some(mode => mode !== 'phrase')) console.warn('Legendas progressivas: '+captionTiming.estimatedCues+' grupos usam timing estimado, sem alinhamento real por palavra.');
const captionY = Math.min(Number(project.captionStyle?.y ?? 1260), 1330);
const captionBottom = Number(project.captionStyle?.bottom);
const captionPlacement = Number.isFinite(captionBottom)
  ? `bottom:${Math.max(0, Math.min(captionBottom, 180))}px;top:auto`
  : `top:${captionY}px;bottom:auto`;
const captionFontSize = Math.max(36, Math.min(72, Number(project.captionStyle?.fontSize ?? 48)));
const captionFontWeight = Math.max(500, Math.min(900, Number(project.captionStyle?.fontWeight ?? 700)));
const captionMaxWidth = Math.max(600, Math.min(1600, Number(project.captionStyle?.maxWidth ?? 1500)));
const captionFontFamily = project.captionStyle?.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
let previousCaptionEnd = 0;
for (const [index,caption] of captions.entries()) {
  const start = Number(caption.start);
  const duration = Number(caption.duration);
  if (!caption.text || !Number.isFinite(start) || !Number.isFinite(duration) || start < 0 || duration <= 0 || start + duration > project.duration + .01) {
    throw new Error(`Legenda inválida no grupo ${index + 1}.`);
  }
  if (start < previousCaptionEnd - .001) throw new Error(`Legendas sobrepostas no grupo ${index + 1}.`);
  previousCaptionEnd = start + duration;
}
const captionLayer = captions.length ? `<div id="captions" data-track-kind="captions"><span id="caption-text" class="caption-text caption-plain"><span id="caption-copy" class="caption-copy"></span><span id="caption-badge" class="caption-badge"></span></span></div>` : '';
const titleCards = project.titleCards || [];
for(const [index,card] of titleCards.entries()){
  const start=Number(card.start),duration=Number(card.duration);
  if(!Number.isFinite(start)||!Number.isFinite(duration)||duration<=0||start<0||start+duration>project.duration+.01)throw new Error(`Cartão de capítulo inválido ${index+1}.`);
}
const titleLayer=titleCards.length?`<div id="title-cards" data-track-kind="titles"><section id="title-card" class="title-card"><span class="title-rule"></span><div class="title-copy"><span id="title-eyebrow" class="title-eyebrow"></span><h2 id="title-heading"></h2><p id="title-subtitle"></p></div><span class="title-rule title-rule-end"></span></section></div>`:'';
const previewMarkup = preview ? `<div id="preview-stamp" class="clip preview-stamp" data-start="0" data-duration="${project.duration}" data-track-index="5">PRÉVIA TÉCNICA · NÃO É ENTREGA FINAL</div>` : '';
const sceneOptions = project.scenes.map(scene => `<option value="${scene.start}">${escapeHtml(scene.label || scene.id)}</option>`).join('');
const previewControlsMarkup = preview ? `<div id="preview-controls"><button id="play-toggle" type="button" aria-label="Reproduzir prévia">▶ Reproduzir</button><label for="seek">Tempo</label><input id="seek" type="range" min="0" max="${project.duration}" step="0.033333" value="0"><output id="seek-output">00:00.0</output><label for="scene-jump">Ir para cena</label><select id="scene-jump"><option value="">Escolha uma cena…</option>${sceneOptions}</select><span id="preview-status">Carregando…</span></div>` : '';
const scenePlanMarkup = preview ? `<details id="scene-plan"><summary>PLANO VISUAL · cena selecionada</summary><div id="scene-plan-content"><strong id="scene-plan-title">Aguardando a cena</strong><p id="scene-plan-event"></p><p id="scene-plan-focus"></p><p id="scene-plan-move"></p><p class="scene-plan-muted">Prévia 3D em tempo real no navegador · sem captura de vídeo.</p></div></details>` : '';
const overlayStyles = `<style>
.caption-clip{${captionPlacement}}.caption-text{position:relative;max-width:${captionMaxWidth}px;padding:10px 25px 12px;border:1px solid rgba(255,255,255,.38);border-radius:8px;background:linear-gradient(180deg,rgba(20,30,37,.90),rgba(8,15,20,.94));box-shadow:0 7px 24px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.10);font-family:${captionFontFamily};font-weight:900;letter-spacing:-.035em;-webkit-text-stroke:1.05px rgba(5,9,12,.92);text-shadow:0 2px 0 #10171b,0 4px 10px rgba(0,0,0,.9);text-transform:uppercase;will-change:transform,opacity}.caption-copy{display:inline}.caption-impact{border-color:rgba(255,195,82,.8);background:linear-gradient(180deg,rgba(52,39,21,.94),rgba(14,17,20,.96));box-shadow:0 0 26px rgba(255,171,48,.22),0 7px 24px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.16)}.caption-question{border-color:rgba(104,213,229,.76);background:linear-gradient(180deg,rgba(16,48,58,.95),rgba(8,19,25,.97));box-shadow:0 0 24px rgba(60,190,220,.24),0 7px 24px rgba(0,0,0,.62)}.caption-badge{position:absolute;right:-26px;top:-22px;display:grid;place-items:center;width:43px;height:43px;border:2px solid rgba(255,255,255,.93);border-radius:50%;background:#e5b94d;color:#111b20;font:900 31px/1 Arial,sans-serif;-webkit-text-stroke:0;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:0 4px 15px rgba(0,0,0,.45)}.caption-impact .caption-badge{width:27px;height:27px;right:-13px;top:-14px;background:#ffe0a0;color:#74410e;font-size:18px}.caption-question .caption-badge{background:#5ed7e5;color:#08202a;font-size:32px}.title-card{pointer-events:none;position:absolute;left:8%;right:8%;top:35%;min-height:230px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:25px;padding:35px 56px;border-top:1px solid rgba(255,240,211,.66);border-bottom:1px solid rgba(255,240,211,.66);background:linear-gradient(90deg,rgba(7,15,21,.10),rgba(7,15,21,.87) 18%,rgba(7,15,21,.87) 82%,rgba(7,15,21,.10));color:#fff;opacity:0;visibility:hidden;will-change:transform,opacity}.title-copy{max-width:1260px;text-align:center}.title-eyebrow{display:block;margin-bottom:16px;color:#f1c66d;font:800 28px/1.1 'DejaVu Sans',Arial,sans-serif;letter-spacing:.18em}.title-card h2{margin:0;color:#fff6df;font:900 58px/1.08 'DejaVu Sans Condensed',Arial,sans-serif;letter-spacing:.018em;text-shadow:0 3px 10px rgba(0,0,0,.8)}.title-card p{margin:13px 0 0;color:#d6e0e4;font:500 28px/1.35 'DejaVu Sans',Arial,sans-serif;letter-spacing:.015em}.title-rule{width:2px;height:96px;background:linear-gradient(180deg,transparent,#eac56f,transparent);flex:0 0 2px}.title-rule-end{opacity:.68}.title-card.evidence-title{left:9%;right:9%;top:39%;width:auto;min-height:250px;padding:42px;gap:28px;justify-content:center;border:1px solid rgba(255,229,178,.72);border-radius:18px;background:radial-gradient(ellipse at 50% 48%,rgba(20,39,49,.96),rgba(7,15,21,.94) 72%);box-shadow:0 24px 80px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.14),0 0 40px rgba(241,198,109,.12);backdrop-filter:blur(5px)}.evidence-title .title-copy{text-align:center}.evidence-title .title-eyebrow{font-size:23px;margin-bottom:14px}.evidence-title h2{font-size:62px}.evidence-title p{font-size:30px;margin-top:14px}.evidence-title .title-rule{height:112px;width:3px;flex-basis:3px}
</style>`;
const fontFaces=(project.fonts||[]).map(font=>`@font-face{font-family:'${escapeHtml(font.family)}';src:url('assets/fonts/${path.basename(font.source)}') format('truetype');font-style:normal;font-weight:${font.weight||'400 900'};font-display:block}`).join('');
const renderedOverlayStyles=overlayStyles.replace('<style>',`<style>${fontFaces}`).replace('.caption-text{position:relative;max-width:',`.caption-text{position:absolute;left:0;right:0;${captionPlacement};margin:0 auto;width:max-content;max-width:`);

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Obra Cortada — ${preview ? 'prévia técnica' : 'composição'}</title><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#101719;font:14px Arial,Helvetica,sans-serif}#root{position:fixed;left:50%;top:calc((100vh - var(--controls-height,72px))/2);width:${project.width}px;height:${project.height}px;overflow:hidden;background:#bbd6e7;transform:translate(-50%,-50%) scale(var(--view-scale,1));transform-origin:center center}html.full-frame #root{top:50%;transform:translate(-50%,-50%) scale(1)}canvas{width:100%;height:100%;display:block}#captions{position:absolute;inset:0;z-index:10;pointer-events:none}.caption-clip{position:absolute;left:54px;right:54px;${captionPlacement};text-align:center;line-height:1.08;overflow:visible}.caption-text{display:inline-block;max-width:${captionMaxWidth}px;box-sizing:border-box;padding:11px 19px 13px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(20,27,31,.86);box-shadow:0 6px 22px rgba(5,12,16,.3);color:#fff;font-family:${captionFontFamily};font-size:${captionFontSize}px;font-weight:${captionFontWeight};line-height:1.08;letter-spacing:-.025em;text-shadow:0 1px 2px rgba(0,0,0,.25);white-space:normal;text-wrap:balance;visibility:hidden}.caption-text.question-active{animation:question-reveal .38s cubic-bezier(.18,.84,.28,1) both}.question-mark{display:inline-block;color:#ffd05a}.@keyframes question-reveal{0%{transform:translateY(16px) scale(.84);opacity:0}68%{transform:translateY(-3px) scale(1.06);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}.preview-stamp{pointer-events:none;position:absolute;left:64px;top:760px;z-index:11;padding:8px 10px;border-radius:4px;background:rgba(24,30,30,.78);color:#fff;font:700 24px/1.2 Arial,Helvetica,sans-serif;letter-spacing:.01em}#preview-controls{position:fixed;z-index:20;bottom:0;left:0;right:0;height:var(--controls-height,72px);box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:10px 16px;background:#142126;color:#fff}html.full-frame #preview-controls{display:none}#preview-controls label{font-weight:700;white-space:nowrap}#play-toggle{white-space:nowrap}#seek{min-width:70px;flex:1;accent-color:#f2b52b}#seek-output{min-width:76px;font-variant-numeric:tabular-nums}#scene-jump{max-width:42vw;padding:8px 10px;border:1px solid #63747c;border-radius:5px;background:#263940;color:#fff;font:600 13px Arial,Helvetica,sans-serif}#preview-status{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#c8d5da}
</style><style>@media(max-width:650px){#preview-controls{height:96px;display:grid;grid-template-columns:80px minmax(0,1fr) 52px;grid-template-rows:36px 36px;gap:4px 8px;padding:8px 12px}#play-toggle{grid-column:1;grid-row:1;padding:6px 8px;font-size:11px}#preview-controls label[for=scene-jump]{display:none}#scene-jump{grid-column:2/-1;grid-row:1;width:100%;max-width:none;min-width:0;padding:6px;font-size:11px}#preview-controls label[for=seek]{grid-column:1;grid-row:2;font-size:11px}#seek{grid-column:2;grid-row:2;min-width:0}#seek-output{grid-column:3;grid-row:2;min-width:48px;text-align:right;font-size:11px}#preview-status{display:none}}</style><style>#scene-plan{position:fixed;z-index:19;top:14px;left:14px;width:min(430px,calc(100vw - 28px));max-height:36vh;overflow:auto;border:1px solid rgba(209,220,220,.3);border-radius:9px;background:rgba(10,17,20,.86);box-shadow:0 8px 28px rgba(0,0,0,.38);backdrop-filter:blur(10px);color:#edf3f0;font:12px/1.45 Arial,sans-serif}#scene-plan summary{padding:9px 12px;color:#f0ca78;font-size:11px;font-weight:700;cursor:pointer}#scene-plan-content{padding:0 12px 12px}#scene-plan-content strong{display:block;margin:0 0 5px;font-size:12px}#scene-plan-content p{margin:5px 0;color:#c0cccd;font-size:11px}#scene-plan-content .scene-plan-muted{color:#89999c;font-size:10px}@media(max-width:650px){#scene-plan{top:8px;left:8px;width:min(330px,calc(100vw - 16px));max-height:30vh}#scene-plan summary{padding:7px 9px}#scene-plan-content{padding:0 9px 9px}}</style><script type="importmap">{"imports":{"three":"./assets/lib/three/build/three.module.js","three/addons/":"./assets/lib/three/examples/jsm/"}}</script><script src="assets/lib/gsap.min.js"></script></head><body><main id="root" data-composition-id="root" data-start="0" data-duration="${project.duration}" data-width="${project.width}" data-height="${project.height}"><canvas id="scene" class="clip" data-start="0" data-duration="${project.duration}" data-track-index="0" data-track-kind="graphics"></canvas>${captionLayer}${previewMarkup}${audio}</main>${previewControlsMarkup}${scenePlanMarkup}<script>window.__timelines=window.__timelines||{};window.__timelines['root']=window.__timelines['root']||{};const fitView=()=>{const full=window.innerWidth>=${project.width}&&window.innerHeight>=${project.height};document.documentElement.classList.toggle('full-frame',full);const controlsHeight=window.innerWidth<=650?96:72;document.documentElement.style.setProperty('--controls-height',controlsHeight+'px');const scale=full?1:Math.max(.01,Math.min(window.innerWidth/${project.width},(window.innerHeight-controlsHeight)/${project.height},1));document.documentElement.style.setProperty('--view-scale',String(scale));};fitView();window.addEventListener('resize',fitView);</script><script type="module" src="assets/main.js?rev=${bundleRevision}"></script></body></html>`;

const main = `import {project,registry} from './project.js?rev=${bundleRevision}';
import {mountComposition} from './source/kit/engine/composition.js';
import {compileCaption,mountCaptionCopy} from './source/kit/engine/captions.js';
window.__hf=window.__hf||{};window.__hf.buildReady=window.__hf.buildReady||{};
window.__hf.buildReady['scene']=(async()=>{
 const player=await mountComposition({canvas:document.getElementById('scene'),project,registry,loadCustom:name=>import('./source/kit/assets/'+name+'?rev=${bundleRevision}')});
 const captionElement=document.getElementById('caption-text'),captionCopy=document.getElementById('caption-copy'),captionBadge=document.getElementById('caption-badge');
 const titleElement=document.getElementById('title-card'),titleEyebrow=document.getElementById('title-eyebrow'),titleHeading=document.getElementById('title-heading'),titleSubtitle=document.getElementById('title-subtitle');
 const activeIndex=(rows,getStart,getDuration,t)=>{let lo=0,hi=rows.length-1,best=-1;while(lo<=hi){const mid=(lo+hi)>>1;if(getStart(rows[mid])<=t){best=mid;lo=mid+1;}else hi=mid-1;}return best>=0&&t<getStart(rows[best])+getDuration(rows[best])?best:-1;};
 let captionModels=(project.captions||[]).map(cue=>compileCaption(cue,project.captionStyle,project.captionWords));
 let visibleCaption=-1,visibleTitle=-1,paintCaption=null;
 const renderAt=time=>{const t=Math.min(project.duration,Math.max(0,Number(time)||0));player.renderAt(t);${preview ? "window.dispatchEvent(new CustomEvent('review-frame',{detail:{time:t}}));" : ''}
  const ci=activeIndex(project.captions||[],row=>row.start,row=>row.duration,t);
  if(ci!==visibleCaption){visibleCaption=ci;if(ci>=0){const caption=project.captions[ci],kind=['impact','question'].includes(caption.kind)?caption.kind:'plain';captionElement.className='caption-text caption-'+kind;paintCaption=mountCaptionCopy(captionCopy,captionModels[ci]);captionBadge.textContent=kind==='question'?'?':kind==='impact'?'✦':'';captionBadge.style.display=kind==='plain'?'none':'grid';captionElement.style.visibility='visible';}else if(captionElement){if(paintCaption)paintCaption(t);captionElement.style.visibility='hidden';}}
  if(ci>=0){paintCaption(t);const caption=project.captions[ci],u=Math.max(0,Math.min(1,(t-caption.start)/.24)),ease=1-Math.pow(1-u,3),impact=caption.kind==='impact',scale=impact?(.78+.28*ease-.06*ease*ease):(.91+.09*ease);captionElement.style.opacity=String(Math.min(1,u*5));captionElement.style.transform='translate3d(0,'+((1-ease)*21)+'px,0) scale('+scale+')';if(caption.kind!=='plain'){captionBadge.style.opacity=String(Math.min(1,u*6));captionBadge.style.transform='translate3d(0,'+((1-ease)*-10)+'px,0) rotate('+((1-ease)*(caption.kind==='question'?-14:10))+'deg) scale('+(.72+.28*ease)+')';}}
  const ti=activeIndex(project.titleCards||[],row=>row.start,row=>row.duration,t);
  if(ti!==visibleTitle){visibleTitle=ti;if(ti>=0){const card=project.titleCards[ti];titleElement.classList.toggle('evidence-title',card.layout==='evidence');titleEyebrow.textContent=card.eyebrow||'CAPÍTULO';titleHeading.textContent=card.title||'';titleSubtitle.textContent=card.subtitle||'';titleSubtitle.style.display=card.subtitle?'block':'none';titleElement.style.top=Number.isFinite(card.topPercent)?card.topPercent+'%':'';titleElement.style.visibility='visible';}else if(titleElement){titleElement.style.visibility='hidden';titleElement.style.opacity='0';}}
  if(ti>=0){const card=project.titleCards[ti],age=t-card.start,remaining=card.start+card.duration-t,fade=Math.min(1,age/.46,remaining/.38),eased=1-Math.pow(1-fade,3),scale=card.layout==='evidence'?.955+.045*eased:.985+.015*eased;titleElement.style.opacity=String(eased);titleElement.style.transform='translate3d(0,'+((1-eased)*18)+'px,0) scale('+scale+')';}
 };
 ${preview ? "window.addEventListener('review-caption-mode',event=>{const mode=event.detail?.mode;if(!['phrase','progressive-word','word-highlight','authored'].includes(mode))return;captionModels=(project.captions||[]).map(cue=>compileCaption(mode==='authored'?cue:{...cue,reveal:mode},project.captionStyle,project.captionWords));visibleCaption=-1;renderAt(tl.time());});" : ''}
 const clock={t:0};const tl=gsap.timeline({paused:true}).to(clock,{t:project.duration,duration:project.duration,ease:'none',onUpdate:()=>renderAt(clock.t)});
 window.addEventListener('hf-seek',e=>tl.time(e.detail.time));
 window.__timelines=window.__timelines||{};window.__timelines['root']=tl;tl.time(0);renderAt(0);
 const preview={player,renderAt,tl};window.__hf.preview=preview;return preview;
})().catch(error=>{const status=document.getElementById('preview-status');if(status)status.textContent='Erro ao montar: '+error.message;throw error;});\n`;

const controls = `import {project} from './project.js?rev=${bundleRevision}';
const preview=await window.__hf.buildReady['scene'];
const {tl}=preview,status=document.getElementById('preview-status');
const seek=document.getElementById('seek'),output=document.getElementById('seek-output'),jump=document.getElementById('scene-jump'),voice=document.getElementById('voice'),playToggle=document.getElementById('play-toggle'),effects=[...document.querySelectorAll('audio[id^="fx-"]')];
for(const effect of effects)effect.preload='auto';
let playing=false,voiceDriven=false,playbackFrame=0,playbackToken=0,transitionBusy=false,activeEffects=new Set(),blockedEffects=new Set();
let shownSceneStart=-1;
const format=t=>String(Math.floor(t/60)).padStart(2,'0')+':'+(t%60).toFixed(1).padStart(4,'0');
const sceneAt=time=>{let lo=0,hi=project.scenes.length-1,best=-1;while(lo<=hi){const mid=(lo+hi)>>1;if(Number(project.scenes[mid].start)<=time){best=mid;lo=mid+1;}else hi=mid-1;}return best>=0&&time<Number(project.scenes[best].start)+Number(project.scenes[best].duration)?project.scenes[best]:null;};
const resetEffects=()=>{for(const effect of effects){effect.pause();try{effect.currentTime=0;}catch{}}activeEffects.clear();blockedEffects.clear();};
const syncEffects=time=>{for(const effect of effects){const start=Number(effect.dataset.start),end=start+Number(effect.dataset.duration),shouldPlay=playing&&time>=start&&time<end;if(shouldPlay&&!activeEffects.has(effect)&&!blockedEffects.has(effect)){effect.volume=Math.max(0,Math.min(1,Number(effect.dataset.volume)));effect.currentTime=Math.max(0,Math.min(Number(effect.dataset.duration),time-start));activeEffects.add(effect);const result=effect.play();if(result&&typeof result.catch==='function')result.catch(error=>{activeEffects.delete(effect);blockedEffects.add(effect);status.textContent='Efeito não reproduzido · '+effect.id+' · '+error.message;});}else if(!shouldPlay&&activeEffects.has(effect)){effect.pause();effect.currentTime=0;activeEffects.delete(effect);}}};
const planTitle=document.getElementById('scene-plan-title'),planEvent=document.getElementById('scene-plan-event'),planFocus=document.getElementById('scene-plan-focus'),planMove=document.getElementById('scene-plan-move');
const updateControls=()=>{const time=tl.time();seek.value=String(time);output.textContent=format(time);const activeScene=sceneAt(time);if(activeScene&&Number(activeScene.start)!==shownSceneStart){shownSceneStart=Number(activeScene.start);jump.value=String(activeScene.start);if(planTitle)planTitle.textContent=activeScene.label||activeScene.id;const visual=activeScene.visualPlan||{};if(planEvent)planEvent.textContent=visual.visibleEvent?'Acontecimento: '+visual.visibleEvent:'';if(planFocus)planFocus.textContent=visual.attentionTarget?'Foco: '+visual.attentionTarget:'';if(planMove)planMove.textContent=visual.cameraReveal?'Câmera: '+visual.cameraReveal:'';}if(playing)syncEffects(time);};
const renderAt=tl.eventCallback('onUpdate');
tl.eventCallback('onUpdate',function(){if(renderAt)renderAt.call(this);updateControls();});
const seekTo=(t,syncAudio=true)=>{const time=Math.min(project.duration,Math.max(0,Number(t)||0));if(playing)stop();tl.pause();tl.time(time);if(syncAudio&&voice&&Number.isFinite(voice.duration))voice.currentTime=Math.min(time,voice.duration);};
const stop=()=>{playbackToken++;playing=false;voiceDriven=false;transitionBusy=false;cancelAnimationFrame(playbackFrame);tl.pause();if(voice)voice.pause();resetEffects();playToggle.textContent='▶ Reproduzir';playToggle.setAttribute('aria-label','Reproduzir prévia');status.textContent='Prévia pronta · voz, '+effects.length+' efeitos locais e '+project.scenes.length+' cenas';};
tl.eventCallback('onComplete',stop);
window.addEventListener('hf-seek',stop);
// The timeline is the single interactive clock. The voice follows it; scene
// changes never pause or rewind the clock. HyperFrames capture is separate and
// deterministic.
const scheduleFrame=fn=>window['request'+'AnimationFrame'](fn);
const syncVoiceTo=time=>{if(!voice)return;try{const target=Math.min(Number.isFinite(voice.duration)?voice.duration:time,time);if(Math.abs(voice.currentTime-target)>.22)voice.currentTime=target;}catch{}};
const tickFromTimeline=()=>{if(!playing)return;const time=tl.time();syncVoiceTo(time);if(time>=project.duration-.02){stop();return;}playbackFrame=scheduleFrame(tickFromTimeline);};
const start=async()=>{window.dispatchEvent(new Event('review-play'));if(tl.time()>=project.duration-.02)seekTo(0);resetEffects();playing=true;voiceDriven=false;transitionBusy=false;playToggle.textContent='❚❚ Pausar';playToggle.setAttribute('aria-label','Pausar prévia');tl.pause();if(voice){try{voice.currentTime=tl.time();await voice.play();}catch(error){status.textContent='Áudio indisponível · '+error.message;}}if(!playing)return;syncEffects(tl.time());tl.play();playbackFrame=scheduleFrame(tickFromTimeline);status.textContent='Reproduzindo · linha do tempo de '+project.duration.toFixed(1)+' s · '+effects.length+' efeitos locais e '+project.scenes.length+' cenas';};
playToggle.addEventListener('click',()=>{if(playing)stop();else void start();});
seek.addEventListener('input',()=>seekTo(seek.value));jump.addEventListener('change',()=>{if(jump.value!=='')seekTo(jump.value);});
const requestedSceneId=new URLSearchParams(location.search).get('scene');const requestedScene=requestedSceneId?project.scenes.find(scene=>scene.id===requestedSceneId):null;
const scenePreviewTime=requestedScene?Math.min(requestedScene.start+.15,requestedScene.start+requestedScene.duration-.01):0;
window.__hf.reviewControls={seekTo,stop,start,isPlaying:()=>playing};
seekTo(scenePreviewTime);status.textContent=requestedScene?'Prévia 3D · '+requestedScene.id+' · sem captura de vídeo':'Prévia pronta · voz, '+effects.length+' efeitos locais e '+project.scenes.length+' cenas';
`;
const reviewScript = preview ? `<link rel="stylesheet" href="assets/source/kit/engine/review-player.css?rev=${bundleRevision}"><script type="module">import {project} from './assets/project.js?rev=${bundleRevision}';import {mountReviewPlayer} from './assets/source/kit/engine/review-player.js?rev=${bundleRevision}';await import('./assets/preview-controls.js?rev=${bundleRevision}');mountReviewPlayer({project,preview:window.__hf.preview,controls:window.__hf.reviewControls});</script>` : '';
const previewControlsScript = preview ? `<script type="module" src="assets/preview-controls.js?rev=${bundleRevision}"></script>` + reviewScript : '';
const overlayAnchor=`</canvas>${captionLayer}${previewMarkup}`;
if(!html.includes(overlayAnchor))throw new Error('Não foi possível localizar a camada de cartões e legendas na composição.');
const withTitles = html.replace(overlayAnchor, `</canvas>${captionLayer}${titleLayer}${previewMarkup}`);
const styledHtml = withTitles.replace('</head>', `${renderedOverlayStyles}</head>`);
const exportedHtml = styledHtml.replace('</body></html>', previewControlsScript + '</body></html>');
if (preview && exportedHtml === styledHtml) throw new Error('Não foi possível registrar os controles da prévia.');
await fs.writeFile(path.join(out, 'assets/main.js'), main);
await fs.writeFile(path.join(out, 'assets/preview-controls.js'), controls);
await fs.writeFile(path.join(out, 'index.html'), exportedHtml);
await fs.writeFile(path.join(out, 'hyperframes.json'), JSON.stringify({ width: project.width, height: project.height, fps: project.fps, duration: project.duration }, null, 2));
await fs.writeFile(path.join(out, 'export-status.json'), JSON.stringify({ preview, validation, revision: catalog.revision, captionTiming }, null, 2));
console.log(`${preview ? 'Prévia técnica' : 'Composição'}: ${out}`);
