import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const revisionDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(revisionDir, '../../../../..');
const readJson = async relative => JSON.parse(await fs.readFile(path.join(revisionDir, relative), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const hashFile = async file => sha256(await fs.readFile(file));

const [plan, style, beats, assetPlan, backlog, sound, sourceMetadata, integration, modelLock] = await Promise.all([
  readJson('generation-plan.json'),
  readJson('style-bible.json'),
  readJson('beats.json'),
  readJson('asset-plan.json'),
  readJson('backlog.json'),
  readJson('sound-design.json'),
  fs.readFile(path.join(root, 'research/references/crochet-mini-kitchen/source-metadata.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'kit/integrations/wan2gp/config.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'kit/integrations/wan2gp/models.lock.json'), 'utf8').then(JSON.parse)
]);

const checks = [];
const addCheck = (id, ok, method, evidence = null) => checks.push({id, status: ok ? 'pass' : 'fail', method, evidence});
const duration = plan.durationSeconds;
const visualFields = ['attentionTarget', 'visualQuestion', 'visibleEvent', 'stateBefore', 'stateAfter', 'cameraReveal', 'soundIntent'];
const beatIds = new Set(beats.map(beat => beat.id));
const modelEntry = modelLock.files.find(file => file.file === plan.approach.checkpoint.file);
const sourcePath = path.join(root, plan.source.localPath);
const sourceHash = await hashFile(sourcePath);

addCheck('source-hash-and-sampling',
  sourceHash === plan.source.sha256 && sourceMetadata.sha256 === plan.source.sha256 && sourceMetadata.framesExtractedAtFps === 10 && sourceMetadata.framesExtracted === 294 && plan.source.passedToModel === false,
  'hash do arquivo local e metadados comparados; 294 quadros a 10 fps; origem excluída da fila',
  plan.source.localPath);

const contiguous = beats.length === 12 && Math.abs(beats[0]?.start ?? -1) < 1e-6 && Math.abs(beats.at(-1)?.end - duration) < 1e-6 && beats.every((beat, index) =>
  Number.isFinite(beat.start) && Number.isFinite(beat.end) && beat.end > beat.start && (!index || Math.abs(beats[index - 1].end - beat.start) < 1e-6));
addCheck('12-beat-coverage-and-timing', contiguous, '12 beats cobrem intervalos contíguos de 0 a 29,375 s', 'beats.json');

const plansComplete = beats.every(beat => beat.visualPlan?.beatId === beat.id && visualFields.every(field => typeof beat.visualPlan[field] === 'string' && beat.visualPlan[field].trim()) && Array.isArray(beat.guideSequence) && beat.guideSequence.length >= 3 && beat.dialogue === null);
addCheck('visual-plan-and-action-states', plansComplete, 'cada beat tem alvo, pergunta, evento, estados, câmera, som e sequência de ação; sem fala', 'beats.json');

const cutTimesValid = beats.every(beat => [...(beat.sourceCutCandidates?.times ?? []), ...(beat.plannedMicrocuts ?? [])].every(time => time >= beat.start && time < beat.end));
addCheck('cut-candidate-bounds', cutTimesValid, 'candidatos e inserts propostos ficam dentro do beat correspondente', 'beats.json');

const creates = assetPlan.decisions.filter(decision => decision.action === 'create');
const backlogById = new Map(backlog.items.map(item => [item.id, item]));
const alignedResources = assetPlan.narrative === false && assetPlan.narrationHash === null && backlog.status === 'planned-before-build' && creates.length === backlog.items.length && creates.every(decision => {
  const item = backlogById.get(decision.id);
  return item && item.kind === decision.kind && typeof item.specification === 'string' && item.specification.trim() && decision.reason?.trim() && decision.label?.trim();
}) && backlog.items.every(item => creates.some(decision => decision.id === item.id)) && assetPlan.decisions.filter(decision => decision.action === 'ignore').every(decision => decision.reason?.trim());
addCheck('resource-backlog-before-build', assetPlan.decisions.length >= 10 && backlog.items.length >= 10 && alignedResources,
  'inventário sem narração segue o contrato do Studio: cada recurso criado tem item de backlog do mesmo ID e tipo; itens ignorados têm justificativa', 'asset-plan.json; backlog.json');

const cuesValid = sound.cues.length > 0 && sound.cues.every(cue => beatIds.has(cue.beatId) && Number.isFinite(cue.time) && Number.isFinite(cue.duration) && cue.time >= 0 && cue.duration > 0 && cue.time + cue.duration <= duration + 1e-6);
addCheck('sound-cues-linked-and-bounded', cuesValid, 'cada cue tem beat e contato; todos ficam dentro da duração total', 'sound-design.json');

addCheck('wan2gp-method-pinned', plan.approach.wan2gpMode === 'GUV' && plan.approach.denoisingStrength === 0.1 && plan.approach.modelType === integration.defaultModel && modelEntry?.sha256 === plan.approach.checkpoint.sha256 && integration.commit === plan.approach.upstream.commit,
  'modo, denoise inicial, checkpoint e commit comparados aos locks locais; eficácia em crochê permanece não verificada', 'generation-plan.json; kit/integrations/wan2gp/models.lock.json');

const noRender = plan.runBoundary.generationStarted === false && plan.runBoundary.gpuUsedByRevision02 === false && plan.runBoundary.doctorOrCudaCalled === false && plan.runBoundary.guideRendered === false && plan.runBoundary.videoRendered === false && plan.runBoundary.finalAssemblyRendered === false;
addCheck('render-boundary-preserved', noRender, 'nenhuma geração, doctor/CUDA, guia ou vídeo foi iniciada nesta revisão', 'generation-plan.json');

const inputFiles = ['generation-plan.json', 'style-bible.json', 'beats.json', 'asset-plan.json', 'backlog.json', 'sound-design.json'];
const hashes = {};
for (const relative of inputFiles) hashes[relative] = sha256(await fs.readFile(path.join(revisionDir, relative)));

const report = {
  schemaVersion: 1,
  revision: 2,
  checkedAt: new Date().toISOString(),
  status: checks.some(check => check.status === 'fail') ? 'rejected' : 'not-verified',
  scope: 'preflight estático da modelagem; não valida textura, motion, áudio renderizado nem qualidade de vídeo',
  errors: checks.filter(check => check.status === 'fail').map(check => check.id),
  checks,
  sourceSha256: sourceHash,
  inputSha256: hashes,
  gpuUsed: false,
  guideRendered: false,
  videoRendered: false,
  nativeWan2gpDryRun: 'not-run; o dry-run do adaptador chama doctor/CUDA e foi deliberadamente evitado',
  nextGate: plan.runBoundary.nextGate
};

await fs.mkdir(path.join(revisionDir, 'qa'), {recursive: true});
await fs.writeFile(path.join(revisionDir, 'qa/preflight.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.status === 'rejected') process.exitCode = 1;

