import fs from 'node:fs/promises';
import {analyzeNarrative} from '../engine/narrative.js';
import {buildCatalog} from './build-catalog.mjs';
const file=process.argv[2];if(!file)throw new Error('Uso: npm run analisar -- roteiro.txt [plano.json]');
const result=analyzeNarrative(await fs.readFile(file,'utf8'),await buildCatalog());
if(process.argv[3])await fs.writeFile(process.argv[3],JSON.stringify(result,null,2)+'\n');else console.log(JSON.stringify(result,null,2));
