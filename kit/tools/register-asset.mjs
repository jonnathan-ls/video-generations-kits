import fs from 'node:fs/promises';
import path from 'node:path';
import {buildCatalog,ROOT} from './build-catalog.mjs';
import {RESOURCE_KINDS} from '../engine/resources.js';
import {BacklogStore} from './backlog.mjs';
import {inspectResource} from './quality.mjs';
import {ReviewStore} from './reviews.mjs';
const input=process.argv[2];if(!input)throw new Error('Uso: node kit/tools/register-asset.mjs definicao.json');
const def=JSON.parse(await fs.readFile(input,'utf8'));
if(!/^[a-z][a-z0-9_]{2,63}$/.test(def.id))throw new Error('ID precisa usar snake_case, de 3 a 64 caracteres.');
for(const k of ['label','category','description','module'])if(typeof def[k]!=='string'||!def[k].trim())throw new Error(`Campo obrigatório: ${k}`);
if(!RESOURCE_KINDS.includes(def.kind))throw new Error('Tipo de asset inválido.');
if(!/^[a-z0-9-]+\.js$/.test(def.module))throw new Error('O módulo precisa estar em kit/assets, sem subdiretórios.');
if(!Array.isArray(def.aliases)||!def.aliases.every(s=>typeof s==='string'&&s.trim()))throw new Error('Defina os termos e sinônimos do asset.');
if(!Array.isArray(def.variants)||!def.variants.every(s=>typeof s==='string'&&s.trim())||new Set(def.variants).size!==def.variants.length)throw new Error('Variações inválidas.');
await fs.access(path.join(ROOT,'kit/assets',def.module));const existing=await buildCatalog();if(existing.assets.some(a=>a.id===def.id))throw new Error('Já existe recurso com este ID. Reutilize ou atualize o módulo atual.');
if(def.introducedBy?.requirementId){const data=await new BacklogStore(path.join(ROOT,'kit/catalog/backlog.json')).read();if(!data.items.some(i=>i.id===def.introducedBy.requirementId&&i.kind===def.kind))throw new Error('Requisito de origem inexistente ou tipo divergente.');}
const report=await inspectResource(def,{catalog:existing,reviews:await new ReviewStore(path.join(ROOT,'kit/catalog/reviews.json')).read()});if(!report.ok)throw new Error(report.errors.join('; '));await fs.mkdir(path.join(ROOT,'kit/quality/reports'),{recursive:true});await fs.writeFile(path.join(ROOT,'kit/quality/reports',def.id+'.json'),JSON.stringify(report,null,2)+'\n');
const file=path.join(ROOT,'kit/catalog/custom-assets.json'),rows=JSON.parse(await fs.readFile(file,'utf8'));rows.push(def);await fs.writeFile(file,JSON.stringify(rows,null,2)+'\n');await buildCatalog();if(def.introducedBy?.requirementId)await new BacklogStore(path.join(ROOT,'kit/catalog/backlog.json')).link(def.introducedBy.requirementId,def.id);console.log(`Registrado: ${def.id}. Abra o catálogo para revisão humana; nenhuma aprovação foi concedida.`);
