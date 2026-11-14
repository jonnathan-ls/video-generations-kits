---
name: stick-film
description: Make narrated stick-figure films that are drawn and animated in code from a reusable character kit. Use when the user wants a stick figure (line, silhouette, sketch or flat style) designed, a character kit or pose sheets generated in Google Flow, or a short narrated stick-figure video, explainer, story, quote film or YouTube Short made and rendered to MP4. Two modes - Character kit (once per character - art style, Flow stills through flow-mcp, rig matched to the stills) and Film (idea, script, voice, beat sheet, animation, sound, MP4).
---

# Stick Film

Claude does not generate the video. It writes code that draws the character and moves it frame by frame. AI makes
only the reference stills (Google Flow through flow-mcp) and the narration (Kokoro, free). That is why the character
looks the same in every shot and every action lands on the exact word.

## Ground rules (both modes)

- **Stop at every checkpoint** (marked ✋) and show the user the result before moving on. Batch related questions into one ask.
- **Look before you show.** Read every image you generate (stills, rig tests, contact sheets) and fix what you see first.
- **You cannot hear.** Say so whenever you deliver sound, and ask the user to listen on headphones.
- **Flow stills cost 0 credits; this skill never generates Flow video.** If any Flow call would spend credits, stop and ask.
- **Check facts.** Any quote or claim in a script gets its source checked before the script is locked.
- **Save the work.** In a cloud session the machine is temporary: when an MP4 is done, tell the user to download it, or push the workspace to GitHub.

`sf` below means `bash <this skill>/scripts/sf`. The workspace is `$STICKFILM_HOME` (default `~/StickFilms`) with
`characters/<slug>/` and `films/<slug>/`. On a Mac keep it out of `~/Desktop`, `~/Documents` and `~/Downloads`: flow-mcp
cannot read reference images there.

## Step 0: setup (first run on a machine)

1. Run `sf setup`. It checks Node, Chrome, ffmpeg, Python, the Python packages, the Kokoro voice model and flow-mcp.
2. If anything is missing, tell the user what and ask before running `sf setup --install`. It installs into
   `~/StickFilms/.tools` only: a Python venv (~200 MB), playwright-core, and the Kokoro model (~354 MB download).
   It never installs system tools; for those, give the command it prints (e.g. `brew install ffmpeg`).
3. Call the `flow_status` tool. If flow-mcp tools are not available, or it reports a problem (not signed in, no project
   open), relay that. The kit then runs in manual mode (the user generates the stills in Flow by hand).

## Which mode

- Look in `$STICKFILM_HOME/characters/*/character.json`. Wick is bundled in `examples/characters/wick` (no stills).
- The user wants a new character, or a film with a character that has no kit: **Mode 1** first, then Mode 2.
- The kit exists: **Mode 2**. The user only wants a character: Mode 1, then stop.

## Mode 1: Character kit (once per character). Full steps: `reference/kit.md`

1. **Art style.** Run `sf styles` and Read the image (the four looks the engine draws: Line, Silhouette, Sketch, Flat).
   Show it and ask, in one question set: style, name, accessory (scarf, cap, beanie, bow, glasses, tie, hair tuft,
   ponytail, cape, none), accent color, face (no mouth / smile only / expressive), personality in a line. ✋
2. **Character folder.** `sf new-character <slug> --name <Name> --style <style> --accessory <a> --accent "<#hex>" --mouth <m>`.
3. **Master sheet in Flow.** Build the prompt from `reference/prompts.md` (style block + character line + master sheet).
   `flow_generate` with one image scene, 16:9, `variants: 4`, `max_credits: 0`, project `stick-<slug>`. Poll `flow_wait`
   until `finished`. Make a picker with `sf variants <out.png> <files...>`, Read it, drop any that fail the still checklist,
   show the rest and ask for a letter. ✋ Then `sf import-kit <slug> master=<chosen file>`.
4. **The other five sheets in one `flow_generate` call**: expressions, feelings poses, action poses, props, two sets.
   Each scene gets `reference_images: [<absolute path of the chosen master in ~/flow-mcp-out>]` and `variants: 2`.
   Check every result against the checklist and regenerate failures (free), then let the user pick. ✋ Import the picks.
5. **Match the rig.** `sf measure <slug>` and, if the numbers look plausible, `sf measure <slug> --write`. Then
   `sf rigtest <slug>`, Read every sheet in `characters/<slug>/rigtest/`, adjust `character.json` until the code-drawn
   character matches the stills (head size, line weight, colors, accessory), and show the user the rig test sheets. ✋
   The kit is done when the user approves them.

