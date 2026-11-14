# Mode 2: making a film

The order matters. Script and voice come before animation because the animation is timed to the voice. The beat
sheet comes before code because changing a plan costs a sentence and changing an animation costs a render.

## 1. Idea ✋

- The **lesson** in one sentence.
- The **picture** that shows it, which a viewer gets with the sound off. Test it: describe only the picture. If the lesson can't be
  guessed, find another picture. A Stoic "dog tied to a cart" failed this test; "a worry scribble that grows bigger than
  the house, then pops when the door opens" passed.
- The **format**:

| Format | Shape | Notes |
|---|---|---|
| Quote acted out | situation, tension, the quote, a turn, the payoff | the safest; The Door is this |
| Explainer | the narrator teaches, the character demonstrates with props | use `E.text` labels sparingly |
| Silent gag | timing and sound effects only, no narration | skip the voice steps; set `music` and `sfx` |
| Dialogue | two characters, two voices | hardest; needs a mouth (`face.mouth: "expressive"`) and a second voice per paragraph |

- Any quote or fact gets its source checked (search for it) before the script is locked. Name the source in your reply.

## 2. Script ✋

Write three options (rules and examples in `writing.md`), or work from the user's own script. **The script sets the
length**: film = narration + 0.6 s between paragraphs + a 2.5 s ending + whatever silent beats the beat sheet adds. Don't
pad or trim to a number unless the user asks for a fixed length (a Short under 60 s, a 15 s ad). Voices read at different
speeds (measured at speed 0.92: `bm_george` 2.75, `am_michael` 2.87, `af_heart` 3.22, `am_adam` 3.29 words per second), so
show each option with the length it implies:

```bash
sf estimate --text "<the option, one paragraph per line>" --voice am_michael
# 64 words, 5 paragraph(s): ~22.3 s of speech in am_michael at 0.92 -> film about 27 s plus any silent beats
sf estimate --text "..." --duration 60     # only when the film must fit a fixed length
```

Then make the film folder and put the script in, **one paragraph per entry**. A paragraph is one take, so keep lines that
belong together in one entry:

```bash
sf new-film <slug> --cast hero=<character>[,friend=<character>] [--vertical] [--duration N]   # no --duration: length follows the script
```
```json
// films/<slug>/script.json
{ "voice": "am_michael", "speed": 0.92,
  "paragraphs": [ { "id": "p1", "text": "Wick has been standing at this door for a while. ..." },
                  { "id": "p2", "text": "What if they're angry? What if he says it wrong?" } ] }
```

## 3. Voice, which becomes the clock ✋

```bash
sf samples <film> --voices am_michael,af_heart,bm_george     # voice/samples/<voice>.mp3, the whole script each
```

Each sample also prints its measured length and the film length it implies, so the user knows how long each voice makes
the film before picking. Send the MP3s (or their paths) and let the user pick by ear. A single demo sentence is not enough to judge a voice.
Then lock it:

```bash
sf tts <film> --voice am_michael --speed 0.92
```

This prints each paragraph's length and the film length the read implies, and writes `voice/voice.json` with sentence start/end times found from the pauses.
Now set `cues` in `film.json`, the time each paragraph starts. `voice/cues.suggested.json` places them back to back;
spread them out to leave silent room for action, e.g. 1-3 s after a setup line and 2-4 s after the payoff line. `sf qa`
flags any paragraph that runs into the next cue or past the end. Unless `film.json` fixes `duration` to a number, the film
ends `tail` seconds (default 2.5) after the last line; return a longer `duration` from `scene.js` for a silent ending.

Other voices:
- **The user's own recording**: save each paragraph as `voice/<id>.wav`, then `sf tts <film> --engine file`.
- **Mac voice**: `sf tts <film> --engine mac --voice Daniel` (`say -v '?'` lists voices).
- **Flow's Google voices**: `flow_narrate({ project, engine: "gemini", text, voice: "Charon", style: "warm, unhurried documentary narrator" })`
  per paragraph, copy each file to `voice/<id>.wav`, then `--engine file`. It needs an AI Studio key saved in Flow Studio;
  never ask for a key in chat.

