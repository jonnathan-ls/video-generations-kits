# Engine reference (`scene.js`)

A film folder holds `film.json`, `script.json`, `voice/`, `beats.md` and `scene.js`. `scene.js` calls
`SF.defineFilm(E => { ... })` once. The engine compiles it into a pure function of time, so the same code drives QA in
node and rendering in Chrome. It must be deterministic: no `Math.random`, no `Date`. Use `E.L.rnd(seed, i)` for variety.

**Coordinates.** World pixels, ground at `y = 0`, `y < 0` is up. A character is about `body.height` px tall (420 by
default) and `x` is its pelvis. Facing `+1` is right, `-1` left. At camera zoom 1 on a 1080p frame, the ground line sits at 68% of
the height and 1920 px of world are visible.

## film.json

```json
{ "title": "The Door", "width": 1920, "height": 1080, "fps": 30, "duration": "auto", "tail": 2.5,   // "auto": ends tail s after the last line
  "style": "line",                       // optional: overrides the first character's style
  "palette": { "accent": "#d29e23" },    // optional: overrides theme colors
  "cast": { "hero": "wick", "friend": { "character": "pip", "override": { "palette": { "accent": "#3a6ea5" } } } },
  "cues": { "p1": 0.6, "p2": 10.4 },     // when each narration paragraph starts
  "music": { "key": "D", "bpm": 84, "preset": "warm", "off": false },
  "mix": { "voice": 1.45, "sfx": 0.62, "music": 0.26, "duck": 0.8 },
  "look": { "bendy": true, "shade": true, "shadows": true, "squash": 1, "drag": 1, "blur": 10, "shutter": 0.35 } }   // optional polish
```

