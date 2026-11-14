import {createHash} from 'node:crypto';
import * as THREE from 'three';import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {ROOT,moduleSources} from './build-catalog.mjs';import {statusFor} from './reviews.mjs';
function snapshot(root){root.updateMatrixWorld(true);const values=[];root.traverse(o=>{values.push(o.name,o.visible,...o.matrixWorld.elements);if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])values.push(m.opacity,m.color?.getHex(),m.roughness,m.metalness);const a=o.geometry?.attributes?.position;if(a){let sum=0;for(let i=0;i<a.array.length;i++)sum=(sum+Math.fround(a.array[i])*(i+1))%1000000007;values.push(a.count,sum);}}});return JSON.stringify(values);}
export async function inspectResource(definition,{catalog,reviews}={}){
 const profile=JSON.parse(await fs.readFile(path.join(ROOT,'kit/quality/profile.json'),'utf8')),errors=[],warnings=[];
 const source=await moduleSources(path.join(ROOT,'kit/assets',definition.module));
 if(/\b(?:fetch|XMLHttpRequest|WebSocket|eval)\s*\(|new\s+Function\b|https?:\/\/|node:(?:fs|child_process|net|http)/.test(source))errors.push('Módulo contém acesso de rede, execução dinâmica ou acesso ao sistema; requer revisão técnica.');
 const sourceDigest=createHash('sha256').update(source+JSON.stringify(definition.variants||[])).digest('hex');
 if(errors.length)return {ok:false,errors,warnings,sourceDigest,needsHumanReview:true,profileVersion:profile.version};
 const mod=await import(pathToFileURL(path.join(ROOT,'kit/assets',definition.module)).href+'?quality='+Date.now());
 if(typeof mod.create!=='function')throw new Error('O recurso precisa exportar create().');
 const checks=[];for(const variant of definition.variants?.length?definition.variants:['']){
  const root=mod.create({variant}),parts=[];let meshes=0,triangles=0;
  if(!root?.isObject3D)throw new Error('create() precisa retornar um Object3D.');
  root.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry?.attributes?.position;if(!a){errors.push(`${variant}: malha sem posições.`);return;}triangles+=(o.geometry.index?.count||a.count)/3;for(const n of a.array)if(!Number.isFinite(n)){errors.push(`${variant}: vértice não finito.`);break;}}parts.push(o);});
  root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
  if(box.isEmpty()||!size.toArray().every(Number.isFinite))errors.push(`${variant}: limites inválidos.`);
  if(box.min.y<-.03)warnings.push(`${variant}: recurso abaixo do chão; justificar contato no contrato.`);
  if(meshes>profile.maxMeshes||triangles>profile.maxTriangles)errors.push(`${variant}: excede orçamento de geometria.`);
  const sample=root.userData.sample||(()=>{});for(const time of profile.sampleTimes){sample(time);const expected=snapshot(root);sample(6);sample(.1);sample(time);if(snapshot(root)!==expected)errors.push(`${variant}: sample(${time}) depende do quadro anterior.`);if(parts.some(o=>!o.position.toArray().every(Number.isFinite)))errors.push(`${variant}: transformação inválida.`);}
  checks.push({variant,meshes,triangles,dimensions:size.toArray()});
 }
 const baselineIds=definition.baselineIds||[],baselines=[];
 for(const id of baselineIds){const a=catalog?.assets.find(a=>a.id===id);if(!a){errors.push(`Referência de qualidade inexistente: ${id}`);continue;}const variant=a.variants?.find(v=>statusFor(a,v,reviews||{})==='approved')||'';if(statusFor(a,variant,reviews||{})!=='approved'){errors.push(`Referência de qualidade ainda não aprovada: ${id}`);continue;}baselines.push({id,variant,revision:a.revision});}
 if(!baselines.length)warnings.push('Sem referência humana aprovada para este tipo; revisão visual explícita é necessária.');
 return {schemaVersion:1,sourceDigest,profileVersion:profile.version,ok:errors.length===0,checks,errors:[...new Set(errors)],warnings:[...new Set(warnings)],baselines,needsHumanReview:true,checkedAt:new Date().toISOString()};
}
