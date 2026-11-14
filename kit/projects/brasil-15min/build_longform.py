import json, re, html, sys, os, math
from pathlib import Path
ROOT=Path('/home/jonnathan/projects/obra-cortada')
PROJ=ROOT/'kit/projects/brasil-15min'
OUT=PROJ/'hyperframes'
ASSETS=OUT/'assets'
TARGET=900.0
sys.path.insert(0,str(ROOT/'stick-film/audio'))
import numpy as np
import soundfile as sf

def load_json(p): return json.loads(Path(p).read_text())
segments=load_json(PROJ/'segments.json')
chapters=load_json(PROJ/'chapters.json')['chapters']
takes_json=Path(os.environ.get('TAKES_JSON',PROJ/'audio/takes-090.json')); takes=load_json(takes_json)['takes']
# takes are in segments order
assert len(takes)==len(segments), (len(takes),len(segments))
takes=sorted(takes,key=lambda t:t['paragraph'])
takes_dir=Path(os.environ.get('TAKES_DIR',PROJ/'audio/takes-090'))
texts=[t['text'] for t in takes]
words=lambda s: len(re.findall(r'\S+',s))

# pauses by kind
def pauses(i,s):
    kind=s['kind']
    before={'hook':0.4,'title':1.2,'chapter-title':1.6,'scene':0.0,'cta':2.0}.get(kind,0.6)
    after={'hook':1.2,'title':2.6,'chapter-title':2.2,'scene':1.5,'cta':2.4}.get(kind,1.0)
    return before,after
# First pass
base_total=sum(t['duration'] for t in takes)
total=0.4
for i,s in enumerate(segments):
    b,a=pauses(i,s); total+=b+takes[i]['duration']+a
# distribute deficit into chapter-title holds, max 9s each; remainder into CTA
deficit=TARGET-total
extra_card=0.0
if deficit>0:
    extra_card=min(9.0,deficit/9.0)
    deficit-=extra_card*9.0
elif deficit<0:
    # reduce scene pauses (min 0.8) and card holds
    cut=-deficit
    per=min(0.7,cut/45.0)
    for s in segments:
        if s['kind']=='scene': s['_cut']=per
    deficit=0
# Build final timeline and audio
sr=48000
buf=[]; cursor=0.0; seg_times=[]
def silence(sec): return np.zeros(int(round(sec*sr)),dtype=np.float32)
buf.append(silence(0.4)); cursor=0.4
for i,s in enumerate(segments):
    b,a=pauses(i,s)
    if s['kind']=='chapter-title': a+=extra_card
    if s['kind']=='scene': a=max(0.8,a-s.get('_cut',0))
    if i==len(segments)-1:
        a+=max(0.0,TARGET-(cursor+a+takes[i]['duration'])-0.0)
    buf.append(silence(b)); cursor+=b
    x,rate=sf.read(takes_dir/f"pm_santa-p{i+1}.wav")
    if x.ndim>1: x=x.mean(1)
    if rate!=sr:
        t=np.arange(int(len(x)*sr/rate))/sr; x=np.interp(t,np.arange(len(x))/rate,x)
    x=x.astype(np.float32)
    start=cursor
    buf.append(x); cursor+=len(x)/sr
    end=cursor
    buf.append(silence(a)); cursor+=a
    seg_times.append({'i':i,'id':s['id'],'kind':s['kind'],'chapter':s.get('chapter'),'scene':s.get('scene'),
                      'text':s['text'],'start':round(start,4),'end':round(end,4),'duration':round(end-start,4),
                      'after':round(a,4)})
audio=np.concatenate(buf)
# Trim/pad to target
n=int(round(TARGET*sr))
if len(audio)<n: audio=np.pad(audio,(0,n-len(audio)))
else: audio=audio[:n]
sf.write(PROJ/'audio/voice-15min.wav',audio,sr,subtype='PCM_16')
print('voice total',round(len(audio)/sr,2),'target',TARGET,'extra card',round(extra_card,2))
print('segments',len(seg_times),'last',seg_times[-1]['end'])

