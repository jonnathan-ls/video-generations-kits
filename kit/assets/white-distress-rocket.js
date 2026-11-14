import * as THREE from 'three';

export function create({params={}}={}){
 const root=new THREE.Group();root.name='illustrative-white-distress-rocket';
 const size=32,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1);data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.max(0,Math.exp(-r*r*7)*(1-THREE.MathUtils.smoothstep(r,.6,1))));}
 const map=new THREE.DataTexture(data,size,size);map.needsUpdate=true;
 const particles=Array.from({length:37},(_,i)=>{const material=new THREE.SpriteMaterial({map,color:i===0?'#fff9e4':'#e8efff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});const o=new THREE.Sprite(material);o.scale.setScalar(i===0?1.8:.8);root.add(o);return o;});
 const begin=Number(params.launchAt)||.2,height=Number(params.height)||34;
 root.userData.sample=t=>{const u=t-begin,launch=THREE.MathUtils.clamp(u/1.25,0,1),fall=Math.max(0,u-1.25);particles.forEach((o,i)=>{const angle=i*2.399963,spread=i===0?0:Math.sqrt(i/36)*6,alive=u>=0&&u<4.3;o.visible=alive;o.material.opacity=alive?Math.max(0,Math.min(1,u*6,1-fall/3.05))*(i===0?1:.7):0;const d=fall>0?fall:0;o.position.set(Math.cos(angle)*spread*d*.55,height*(1-(1-launch)**2)-d*d*2.4+Math.sin(angle)*spread*d*.15,Math.sin(angle)*spread*d*.55);});};root.userData.sample(0);return root;
}
