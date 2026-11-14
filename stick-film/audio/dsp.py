"""Sound building blocks, all synthesized with numpy (no samples, no licences to track):
filters, noise sweeps, envelopes, reverb, instruments (pluck, bell, bass, pad, riser) and a foley library.
Foley functions return mono float arrays at SR. FOLEY maps an event type to (function(event) -> signal, gain, pan)."""
import numpy as np

SR = 48000
_rng = np.random.default_rng(23)


def hz(m): return 440.0 * 2 ** ((m - 69) / 12.0)
def tt(n): return np.arange(n) / SR
def norm_peak(x, p=1.0): return x / (np.max(np.abs(x)) + 1e-9) * p


def add(*sigs):
    """sum signals of different lengths"""
    out = np.zeros(max(len(s) for s in sigs))
    for s in sigs: out[:len(s)] += s
    return out


def spec_filter(x, f_lo=None, f_hi=None, slope=4.0):
    """zero-phase FFT band filter with smooth skirts"""
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); H = np.ones_like(f)
    if f_lo: H *= 1.0 / (1.0 + (f_lo / np.maximum(f, 1e-3)) ** slope)
    if f_hi: H *= 1.0 / (1.0 + (np.maximum(f, 1e-3) / f_hi) ** slope)
    return np.fft.irfft(X * H, n)


def _fc_at(u, fc0, fc1, shape):
    if shape == 'arch': return fc0 * (fc1 / fc0) ** np.sin(np.pi * u)
    return fc0 * (fc1 / fc0) ** u


def sweep_noise(dur, fc0, fc1, q=1.2, shape=None, seed=0):
    """band-passed noise whose centre moves from fc0 to fc1 (or fc0 -> fc1 -> fc0 with shape='arch')"""
    n = int(dur * SR); x = np.random.default_rng(seed).standard_normal(n)
    blk = 2048; hop = blk // 2; win = np.hanning(blk); out = np.zeros(n + blk); ws = np.zeros(n + blk); f = np.fft.rfftfreq(blk, 1 / SR)
    for s in range(0, n, hop):
        fc = _fc_at(s / max(1, n), fc0, fc1, shape); seg = x[s:s + blk]
        if len(seg) < blk: seg = np.pad(seg, (0, blk - len(seg)))
        H = np.exp(-0.5 * (np.log2(np.maximum(f, 1.0) / fc) * q * 2.2) ** 2)
        out[s:s + blk] += np.fft.irfft(np.fft.rfft(seg * win) * H, blk) * win; ws[s:s + blk] += win ** 2
    return out[:n] / np.maximum(ws[:n], 1e-3)


def env_ar(n, a, r, curve=2.0):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** curve; e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e


# ---------------------------------------------------------------- instruments
def pluck(f, dur=1.2, vel=0.5, bright=1.0):
    n = int(dur * SR); t = tt(n)
    ratios = [1, 2, 3, 4.2, 5.4]; amps = [1.0, 0.42 * bright, 0.2 * bright, 0.11 * bright, 0.06 * bright]; taus = [0.55, 0.32, 0.2, 0.12, 0.08]
    x = sum(a * np.sin(2 * np.pi * f * r * t + 0.3 * i) * np.exp(-t / (tau * dur / 1.2)) for i, (r, a, tau) in enumerate(zip(ratios, amps, taus)))
    x = x + spec_filter(_rng.standard_normal(n), 1200, 5000) * np.exp(-t / 0.006) * 0.06
    return x * np.minimum(1, t / 0.003) * vel * 0.5


def bell(f, dur=2.2, vel=0.4):
    n = int(dur * SR); t = tt(n)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (tau * dur / 2.2)) for r, a, tau in zip([1, 2.0, 2.76, 5.4], [1, 0.5, 0.33, 0.14], [1.1, 0.8, 0.5, 0.25]))
    return x * np.minimum(1, t / 0.002) * vel * 0.35


def bass(f, dur=0.5, vel=0.6):
    n = int(dur * SR); t = tt(n)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.15)) * np.exp(-t / (dur * 0.5))
    return x * np.minimum(1, t / 0.004) * vel * 0.6


