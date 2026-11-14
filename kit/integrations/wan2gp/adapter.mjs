import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const config = JSON.parse(await fs.readFile(new URL('./config.json', import.meta.url), 'utf8'));

export function localPath(relative) {
  const result = path.resolve(ROOT, relative);
  if (!result.startsWith(ROOT + path.sep)) throw new Error('O caminho precisa estar dentro deste repositório.');
  return result;
}

export function commandArgs({settings, output, dryRun = false, offline = false, ui = false} = {}) {
  const args = [localPath(`${config.directory}/wgp.py`), '--profile', config.profile,
    '--attention', config.attention, '--config', localPath(config.runtime)];
  if (ui) args.push('--server-name', config.host, '--server-port', String(config.port));
  else {
    if (!settings || !output) throw new Error('Defina o arquivo de geração e a pasta de saída.');
    args.push('--process', localPath(settings), '--output-dir', localPath(output));
    if (dryRun) args.push('--dry-run');
  }
  if (offline) args.push('--offline');
  return args;
}

export function execute(command, args, {cwd = ROOT, capture = false, timeout = 0, env = {}} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd, shell: false,
      env: {...process.env, ...env, GRADIO_ANALYTICS_ENABLED: 'False', HF_HUB_DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1'},
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'});
    let stdout = '', stderr = '';
    child.stdout?.on('data', data => { stdout += data; });
    child.stderr?.on('data', data => { stderr += data; });
    const timer = timeout ? setTimeout(() => child.kill('SIGTERM'), timeout) : null;
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', (code, signal) => { clearTimeout(timer); resolve({code: code ?? 1, signal, stdout, stderr}); });
  });
}

export async function doctor() {
  const python = localPath(config.python);
  const script = `import json, ctypes, importlib.metadata as m
r={}
for package in ['torch','torchvision','torchaudio','gradio','diffusers','transformers','optimum-quanto']:
 try: r[package]=m.version(package)
 except m.PackageNotFoundError: r[package]=None
try:
 import torch
 r['cuda_available']=torch.cuda.is_available()
 if r['cuda_available']:
  r['gpu']=torch.cuda.get_device_name(0)
  r['vram_bytes']=torch.cuda.get_device_properties(0).total_memory
  r['cuda_tensor']=(torch.ones(1,device='cuda')*2).item()
except Exception as e: r['torch_error']=str(e)
try:
 c=ctypes.CDLL('libcuda.so.1'); code=c.cuInit(0); p=ctypes.c_char_p(); c.cuGetErrorString(code,ctypes.byref(p))
 r['cuInit']={'code':code,'message':p.value.decode() if p.value else ''}
except Exception as e: r['driver_error']=str(e)
print(json.dumps(r))`;
  let runtime;
  try {
    const result = await execute(python, ['-c', script], {capture: true, timeout: 60000});
    runtime = JSON.parse(result.stdout.trim().split('\n').at(-1));
  } catch (error) { runtime = {error: error.message, cuda_available: false}; }
  let upstream;
  try { upstream = (await execute('git', ['-C', localPath(config.directory), 'rev-parse', 'HEAD'], {capture: true})).stdout.trim(); }
  catch { upstream = null; }
  let nvidia;
  try { const result = await execute('nvidia-smi', ['-q'], {capture: true, timeout: 15000}); nvidia = result.stdout || result.stderr; }
  catch (error) { nvidia = error.message; }
  const dependenciesInstalled = ['torch','torchvision','torchaudio','gradio','diffusers','transformers','optimum-quanto'].every(p => runtime[p]);
  const report = {schemaVersion: 1, checkedAt: new Date().toISOString(), upstream,
    pinnedCommit: config.commit, commitMatches: upstream === config.commit, dependenciesInstalled,
    runtime, gpuRequiresReset: /GPU requires reset|GPU Recovery Action\s*:\s*Reset/.test(nvidia),
    ready: dependenciesInstalled && upstream === config.commit && runtime.cuda_available === true && runtime.cuda_tensor === 2,
    nvidia};
  await fs.mkdir(localPath(config.runtime), {recursive: true});
  await fs.writeFile(localPath(`${config.runtime}/doctor.json`), JSON.stringify(report, null, 2) + '\n');
  return report;
}

export async function runGeneration(options) {
  const args = commandArgs(options);
  const report = await doctor();
  if (!report.ready) throw new Error(`Wan2GP bloqueado: ${report.gpuRequiresReset ? 'o driver exige reset da GPU' : 'ambiente/CUDA indisponível'}. Diagnóstico salvo em ${config.runtime}/doctor.json.`);
  await fs.mkdir(localPath(options.output), {recursive: true});
  const input = await fs.readFile(localPath(options.settings));
  const job = {schemaVersion: 1, status: 'running', startedAt: new Date().toISOString(),
    upstreamCommit: report.upstream, settings: options.settings, inputSha256: createHash('sha256').update(input).digest('hex'),
    output: options.output, dryRun: !!options.dryRun, humanApproved: false};
  const jobFile = localPath(`${options.output}/job.json`);
  await fs.writeFile(jobFile, JSON.stringify(job, null, 2) + '\n');
  try {
    const result = await execute(localPath(config.python), args, {cwd: localPath(config.directory)});
    job.status = result.code === 0 ? (options.dryRun ? 'validated' : 'generated-awaiting-qa') : 'failed';
    job.exitCode = result.code;
    return result;
  } catch (error) { job.status = 'failed'; job.error = error.message; throw error; }
  finally { job.finishedAt = new Date().toISOString(); await fs.writeFile(jobFile, JSON.stringify(job, null, 2) + '\n'); }
}
