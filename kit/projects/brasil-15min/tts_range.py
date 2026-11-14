import sys, os, json, re
from pathlib import Path
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
ROOT=Path('/home/jonnathan/projects/obra-cortada'); PROJ=ROOT/'kit/projects/brasil-15min'
start,end=int(sys.argv[1]),int(sys.argv[2]); out=Path(sys.argv[3])
out.mkdir(parents=True,exist_ok=True)
segments=json.load(open(PROJ/'segments.json'))
model=Kokoro(str(ROOT/'kit/projects/brasil-camadas/preview/kokoro/kokoro-v1.0.onnx'),str(ROOT/'kit/projects/brasil-camadas/preview/kokoro/voices-v1.0.bin'))
def trim(a,sr):
    thr=np.max(np.abs(a))*10**(-42/20); idx=np.flatnonzero(np.abs(a)>thr)
    return a[max(0,idx[0]-int(.02*sr)):min(len(a),idx[-1]+int(.06*sr))] if len(idx) else a
for i in range(start-1,end):
    s=segments[i]
    audio,rate=model.create(s['text'],voice='pm_santa',speed=.90,lang='pt-br')
    audio=trim(audio.astype(np.float32),rate)
    sf.write(out/f'pm_santa-p{i+1}.wav',audio,rate)
    print(i+1,round(len(audio)/rate,2),flush=True)
