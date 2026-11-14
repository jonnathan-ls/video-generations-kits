export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const smooth=u=>{u=clamp(u);return u*u*(3-2*u);};
export function stageState(kind,t,duration=6){t=clamp(t,0,duration);return {time:t,progress:smooth(t/duration),section:kind==='section'?smooth(t/duration):1,cameraSide:kind==='cut'&&t>=duration/2?1:0};}
