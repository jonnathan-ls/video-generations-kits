export const ARCH_LAYOUT=Object.freeze({
 count:13,totalAngle:180,edgeMargin:0.12,jointGap:0.42,
 outerRadius:2.38,innerRadius:1.78,depth:0.62,centerY:2.15
});

export function archWedgeAngle(){
 const {count,totalAngle,edgeMargin,jointGap}=ARCH_LAYOUT;
 return (totalAngle-(2*edgeMargin)-((count-1)*jointGap))/count;
}

export function makeArchParts(){
 const {count,edgeMargin,jointGap,outerRadius,innerRadius,depth,centerY}=ARCH_LAYOUT;
 const wedgeAngle=archWedgeAngle();
 return Array.from({length:count},(_,index)=>{
  const startAngle=edgeMargin+index*(wedgeAngle+jointGap),endAngle=startAngle+wedgeAngle;
  return {
   id:index===6?'peca_de_fecho':`cunha_${String(index+1).padStart(2,'0')}`,
   shape:'arch_block',outerRadius,innerRadius,startAngle,endAngle,depth,
   position:[0,centerY,0],
   material:{surface:'brick',color:index===6?'#c5845b':index%2===0?'#ae654a':'#b66f52',roughness:0.88}
  };
 });
}

export function makeMortarJointParts(){
 const {count,edgeMargin,jointGap,outerRadius,innerRadius,centerY}=ARCH_LAYOUT;
 const wedgeAngle=archWedgeAngle();
 return Array.from({length:count-1},(_,index)=>({
  id:`argamassa_junta_${String(index+1).padStart(2,'0')}`,
  shape:'arch_block',outerRadius,innerRadius,
  startAngle:edgeMargin+(index+1)*wedgeAngle+index*jointGap,
  endAngle:edgeMargin+(index+1)*wedgeAngle+(index+1)*jointGap,
  depth:ARCH_LAYOUT.depth-0.02,
  position:[0,centerY,0]
 }));
}
