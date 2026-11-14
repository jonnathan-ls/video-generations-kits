import fs from 'node:fs/promises';import path from 'node:path';import {buildCatalog,ROOT} from './build-catalog.mjs';import {ReviewStore} from './reviews.mjs';import {inspectResource} from './quality.mjs';
const input=process.argv[2];if(!input)throw new Error('A LLM informa a especificação do recurso.');
const request=JSON.parse(await fs.readFile(input,'utf8')),definition=request.definition;
if(!/^[a-z][a-z0-9_]{2,63}$/.test(definition.id)||!/^[a-z0-9-]+\.js$/.test(definition.module))throw new Error('Identificador ou módulo inválido.');
if(!['object','character','scene'].includes(definition.kind))throw new Error('Este gerador atende somente objeto, personagem e cenário geométricos. Para outros tipos, implemente o contrato especializado.');
const file=path.join(ROOT,'kit/assets',definition.module);try{await fs.access(file);throw new Error('Módulo já existe; revisar o recurso existente em vez de sobrescrever.');}catch(e){if(e.code!=='ENOENT')throw e;}
if(!request.recipe?.parts?.length)throw new Error('Receita precisa de peças explícitas. Para comportamento, áudio ou material especializado, a LLM implementa o contrato adequado.');
await fs.writeFile(file,`import {createResource} from '../engine/factory/index.js';\nconst recipe=${JSON.stringify(request.recipe,null,2)};\nexport const create=options=>createResource(recipe,options);\n`);
const catalog=await buildCatalog(),reviews=await new ReviewStore(path.join(ROOT,'kit/catalog/reviews.json')).read();
const report=await inspectResource(definition,{catalog,reviews});await fs.mkdir(path.join(ROOT,'kit/quality/reports'),{recursive:true});await fs.writeFile(path.join(ROOT,'kit/quality/reports',definition.id+'.json'),JSON.stringify(report,null,2)+'\n');
if(!report.ok)throw new Error('Qualidade técnica reprovada: '+report.errors.join('; '));
console.log(JSON.stringify({module:file,quality:report,readyToRegister:true},null,2));