def pad(freqs, dur, vel=0.3, a=0.9, r=1.4, lp=1900):
    n = int(dur * SR); t = tt(n); x = np.zeros(n)
    for f in freqs:
        for det in (-6, 0, 6):
            ff = f * 2 ** (det / 1200.0)
            x += sum(np.sin(2 * np.pi * ff * k * t + k) / k ** 1.6 for k in (1, 2, 3, 4, 5)) / 3
    x = spec_filter(x, 60, lp)
    e = np.ones(n); na = min(n, int(a * SR)); nr = min(n, int(r * SR))
    e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2; e[-nr:] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** 2
    return x * e * vel / max(1, len(freqs)) ** 0.7


def riser(dur, f0, f1, vel=0.2, trem=6.0):
    n = int(dur * SR); t = tt(n); u = t / dur
    ph = 2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (u ** 1.5)) / SR
    x = (np.sin(ph) + 0.5 * np.sin(2.01 * ph) + 0.3 * np.sin(3.02 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * trem * t))
    return x * (u ** 1.5) * np.sin(np.pi * np.minimum(1, u * 1.02) * 0.5) * vel


def make_ir(rt60=1.3, seed=1):
    r = np.random.default_rng(seed); n = int(rt60 * SR * 1.1); t = tt(n)
    ir = r.standard_normal(n) * np.exp(-6.9 * t / rt60); ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return spec_filter(ir, 150, 7000)


def reverb(stereo, wet=0.2, rt60=1.3):
    out = np.zeros_like(stereo)
    for ch in range(2):
        ir = make_ir(rt60, 3 + ch); n = stereo.shape[1] + len(ir)
        out[ch] = np.fft.irfft(np.fft.rfft(stereo[ch], n) * np.fft.rfft(ir, n), n)[: stereo.shape[1]] / (np.max(np.abs(ir)) * 8)
    return stereo * (1 - wet * 0.5) + out * wet


# ---------------------------------------------------------------- foley
def f_whoosh(dur=1.0, seed=1):
    n = int(dur * SR); x = sweep_noise(dur, 280, 2400, 1.0, 'arch', seed)
    return norm_peak(x * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6, 0.55)

def f_snap():
    n = int(0.35 * SR); t = tt(n)
    c = spec_filter(_rng.standard_normal(n) * np.exp(-t / 0.004), 1500, None)
    tw = np.sin(2 * np.pi * (1100 + 400 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.05) * 0.35
    return norm_peak(c * 0.9 + tw + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.03) * 0.5, 0.8)

def f_thud(g=1.0, dur=0.3):
    n = int(dur * SR); t = tt(n); ph = 2 * np.pi * np.cumsum(48 + 100 * np.exp(-t / 0.035)) / SR
    return (np.sin(ph) * np.exp(-t / 0.09) + spec_filter(_rng.standard_normal(n), None, 600) * np.exp(-t / 0.04) * 0.6) * 0.8 * g

def f_step(g=0.5):
    n = int(0.16 * SR); t = tt(n); ph = 2 * np.pi * np.cumsum((62 + 55 * np.exp(-t / 0.03)) * (1 + _rng.uniform(-0.1, 0.1))) / SR
    return (np.sin(ph) * np.exp(-t / 0.055) * 0.5 + spec_filter(_rng.standard_normal(n), 200, 1800) * np.exp(-t / 0.028) * 0.35
            + spec_filter(_rng.standard_normal(n), 2500, 7000) * np.exp(-t / 0.008) * 0.12) * g

def f_scrape(dur=1.0, level=0.2, seed=3):
    n = int(dur * SR); x = sweep_noise(dur, 650, 1900, 0.8, None, seed); t = tt(n)
    am = 0.5 + 0.5 * np.clip(np.sin(2 * np.pi * 19 * t) + 0.6 * np.sin(2 * np.pi * 7.3 * t + 2), -1, 1) * 0.9
    return (x * am * 0.8 + spec_filter(_rng.standard_normal(n), 3500, 9000) * 0.25 * am) * env_ar(n, 0.06, 0.12) * level

