#!/usr/bin/env node
// Local HyperFrames CLI resolver. Avoids `npx` when the npm cache is read-only.
// Prefer the version the kit was validated with; override with HYPERFRAMES_CLI.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PINNED = process.env.HYPERFRAMES_VERSION || '0.8.210';
const entries = [];
const add = (p) => {
  if (!existsSync(p)) return;
  try {
    const pkg = JSON.parse(readFileSync(path.join(path.dirname(p), '..', 'package.json'), 'utf8'));
    entries.push({ p, version: pkg.version || '0.0.0' });
  } catch {}
};
if (process.env.HYPERFRAMES_CLI) entries.push({ p: process.env.HYPERFRAMES_CLI, version: 'env' });
add(path.join(process.cwd(), 'node_modules/hyperframes/dist/cli.js'));
const npx = path.join(homedir(), '.npm/_npx');
if (existsSync(npx)) for (const dir of readdirSync(npx)) add(path.join(npx, dir, 'node_modules/hyperframes/dist/cli.js'));

const clean = (v) => v.replace(/^v/, '').split('-')[0];
const pick = entries.find((e) => e.version === 'env') ||
  entries.find((e) => clean(e.version) === PINNED) ||
  entries.sort((a, b) => clean(b.version).localeCompare(clean(a.version), undefined, { numeric: true }))[0];

if (!pick) {
  console.error('HyperFrames CLI não encontrado. Defina HYPERFRAMES_CLI=/caminho/dist/cli.js.');
  process.exit(1);
}
const child = spawn(process.execPath, [pick.p, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', (code, signal) => process.exit(signal ? 1 : code ?? 1));
