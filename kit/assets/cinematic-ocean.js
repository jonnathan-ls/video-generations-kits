import {createOceanVisuals} from './period-ocean-visuals.js';

export function create({variant='night',params={}}={}){
  return createOceanVisuals({variant,withSky:true,moonDirection:params.moonDirection,waterLevel:params.waterLevel,moonVisible:params.moonVisible,cloudCoverage:params.cloudCoverage});
}
