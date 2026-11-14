# Mode 1: the character kit

A kit is made once per character and reused by every film. It holds six reference stills from Flow plus a
`character.json` the engine reads. The stills are style references: the film never plays them. Claude measures them
and draws the character in code, so a general pose sheet is enough. Story-specific poses (knocking, holding a mug)
come from the pose library or are built in code.

```
characters/<slug>/
  character.json      proportions, palette, face, accessories (the engine reads this)
  kit/01-master.*     front, three-quarter and side views in one image
  kit/02-expressions.* 8 faces
  kit/03-feelings.*   12 body-language poses
  kit/04-actions.*    12 action poses (movement, touching things)
  kit/05-props.*      10 props in the same line style (optional)
  kit/06-set-a.*, 06-set-b.*  an empty room and an outdoor set (optional; the engine draws its own sets)
  kit/kit.json        where each still came from
  flow/               variant pickers and notes
  rigtest/            the code-drawn character beside each still
```

## 1. Choose the art style and the character

Run `sf styles` and Read the image. It shows the same figure in the four styles the engine can draw, so the user picks the
look they will actually get on screen.

| Style | Looks like | Good for | Watch out for |
|---|---|---|---|
| Line | thick marker lines on warm paper, one accent color (Wick) | explainers, gentle stories | none; the easiest to match |
| Silhouette | solid black figure against a sunset gradient | dramatic, emotional, quotes | faces are only eye glints, so poses must carry the emotion |
| Sketch | doubled pencil lines that boil, red accent | notebook / thinking-out-loud films | busy backgrounds fight the lines |
| Flat | chunky colored limbs with outlines, skin-tone head, mouth | upbeat explainers, kids, Shorts | more colors to keep consistent across stills |

In the same question set, ask for:
- **Name**, and a one-line **personality** (how they move: quick and nervous, slow and sure...).
- **Accessory**: scarf (with cloth physics), cap, beanie, bow, glasses, tie, hair tuft, ponytail, cape, or none. Each of these
  is already drawn in code. Anything else (a hat with a feather, a backpack) needs new drawing code in
  `engine/character.js` (`drawHeadAcc`, or a new branch next to `drawTie`). Say so: it adds a round.
- **Accent color** (one color only, as a name and hex).
- **Face**: no mouth with a smile only at payoffs (Wick), an expressive mouth, or none.

Then create the folder:

```bash
sf new-character <slug> --name "<Name>" --style <line|silhouette|sketch|flat> --accessory <type> --accent "<#hex>" --mouth <smile|expressive|none> --personality "<line>"
```

## 2. Generate the master sheet (flow-mcp)

1. `flow_status` (call it first every session). If it returns a hint, such as not signed in or no project open, relay it and stop.
2. Write the prompt from `prompts.md`: style block + character line + the master sheet prompt.
3. Queue it, with images only and free:

```json
flow_generate({
  "project": "stick-<slug>",
  "scenes": [{ "type": "image", "aspect_ratio": "16:9", "variants": 4, "max_credits": 0,
               "prompt": "<style block> <character line> <master sheet prompt>" }]
})
```

4. `flow_wait({ "job_ids": [<id>] })`. Each call returns within ~40 s, so repeat until `finished` is true. The result lists the
   saved files, e.g. `~/flow-mcp-out/stick-<slug>/scene-01-v1.png` ... `-v4.png`. Use the paths it returns; numbering
   continues across calls in the same project. If a reply says `still_working` with a `task_id`, pass that id to `flow_wait`
   and never repeat the call.
5. `sf variants characters/<slug>/flow/pick_master.png <the 4 files>`, then Read the picker. Drop variants that fail the
   checklist below. Show the rest and ask the user for a letter.
6. `sf import-kit <slug> master=<chosen file>`.

## 3. Generate the other sheets in one call

One `flow_generate` call with all scenes, so numbering and pacing are handled together. Each scene references the chosen
master by its absolute path in `~/flow-mcp-out`. That folder is readable by flow-mcp; `~/Desktop`, `~/Documents` and
`~/Downloads` are not on a Mac (EPERM). At most 3 reference images per scene.

