const smooth=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
export function applyMotion(object,base,motion,t){object.position.copy(base.position);object.rotation.copy(base.rotation);object.scale.copy(base.scale);if(!motion)return;
 const u=smooth((t-(motion.start||0))/(motion.duration||3)),axis=motion.axis||'x';
 if(!['x','y','z'].includes(axis))throw new Error('Eixo de movimento inválido.');
 if(motion.type==='translate')object.position[axis]=base.position[axis]+(motion.distance||0)*u;
 else if(motion.type==='rotate')object.rotation[axis]=base.rotation[axis]+(motion.angle||0)*Math.PI/180*u;
 else if(motion.type==='reveal')object.visible=t>=(motion.start||0);
 else throw new Error(`Movimento não suportado: ${motion.type}`);
}
