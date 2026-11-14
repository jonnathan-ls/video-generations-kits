import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {localPath, execute} from './adapter.mjs';

export const projectDir = 'kit/projects/arco-alvenaria-wan2gp';
const sourceDir = 'kit/projects/arco-alvenaria';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Cada ação tem um pedido próprio; o roteiro nunca é enviado como prompt único.
export const shots = [
  ['01-coroamento', 0, 5.12, 'Close view of the crown of a red terracotta wedge brick arch. The final trapezoid keystone descends vertically into the exact central gap, seats between the neighboring bricks, and stops. Then the camera smoothly pulls back to reveal the complete freestanding arch and its two thick masonry piers standing on concrete ground. The completed arch remains motionless.'],
  ['02-falha-apoio', 5.12, 10.78, 'Front view of a red terracotta masonry arch resting on two stone piers. The right pier slides slightly outward to the right, once. Narrow gaps visibly open between the adjacent wedge bricks near the right springing point; the upper ring sags locally after contact is lost. Show loss of contact caused by the moving support, without an explosion or pulverized masonry. Camera holds the entire arch in frame.'],
  ['03-pergunta', 10.78, 14.42, 'A complete red terracotta wedge brick arch remains standing firmly on two thick masonry piers. Slow controlled camera approach. The open passage below the arch is clearly visible. All wedge bricks are touching their neighbors. No brick moves.'],
  ['04-compressao', 14.42, 19.76, 'Close three-quarter view of the upper red terracotta masonry arch. The tapered bricks touch each other tightly along their radial faces. Slowly track from the keystone down the continuous curve toward the left pier, revealing the unbroken series of contacts. The masonry stays geometrically stable and rigid.'],
  ['05-argamassa', 19.76, 22.62, 'Macro camera slide over a red terracotta masonry arch, showing thin continuous pale mortar joints between trapezoidal bricks. Mortar fills the radial contact faces with no gaps. Clear physical contact, subtle rough ceramic surface, no floating bricks.'],
  ['06-montagem', 22.62, 25.9, 'Front three-quarter view of a partially built red terracotta brick arch. A curved wooden centering frame is in full contact directly below the unfinished ring. Both ends of the centering frame rest on visible timber legs touching the concrete ground. Camera reveals how the timber supports the unfinished arch. No finished freestanding arch yet.'],
  ['07-cimbre', 25.9, 30.7, 'A curved timber centering frame holds red terracotta wedge bricks between two thick masonry piers. The final wedge descends into the center of the ring and seats against both neighbors, completing the closed arch. The curved timber frame remains touching the arch throughout. Keep the piers planted on the ground.'],
  ['08-retirada', 30.7, 32.76, 'A complete red terracotta wedge brick arch remains stationary on two thick masonry piers. The curved wooden centering frame lowers vertically a short distance away from the intrados, then slides forward out of the open passage. The closed masonry ring stays stable after the wood leaves.'],
  ['09-sistema', 32.76, 36.52, 'Close view of the central red terracotta keystone, already seated in a complete masonry arch. The camera pulls back along the same axis to reveal that the keystone touches its neighboring wedges and that the full arch rests on two thick masonry piers. All masonry remains motionless. Emphasize the connected system.'],
  ['10-vao-livre', 36.52, 41.576, 'Track downward along the right pier of a complete red terracotta masonry arch to the wide concrete foundation that touches solid ground. Then smoothly pull back to show both planted piers and the empty passage beneath the stable arch. The arch remains rigid and the ground does not move. End on a clear unobstructed view through the arch.'],
];
const style = 'Vertical 3D architectural educational animation, a single small red terracotta masonry arch in a sunlit garden, stone piers, concrete ground, distant green trees and buildings, soft shadows, clean physically coherent materials, one clear action at a time. ';
const negative = 'text, subtitles, watermark, letters, arrows, diagram symbols, extra arches, impossible geometry, melting bricks, floating foundations, drifting piers, flickering, abrupt cuts, camera shake, people obscuring the mechanism';