# ---------------- scenes ----------------
scenes=[]
def add_scene(sid,template,start,dur,data=None):
    scenes.append({'id':sid,'template':template,'start':round(start,4),'duration':round(dur,4),**(data or {})})
# intro: hook split 2 + title
si=[s for s in seg_times if s['kind']=='hook']
add_scene('s01','data',si[0]['start'],si[0]['duration']+si[0]['after'],{'stat':'55,5%','label':'pretos e pardos','sub':'Censo 2022','source':'IBGE · diversidade e desigualdade','kicker':'Prólogo'})
add_scene('s02','data',si[1]['start'],si[1]['duration']+si[1]['after'],{'stat':'61,4%','label':'a mais no rendimento por hora','sub':'brancos em relação a pretos e pardos','source':'IBGE 2022','kicker':'A pergunta'})
title_seg=[s for s in seg_times if s['kind']=='title'][0]
add_scene('s03','chapter',title_seg['start'],title_seg['duration']+title_seg['after'],{'number':0,'title':'As camadas do Brasil','kicker':'Prólogo','date':'1500—2026','bg':'desk','note':'Uma história feita de camadas.','map':'full'})
# chapters
for ch in chapters:
    n=ch['number']; cid=ch['id']
    tseg=[s for s in seg_times if s['kind']=='chapter-title' and s.get('chapter')==n][0]
    add_scene(f'{cid}-card','chapter',tseg['start'],tseg['duration']+tseg['after'],
              {'number':n,'title':ch['title'],'kicker':ch['kicker'],'date':ch['date'],'bg':ch['bg'],'map':'full'})
    ssegs=[s for s in seg_times if s['kind']=='scene' and s.get('chapter')==n]
    for k,sc in enumerate(ch['scenes']):
        seg=ssegs[k]
        add_scene(f'{cid}-s{k+1}',sc['template'],seg['start'],seg['duration']+seg['after'],{**sc,'chapter':n})
cta=[s for s in seg_times if s['kind']=='cta'][0]
add_scene('outro','cta',cta['start'],cta['duration']+cta['after'],{'kicker':'As camadas do Brasil','title':'O próximo mapa começa aqui','stat':'inscreva-se'})
# make scenes contiguous: each ends where the next starts
for i in range(len(scenes)-1):
    scenes[i]['duration']=round(scenes[i+1]['start']-scenes[i]['start'],4)
scenes[-1]['duration']=round(TARGET-scenes[-1]['start'],4)
# transitions at intro title and chapter cards
trans=[]
for i,s in enumerate(scenes):
    if s['template']=='chapter' and s['start']>0.1:
        trans.append({'id':f'tr{len(trans)+1:02d}','start':round(max(0,s['start']-0.1),3),'duration':0.3})
print('scenes',len(scenes),'trans',len(trans))

# ---------------- captions ----------------
def chunks(text,maxw=11):
    parts=[p.strip() for p in re.split(r'(?<=[.!?;:])\s+',text.strip()) if p.strip()]
    out=[]
    for p in parts:
        ws=p.split()
        if len(ws)<=maxw: out.append(p); continue
        # split at commas or half
        sub=[q.strip() for q in re.split(r'(?<=[,;])\s+',p) if q.strip()]
        cur=[]
        for q in sub:
            if len(' '.join(cur+[q]).split())>maxw and cur:
                out.append(' '.join(cur)); cur=[q]
            else: cur.append(q)
        if cur: out.append(' '.join(cur))
    return out
caps=[]
for st in seg_times:
    ch=chunks(st['text'])
    if not ch: continue
    wc=[words(c) for c in ch]; totalw=sum(wc) or 1
    t=st['start']; span=st['duration']
    for c,w in zip(ch,wc):
        d=span*w/totalw
        caps.append({'id':f'c{len(caps)+1:03d}','start':round(t,3),'end':round(t+d,3),'text':c})
        t+=d
print('captions',len(caps))

# ---------------- html templates ----------------
def esc(s): return html.escape(s or '')
def scene_open(s):
    alias={'chapter':'ch','archive':'arch','document':'doc','timeline':'tl'}
    cls=alias.get(s['template'],s['template'])+'-scene'
    return f'<section class="scene clip {cls}" id="{s["id"]}" data-start="{s["start"]:.3f}" data-duration="{s["duration"]:.3f}" data-track-index="1" data-layout-allow-overflow><div class="world" id="w-{s["id"]}">'
