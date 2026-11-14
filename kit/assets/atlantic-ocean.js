import {createOceanVisuals} from './period-ocean-visuals.js';

export function create({params={}}={}){
  return createOceanVisuals({variant:'night',withSky:true,moonVisible:params.moonVisible,cloudCoverage:params.cloudCoverage});
}
