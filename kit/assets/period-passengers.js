import * as THREE from 'three';
import { person } from './period-person-rig.js';

const CROWD = [
  { color: '#394858', trousers: '#242c34', skin: '#bd987f', hairColor: '#312b28', hat: 'bowler', hatColor: '#3b332d', build: 'broad', pose: 'watch-left', coat: 'suit', hair: 'parted', beard: true, x: -.08, yaw: 1.43 },
  { color: '#685342', trousers: '#292722', skin: '#d0ad95', hairColor: '#48382f', hat: 'wide-brim', hatColor: '#625244', build: 'slim', pose: 'clutch', coat: 'suit', hair: 'bun', x: .13, yaw: 1.61 },
  { color: '#77776e', trousers: '#37362f', skin: '#b28d76', hairColor: '#5a5145', hat: 'flat-cap', hatColor: '#55584f', build: 'average', pose: 'look-down', coat: 'worker', hair: 'short', x: -.02, yaw: 1.50 },
  { color: '#293f49', trousers: '#20262c', skin: '#c7a58d', hairColor: '#362c27', hat: 'none', build: 'average', pose: 'brace', coat: 'suit', hair: 'parted', beard: true, x: .09, yaw: 1.76 },
  { color: '#7b6756', trousers: '#332c26', skin: '#cfaa8f', hairColor: '#514338', hat: 'wide-brim', hatColor: '#62564d', build: 'slim', pose: 'reassure', coat: 'dress', hair: 'bun', x: -.11, yaw: 1.34 },
  { color: '#525d5c', trousers: '#202a2d', skin: '#b38e78', hairColor: '#756a5b', hat: 'bowler', hatColor: '#433a34', build: 'broad', pose: 'turn', coat: 'suit', hair: 'short', x: .17, yaw: 1.68 },
  { color: '#615044', trousers: '#27231f', skin: '#c3a086', hairColor: '#302b27', hat: 'flat-cap', hatColor: '#51483e', build: 'average', pose: 'protect', coat: 'worker', hair: 'short', x: -.14, yaw: 1.55 },
  { color: '#4b5968', trousers: '#242a31', skin: '#c2a087', hairColor: '#4c4036', hat: 'bowler', hatColor: '#37404b', build: 'slim', pose: 'watch-right', coat: 'suit', hair: 'parted', x: .04, yaw: 1.84 },
];

export function create({ variant = 'passengers' } = {}) {
  if (variant === 'captain') return person({ captain: true, color: '#26394b', coatStyle: 'uniform', build: 'broad' });
  if (variant === 'steward') {
    return person({ color: '#d3cabb', trouserColor: '#272b31', coatStyle: 'uniform', hatStyle: 'none', pose: 'steady', build: 'slim' });
  }
  if (variant === 'worker') {
    return person({ color: '#54534b', trouserColor: '#292923', coatStyle: 'worker', hatStyle: 'flat-cap', pose: 'brace', build: 'broad', hairStyle: 'short' });
  }
  if (variant === 'seated') {
    return person({ seated: true, color: '#4b5d60', trouserColor: '#242b30', coatStyle: 'suit', hatStyle: 'none', pose: 'rest', build: 'average' });
  }
  if (variant !== 'passengers') return person({ hat: true, color: '#4b5d60' });

  const root = new THREE.Group();
  root.name = 'period-passenger-group';
  const crowd = CROWD.map((look, index) => {
    const figure = person({
      color: look.color,
      trouserColor: look.trousers,
      skinColor: look.skin,
      hairColor: look.hairColor,
      hatStyle: look.hat,
      hatColor: look.hatColor,
      build: look.build,
      pose: look.pose,
      coatStyle: look.coat,
      hairStyle: look.hair,
      beard: look.beard ?? false,
    });
    figure.name = `passenger-${String(index + 1).padStart(2, '0')}`;
    figure.position.set(look.x, 0, (index - 3.5) * 1.05);
    figure.rotation.y = look.yaw;
    // Scale changes are restrained so the figures still belong to one scene.
    const height = [1, .94, 1.03, .98, .91, 1.06, .96, 1.01][index];
    figure.scale.set(1, height, 1);
    root.add(figure);
    return { figure, index, baseX: look.x, baseY: figure.rotation.y };
  });

  root.userData.sample = (t = 0) => {
    for (const { figure, index, baseX, baseY } of crowd) {
      figure.userData.sample(t);
      // Sparse, asynchronous glances and weight shifts keep the crowd alive
      // without giving every person the same loop or changing with frame order.
      figure.position.x = baseX + Math.sin(t * .46 + index * 1.71) * .012;
      figure.rotation.y = baseY + Math.sin(t * .34 + index * 1.27) * .018;
    }
  };
  root.userData.sample(0);
  return root;
}
