import * as THREE from 'three';

const WALL_WIDTH=8.1,WALL_HEIGHT=5.05,OPENING_RADIUS=2.5,SPRING_Y=2.15,WALL_DEPTH=0.42,WALL_Z=-0.78;

function openingHalfWidth(y){
 if(y<=SPRING_Y)return OPENING_RADIUS;
 if(y>=SPRING_Y+OPENING_RADIUS)return 0;
 const rise=y-SPRING_Y;return Math.sqrt(OPENING_RADIUS*OPENING_RADIUS-rise*rise);
}

export function create(){
 const root=new THREE.Group();root.name='contexto_obra_arco';
 const wallShape=new THREE.Shape();wallShape.moveTo(-WALL_WIDTH/2,0);wallShape.lineTo(WALL_WIDTH/2,0);wallShape.lineTo(WALL_WIDTH/2,WALL_HEIGHT);wallShape.lineTo(-WALL_WIDTH/2,WALL_HEIGHT);wallShape.closePath();
 const opening=new THREE.Path();opening.moveTo(-OPENING_RADIUS,0);opening.lineTo(-OPENING_RADIUS,SPRING_Y);
 for(let step=1;step<=32;step++){const angle=Math.PI-step*Math.PI/32;opening.lineTo(OPENING_RADIUS*Math.cos(angle),SPRING_Y+OPENING_RADIUS*Math.sin(angle));}
 opening.lineTo(OPENING_RADIUS,0);opening.closePath();wallShape.holes.push(opening);

 const stone=new THREE.MeshStandardMaterial({color:'#c4b8a6',roughness:0.94,metalness:0});
 const joint=new THREE.MeshStandardMaterial({color:'#a99e8d',roughness:1,metalness:0});
 const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape,{depth:WALL_DEPTH,bevelEnabled:false,curveSegments:32}),stone);
 wall.name='parede_com_abertura_em_arco';wall.position.z=WALL_Z;wall.castShadow=true;wall.receiveShadow=true;root.add(wall);

 const addBox=(name,size,position,material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.name=name;mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;};
 const frontZ=WALL_Z+WALL_DEPTH+0.012,rowHeight=0.34,rowPitch=0.39;
 for(let row=0,y=rowPitch; y<WALL_HEIGHT-0.12; row++,y+=rowPitch){
  const lower=Math.max(0,y-rowHeight/2),half=openingHalfWidth(y)+0.065;
  const bands=[[-WALL_WIDTH/2+0.08,-half-0.06],[half+0.06,WALL_WIDTH/2-0.08]];
  for(const [left,right] of bands)if(right-left>0.14)addBox(`junta_h_${row}_${left<0?'e':'d'}`,[right-left,0.022,0.014],[(left+right)/2,y,frontZ],joint);
  const maxHalf=openingHalfWidth(lower)+0.065,offset=row%2?0.41:0;
  for(let x=-WALL_WIDTH/2+0.42+offset;x<WALL_WIDTH/2-0.12;x+=0.82){
   if(x<-maxHalf||x>maxHalf)addBox(`junta_v_${row}_${Math.round(x*100)}`,[0.022,rowHeight-0.035,0.014],[x,y,frontZ],joint);
  }
 }

 const returnMaterial=new THREE.MeshStandardMaterial({color:'#b7aa97',roughness:0.96,metalness:0});
 addBox('retorno_lateral_esquerdo',[0.36,WALL_HEIGHT,0.82],[-WALL_WIDTH/2+0.08,WALL_HEIGHT/2,WALL_Z-0.41],returnMaterial);
 addBox('retorno_lateral_direito',[0.36,WALL_HEIGHT,0.82],[WALL_WIDTH/2-0.08,WALL_HEIGHT/2,WALL_Z-0.41],returnMaterial);
 return root;
}
