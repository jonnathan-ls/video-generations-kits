# Pose library

Every pose works for any proportions: distances scale with the figure, and targets hang off the solved joints
(shoulders, head). Raised far hands swing out until they clear the head. Knees always bend forward (leg IK bend
`+1`); elbows bend down and back (arm IK bend `-1`) unless a pose needs otherwise. Use them with
`hero.pose(t0, t1, 'name', { o: {...} })`. Each pose brings a matching face unless you key expressions.

## Feelings (kit sheet 3)

| Pose | What it looks like | Default face |
|---|---|---|
| `neutral` | relaxed stand, breathing | neutral |
| `happy` | light bounce, arms open | happy |
| `sad` | slumped, head down, arms hanging | sad |
| `angry` | leaning in, fists at the hips, slight tremble | angry |
| `scared` | crouched, hands up in front of the face, trembling | scared |
| `surprised` | leaning back, arms flung out | surprised |
| `thinking` | hand on chin, head tilted | thinking |
| `confused` | shrug, hands out | confused |
| `nervous` | hands wringing at the chest | worried |
| `proud` | hands on hips, chest out, chin up | proud |
| `exhausted` | deep slump, knees bent, arms dangling | exhausted |
| `celebrate` | hopping, arms up in a V | happy |

## Actions (kit sheet 4)

| Pose | What it looks like | Options |
|---|---|---|
| `walk` | a held mid-stride (moving walks use `hero.walk`) | |
| `run` | a held running stride (moving runs use `hero.run`) | |
| `tiptoe` | sneaking, knee high, hands up like paws | |
| `jump` | in the air, legs tucked, arms up | |
| `sit` | on the ground, knees up, hand on knee | |
| `sitChair` | on a seat | `o.seat` height as a fraction of H (0.24) |
| `lie` | on its back, head propped, feet toward the facing side | |
| `wave` | near hand waving beside the head | |
| `reachUp` | on tiptoe, both hands up high | |
| `push` | leaning into something heavy | |
| `pull` | leaning back on a rope | |
| `carry` | both hands out front at the waist | pair with `hold('box', ..., { hand: 'both' })` |
| `holdCup` | near hand at the chest | pair with `hold('mug', ...)` |

## Extras

| Pose | What it looks like | Options |
|---|---|---|
| `point` | near arm straight out | `o.target: [x, y]` to point at a world point |
| `knock` | near hand raised to a door | `o.knock` 0..1 swing (animate it), `o.y` knock height |
| `handsOnHead` | both hands at the sides of the head | |
| `cower` | crouched low, holding the head, trembling | |
| `idea` | one hand up, the other on the hip | |
| `sip` | cup at the mouth | |
| `lookUp` | head tipped back | |
| `crouch` | knees bent, leaning in | `o.amt` 0..1 |

Animate a pose option with a function pose:

```js
const KNOCKS = [21.78, 22.06, 22.34];
hero.pose(21.6, 22.6, (rig, t, x, f) => {
  let k = 0; for (const s of KNOCKS) { const u = (t - s + 0.1) / 0.2; if (u > 0 && u < 1) k = Math.sin(Math.PI * u); }
  return SF.poses.P.knock(rig, t, x, f, { knock: k });
});
for (const s of KNOCKS) { E.sfx('knock', s); E.fx('ticks', s, { x: 80, y: -262 }); E.shake(s, 2.5); }
```

## Custom poses

A pose is `(rig, t, x, f, o, A) => pose`. Start from a library pose or `SF.poses.stand(rig, t, x, f, crouch, front, back)`,
then place hands with `rig.reach(p, hand, worldX, worldY, bend)` and feet with `rig.plant(p, x, front, back)`. Declaring
`p.feet` and `p.hands` is what lets blends keep planted feet still and move hands in straight lines.

```js
const shieldEyes = (rig, t, x, f) => {
  const p = SF.poses.stand(rig, t, x, f), J = rig.solve(p);
  rig.reach(p, 0, J.Hc[0] + f * rig.R.HR * 0.9, J.Hc[1] - rig.R.HR * 0.45, 1);   // hand above the eyes, elbow up
  p.hd = -10;                                                                     // look up and out
  return p;
};
hero.pose(4, 6, shieldEyes, { expr: 'curious' });
```

Pose fields: `P.x/P.y` pelvis, `tau` torso lean (degrees, + forward), `hd` head tilt (+ down), `facing`,
`arm[i] = { u, f }` and `leg[i] = { u, f }` segment angles (0 = straight down, + = toward the facing side), index 0 = near
limb (drawn in front of the head), 1 = far limb (drawn behind it, so keep far hands clear of the head).

## Expressions

`neutral, happy, sad, angry, scared, surprised, thinking, confused, worried, proud, exhausted, determined, strain, calm,
curious, alarmed, puzzled, pleading, deadpan, hope, sheepish, sneaky`. Key them with `hero.expr(t, name)`; they crossfade
over 0.18 s. Mouths follow `face.mouth` in `character.json`: `smile` draws one only during `hero.smile(...)`,
`expressive` draws one for every expression, `none` never does.

## Self-test after changing poses

Make a throwaway film whose cast has characters with different proportions (a big-headed one, a lanky one) and hold
every pose for a second:

```js
SF.defineFilm((E) => {
  const names = [...SF.poses.SHEETS.feelings, ...SF.poses.SHEETS.actions, ...SF.poses.SHEETS.extras];
  const A = Object.keys(E.cast).map((id, i) => E.actor(id, { x: -500 + i * 500 }));
  names.forEach((n, i) => A.forEach((a) => a.pose(i + 0.3, i + 0.9, n, { blend: 0.25 })));
  E.set('ground'); E.camera([[0, { x: 0, z: 0.8 }]]);
  return { duration: names.length + 1 };
});
```

`sf qa` on it must report no errors. Fast-blend warnings are expected in this test.