## Mode 2: Film. Full steps: `reference/film.md`

1. **Idea.** One lesson in a sentence and one picture that works with the sound off. Test: someone who sees only the picture
   should guess the lesson. ✋
2. **Script.** Three options written to be spoken (`reference/writing.md`), or the user's own script. The script sets the
   film's length; don't pad or cut it to hit a number unless the user asks for a fixed length (e.g. a Short under 60 s).
   Run `sf estimate --text "<option>"` on each and show the film length it implies next to it. Check any quote. The user
   picks. `sf new-film <slug> --cast hero=<character>` (add `--duration N` only for a fixed length); put the script in
   `script.json`, one entry per paragraph. ✋
3. **Voice, which becomes the clock.** `sf samples <film> --voices am_michael,af_heart,bm_george` gives full-script MP3s.
   Each sample prints its measured length and the film length it implies. The user picks. ✋ `sf tts <film> --voice <v>` locks one
   take per paragraph and prints the timing again; set `cues` in `film.json`, leaving silent room for action beats. The film
   ends 2.5 s after the last line (`tail` in `film.json`); `scene.js` can return a longer `duration` for a silent ending.
   From here, changing words means re-timing.
4. **Beat sheet.** Fill `beats.md`: time, line, action, camera, sound, using the real sentence times from `voice/voice.json`. ✋
5. **Build.** New films start with the premium `look` on in `film.json` (shading, squash and stretch, follow-through, shadows,
   motion blur; see `reference/engine.md`). Write `scene.js` with the engine API (`reference/engine.md`, `reference/poses.md`). Time everything from
   `E.say()`. After each chunk run `sf qa <film>` (zero errors), then `sf sheet <film> --every 0.2` and Read every sheet.
   Fix, repeat. `sf preview <film>` gives a quick MP4 with sound for the user. ✋
6. **Sound.** `E.sfx(...)` for foley, `E.mood(t, name)` for the score (`reference/sound.md`). `sf mix <film>` prints the voice
   margin: the worst spoken window should be 9 dB or more. Ask the user to listen on headphones and give notes. ✋
7. **Deliver.** `sf make <film>` (QA must pass) writes `out/<film>.mp4`, 1080p30 at -14 LUFS for YouTube. Report the
   duration and measured loudness from the output, hand over the file, and remind them to save it.

## Commands

| Command | What it does |
|---|---|
| `sf setup [--install]` | check / install dependencies into the workspace |
| `sf styles [out.png]` | the four art styles drawn by the engine |
| `sf new-character <slug> ...` | character folder + starter `character.json` |
| `sf variants <out.png> <files...>` | lettered A-D picker for Flow variants |
| `sf import-kit <slug> master=<f> expressions=<f> feelings=<f> actions=<f> props=<f> set-a=<f> set-b=<f>` | copy picked stills into `kit/` |
| `sf measure <slug> [--write]` | proportions and colors from the master sheet |
| `sf rigtest <slug>` | code rig beside each kit still, in `rigtest/` |
| `sf new-film <slug> --cast hero=<char> [--vertical]` | film folder with film.json, script.json, beats.md, scene.js |
| `sf estimate <film>` / `sf estimate --text "..." [--duration N]` | the film length a script implies, per voice |
| `sf samples <film> [--voices a,b,c]` / `sf voices` | voice samples of the full script, with measured length / list voices |
| `sf tts <film> [--voice v] [--speed s] [--engine kokoro\|mac\|file]` | the locked narration and its timing |
| `sf qa <film>` | knees, hidden hands, ground, pops, off-screen, voice overlaps |
| `sf sheet <film> [--every 0.2] [--from a --to b]` / `sf stills <film> --times 1,2` | contact sheets / full frames |
| `sf preview <film>` | half-size MP4 with sound |
| `sf make <film> [--lufs -14]` | events, QA, frames, mix, encode |

## Reference

- `reference/kit.md`: Mode 1 in detail, exact flow-mcp calls, still checklist, manual mode
- `reference/prompts.md`: style blocks for each art style and the six kit prompts
- `reference/film.md`: Mode 2 in detail, timing rules, review loop, delivery
- `reference/writing.md`: writing narration for the ear, with examples
- `reference/engine.md`: `scene.js` API (actors, sets, props, effects, camera, sound, custom drawing)
- `reference/poses.md`: pose library, expressions, custom poses
- `reference/sound.md`: voices, moods, foley events, mix levels, custom score
- `reference/troubleshooting.md`: failure modes seen so far and their fixes
- `examples/films/the-idea/`: a complete 13 s film to copy from
