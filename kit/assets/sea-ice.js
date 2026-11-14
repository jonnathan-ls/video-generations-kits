import * as THREE from 'three';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';
import {mesh} from './maritime-shapes.js';

// Stable pseudo-random values keep the fractured profiles repeatable in every
// render while breaking the regular radial cadence of a simple low-poly cone.
function noise(seed,ring,sector,salt=0){
  const value=Math.sin(seed*127.1+ring*311.7+sector*74.7+salt*19.19)*43758.5453;
  return value-Math.floor(value);
}

function lobe(angle,center,sharpness=8){
  return Math.exp((Math.cos(angle-center)-1)*sharpness);
}

function floeGeometry(seed=1,profileIndex=0){
  // The sea field uses a point-cloud hull like Three.js ConvexGeometry: each
  // floe gets its own uneven, non-repeating planes instead of a tiny cone.
  const profiles=[
    {height:.82,crest:.07,notch:.10,elongation:.20},
    {height:.72,crest:.11,notch:.18,elongation:.32},
    {height:1.12,crest:.17,notch:.12,elongation:-.08},
    {height:.66,crest:.13,notch:.22,elongation:.08}
  ];
  const profile=profiles[profileIndex%profiles.length],sides=48;
  const layers=[[-.78,.42],[-.54,.70],[-.28,.91],[-.06,1], [.045,.94],[.105,.77],[.13,.48],[.12,.16]];
  const points=[],crestAngle=seed*.71+.28,fractureAngle=seed*1.07+4.35;
  for(let ring=0;ring<layers.length;ring++){
    const [baseY,baseRadius]=layers[ring];
    const upper=Math.max(0,(ring-2)/(layers.length-3));
    const phase=noise(seed,ring,0,3)*.72;
    for(let i=0;i<sides;i++){
      const a=(i+phase)*Math.PI*2/sides+(noise(seed,ring,i,2)-.5)*.035;
      const radiusNoise=.17*(noise(seed,ring,i,1)-.5);
      const broad=.09*Math.sin(a*3+seed*1.7)+.055*Math.cos(a*5-seed*.8);
      const radial=baseRadius*(1+broad+radiusNoise+profile.elongation*Math.cos(a-seed*.63));
      const crest=upper*(profile.crest*lobe(a,crestAngle,7.5)-profile.notch*lobe(a,fractureAngle,14));
      const y=baseY*profile.height+crest+(noise(seed,ring,i,4)-.5)*.07*upper;
      const drift=ring*.025;
      points.push(new THREE.Vector3(
        Math.cos(a)*radial+drift*Math.sin(seed+ring),
        y,
        Math.sin(a)*radial+drift*.7*Math.cos(seed*1.4+ring)
      ));
    }
  }

  const geometry=new ConvexGeometry(points),position=geometry.getAttribute('position');
  const palette=[
    ['#d5edf1','#c2e4e9','#aed9e2','#9bcdd9'],
    ['#95c2cf','#7eafbf','#699caf','#57899f'],
    ['#5d8297','#4e7289','#3e637d','#35566f']
  ].map(band=>band.map(color=>new THREE.Color(color)));
  const colors=[];
  for(let i=0;i<position.count;i+=3){
    const a=new THREE.Vector3().fromBufferAttribute(position,i);
    const b=new THREE.Vector3().fromBufferAttribute(position,i+1);
    const c=new THREE.Vector3().fromBufferAttribute(position,i+2);
    const normal=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize();
    const height=(a.y+b.y+c.y)/3,hash=noise(seed,Math.floor(i/3),i,5);
    const band=height>.015?0:height>-.30?1:2;
    const shade=Math.abs(normal.y)>.65?1:Math.abs(normal.y)>.28?.88:.76;
    const color=palette[band][Math.min(3,Math.floor(hash*4))].clone().multiplyScalar(shade);
    colors.push(color.r,color.g,color.b,color.r,color.g,color.b,color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  return geometry;
}

function iceGeometry(seed=1){
  const sides=44;
  // Field ice stays broad and close to the sea. The impact berg has a deep
  // submerged body, a broken upper wall and several offset ridgelines.
  const rings=[
    {y:-.80,r:.40,shift:.025,phase:.00},
    {y:-.62,r:.64,shift:.035,phase:.31},
    {y:-.40,r:.83,shift:.055,phase:.66},
    {y:-.17,r:.96,shift:.075,phase:.19},
    {y:.06,r:.98,shift:.10,phase:.52},
    {y:.28,r:.91,shift:.125,phase:.04},
    {y:.49,r:.78,shift:.15,phase:.43},
    {y:.67,r:.59,shift:.175,phase:.78},
    {y:.82,r:.40,shift:.19,phase:.26},
    {y:.93,r:.23,shift:.20,phase:.61},
    {y:1.00,r:.09,shift:.20,phase:.14}
  ];

  const points=[];
  const crestAngle=seed*.71+.28;
  const secondCrest=seed*-.53+2.18;
  const fractureAngle=seed*1.07+4.35;
  const wallAngle=seed*.37+1.44;
  for(let r=0;r<rings.length;r++){
    const ring=rings[r];
    for(let i=0;i<sides;i++){
      const a=(i+ring.phase)*Math.PI*2/sides;
      const broad=.12*Math.sin(a*3+seed*1.7)+.068*Math.cos(a*5-seed*.8);
      const chipped=.095*(noise(seed,r,i,1)-.5)+.035*Math.sin(a*11+seed*1.4);
      const radial=1+broad+chipped;
      const upper=Math.max(0,(r-3)/(rings.length-4));
      const peakA=lobe(a,crestAngle,7.5),peakB=lobe(a,secondCrest,11);
      const notch=lobe(a,fractureAngle,15);
      const wall=lobe(a,wallAngle,9);
      // A high, offset ridge, a lower shoulder and a deep notch break the
      // impact silhouette, with a high offset ridge and a steep broken wall.
      const ridge=upper*(.34*peakA+.19*peakB-.22*notch+.10*wall);
      const sideWall=upper*.12*wall;
      const yJitter=(noise(seed,r,i,2)-.5)*.075*upper;
      const cx=ring.shift*Math.sin(seed*1.3+r*.42),cz=ring.shift*.7*Math.cos(seed+r*.34);
      const taper=r===0?.93+.06*Math.sin(a*2+seed):1;
      points.push(new THREE.Vector3(
        Math.cos(a)*(ring.r*radial*taper+sideWall)+cx,
        ring.y+ridge+yJitter,
        Math.sin(a)*(ring.r*radial*taper+sideWall)+cz
      ));
    }
  }

  const palettes=[
    ['#d8edf2','#c7e4ea','#b6d9e2','#a6cfda'],
    ['#a8cfda','#90bccb','#79a9bb','#6795aa'],
    ['#789fb1','#648ba1','#527991','#41677f'],
    ['#52758d','#42647c','#35566e','#2d4c65']
  ];
  const colorBands=palettes.map(band=>band.map(color=>new THREE.Color(color)));
  const positions=[],colors=[];
  const pushTriangle=(a,b,c,ringIndex,sector)=>{
    positions.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
    const height=(a.y+b.y+c.y)/3;
    const ab=new THREE.Vector3().subVectors(b,a),ac=new THREE.Vector3().subVectors(c,a);
    const faceNormal=ab.cross(ac).normalize();
    const upward=Math.abs(faceNormal.y);
    const hash=noise(seed,ringIndex,sector,3);
    const band=height>.30?0:height>-.08?1:height>-.46?2:3;
    // Up-facing ice catches the moonlight; steep fractured walls hold colder,
    // darker blues. Vertex colours add facet contrast without texture cost.
    const shade=upward>.65?1:upward>.28?.89:.77;
    const shadeIndex=Math.min(3,Math.floor(hash*4));
    const color=colorBands[band][shadeIndex].clone().multiplyScalar(shade);
    colors.push(color.r,color.g,color.b,color.r,color.g,color.b,color.r,color.g,color.b);
  };

  for(let r=0;r<rings.length-1;r++)for(let i=0;i<sides;i++){
    const next=(i+1)%sides,a=points[r*sides+i],b=points[r*sides+next],
      c=points[(r+1)*sides+i],d=points[(r+1)*sides+next];
    if((i+r)%2){pushTriangle(a,b,d,r,i);pushTriangle(a,d,c,r,i+1);}
    else{pushTriangle(a,b,c,r,i);pushTriangle(b,d,c,r,i+1);}
  }
  const bottom=new THREE.Vector3(.08*Math.sin(seed),-.86,.06*Math.cos(seed*1.5));
  for(let i=0;i<sides;i++)pushTriangle(bottom,points[(i+1)%sides],points[i],0,i);
  const crown=new THREE.Vector3(.13*Math.sin(seed*2.1),1.015,-.10*Math.cos(seed*1.4));
  for(let i=0;i<sides;i++)pushTriangle(points[(rings.length-1)*sides+i],points[(rings.length-1)*sides+(i+1)%sides],crown,rings.length-1,i);

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}

function addWaterlineContact(root,sx,sz,seed){
  // A narrow submerged glass-blue skirt makes the water/ice boundary read as
  // wet contact, not a bright outline. Small gaps keep it from looking machined.
  const positions=[],indices=[];const count=96;
  // Match the offset of the iceberg's waterline ring (ring 3) so the contact
  // band stays embedded in the mesh instead of floating beside its hull.
  const centerX=.075*Math.sin(seed*1.3+3*.42),centerZ=.075*.7*Math.cos(seed+3*.34);
  for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count;
    const rough=1+.12*Math.sin(3*a+seed*1.7)+.068*Math.cos(5*a-seed*.8)+.075*(noise(seed,3,i,1)-.5);
    const base=.965*rough;
    const inner=base*.986,outer=base*1.014;
    const x=Math.cos(a),z=Math.sin(a);
    positions.push(
      x*inner*sx+centerX*sx,.025,z*inner*sz+centerZ*sz,
      x*outer*sx+centerX*sx,.025,z*outer*sz+centerZ*sz,
      x*inner*sx+centerX*sx,.15,z*inner*sz+centerZ*sz,
      x*outer*sx+centerX*sx,.15,z*outer*sz+centerZ*sz
    );
  }
  // Join adjacent angular sections into a shallow translucent band. The small
  // gaps reveal the water and keep the contact from reading as a hard wire.
  for(let i=0;i<count;i++){
    if(i%17<2)continue;
    const a=i*4,b=((i+1)%count)*4;
    indices.push(a+1,b+1,b+3,a+1,b+3,a+3); // outer wall
    indices.push(a,b+2,b,a,a+2,b+2); // inner wall
    indices.push(a+2,a+3,b+3,a+2,b+3,b+2); // upper lip
    indices.push(a,a+1,b+1,a,b+1,b); // submerged lip
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const contact=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
    color:'#28536a',roughness:.24,metalness:.035,transparent:true,opacity:.34,
    depthWrite:false,side:THREE.DoubleSide
  }));
  contact.name='submerged-ice-water-contact';root.add(contact);
}

export function create({variant='field'}={}){
  const root=new THREE.Group();root.name=`sea-ice-${variant}`;
  const ice=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.52,metalness:.015,flatShading:true,side:THREE.DoubleSide});
  const list=variant==='iceberg'
    ?[[0,0,0,26,12,18,4.2]]
    :[[-40,0,75,9,2.3,6,1.1,0],[45,0,-40,12,2.1,9,2.6,1],[-90,0,-60,7,2.0,5,3.4,2],[110,0,100,10,2.5,6,5.1,3]];
  for(const [x,y,z,sx,sy,sz,seed,profileIndex=0] of list){
    const geometry=variant==='iceberg'?iceGeometry(seed):floeGeometry(seed,profileIndex);
    const berg=mesh(root,geometry,ice,[x,y,z],`fractured-sea-ice-${variant}-${seed}`);
    berg.scale.set(sx,sy,sz);berg.rotation.y=x*.01;
    if(variant==='iceberg')addWaterlineContact(root,sx,sz,seed);
  }
  return root;
}
