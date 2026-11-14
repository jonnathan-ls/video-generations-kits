#!/usr/bin/env node
// Motion QA without rendering: samples every frame of the compiled film and flags the mistakes that slipped through
// before (backwards knees, hands hidden behind the head, limbs through the ground, pops between frames, characters
// off screen, narration overlapping the next cue). Usage: node qa.mjs <filmDir> [--json]
import fs from 'fs';
import path from 'path';
import { compileFilm } from './load.mjs';

const dir = process.argv[2], asJson = process.argv.includes('--json');
const { film, data } = compileFilm(dir);
const dt = 1 / film.fps, N = Math.round(film.duration * film.fps);
const issues = [];
const add = (kind, level, actor, t, msg) => issues.push({ kind, level, actor, t: +t.toFixed(2), msg });

// group consecutive frames with the same problem into one line
function runs(list, gap) {
  const out = []; let cur = null;
  for (const it of list) { if (cur && it.t - cur.t1 <= (gap || 2.5 * dt)) { cur.t1 = it.t; cur.worst = Math.max(cur.worst, it.v); } else { if (cur) out.push(cur); cur = { t0: it.t, t1: it.t, worst: it.v }; } }
  if (cur) out.push(cur); return out;
}

for (const A of film.actors) {
  const R = A.R, H = R.H, bad = { ground: [], knee: [], hidden: [], pop: [], off: [], elbow: [] };
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const t = Math.min(film.duration - 1e-6, i * dt);
    if (!A.visibleAt(t)) { prev = null; continue; }
    const p = A.poseAt(t), J = A.rig.solve(p), f = J.f;
    const lying = Math.abs(p.tau) > 60;
    // 1. through the ground (y > 0 is below). Feet soles sit at ankle + FOOT_RY.
    const low = Math.max(J.knee[0][1], J.knee[1][1], J.hand[0][1] + R.HAND_RY, J.hand[1][1] + R.HAND_RY, J.ankle[0][1] + R.FOOT_RY * 0.6, J.ankle[1][1] + R.FOOT_RY * 0.6, lying ? -1e9 : J.Hc[1] + R.HR);
    if (low > 3) bad.ground.push({ t, v: low });
    // 2. knees must bend toward the facing direction
    for (let k = 0; k < 2; k++) {
      const hx = J.P[0], hy = J.P[1], ax = J.ankle[k][0] - hx, ay = J.ankle[k][1] - hy, kx = J.knee[k][0] - hx, ky = J.knee[k][1] - hy;
      const L2 = Math.hypot(ax, ay) || 1, side = (ax * ky - ay * kx) / L2;          // signed distance of knee from hip-ankle line
      if (side * f > 0.012 * H) bad.knee.push({ t, v: side * f });
    }
    // 3. far hand hidden inside the head (the far arm draws behind the head)
    const dh = Math.hypot(J.hand[1][0] - J.Hc[0], J.hand[1][1] - J.Hc[1]);
    if (dh < R.HR * 0.82) bad.hidden.push({ t, v: R.HR - dh });
    // 4. elbows pointing forward-up while the hand hangs low (looks like a broken arm)
    for (let k = 0; k < 2; k++) {
      const sx = J.sh[0], sy = J.sh[1], hx = J.hand[k][0] - sx, hy = J.hand[k][1] - sy, ex = J.elbow[k][0] - sx, ey = J.elbow[k][1] - sy;
      const side = (hx * ey - hy * ex) / (Math.hypot(hx, hy) || 1);
      if (side * f < -0.05 * H && J.hand[k][1] > sy + 0.1 * H && J.elbow[k][1] < sy) bad.elbow.push({ t, v: -side * f });
    }
    // 5. pops: a joint jumping more than 0.2 H in one frame (ignored across facing flips)
    if (prev && prev.f === f) {
      const pts = [['Hc'], ['hand', 0], ['hand', 1], ['ankle', 0], ['ankle', 1]];
      let m = 0; for (const [k, j] of pts) { const a = j === undefined ? J[k] : J[k][j], b = j === undefined ? prev.J[k] : prev.J[k][j]; m = Math.max(m, Math.hypot(a[0] - b[0], a[1] - b[1])); }
      if (m > 0.2 * H + 2.2 * A.speedAt(t) * dt) bad.pop.push({ t, v: m });   // fast feet in a run are not pops
    }
    prev = { J, f };
    // 6. off screen while visible
    const c = film.camAt(t), half = film.W / 2 / c.z;
    if (Math.abs(J.P[0] - c.cx) > half + 0.15 * H) bad.off.push({ t, v: Math.abs(J.P[0] - c.cx) - half });
  }
  for (const r of runs(bad.ground)) add('ground', 'error', A.id, r.t0, `limb ${r.worst.toFixed(0)} px below the ground, ${r.t0.toFixed(2)}-${r.t1.toFixed(2)} s`);
  for (const r of runs(bad.knee)) add('knee', 'error', A.id, r.t0, `knee bends backward, ${r.t0.toFixed(2)}-${r.t1.toFixed(2)} s (leg IK bend should be +1)`);
  for (const r of runs(bad.hidden)) add('hidden-hand', 'warn', A.id, r.t0, `far hand hidden behind the head, ${r.t0.toFixed(2)}-${r.t1.toFixed(2)} s (move it beside the head or use the near hand)`);
  for (const r of runs(bad.elbow)) add('elbow', 'warn', A.id, r.t0, `elbow points forward-up with the hand hanging, ${r.t0.toFixed(2)}-${r.t1.toFixed(2)} s (arm IK bend -1?)`);
  for (const r of runs(bad.pop)) add('pop', 'warn', A.id, r.t0, `a joint moves ${r.worst.toFixed(0)} px in one frame at ${r.t0.toFixed(2)} s (too fast or a missing blend: lengthen it)`);
  for (const r of runs(bad.off, 0.5)) if (r.t1 - r.t0 > 0.3) add('offscreen', 'info', A.id, r.t0, `off screen ${r.t0.toFixed(2)}-${r.t1.toFixed(2)} s (fine if it is an exit; hide with show() otherwise)`);
}

