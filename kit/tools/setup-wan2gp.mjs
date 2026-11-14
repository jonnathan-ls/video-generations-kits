import fs from 'node:fs/promises';
import {config, execute, localPath, doctor} from '../integrations/wan2gp/adapter.mjs';

async function checked(command, args) {
  const result = await execute(command, args);
  if (result.code) throw new Error(`${command} terminou com código ${result.code}.`);
}
try {
  try { await fs.access(localPath(`${config.directory}/wgp.py`)); }
  catch { await fs.mkdir(localPath('vendor'), {recursive:true});
    await checked('git',['clone','--depth','1',config.upstream,localPath(config.directory)]); }
  const git = ['-C',localPath(config.directory)];
  const current = await execute('git',[...git,'rev-parse','HEAD'], {capture:true});
  if (current.stdout.trim() !== config.commit) {
    const dirty = await execute('git',[...git,'status','--porcelain'], {capture:true});
    if (dirty.code || dirty.stdout.trim()) throw new Error('A cópia do Wan2GP contém alterações; preservá-las antes de trocar a versão.');
    await checked('git',[...git,'fetch','--depth','1','origin',config.commit]);
    await checked('git',[...git,'checkout','--detach',config.commit]);
  }
  await checked('uv',['python','install','3.11']);
  try { await fs.access(localPath(config.python)); }
  catch { await checked('uv',['venv','--python','3.11',localPath('.tools/wan2gp-venv')]); }
  await checked('uv',['pip','install','--python',localPath(config.python),
    'torch==2.10.0','torchvision==0.25.0','torchaudio==2.10.0',
    '--index-url','https://download.pytorch.org/whl/cu130']);
  await checked('uv',['pip','install','--python',localPath(config.python),'-r',localPath(`${config.directory}/requirements.txt`)]);
  const check = await execute('uv',['pip','check','--python',localPath(config.python)],{capture:true});
  if (check.code) {
    // O wheel oficial de decord 0.6.0 declara cp36, mas usa ctypes, sem extensão
    // CPython. Conferir o import real, preservando o pacote original e sua licença.
    const detail = check.stdout + check.stderr;
    if (!detail.includes('Found 1 incompatibility') || !detail.includes('`decord` was built for a different platform'))
      throw new Error(detail);
    await checked(localPath(config.python),['-c','import decord; print("decord importado:", decord.__version__)']);
    console.log('Metadado cp36 do wheel decord preservado; import real verificado no Python 3.11.');
  }
  console.log(JSON.stringify(await doctor(),null,2));
} catch (error) { console.error(error.message); process.exitCode=1; }
