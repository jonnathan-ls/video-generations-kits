import sys, math
import numpy as np, soundfile as sf
ROOT='/home/jonnathan/projects/obra-cortada'
sys.path.insert(0,ROOT+'/stick-film/audio')
import dsp
SR=dsp.SR; T=900.0; N=int(T*SR)
rng=np.random.default_rng(21)
music=np.zeros((2,N),dtype=np.float32)
def stereo(x,pan=0.0):
    l=math.cos((pan+1)*math.pi/4); r=math.sin((pan+1)*math.pi/4); return np.stack([x*l,x*r])
def place(x,t,pan=0.0):
    i=int(t*SR)
    if i>=N: return
    a=max(0,-i); b=min(len(x),N-i)
    if b<=a: return
    music[:,i+a:i+b]+=stereo(np.asarray(x[a:b],dtype=np.float32),pan)
def note(n): return dsp.hz(n)
sections=[
 (0,110,[50,57,62],'min',.16),
 (110,220,[46,53,58],'maj',.16),
 (220,330,[43,50,55],'min',.16),
 (330,440,[50,57,62],'min',.17),
 (440,550,[46,53,58],'maj',.17),
 (550,660,[43,50,55],'min',.16),
 (660,770,[50,57,62],'min',.17),
 (770,860,[53,60,65],'maj',.18),
 (860,900,[50,57,62],'maj',.16),
]
for a,b,chord,qual,vel in sections:
    dur=b-a
    if dur<=0: continue
    # pad
    pad=dsp.pad([note(x) for x in chord],dur+1.0,vel,a=min(4,dur*.35),r=2.0,lp=1300 if qual=='min' else 1900)
    pad=dsp.reverb(np.stack([pad,pad]),.3,1.7)[0]
    place(pad,a,0)
    # bass
    place(dsp.bass(note(chord[0]-24),2.0,.28),a,.0)
    place(dsp.bass(note(chord[0]-24),1.6,.18),a+dur*.55,.0)
    # sparse plucks / bells
    t=a+2
    i=0
    while t<b-1:
        seq=[chord[0]+12,chord[1]+12,chord[2]+12,chord[1]+12]
        place(dsp.pluck(note(seq[i%4]),1.8,.13,1.0),t,.12 if i%2 else -.12)
        t+=2.4; i+=1
    place(dsp.bell(note(chord[2]+12),3.0,.16),a+.4,.1)
    place(dsp.f_thud(.7),a,0)
# low drone/air
air=dsp.spec_filter(rng.standard_normal(N),80,2200)*.004
music+=np.stack([air,air]).astype(np.float32)
# fade in/out
music[:, :int(1.5*SR)]*=np.linspace(0,1,int(1.5*SR))[None,:]
music[:, -int(3*SR):]*=np.cos(np.linspace(0,np.pi/2,int(3*SR)))[None,:]**2
# normalize
peak=np.max(np.abs(music))+1e-9; music*=.7/peak
sf.write(ROOT+'/kit/projects/brasil-15min/audio/music-15min.wav',music.T,SR,subtype='PCM_16')
print('music',music.shape,round(T,1),'peak',float(np.max(np.abs(music))))
