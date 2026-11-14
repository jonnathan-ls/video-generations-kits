#!/usr/bin/env python3
"""Create a film folder: films/<slug>/ with film.json, script.json, beats.md and a starter scene.js.

  python new_film.py <slug> --cast hero=wick[,friend=pip] [--title "The Door"] [--style line] [--duration N] [--vertical]

Without --duration the film's length follows its narration (the last line + film.json "tail", 2.5 s)."""
import argparse, json, os, re, shutil, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('slug'); ap.add_argument('--cast', required=True); ap.add_argument('--title'); ap.add_argument('--style')
    ap.add_argument('--duration', type=float, default=None); ap.add_argument('--vertical', action='store_true'); a = ap.parse_args()
    slug = re.sub(r'[^a-z0-9-]+', '-', a.slug.lower()).strip('-')
    home = os.path.abspath(os.path.expanduser(os.environ.get('STICKFILM_HOME', '~/StickFilms'))); d = os.path.join(home, 'films', slug)
    if os.path.exists(os.path.join(d, 'film.json')): sys.exit(f'{d} exists already')
    cast = dict(kv.split('=') for kv in a.cast.split(','))
    for cid, ch in cast.items():
        if not os.path.exists(os.path.join(home, 'characters', ch, 'character.json')) and not os.path.exists(os.path.join(SKILL, 'examples', 'characters', ch, 'character.json')):
            sys.exit(f'character "{ch}" not found in {home}/characters (make its kit first)')
    for sub in ('', 'voice', 'build', 'out'): os.makedirs(os.path.join(d, sub), exist_ok=True)
    film = {'title': a.title or slug.replace('-', ' ').title(), 'width': 1080 if a.vertical else 1920, 'height': 1920 if a.vertical else 1080, 'fps': 30,
            'duration': a.duration if a.duration else 'auto', 'tail': 2.5, 'cast': cast, 'cues': {}, 'music': {'key': 'D', 'bpm': 84}, 'mix': {'voice': 1.45, 'sfx': 0.62, 'music': 0.26},
            'look': {'bendy': True, 'shade': True, 'shadows': True, 'squash': 1, 'drag': 1, 'blur': 10, 'shutter': 0.35}}
    if a.style: film['style'] = a.style
    json.dump(film, open(os.path.join(d, 'film.json'), 'w'), indent=2)
    json.dump({'voice': 'am_michael', 'speed': 0.92, 'paragraphs': [{'id': 'p1', 'text': 'Replace with the locked script, one paragraph per entry.'}]}, open(os.path.join(d, 'script.json'), 'w'), indent=2)
    shutil.copy(os.path.join(SKILL, 'templates', 'film', 'beats.md'), os.path.join(d, 'beats.md'))
    open(os.path.join(d, 'scene.js'), 'w').write(open(os.path.join(SKILL, 'templates', 'film', 'scene.js')).read().replace('__TITLE__', film['title']))
    print(d)


if __name__ == '__main__':
    main()
