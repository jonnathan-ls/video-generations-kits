// Film model: a small choreography API that compiles into a pure function frame(t).
// A film's scene.js calls SF.defineFilm(E => { ... }) using the builder E below. The same code runs in node (QA scans,
// sound events) and in the browser (rendering), so everything must be deterministic: no Math.random, no Date.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { clamp, lerp, sstep, seg, kf, kfo, angLerp, rnd, backOut, win } = L;
  let DEF = null;
  SF.defineFilm = (fn) => { DEF = fn; };

  const trap = (u, a) => {                                // trapezoid velocity profile: ease in, cruise, ease out
    u = clamp(u, 0, 1); a = clamp(a, 0.01, 0.5); const v = 1 / (1 - a);
    return u < a ? v * u * u / (2 * a) : u < 1 - a ? v * (a / 2 + u - a) : 1 - v * (1 - u) * (1 - u) / (2 * a);
  };

  function compile(data) {
    if (!DEF) throw new Error('scene.js did not call SF.defineFilm(...)');
    const film = data.film || {}, cast = data.cast || {}, voice = data.voice || null;
    const W = film.width || 1920, H = film.height || 1080, fps = film.fps || 30;
    const LOOK = film.look || {};                          // opt-in polish: drag, squash, bendy, shade, shadows, blur
    const memo = (fn) => { const m = new Map(); return (t) => { const k = Math.round(t * 1e5); let v = m.get(k); if (v === undefined) { if (m.size > 8000) m.clear(); v = fn(t); m.set(k, v); } return v; }; };
    const firstSpec = cast[Object.keys(cast)[0]] || {};
    const style = film.style || firstSpec.style || 'line';
    const palette = Object.assign({}, firstSpec.palette || {}, film.palette || {});
    const actors = [], sets = [], props = [], fxList = [], sfx = [], layers = [], texts = [], moods = [], camKeys = [], shakes = [], follows = [];
    let fades = null, music = film.music || null, fid = 1;

    // ---- narration timing ----------------------------------------------------------------------------------------
    const cues = Object.assign({}, film.cues || {});
    // The script sets the length: unless film.json fixes "duration" to a number, the film ends `tail` seconds
    // (default 2.5) after the last spoken line. scene.js can still return { duration } to make room for a silent ending.
    function spokenEnd() { let end = 0; if (voice && voice.paragraphs) for (const id in cues) { const p = voice.paragraphs[id]; if (p) end = Math.max(end, cues[id] + p.dur); } return end; }
    let duration = typeof film.duration === 'number' ? film.duration : (spokenEnd() ? Math.ceil((spokenEnd() + (film.tail === undefined ? 2.5 : film.tail)) * 10) / 10 : 30);
    function say(id) {
      const p = voice && voice.paragraphs && voice.paragraphs[id];
      if (!p) throw new Error(`no paragraph "${id}" in voice.json`);
      const t0 = cues[id]; if (t0 === undefined) throw new Error(`no cue for "${id}" in film.json "cues"`);
      return { t0, t1: t0 + p.dur, text: p.text, sentences: (p.sentences || []).map((s) => ({ text: s.text, t0: t0 + s.start, t1: t0 + s.end })), pauses: (p.pauses || []).map(([a, b]) => [t0 + a, t0 + b]) };
    }

    // ---- actors ----------------------------------------------------------------------------------------------------
    function actor(id, o) {
      o = o || {};
      const spec = cast[o.character || id];
      if (!spec) throw new Error(`actor "${id}": no character "${o.character || id}" in the cast (film.json "cast")`);
      const rig = SF.rig.create(spec), R = rig.R;
      const A = { id, spec, rig, R, seed: o.seed || (actors.length * 4 + 5), x0: o.x || 0, f0: o.facing || 1, z: o.z === undefined ? actors.length : o.z,
        walks: [], turns: [], beats: [], reaches: [], holds: [], exprKeys: [], looks: [], smiles: [], blinkTimes: [], shows: [], clips: [], reveals: [], customs: [], noAutoBlink: !!o.noBlink };
      let lastX = A.x0, lastT = -1e9;
      // walk to x between t0 and t1. o: { run, Tc, stance, backward, steps:false, ease: 'smooth'|'cruise' }
      A.walk = (t0, t1, x, wo) => {
        wo = wo || {};
        if (t0 < lastT - 1e-6) throw new Error(`${id}.walk(${t0}): walks must be added in time order`);
        const from = lastX, dist = Math.abs(x - from), dur = Math.max(0.1, t1 - t0), v = dist / dur;
        const run = !!wo.run, k = R.k;
        const Tc = wo.Tc || (run ? clamp(0.52 * Math.sqrt(520 * k / Math.max(v, 1)), 0.34, 0.62) : clamp(0.78 * Math.sqrt(230 * k / Math.max(v, 1)), 0.5, 1.0));
        A.walks.push({ t0, t1, from, x, run, Tc, stance: wo.stance || (run ? 0.42 : 0.58), dir: Math.sign(x - from) || A.f0, backward: !!wo.backward, steps: wo.steps !== false, ease: wo.ease || (dur > 1.4 ? 'cruise' : 'smooth'), v });
        if (!run && v > 560 * k) console.warn(`${id}.walk(${t0},${t1}): ${Math.round(v)} px/s is a run; pass {run:true} or allow more time`);
        lastX = x; lastT = t1; return A;
      };
      A.run = (t0, t1, x, wo) => A.walk(t0, t1, x, Object.assign({ run: true }, wo || {}));
      A.turn = (t, dir) => { A.turns.push([t, dir]); return A; };
      // hold a pose from t0 to t1. pose: library name or fn(rig, t, x, f, o, A). bo: { blend, in, out, upper, expr, o }
      A.pose = (t0, t1, pose, bo) => {
        bo = bo || {};
        const fn = typeof pose === 'function' ? pose : SF.poses.P[pose];
        if (!fn) throw new Error(`${id}.pose: unknown pose "${pose}". Known: ${Object.keys(SF.poses.P).join(', ')}`);
        const bl = bo.blend === undefined ? 0.3 : bo.blend;
        A.beats.push({ t0, t1, fn, name: typeof pose === 'string' ? pose : 'custom', bin: bo.in === undefined ? bl : bo.in, bout: bo.out === undefined ? bl : bo.out, upper: !!bo.upper, expr: bo.expr, o: bo.o || {} });
        return A;
      };
      // move one hand to a world target (array or fn(t, A) -> [x, y]) over t0..t1
      A.reach = (t0, t1, hand, target, ro) => { ro = ro || {}; A.reaches.push({ t0, t1, hand, target, bend: ro.bend === undefined ? -1 : ro.bend, bin: ro.in === undefined ? 0.3 : ro.in, bout: ro.out === undefined ? 0.3 : ro.out }); return A; };
      // attach a prop to a hand (hand: 0 near, 1 far, 'both' for carried boxes)
      A.hold = (type, t0, t1, ho) => { A.holds.push(Object.assign({ type, t0, t1, hand: 0 }, ho || {})); return A; };
      A.expr = (t, name) => { A.exprKeys.push([t, name]); return A; };
      A.look = (t0, t1, lo) => { A.looks.push(Object.assign({ t0, t1, blend: 0.2 }, lo)); return A; };
      A.smile = (t0, t1, amt) => { A.smiles.push({ t0, t1, amt: amt === undefined ? 1 : amt }); return A; };
      A.blink = (t) => { A.blinkTimes.push(t); return A; };
      A.show = (t0, t1) => { A.shows.push([t0, t1]); return A; };
      A.clip = (t0, t1, x, side) => { A.clips.push({ t0, t1, x, side: side || 1 }); return A; };
      A.reveal = (t0, t1) => { A.reveals.push([t0, t1]); return A; };
      A.custom = (fn) => { A.customs.push(fn); return A; };   // fn(p, t, A) -> pose (runs last)
      // positions on the body, for placing props and effects. Use them inside functions, e.g. { y: (t) => hero.top(t, 80)[1] }
      A.top = (t, dy) => { const J = A.J(t); return [J.Hc[0], J.Hc[1] - R.HR - (dy || 0)]; };
      A.head = (t) => A.J(t).Hc;
      A.hand = (t, i) => A.J(t).hand[i || 0];
      A.feet = (t) => { const J = A.J(t); return [(J.ankle[0][0] + J.ankle[1][0]) / 2, 0]; };
      actors.push(A); return A;
    }

    // ---- world -------------------------------------------------------------------------------------------------------
    const E = {
      L, W, H, fps, style, cues, voice, cast,
      get duration() { return duration; }, length: (s) => { duration = s; },
      say, actor,
      set: (type, so) => { sets.push(Object.assign({ type }, so || {})); },
      prop: (type, po) => { props.push(Object.assign({ type, t0: -1e9, t1: 1e9 }, po || {})); },
      fx: (type, t, fo) => { fxList.push(Object.assign({ type, t, id: fid++ }, fo || {})); },
      sfx: (type, t, so) => { sfx.push(Object.assign({ type, t }, so || {})); },
      mood: (t, name) => { moods.push([t, name]); },
      music: (m) => { music = Object.assign({}, music || {}, m); },
      camera: (keys) => { for (const k of keys) camKeys.push(k); },
      follow: (a, t0, t1, fo) => { follows.push(Object.assign({ a, t0, t1, offset: 0, blend: 0.6 }, fo || {})); },
      shake: (t, amp, dur) => { shakes.push({ t, amp: amp || 4, dur: dur || 0.5, ph: t * 3.1 }); },
      layer: (fn, lo) => { layers.push(Object.assign({ fn, z: 'mid' }, lo || {})); },
      text: (t0, t1, str, to) => { texts.push(Object.assign({ t0, t1, str }, to || {})); },
      fade: (fi, fo) => { fades = { fi, fo }; },
    };
    const ret = DEF(E) || {};
    if (ret.duration) duration = ret.duration;

    // ---- compile each actor --------------------------------------------------------------------------------------------
    for (const A of actors) {
      const rig = A.rig, R = A.R;
      A.walks.sort((a, b) => a.t0 - b.t0); A.beats.sort((a, b) => a.t0 - b.t0); A.exprKeys.sort((a, b) => a[0] - b[0]);
      const xKeys = [];
      A.xAt = (t) => {
        let x = A.x0;
        for (const w of A.walks) {
          if (t <= w.t0) return w.from;
          if (t < w.t1) { const u = (t - w.t0) / (w.t1 - w.t0); return lerp(w.from, w.x, w.ease === 'cruise' ? trap(u, Math.min(0.3, 0.45 / (w.t1 - w.t0))) : sstep(u)); }
          x = w.x;
        }
        return x;
      };
      const fk = [[-1e9, A.f0]];
      for (const w of A.walks) fk.push([w.t0 - 0.05, w.backward ? -w.dir : w.dir]);
      for (const tr of A.turns) fk.push(tr);
      fk.sort((a, b) => a[0] - b[0]);
      A.flips = fk.slice(1).map((k) => k[0]);
      A.facingAt = (t) => { let f = A.f0; for (const [tm, d] of fk) if (t >= tm) f = d; return f; };
      for (const w of A.walks) {
        const f = w.backward ? -w.dir : w.dir, k = R.k;
        w.g = SF.gait.plan(rig, A.xAt, w.t0, w.t1, { facing: f, Tc: w.Tc, stance: w.stance, run: w.run, init: [w.from + 12 * k * f, w.from - 14 * k * f] });
        if (w.steps) for (const s of SF.gait.steps(w.g)) sfx.push({ type: 'step', t: s.t, g: w.run ? 0.7 : 0.5, actor: A.id });
      }
      const idle = (t, x, f) => SF.poses.P.neutral(rig, t, x, f);
      const walkAt = (t) => A.walks.find((w) => t >= w.t0 && t <= w.t1);
      function basePose(t) {
        const x = A.xAt(t), f = A.facingAt(t), w = walkAt(t);
        if (w) {                                              // ease from standing into the gait (matters most for runs)
          const g = SF.gait.pose(rig, w.g, A.facingAt, t), u = (t - w.t0) / 0.22;
          return u < 1 ? rig.blendPose(idle(t, x, f), g, sstep(u)) : g;
        }
        let p = idle(t, x, f);
        const prev = A.walks.filter((q) => q.t1 < t && t - q.t1 < 0.28).pop();
        if (prev && A.facingAt(prev.t1) === f) p = rig.blendPose(SF.gait.pose(rig, prev.g, A.facingAt, prev.t1), p, sstep((t - prev.t1) / 0.28));
        return p;
      }
      function upperBlend(a, b, w) {
        const q = rig.clonePose(a);
        q.arm = a.arm.map((s, i) => ({ u: angLerp(s.u, b.arm[i].u, w), f: angLerp(s.f, b.arm[i].f, w) }));
        q.hd = lerp(a.hd || 0, b.hd || 0, w); q.tau = lerp(a.tau, b.tau, w * 0.5); return q;
      }
      A.beatWeights = (t) => A.beats.map((b) => ({ b, w: sstep(seg(t, b.t0 - b.bin, b.t0)) * (1 - sstep(seg(t, b.t1, b.t1 + b.bout))) }));
      A.poseAt = (t) => {
        let p = basePose(t);
        const x = A.xAt(t), f = A.facingAt(t);
        for (const { b, w } of A.beatWeights(t)) {
          if (w <= 0) continue;
          const q = b.fn(rig, t, x, f, b.o, A);
          if (q.facing !== p.facing) { if (w > 0.5) p = q; continue; }
          p = b.upper || walkAt(t) ? upperBlend(p, q, w) : rig.blendPose(p, q, w);
        }
        for (const r of A.reaches) {
          const w = sstep(seg(t, r.t0, r.t0 + r.bin)) * (1 - sstep(seg(t, r.t1 - r.bout, r.t1))); if (w <= 0) continue;
          const tg = typeof r.target === 'function' ? r.target(t, A) : r.target, q = rig.clonePose(p);
          rig.armIK(q, r.hand, tg[0], tg[1], r.bend);
          p.arm[r.hand] = { u: angLerp(p.arm[r.hand].u, q.arm[r.hand].u, w), f: angLerp(p.arm[r.hand].f, q.arm[r.hand].f, w) };
        }
        for (const fn of A.customs) p = fn(p, t, A) || p;
        return p;
      };
      // look.drag: follow-through. Free arms, the head and the torso trail the body, overshoot a little and settle
      // (a short filter over the last 0.15 s of the pose). Hands placed by IK are left exactly where they were put.
      A.rawPoseAt = memo(A.poseAt);
      if (LOOK.drag) {
        const amt = LOOK.drag === true ? 1 : +LOOK.drag, raw = A.rawPoseAt;
        const TAPS = [[0, 0.30], [0.03, 0.45], [0.06, 0.40], [0.09, 0.05], [0.12, -0.10], [0.15, -0.10]];
        const ad = (a, b) => ((b - a + 540) % 360) - 180;
        A.poseAt = memo((t) => {
          const p0 = raw(t), p = rig.clonePose(p0), past = TAPS.map(([d]) => (d ? raw(t - d) : p0));
          const filt = (get, k) => { const v0 = get(p0); let s = 0; TAPS.forEach(([, w], i) => { if (past[i].facing === p0.facing) s += w * ad(v0, get(past[i])); }); return v0 + s * k; };
          for (let i = 0; i < 2; i++) {
            if (p0.hands && p0.hands[i]) continue;
            p.arm[i] = { u: filt((q) => q.arm[i].u, amt), f: filt((q) => q.arm[i].f, amt * 1.15) };
          }
          p.hd = filt((q) => q.hd || 0, amt * 0.8); p.tau = filt((q) => q.tau || 0, amt * 0.35);
          const J = rig.solve(p);                                 // never let the overshoot push a hand or the head into the ground
          if (Math.max(J.hand[0][1] + R.HAND_RY, J.hand[1][1] + R.HAND_RY, J.Hc[1] + R.HR) > 0) return p0;
          return p;
        });
      } else A.poseAt = A.rawPoseAt;
      // face
      const blinks = A.blinkTimes.slice();
      if (!A.noAutoBlink) { let bt = 1.1 + rnd(A.seed, 1) * 1.4, i = 2; while (bt < duration) { blinks.push(bt); bt += 2.3 + rnd(A.seed, i++) * 2.3; } }
      A.blinkAt = (t) => { let b = 0; for (const s of blinks) { const u = (t - s) / 0.16; if (u > 0 && u < 1) b = Math.max(b, Math.sin(Math.PI * u)); } return b; };
      A.exprAt = (t) => {
        const K = A.exprKeys;
        if (K.length) {
          let i = -1; for (let k = 0; k < K.length; k++) if (t >= K[k][0]) i = k;
          if (i < 0) return SF.character.expr(K[0][1]);
          const nx = K[Math.min(i + 1, K.length - 1)];
          return SF.character.exprMix(K[i][1], nx[1], i + 1 < K.length ? sstep(seg(t, nx[0] - 0.18, nx[0])) : 0);
        }
        let e = SF.character.expr('neutral');
        for (const { b, w } of A.beatWeights(t)) if (w > 0) {
          const name = b.expr || SF.poses.FACE[b.name] || 'neutral', q = SF.character.expr(name);
          e = { eye: lerp(e.eye, q.eye, w), l: e.l.map((v, j) => lerp(v, q.l[j], w)), r: e.r.map((v, j) => lerp(v, q.r[j], w)), m: lerp(e.m, q.m, w), o: lerp(e.o, q.o, w) };
        }
        return e;
      };
      A.faceAt = (t) => {
        let turn = 0.75, lx = 0, ly = 0;
        for (const tf of A.flips) { const d = Math.abs(t - tf); if (d < 0.3) turn *= d / 0.3; }
        for (const lk of A.looks) {
          const w = sstep(seg(t, lk.t0, lk.t0 + lk.blend)) * (1 - sstep(seg(t, lk.t1 - lk.blend, lk.t1))); if (w <= 0) continue;
          if (lk.turn !== undefined) turn = lerp(turn, lk.turn, w); if (lk.lx !== undefined) lx = lerp(lx, lk.lx, w); if (lk.ly !== undefined) ly = lerp(ly, lk.ly, w);
        }
        let smile = 0; for (const s of A.smiles) smile = Math.max(smile, s.amt * sstep(seg(t, s.t0, s.t0 + 0.4)) * (1 - sstep(seg(t, s.t1 - 0.3, s.t1))));
        return { expr: A.exprAt(t), turn, lookx: lx, looky: ly, blink: A.blinkAt(t), smile };
      };
      A.visibleAt = (t) => !A.shows.length || A.shows.some(([a, b]) => t >= a && t < b);
      A.clipAt = (t) => { const c = A.clips.find((q) => t >= q.t0 && t < q.t1); return c || null; };
      A.revealAt = (t) => { if (!A.reveals.length) return 1; let r = 1; for (const [a, b] of A.reveals) if (t < b) { r = clamp((t - a) / (b - a), 0, 1); break; } return r; };
      A.speedAt = (t) => Math.abs(A.xAt(t + 0.03) - A.xAt(t - 0.03)) / 0.06;
      // look.squash: squash and stretch from the body's own motion. Stretch with vertical speed, squash when the body
      // presses into the ground (crouch bottoms, take-offs, landings). Applied to the skeleton about the feet, so props,
      // layers and QA all see the same joints; line widths stay the same.
      A.squashAt = (t) => {
        if (!LOOK.squash) return null;
        const k = LOOK.squash === true ? 1 : +LOOK.squash, dt = 1 / 30, H = R.H;
        const y0 = A.poseAt(t - dt).P.y, y1 = A.poseAt(t).P.y, y2 = A.poseAt(t + dt).P.y;
        const v = (y2 - y0) / (2 * dt), a = (y2 - 2 * y1 + y0) / (dt * dt);
        const sy = clamp(1 + k * (clamp(Math.abs(v) / (H * 3.2), 0, 1) * 0.11 - clamp(-a / (H * 45), 0, 1) * 0.15), 0.84, 1.14);
        return Math.abs(sy - 1) < 0.004 ? null : { sx: 1 / Math.sqrt(sy), sy };
      };
      A.J = memo((t) => {
        const J = rig.solve(A.poseAt(t)), s = A.squashAt(t); if (!s) return J;
        const px = J.P[0], py = Math.max(J.ankle[0][1], J.ankle[1][1], J.hand[0][1], J.hand[1][1], J.knee[0][1], J.knee[1][1], J.Hc[1] + R.HR) + R.FOOT_RY, m = (q) => [px + (q[0] - px) * s.sx, py + (q[1] - py) * s.sy];
        const out = Object.assign({}, J);
        for (const k of ['P', 'N', 'Hc', 'sh']) if (J[k]) out[k] = m(J[k]);
        for (const k of ['elbow', 'hand', 'knee', 'ankle']) if (J[k]) out[k] = J[k].map(m);
        return out;
      });
    }
    // cloth for scarves and capes, simulated once over the whole film
    for (const A of actors) {
      const acc = (A.spec.accessories || []).map((a) => (typeof a === 'string' ? { type: a } : a));
      if (acc.some((a) => a.type === 'scarf')) A.tailsAt = SF.cloth.simulate(duration + 0.5, (t) => SF.character.scarfAnchor(A.rig, A.poseAt(t)), SF.character.SCARF_TAILS(A.R));
      if (acc.some((a) => a.type === 'cape')) {
        const R = A.R;
        A.capeAt = SF.cloth.simulate(duration + 0.5, (t) => { const J = A.rig.solve(A.poseAt(t)); return { x: J.N[0] - J.f * 0.02 * R.H, y: J.N[1] + 0.02 * R.H, Hc: J.Hc, HR: R.HR, f: J.f }; }, [{ len: 0.40 * R.H, a: 52 }, { len: 0.30 * R.H, a: 78, off: [-0.02 * R.H, 0.16 * R.H] }], { stiff: 24, wind: 40 });
      }
    }

    // ---- camera ----------------------------------------------------------------------------------------------------------
    const CK = camKeys.length ? camKeys.slice().sort((a, b) => a[0] - b[0]) : [[0, {}]];
    const camDefault = { x: 0, z: H > W ? 1.55 : 1, gy: H * (H > W ? 0.62 : 0.68) };   // vertical frames get a closer default
    const camFull = CK.map(([t, c]) => [t, Object.assign({}, camDefault, c)]);
    for (let i = 1; i < camFull.length; i++) for (const k of ['x', 'z', 'gy']) if (CK[i][1][k] === undefined) camFull[i][1][k] = camFull[i - 1][1][k];
    function camAt(t) {
      const c = kfo(camFull, t, sstep);
      for (const fo of follows) {
        const w = sstep(seg(t, fo.t0, fo.t0 + fo.blend)) * (1 - sstep(seg(t, fo.t1 - fo.blend, fo.t1))); if (w <= 0) continue;
        let ax = 0; for (let s = -4; s <= 4; s++) ax += fo.a.xAt(t + s * 0.06); ax /= 9;   // smoothed follow
        c.x = lerp(c.x, ax + fo.offset, w); if (fo.z) c.z = lerp(c.z, fo.z, w);
      }
      let sx = 0, sy = 0;
      for (const s of shakes) { const a = t - s.t; if (a < 0 || a > s.dur) continue; const e = Math.exp(-a / 0.09) * s.amp; sx += e * Math.sin(a * 62 + s.ph); sy += e * 0.7 * Math.cos(a * 53 + s.ph); }
      return { cx: c.x, z: c.z, gy: c.gy, sx, sy };
    }
    const FADE = fades || { fi: [0, 0.25], fo: [duration - 0.5, duration] };
    const fadeAt = (t) => Math.max(FADE.fi ? 1 - sstep(seg(t, FADE.fi[0], FADE.fi[1])) : 0, FADE.fo ? sstep(seg(t, FADE.fo[0], FADE.fo[1])) : 0);
    const val = (v, t) => (typeof v === 'function' ? v(t) : v);

    function frame(t) {
      const S = { t, cam: camAt(t), actors: [], props: [], fx: [], texts: [], fade: fadeAt(t), sets, layers };
      for (const A of actors) {
        if (!A.visibleAt(t)) continue;
        const pose = A.poseAt(t), J = A.J(t), held = [];
        let lag = null;
        if (LOOK.drag) { const h0 = J.Hc, h1 = A.J(t - 0.06).Hc, h2 = A.J(t - 0.12).Hc, lim = A.R.HR * 0.6; lag = [0, 1].map((i) => clamp((h1[i] - h0[i]) * 0.6 - (h2[i] - h1[i]) * 0.18, -lim, i ? lim * 0.2 : lim)); }   // a pompom may swing and lift, but barely sag onto the hat
        for (const h of A.holds) {
          if (t < h.t0 || t >= h.t1) continue;
          const g = SF.props.GRIP[h.type] || [0, 0], f = J.f, s = h.s || 1;
          let x, y;
          if (h.hand === 'both') { x = (J.hand[0][0] + J.hand[1][0]) / 2; y = (J.hand[0][1] + J.hand[1][1]) / 2 + (h.h || 96) * 0.45 * s; }
          else { x = J.hand[h.hand][0] + f * g[0] * s; y = J.hand[h.hand][1] + g[1] * s; }
          held.push({ type: h.type, o: Object.assign({ between: h.hand === 'both' }, h, { x: x + f * (h.dx || 0), y: y + (h.dy || 0), flip: h.flip === undefined ? -f : h.flip * f, s }) });
        }
        S.actors.push({ id: A.id, A, pose, J, lag, face: A.faceAt(t), tails: A.tailsAt ? A.tailsAt(t) : null, cape: A.capeAt ? A.capeAt(t) : null,
          flutter: clamp(A.speedAt(t) * 0.012, 0, 4), clip: A.clipAt(t), reveal: A.revealAt(t), z: A.z, held });
      }
      S.actors.sort((a, b) => a.z - b.z);
      for (const p of props) {
        if (t < p.t0 || t >= p.t1) continue;
        const o = {}; for (const k in p) o[k] = val(p[k], t);
        if (p.pop) { const a = backOut(clamp((t - p.t0) / 0.3, 0, 1)), b = 1 - sstep(seg(t, p.t1 - 0.25, p.t1)); o.s = (o.s || 1) * Math.min(a, p.t1 < 1e8 ? b : 1); }
        S.props.push(o);
      }
      S.fx = fxList.filter((e) => t >= e.t && t <= e.t + (e.life || SF.fx.LIFE[e.type] || 0.5)).map((e) => { const o = {}; for (const k in e) o[k] = val(e[k], e.t); return o; });
      S.texts = texts.filter((x) => t >= x.t0 && t < x.t1);
      return S;
    }

    const events = () => sfx.slice().sort((a, b) => a.t - b.t);
    return { look: LOOK, W, H, fps, duration, style, palette, film, cast, voice, cues, actors, sets, props, fxList, layers, frame, events, moods: moods.sort((a, b) => a[0] - b[0]), music, camAt };
  }

  SF.compile = compile;
})(typeof window !== 'undefined' ? window : globalThis);
