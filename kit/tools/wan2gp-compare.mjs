import {prepareComparison, prepareGuidedComparison, assembleComparison} from '../integrations/wan2gp/comparison.mjs';
try {
  const action = process.argv[2];
  if (action === 'prepare') console.log(`Plano preparado: ${(await prepareComparison()).shots.length} clipes; sem aprovação inferida.`);
  else if (action === 'prepare-guides') console.log(`Guias limpos preparados: ${(await prepareGuidedComparison()).shots.length} clipes.`);
  else if (action === 'assemble-internal') console.log(JSON.stringify(await assembleComparison(),null,2));
  else throw new Error('Uso interno: wan2gp-compare.mjs prepare | prepare-guides | assemble-internal');
} catch (error) { console.error(error.message); process.exitCode = 1; }
