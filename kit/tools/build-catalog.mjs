import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {SCENERY,PRESETS,CLIPS} from '../../kit-video-3d/assets/index.js';
import {SPECIALS} from '../assets/specials.js';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const digest=content=>createHash('sha256').update(content).digest('hex').slice(0,16);
async function sourceTree(dir){const contents=[];for(const e of(await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())contents.push(...await sourceTree(p));else if(/\.(js|mjs)$/.test(e.name))contents.push(e.name+'\n'+await fs.readFile(p,'utf8'));}return contents;}
// Only dependencies of this resource participate. Adding an unrelated asset preserves approvals.
export async function moduleSources(file,seen=new Set()){
 const absolute=path.resolve(file);if(seen.has(absolute))return '';seen.add(absolute);
 const source=await fs.readFile(absolute,'utf8');let content=source;
 for(const match of source.matchAll(/(?:from\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)){
  if(!match[1].startsWith('.'))continue;const dependency=path.resolve(path.dirname(absolute),match[1]);
  if(!dependency.startsWith(ROOT+path.sep))throw new Error('Dependência fora do workspace.');
  content+='\n'+await moduleSources(dependency,seen);
 }return content;
}
export async function buildCatalog(){
 const pkg=JSON.parse(await fs.readFile(path.join(ROOT,'package.json'),'utf8'));
 const legacyRevision=digest((await sourceTree(path.join(ROOT,'kit-video-3d/assets'))).join('\n')+pkg.dependencies.three);
 const custom=JSON.parse(await fs.readFile(path.join(ROOT,'kit/catalog/custom-assets.json'),'utf8'));
 const legacy=[...Object.entries(SCENERY).map(([id,a])=>({id,label:a.label,description:a.description,category:a.category,kind:['casas','predios','ruas'].includes(a.category)?'scene':'object',source:'legacy',origin:'existing',aliases:[id.replaceAll('_',' '),a.label.toLowerCase()],variants:Object.keys(a.variants||{}),params:a.params||{}})),
 ...Object.entries(PRESETS).map(([id,a])=>({id:`personagem_${id}`,preset:id,label:id[0].toUpperCase()+id.slice(1),description:a.role,category:'personagens',kind:'character',source:'legacy',origin:'existing',aliases:[id],variants:[]})),
 ...Object.entries(CLIPS).map(([id,a])=>({id:`anim_${id}`,clip:id,label:`Ação · ${id}`,description:a.description||'Animação do esqueleto compartilhado.',category:'animacoes',kind:'animation',source:'legacy',origin:'existing',aliases:[id],variants:[]}))].map(a=>({...a,revision:legacyRevision}));
 const added=[];for(const definition of [...SPECIALS,...custom]){
  const a={...definition,source:'custom',origin:definition.introducedBy?'narrative':'existing'};
  let content=JSON.stringify({module:a.module,variants:a.variants,params:a.params,factory:a.factory,sound:a.sound,dependencies:a.dependencies,recipe:a.recipe})+pkg.dependencies.three;
  if(a.module)content+=await moduleSources(path.join(ROOT,'kit/assets',a.module));
  else if(a.sound)content+=await fs.readFile(path.join(ROOT,'stick-film/audio/dsp.py'),'utf8')+await fs.readFile(path.join(ROOT,'kit/tools/sound-preview.py'),'utf8');
  else content+=await fs.readFile(path.join(ROOT,'kit/engine/motion.js'),'utf8');
  let quality=null;try{const report=JSON.parse(await fs.readFile(path.join(ROOT,'kit/quality/reports',a.id+'.json'),'utf8'));const sourceDigest=a.module?createHash('sha256').update(await moduleSources(path.join(ROOT,'kit/assets',a.module))+JSON.stringify(a.variants||[])).digest('hex'):null;quality={...report,current:sourceDigest===report.sourceDigest};}catch(e){if(e.code!=='ENOENT')throw e;}
  added.push({...a,revision:digest(content),quality});
 }
 const assets=[...legacy,...added],revision=digest(assets.map(a=>a.id+':'+a.revision).join('|'));
 const result={schemaVersion:2,revision,assets};await fs.writeFile(path.join(ROOT,'kit/catalog/registry.json'),JSON.stringify(result,null,2)+'\n');
 const summary='# Catálogo compacto\n\nA LLM consulta apenas os recursos relacionados e verifica a revisão de cada um.\n\n'+assets.map(a=>'- '+a.id+' | '+a.label+' | '+a.kind+' | '+a.revision+(a.variants.length?' | '+a.variants.join(', '):'')).join('\n')+'\n';
 await fs.writeFile(path.join(ROOT,'kit/catalog/RESUMO.md'),summary);return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const c=await buildCatalog();console.log(`${c.assets.length} recursos · revisão ${c.revision}`);}