// narration fits: each paragraph must end before the next cue
if (data.voice && data.voice.paragraphs && film.cues) {
  const ids = Object.keys(film.cues).sort((a, b) => film.cues[a] - film.cues[b]);
  ids.forEach((id, i) => {
    const p = data.voice.paragraphs[id]; if (!p) { add('voice', 'error', '-', film.cues[id], `cue "${id}" has no paragraph in voice.json`); return; }
    const end = film.cues[id] + p.dur, next = ids[i + 1];
    if (next && end > film.cues[next] - 0.15) add('voice', 'error', '-', film.cues[id], `"${id}" ends at ${end.toFixed(2)} s, overlapping "${next}" at ${film.cues[next]} s`);
    if (end > film.duration - 0.3) add('voice', 'error', '-', film.cues[id], `"${id}" ends at ${end.toFixed(2)} s, past the end of the film`);
  });
}

const order = { error: 0, warn: 1, info: 2 };
issues.sort((a, b) => order[a.level] - order[b.level] || a.t - b.t);
fs.mkdirSync(path.join(data.dir, 'build'), { recursive: true });
fs.writeFileSync(path.join(data.dir, 'build', 'qa.json'), JSON.stringify(issues, null, 1));
if (asJson) console.log(JSON.stringify(issues, null, 1));
else {
  const n = (l) => issues.filter((i) => i.level === l).length;
  console.log(`QA ${path.basename(data.dir)}: ${N + 1} frames, ${film.actors.length} actor(s) -> ${n('error')} errors, ${n('warn')} warnings, ${n('info')} notes`);
  for (const i of issues) console.log(`  [${i.level}] ${i.actor} ${i.kind}: ${i.msg}`);
}
process.exit(issues.some((i) => i.level === 'error') ? 2 : 0);
