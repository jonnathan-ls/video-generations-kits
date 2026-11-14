import sys, os, math, json
import numpy as np
import soundfile as sf
ROOT='/home/jonnathan/projects/obra-cortada'
sys.path.insert(0, ROOT+'/stick-film/audio')
import dsp
SR=dsp.SR
N=int(30.0*SR)
rng=np.random.default_rng(11)
def stereo(mono, pan=0.0):
    pan=float(np.clip(pan,-1,1)); l=math.cos((pan+1)*math.pi/4); r=math.sin((pan+1)*math.pi/4)
    return np.stack([mono*l, mono*r])
def place(bus, sig, t, gain=1.0, pan=0.0):
    i0=int(round(t*SR))
    if i0>=N: return
    a=max(0,-i0); b=min(len(sig), N-i0)
    if b<=a: return
    bus[:, i0+a:i0+b] += stereo(np.asarray(sig[a:b]),pan)*gain
def fade(sig, a=0.004, r=0.05):
    n=len(sig); na=max(1,int(a*SR)); nr=max(1,int(r*SR))
    e=np.ones(n); e[:na]=np.linspace(0,1,na); e[-nr:]*=np.linspace(1,0,nr); return sig*e
def load(path, trim=True):
    x,sr=sf.read(path)
    if x.ndim>1: x=x.mean(1)
    if sr!=SR:
        # linear resample
        t=np.arange(int(len(x)*SR/sr))/SR; x=np.interp(t,np.arange(len(x))/sr,x)
    if trim:
        idx=np.where(np.abs(x)>10**(-42/20)*max(1e-6,np.max(np.abs(x))))[0]
        if len(idx): x=x[max(0,idx[0]-int(.01*SR)):min(len(x),idx[-1]+int(.05*SR))]
    return x
SFX=ROOT+'/kit/projects/brasil-30s/hyperframes/assets/audio/sfx/'
def sfx(name): return load(SFX+name)

# ---------------- music ----------------
music=np.zeros((2,N))
def mplace(sig,t,gain=1,pan=0): place(music,sig,t,gain,pan)
def note(n): return dsp.hz(n)
def drone(freqs, t0, t1, vel=.15, lp=900):
    dur=t1-t0
    mplace(dsp.pad([note(f) for f in freqs], dur+1.2, vel, a=min(2.2,dur*.5), r=1.6, lp=lp), t0, 1.0, 0)
def chord(root, quality, t0, t1, vel=.16):
    third=4 if quality=='maj' else 3
    freqs=[root-12, root, root+third, root+7]
    drone(freqs, t0, t1, vel)
    mplace(dsp.bass(note(root-24), min(1.2,(t1-t0)*.5), .26), t0, 1.0, 0)
    # a second bass hit
    if t1-t0>3: mplace(dsp.bass(note(root-24), .8, .18), t0+(t1-t0)*.55, 1.0, 0)
def pluck_seq(notes, t0, t1, vel=.16, step=.5, pan=0.1):
    t=t0; i=0
    while t<t1-.1:
        mplace(dsp.pluck(note(notes[i%len(notes)]),1.15,vel,1.0), t, 1.0, pan if i%2 else -pan)
        t+=step; i+=1
def bell_at(t, n, vel=.22, pan=0.0):
    mplace(dsp.bell(note(n),2.4,vel), t, 1.0, pan)
def hit(t, g=.4, low=True):
    s=dsp.f_thud(g) if hasattr(dsp,'f_thud') else dsp.f_knock()
    mplace(s, t, 1.0, 0)

# sections
chord(50,'min',0,9.1,.17)      # Dm
chord(46,'maj',9.1,13.4,.17)   # Bb
chord(43,'min',13.4,18.55,.16) # Gm
chord(50,'min',18.55,22.1,.18) # Dm
chord(53,'maj',22.1,25.65,.19) # F
chord(50,'maj',25.65,30.0,.17) # D

# pulse / heartbeat
for t in np.arange(0,30,1.25):
    mplace(dsp.f_heartbeat()*.5, float(t), .28, 0)
# sparse plucks
pluck_seq([62,65,69,65,62,69],0.7,8.6,.13,.62)
pluck_seq([58,62,65,62,58,65],9.4,13.1,.12,.62)
pluck_seq([55,58,62,58,55,62],13.8,18.2,.12,.66)
pluck_seq([62,65,69,72,69,65],23.8,29.4,.14,.58)
# bells
for t,n in [(2.4,74),(5.6,69),(9.2,70),(13.5,74),(16.8,67),(22.15,77),(25.7,74),(27.7,81),(29.3,86)]:
    bell_at(t,n,.16 if t<22 else .2, .15)
# risers into lifts
mplace(dsp.riser(1.6,140,420,.10),20.4,1.0,0)
mplace(dsp.riser(1.4,160,520,.10),24.1,1.0,0)
# impact hits at section starts
for t in [0.05,5.33,9.1,13.4,18.55,22.1,25.65]:
    mplace(dsp.f_thud(.7),t,.55,0)
# air / texture
mplace(dsp.spec_filter(rng.standard_normal(N),120,2600)*.006,0,1.0,0)
music=dsp.reverb(music,.32,1.8)
# slow fade in/out
music*=np.linspace(0,1,int(.4*SR))[None,:int(.4*SR)] if False else 1
music[:, :int(.3*SR)]*=np.linspace(0,1,int(.3*SR))[None,:]
music[:, -int(1.0*SR):]*=np.cos(np.linspace(0,np.pi/2,int(1.0*SR)))[None,:]**2