def scene_close(): return '</div></section>'
def map_svg(mode,cls='map',style=''):
    return f'<svg class="{cls}" data-map="{mode}" viewBox="0 0 1000 1000" style="{style}"></svg>'
def chapter_html(s):
    num=s.get('number',0)
    no=f'{num:02d}' if num else '00'
    return scene_open(s)+f'''
<div class="ch-bg" style="background-image:url(assets/tex/{esc(s.get('bg','night'))}.jpg)"></div>
<div class="ch-map">{map_svg(s.get('map','full'))}</div>
<div class="ch-no">{no}</div>
<div class="ch-progress">{'PRÓLOGO' if num==0 else f'{num:02d} / 09'}</div>
<div class="ch-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}.</h2><div class="rule ch-rule"></div><div class="ch-date">{esc(s.get('date',''))}</div></div>
{f'<div class="ch-note">{esc(s.get("note",""))}</div>' if s.get('note') else ''}
<div class="vignette-local"></div>'''+scene_close()
CREDITS={'cabral.jpg':'Oscar Pereira da Silva · 1900 · domínio público','independencia.jpg':'Pedro Américo · 1888 · domínio público','lei-aurea.jpg':'Lei Áurea · 1888 · domínio público','republica.jpg':'Benedito Calixto · 1893 · domínio público','vargas.jpg':'Arquivo Nacional · 1930 · domínio público','brasilia-1959.jpg':'Agência Nacional · 1959 · domínio público','diretas.jpg':'Diretas Já · 1984 · domínio público'}
def archive_html(s):
    img=s.get('image','independencia.jpg')
    return scene_open(s)+f'''
<div class="arch-bg" style="background-image:url(assets/arch/{esc(img)})"></div>
<div class="shade"></div>
<div class="arch-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}</h2></div>
<div class="stamp light">{esc(s.get('stamp',''))}</div>
<div class="arch-source">{esc(CREDITS.get(img,''))}</div>
<div class="arch-note">{esc(s.get('note',''))}</div>
<div class="vignette-local"></div>'''+scene_close()
def map_html(s):
    mode=s.get('map','full')
    return scene_open(s)+f'''
<div class="bg {'night' if mode in ('today','coronelismo','atlantic','rio') else 'desk'}"></div>
<div class="map-wrap">{map_svg(mode)}</div>
<div class="map-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}</h2><div class="map-stat"><b>{esc(s.get('stat',''))}</b></div></div>
<div class="map-panel">{esc(s.get('panel',''))}</div>
<div class="vignette-local"></div>'''+scene_close()
def data_html(s):
    stat=s.get('stat',''); small=' small' if len(stat)>7 else ''
    return scene_open(s)+f'''
<div class="bg night"></div><div class="bg" style="background:radial-gradient(ellipse at 55% 45%,rgba(48,110,110,.18),rgba(0,0,0,0) 60%)"></div>
<div class="data-wrap"><span class="kicker">{esc(s.get('kicker',''))}</span><div class="data-no{small}">{esc(stat)}</div><div class="data-label">{esc(s.get('label',s.get('title','')))}</div><div class="data-sub">{esc(s.get('sub',''))}</div><div class="data-source">{esc(s.get('source',''))}</div></div>
<div class="vignette-local"></div>'''+scene_close()
def doc_html(s):
    img=s.get('image'); extra=''
    if img:
        extra=f'<div class="doc-img"><img src="assets/arch/{esc(img)}" alt=""></div>'
    elif s.get('template')=='document' and s.get('stamp')=='silêncio':
        extra=f'<div class="doc-fake"><h3>{esc(s.get("title",""))}</h3><p>{esc(s.get("note",""))}</p><div class="lines"></div><div style="position:absolute;left:30px;right:30px;top:240px;height:110px;background:#0a0c0d"></div><div style="position:absolute;left:30px;right:90px;top:380px;height:24px;background:#0a0c0d"></div><div style="position:absolute;left:30px;right:150px;top:420px;height:18px;background:#0a0c0d"></div></div>'
    elif s.get('stamp')=='sem terra':
        extra='''<div class="doc-fake"><h3>Lotes disponíveis</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px">
        <div style="height:120px;border:1px solid #6a4f2c;display:grid;place-items:center;font:600 16px Inter;color:#6a4f2c">LOTE 01</div>
        <div style="height:120px;border:1px solid #6a4f2c;display:grid;place-items:center;font:600 16px Inter;color:#6a4f2c">LOTE 02</div>
        <div style="height:120px;border:1px solid #6a4f2c;display:grid;place-items:center;font:600 16px Inter;color:#6a4f2c">LOTE 03</div>
        <div style="height:120px;border:1px solid #6a4f2c;display:grid;place-items:center;font:600 16px Inter;color:#6a4f2c">LOTE 04</div></div><p style="margin-top:24px">Sem indenização. Sem distribuição. Sem integração.</p></div>'''
    else:
        extra=f'<div class="doc-fake"><h3>{esc(s.get("title",""))}</h3><p>{esc(s.get("note",""))}</p><div class="lines"></div><div class="stamp" style="position:absolute;right:36px;bottom:36px;font-size:22px">{esc(s.get("stamp",""))}</div></div>'
    return scene_open(s)+f'''
<div class="bg desk"></div>
<div class="sheet doc-sheet"></div>
<div class="doc-copy"><span class="kicker ink">{esc(s.get('kicker',''))}</span><h2>{esc(s.get('title',''))}</h2></div>
{extra}
<div class="vignette-local"></div>'''+scene_close()
def stack_html(s):
    labels=['2026','1988','1964','1960','1930','1889','1888','1822','1500']
    layers=''.join(f'<div class="layer" style="top:{i*76}px;left:{(i%3)*8}px"><span>{lab}</span></div>' for i,lab in enumerate(labels))
    return scene_open(s)+f'''
<div class="bg desk"></div>
<div class="stack-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}</h2><div class="rule" style="width:420px;margin-top:22px"></div><div class="mono" style="margin-top:20px;font-size:14px;letter-spacing:.18em;color:#c2a878">{esc(s.get('stat',''))}</div></div>
<div class="base"></div><div class="stack">{layers}</div>
<div class="stamp light" style="position:absolute;left:150px;bottom:150px">{esc(s.get('stat','camadas'))}</div>
<div class="vignette-local"></div>'''+scene_close()
def sugar_html(s):
    rows=''.join(f'<div class="cane-row" style="left:{i*26}px;bottom:54px;height:{170+(i*47)%100}px"></div>' for i in range(26))
    return scene_open(s)+f'''
<div class="bg desk"></div>
<div class="sheet sugar-sheet"></div>
<div class="sugar-copy"><span class="kicker ink">{esc(s.get('kicker',''))}</span><h2 class="display copy-ink">{esc(s.get('title',''))}</h2><div class="rule" style="width:360px;margin-top:18px"></div></div>
<div class="sugar-art">{rows}<div class="sugar-sun"></div><div class="mill"><div class="wheel"></div><div class="mill-house"></div><div class="mill-roof"></div></div><div class="loaf"></div><div class="smoke" style="left:320px;bottom:260px"></div><div class="smoke" style="left:380px;bottom:330px;width:140px;height:140px;opacity:.7"></div>{map_svg('mini','map','left:690px;top:300px;width:280px;height:280px;opacity:.55')}</div>
<div class="vignette-local"></div>'''+scene_close()
def gold_html(s):
    return scene_open(s)+f'''
<div class="bg night"></div>
<svg class="mountain" viewBox="0 0 1920 760" preserveAspectRatio="none"><path d="M0 760 L0 520 L190 460 L340 510 L520 380 L700 450 L860 330 L1040 420 L1210 350 L1400 470 L1600 400 L1760 480 L1920 430 L1920 760 Z" fill="#0d1517"/><g stroke="#f0c979" stroke-width="3" fill="none" opacity=".95"><path d="M300 610 L380 560 L430 590 L520 520 L610 560 L690 500"/><path d="M760 640 L840 590 L900 620 L980 550 L1060 590 L1140 530"/></g></svg>
<div class="gold-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}</h2><div class="map-stat" style="margin-top:24px">{esc(s.get('stat',''))}</div></div>
{map_svg('gold','map gold-map')}
<svg class="gold-church" viewBox="0 0 260 330"><use href="#i-church"/></svg>
<div class="stamp light">ouro</div>
<div class="vignette-local"></div>'''+scene_close()
def timeline_html(s):
    items=s.get('items',['1700','1750','1763','1777','1789'])
    n=len(items)
    els=''
    for i,it in enumerate(items):
        pos=6+i*(88/(max(1,n-1)))
        els+=f'<div class="tl-item" style="left:{pos}%"><b>{esc(it)}</b><span>{"marco" if i==0 else ""}</span><div class="tl-dot"></div></div>'
    return scene_open(s)+f'''
<div class="bg night"></div><div class="bg" style="background:radial-gradient(ellipse at 50% 55%,rgba(51,120,118,.16),rgba(0,0,0,0) 60%)"></div>
<div class="tl-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}</h2></div>
<div class="tl"><div class="tl-line"></div>{els}</div>
<div class="vignette-local"></div>'''+scene_close()
def montage_html(s):
    imgs=s.get('images',['diretas.jpg'])
    figs=''
    for i,img in enumerate(imgs):
        figs+=f'<figure style="left:{i*60}px;top:{i*40}px;width:640px;height:430px"><img src="assets/arch/{esc(img)}" alt=""><div class="cap">{esc(CREDITS.get(img,''))}</div></figure>'
    return scene_open(s)+f'''
<div class="bg night"></div><div class="bg" style="background:radial-gradient(ellipse at 55% 45%,rgba(200,80,50,.16),rgba(0,0,0,0) 60%)"></div>
<div class="montage-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}</h2><div class="map-stat" style="margin-top:24px">{esc(s.get('stat',''))}</div></div>
<div class="montage">{figs}</div><div class="stamp light" style="position:absolute;left:1450px;top:180px">1984</div>
<div class="vignette-local"></div>'''+scene_close()
def cta_html(s):
    labels=['2026','1988','1964','1960','1930','1889','1888','1822','1500']
    layers=''.join(f'<div class="layer" style="top:{i*70}px;left:{(i%3)*6}px"><span>{lab}</span></div>' for i,lab in enumerate(labels))
    return scene_open(s)+f'''
<div class="bg desk"></div><div class="lamp" style="left:-180px;top:-260px;width:1300px;height:1050px"></div>
<div class="cta-copy"><span class="kicker">{esc(s.get('kicker',''))}</span><h2 class="display">{esc(s.get('title',''))}</h2><div class="rule" style="width:460px;margin-top:22px"></div></div>
<div class="stack" style="position:absolute;right:180px;top:150px;width:860px;height:660px;opacity:.95">{layers}</div>
<div class="cta-mark"><div class="play"><svg width="38" height="38" viewBox="0 0 120 120"><use href="#i-play"/></svg></div><div><b>INSCREVA-SE</b><span>E DEIXE SEU LIKE</span></div></div>
<div class="cta-seal"><svg viewBox="0 0 250 250"><circle cx="125" cy="125" r="112" fill="none" stroke="#d9b473" stroke-width="2" stroke-dasharray="3 7"/><circle cx="125" cy="125" r="86" fill="rgba(20,16,10,.35)" stroke="#d9b473" stroke-width="1.5"/><text x="125" y="116" text-anchor="middle" font-family="Oswald" font-size="30" fill="#f0c979" letter-spacing="2">CAMADAS</text><text x="125" y="148" text-anchor="middle" font-family="Inter" font-size="11" fill="#c2a878" letter-spacing="4">DO BRASIL</text><path d="M100 166 L125 184 L150 166" fill="none" stroke="#d9b473" stroke-width="2"/></svg></div>
<div class="vignette-local"></div>'''+scene_close()
templates={'chapter':chapter_html,'archive':archive_html,'map':map_html,'data':data_html,'document':doc_html,'stack':stack_html,'sugar':sugar_html,'gold':gold_html,'timeline':timeline_html,'montage':montage_html,'cta':cta_html}
body='\n'.join(templates[s['template']](s) for s in scenes)
# captions html
cap_html=[]
for c in caps:
    text=esc(c['text'])
    text=re.sub(r'\b(1500|1822|1888|1889|1930|1960|1964|1988|2022|55,5%|61,4%|203 milhões|4,8 milhões)\b',r'<em>\1</em>',text)
    cap_html.append(f'<div class="cap clip" id="{c["id"]}" data-start="{c["start"]:.3f}" data-duration="{max(.2,c["end"]-c["start"]):.3f}"><div class="cap-inner"><div class="cap-text">{text}</div></div></div>')
