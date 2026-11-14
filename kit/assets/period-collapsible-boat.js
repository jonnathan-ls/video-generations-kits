import * as THREE from 'three';
import {ParametricGeometry} from 'three/addons/geometries/ParametricGeometry.js';
import {surface} from './period-surface-materials.js';

// Separate construction: this is a shallow wooden bottom with collapsed
// canvas sides, not the rigid lifeboat turned upside down. Dimensions and
// internal construction are illustrative, not an archaeological survey.
export function create({params={}}={}){
  const root=new THREE.Group();root.name='illustrative-inverted-collapsible';
  const body=new THREE.Group();body.name='inverted-collapsible-body';root.add(body);
  const length=8,beam=2.65,half=length/2;
  const widthAt=z=>Math.max(.07,beam/2*Math.pow(Math.max(0,1-(z/half)**2),.52));
  const topAt=(x,z)=>{
    const w=widthAt(z),cross=THREE.MathUtils.clamp(x/w,-1,1);
    return .17+.34*(1-cross*cross)*Math.pow(Math.max(0,1-(z/half)**2),.30);
  };
  const wood=surface('deck');wood.color.set('#b8a789');wood.roughness=.68;wood.metalness=.02;
  const bottom=new THREE.Mesh(new ParametricGeometry((u,v,p)=>{
    const z=THREE.MathUtils.lerp(-half+.025,half-.025,v),x=(u*2-1)*widthAt(z);
    p.set(x,topAt(x,z),z);
  },28,80),wood);bottom.name='exposed-upturned-wooden-bottom';bottom.castShadow=true;bottom.receiveShadow=true;body.add(bottom);
  // Parametric x/z order faces downward; expose the top of the inverted
  // bottom to the camera and key light instead of depending on backfaces.
  const index=bottom.geometry.index;
  for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}
  bottom.geometry.computeVertexNormals();
  const seamMaterial=new THREE.MeshStandardMaterial({color:'#5f5744',roughness:.88});
  const tube=(name,points,radius,material)=>{
    const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(24,points.length*2),radius,6,false),material);
    line.name=name;line.castShadow=true;line.receiveShadow=true;body.add(line);return line;
  };
  // Narrow longitudinal seams describe real boards, rather than a smooth
  // modern inflatable pontoon or a tray with seats.
  for(let i=-5;i<=5;i++){
    const ratio=i/6,points=[];
    for(let j=0;j<=48;j++){const z=THREE.MathUtils.lerp(-3.92,3.92,j/48),x=widthAt(z)*ratio;points.push(new THREE.Vector3(x,topAt(x,z)+.004,z));}
    tube('bottom-plank-seam',points,.007,seamMaterial);
  }
  for(const side of[-1,1]){
    const points=[];
    for(let j=0;j<=64;j++){const z=THREE.MathUtils.lerp(-3.96,3.96,j/64);points.push(new THREE.Vector3(side*widthAt(z),.16,z));}
    tube('low-inverted-timber-edge',points,.038,wood);
  }
  const keel=[];
  for(let j=0;j<=60;j++){const z=THREE.MathUtils.lerp(-3.9,3.9,j/60);keel.push(new THREE.Vector3(0,topAt(0,z)+.026,z));}
  tube('exposed-shallow-keel-strip',keel,.032,wood);

  const canvas=surface('cloth');canvas.color.set('#777764');canvas.roughness=.94;canvas.side=THREE.DoubleSide;
  // Fabric is visibly collapsed below the bottom, with uneven folds around
  // its perimeter. There is no upright hull or fictitious inflatable ring.
  for(const side of[-1,1]){
    const skirt=new THREE.Mesh(new ParametricGeometry((u,v,p)=>{
      const z=THREE.MathUtils.lerp(-3.94,3.94,u),w=widthAt(z);
      const fold=.035*Math.sin(z*7.6+v*9.1)+.018*Math.sin(z*15-v*4);
      p.set(side*(w+.035+v*.10+fold),.13-v*.23+.026*Math.sin(z*6.2+v*11),z);
    },84,12),canvas);
    skirt.name='collapsed-wet-canvas-side';skirt.castShadow=true;skirt.receiveShadow=true;body.add(skirt);
  }
  const ropeMaterial=new THREE.MeshStandardMaterial({color:'#8b8062',roughness:.97});
  for(const side of[-1,1]){
    const line=[];
    for(let j=0;j<=50;j++){const z=THREE.MathUtils.lerp(-3.85,3.85,j/50);line.push(new THREE.Vector3(side*(widthAt(z)+.08),-.015+.018*Math.sin(z*5),z));}
    tube('canvas-edge-rope',line,.015,ropeMaterial);
  }
  const sample=time=>{
    const t=Number.isFinite(time)?time:0;
    const amount=params.still===true?0:1;
    body.position.y=(Number(params.waterOffset)||0)+.016*Math.sin(t*.67)*amount;
    body.rotation.x=.008*Math.sin(t*.53+.2)*amount;
    body.rotation.z=.012*Math.sin(t*.43)*amount;
  };
  root.userData.sample=sample;
  root.userData.support={length,beam,waterline:0,illustrative:true,standingSurfaceAt:(x,z)=>topAt(x,z),suggestedFootLocations:[[-.45,0], [.45,0],[-.4,1.1],[.4,-1.1]].map(([x,z])=>[x,topAt(x,z)+.015,z]),parentActorsTo:'inverted-collapsible-body'};
  sample(0);return root;
}
