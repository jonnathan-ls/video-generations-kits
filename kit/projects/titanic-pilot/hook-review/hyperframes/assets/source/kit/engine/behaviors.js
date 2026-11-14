import {BEHAVIOR_KINDS} from './resources.js';
export function isBehavior(definition,module){return BEHAVIOR_KINDS.includes(definition.kind)&&typeof module.apply==='function';}
export function applyBehavior(module,definition,use,context,t){
 if(!isBehavior(definition,module))throw new Error('Contrato de comportamento ausente.');
 const target=use.target?context.targets.get(use.target):null;
 if(use.target&&!target)throw new Error(`Alvo não encontrado: ${use.target}`);
 if(['animation','effect','transition'].includes(definition.kind)&&!target)throw new Error(`Defina um alvo para ${definition.id}.`);
 const timeOffset=use.timeOffset??0;
 if(!Number.isFinite(timeOffset)||timeOffset<0)throw new Error(`timeOffset inválido em ${definition.id}.`);
 module.apply({...context,target},t+timeOffset,use.params||{});
}

export function sampleResource(object,use,local,global){const offset=use.timeOffset??0;if(!Number.isFinite(offset)||offset<0)throw new Error(`timeOffset inválido em ${use.id}.`);if(object.userData.sample)object.userData.sample(local+offset,global);}