# ---------------- sfx ----------------
fx=np.zeros((2,N))
def chain(t, g=.25):
    for k in range(5):
        s=dsp.f_clink(); place(fx,fade(s,.002,.08),t+k*.045,g*(1-k*.12),.1-.03*k)
def paper(t,g=.2,pan=-.1):
    s=load(SFX+'bordo_papel.wav'); s=fade(s,.01,.12)[:int(.5*SR)]; place(fx,s,t,g,pan)
def tick(t,g=.2,pan=0):
    s=np.sin(2*np.pi*2200*np.arange(int(.03*SR))/SR)*np.exp(-np.arange(int(.03*SR))/(.006*SR)); place(fx,s,t,g,pan)
def machine(t,g=.2):
    n=int(1.3*SR); i=np.arange(n); x=np.sin(2*np.pi*54*i/SR)*np.exp(-i/(.5*SR))*.5 + dsp.spec_filter(rng.standard_normal(n),200,1800)*.12
    place(fx,fade(x,.01,.2),t,g,-.2)
def city(t,g=.12):
    n=int(1.6*SR); x=dsp.spec_filter(rng.standard_normal(n),90,2400)*.25; place(fx,fade(x,.3,.4),t,g,0)

# cue sheet
paper(0.05,.10); tick(0.12,.25)
place(fx,fade(sfx('whoosh-short.wav'),.01,.1),1.18,.35,-.15)
place(fx,fade(sfx('thud.wav'),.001,.12),1.26,.55,0)
place(fx,fade(sfx('impact-bass-1.wav')[:int(.7*SR)],.001,.2),2.36,.42,0)
paper(5.24,.24,.15)
place(fx,fade(sfx('whoosh-cinematic.wav')[int(.4*SR):int(1.3*SR)],.01,.2),5.22,.22,.15)
place(fx,fade(dsp.f_creak(.55),.02,.15),6.18,.16,-.2)
chain(6.78,.22)
place(fx,fade(dsp.f_clink(),.001,.1),7.58,.3,.2)
place(fx,fade(sfx('impact-bass-2.wav')[:int(1.0*SR)],.001,.3),9.06,.5,0)
paper(11.85,.18,-.15); chain(12.05,.14)
place(fx,fade(sfx('impact-bass-1.wav')[:int(.8*SR)],.001,.25),13.36,.45,0)
place(fx,fade(dsp.f_scribble(.5,.12,3),.01,.1),14.05,.12,-.25)
tick(16.7,.18); paper(16.78,.15,.1)
machine(18.52,.18)
place(fx,fade(sfx('impact-bass-1.wav')[:int(.7*SR)],.001,.2),20.78,.38,0)
place(fx,fade(sfx('typing.wav'),.01,.08),21.0,.10,.2)
paper(22.06,.22,0)
place(fx,fade(sfx('chime.wav'),.01,.3),22.12,.30,.15)
city(23.5,.10)
place(fx,fade(sfx('whoosh-short.wav'),.01,.08),25.62,.22,0)
place(fx,fade(sfx('thud.wav'),.001,.1),25.68,.35,0)
place(fx,fade(sfx('chime.wav'),.01,.4),27.72,.28,.1)
fx=dsp.reverb(fx,.12,.8)

# ---------------- voice ----------------
voice,_=sf.read(ROOT+'/kit/projects/brasil-30s/hyperframes/assets/audio/voice.wav')
voice=voice[:N].astype(np.float64)
if len(voice)<N: voice=np.pad(voice,(0,N-len(voice)))
voice/= (np.max(np.abs(voice))+1e-9); voice*=.9

# duck
k=int(.06*SR); env=np.convolve(np.abs(voice),np.ones(k)/k,mode='same'); env/=env.max()+1e-9
vc=np.convolve(np.clip(env*3.2,0,1),np.ones(int(.16*SR))/int(.16*SR),mode='same')
music_g=.34; sfx_g=.55
mix=voice[None,:] + music*music_g*(1-.55*vc)[None,:] + fx*sfx_g*(1-.35*vc)[None,:]
# gentle high-pass on voice? no
fo=np.ones(N); nf=int(.5*SR); fo[-nf:]=np.cos(np.linspace(0,np.pi/2,nf))**2; fo[:int(.03*SR)]*=np.linspace(0,1,int(.03*SR))
mix*=fo
peak=np.max(np.abs(mix))+1e-9; mix*=.94/peak
out=ROOT+'/kit/projects/brasil-30s/audio'
os.makedirs(out,exist_ok=True)
sf.write(out+'/mix-raw.wav',mix.T.astype(np.float32),SR)
sf.write(out+'/music.wav',(music*music_g).T.astype(np.float32),SR)
sf.write(out+'/sfx.wav',(fx*sfx_g).T.astype(np.float32),SR)
sf.write(out+'/voice.wav',voice.astype(np.float32),SR)

# voice margin
V=np.abs(voice); B=(np.abs(music*music_g*(1-.55*vc))+np.abs(fx*sfx_g*(1-.35*vc)))
hop=int(.3*SR); rows=[]
for i in range(0,N-hop,hop):
    v=np.sqrt(np.mean(V[i:i+hop]**2)); b=np.sqrt(np.mean(B[i:i+hop]**2)); rows.append((i/SR,v,b))
vmed=np.median([r[1] for r in rows if r[1]>1e-4])
spoken=[(t,20*np.log10(v/(b+1e-6))) for t,v,b in rows if v>.35*vmed]
print('voice margin median %.1f dB worst %.1f dB'%(np.median([m for _,m in spoken]),min(m for _,m in spoken)))
print('wrote mix-raw.wav',len(mix)/SR)
