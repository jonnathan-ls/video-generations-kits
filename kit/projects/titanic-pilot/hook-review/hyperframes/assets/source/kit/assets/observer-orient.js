import {create as people} from './period-passengers.js';
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function create(){return people({variant:'captain'});}
export function apply({target},t,params={}){const rig=target.userData.rig;if(!rig)return;const u=ease((t-.3)/1.7),react=ease((t-3)/1.4);rig.head.rotation.y=-.24+.46*u;rig.head.rotation.x=-.025-.025*react;rig.upper.rotation.x=-.01-.025*react;for(const {arm,elbow,side}of rig.arms){arm.rotation.x=-.12-.19*react;arm.rotation.z=side*.035;elbow.rotation.x=-.3-.35*react;}}
