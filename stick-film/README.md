# stick-film: a Claude Code skill

Narrated stick-figure films, drawn and animated in code from a reusable character kit.

- **Mode 1, Character kit (once per character).** Pick an art style (line, silhouette, sketch, flat). Claude generates
  six reference stills in Google Flow through flow-mcp: a master sheet, expressions, two general pose sheets, props and
  sets. It then measures them and matches a code rig to them, checked side by side.
- **Mode 2, Film.** Idea, then three script options, then voice samples of the whole script. The chosen voice is locked and becomes the
  film's clock. Then a beat sheet, the animation timed to the words, sound and score, and a 1080p MP4 at -14 LUFS.

The character looks the same in every shot and actions land on the exact word, because nothing on screen is
AI-generated video. AI makes only the reference stills (free in Flow) and the narration (Kokoro, free and local).

## Install

1. Copy this folder to `~/.claude/skills/stick-film` (all projects) or `<project>/.claude/skills/stick-film`.
2. For automatic stills, install and sign in to [flow-mcp](https://github.com/GTAI-1/flow-mcp) and add it to Claude Code
   (`claude mcp add --scope user flow -- node /path/to/flow-mcp/dist/index.js`). Without it, the kit step gives you the
   prompts to run in Flow by hand.
3. In Claude Code, ask: *"Set up the stick-film skill."* It runs `scripts/setup.sh`, then asks before installing anything.
   Everything goes into `~/StickFilms/.tools`: a Python venv (~200 MB), playwright-core and the Kokoro voice model
   (~354 MB, downloaded once).

Needs macOS or Linux with Node 18+, Google Chrome, ffmpeg and Python 3.10-3.13. On a Mac: `brew install node ffmpeg python@3.12`.

## Use

- *"Make me a new stick character for my channel."*
- *"Make a short stick film about why we procrastinate, with Wick."*
- *"Turn this quote into a stick film: ..."*

Work lives in `~/StickFilms` (set `STICKFILM_HOME` to move it; on a Mac keep it out of Desktop, Documents and Downloads,
which flow-mcp cannot read):

```
~/StickFilms/characters/<slug>/   character.json, kit/ (Flow stills), rigtest/
~/StickFilms/films/<slug>/        film.json, script.json, voice/, beats.md, scene.js, out/<slug>.mp4
```

## What's inside

```
SKILL.md              the workflow Claude follows (two modes, checkpoints)
reference/            kit and film steps, Flow prompts, writing, engine API, poses, sound, troubleshooting
scripts/sf            one command for everything (sf help)
engine/               rig, 4 art styles, 9 accessories, 33-pose library, gait and cloth, sets, props, effects,
                      choreography API, Chrome renderer, motion QA, rig tests, style menu
audio/                Kokoro narration with sentence timing, voice samples, synthesized foley and mood-based score,
                      mixer with ducking and voice-margin check, two-pass loudness encode
examples/             Wick (character.json) and The Idea (a 13 s film to copy)
```

## Licences

The engine, audio code and the music and effects it synthesizes are original to this skill. Kokoro-82M weights are listed
as Apache 2.0, and the kokoro-onnx package is MIT; check the model card before monetizing. Playwright is Apache 2.0.
Stills you make in Flow follow Google's terms for Flow.
