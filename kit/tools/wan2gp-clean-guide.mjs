import fs from 'node:fs/promises';
import {localPath, execute} from '../integrations/wan2gp/adapter.mjs';

// Render intermediário local: não altera a composição ou o render aprovado.
const sourceId = process.argv[2] || 'arco-alvenaria';
const targetId = process.argv[3] || 'arco-alvenaria-wan2gp';
try {
  for (const id of [sourceId,targetId])
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) throw new Error('ID de projeto inválido.');
  if (sourceId===targetId) throw new Error('A referência precisa de um projeto de destino separado.');
  const source = localPath(`kit/projects/${sourceId}/hyperframes`);
  const destination = localPath(`kit/projects/${targetId}/guide-composition`);
  const guide = localPath(`kit/projects/${targetId}/guides/original-clean.mp4`);
  await fs.mkdir(localPath(`kit/projects/${targetId}/guides`),{recursive:true});
  await fs.cp(`${source}/assets`,`${destination}/assets`,{recursive:true});
  let html = await fs.readFile(`${source}/index.html`,'utf8');
  html = html.replace(/data-width="\d+" data-height="\d+"/,'data-width="288" data-height="512"')
    .replace('</head>','<style>#root{position:absolute!important;left:0!important;top:0!important;width:288px!important;height:512px!important;transform:none!important}#captions,#preview-controls{display:none!important}</style></head>');
  await fs.writeFile(`${destination}/index.html`,html);
  const script = await fs.readFile(`${destination}/assets/project.js`,'utf8');
  const [assignment,registry] = script.split('\nexport const registry=');
  if (!registry) throw new Error('Formato de exportação não reconhecido; preservar a origem e revisar adaptador.');
  const project = JSON.parse(assignment.replace(/^export const project=/,'').replace(/;$/,''));
  Object.assign(project,{width:288,height:512,fps:16,captions:[]});
  await fs.writeFile(`${destination}/assets/project.js`,`export const project=${JSON.stringify(project)};\nexport const registry=${registry}`);
  await fs.writeFile(`${destination}/hyperframes.json`,JSON.stringify({width:288,height:512,fps:16,duration:project.duration},null,2)+'\n');
  const args = ['--yes','hyperframes@0.9.14'];
  let result = await execute('npx',[...args,'check',destination,'--json']);
  if (result.code) throw new Error('A cópia técnica não passou no check.');
  result = await execute('npx',[...args,'render',destination,'--fps','16','--quality','draft','--workers','1','--output',guide]);
  if (result.code) throw new Error('Falha no render da referência sem texto.');
  console.log(`Guia técnico criado em ${guide}; sem aprovação nova inferida.`);
} catch (error) { console.error(error.message);process.exitCode=1; }
