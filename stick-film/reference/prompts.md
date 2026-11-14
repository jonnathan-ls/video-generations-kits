# Kit prompts for Flow

Every prompt = **style block** + **character line** + **sheet prompt**. Fill the {braces} from the user's answers. Keep the
wording plain; Flow follows concrete nouns and counts better than adjectives.

## Style blocks

**Line** (Wick's look)
> Flat 2D stick figure illustration, thick uniform black marker line (about 6 px at 1920 wide), slightly imperfect hand-drawn circle head, no shading, no gradients, no textures, no text or labels, off-white paper background (#F6F2E9), generous empty space around each figure. One accent color only: {accent name} ({accent hex}).

**Silhouette**
> Flat 2D silhouette illustration of a stick figure: solid near-black filled shapes, thick rounded limbs, a solid round head with two small light dot eyes, no outlines, no interior detail, no text or labels, smooth warm sunset gradient background from pale cream at the top to soft orange near the bottom, generous empty space. One accent color only: {accent name} ({accent hex}), used only on the {accessory}.

**Sketch**
> Loose pencil sketch of a stick figure on plain white sketchbook paper: thin graphite lines drawn twice with slight overshoot at the ends, a hand-drawn circle head, no shading or hatching, no text or labels, generous empty space. One accent color only, like a light marker wash: {accent name} ({accent hex}), used only on the {accessory}.

**Flat**
> Flat vector illustration of a chunky stick figure: thick rounded limbs and torso in {body color name} with a dark navy outline, a round {head color name} head with a dark outline, simple dot eyes and a small line mouth, no gradients, no shading, no textures, no text or labels, plain {paper color name} background, generous empty space. One accent color: {accent name} ({accent hex}), used only on the {accessory}.

## Character line

> {Name}, a stick figure. Head is a large circle about one fifth of total height. Body is a single straight line, limbs are plain lines of the same thickness, hands are small solid circles with no fingers, feet are small solid ovals pointing forward. Face: two small solid dot eyes and two short expressive eyebrow lines{, and a small simple mouth | , no mouth, no nose}. Wearing {accessory description, e.g. "a scarf tied at the neck with two tails that trail behind"}. Nothing else on the character.

(For silhouette, replace the face sentence with: "Face: only two small light dot eyes.")

## 1. Master sheet (16:9, variants 4)

> Character model sheet. The same character shown three times in a row, evenly spaced: front view, three-quarter view and side view, all standing relaxed at identical height. Clean, consistent proportions in all three.

## 2. Expressions (16:9, master as reference, variants 2)

> Same character as the reference, head and shoulders only, in a 4 by 2 grid of eight expressions: neutral, happy, puzzled, worried, surprised, determined, sad, struck by an idea. Expression comes only from the eyes, eyebrows{, mouth} and a slight head tilt. Same line weight and {accessory} in every cell.

(Silhouette: "eight head-and-shoulders silhouettes showing feeling through head tilt and shoulder posture only: neutral, happy, puzzled, worried, surprised, determined, sad, struck by an idea.")

## 3. Feelings pose sheet (16:9, master as reference, variants 2)

> Same character as the reference, full body, side or three-quarter view, in a 4 by 3 grid of twelve poses, same figure height in every cell: neutral standing, happy bounce, sad slump with head down, angry with fists clenched leaning forward, scared cower with knees bent and arms near the face, surprised jump back with arms out, thinking with hand on chin, confused shrug, nervous hands wringing at the chest, proud with hands on hips, exhausted, celebrating jump. Limbs never hidden behind the body.

## 4. Actions pose sheet (16:9, master as reference, variants 2)

> Same character as the reference, full body, side view, in a 4 by 3 grid of twelve poses, same figure height in every cell: walking mid-stride, running, sneaking on tiptoe, jumping, sitting on the ground, lying on its back, waving, reaching up high, pushing something heavy, pulling a rope, carrying a box with both hands, holding a cup at chest height. Hands are always visible. Limbs never hidden behind the body.

## 5. Props (16:9, master as reference, variants 2)

> Same line style as the reference. A grid of simple props with no character: a lightbulb, a rock, a door, a signpost with a blank arrow, a cardboard box, a coffee mug, a book, a phone, a chair, a ladder. Mostly line only, at most one flat accent-color detail per prop.

## 6. Sets (16:9, no reference, variants 1)

> Set A: {style block without the character parts} An empty wide set for a stick-figure story: a plain room with a single floor line, one window and one picture frame on the back wall, no characters, no text, large empty space in the middle.
>
> Set B: {style block without the character parts} A flat minimal outdoor scene: a gentle hill, a lone bare tree, a thin path, a muted pale sky. No characters, no text, large empty space in the middle.

## Optional: a one-off reference for an unusual move

When a story needs a move the library lacks and the look matters (riding a bike, juggling), generate one still:

> Same character as the reference, full body, side view, {the move, described step by step}. Same line weight and proportions. Plain background.

Save it in `kit/` as `07-<move>.png` and build the pose in `scene.js` from it (see `poses.md`, custom poses).
