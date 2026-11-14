#!/usr/bin/env python3
"""Archive public artifact resources, extract templates and build a local-only copy."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, re, subprocess
ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifact'
RAW = ART / 'raw'
ASSETS = ART / 'resources'
BASE = 'https://claude.ai/artifact/V2ZdmTZ3o6MUYG7ffBVWkw'
FRAME = 'https://e2f7bcd3-e8bf-4feb-8b6e-d4fdaab37948.frame.claudeusercontent.com/_f/1793193416-6b6f/?__frame_v=manifest.6c622472cd97cf4a.json'
class Tags(HTMLParser):
 def __init__(self): super().__init__(); self.resources=[]; self.blocks=[]; self.tag=None; self.buf=[]
 def handle_starttag(self, tag, attrs):
  a=dict(attrs)
  if tag=='script' and a.get('src'): self.resources.append(a['src'])
  if tag=='link' and a.get('rel') in ('stylesheet','preload','modulepreload'): self.resources.append(a['href'])
  if tag in ('img','source') and a.get('src'): self.resources.append(a['src'])
  if tag in ('script','style'): self.tag=tag; self.buf=[]
 def handle_data(self,data):
  if self.tag: self.buf.append(data)
 def handle_endtag(self,tag):
  if self.tag==tag: self.blocks.append((tag,''.join(self.buf))); self.tag=None

def fetch(url):
 parsed=urlsplit(url); suffix=Path(parsed.path).suffix or '.bin'
 name=hashlib.sha256(url.encode()).hexdigest()[:12]+'-'+(Path(parsed.path).name or 'index')
 if not Path(name).suffix: name+=suffix
 dest=ASSETS/name
 p=subprocess.run(['curl','-sS','-L','--fail','--max-time','45','-o',str(dest),url],capture_output=True,text=True)
 if p.returncode: return {'url':url,'error':p.stderr.strip()}
 data=dest.read_bytes()
 return {'url':url,'path':str(dest.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def main():
 ASSETS.mkdir(exist_ok=True,parents=True)
 shell=Tags(); shell.feed((RAW/'page.html').read_text())
 doc=(RAW/'content.html').read_text(); page=Tags(); page.feed(doc)
 for i,(tag,code) in enumerate(page.blocks,1): (RAW/f'inline-{i:02d}.{ "js" if tag=="script" else "css"}').write_text(code)
 source=next(code for tag,code in page.blocks if code.lstrip().startswith('const PROMPTS ='))
 prompts=json.JSONDecoder().raw_decode(source[source.index('['):])[0]
 setup=next(code for tag,code in page.blocks if code.lstrip().startswith('const STYLES ='))
 # Evaluate only the two data literal declarations, never the captured runtime.
 literals=setup[:setup.index('const TIPS =')]
 p=subprocess.run(['node','-e',literals+';process.stdout.write(JSON.stringify({styles:STYLES,starts:STARTS}))'],capture_output=True,text=True,check=True)
 catalog=json.loads(p.stdout)
 slugs=['paper-cut-out','generative-particles','liquid-glass','kinetic-typography','isometric-line-art','flat-vector','risograph-print','8-bit-pixel-art']
 templates=ART/'templates'; templates.mkdir(exist_ok=True)
 for i,(slug,prompt) in enumerate(zip(slugs,prompts)):
  (templates/(slug+'.md')).write_text(prompt)
  catalog['styles'][i].update(id=slug,template=f'artifact/templates/{slug}.md')
 (ART/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 urls={urljoin(BASE,u) for u in shell.resources}|{urljoin(FRAME,u) for u in page.resources}
 urls.update(['https://claude.ai/i18n/frame-shell/pt-BR.json?v=e0da245523cd','https://claude.ai/images/artifact-icons/glyphs.svg?v=1uaixo0'])
 records=[]; seen=set()
 # Recursively archive referenced JS chunks, CSS and fonts, not service APIs or links in prose.
 while urls-seen:
  batch=sorted(urls-seen); seen.update(batch)
  with ThreadPoolExecutor(max_workers=8) as pool: results=list(pool.map(fetch,batch))
  records.extend(results)
  for row in results:
   if 'error' in row: continue
   path=ROOT/row['path']
   if path.suffix not in ('.js','.css') and 'fonts.googleapis.com' not in row['url']: continue
   text=path.read_text(errors='replace')
   deps=re.findall(r'''(?:from\s*|import\s*\(|import\s*)["']([^"']+)["']''',text)
   if path.suffix=='.js': deps+=re.findall(r'''["'](\./[^"']+\.(?:js|css))["']''',text)
   deps+=re.findall(r'url\(["\x27]?([^\s)"\x27]+)',text)
   urls.update(urljoin(row['url'],u) for u in deps if u.startswith(('./','../','https://','/')))
  print(f'Archived {len(records)} resources; queued {len(urls-seen)}',flush=True)
 mapping={r['url']:Path(r['path']).name for r in records if 'path' in r}
 local=ART/'local'; local.mkdir(exist_ok=True)
 # Drop only the injected platform preamble and bridge; preserve all original app code and SVG artwork.
 for tag,code in page.blocks[:2]: doc=doc.replace('<script>'+code+'</script>','',1)
 doc=re.sub(r'<link[^>]+rel="preconnect"[^>]*>','',doc)
 for url,name in mapping.items(): doc=doc.replace(url,'../resources/'+name)
 for row in records:
  if 'path' not in row: continue
  path=ROOT/row['path']
  if path.suffix=='.css' or 'fonts.googleapis.com' in row['url']:
   css=path.read_text()
   for url,name in mapping.items(): css=css.replace(url,'../resources/'+name)
   css_name=path.name+'.css' if path.suffix!='.css' else path.name
   (local/css_name).write_text(css)
   doc=doc.replace('../resources/'+path.name,css_name)
 doc=doc.replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="default-src &apos;self&apos; data: blob:; script-src &apos;self&apos; &apos;unsafe-inline&apos;; style-src &apos;self&apos; &apos;unsafe-inline&apos;; connect-src &apos;none&apos;; object-src &apos;none&apos;; base-uri &apos;none&apos;">',1)
 (local/'index.html').write_text(doc)
 manifest={'source':BASE,'frame':FRAME,'scope':'Public HTML, inline code, linked static resources and recursive JS/CSS/font dependencies. No account API, telemetry, cookies, private files or backend source.', 'resources':records,'originals':[{'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [RAW/'page.html',RAW/'content.html']]}
 (ART/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'templates':len(prompts),'resources':len(records),'failures':[r for r in records if 'error' in r]},ensure_ascii=False))
if __name__=='__main__': main()
