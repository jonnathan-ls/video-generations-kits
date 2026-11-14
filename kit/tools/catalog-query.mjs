import {buildCatalog} from './build-catalog.mjs';
import {normalize} from '../engine/narrative.js';
const term=normalize(process.argv.slice(2).join(' ')).trim();if(!term)throw new Error('Uso: npm run procurar -- termo');
const c=await buildCatalog();const assets=c.assets.filter(a=>normalize([a.id,a.label,...a.aliases].join(' ')).includes(term));
console.log(JSON.stringify({revision:c.revision,assets:assets.map(({id,label,kind,variants,aliases})=>({id,label,kind,variants,aliases}))},null,2));