trans_html='\n'.join(f'<div id="{t["id"]}" class="trans clip" data-start="{t["start"]:.3f}" data-duration="{t["duration"]:.3f}" data-track-index="12"><div class="ti whip"></div></div>' for t in trans)
sprite='''<svg width="0" height="0" style="position:absolute"><defs>
<symbol id="i-church" viewBox="0 0 260 330"><g fill="#0a1416"><rect x="30" y="130" width="200" height="200"/><rect x="20" y="80" width="70" height="250"/><rect x="170" y="80" width="70" height="250"/><path d="M20 80 L55 34 L90 80 Z"/><path d="M170 80 L205 34 L240 80 Z"/><path d="M92 130 Q130 70 168 130 L168 150 L92 150 Z"/><rect x="112" y="150" width="36" height="180"/></g><g fill="#e6bd76" opacity=".55"><rect x="38" y="120" width="20" height="28"/><rect x="202" y="120" width="20" height="28"/><path d="M100 160 Q130 110 160 160 L160 176 L100 176 Z"/><rect x="118" y="200" width="24" height="110"/></g><path d="M128 34 L128 12 M118 22 L138 22" stroke="#e6bd76" stroke-width="4"/></symbol>
<symbol id="i-play" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="5"/><path d="M48 36 L86 60 L48 84 Z" fill="currentColor"/></symbol>
</defs></svg>'''
reg='<script>window.__timelines=window.__timelines||{};window.__timelines["main"]=gsap.timeline({paused:true});</script>'
head=f'''<!doctype html><html lang="pt-BR" data-resolution="landscape"><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080"><title>As camadas do Brasil — 15 min</title>
<link rel="stylesheet" href="assets/style.css"><script src="assets/gsap.min.js"></script>{reg}</head><body>{sprite}
<div id="root" data-composition-id="main" data-start="0" data-duration="{TARGET:.0f}" data-width="1920" data-height="1080" data-layout-allow-overflow>'''
tail=f'''<div id="captions" class="clip" data-start="0" data-duration="{TARGET:.0f}" data-track-index="8" data-track-kind="captions">{''.join(cap_html)}</div>
{trans_html}<div id="scrim"></div><div id="grade"></div><div id="grain"></div></div>
<script>window.TOTAL={TARGET:.0f};</script><script src="assets/map.js"></script><script src="assets/data.js"></script><script src="assets/map-render.js"></script><script src="assets/app.js"></script></body></html>'''
OUT.joinpath('index.html').write_text(head+body+tail)
# data js
data={'SCENES':scenes,'CAPTIONS':caps,'TRANSITIONS':trans,'TOTAL':TARGET}
ASSETS.joinpath('data.js').write_text('window.SCENES='+json.dumps(scenes,ensure_ascii=False,separators=(',',':'))+';\nwindow.CAPTIONS='+json.dumps(caps,ensure_ascii=False,separators=(',',':'))+';\nwindow.TRANSITIONS='+json.dumps(trans,ensure_ascii=False,separators=(',',':'))+';\nwindow.TOTAL='+str(TARGET)+';\n')
json.dump({'scenes':scenes,'captions':caps,'transitions':trans,'segments':seg_times,'voiceDuration':round(len(audio)/sr,3)},open(PROJ/'timing.json','w'),ensure_ascii=False,indent=2)
print('wrote index.html',len(head+body+tail),'scenes',len(scenes),'caps',len(caps))
