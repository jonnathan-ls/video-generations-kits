#!/usr/bin/env python3
"""Estimate a character's proportions and colors from its master sheet (the left-most figure, front view).

  python measure.py <characterDir> [--write] [--image kit/01-master.png] [--debug out.png]

Prints the estimates next to the current character.json values; --write saves them. These are starting numbers:
always confirm with the rig test sheet beside the stills (sf rigtest <slug>) and adjust by eye."""
import argparse, colorsys, json, os, sys
import numpy as np
from PIL import Image, ImageDraw


def runs(row):
    """[start, end) of consecutive True values"""
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))


def hexc(c): return '#%02x%02x%02x' % tuple(int(v) for v in c)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('char'); ap.add_argument('--write', action='store_true'); ap.add_argument('--image'); ap.add_argument('--debug'); a = ap.parse_args()
    d = os.path.abspath(a.char); spec = json.load(open(os.path.join(d, 'character.json')))
    img_p = a.image or next((os.path.join(d, 'kit', f) for f in sorted(os.listdir(os.path.join(d, 'kit'))) if f.startswith('01-master')), None)
    if not img_p: sys.exit('no kit/01-master.* yet')
    im = Image.open(img_p).convert('RGB'); A = np.asarray(im).astype(np.float32); h, w, _ = A.shape
    b = max(4, int(min(h, w) * 0.03)); border = np.concatenate([A[:b].reshape(-1, 3), A[-b:].reshape(-1, 3), A[:, :b].reshape(-1, 3), A[:, -b:].reshape(-1, 3)])
    paper = np.median(border, axis=0)
    lum = A @ np.array([0.299, 0.587, 0.114]); mx = A.max(axis=2); mn = A.min(axis=2); sat = (mx - mn) / (mx + 1e-3)
    dark = (lum < 0.45 * lum[np.abs(A - paper).sum(axis=2) < 30].mean()) & (sat < 0.45)
    ink = np.median(A[dark], axis=0) if dark.any() else np.array([5, 4, 3])
    colored = (sat > 0.35) & (mx > 90) & (np.abs(A - paper).sum(axis=2) > 90)
    accent = None
    if colored.sum() > 200:
        px = A[colored] / 255.0; hues = np.array([colorsys.rgb_to_hsv(*p)[0] for p in px[:: max(1, len(px) // 5000)]])
        hist, edges = np.histogram(hues, bins=24, range=(0, 1)); k = hist.argmax(); lo, hi = edges[k] - 0.03, edges[k + 1] + 0.03
        sel = px[:: max(1, len(px) // 5000)][(hues >= lo) & (hues <= hi)]; accent = np.median(sel, axis=0) * 255
    fig = dark | colored
    cols = fig.any(axis=0); groups = [r for r in runs(cols) if r[1] - r[0] > w * 0.03]
    if not groups: sys.exit('could not find the figure (is the background plain?)')
    # merge groups closer than 2% of the width (scarf tails etc.), then take the left-most figure
    merged = [list(groups[0])]
    for s, e in groups[1:]:
        if s - merged[-1][1] < w * 0.02: merged[-1][1] = e
        else: merged.append([s, e])
    x0, x1 = merged[0]; sub = dark[:, x0:x1]; subf = fig[:, x0:x1]
    rows = np.where(subf.any(axis=1))[0]; top, bot = rows[0], rows[-1]; Hpx = bot - top
    # head: widest dark extent near the top, before the width collapses to the neck
    widths = []
    for y in range(top, top + int(Hpx * 0.45)):
        r = np.where(sub[y])[0]; widths.append(r[-1] - r[0] if len(r) else 0)
    widths = np.array(widths); i_max = int(widths[: max(3, int(len(widths) * 0.8))].argmax()); head_d = widths[i_max]
    hr_row = np.where(sub[top + i_max])[0]; head_cx = (hr_row[0] + hr_row[-1]) / 2
    head_r = head_d / 2; neck_y = top + int(2 * head_r)
    # line weight: median horizontal run length in the legs (80-92% of the height)
    loose = (lum < 0.7 * lum[np.abs(A - paper).sum(axis=2) < 30].mean())[:, x0:x1]        # include anti-aliased edges
    lens = [e - s for y in range(top + int(Hpx * 0.78), top + int(Hpx * 0.90)) for s, e in runs(loose[y]) if 3 <= e - s < head_d * 0.3]
    line = float(np.median(lens)) if lens else Hpx * 0.02
    # pelvis: highest row (scanning up from the feet) where the middle of the figure still shows two separate legs
    cx = head_cx; pelvis = None
    for y in range(bot - int(Hpx * 0.1), neck_y, -1):
        mid = [(s, e) for s, e in runs(sub[y]) if abs((s + e) / 2 - cx) < (x1 - x0) * 0.22]
        if len(mid) >= 2: pelvis = y
        elif pelvis is not None and pelvis - y > Hpx * 0.02: break
    if pelvis is None: pelvis = top + int(Hpx * 0.6)
    # hands: lowest point of the outer (arm) runs above the pelvis band
    hand_y = None
    for y in range(max(neck_y, pelvis - int(Hpx * 0.1)), min(bot, pelvis + int(Hpx * 0.22))):
        outer = [(s, e) for s, e in runs(sub[y]) if abs((s + e) / 2 - cx) >= head_r * 0.9 and e - s >= 3]
        if outer: hand_y = y
    Hm = Hpx / 0.967                                        # rig height H vs drawn sole-to-head-top height
    est = {'head': head_r / Hm, 'line': line / Hm, 'torso': max(0.18, (pelvis - neck_y) / Hm), 'leg': (bot - pelvis) / Hm}
    arm = ((hand_y - neck_y) / Hm - 0.03) if hand_y else None
    body = dict(spec.get('body', {}))
    new = {'head': round(est['head'], 4), 'line': round(est['line'], 4), 'torso': round(est['torso'], 3),
           'thigh': round(est['leg'] * 0.5 * 0.94, 3), 'shin': round(est['leg'] * 0.5 * 0.94, 3)}
    if arm and 0.18 < arm < 0.5: new['upperArm'] = new['foreArm'] = round(arm / 2, 3)
    print(f'{os.path.basename(img_p)}: figure {Hpx}px tall at x {x0}-{x1}; head r {head_r:.0f}px, line {line:.1f}px, pelvis y {pelvis}, neck y {neck_y}')
    print(f'{"":12s}{"current":>10s}{"estimate":>10s}')
    for k, v in new.items(): print(f'{k:12s}{body.get(k, "-")!s:>10s}{v:>10}')
    pal = {'ink': hexc(ink), 'paper': hexc(paper)}
    if accent is not None: pal['accent'] = hexc(accent)
    print('palette  ', pal, '(current', spec.get('palette'), ')')
    if a.debug:
        dbg = im.copy(); g = ImageDraw.Draw(dbg)
        for y, c in ((top, 'red'), (neck_y, 'blue'), (pelvis, 'green'), (bot, 'red'), (hand_y or bot, 'orange')): g.line([(x0, y), (x1, y)], fill=c, width=3)
        g.ellipse([x0 + head_cx - head_r, top, x0 + head_cx + head_r, top + 2 * head_r], outline='magenta', width=3); dbg.save(a.debug); print('debug overlay:', a.debug)
    if a.write:
        body.update(new); spec['body'] = body; spec['palette'] = {**spec.get('palette', {}), **pal}
        spec['notes'] = f'Proportions measured from {os.path.basename(img_p)} by measure.py; check the rig test.'
        json.dump(spec, open(os.path.join(d, 'character.json'), 'w'), indent=2); print('saved', os.path.join(d, 'character.json'))


if __name__ == '__main__':
    main()