export async function prepareComparison() {
  const project = JSON.parse(await fs.readFile(localPath(`${sourceDir}/project.json`), 'utf8'));
  const narration = await fs.readFile(localPath(`${sourceDir}/narration.txt`));
  const plan = {schemaVersion: 1, id: 'arco-alvenaria-wan2gp', title: 'Arco de alvenaria — comparação Wan2GP',
    sourceProject: sourceDir, sourceVideo: `${sourceDir}/render/video.mp4`,
    sourceNarrationSha256: hash(narration), duration: project.duration,
    audioPolicy: 'Reutilizar áudio do MP4 original para preservar voz, pausas e efeitos na comparação.',
    captionPolicy: 'Recompor legendas locais pelos tempos E3; não pedir texto ao modelo.',
    approval: {plan: 'pending', newClips: 'pending', finalPreview: 'pending'},
    generation: {model: 't2v_nexus_1.3B', width: 288, height: 512, fps: 16, steps: 6,
      note: 'Preset inicial de baixo consumo. Qualidade, memória e tempos ainda não medidos nesta GPU.'},
    shots: shots.map(([id, start, end, action], i) => ({id, start, end,
      duration: end - start, prompt: style + action, negativePrompt: negative,
      seed: 20261107 + i, frames: 4 * Math.ceil((end - start) * 16 / 4) + 1,
      review: 'pending', generated: false, requiredFile: `wan2gp-output/${id}.mp4`}))};
  const tasks = plan.shots.map(shot => ({model_type: plan.generation.model,
    prompt: shot.prompt, negative_prompt: negative, resolution: '288x512',
    video_length: shot.frames, num_inference_steps: 6, guidance_scale: 1,
    flow_shift: 5, seed: shot.seed, repeat_generation: 1, image_mode: 0,
    output_filename: shot.id}));
  const image = {...tasks[0], image_mode: 1, video_length: 1, output_filename: 'arco-image-test'};
  await fs.mkdir(localPath(`${projectDir}/generation`), {recursive: true});
  await fs.writeFile(localPath(`${projectDir}/generation-plan.json`), JSON.stringify(plan, null, 2) + '\n');
  await fs.writeFile(localPath(`${projectDir}/generation/video.json`), JSON.stringify(tasks, null, 2) + '\n');
  await fs.writeFile(localPath(`${projectDir}/generation/image.json`), JSON.stringify(image, null, 2) + '\n');
  await fs.writeFile(localPath(`${projectDir}/generation/hook.json`), JSON.stringify(tasks[0], null, 2) + '\n');
  return plan;
}

export async function prepareGuidedComparison() {
  const clean = localPath(`${projectDir}/guides/original-clean.mp4`);
  await fs.access(clean);
  const planFile = localPath(`${projectDir}/generation-plan.json`);
  const plan = JSON.parse(await fs.readFile(planFile,'utf8'));
  const tasks = JSON.parse(await fs.readFile(localPath(`${projectDir}/generation/video.json`),'utf8'));
  const guided = [];
  for (const [i,shot] of plan.shots.entries()) {
    const guide = localPath(`${projectDir}/guides/${shot.id}-clean.mp4`);
    const result = await execute('ffmpeg',['-y','-v','error','-ss',String(shot.start),'-i',clean,
      '-an','-t',String(shot.frames/16),'-vf','fps=16','-c:v','libx264','-preset','fast','-crf','16',guide]);
    if (result.code) throw new Error(`Falha ao cortar guia ${shot.id}`);
    const task = {...tasks[i],video_prompt_type:'GUV',video_guide:guide,denoising_strength:0.1,
      prompt:'A precise 3D educational architectural animation of a masonry arch. Preserve the source geometry, camera framing, radial red wedge bricks, supports, garden, direction of forces and their original motion. Subtly enhance ceramic roughness, natural soft shadows and material definition. No added objects, no new shapes, no text. '+shots[i][3]};
    guided.push(task);
    shot.requiredFile = `wan2gp-guided-output/${shot.id}.mp4`;
    shot.guide = `${projectDir}/guides/${shot.id}-clean.mp4`;
    shot.prompt = task.prompt;
  }
  plan.generation.mode='video-to-video';
  plan.generation.denoisingStrength=0.1;
  plan.guideVideo=`${projectDir}/guides/original-clean.mp4`;
  plan.guidePolicy='Cópia técnica Three.js em 288×512, sem legendas. Texto recomposto depois da geração.';
  plan.approval={plan:'pending',newClips:'pending',finalPreview:'pending'};
  await fs.writeFile(planFile,JSON.stringify(plan,null,2)+'\n');
  for (const [name,tasks] of [['video-guided',guided],['hook-guided-clean',guided[0]],['video-guided-rest',guided.slice(1)]])
    await fs.writeFile(localPath(`${projectDir}/generation/${name}.json`),JSON.stringify(tasks,null,2)+'\n');
  return plan;
}

