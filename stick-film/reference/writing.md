# Writing narration for the ear

The script is spoken, not read. Most robotic narration comes from two causes: clipped fragments with the same
rhythm, and lines generated one clip at a time. The skill fixes the second (one take per paragraph); the writing has
to fix the first.

## Rules

1. **Full sentences of different lengths.** A long sentence that sets the scene, a short one that lands.
2. **Read it out loud.** If you would not say it to a friend across a table, rewrite it.
3. **Say the picture's meaning, not the picture.** The viewer sees Wick knocking; the line says why it matters ("So Wick knocks.").
4. **Leave gaps for the picture.** A three-word line followed by three seconds of action beats a sentence that describes the action.
5. **One idea per paragraph.** Each paragraph is one take and one beat-sheet block.
6. **Know how long it will run.** The script sets the film's length. Speech runs about 2.9 words per second in `am_michael`
   at speed 0.92 (The Door: 64 words, 22 s of speech, a 30 s film once pauses and silent beats are in). `sf estimate` prints
   the length per voice. Aim for a length only when the user asks for one.
7. **Quotes: exact and sourced.** Check the wording and the source before locking. Translations differ, so use one consistently.
8. **End on the turn, not a moral.** Let the payoff picture say the lesson; the last line just closes the door.

## Robotic vs natural

Robotic (our first draft: fragments, same rhythm, one clip per line):
> He can fight it. Dig in. Grab the tree. Beg the sky. He still gets dragged.

Natural (The Door):
> Wick has been standing at this door for a while. Behind it is a conversation he's dreading, and the longer he waits, the bigger it gets.
> What if they're angry? What if he says it wrong?
> Seneca had a line for this. We suffer more often in imagination than in reality.
> So Wick knocks.
> And it's fine. It was always going to be fine.

That is 64 words and about 22 s of speech, with five paragraphs and five takes. "So Wick knocks." is three words followed by
three seconds of knocking.

## Shapes that work for short films

**Quote acted out**: the situation (1-2 sentences), the tension (a question or a what-if), the quote with its speaker, the
turn (one short line), the payoff (the picture does it; one closing line).

**Explainer**: the problem in a picture, the one idea, a demonstration, the result, one line the viewer keeps.

**Silent gag**: setup, escalation, escalation, reversal. Sound and timing only.

## Presenting options

Give three options that differ in angle, not just wording: say, one quote film, one explainer and one with humor. For each:
the text, the word count, the film length from `sf estimate`, and one line on the picture it needs. Recommend one and say why.