def f_scribble(dur=0.6, level=0.12, seed=4):
    n = int(dur * SR); out = np.zeros(n); r = np.random.default_rng(seed); t = 0.0
    while t < dur - 0.06:
        L = r.uniform(0.07, 0.17); fc = r.uniform(2200, 4200)
        x = sweep_noise(L, fc, fc * r.uniform(0.8, 1.3), 1.4, None, int(r.integers(1, 10 ** 6))); e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 0.8
        i = int(t * SR); m = min(len(x), n - i)
        if m <= 0: break
        out[i:i + m] += (x * e * r.uniform(0.6, 1.0))[:m]; t += L * r.uniform(0.7, 1.3) + r.uniform(0.0, 0.05)
    return norm_peak(out, level)

def f_cloth(dur=0.28, level=0.14, seed=5):
    n = int(dur * SR); return norm_peak(sweep_noise(dur, 900, 2600, 0.8, 'arch', seed) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.2, level)

def f_knock():
    n = int(0.3 * SR); t = tt(n)
    return (np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.03) * 0.55 + np.sin(2 * np.pi * 690 * t) * np.exp(-t / 0.016) * 0.3
            + spec_filter(_rng.standard_normal(n), 1800, None) * np.exp(-t / 0.004) * 0.35)

def f_squeak():
    n = int(0.16 * SR); t = tt(n)
    return np.sin(2 * np.pi * np.cumsum(1500 + 800 * (t / 0.16)) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t)) * np.sin(np.pi * t / 0.16) * 0.10

def f_twang():
    n = int(0.6 * SR); t = tt(n); ph = 2 * np.pi * np.cumsum(170 + 360 * np.exp(-t / 0.09) + 8 * np.sin(2 * np.pi * 14 * t) * np.exp(-t / 0.2)) / SR
    return norm_peak((np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.exp(-t / 0.2) + spec_filter(_rng.standard_normal(n), 1500, None) * np.exp(-t / 0.006) * 0.4, 0.5)

def f_pop(big=True):
    n = int((0.5 if big else 0.25) * SR); t = tt(n); ph = 2 * np.pi * np.cumsum(140 + (700 if big else 1100) * np.exp(-t / 0.035)) / SR
    return norm_peak(np.sin(ph) * np.exp(-t / (0.09 if big else 0.05)) + spec_filter(_rng.standard_normal(n), 600, 6000) * np.exp(-t / 0.012) * 0.6, 0.7 if big else 0.35)

def f_creak(dur=0.8):
    n = int(dur * SR); t = tt(n); u = t / dur; ph = 2 * np.pi * np.cumsum(210 + 160 * u + 22 * np.sin(2 * np.pi * 5.5 * t)) / SR
    h = sum(np.sin(k * ph + k) / k ** 1.3 for k in range(1, 7)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * t)))
    return norm_peak(spec_filter(h, 150, 3000) * np.sin(np.pi * u) ** 0.7, 0.22)

def f_clink():
    t = tt(int(0.6 * SR))
    return (np.sin(2 * np.pi * 2350 * t) * np.exp(-t / 0.12) + 0.6 * np.sin(2 * np.pi * 3710 * t) * np.exp(-t / 0.07) + 0.3 * np.sin(2 * np.pi * 5200 * t) * np.exp(-t / 0.04)) * 0.12

def f_sip():
    n = int(0.45 * SR); t = tt(n)
    return norm_peak(sweep_noise(0.45, 900, 2600, 1.1, 'arch', 77) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)) * np.sin(np.pi * t / 0.45), 0.07)

def f_doorclose():
    return f_thud(0.7, 0.35) * 0.8 + np.pad(f_knock() * 0.5, (int(0.05 * SR), 0))[: int(0.35 * SR)]

def f_breath(dur=0.5):
    n = int(dur * SR); return norm_peak(sweep_noise(dur, 500, 1600, 0.7, None, 31) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5, 0.10)

def f_rumble(dur=2.0):
    n = int(dur * SR); t = tt(n)
    return norm_peak(spec_filter(_rng.standard_normal(n), 25, 140) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)), 0.25) * np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.6)

def f_ding():                                   # an idea landing
    return add(bell(hz(88), 1.8, 0.55), bell(hz(95), 1.4, 0.25) * 0.6)

def f_sparkle(dur=0.9):
    out = np.zeros(int(dur * SR)); r = np.random.default_rng(8)
    for k in range(7):
        i = int(k * dur / 8 * SR); b = bell(hz(int(r.choice([88, 91, 93, 95, 98, 100]))), 0.5, 0.18)
        out[i:i + len(b)] += b[: len(out) - i]
    return out

