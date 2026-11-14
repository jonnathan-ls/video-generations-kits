#!/usr/bin/env python3
"""Create a character folder: characters/<slug>/character.json + kit/ + rigtest/.

  python new_character.py <slug> [--name Name] [--style line|silhouette|sketch|flat] [--accent "#d29e23"] [--accessory scarf]

Body proportions start from Wick's and are refined from the master sheet with measure.py."""
import argparse, json, os, re, sys

PAL = {
    'line': {'ink': '#050403', 'paper': '#f1ede1', 'accent': '#d29e23'},
    'silhouette': {'ink': '#16120f', 'paper': '#f3d9a4', 'accent': '#e0892f', 'sky1': '#f6e3b8', 'sky2': '#eaa25a'},
    'sketch': {'ink': '#2b2a2e', 'paper': '#f7f5ef', 'accent': '#d9534f'},
    'flat': {'ink': '#1d2230', 'paper': '#f2efe6', 'accent': '#ef6f4c', 'body': '#3a6ea5', 'head': '#fbe3c8', 'ground': '#cfe0bf', 'hill': '#bcd9e2'},
}
ACC = ['scarf', 'cap', 'beanie', 'bow', 'glasses', 'tie', 'tuft', 'ponytail', 'cape', 'none']


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('slug'); ap.add_argument('--name'); ap.add_argument('--style', default='line', choices=list(PAL))
    ap.add_argument('--accent'); ap.add_argument('--accessory', default='scarf', help=','.join(ACC)); ap.add_argument('--mouth', default=None, choices=['smile', 'expressive', 'none'])
    ap.add_argument('--personality', default=''); a = ap.parse_args()
    slug = re.sub(r'[^a-z0-9-]+', '-', a.slug.lower()).strip('-')
    home = os.path.abspath(os.path.expanduser(os.environ.get('STICKFILM_HOME', '~/StickFilms'))); d = os.path.join(home, 'characters', slug)
    if os.path.exists(os.path.join(d, 'character.json')): sys.exit(f'{d}/character.json exists already')
    for sub in ('', 'kit', 'rigtest', 'flow'): os.makedirs(os.path.join(d, sub), exist_ok=True)
    pal = dict(PAL[a.style]); pal['accent'] = a.accent or pal['accent']
    acc = [] if a.accessory == 'none' else [{'type': x.strip(), 'color': 'accent'} for x in a.accessory.split(',')]
    spec = {
        'name': a.name or slug.capitalize(), 'slug': slug, 'style': a.style, 'palette': pal,
        'body': {'height': 420, 'head': 0.152, 'torso': 0.29, 'thigh': 0.18, 'shin': 0.18, 'upperArm': 0.165, 'foreArm': 0.165, 'line': 0.0205, 'hand': [0.031, 0.040], 'foot': [0.060, 0.022]},
        'face': {'eyes': 'glow' if a.style == 'silhouette' else 'dot', 'brows': a.style != 'silhouette', 'mouth': a.mouth or ('expressive' if a.style == 'flat' else 'smile')},
        'accessories': acc, 'personality': a.personality, 'notes': 'Proportions are defaults until measure.py runs on kit/01-master.',
    }
    with open(os.path.join(d, 'character.json'), 'w') as f: json.dump(spec, f, indent=2)
    print(d)


if __name__ == '__main__':
    main()
