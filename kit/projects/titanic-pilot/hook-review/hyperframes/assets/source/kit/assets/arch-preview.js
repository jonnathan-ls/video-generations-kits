import * as THREE from 'three';
import * as archModule from './arco-alvenaria.js';
import * as centeringModule from './cimbra-arco.js';
import * as supportsModule from './apoios-arco.js';

export function createArchPreview(apply,primary='arch'){
 const root=new THREE.Group();root.name='prévia_arco';
 const arch=archModule.create({variant:'padrao'}),centering=centeringModule.create({variant:'padrao'}),supports=supportsModule.create({variant:'padrao'});
 root.add(arch,centering,supports);
 const targets=new Map([['arco_alvenaria',arch],['cimbra_arco',centering],['apoios_arco',supports]]);
 const context={scene:root,targets,target:targets.get(primary)};
 root.userData.sample=t=>apply(context,t,{});root.userData.sample(0);return root;
}
