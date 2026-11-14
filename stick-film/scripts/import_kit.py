#!/usr/bin/env python3
"""Copy the picked Flow stills into the character's kit with the names the rest of the skill expects.

  python import_kit.py <slug> master=<file> [expressions=<file>] [feelings=<file>] [actions=<file>] [props=<file>] [set-a=<file>] [set-b=<file>]

<file> is a path from flow_wait's results (usually ~/flow-mcp-out/<project>/scene-NN[-vK].png) or any image you saved.
Also records where each still came from in kit/kit.json."""
import json, os, shutil, sys, time

NAMES = {'master': '01-master', 'expressions': '02-expressions', 'feelings': '03-feelings', 'actions': '04-actions', 'props': '05-props', 'set-a': '06-set-a', 'set-b': '06-set-b'}


def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    slug = sys.argv[1]; home = os.path.abspath(os.path.expanduser(os.environ.get('STICKFILM_HOME', '~/StickFilms')))
    d = os.path.join(home, 'characters', slug); kit = os.path.join(d, 'kit')
    if not os.path.exists(os.path.join(d, 'character.json')): sys.exit(f'no character "{slug}": run new_character.py first')
    os.makedirs(kit, exist_ok=True); log_p = os.path.join(kit, 'kit.json')
    log = json.load(open(log_p)) if os.path.exists(log_p) else {}
    for arg in sys.argv[2:]:
        key, _, src = arg.partition('=')
        if key not in NAMES: sys.exit(f'unknown kit slot "{key}" (use: {", ".join(NAMES)})')
        src = os.path.abspath(os.path.expanduser(src))
        if not os.path.exists(src): sys.exit(f'missing file: {src}')
        ext = os.path.splitext(src)[1].lower().replace('.jpeg', '.jpg') or '.png'
        for old in os.listdir(kit):
            if old.startswith(NAMES[key] + '.'): os.remove(os.path.join(kit, old))
        dst = os.path.join(kit, NAMES[key] + ext); shutil.copy2(src, dst)
        log[key] = {'file': os.path.basename(dst), 'source': src, 'imported': time.strftime('%Y-%m-%d %H:%M')}
        print(f'{key:12s} {src} -> {dst}')
    json.dump(log, open(log_p, 'w'), indent=1)


if __name__ == '__main__':
    main()