def f_boing():
    n = int(0.5 * SR); t = tt(n); ph = 2 * np.pi * np.cumsum(180 + 140 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.2) + 220 * t) / SR
    return np.sin(ph) * np.exp(-t / 0.18) * 0.35

def f_land():
    return f_thud(0.8, 0.28) + np.pad(f_cloth(0.2, 0.08, 9), (0, max(0, int(0.28 * SR) - int(0.2 * SR))))[: int(0.28 * SR)]

def f_paper(dur=0.4):
    n = int(dur * SR); return norm_peak(sweep_noise(dur, 1800, 4200, 0.6, 'arch', 13) * env_ar(n, 0.03, 0.15), 0.12)

def f_tick():
    t = tt(int(0.08 * SR)); return np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.008) * 0.25

def f_heartbeat():
    return f_thud(0.6, 0.25) * 0.7 + np.pad(f_thud(0.4, 0.2) * 0.5, (int(0.2 * SR), 0))[: int(0.25 * SR)]

def f_computer():
    """Original, understated keys and drive mechanism; no branded startup tone."""
    n = int(1.1 * SR); out = np.zeros(n)
    events = [(0.04, f_tick()), (0.22, f_pop(False)), (0.46, f_clink()), (0.70, f_scribble(0.24, 0.06, 31))]
    for start, signal in events:
        offset = int(start * SR); end = min(n, offset + len(signal))
        out[offset:end] += signal[:end-offset]
    return norm_peak(out, 0.36)


# event type -> (builder(event), gain, pan). Unknown types are reported by the mixer and skipped.
FOLEY = {
    'step': (lambda e: f_step(e.get('g', 0.5)), 0.75, 'rand'),
    'knock': (lambda e: f_knock(), 0.55, 0.15),
    'creak': (lambda e: f_creak(e.get('dur', 0.8)), 1.0, 0.2),
    'pop': (lambda e: f_pop(True), 0.6, 0.0),
    'popsmall': (lambda e: f_pop(False), 0.9, 0.0),
    'clink': (lambda e: f_clink(), 1.0, 0.1),
    'sip': (lambda e: f_sip(), 1.0, 0.0),
    'doorclose': (lambda e: f_doorclose(), 0.9, 0.2),
    'breath': (lambda e: f_breath(e.get('dur', 0.5)), 1.0, 0.0),
    'tremble': (lambda e: f_rumble(e.get('dur', 2.0)), 1.0, 0.0),
    'rumble': (lambda e: f_rumble(e.get('dur', 2.0)), 1.0, 0.0),
    'scribble': (lambda e: f_scribble(e.get('dur', 0.6), 0.12, int(e['t'] * 100)), 1.0, -0.1),
    'whoosh': (lambda e: f_whoosh(e.get('dur', 0.8), int(e['t'] * 10) % 7 + 1), 0.8, -0.1),
    'snap': (lambda e: f_snap(), 1.0, 0.0),
    'thud': (lambda e: f_thud(e.get('g', 1.0)), 0.9, 0.0),
    'land': (lambda e: f_land(), 0.9, 0.0),
    'scrape': (lambda e: f_scrape(e.get('dur', 1.0), 0.2, int(e['t'] * 10)), 1.0, 0.0),
    'cloth': (lambda e: f_cloth(e.get('dur', 0.28), 0.14, int(e['t'] * 10)), 1.0, 0.0),
    'squeak': (lambda e: f_squeak(), 1.0, 0.0),
    'twang': (lambda e: f_twang(), 0.85, 0.0),
    'ding': (lambda e: f_ding(), 0.8, 0.0),
    'sparkle': (lambda e: f_sparkle(e.get('dur', 0.9)), 0.7, 0.1),
    'boing': (lambda e: f_boing(), 0.8, 0.0),
    'paper': (lambda e: f_paper(e.get('dur', 0.4)), 1.0, 0.0),
    'tick': (lambda e: f_tick(), 1.0, 0.0),
    'heartbeat': (lambda e: f_heartbeat(), 1.0, 0.0),
    'computer': (lambda e: f_computer(), 0.72, 0.0),
}
