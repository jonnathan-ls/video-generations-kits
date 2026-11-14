import * as THREE from 'three';

export function createArchBlockGeometry(part){
 const {outerRadius,innerRadius,startAngle,endAngle,depth}=part;
 if(![outerRadius,innerRadius,startAngle,endAngle,depth].every(Number.isFinite)||outerRadius<=innerRadius||innerRadius<=0||endAngle<=startAngle||depth<=0)throw new Error('Parâmetros inválidos para cunha de arco.');
 const point=(radius,degrees,z)=>{const angle=degrees*Math.PI/180;return [radius*Math.cos(angle),radius*Math.sin(angle),z];};
 const front=[point(outerRadius,startAngle,depth/2),point(outerRadius,endAngle,depth/2),point(innerRadius,endAngle,depth/2),point(innerRadius,startAngle,depth/2)];
 const back=front.map(([x,y])=>[x,y,-depth/2]),positions=[];
 const triangle=(a,b,c)=>positions.push(...a,...b,...c),quad=(a,b,c,d)=>{triangle(a,b,c);triangle(a,c,d);};
 triangle(front[0],front[1],front[2]);triangle(front[0],front[2],front[3]);
 triangle(back[2],back[1],back[0]);triangle(back[3],back[2],back[0]);
 for(let i=0;i<4;i++)quad(front[i],back[i],back[(i+1)%4],front[(i+1)%4]);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
