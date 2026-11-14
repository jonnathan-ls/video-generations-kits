import json, sys, math
from pathlib import Path
import numpy as np, soundfile as sf
ROOT=Path('/home/jonnathan/projects/obra-cortada'); P=ROOT/'kit/projects/brasil-15min'; SR=48000
T=900.0; N=int(T*SR)
voice,_=sf.read(P/'audio/voice-15min.wav',dtype='float32'); voice=voice[:N]
if voice.ndim>1: voice=voice.mean(1)
music,_=sf.read(P/'audio/music-15min.wav',dtype='float32'); music=music[:N]
if len(voice)<N: voice=np.pad(voice,(0,N-len(voice)))
if len(music)<N: music=np.pad(music,((0,N-len(music)),(0,0)))
music*=.42
sfx=np.zeros((N,2),dtype=np.float32)
SF=P/'hyperframes/assets/audio/sfx'
def load(name,trim=.0):
    x,sr=sf.read(SF/name,dtype='float32')
    if x.ndim>1: x=x.mean(1)
    if sr!=SR:
        t=np.arange(int(len(x)*SR/sr))/SR; x=np.interp(t,np.arange(len(x))/sr,x)
    if trim: x=x[int(trim*SR):]
    return x
def place(x,t,g=.25,pan=0):
    i=int(t*SR); a=max(0,-i); b=min(len(x),N-i)
    if b<=a: return
    l=math.cos((pan+1)*math.pi/4); r=math.sin((pan+1)*math.pi/4)
    sfx[i+a:i+b,0]+=x[a:b]*g*l; sfx[i+a:i+b,1]+=x[a:b]*g*r
def fade(x,a=.005,r=.08):
    n=len(x); na=max(1,int(a*SR)); nr=max(1,int(r*SR)); e=np.ones(n); e[:na]=np.linspace(0,1,na); e[-nr:]*=np.linspace(1,0,nr); return x*e
whoosh=load('whoosh.wav'); paper=load('bordo_papel.wav',1.0)[:int(.6*SR)]; thud=load('thud.wav'); impact=load('impact-bass-1.wav')[:int(.7*SR)]; chime=load('chime.wav'); tick=load('click-soft.wav')
tim=json.load(open(P/'timing.json'))
for s in tim['scenes']:
    t=s['start']+.02; tp=s['template']
    if tp=='chapter': place(fade(impact,.001,.2),t,.32,0)
    elif tp=='archive': place(fade(whoosh,.01,.1),t,.18,-.1); place(fade(paper,.01,.1),t+.05,.12,.1)
    elif tp=='document': place(fade(paper,.01,.1),t,.16,.05)
    elif tp=='data': place(tick,t,.18,0); place(fade(chime,.01,.3),t+.15,.10,.1)
    elif tp=='map': place(fade(whoosh,.01,.1),t,.15,0)
    elif tp=='timeline': place(tick,t,.15,-.1); place(tick,t+.25,.12,.1)
    elif tp=='montage': place(fade(impact,.001,.2),t,.25,0)
    elif tp=='sugar': place(fade(paper,.01,.1),t,.15,0)
    elif tp=='gold': place(fade(chime,.01,.3),t,.12,.1)
    elif tp=='cta': place(fade(chime,.01,.4),t,.20,0)
# room tone
air=np.random.default_rng(9).standard_normal(N).astype(np.float32)*.002
sfx[:,0]+=air; sfx[:,1]+=air
# duck under voice
k=int(.06*SR); env=np.convolve(np.abs(voice),np.ones(k)/k,mode='same'); env/=env.max()+1e-9
vc=np.convolve(np.clip(env*3.2,0,1),np.ones(int(.18*SR))/int(.18*SR),mode='same')
mg=.42; sg=.55
mix=voice[:,None]+music*(1-.55*vc)[:,None]+sfx*(1-.35*vc)[:,None]
# gentle fades
mix[:int(.4*SR)]*=np.linspace(0,1,int(.4*SR))[:,None]
mix[-int(1.2*SR):]*=np.cos(np.linspace(0,np.pi/2,int(1.2*SR)))[:,None]**2
peak=np.max(np.abs(mix))+1e-9; mix*=.94/peak
sf.write(P/'audio/mix-raw-15min.wav',mix,SR,subtype='PCM_16')
print('mix',mix.shape,'peak',float(np.max(np.abs(mix))))
# voice margin
V=np.abs(voice); B=np.abs(music*(1-.55*vc)[:,None]+sfx*(1-.35*vc)[:,None]).mean(1)
hop=int(.5*SR); rows=[]
for i in range(0,N-hop,hop):
    v=np.sqrt(np.mean(V[i:i+hop]**2)); b=np.sqrt(np.mean(B[i:i+hop]**2)); rows.append((v,b))
vmed=np.median([v for v,b in rows if v>1e-4]); sp=[20*np.log10(v/(b+1e-6)) for v,b in rows if v>.35*vmed]
print('voice margin median',round(float(np.median(sp)),1),'worst',round(float(np.min(sp)),1))
