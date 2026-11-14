#!/usr/bin/env python3
"""Reuse the original stick-film foley synthesis without copying its engine."""
import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'stick-film/audio'))
import dsp
import wave
import numpy as np
out=ROOT/'kit/audio/previews';out.mkdir(parents=True,exist_ok=True)
names=['thud','whoosh','clink','knock','creak','computer']
for name in names:
    fn,gain,_=dsp.FOLEY[name]
    duration=.8 if name=='creak' else 1.1 if name=='computer' else .45
    audio=fn({'t':0,'dur':duration})*gain*.65
    with wave.open(str(out/f'{name}.wav'),'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(dsp.SR)
        f.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())
print(json.dumps({'files':len(names),'sampleRate':dsp.SR}))
