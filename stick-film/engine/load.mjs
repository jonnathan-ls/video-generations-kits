// Node-side loader: finds the workspace, reads film.json + characters + voice.json, runs the engine and scene.js in node.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

export const ENGINE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ENGINE_FILES = ['lib.js', 'rig.js', 'poses.js', 'gait.js', 'cloth.js', 'theme.js', 'character.js', 'props.js', 'fx.js', 'sets.js', 'film.js', 'compose.js', 'rigtest.js'];

export function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

// the workspace holds characters/ and films/. STICKFILM_HOME wins; otherwise walk up from `from` looking for characters/.
export function findHome(from) {
  if (process.env.STICKFILM_HOME) return path.resolve(process.env.STICKFILM_HOME.replace(/^~/, process.env.HOME));
  let d = path.resolve(from || process.cwd());
  for (let i = 0; i < 6; i++) { if (fs.existsSync(path.join(d, 'characters'))) return d; const up = path.dirname(d); if (up === d) break; d = up; }
  return path.join(process.env.HOME || '.', 'StickFilms');
}

export function resolveCharacter(ref, filmDir) {
  if (ref.endsWith('.json')) return path.resolve(filmDir, ref);
  const home = findHome(filmDir);
  const cands = [path.join(home, 'characters', ref, 'character.json'), path.join(ENGINE_DIR, '..', 'examples', 'characters', ref, 'character.json')];
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error(`character "${ref}" not found. Looked in:\n  ${cands.join('\n  ')}`);
}

export function loadFilmData(filmDir) {
  filmDir = path.resolve(filmDir);
  const film = readJSON(path.join(filmDir, 'film.json'));
  const cast = {};
  for (const [id, ref] of Object.entries(film.cast || {})) {
    const p = resolveCharacter(typeof ref === 'string' ? ref : ref.character, filmDir);
    cast[id] = Object.assign(readJSON(p), typeof ref === 'object' ? ref.override || {} : {});
    cast[id]._path = p;
  }
  const vp = path.join(filmDir, 'voice', 'voice.json');
  const voice = fs.existsSync(vp) ? readJSON(vp) : null;
  return { dir: filmDir, film, cast, voice, scene: path.join(filmDir, film.scene || 'scene.js') };
}

let loaded = false;
export function loadEngine() {
  if (loaded) return globalThis.SF; loaded = true;
  for (const f of ENGINE_FILES) vm.runInThisContext(fs.readFileSync(path.join(ENGINE_DIR, f), 'utf8'), { filename: path.join(ENGINE_DIR, f) });
  return globalThis.SF;
}

export function compileFilm(filmDir) {
  const SF = loadEngine();
  const data = loadFilmData(filmDir);
  vm.runInThisContext(fs.readFileSync(data.scene, 'utf8'), { filename: data.scene });
  const film = SF.compile(data);
  return { SF, data, film };
}
