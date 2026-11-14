import {config, doctor, execute, localPath, commandArgs, runGeneration} from '../integrations/wan2gp/adapter.mjs';

const [action, settings, output, ...flags] = process.argv.slice(2);
try {
  if (action === 'doctor') {
    const report = await doctor();
    console.log(JSON.stringify({ready: report.ready, commitMatches: report.commitMatches,
      dependenciesInstalled: report.dependenciesInstalled, runtime: report.runtime,
      gpuRequiresReset: report.gpuRequiresReset, report: `${config.runtime}/doctor.json`}, null, 2));
    process.exitCode = report.ready ? 0 : 1;
  } else if (action === 'download-models') {
    const result = await execute(localPath(config.python), [localPath('kit/integrations/wan2gp/download-models.py')]);
    process.exitCode = result.code;
  } else if (action === 'ui') {
    const report = await doctor();
    if (!report.ready) throw new Error('CUDA indisponível; consulte o diagnóstico do kit.');
    const result = await execute(localPath(config.python), commandArgs({ui: true}), {cwd: localPath(config.directory)});
    process.exitCode = result.code;
  } else if (action === 'generate') {
    if (flags.some(f => !['--dry-run','--offline'].includes(f))) throw new Error('Opção desconhecida.');
    const result = await runGeneration({settings, output, dryRun: flags.includes('--dry-run'), offline: flags.includes('--offline')});
    process.exitCode = result.code;
  } else throw new Error('Uso interno: wan2gp.mjs doctor | download-models | ui | generate <settings.json> <saída> [--dry-run] [--offline]');
} catch (error) { console.error(error.message); process.exitCode = 1; }
