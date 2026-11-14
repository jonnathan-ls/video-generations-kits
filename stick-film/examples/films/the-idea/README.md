# The Idea (13 s example)

A complete small film for the bundled Wick character: walk in, think, an idea lands on the word, celebrate, run off.
It shows timing from the voice (`E.say`), props and effects placed on the body (`hero.top(t)`), a mood change, a camera
push and an exit run.

```bash
cp -r <skill>/examples/films/the-idea ~/StickFilms/films/
sf tts the-idea          # makes voice/ (Kokoro, am_michael)
sf make the-idea         # out/the-idea.mp4
```

It is deliberately action-heavy (`sf estimate` calls the narration SHORT for 13 s): the last 5 s are a silent run-off.
