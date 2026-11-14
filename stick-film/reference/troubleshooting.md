# Troubleshooting

## Story and look (seen in real films)

| Problem | Cause | Fix |
|---|---|---|
| Narration sounds robotic | clipped fragments, one clip per line | full sentences; one take per paragraph (`sf tts` does this) |
| Viewers don't get it | the picture needs explaining | pick a picture that works on mute (film.md step 1) |
| Knees or elbows bend backward | IK bend sign | legs bend `+1`, arms `-1`; `sf qa` reports backward knees |
| Hands disappear | far hand behind the head | far hand beside the head or out to the side; near hand for touches at the face |
| Scarf covers the face | cloth without collision | the cloth sim collides with the head and stays off the face; don't hand-draw tails |
| Music drowns the voice | no ducking, loud stingers | `sf mix` margin ≥ 9 dB; lower the event `gain` |
| Character changes between stills | separate Flow generations | master sheet first, then reference it on every other sheet |
| Action lands late against the words | hand-typed times | take times from `E.say()` sentences and pauses |
| A pose pops | blend too short, or two poses far apart | blends of 0.2-0.3 s; `sf qa` flags pops |
| Files gone | temporary cloud machine | download `out/` and the film folder, or push the workspace to GitHub |

## flow-mcp

| Symptom | Fix |
|---|---|
| `flow_status` says not signed in / no project open | the user runs `npm run login` in their flow-mcp folder, signs in, opens a Flow project, and leaves the window open |
| EPERM or a reference image is ignored | references must be absolute paths flow-mcp can read; use the files in `~/flow-mcp-out`, never `~/Desktop`, `~/Documents` or `~/Downloads` |
| A reply says `still_working` with a `task_id` | call `flow_wait` with that id; never repeat the call (it is still running) |
| Everything times out | the Chrome window was closed or the Mac slept; the user reopens it with `npm run login` |
| An image job finished with failed images | `flow_retry` with the job id remakes only the failed ones |
| An image was made but no file arrived | `flow_assets` then `flow_download`: no regeneration needed |
| The tools are missing in this session | flow-mcp runs on the user's own computer; in a cloud session use manual mode (`kit.md`) |
| A quote above 0 credits | this skill only makes images (0 credits); stop and ask before anything that spends |

## Engine and rendering

| Symptom | Fix |
|---|---|
| `Playwright not found` | `sf setup --install` (puts playwright-core in `~/StickFilms/.tools`) |
| No Chrome found | install Google Chrome, or `export CHROME_PATH=/path/to/chrome` |
| `page failed to load` | a syntax or runtime error in `scene.js`; run `sf qa <film>` to see the node stack trace |
| `no paragraph "p2" in voice.json` | run `sf tts <film>` after editing `script.json` |
| `no cue for "p2"` | add it to `film.json` `cues` |
| `character "x" not found` | make its kit (Mode 1) or point the cast at a `character.json` path |
| A frame count mismatch after `sf frames` | a worker crashed; the error above it names the frame; fix and re-run |
| `sf frames` / `sf make` stalls with no new frames and the worker at 0% CPU | Google Chrome updated itself in the background mid-render. Stop the render and point it at a separate headless Chrome: `CHROME_PATH=/path/to/chrome-headless-shell sf make <film>` |
| Text renders in a plain font | the label fonts are system fonts; pass `font` to `E.text` or add titles in the editor |

## Audio

| Symptom | Fix |
|---|---|
| Kokoro model files not found | `sf setup --install` or set `KOKORO_DIR` |
| `onnxruntime` will not install | use Python 3.10-3.13 (Mac: `brew install python@3.12`), then `sf setup --install` |
| `ffmpeg not found` | Mac: `brew install ffmpeg` |
| Mac voice names | `say -v '?'` lists them; `sf tts <film> --engine mac --voice Daniel` |
| Loudness lands 0.5-1 dB under target | the true-peak ceiling holds it down on very punchy mixes; it is within YouTube's tolerance |