function assTime(t) {
  const cs = Math.round(t * 100);
  return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2,'0')}:${String(Math.floor(cs / 100) % 60).padStart(2,'0')}.${String(cs % 100).padStart(2,'0')}`;
}

export async function requireClips(plan, directory) {
  const missing = [];
  for (const shot of plan.shots) {
    try { await fs.access(path.join(directory, shot.requiredFile)); }
    catch { missing.push(shot.id); }
  }
  if (missing.length) throw new Error(`Clipes Wan2GP ausentes: ${missing.join(', ')}. Nenhum vídeo substituto será criado.`);
}

// Montagem exclusivamente interna. Não cria aprovação nem contorna o QA final.
export async function assembleComparison({directory=projectDir,label='WAN2GP GUIADO',stamp='EXPERIMENTO WAN2GP - QA PENDENTE'}={}) {
  if(!/^[A-Z0-9 -]+$/.test(label)||!/^[A-Z0-9 -]+$/.test(stamp))throw new Error('Rótulo inválido.');
  const plan = JSON.parse(await fs.readFile(localPath(`${directory}/generation-plan.json`), 'utf8'));
  const source = JSON.parse(await fs.readFile(localPath(`${sourceDir}/project.json`), 'utf8'));
  const narration = await fs.readFile(localPath(`${sourceDir}/narration.txt`));
  if (hash(narration) !== plan.sourceNarrationSha256) throw new Error('A narração de origem mudou; revisar o plano antes da montagem.');
  await requireClips(plan, localPath(directory));
  const render = localPath(`${directory}/render`);
  await fs.mkdir(render, {recursive: true});
  await fs.mkdir(path.join(render,'fonts'),{recursive:true});
  for (const font of ['DejaVuSans.ttf','DejaVuSans-Bold.ttf'])
    await fs.copyFile(`/usr/share/fonts/truetype/dejavu/${font}`,path.join(render,'fonts',font));
  await fs.writeFile(path.join(render,'fonts.conf'),`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${render}/fonts</dir><cachedir>${render}/font-cache</cachedir></fontconfig>`);
  const fontEnv={FONTCONFIG_FILE:path.join(render,'fonts.conf')};
  const deliveryFrames=Math.ceil(plan.duration*30);
  const deliveryDuration=deliveryFrames/30;
  let ass = '[Script Info]\nPlayResX: 1080\nPlayResY: 1920\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,DejaVu Sans,52,&H00FFFFFF,&H00FFFFFF,&H00202020,&H99000000,-1,0,0,0,100,100,0,0,3,3,0,2,75,75,580,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  for (const cap of source.captions) {
    const text = cap.text.replace(/[{}\\]/g, '').replace(/\n/g, '\\N');
    ass += `Dialogue: 0,${assTime(cap.start)},${assTime(cap.start + cap.duration)},Default,,0,0,0,,${text}\n`;
  }
  await fs.writeFile(path.join(render, 'captions.ass'), ass);
  const segments = [];
  for (const [i, shot] of plan.shots.entries()) {
    const input = localPath(`${directory}/${shot.requiredFile}`);
    const probe = await execute('ffprobe',['-v','error','-show_entries','format=duration','-of','json',input],{capture:true});
    if (probe.code || Number(JSON.parse(probe.stdout).format?.duration || 0) < shot.duration - 1/30)
      throw new Error(`Clipe curto ou inválido: ${shot.id}. Gerar novamente; não congelar ou repetir quadros.`);
    const out = path.join(render, `segment-${String(i).padStart(2, '0')}.mp4`);
    const endFrame=i===plan.shots.length-1?deliveryFrames:Math.round(shot.end*30);
    const frameCount = endFrame - Math.round(shot.start * 30);
    const result = await execute('ffmpeg', ['-y','-v','error','-i',input,
      '-an','-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30',
      '-frames:v',String(frameCount),'-c:v','libx264','-preset','fast','-crf','20',out]);
    if (result.code) throw new Error(`Falha ao preparar ${shot.id}`);
    segments.push(out);
  }
  await fs.writeFile(path.join(render,'concat.txt'), segments.map(file => `file '${path.basename(file)}'`).join('\n'));
  let result = await execute('ffmpeg',['-y','-v','error','-f','concat','-safe','1','-i','concat.txt',
    '-i',localPath(plan.sourceVideo),'-map','0:v:0','-map','1:a:0',
    '-vf',`ass=captions.ass:fontsdir=fonts,drawtext=fontfile=fonts/DejaVuSans-Bold.ttf:text='${stamp}':fontsize=28:fontcolor=white:box=1:boxcolor=black@0.7:x=(w-tw)/2:y=80`,
    '-t',String(deliveryDuration),'-c:v','libx264','-preset','fast','-crf','20','-c:a','copy','-movflags','+faststart','wan2gp-internal.mp4'], {cwd:render,env:fontEnv});
  if (result.code) throw new Error('Falha na montagem interna.');
  result = await execute('ffmpeg',['-y','-v','error','-i',localPath(plan.sourceVideo),'-i','wan2gp-internal.mp4',
    '-filter_complex',`[0:v]scale=540:960,setsar=1,pad=540:1024:0:64:black,drawtext=fontfile=fonts/DejaVuSans-Bold.ttf:text='ORIGINAL 3D':fontsize=24:fontcolor=white:x=20:y=20[a];[1:v]scale=540:960,setsar=1,pad=540:1024:0:64:black,drawtext=fontfile=fonts/DejaVuSans-Bold.ttf:text='${label}':fontsize=24:fontcolor=white:x=20:y=20[b];[a][b]hstack=inputs=2[v]`,
    '-map','[v]','-map','0:a:0','-t',String(deliveryDuration),'-c:v','libx264','-preset','fast','-crf','20','-c:a','copy','-movflags','+faststart','comparison-internal.mp4'], {cwd:render,env:fontEnv});
  if (result.code) throw new Error('Falha ao compor comparação.');
  return {status:'internal-qa-required', humanApproved:false, file:`${directory}/render/comparison-internal.mp4`};
}
