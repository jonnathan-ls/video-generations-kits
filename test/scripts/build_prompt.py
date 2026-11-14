#!/usr/bin/env python3
"""Resolve the original artifact template without generating a story automatically."""
from pathlib import Path
import argparse, json, re
ROOT=Path(__file__).resolve().parents[1]
DEFAULTS=dict(topic='',storyboard=False,voiceover=False,script='',subtitles=False,min=0,sec=30,vertical=False,music=True,sfx=True)

def resolve(config):
 s=DEFAULTS|config
 catalog=json.loads((ROOT/'artifact/catalog.json').read_text())['styles']
 style=next((x for x in catalog if x['id']==s.get('style')),None)
 if not style: raise ValueError('Escolha um style id presente em test/artifact/catalog.json.')
 if not isinstance(s['topic'],str) or not s['topic'].strip(): raise ValueError('Tema vazio.')
 for k in ('storyboard','voiceover','subtitles','vertical','music','sfx'):
  if not isinstance(s[k],bool): raise ValueError(f'{k} deve ser booleano.')
 for k in ('min','sec'):
  if isinstance(s[k],bool) or not isinstance(s[k],int) or s[k]<0: raise ValueError(f'{k} deve ser inteiro não negativo.')
 n=s['min']*60+s['sec']
 if not s['voiceover'] and not 5<=n<=600: raise ValueError('Duração sem voz deve estar entre 5 e 600 segundos.')
 if not isinstance(s['script'],str): raise ValueError('script deve ser texto.')
 mins,secs=divmod(n,60)
 duration=f'{secs} seconds' if not mins else f'{mins} minute'+('s' if mins>1 else '')+(f' {secs} second'+('s' if secs>1 else '') if secs else '')+f' ({n} seconds)'
 script=re.sub(r'\s+',' ',s['script'].strip()).replace('"',"'")
 values=dict(TOPIC=s['topic'].strip(),STORYBOARD='Enabled' if s['storyboard'] else 'Disabled',VOICEOVER='Enabled — attached MP3' if s['voiceover'] else 'Disabled',TRANSCRIPT=f'"{script}"' if s['voiceover'] and script else '""',SUBTITLES='Generate SRT, with optional on-screen display' if s['voiceover'] and s['subtitles'] else 'Disabled',DURATION="Not used — the runtime follows the attached voiceover's actual decoded length" if s['voiceover'] else duration,FORMAT='Vertical, 9:16' if s['vertical'] else 'Horizontal, 16:9',RESOLUTION='1080 × 1920' if s['vertical'] else '1920 × 1080',SFX='Enabled' if s['sfx'] else 'Disabled',MUSIC='Enabled' if s['music'] else 'Disabled')
 template=(ROOT/style['template']).read_text()
 return re.sub(r'\{\{(\w+)\}\}',lambda m:values[m[1]],template),s

def main():
 parser=argparse.ArgumentParser(); parser.add_argument('config',type=Path); a=parser.parse_args()
 folder=a.config.resolve().parent
 if not folder.is_relative_to((ROOT/'runs').resolve()): raise ValueError('A configuração deve estar em test/runs/<sessão>/.')
 prompt,resolved=resolve(json.loads(a.config.read_text()))
 (folder/'prompt-original.md').write_text(prompt)
 (folder/'config-resolved.json').write_text(json.dumps(resolved,ensure_ascii=False,indent=2)+'\n')
 adapter=(ROOT/'motion-storyboard/references/execucao-local.md').read_text()
 (folder/'prompt-execucao.md').write_text('# Adaptação explícita para este ambiente\n\n'+adapter+'\n\n---\n\n# Template original preenchido\n\n'+prompt)
 print(folder/'prompt-execucao.md')
if __name__=='__main__': main()