```json
flow_generate({
  "project": "stick-<slug>",
  "scenes": [
    { "type": "image", "aspect_ratio": "16:9", "variants": 2, "max_credits": 0, "reference_images": ["<master path>"], "prompt": "<style block> <expressions prompt>" },
    { "type": "image", "aspect_ratio": "16:9", "variants": 2, "max_credits": 0, "reference_images": ["<master path>"], "prompt": "<style block> <feelings prompt>" },
    { "type": "image", "aspect_ratio": "16:9", "variants": 2, "max_credits": 0, "reference_images": ["<master path>"], "prompt": "<style block> <actions prompt>" },
    { "type": "image", "aspect_ratio": "16:9", "variants": 2, "max_credits": 0, "reference_images": ["<master path>"], "prompt": "<style block> <props prompt>" },
    { "type": "image", "aspect_ratio": "16:9", "variants": 1, "max_credits": 0, "prompt": "<set A prompt>" },
    { "type": "image", "aspect_ratio": "16:9", "variants": 1, "max_credits": 0, "prompt": "<set B prompt>" }
  ]
})
```

Scenes run one at a time with 25-70 s pauses (flow-mcp paces itself on purpose), so this takes several minutes. Tell
the user. Then:

- Poll `flow_wait` until finished. If a batch ends with failed images, `flow_retry` with its job id remakes only those.
- For each sheet: `sf variants characters/<slug>/flow/pick_<sheet>.png <files>`, Read it, check it against the checklist. A sheet
  that fails gets regenerated on its own with a sharper prompt (name the fault in the prompt: "every limb the same
  thickness", "no fingers"). That is free, but each one costs a few minutes.
- Show the user the passing variants and get picks (batch them in one question), then import everything:

```bash
sf import-kit <slug> expressions=<f> feelings=<f> actions=<f> props=<f> set-a=<f> set-b=<f>
```

`flow_agent_images` is faster (parallel) but cannot take reference images, so only use it for the sets, never for the
character sheets.

## Still checklist (reject and regenerate; never fix a bad still in code, the code copies the flaw)

- The head is the same size and shape in every view and every pose.
- Every limb has the same line thickness; hands are plain circles (no fingers), feet small ovals.
- Line style: the accent is the only color. Flat style: the same body, head and accent colors on every sheet.
- Plain background, generous empty space, no text, labels or numbers.
- Limbs are never hidden behind the body; each pose reads as a silhouette.
- It is the same character as the master (compare the accessory and the face).

## 4. Measure and match the rig

```bash
sf measure <slug>            # prints estimates next to the current numbers
sf measure <slug> --write    # saves them (head, line weight, torso, legs, arms, ink/paper/accent colors)
sf rigtest <slug>            # characters/<slug>/rigtest/rigtest_{turnaround,expressions,feelings,actions,extras}.png
```

Read every rig test sheet. Each puts the Flow still on the left and the code-drawn character on the right, in the same
order as the prompts. Compare and edit `character.json` until they match:

- **Too small or big a head**: `body.head` (head radius as a fraction of height; Wick 0.152).
- **Lines too thin or thick**: `body.line` (Wick 0.0205).
- **Long or short legs and arms**: `body.thigh`/`shin`, `upperArm`/`foreArm`; torso `body.torso`.
- **Colors**: `palette.ink`, `paper`, `accent` (flat also uses `body`, `head`, `ground`, `hill`).
- **Face**: `face.eyes` (`dot`, `round`, `glow`, `none`), `face.brows`, `face.mouth` (`smile`, `expressive`, `none`), `face.eyeSize`.
- **Accessory**: `accessories: [{"type": "scarf", "color": "accent"}]`. A beanie that hides the brows takes `"lift": 0.3`
  (head radii) to sit higher, as Flow usually draws it.

Code poses will not match Flow poses line for line. Flow draws front views and the rig is side-on with a three-quarter
face. Judge the character (proportions, weight, feel), not the exact limb angles. Show the user the sheets. ✋ The kit is
done when they approve.

## Manual mode (no flow-mcp)

Give the user the six prompts from `prompts.md` in order: the master first, then the others with the master attached as a
reference image in Flow. Ask them to save the picks in one folder and tell you the paths, then run `sf import-kit` with
those paths. Everything after that is the same.

## Optional: a Flow character for later video work

`flow_character({ "name": "<Name>", "image": "<master path>" })` stores the character in the Flow project as
`asset:<Name>`. It is not needed for this skill, but it keeps the look if the user later makes Flow video with the same
character.
