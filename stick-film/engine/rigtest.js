// Kit checks drawn in the browser: the code-drawn character beside its Flow stills (pose sheets, expressions,
// turnaround) and the four-style menu shown before the user picks an art style.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;

  // scarf tails at rest (no simulation needed for still sheets)
  function restTails(rig, pose) {
    const K = SF.character.scarfAnchor(rig, pose), R = rig.R;
    return SF.character.SCARF_TAILS(R).map((tl, i) => {
      const ch = []; for (let j = 0; j < 5; j++) { const u = j / 4, a = (tl.a + 8 * u * u) * Math.PI / 180; ch.push([K.x - K.f * Math.cos(a) * tl.len * u, Math.min(-2, K.y + Math.sin(a) * tl.len * u + 3 * Math.sin(u * 3 + i))]); }
      return ch;
    });
  }
  function hasAcc(spec, type) { return (spec.accessories || []).some((a) => (typeof a === 'string' ? a : a.type) === type); }
  function restCape(rig, pose) { const J = rig.solve(pose), f = J.f, R = rig.R; return [[70, 0.40, 0, 0], [84, 0.30, -0.02, 0.16]].map(([a, l, dx, dy]) => { const ch = []; for (let j = 0; j < 5; j++) { const u = j / 4, aa = a * Math.PI / 180, len = l * R.H; ch.push([J.N[0] - f * 0.02 * R.H + f * dx * R.H - f * Math.cos(aa) * len * u, Math.min(-2, J.N[1] + 0.02 * R.H + dy * R.H + Math.sin(aa) * len * u)]); } return ch; }); }

  // draw `spec` in pose `name` with its feet at (cx, gy), scaled so the figure is about `h` px tall
  function figure(ctx, TH, spec, name, cx, gy, h, o) {
    o = o || {};
    const rig = SF.rig.create(spec), R = rig.R, s = h / (R.H * 1.05), f = o.facing || 1, t = o.t === undefined ? 0.35 : o.t;
    const fn = SF.poses.P[name] || SF.poses.P.neutral, pose = fn(rig, t, 0, f, o.o || {});
    const actor = { rig, spec, seed: 5 };
    const face = { expr: SF.character.expr(o.expr || SF.poses.FACE[name] || 'neutral'), turn: o.turn === undefined ? 0.75 : o.turn, blink: 0, smile: o.smile || 0 };
    ctx.save(); ctx.translate(cx, gy); ctx.scale(s, s);
    const between = o.between ? (c, J) => SF.props.draw(c, TH, 'box', { x: (J.hand[0][0] + J.hand[1][0]) / 2, y: (J.hand[0][1] + J.hand[1][1]) / 2 + 43 }, t) : null;
    SF.character.draw(ctx, TH, actor, pose, face, { tails: hasAcc(spec, 'scarf') ? restTails(rig, pose) : null, cape: hasAcc(spec, 'cape') ? restCape(rig, pose) : null, seed: 5, between });
    for (const hp of (o.held || [])) { const J = rig.solve(pose); SF.props.draw(ctx, TH, hp, { x: J.hand[0][0] + f * 8, y: J.hand[0][1] + 12, flip: -f }, t); }
    ctx.restore();
    return { rig, pose, scale: s };
  }
  function label(ctx, TH, str, x, y, size) { ctx.fillStyle = TH.color('ink'); ctx.globalAlpha = 0.75; ctx.font = `600 ${size || 26}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(str, x, y); ctx.globalAlpha = 1; }
  function groundLine(ctx, TH, x0, x1, y) { ctx.save(); TH.stroke(ctx, [[x0, y], [x1, y]], 3, { raw: true }); ctx.restore(); }

  // grid of poses in a rectangle (rows x cols), with labels. names: list of pose names
  function grid(ctx, TH, spec, names, X, Y, Wd, Ht, cols, rows, o) {
    o = o || {};
    const cw = Wd / cols, ch = Ht / rows;
    names.forEach((n, i) => {
      const c = i % cols, r = Math.floor(i / cols), cx = X + cw * (c + 0.5), gy = Y + ch * (r + 0.80);
      groundLine(ctx, TH, cx - cw * 0.36, cx + cw * 0.36, gy);
      const held = n === 'holdCup' || n === 'sip' ? ['mug'] : [];
      figure(ctx, TH, spec, n, cx, gy, ch * 0.7, { held, o: n === 'knock' ? { knock: 0.5 } : {}, between: n === 'carry' });
      label(ctx, TH, n, cx, gy + ch * 0.05, Math.max(16, ch * 0.055));
    });
  }

  // a kit image fitted into a rectangle
  function fitImage(ctx, img, X, Y, Wd, Ht) {
    if (!img) return; const s = Math.min(Wd / img.width, Ht / img.height), w = img.width * s, h = img.height * s;
    ctx.drawImage(img, X + (Wd - w) / 2, Y + (Ht - h) / 2, w, h);
  }

  // which: 'feelings' | 'actions' | 'extras' | 'turnaround' | 'expressions'. img: matching kit still (or null)
  function sheet(ctx, spec, which, img, Wd, Ht) {
    const TH = SF.theme.create(spec.style || 'line', spec.palette || {}, Wd, Ht);
    TH.frame(0); TH.background(ctx);
    const half = img ? Wd / 2 : 0, pad = 30;
    if (img) { fitImage(ctx, img, pad, pad, half - pad * 2, Ht - pad * 2 - 40); label(ctx, TH, 'Flow still', half / 2, Ht - 48, 28); }
    const X = half + pad, Wr = Wd - half - pad * 2, Hr = Ht - pad * 2 - 40;
    if (which === 'feelings' || which === 'actions' || which === 'extras') {
      const names = SF.poses.SHEETS[which];
      grid(ctx, TH, spec, names, X, pad, Wr, Hr, which === 'extras' ? 5 : 4, which === 'extras' ? 2 : 3);
    } else if (which === 'turnaround') {
      const cw = Wr / 4, gy = pad + Hr * 0.88;
      [['neutral', 1, 0.0], ['neutral', 1, 0.45], ['neutral', 1, 0.75], ['neutral', -1, 0.75]].forEach(([n, f, turn], i) => {
        groundLine(ctx, TH, X + cw * (i + 0.12), X + cw * (i + 0.88), gy); figure(ctx, TH, spec, n, X + cw * (i + 0.5), gy, Hr * 0.8, { facing: f, turn });
        label(ctx, TH, ['front-ish', 'three-quarter', 'side', 'facing left'][i], X + cw * (i + 0.5), gy + 12, 24);
      });
    } else if (which === 'expressions') {
      const list = ['neutral', 'happy', 'puzzled', 'worried', 'surprised', 'determined', 'sad', 'hope'], cols = 4, cw = Wr / cols, rh = Hr / 2;
      list.forEach((e, i) => {
        const c = i % cols, r = Math.floor(i / cols), cx = X + cw * (c + 0.5), cy = pad + rh * (r + 0.5);
        ctx.save(); ctx.beginPath(); ctx.rect(cx - cw * 0.45, cy - rh * 0.45, cw * 0.9, rh * 0.82); ctx.clip();
        figure(ctx, TH, spec, 'neutral', cx - rh * 0.05, cy + rh * 1.25, rh * 1.85, { expr: e, smile: e === 'happy' || e === 'hope' ? 0.6 : 0, turn: 0.15 });
        ctx.restore(); label(ctx, TH, e === 'hope' ? 'idea / hope' : e, cx, cy + rh * 0.38, 22);
      });
    }
    label(ctx, TH, `${spec.name || 'character'} - code rig (${spec.style || 'line'})`, half + (Wd - half) / 2, Ht - 48, 28);
  }

  // four-style menu: the same figure drawn in each style, so the user picks the look the code will actually produce
  function styleMenu(ctx, Wd, Ht, base) {
    const styles = ['line', 'silhouette', 'sketch', 'flat'], cw = Wd / 2, ch = Ht / 2;
    styles.forEach((st, i) => {
      const X = (i % 2) * cw, Y = Math.floor(i / 2) * ch;
      const spec = Object.assign({}, base || {}, { style: st, palette: Object.assign({}, SF.theme.DEFAULT_PAL[st]) });
      if (!spec.accessories) spec.accessories = [st === 'flat' ? 'cap' : 'scarf'];
      if (st === 'flat' && !spec.face) spec.face = { mouth: 'expressive' };
      const TH = SF.theme.create(st, spec.palette, cw, ch);
      const off = document.createElement('canvas'); off.width = cw; off.height = ch; const g = off.getContext('2d');
      TH.frame(0.4); TH.background(g);
      const D = { TH, W: cw, H: ch, cam: { cx: 0, z: ch / 1080 * 0.9, gy: ch * 0.76, sx: 0, sy: 0 }, t: 0.4 };
      if (st === 'silhouette') SF.sets.draw(g, D, { type: 'sun', x: 300, y: -360, r: 90 }, 0.4);
      SF.sets.draw(g, D, { type: 'hills' }, 0.4); SF.sets.draw(g, D, { type: 'ground', tufts: true }, 0.4);
      const gy = ch * 0.76, h = ch * 0.5;
      figure(g, TH, spec, 'neutral', cw * 0.22, gy, h, {}); figure(g, TH, spec, 'walk', cw * 0.5, gy, h, {}); figure(g, TH, spec, 'celebrate', cw * 0.78, gy, h, { t: 0.15, smile: 0.7 });
      g.fillStyle = st === 'silhouette' ? '#1b1510' : TH.color('ink'); g.font = `700 ${Math.round(ch * 0.07)}px sans-serif`; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(`${i + 1}  ${st[0].toUpperCase() + st.slice(1)}`, ch * 0.05, ch * 0.05);
      ctx.drawImage(off, X, Y);
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(cw - 2, 0, 4, Ht); ctx.fillRect(0, ch - 2, Wd, 4);
  }

  SF.rigtest = { sheet, styleMenu, figure, restTails };
})(typeof window !== 'undefined' ? window : globalThis);
