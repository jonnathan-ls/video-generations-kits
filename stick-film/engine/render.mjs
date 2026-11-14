#!/usr/bin/env node
// Renderer CLI (headless Chrome through Playwright).
//   node render.mjs frames  <filmDir> [--workers 4] [--from F] [--to F]     -> <filmDir>/build/frames/f_0000.png ...
//   node render.mjs stills  <filmDir> --times 1,2.5,7 [--scale 0.5]         -> <filmDir>/build/qa/still_<t>.png
//   node render.mjs sheet   <filmDir> [--every 0.2] [--from s] [--to s] [--cols 6] [--cell 320] -> build/qa/sheet_NN.png
//   node render.mjs events  <filmDir>                                       -> <filmDir>/build/sync.json (sound events)
//   node render.mjs rigtest <characterDir>                                  -> <characterDir>/rigtest/*.png
//   node render.mjs styles  <outPng> [--character path/to/character.json]   -> the four-style menu
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { ENGINE_DIR, ENGINE_FILES, loadFilmData, compileFilm, readJSON, findHome } from './load.mjs';

const args = process.argv.slice(2), cmd = args[0], target = args[1];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };

// ---- find Playwright and a Chrome to drive ----------------------------------------------------------------------------
async function playwright() {
  const req = createRequire(import.meta.url), home = findHome(process.cwd());
  const tries = ['playwright-core', 'playwright', path.join(home, '.tools', 'node_modules', 'playwright-core'), path.join(home, '.tools', 'node_modules', 'playwright'),
    '/opt/node22/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright', '/opt/homebrew/lib/node_modules/playwright'];
  for (const t of tries) { try { const m = req(t); if (m.chromium) return m; } catch (e) { /* next */ } }
  throw new Error('Playwright not found. Run scripts/setup.sh --install (it puts playwright-core in <workspace>/.tools).');
}
function chromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const c = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of c) if (fs.existsSync(p)) return p;
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw).sort().reverse()) { const p = path.join(pw, d, 'chrome-linux', 'chrome'); if (d.startsWith('chromium') && fs.existsSync(p)) return p; }
  return null;   // let Playwright use its own download, if any
}
async function browser() {
  const pw = await playwright(), exe = chromePath();
  return pw.chromium.launch({ executablePath: exe || undefined, args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'] });
}

// ---- the page: engine scripts + data + scene ----------------------------------------------------------------------------
const fileUrl = (p) => 'file://' + path.resolve(p).split(path.sep).map(encodeURIComponent).join('/').replace(/^file:\/\/%3A/, 'file:///');
function pageHtml(W, H, dataJs, extraScripts) {
  const tags = ENGINE_FILES.map((f) => `<script src="${fileUrl(path.join(ENGINE_DIR, f))}"></script>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#888}canvas{display:block}</style></head><body>
<canvas id="c" width="${W}" height="${H}"></canvas>
${tags}
<script>${dataJs}</script>
${(extraScripts || []).map((s) => `<script src="${fileUrl(s)}"></script>`).join('\n')}
<script>window.ready = true;</script></body></html>`;
}
function writePage(dir, name, html) { fs.mkdirSync(dir, { recursive: true }); const p = path.join(dir, name); fs.writeFileSync(p, html); return p; }
async function openPage(br, pagePath, W, H) {
  const p = await br.newPage({ viewport: { width: Math.min(W, 4000), height: Math.min(H, 4000) } });
  const errs = [];
  p.on('pageerror', (e) => { errs.push(e.message); console.error('[page error]', e.message); });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  await p.goto(fileUrl(pagePath));
  await p.waitForFunction('window.ready === true');
  if (errs.length) throw new Error('page failed to load: ' + errs[0]);
  return p;
}
const dataUrl = (f) => `data:image/${/\.png$/i.test(f) ? 'png' : /\.webp$/i.test(f) ? 'webp' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;
const save = (file, dataUrl) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); };

function filmPage(filmDir) {
  const data = loadFilmData(filmDir), W = data.film.width || 1920, H = data.film.height || 1080;
  const js = `SF.DATA = ${JSON.stringify({ film: data.film, cast: data.cast, voice: data.voice })};`;
  const boot = path.join(data.dir, 'build', 'boot.js');
  fs.mkdirSync(path.dirname(boot), { recursive: true });
  fs.writeFileSync(boot, `window.FILM = SF.compile(SF.DATA); window.COMP = SF.compose.create(window.FILM);
const ctx = document.getElementById('c').getContext('2d');
window.frameAt = (t, scale, fmt) => { window.COMP.render(ctx, t); if (!scale || scale === 1) return document.getElementById('c').toDataURL(fmt || 'image/png');
  const o = document.createElement('canvas'); o.width = Math.round(${W} * scale); o.height = Math.round(${H} * scale); o.getContext('2d').drawImage(document.getElementById('c'), 0, 0, o.width, o.height); return o.toDataURL(fmt || 'image/png'); };
window.duration = window.FILM.duration; window.fps = window.FILM.fps;`);
  return { data, W, H, page: writePage(path.join(data.dir, 'build'), 'page.html', pageHtml(W, H, js, [data.scene, boot])) };
}

// ---- commands ---------------------------------------------------------------------------------------------------------------
async function frames() {
  const fp = filmPage(target), { film } = compileFilm(target), fps = film.fps, N = Math.round(film.duration * fps);
  const a = +opt('from', 0), b = +opt('to', N), workers = +opt('workers', Math.max(1, Math.min(4, os.cpus().length - 1))), out = opt('out', path.join(fp.data.dir, 'build', 'frames'));
  if (opt('worker')) {                                          // child process: render [a, b)
    const br = await browser(), p = await openPage(br, fp.page, fp.W, fp.H);
    const sc = +opt('scale', 1);
    for (let f = a; f < b; f++) save(path.join(out, `f_${String(f).padStart(5, '0')}.png`), await p.evaluate(([t, s]) => window.frameAt(t, s), [f / fps, sc]));
    await br.close(); return;
  }
  if (a === 0 && b === N && fs.existsSync(out)) for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
  const t0 = Date.now(), per = Math.ceil((b - a) / workers), kids = [];
  for (let w = 0; w < workers; w++) {
    const s = a + w * per, e = Math.min(b, s + per); if (s >= e) continue;
    kids.push(new Promise((res, rej) => { const k = spawn(process.execPath, [path.join(ENGINE_DIR, 'render.mjs'), 'frames', target, '--from', s, '--to', e, '--out', out, '--worker', '1', '--scale', opt('scale', 1)], { stdio: 'inherit' }); k.on('exit', (c) => (c ? rej(new Error('worker failed ' + c)) : res())); }));
  }
  await Promise.all(kids);
  const n = fs.readdirSync(out).filter((f) => f.endsWith('.png')).length;
  console.log(`rendered ${b - a} frames (${n} in ${path.relative(process.cwd(), out) || out}) in ${((Date.now() - t0) / 1000).toFixed(1)} s with ${workers} workers`);
  if (a === 0 && b === N && n !== N) { console.error(`expected ${N} frames, found ${n}`); process.exit(1); }
}

async function stills() {
  const fp = filmPage(target), times = (opt('times', '0') + '').split(',').map(Number), scale = +opt('scale', 0.5), out = opt('out', path.join(fp.data.dir, 'build', 'qa'));
  const br = await browser(), p = await openPage(br, fp.page, fp.W, fp.H);
  for (const t of times) { const f = path.join(out, `still_${t.toFixed(2)}.png`); save(f, await p.evaluate(([t, s]) => window.frameAt(t, s), [t, scale])); console.log(f); }
  await br.close();
}

async function sheet() {
  const fp = filmPage(target), { film } = compileFilm(target);
  const every = +opt('every', 0.2), from = +opt('from', 0), to = +opt('to', film.duration), cols = +opt('cols', 6), cell = +opt('cell', 320), perSheet = +opt('per', 36);
  const out = opt('out', path.join(fp.data.dir, 'build', 'qa')), times = [];
  for (let t = from; t <= to + 1e-6; t += every) times.push(+t.toFixed(3));
  const br = await browser(), p = await openPage(br, fp.page, fp.W, fp.H), files = [];
  for (let s = 0; s * perSheet < times.length; s++) {
    const ts = times.slice(s * perSheet, (s + 1) * perSheet), file = path.join(out, `sheet_${String(s + 1).padStart(2, '0')}.png`);
    const url = await p.evaluate(([ts, cols, cell, W, H]) => {
      const ch = Math.round(cell * H / W), rows = Math.ceil(ts.length / cols), c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * ch;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      ts.forEach((t, i) => { window.COMP.render(document.getElementById('c').getContext('2d'), t); const x = (i % cols) * cell, y = Math.floor(i / cols) * ch; g.drawImage(document.getElementById('c'), x, y, cell, ch);
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x, y, 64, 20); g.fillStyle = '#000'; g.font = '14px sans-serif'; g.fillText(t.toFixed(1) + 's', x + 5, y + 15); g.strokeStyle = '#999'; g.strokeRect(x, y, cell, ch); });
      return c.toDataURL('image/png');
    }, [ts, cols, cell, fp.W, fp.H]);
    save(file, url); files.push(file); console.log(file, `${ts[0]}s-${ts[ts.length - 1]}s`);
  }
  await br.close();
}

function events() {
  const { film, data } = compileFilm(target), out = path.join(data.dir, 'build', 'sync.json');
  const ev = film.events(), counts = {};
  for (const e of ev) counts[e.type] = (counts[e.type] || 0) + 1;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ duration: film.duration, fps: film.fps, cues: film.cues, moods: film.moods, music: film.music, events: ev }, null, 1));
  console.log(out, JSON.stringify(counts));
}

async function rigtest() {
  const dir = path.resolve(target), spec = readJSON(path.join(dir, 'character.json')), kit = path.join(dir, 'kit'), out = path.join(dir, 'rigtest');
  const pick = (names) => { for (const n of names) for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) { const p = path.join(kit, n + ext); if (fs.existsSync(p)) return p; } return null; };
  const jobs = [['turnaround', pick(['01-master'])], ['expressions', pick(['02-expressions'])], ['feelings', pick(['03-feelings', '03-poses'])], ['actions', pick(['04-actions'])], ['extras', null]];
  const W = 3200, H = 1000, js = `SF.SPEC = ${JSON.stringify(spec)};`;
  const page = writePage(out, '.page.html', pageHtml(W, H, js));
  const br = await browser(), p = await openPage(br, page, W, H);
  for (const [which, img] of jobs) {
    const w = img ? W : W / 2 + 100;
    const url = await p.evaluate(async ([which, img, w, H]) => {
      let im = null; if (img) { im = new Image(); im.src = img; await im.decode(); }
      const c = document.createElement('canvas'); c.width = w; c.height = H; SF.rigtest.sheet(c.getContext('2d'), SF.SPEC, which, im, w, H); return c.toDataURL('image/png');
    }, [which, img ? dataUrl(img) : null, w, H]);
    const f = path.join(out, `rigtest_${which}.png`); save(f, url); console.log(f, img ? `(beside ${path.basename(img)})` : '');
  }
  await br.close();
}

async function styles() {
  const out = path.resolve(target || 'styles.png'), base = opt('character') ? readJSON(opt('character')) : {};
  const W = 2400, H = 1350, page = writePage(path.join(os.tmpdir(), 'stickfilm-styles'), 'page.html', pageHtml(W, H, `SF.BASE = ${JSON.stringify(base)};`));
  const br = await browser(), p = await openPage(br, page, W, H);
  save(out, await p.evaluate(([W, H]) => { const c = document.getElementById('c'); SF.rigtest.styleMenu(c.getContext('2d'), W, H, SF.BASE && Object.keys(SF.BASE).length ? SF.BASE : null); return c.toDataURL('image/png'); }, [W, H]));
  console.log(out); await br.close();
}

const CMDS = { frames, stills, sheet, events, rigtest, styles };
if (!CMDS[cmd]) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n')); process.exit(cmd ? 1 : 0); }
Promise.resolve(CMDS[cmd]()).catch((e) => { console.error(e.stack || e.message); process.exit(1); });