From here on the words are locked. Changing a word means `sf tts` again and re-timing what follows it.

## 4. Beat sheet ✋

Fill `beats.md` from `voice/voice.json`: one row per sentence (and per silent beat) with the time, the line, what the
character does, the camera, and the sound. Every spoken line needs something to see. Mark the picture that works on
mute and the payoff moment where the music turns. Show it and wait for approval.

## 5. Build and review

Write `scene.js` (API in `engine.md`, poses in `poses.md`). Rules that keep it working:

- Take every time from the voice: `const l = E.say('p2'); hero.pose(l.sentences[1].t0, l.t1 + 1, 'thinking')`. Never type a
  bare number for something that happens on a word.
- Position props and effects relative to the body: `{ x: (t) => hero.top(t)[0], y: (t) => hero.top(t, 60)[1] }`.
- Keep the character readable: for close beats, zoom so the figure is at least a third of the frame height (`E.camera`
  `z` 1.1-1.4 at 1080p; vertical films default to 1.55).
- Leave 0.2-0.3 s blends between poses. Faster reads as a pop, and `sf qa` will warn.
- One idea per shot. Move the camera on story beats, not constantly.

Review loop, after every chunk of choreography:

```bash
sf qa <film>                       # must show 0 errors; read the warnings and fix the real ones
sf sheet <film> --every 0.2        # build/qa/sheet_NN.png; Read every sheet
sf stills <film> --times 9.4,17.5  # full-size frames where something looked off
sf preview <film>                  # out/preview.mp4, half size with sound, for the user
```

In every sheet, look for knees bending backward, hands hidden behind the head, the scarf over the face, limbs through
the ground, props floating away from hands, actions landing late against the words, and the character cut off by the frame.

## 6. Sound ✋

- Foley: `E.sfx('knock', t)`, `E.sfx('ding', t, { gain: 0.4 })`. Footsteps are automatic for walks and runs. Event list in `sound.md`.
- Score: `E.mood(t, 'tense')` ... `E.mood(t2, 'warm')`. The music re-starts its bar on each change, so turns land on beats.
  For a hand-written score, add `score.py` to the film folder (`sound.md`).
- `sf mix <film>` prints the voice margin. The worst spoken window should be ≥ 9 dB; it names the time if not. Lower that
  event's `gain` or adjust `film.json` `"mix": { "voice", "sfx", "music" }`.
- You cannot hear the mix. Say so, send `out/preview.mp4`, and ask the user to listen on headphones and give notes
  ("the knock is too quiet", "music too busy under line 3").

## 7. Deliver

```bash
sf make <film>             # events -> qa (must pass) -> frames -> mix -> encode
sf make <film> --lufs -16  # podcasts / Apple; -14 is for YouTube
```

`out/<film>.mp4` is 1080p (or 1080x1920), 30 fps, H.264 + AAC, normalized to -14 LUFS. Report the duration, size and
the measured loudness the encoder prints. For a thumbnail or poster: `sf stills <film> --times <t> --scale 1`.

Then remind the user where the files are. In a cloud session, the container is temporary: download the MP4 and the
`films/<slug>` folder, or push the workspace to a GitHub repo.

## Variations

- **Vertical Shorts**: `sf new-film <slug> --cast ... --vertical`; keep the action in the middle third.
- **Draw-on intro (whiteboard feel, line or sketch style)**: `hero.reveal(0.2, 1.6)` draws the character stroke by stroke.
- **Two characters**: `E.actor('friend', { x: 300, facing: -1 })` with its own cast entry; give each a different accessory or color.
- **Longer films**: a 60 s script doubles every step. Split the beat sheet into scenes and review each before moving on.
