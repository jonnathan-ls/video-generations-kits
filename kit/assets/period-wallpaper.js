import * as THREE from 'three';

let wallpaperTexture;
function createTexture(){
  if(wallpaperTexture)return wallpaperTexture;
  const size=512,data=new Uint8Array(size*size*4),tau=Math.PI*2;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size;
    const fine=Math.sin(tau*(u*37+v*11+Math.sin(tau*v*3)*.07));
    const cross=Math.sin(tau*(v*53+u*7));
    const mottle=Math.sin(tau*(u*5+v*3))*Math.sin(tau*(v*7-u*2));
    const n=.965+.012*fine+.009*cross+.012*mottle;
    const i=(y*size+x)*4;
    data[i]=225*n;data[i+1]=215*n;data[i+2]=198*n;data[i+3]=255;
  }
  wallpaperTexture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  wallpaperTexture.colorSpace=THREE.SRGBColorSpace;
  wallpaperTexture.wrapS=wallpaperTexture.wrapT=THREE.RepeatWrapping;
  wallpaperTexture.magFilter=THREE.LinearFilter;
  wallpaperTexture.minFilter=THREE.LinearMipmapLinearFilter;
  wallpaperTexture.generateMipmaps=true;
  wallpaperTexture.anisotropy=8;
  wallpaperTexture.needsUpdate=true;
  return wallpaperTexture;
}

export function createWallFinish(color='#d8c9aa'){
  const map=createTexture();
  const material=new THREE.MeshPhysicalMaterial({color,map,bumpMap:map,bumpScale:.00012,roughness:.9,metalness:0});
  material.name='period-wallpaper';
  return material;
}

export function create(){
  const root=new THREE.Group();
  const sample=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),createWallFinish('#ffffff'));
  sample.name='wallpaper-sample';
  root.add(sample);
  return root;
}
