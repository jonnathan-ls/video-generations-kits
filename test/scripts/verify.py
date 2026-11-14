#!/usr/bin/env python3
"""Check prompt fidelity against the artifact's actual JS builder and archive integrity."""
from pathlib import Path
import hashlib, json, re, subprocess, sys, tempfile
from build_prompt import resolve, ROOT

def main():
 catalog=json.loads((ROOT/'artifact/catalog.json').read_text())['styles']
 source=(ROOT/'artifact/raw/inline-06.js').read_text()
 setup=(ROOT/'artifact/raw/inline-07.js').read_text()
 # Run only original constant strings and the pure prompt-building region, not app/bridge code.
 builder=setup[setup.index('const DEF ='):setup.index('/* ---------- helpers')]
 configs=[]
 for style in catalog:
  for duration in (5,30,61,120,600):
   for voice in (False,True):
    configs.append(dict(style=style['id'],topic='Por que uma ponte sustenta peso?',storyboard=True,voiceover=voice,script='  Um "arco"\n distribui forças. ',subtitles=True,min=duration//60,sec=duration%60,vertical=duration%2==1,music=duration%2==0,sfx=False))
 js=source+'\n'+builder+'\nconst inputs='+json.dumps(configs)+';console.log(JSON.stringify(inputs.map((c)=>{S={...DEF,...c};return buildPrompt('+json.dumps([x['id'] for x in catalog])+'.indexOf(c.style));})));'
 original=json.loads(subprocess.run(['node','-'],input=js,text=True,capture_output=True,check=True).stdout)
 for config,expected in zip(configs,original):
  actual,_=resolve(config)
  assert actual==expected,config
 # Topic text remains opaque, including template-like text, and invalid durations are rejected.
 actual,_=resolve(dict(style='flat-vector',topic='Tema {{MUSIC}} literal'))
 assert 'Tema {{MUSIC}} literal' in actual
 for duration in (0,4,601):
  try: resolve(dict(style='flat-vector',topic='Tema',sec=duration))
  except ValueError: pass
  else: raise AssertionError(f'Accepted invalid duration {duration}')
 manifest=json.loads((ROOT/'artifact/manifest.json').read_text())
 for row in manifest['resources']+manifest['originals']:
  if 'error' in row: continue
  assert hashlib.sha256((ROOT/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
 local=(ROOT/'artifact/local/index.html').read_text()
 assert '__FRAME_PREAMBLE' not in local
 assert '__frameInlineProbe' not in local
 from html.parser import HTMLParser
 from urllib.parse import urlsplit
 class Resources(HTMLParser):
  def handle_starttag(self,tag,attrs):
   a=dict(attrs)
   if tag not in ('script','link','img','source'): return
   for key in ('src','href'):
    if key not in a: continue
    url=a[key]; assert not url.startswith(('http:','https:')),url
    if not url.startswith(('data:','blob:','#')): assert (ROOT/'artifact/local'/urlsplit(url).path).exists(),url
 Resources().feed(local)
 for css in (ROOT/'artifact/local').glob('*.css'):
  for url in re.findall(r'url\(["\x27]?([^\s)"\x27]+)',css.read_text()):
   assert not url.startswith(('https:','http:')),url
   assert (css.parent/url).exists(),url
 # Exercise the actual CLI and ensure all reviewable outputs are materialized.
 with tempfile.TemporaryDirectory(prefix='verify-',dir=ROOT/'runs') as folder:
  config=Path(folder)/'config.json'
  config.write_text(json.dumps(dict(style='flat-vector',topic='Teste técnico do gerador de prompt',storyboard=True)))
  subprocess.run([sys.executable,str(ROOT/'scripts/build_prompt.py'),str(config)],capture_output=True,text=True,check=True)
  prompt,_=resolve(json.loads(config.read_text()))
  assert (Path(folder)/'prompt-original.md').read_text()==prompt
  assert (Path(folder)/'prompt-execucao.md').read_text().endswith(prompt)
  assert json.loads((Path(folder)/'config-resolved.json').read_text())['storyboard'] is True
 print(f'PASS: {len(configs)} prompts match original JavaScript; boundary checks, captured hashes and local dependencies verified.')
 failures=[r for r in manifest['resources'] if 'error' in r]
 print(f'Capture: {len(manifest["resources"])-len(failures)} resources, {len(failures)} documented failure(s).')
if __name__=='__main__': main()