Cast values are a character slug (looked up in `$STICKFILM_HOME/characters/` and then the skill's `examples/characters/`),
a path to a `character.json`, or `{ character, override }`.

### look: premium polish (all optional, off by default)

| Key | Does |
|---|---|
| `squash` | squash and stretch from the body's own vertical motion (crouches, take-offs, landings, sitting); `1` is the default strength |
| `drag` | follow-through: free arms, the head and the torso trail the body by ~0.1 s, overshoot and settle; springy pompoms. IK-placed hands are left alone |
| `bendy` | rubber-hose limbs and torso (flat style) |
| `shade` | flat style: a cel shadow side and lit side on limbs, head and hands, a head highlight, blush, eye catchlights, a filled grin for big smiles, a knitted beanie |
| `shadows` | soft contact shadows under each character that shrink as the feet leave the ground |
| `blur` | motion blur: each frame averages N sub-frames (8-10 is smooth; render time scales with N). `shutter` is the fraction of a frame they span (0.35 avoids ghosting on fast turns) |

Custom props drawn in `E.layer` are not shaded automatically; add your own soft ellipse shadows under them so they sit on the ground.

## The builder `E`

| Call | Does |
|---|---|
| `E.actor(id, { x, facing, z, character, seed, noBlink })` | a character from the cast (`id` is the cast key) |
| `E.say(id)` | `{ t0, t1, text, sentences: [{ text, t0, t1 }], pauses: [[a, b]] }` in film seconds, from `voice.json` + `cues` |
| `E.set(type, opts)` | a set piece (below). Drawn behind actors in call order; `front: true` draws it in front |
| `E.prop(type, opts)` | a free-standing prop (below). `t0`/`t1` window, `pop: true` scales it in and out, `front: true` |
| `E.fx(type, t, opts)` | a short effect (below) |
| `E.sfx(type, t, { gain, pan, dur })` | a sound event (`sound.md`). Footsteps are added automatically |
| `E.mood(t, name)` / `E.music({...})` | the score's mood timeline / settings |
| `E.camera([[t, { x, z, gy }], ...])` | camera keys, eased. `x` world center, `z` zoom, `gy` screen y of the ground |
| `E.follow(actor, t0, t1, { offset, z, blend })` | camera tracks an actor (smoothed) between t0 and t1 |
| `E.shake(t, amp, dur)` | a small camera shake (knocks, pops) |
| `E.layer(fn, { z: 'back' \| 'mid' \| 'front' })` | custom drawing, `fn(ctx, S, D)` (below) |
| `E.text(t0, t1, str, { x, y, size, color, font })` | a screen label; `x`, `y` are fractions of the frame |
| `E.fade([in0, in1], [out0, out1])` | fade from/to paper (default: in over 0-0.25 s, out over the last 0.5 s) |
| `E.length(s)` or `return { duration }` | film length (else `film.json` duration, or the last line + `tail` when it is `"auto"`) |
| `E.L` | helpers: `sstep, seg, kf, kfo, lerp, clamp, win, easeOut, backOut, rnd, srnd, mix` |
| `E.W, E.H, E.fps, E.style, E.cues, E.voice, E.cast` | read-only context |

Any option of a set, prop or effect may be a function of time: `{ x: (t) => hero.top(t)[0] }`.

## Actors

```js
const hero = E.actor('hero', { x: -600, facing: 1 });
hero.walk(0.3, 2.4, -80);                         // walk to x = -80 between 0.3 and 2.4 s (faces the way it walks)
hero.pose(2.6, 5.0, 'thinking');                  // hold a library pose, blended in and out (0.3 s default)
hero.pose(5.0, 6.0, 'idea', { blend: 0.18, expr: 'surprised' });
hero.reach(6.2, 7.0, 0, [120, -300]);             // near hand to a world point (or (t, A) => [x, y])
hero.hold('mug', 7.0, 12, { hand: 0 });           // a prop in the near hand ('both' for a carried box)
hero.run(9, 11.5, 1800);                          // a run (lean, pumping arms, faster cadence)
```

| Method | Notes |
|---|---|
| `walk(t0, t1, x, { run, Tc, stance, backward, steps, ease })` | add walks in time order. Feet plant in world space (no sliding). `ease: 'cruise'` (default for walks over 1.4 s) or `'smooth'`. Over ~560 px/s at default height, use `run`. `steps: false` silences footsteps |
| `run(t0, t1, x, opts)` | `walk` with `run: true` |
| `turn(t, dir)` | face `+1` or `-1` at `t` (the face swings through front view around it) |
| `pose(t0, t1, pose, { blend, in, out, upper, expr, o })` | `pose` is a library name or a function (see `poses.md`). The pose is reached at `t0` and held to `t1`. `upper: true` blends only arms, head and lean (gestures while walking). `o` passes pose options |
| `reach(t0, t1, hand, target, { bend, in, out })` | IK one hand to a point; `bend: -1` elbow down/back (default), `+1` elbow up/forward |
| `hold(type, t0, t1, { hand, dx, dy, rot, s, flip, ...propOpts })` | attaches a prop; `hand: 'both'` centers it between the hands and draws it between the arms |
| `expr(t, name)` | keyed expressions; without any keys, each pose brings its own face |
| `look(t0, t1, { turn, lx, ly, blend })` | face turn 0 (front) to 1 (profile); `lx`/`ly` eye direction -1..1 |
| `smile(t0, t1, amt)` | a smile (the only mouth for `mouth: "smile"` characters) |
| `blink(t)` | an extra blink (auto blinks every ~2.3-4.6 s) |
| `show(t0, t1)` | visible only in these windows (call several times) |
| `clip(t0, t1, x, side)` | hide everything past world `x` (walking behind a door jamb) |
| `reveal(t0, t1)` | draw-on entrance, stroke by stroke (line and sketch styles; others fade) |
| `custom((p, t, A) => p)` | last-word edit of the pose each frame (escape hatch) |

Positions for placing things (use them inside functions, they are evaluated per frame): `hero.top(t, dy)` (above the
head), `hero.head(t)`, `hero.hand(t, i)`, `hero.feet(t)`, `hero.xAt(t)`, `hero.facingAt(t)`, `hero.J(t)` (all joints: `P`, `N`,
`Hc`, `sh`, `elbow[i]`, `hand[i]`, `knee[i]`, `ankle[i]`). Rig sizes: `hero.R` (`H`, `HR` head radius, `ARM`, `LEG`, `TORSO`,
`SW` line weight, `k = H / 420`).

## Set pieces: `E.set(type, opts)`

| Type | Options |
|---|---|
| `ground` | `band` (accent path, default true), `bandColor`, `bandHeight`, `tufts`, `clear: [x0, x1]` (no tufts there) |
| `hills` | `scale`. Two parallax ridges |
| `sun` | `x`, `y`, `r`, `p` (parallax) |
| `clouds` | `list: [[x, y, scale], ...]`, `drift` px/s, `p` |
| `birds` | `n`, `x`, `y`, `speed` |
| `tree` | `x`, `scale`, `grow` 0..1 (draws on), `flip` |
| `house` | `x` (door center), `width`, `wall`, `roof`, `windows: [[dx, y, w, h]]` (dx from the door), `chimney`, `door: { w, h, open: t => 0..1, knock: t => px, glow: t => 0..1 }` |
| `room` | `wall` height, `window: [x, y, w, h]` or false, `frame: [x, y, w, h]` or false, `lamp: { x }` or false, `rug: [x, w]` |

## Props: `E.prop(type, opts)` and `hero.hold(type, ...)`

`mug` (`steam`), `bulb` (`on` 0..1 lights it), `rock` (`size`), `box` (`w`, `h`), `book`, `phone` (`on`), `ball` (`r`), `sign`
(`text`), `chair` (`seat` height), `table` (`w`, `h`), `ladder` (`h`), `plant`, `heart` (`size`). Common options: `x`, `y`, `rot`
(degrees), `s`, `flip`, `alpha`, `t0`, `t1`, `pop`, `front`, `p` (parallax).

## Effects: `E.fx(type, t, opts)`

| Type | Use | Options |
|---|---|---|
| `ticks` | knocks, small impacts | `x, y, s, a0` (start angle) |
| `burst` | a pop | `x, y, s, rot` |
| `sweat` | nerves | `x, y, vx, vy` |
| `puff` | dust on landing or a fast start | `x, y, s, vx` |
| `sparkle` | an idea, magic | `x, y, s` |
| `mark` | `!` or `?` above a head | `x, y, mark, s` |
| `speed` | motion lines | `x, y, dir` (-1 trails left), `s` |
| `thought` | thought bubble with optional prop inside | `x, y, head: (t) => hero.top(t), prop: 'bulb', s` |
| `hearts` | rising hearts | `x, y, s` |

All take `life` (seconds) to override the default length.

## Custom drawing: `E.layer`

For anything bespoke, like the worry scribble in The Door, a doodle or a chart:

```js
E.layer((ctx, S, D) => {
  D.layer(ctx, 1);                         // world transform (p = parallax, 1 = with the actors)
  const t = D.t, TH = D.TH, k = E.L.sstep(E.L.seg(t, 4, 6));
  TH.ring(ctx, hero.top(t)[0], hero.top(t, 120)[1], 30 + 80 * k, 4);
  TH.stroke(ctx, [[0, -500], [60, -540], [120, -500]], 4, { color: 'accent' });
}, { z: 'mid' });                          // 'back' (behind props), 'mid' (behind actors), 'front' (over everything)
```

Theme primitives (they follow the art style automatically): `TH.stroke(ctx, pts, w, { color, seed, smooth, closed })`,
`TH.line(ctx, a, b, w)`, `TH.shape(ctx, buildPath, role, { w, outline })`, `TH.ellipse(ctx, x, y, rx, ry, rot, color)`,
`TH.ring(ctx, cx, cy, r, w, { a0, a1, spiral })`, `TH.color(role)`. Roles: `ink`, `paper`, `accent`, `accentDark`, `soft`, `glow`,
`shade`, `ground`, or any `#hex`. `D.actor(id)` gives an actor's frame state (`J`, `pose`, `face`).

## character.json

```json
{ "name": "Wick", "slug": "wick", "style": "line",
  "palette": { "ink": "#050403", "paper": "#f1ede1", "accent": "#d29e23" },
  "body": { "height": 420, "head": 0.152, "torso": 0.29, "thigh": 0.18, "shin": 0.18, "upperArm": 0.165, "foreArm": 0.165,
            "line": 0.0205, "hand": [0.031, 0.040], "foot": [0.060, 0.022], "shoulderDrop": 0.03, "neck": 0 },
  "face": { "eyes": "dot", "brows": true, "mouth": "smile", "eyeSize": 1 },
  "accessories": [{ "type": "scarf", "color": "accent" }] }
```

Body values are fractions of `height`. Flat style also reads `palette.body`, `head`, `hand`, `shirt`. Silhouette uses
`sky1`/`sky2` for the gradient.

## Extending the engine

Add reusable pieces in the matching engine file, drawn only with theme primitives so every style keeps working: poses
in `engine/poses.js` (`P.name`, also add to `SHEETS` and `FACE`), props in `engine/props.js`, set pieces in `engine/sets.js`,
effects in `engine/fx.js`, accessories in `engine/character.js`, sounds in `audio/dsp.py` (`FOLEY`). Run the pose
library self-test after changing poses (see `poses.md`).
