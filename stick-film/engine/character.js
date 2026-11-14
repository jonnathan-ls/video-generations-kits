// Draws one character from its rig pose in the film's art style: body, hands, feet, head, face and accessories.
// Character colors come from character.json "palette" on top of the theme palette.
// face: { expr:{eye,l,r,m,o}, turn, lookx, looky, blink, smile }   o: { reveal 0..1, tails (cloth chains), flutter, seed, groundY }
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { D2R, clamp, lerp, mix } = L;

  // brows: [inner y, outer y, bow] in head radii (negative = up). m: mouth curve (-1 frown .. +1 smile). o: mouth open.
  const EXPR = {
    neutral:   { eye: 1.0,  l: [-0.30, -0.28, 0.06], m: 0.1 },
    happy:     { eye: 0.92, l: [-0.38, -0.36, 0.10], m: 0.8 },
    sad:       { eye: 0.95, l: [-0.44, -0.22, 0.02], m: -0.6 },
    angry:     { eye: 0.9,  l: [-0.14, -0.40, 0.0], m: -0.35 },
    scared:    { eye: 1.25, l: [-0.52, -0.32, 0.04], m: -0.3, o: 0.25 },
    surprised: { eye: 1.2,  l: [-0.54, -0.50, 0.08], m: 0, o: 0.7 },
    thinking:  { eye: 0.95, l: [-0.40, -0.38, 0.06], r: [-0.20, -0.26, 0.0], m: -0.1 },
    confused:  { eye: 1.0,  l: [-0.42, -0.36, 0.06], r: [-0.18, -0.24, 0.0], m: -0.15 },
    worried:   { eye: 1.05, l: [-0.42, -0.22, 0.03], m: -0.25 },
    proud:     { eye: 0.85, l: [-0.30, -0.34, 0.05], m: 0.55 },
    exhausted: { eye: 0.55, l: [-0.24, -0.20, 0.0], m: -0.3 },
    determined:{ eye: 0.95, l: [-0.18, -0.36, 0.0], m: -0.05 },
    strain:    { eye: 0.55, l: [-0.14, -0.38, 0.0], m: -0.4 },
    calm:      { eye: 0.92, l: [-0.28, -0.30, 0.08], m: 0.3 },
    curious:   { eye: 1.05, l: [-0.36, -0.34, 0.08], m: 0.05, o: 0.1 },
    alarmed:   { eye: 1.25, l: [-0.50, -0.30, 0.04], m: -0.2, o: 0.3 },
    puzzled:   { eye: 1.0,  l: [-0.40, -0.38, 0.06], r: [-0.20, -0.26, 0.0], m: -0.1 },
    pleading:  { eye: 1.15, l: [-0.46, -0.20, 0.02], m: -0.2 },
    deadpan:   { eye: 0.72, l: [-0.22, -0.22, 0.0], m: 0 },
    hope:      { eye: 1.0,  l: [-0.38, -0.34, 0.10], m: 0.3 },
    sheepish:  { eye: 1.0,  l: [-0.42, -0.26, 0.02], m: 0.2 },
    sneaky:    { eye: 0.6,  l: [-0.20, -0.30, 0.02], m: 0.25 },
  };
  function expr(name) { const e = EXPR[name] || EXPR.neutral; return { eye: e.eye, l: e.l, r: e.r || e.l, m: e.m || 0, o: e.o || 0 }; }
  function exprMix(a, b, w) {
    const A = expr(a), B = expr(b || a), m = (x, y) => x.map((v, i) => lerp(v, y[i], w));
    return { eye: lerp(A.eye, B.eye, w), l: m(A.l, B.l), r: m(A.r, B.r), m: lerp(A.m, B.m, w), o: lerp(A.o, B.o, w) };
  }

  // head-local coordinates (x forward, y down, in head radii) -> world
  function headMap(J, R) {
    const f = J.f, hc = J.Hc, ang = J.headAng * D2R, cs = Math.cos(ang), sn = Math.sin(ang), Ro = R.HR * 0.97;
    return (x, y) => { x *= f; return [hc[0] + (x * cs - y * sn) * Ro, hc[1] + (x * sn + y * cs) * Ro]; };
  }

  function draw(ctx, TH, actor, pose, face, o) {
    o = o || {};
    const rig = actor.rig, R = rig.R, spec = actor.spec, st = TH.style;
    const C = Object.assign({}, TH.pal, spec.palette || {});
    if (st === 'silhouette') { C.body = C.ink; C.head = C.ink; }
    const FACE = Object.assign({ eyes: st === 'silhouette' ? 'glow' : 'dot', brows: st !== 'silhouette', mouth: 'smile' }, spec.face || {});
    const acc = (spec.accessories || []).map((a) => (typeof a === 'string' ? { type: a } : a));
    const accColor = (a) => C[a.color || 'accent'] || a.color || C.accent;
    const J = o.J || rig.solve(pose), f = J.f, SW = R.SW, seed = o.seed || actor.seed || 5;
    const LK = o.look || {}, BENDY = !!LK.bendy && st === 'flat', SHADE = !!LK.shade && st === 'flat';
    const LX = -0.40, LY = -0.92;                                   // light from the upper left, for look.shade
    const rev = o.reveal === undefined ? 1 : o.reveal;
    const drawOn = st === 'line' || st === 'sketch';
    const P = (a, b) => drawOn ? clamp((rev - a) / (b - a), 0, 1) : (rev >= 1 ? 1 : 0);
    if (!drawOn && rev < 1) ctx.globalAlpha = clamp(rev, 0, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const part = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

    // ---- limbs -------------------------------------------------------------------------------------------------------
    const LW = st === 'silhouette' ? SW * 2.0 : st === 'flat' ? SW * 1.9 : st === 'sketch' ? SW * 0.62 : SW;
    const OW = Math.max(2, SW * 0.42);                              // flat-style outline
    function limbPts(a, b, c, u) {
      if (u >= 1) { const j = TH.jit(seed, 1, 0.7), j2 = TH.jit(seed, 2, 0.7); return [a, [(a[0] + b[0]) / 2 + j[0], (a[1] + b[1]) / 2 + j[1]], b, [(b[0] + c[0]) / 2 + j2[0], (b[1] + c[1]) / 2 + j2[1]], c]; }
      const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), d = u * (l1 + l2);
      return d <= l1 ? [a, part(a, b, d / Math.max(1e-6, l1))] : [a, b, part(b, c, (d - l1) / Math.max(1e-6, l2))];
    }
    function bend(a, b, c) {                                    // look.bendy: a rubber-hose curve that still passes through the joint
      const k = [2 * b[0] - (a[0] + c[0]) / 2, 2 * b[1] - (a[1] + c[1]) / 2], out = [];
      for (let i = 0; i <= 14; i++) { const s = i / 14, m = 1 - s; out.push([m * m * a[0] + 2 * m * s * k[0] + s * s * c[0], m * m * a[1] + 2 * m * s * k[1] + s * s * c[1]]); }
      return out;
    }
    function tube(pts, w, col) {                                // look.shade: a shadow side and a lit side on every tube
      TH.stroke(ctx, pts, w + OW * 2, { raw: true, color: C.ink, smooth: false });
      if (!SHADE) { TH.stroke(ctx, pts, w, { raw: true, color: col, smooth: false }); return; }
      TH.stroke(ctx, pts, w, { raw: true, color: mix(col, C.ink, 0.30), smooth: false });
      const d = w * 0.16; TH.stroke(ctx, pts.map((q) => [q[0] + LX * d, q[1] + LY * d]), w * 0.62, { raw: true, color: col, smooth: false });
    }
    function limb(a, b, c, u, w, col) {
      if (u <= 0) return;
      const pts = BENDY && u >= 1 ? bend(a, b, c) : limbPts(a, b, c, u);
      if (st === 'flat') tube(pts, w, col || C.body);
      else TH.stroke(ctx, pts, w, { raw: true, color: C.body, smooth: false, seed });
    }
    function blob(x, y, rx, ry, rot, col) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      if (st === 'flat') {
        TH.ellipse(ctx, 0, 0, rx + OW, ry + OW, 0, C.ink);
        if (SHADE) {
          TH.ellipse(ctx, 0, 0, rx, ry, 0, mix(col, C.ink, col === C.ink ? 0 : 0.22));
          const c = Math.cos(rot), sn = Math.sin(rot), lx = LX * c + LY * sn, ly = -LX * sn + LY * c;   // light in blob space
          TH.ellipse(ctx, lx * rx * 0.18, ly * ry * 0.18, rx * 0.8, ry * 0.8, 0, col === C.ink ? mix(C.ink, C.body, 0.35) : col);
          ctx.globalAlpha *= 0.5; TH.ellipse(ctx, lx * rx * 0.42, ly * ry * 0.42, rx * 0.22, ry * 0.18, 0, '#ffffff'); ctx.globalAlpha /= 0.5;
        } else TH.ellipse(ctx, 0, 0, rx, ry, 0, col);
      }
      else if (st === 'sketch') { TH.ellipse(ctx, 0, 0, rx, ry, 0, mix(C.paper, C.ink, 0.25)); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.lineWidth = SW * 0.5; ctx.strokeStyle = C.ink; ctx.globalAlpha *= 0.9; ctx.stroke(); ctx.globalAlpha = 1; }
      else TH.ellipse(ctx, 0, 0, rx * (st === 'silhouette' ? 1.12 : 1), ry * (st === 'silhouette' ? 1.12 : 1), 0, C.body);
      ctx.restore();
    }
    const groundY = o.groundY === undefined ? 0 : o.groundY;
    const foot = (i, u) => {
      if (u <= 0) return;
      const an = J.ankle[i], k = J.knee[i];
      const shin = Math.atan2((an[0] - k[0]) * f, an[1] - k[1]) / D2R;
      const hgt = clamp((groundY - an[1] - R.FOOT_RY) / (R.FOOT_RY * 4), 0, 1), free = clamp(hgt * 1.5, 0, 1);
      const tilt = lerp(0, clamp(shin * 0.9, -70, 70) * D2R, free), dx = f * Math.cos(tilt), dy = -Math.sin(tilt);
      ctx.save(); ctx.translate(an[0] + dx * R.FOOT_RX * 0.4, an[1] + dy * R.FOOT_RX * 0.4); ctx.scale(u, u);
      blob(0, 0, R.FOOT_RX, R.FOOT_RY, -f * tilt, st === 'flat' ? C.ink : C.body); ctx.restore();
    };
    const hand = (i, u) => {
      if (u <= 0) return;
      const e = J.elbow[i], h = J.hand[i], ang = Math.atan2(h[0] - e[0], h[1] - e[1]);
      ctx.save(); ctx.translate(h[0] + Math.sin(ang) * R.HAND_RY * 0.45, h[1] + Math.cos(ang) * R.HAND_RY * 0.45); ctx.scale(u, u);
      blob(0, 0, R.HAND_RX, R.HAND_RY, -ang, st === 'flat' ? (C.hand || C.head) : C.body); ctx.restore();
    };

    const uHead = P(0.0, 0.28), uTor = P(0.22, 0.42), uLeg = P(0.38, 0.62), uArm = P(0.55, 0.78), uBlob = P(0.78, 0.92), uAcc = P(0.86, 0.98), uFace = P(0.9, 1);
    const farCol = st === 'flat' ? mix(C.body, C.ink, 0.22) : C.body;

    const scarf = acc.find((a) => a.type === 'scarf');
    if (scarf && uAcc > 0 && o.tails) {                       // tails hang behind the body
      const ga = ctx.globalAlpha; ctx.globalAlpha = ga * uAcc;
      o.tails.forEach((ch, ti) => scarfTail(ctx, ch, (ti === 0 ? 0.046 : 0.040) * R.H, SW, TH.t, (o.flutter || 0) + 2.2, ti * 1.9, accColor(scarf), C, st));
      ctx.globalAlpha = ga;
    }
    // far limbs
    limb(J.sh, J.elbow[1], J.hand[1], uArm, LW, farCol); hand(1, uBlob);
    limb(J.P, J.knee[1], J.ankle[1], uLeg, LW, farCol); foot(1, uBlob);
    // back accessories (cape)
    for (const a of acc) if (a.type === 'cape' && o.cape) drawCape(ctx, TH, C, o.cape, SW, accColor(a), st);
    // torso
    if (uTor > 0) {
      const a = J.P, b = J.N, jm = TH.jit(seed, 7, 0.9), m = [(a[0] + b[0]) / 2 + jm[0], (a[1] + b[1]) / 2 + jm[1]];
      const pts = uTor >= 1 ? [a, m, b] : [a, part(a, b, uTor)];
      const tw = st === 'silhouette' ? SW * 2.7 : st === 'flat' ? SW * 2.6 : LW;
      if (st === 'flat') tube(BENDY && uTor >= 1 ? bend(a, [(a[0] + b[0]) / 2 + f * SW * 0.25, (a[1] + b[1]) / 2], b) : pts, tw, C.shirt || C.body);
      else TH.stroke(ctx, pts, tw, { raw: true, color: C.body, smooth: false, seed });
    }
    for (const a of acc) if (a.type === 'tie' && uAcc > 0) drawTie(ctx, TH, J, R, accColor(a), st, C);
    // near leg
    limb(J.P, J.knee[0], J.ankle[0], uLeg, LW); foot(0, uBlob);
    // head
    if (uHead > 0) {
      const Rc = R.HR - SW * 0.5;
      if (st === 'silhouette') { if (uHead >= 1) TH.ellipse(ctx, J.Hc[0], J.Hc[1], R.HR, R.HR, 0, C.ink); }
      else if (st === 'flat') { if (uHead >= 1) {
        const hx = J.Hc[0], hy = J.Hc[1], ri = R.HR - OW * 1.3;
        TH.ellipse(ctx, hx, hy, R.HR, R.HR, 0, C.ink);
        if (SHADE) {                                            // a cel shadow crescent on the far side and a soft highlight
          ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, ri, 0, Math.PI * 2); ctx.clip();
          TH.ellipse(ctx, hx, hy, ri, ri, 0, mix(C.head, C.accent, 0.16)); TH.ellipse(ctx, hx + LX * ri * 0.17, hy + LY * ri * 0.17, ri * 0.99, ri * 0.99, 0, C.head);
          ctx.globalAlpha = 0.32; TH.ellipse(ctx, hx + LX * ri * 0.5 - f * ri * 0.05, hy + LY * ri * 0.5, ri * 0.2, ri * 0.13, -0.5 * f, '#ffffff'); ctx.restore();
        } else TH.ellipse(ctx, hx, hy, ri, ri, 0, C.head);
      } }
      else {
        if (uHead >= 1) TH.ellipse(ctx, J.Hc[0], J.Hc[1], Rc - 1, Rc - 1, 0, C.head);
        TH.ring(ctx, J.Hc[0], J.Hc[1], Rc, st === 'sketch' ? SW * 0.62 : SW, { a1: -Math.PI * 0.62 + Math.PI * 2 * 1.04 * uHead, spiral: 2.2 * uHead * R.k, seed: seed + 3, raw: true, color: C.body });
      }
    }
    const hp = headMap(J, R);
    if (uFace > 0 && face) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * uFace; drawFace(ctx, TH, J, R, hp, face, FACE, C, st, SHADE); ctx.globalAlpha = ga; }
    for (const a of acc) if (uHead >= 1 && uAcc > 0) drawHeadAcc(ctx, TH, J, R, hp, a, accColor(a), C, st, face, { lag: o.lag, shade: SHADE });
    if (o.between) o.between(ctx, J);                         // carried props sit between the far and near arm
    // near arm in front of the head (knocking, sipping, holding the head)
    limb(J.sh, J.elbow[0], J.hand[0], uArm, LW); hand(0, uBlob);
    // scarf knot last: it sits over the arm roots
    if (scarf && uAcc > 0) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * uAcc; scarfBand(ctx, J, R, SW, accColor(scarf), C, st); ctx.globalAlpha = ga; }
    ctx.globalAlpha = 1;
    return J;
  }

  function drawFace(ctx, TH, J, R, P, face, FACE, C, st, shade) {
    const turn = face.turn === undefined ? 0.75 : face.turn, E = face.expr || expr('neutral'), blink = face.blink || 0;
    const ex = [lerp(-0.31, 0.30, turn), lerp(0.31, 0.64, turn)], lx = face.lookx || 0, ly = face.looky || 0;
    const eyeCol = FACE.eyes === 'glow' ? (C.eye || C.paper) : (C.eye || C.ink), ang = J.headAng * D2R, Ro = R.HR;
    const ink = st === 'silhouette' ? C.paper : C.ink, sk = R.SW / 8.6;
    if (shade) {                                                  // look.shade: soft blush under the eyes
      const ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.42;
      for (let k = 0; k < 2; k++) { const q = P(ex[k] + 0.03, 0.34); TH.ellipse(ctx, q[0], q[1], (k ? 0.13 : 0.15) * Ro, 0.085 * Ro, ang, mix(C.head, C.accent, 0.6)); }
      ctx.globalAlpha = ga;
    }
    // mouth
    const smile = face.smile || 0, mode = FACE.mouth;
    if (mode !== 'none' && st !== 'silhouette' && (mode === 'expressive' || smile > 0.01)) {
      const m = mode === 'expressive' ? clamp(E.m + smile, -1, 1) : 0.9 * smile;
      const mx = (ex[0] + ex[1]) / 2 + 0.05, my = 0.5, hw = mode === 'expressive' ? 0.18 + 0.04 * Math.abs(m) : 0.20;
      if (mode === 'expressive' && E.o > 0.3 && smile < 0.3) {     // open mouth: an "o", no line
        const q = P(mx, my + 0.04); TH.ellipse(ctx, q[0], q[1], 0.06 * Ro * E.o + 2, 0.09 * Ro * E.o + 2, ang, ink);
      } else if (shade && mode === 'expressive' && m > 0.45) {   // a big smile becomes an open, filled grin
        const a = P(mx - hw * 1.05, my - 0.05), b = P(mx + hw * 1.05, my - 0.05), c = P(mx, my + 0.5 * m), tq = P(mx + 0.02, my + 0.17 * m);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]); ctx.closePath();
        ctx.fillStyle = ink; ctx.fill(); ctx.lineWidth = 2.4 * sk; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.save(); ctx.clip(); TH.ellipse(ctx, tq[0], tq[1] + 0.06 * Ro, 0.11 * Ro, 0.07 * Ro, ang, mix(C.accent, C.head, 0.15)); ctx.restore();
      } else {
        const a = P(mx - hw, my - 0.02 * m), b = P(mx + hw, my - 0.02 * m), c = P(mx, my + 0.32 * m);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
        ctx.lineWidth = 4 * sk; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.stroke();
      }
    }
    if (FACE.eyes === 'none') return;
    for (let k = 0; k < 2; k++) {
      const c = P(ex[k] + lx * 0.12, ly * 0.10), er = E.eye * (1 - blink * 0.92) * (FACE.eyeSize || 1);
      if (FACE.eyes === 'glow') TH.ellipse(ctx, c[0], c[1], 0.07 * Ro * (FACE.eyeSize || 1), 0.075 * Ro * er, ang, eyeCol);
      else if (FACE.eyes === 'round') { TH.ellipse(ctx, c[0], c[1], 0.17 * Ro, 0.19 * Ro * Math.max(0.15, er), ang, C.paper); ctx.beginPath(); ctx.ellipse(c[0], c[1], 0.17 * Ro, 0.19 * Ro * Math.max(0.15, er), ang, 0, Math.PI * 2); ctx.lineWidth = 3 * sk; ctx.strokeStyle = C.ink; ctx.stroke(); const pp = P(ex[k] + lx * 0.16 + 0.05, ly * 0.12); TH.ellipse(ctx, pp[0], pp[1], 0.07 * Ro, 0.09 * Ro * er, ang, eyeCol); }
      else {
        TH.ellipse(ctx, c[0], c[1], 0.088 * Ro, 0.135 * Ro * er, ang, eyeCol);
        if (shade && er > 0.35) TH.ellipse(ctx, c[0] - 0.03 * Ro, c[1] - 0.05 * Ro * er, 0.032 * Ro, 0.036 * Ro * er, ang, '#ffffff');   // catchlight
      }
      if (!FACE.brows) continue;
      const br = k === 0 ? E.l : E.r, inner = k === 0 ? 1 : lerp(-1, 1, turn), bl = 0.30;
      const xi = ex[k] + lx * 0.05 + inner * bl / 2, xo = ex[k] + lx * 0.05 - inner * bl / 2;
      const pi = P(xi, br[0] + ly * 0.04), po = P(xo, br[1] + ly * 0.04), pm = P((xi + xo) / 2, (br[0] + br[1]) / 2 + ly * 0.04 - br[2]);
      ctx.beginPath(); ctx.moveTo(po[0], po[1]); ctx.quadraticCurveTo(pm[0], pm[1], pi[0], pi[1]);
      ctx.lineWidth = 3.6 * sk; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.stroke();
    }
  }

  // ---- accessories ---------------------------------------------------------------------------------------------------
  function fillOutline(ctx, TH, build, col, C, st, w) {
    build(); ctx.fillStyle = col; ctx.fill();
    if (st === 'silhouette') return;
    ctx.lineWidth = w; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.globalAlpha *= st === 'sketch' ? 0.85 : 1; ctx.stroke(); ctx.globalAlpha = 1;
  }
  function poly(ctx, pts, closed) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (closed !== false) ctx.closePath(); }
  function arcPts(P, r, a0, a1, n) { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n) * D2R; o.push(P(Math.cos(a) * r, Math.sin(a) * r)); } return o; }

  function drawHeadAcc(ctx, TH, J, R, P, a, col, C, st, face, ex) {
    ex = ex || {};
    const w = R.SW * 0.42;
    if (a.type === 'cap') {
      const dome = arcPts(P, 1.03, 196, 344, 18);
      fillOutline(ctx, TH, () => poly(ctx, [...dome, P(0.98, -0.30), P(-0.98, -0.30)]), col, C, st, w);
      fillOutline(ctx, TH, () => { const a1 = P(0.55, -0.36), a2 = P(1.38, -0.26), a3 = P(1.36, -0.16), a4 = P(0.6, -0.22); poly(ctx, [a1, a2, a3, a4]); }, col, C, st, w);
      const b = P(0, -1.02); TH.ellipse(ctx, b[0], b[1], R.SW * 0.45, R.SW * 0.45, 0, st === 'silhouette' ? col : C.ink);
    } else if (a.type === 'beanie') {
      const k = a.lift || 0, Q = (x, y) => P(x, y - k);             // lift: raise the beanie (head radii) so the brows show
      const dome = arcPts(Q, 1.05, 188, 352, 18), domePath = () => poly(ctx, [...dome, Q(1.02, -0.28), Q(-1.02, -0.28)]);
      const cuffPath = () => poly(ctx, [Q(-1.08, -0.18), Q(1.08, -0.18), Q(1.06, -0.42), Q(-1.06, -0.42)]);
      const lag = ex.lag || [0, 0], pp0 = Q(0.05, -1.22), pp = [pp0[0] + lag[0], pp0[1] + lag[1]], pr = R.HR * 0.2;
      if (ex.shade) {                                             // look.shade: a knitted beanie with a fluffy, springy pompom
        const shadeC = mix(col, C.ink, 0.22), ribC = mix(col, C.ink, 0.3), dc = Q(0, -0.5);
        fillOutline(ctx, TH, domePath, col, C, st, w);
        ctx.save(); domePath(); ctx.clip(); TH.ellipse(ctx, dc[0], dc[1], R.HR * 1.6, R.HR * 1.6, 0, shadeC);
        TH.ellipse(ctx, dc[0] - 0.40 * R.HR * 0.25, dc[1] - 0.92 * R.HR * 0.25, R.HR * 1.0, R.HR * 0.9, 0, col);
        for (let i = -2; i <= 2; i++) { const b0 = Q(i * 0.36, -0.42), b1 = Q(i * 0.13, -1.0); TH.line(ctx, b0, b1, w * 0.45, { color: ribC, raw: true }); }
        ctx.restore(); domePath(); ctx.lineWidth = w; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
        fillOutline(ctx, TH, cuffPath, mix(col, C.ink, 0.12), C, st, w);
        ctx.save(); cuffPath(); ctx.clip();
        for (let i = -6; i <= 6; i++) { const b0 = Q(i * 0.17, -0.2), b1 = Q(i * 0.17, -0.4); TH.line(ctx, b0, b1, w * 0.55, { color: ribC, raw: true }); }
        ctx.restore();
        const bump = () => { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 2, r = pr * (1 + 0.09 * Math.sin(t * 9)); if (i) ctx.lineTo(pp[0] + Math.cos(t) * r, pp[1] + Math.sin(t) * r); else ctx.moveTo(pp[0] + r, pp[1]); } ctx.closePath(); };
        fillOutline(ctx, TH, bump, shadeC, C, st, w);
        TH.ellipse(ctx, pp[0] - pr * 0.18, pp[1] - pr * 0.22, pr * 0.72, pr * 0.68, 0, col);
      } else {
        fillOutline(ctx, TH, domePath, col, C, st, w);
        fillOutline(ctx, TH, cuffPath, mix(col, C.ink, 0.15), C, st, w);
        fillOutline(ctx, TH, () => { ctx.beginPath(); ctx.arc(pp[0], pp[1], pr, 0, Math.PI * 2); }, col, C, st, w);
      }
    } else if (a.type === 'bow') {
      const c = P(0.28, -1.0), l = [P(-0.12, -1.22), P(-0.14, -0.80)], r = [P(0.68, -1.20), P(0.70, -0.80)];
      fillOutline(ctx, TH, () => poly(ctx, [c, l[0], l[1]]), col, C, st, w); fillOutline(ctx, TH, () => poly(ctx, [c, r[0], r[1]]), col, C, st, w);
      fillOutline(ctx, TH, () => { ctx.beginPath(); ctx.arc(c[0], c[1], R.HR * 0.11, 0, Math.PI * 2); }, col, C, st, w);
    } else if (a.type === 'glasses') {
      const turn = face && face.turn !== undefined ? face.turn : 0.75, ex = [lerp(-0.31, 0.30, turn), lerp(0.31, 0.64, turn)];
      const lc = st === 'silhouette' ? col : (a.color ? col : C.ink);
      for (const e of ex) { const c = P(e, 0.0); ctx.beginPath(); ctx.arc(c[0], c[1], R.HR * 0.24, 0, Math.PI * 2); ctx.lineWidth = R.SW * 0.42; ctx.strokeStyle = lc; ctx.stroke(); }
      const b1 = P(ex[0] + 0.24, -0.03), b2 = P(ex[1] - 0.24, -0.03); ctx.beginPath(); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
    } else if (a.type === 'tuft') {
      const b = P(-0.1, -1.0), c1 = P(-0.05, -1.42), e = P(0.25, -1.36), c2 = P(0.38, -1.25), e2 = P(0.22, -1.15);
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(c1[0], c1[1], e[0], e[1]); ctx.quadraticCurveTo(c2[0], c2[1], e2[0], e2[1]);
      ctx.lineWidth = R.SW * 0.75; ctx.strokeStyle = st === 'silhouette' ? C.ink : (a.color ? col : C.ink); ctx.lineCap = 'round'; ctx.stroke();
    } else if (a.type === 'ponytail') {
      const b = P(-0.9, -0.55), c1 = P(-1.5, -0.6), e = P(-1.45, 0.15);
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(c1[0], c1[1], e[0], e[1]); ctx.lineWidth = R.SW * 1.6; ctx.strokeStyle = a.color ? col : C.ink; ctx.lineCap = 'round'; ctx.stroke();
      const k = P(-0.92, -0.55); TH.ellipse(ctx, k[0], k[1], R.SW * 0.8, R.SW * 0.8, 0, col);
    }
  }

  function drawTie(ctx, TH, J, R, col, st, C) {
    const a = J.N, b = J.P, at = (u, side) => { const x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [x - dy / l * side, y + dx / l * side]; };
    const w = 0.03 * R.H;
    fillOutline(ctx, TH, () => poly(ctx, [at(0.08, -w * 0.45), at(0.08, w * 0.45), at(0.55, w), at(0.7, 0), at(0.55, -w)]), col, C, st, R.SW * 0.36);
    fillOutline(ctx, TH, () => poly(ctx, [at(0.03, -w * 0.55), at(0.03, w * 0.55), at(0.12, w * 0.4), at(0.12, -w * 0.4)]), col, C, st, R.SW * 0.36);
  }

  function drawCape(ctx, TH, C, ch, SW, col, st) {
    if (!ch || !ch.length) return;
    const top = ch[0], last = ch[ch.length - 1];
    ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
    for (const p of top) ctx.lineTo(p[0], p[1]);
    for (let i = last.length - 1; i >= 0; i--) ctx.lineTo(last[i][0], last[i][1]);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    if (st !== 'silhouette') { ctx.lineWidth = SW * 0.42; ctx.strokeStyle = C.ink; ctx.stroke(); }
  }

  // tapered cloth tail along a simulated chain, with a travelling flutter wave
  function scarfTail(ctx, ch, wmax, sw, t, flA, ph, col, C, st) {
    const n = ch.length, M = 14, c = [];
    const cr = (p0, p1, p2, p3, u) => { const u2 = u * u, u3 = u2 * u; return [0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]; };
    for (let i = 0; i <= M; i++) { const fi = i / M * (n - 1), k = Math.min(n - 2, Math.floor(fi)), u = fi - k; c.push(cr(ch[Math.max(0, k - 1)], ch[k], ch[k + 1], ch[Math.min(n - 1, k + 2)], u)); }
    const left = [], right = [], mid = [];
    for (let i = 0; i <= M; i++) {
      const s = i / M, p = c[i], q = c[Math.min(M, i + 1)], o = c[Math.max(0, i - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const fl = (flA || 0) * Math.sin(s * 6.5 - t * 9 + (ph || 0)) * Math.pow(s, 1.1);
      const cx = p[0] - ty * fl, cy = p[1] + tx * fl;
      const w = wmax * (0.26 + 0.74 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.66)), 0.85)) * (1 - 0.12 * s) * (i === M ? 0.04 : 1);
      left.push([cx - ty * w, cy + tx * w]); right.push([cx + ty * w, cy - tx * w]); mid.push([cx, cy]);
    }
    ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < M; i++) { const mx = (left[i][0] + left[i + 1][0]) / 2, my = (left[i][1] + left[i + 1][1]) / 2; ctx.quadraticCurveTo(left[i][0], left[i][1], mx, my); }
    ctx.lineTo(left[M][0], left[M][1]); ctx.lineTo(right[M][0], right[M][1]);
    for (let i = M - 1; i > 0; i--) { const mx = (right[i][0] + right[i - 1][0]) / 2, my = (right[i][1] + right[i - 1][1]) / 2; ctx.quadraticCurveTo(right[i][0], right[i][1], mx, my); }
    ctx.lineTo(right[0][0], right[0][1]); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    if (st === 'silhouette') return;
    ctx.lineWidth = sw * (st === 'sketch' ? 0.3 : 0.42); ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mid[0][0], mid[0][1]);
    for (let i = 1; i < Math.floor(M * 0.72); i++) { const mx = (mid[i][0] + mid[i + 1][0]) / 2, my = (mid[i][1] + mid[i + 1][1]) / 2; ctx.quadraticCurveTo(mid[i][0], mid[i][1], mx, my); }
    ctx.lineWidth = sw * 0.26; ctx.stroke();
  }
  function scarfBand(ctx, J, R, sw, col, C, st) {
    ctx.save(); ctx.translate(J.N[0], J.N[1] + 0.012 * R.H); ctx.rotate(J.f * (J.headAng * D2R) * 0.55);
    const bw = R.HR * 0.92, bh = R.HR * 0.36;
    ctx.beginPath(); ctx.moveTo(-bw / 2, -bh * 0.1);
    ctx.quadraticCurveTo(-bw * 0.56, bh * 0.55, -bw * 0.32, bh * 0.62); ctx.quadraticCurveTo(0, bh * 0.85, bw * 0.32, bh * 0.62);
    ctx.quadraticCurveTo(bw * 0.56, bh * 0.55, bw / 2, -bh * 0.1); ctx.quadraticCurveTo(bw * 0.3, -bh * 0.6, 0, -bh * 0.55); ctx.quadraticCurveTo(-bw * 0.3, -bh * 0.6, -bw / 2, -bh * 0.1);
    ctx.fillStyle = col; ctx.fill();
    if (st !== 'silhouette') {
      ctx.lineWidth = sw * 0.42; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.lineWidth = sw * 0.26;
      ctx.beginPath(); ctx.moveTo(-bw * 0.42, bh * 0.02); ctx.quadraticCurveTo(0, bh * 0.30, bw * 0.42, bh * 0.02); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-bw * 0.34, bh * 0.36); ctx.quadraticCurveTo(0, bh * 0.58, bw * 0.34, bh * 0.36); ctx.stroke();
    }
    ctx.restore();
  }

  // where cloth hangs from, for the simulator
  function scarfAnchor(rig, pose) { const J = rig.solve(pose), f = J.f, R = rig.R; return { x: J.N[0] - f * 0.03 * R.H, y: J.N[1] + 0.012 * R.H, Hc: J.Hc, HR: R.HR, f }; }
  const SCARF_TAILS = (R) => [{ len: 0.27 * R.H, a: 22 }, { len: 0.21 * R.H, a: 44 }];

  SF.character = { draw, EXPR, expr, exprMix, headMap, scarfAnchor, SCARF_TAILS };
})(typeof window !== 'undefined' ? window : globalThis);
