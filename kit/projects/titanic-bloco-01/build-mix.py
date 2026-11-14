"""Deterministic local mix from project events; technical evidence, not auditory approval."""
from pathlib import Path
import json, math, subprocess
import numpy as np
import soundfile as sf
B=Path(__file__).resolve().parent
ROOT=B.parents[2]
p=json.loads((B/'project.json').read_text())
c=json.loads((ROOT/'kit/catalog/registry.json').read_text())
defs={a['id']:a for a in c['assets']}
voice,sr=sf.read(B/p['audio']['voice'],dtype='float64')
assert voice.ndim==1 and sr==24000
n=round(p['duration']*sr)
assert len(voice)==n
mix=voice.copy();fx=np.zeros(n);rows=[]
for event in p['audio']['events']:
    file=ROOT/'kit/audio/previews'/(defs[event['assetId']]['sound']+'.wav')
    a,rate=sf.read(file,dtype='float64')
    if rate!=sr:
        a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-f','f32le','-ac','1','-ar',str(sr),'-']),dtype='<f4').astype('float64')
    elif a.ndim==2:a=a.mean(axis=1)
    start=round(event['time']*sr);count=min(len(a),round(event['duration']*sr),n-start)
    a=a[:count].copy()*event['volume']
    # Boundaries are edited with short ramps; pre-laps are authored in project.json.
    fade=min(round(.018*sr),count//2)
    if fade:
        a[:fade]*=np.linspace(0,1,fade);a[-fade:]*=np.linspace(1,0,fade)
    fx[start:start+count]+=a
    rows.append(dict(asset=event['assetId'],time=event['time'],duration=count/sr,gain=event['volume'],peakDb=20*math.log10(max(1e-12,np.abs(a).max()))))
mix+=fx
out=B/'audio/mix-v10.wav'
sf.write(out,mix,sr,subtype='FLOAT')
e=B/'qa/evidence';e.mkdir(parents=True,exist_ok=True)
(e/'mix-build-v10.json').write_text(json.dumps(dict(method='Soma determinística mono 24 kHz em float; ganho por evento; rampas de 18 ms; sem limiter no stem. Normalização EBU R128 no MP4 posterior.',duration=n/sr,events=rows,peakDb=20*math.log10(np.abs(mix).max()),fxRmsDb=20*math.log10(np.sqrt(np.mean(fx*fx))),auditoryReview='not-verified'),indent=2,ensure_ascii=False)+'\n')
print(out)
