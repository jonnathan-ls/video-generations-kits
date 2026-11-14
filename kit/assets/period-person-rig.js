import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { surface } from './period-surface-materials.js';
import { mat, mesh, beam } from './maritime-shapes.js';

const SHOE_GEOMETRY = new RoundedBoxGeometry(.16, .105, .29, 2, .04);

const PALETTES = {
  skin: '#c0a18b',
  hair: '#453831',
  dark: '#15212b',
  shirt: '#d8d6cb',
  brass: '#bd9f61',
};

function shape(points) {
  const path = new THREE.Shape();
  path.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) path.lineTo(...points[i]);
  path.closePath();
  return new THREE.ShapeGeometry(path, 1);
}

function frontPanel(parent, points, material, z = .139, name = 'cloth-detail') {
  return mesh(parent, shape(points), material, [0, 0, z], name);
}

function addHat(head, style, color, brass) {
  const felt = mat(color);
  if (style === 'none') return;
  if (style === 'officer') {
    mesh(head, new THREE.CylinderGeometry(.126, .133, .045, 20), mat(PALETTES.dark), [0, .125, 0], 'cap-band');
    mesh(head, new THREE.CylinderGeometry(.14, .125, .085, 20), felt, [0, .19, -.01], 'officer-cap');
    const visor = mesh(head, new THREE.SphereGeometry(.145, 18, 10), mat(PALETTES.dark), [0, .11, .052], 'cap-visor');
    visor.scale.set(1, .09, .73);
    mesh(head, new THREE.SphereGeometry(.018, 8, 6), brass, [0, .178, .12], 'cap-badge');
  } else if (style === 'wide-brim') {
    const brim = mesh(head, new THREE.CylinderGeometry(.21, .19, .027, 24), felt, [0, .115, -.005], 'wide-brim');
    brim.scale.set(1, 1, .91);
    mesh(head, new THREE.CylinderGeometry(.105, .13, .11, 18), felt, [0, .18, 0], 'hat-crown');
    mesh(head, new THREE.TorusGeometry(.117, .009, 5, 20), mat('#8a6c4d'), [0, .184, 0], 'hat-band');
    mesh(head, new THREE.SphereGeometry(.023, 9, 7), brass, [.13, .125, .035], 'hat-pin');
  } else if (style === 'flat-cap') {
    const crown = mesh(head, new THREE.SphereGeometry(.143, 16, 10), felt, [0, .128, -.005], 'flat-cap-crown');
    crown.scale.set(1.08, .38, .93);
    mesh(head, new THREE.CylinderGeometry(.123, .123, .018, 18), felt, [0, .1, .035], 'flat-cap-peak').scale.set(1, .7, .58);
  } else if (style === 'bowler') {
    mesh(head, new THREE.CylinderGeometry(.18, .18, .022, 20), felt, [0, .115, 0], 'bowler-brim');
    const crown = mesh(head, new THREE.SphereGeometry(.147, 18, 12), felt, [0, .17, 0], 'bowler-crown');
    crown.scale.set(1, .54, 1);
  } else {
    mesh(head, new THREE.CylinderGeometry(.19, .19, .022, 20), felt, [0, .11, 0], 'hat-brim');
    mesh(head, new THREE.CylinderGeometry(.12, .135, .12, 18), felt, [0, .18, 0], 'hat-crown');
  }
}

function addHair(head, style, hair) {
  const cap = mesh(head, new THREE.SphereGeometry(.119, 16, 10, 0, Math.PI * 2, 0, Math.PI * .34), hair, [0, .021, -.008], 'hair');
  cap.scale.set(.91, 1.13, .9);
  if (style === 'parted' || style === 'short') {
    mesh(head, new THREE.CapsuleGeometry(.012, .058, 2, 6), hair, [-.091, -.018, .018], 'sideburn-left');
    mesh(head, new THREE.CapsuleGeometry(.012, .058, 2, 6), hair, [.091, -.018, .018], 'sideburn-right');
  } else if (style === 'bun') {
    mesh(head, new THREE.SphereGeometry(.038, 12, 8), hair, [0, .075, -.112], 'hair-bun');
    const wave = mesh(head, new THREE.SphereGeometry(.12, 14, 9), hair, [0, .018, -.005], 'pinned-hair');
    wave.scale.set(1.04, .9, .94);
  }
}

/** Deterministic, seekable period figure. `pose` only supplies the idle action;
 * the period-board-actions module can still override the same rig joints. */
export function person({
  captain = false,
  seated = false,
  color = '#394650',
  trouserColor = '#202630',
  shirtColor = '#c9c5b7',
  skinColor = PALETTES.skin,
  hairColor = PALETTES.hair,
  female = false,
  hat = true,
  hatStyle,
  hatColor,
  hairStyle = 'parted',
  beard = false,
  pose = 'watch',
  build = 'average',
  coatStyle = 'suit',
} = {}) {
  const root = new THREE.Group();
  root.name = 'period-person';
  const coat = surface('cloth');
  coat.color.set(color);
  coat.roughness = .82;
  coat.sheen = .13;
  coat.sheenColor.set('#e8ddca');
  coat.sheenRoughness = .94;
  const trouser = surface('cloth');
  trouser.color.set(trouserColor);
  trouser.roughness = .9;
  trouser.sheen = .08;
  trouser.sheenColor.set('#d4cbb9');
  trouser.sheenRoughness = .98;
  const skin = new THREE.MeshPhysicalMaterial({ color: skinColor, roughness: .8, metalness: 0, clearcoat: 0, sheen: .025, sheenRoughness: .94 });
  const hair = mat(hairColor, { roughness: .96 });
  const brass = mat(PALETTES.brass, { metalness: .48, roughness: .42 });
  const dark = mat(PALETTES.dark);
  const shirt = mat(shirtColor, { roughness: .82 });
  const trim = mat(captain ? '#27374b' : color, { roughness: .78 });

  const hips = new THREE.Group();
  hips.position.y = .87;
  hips.name = 'hips';
  root.add(hips);
  const upper = new THREE.Group();
  upper.name = 'upper-body';
  hips.add(upper);

  const halfWidth = build === 'broad' ? .265 : build === 'slim' ? .218 : .24;
  if (coatStyle === 'casual') {
    // A softer, fitted shirt for contemporary everyday characters. The rest of
    // the kit rig (face, joints, footwear and deterministic sampling) is shared.
    const shirtProfile = [
      [0, 0], [.145, 0], [.17, .035], [.175, .13], [.19, .25],
      [.225, .43], [.21, .5], [.145, .575], [.09, .59], [0, .59],
    ].map(([radius, y]) => new THREE.Vector2(radius, y));
    const shirtBody = new THREE.LatheGeometry(shirtProfile, 24);
    mesh(upper, shirtBody, coat, [0, 0, -.008], 'casual-shirt-body').scale.z = .78;
    const collar = mesh(upper, new THREE.TorusGeometry(.063, .009, 7, 24), trim, [0, .558, .016], 'casual-shirt-collar');
    collar.rotation.x = Math.PI / 2;
  } else {
    const torsoShape = new THREE.Shape();
    torsoShape.moveTo(-halfWidth * .78, 0);
    torsoShape.lineTo(-halfWidth, .42);
    torsoShape.quadraticCurveTo(-halfWidth * .91, .57, -halfWidth * .52, .59);
    torsoShape.lineTo(halfWidth * .52, .59);
    torsoShape.quadraticCurveTo(halfWidth * .91, .57, halfWidth, .42);
    torsoShape.lineTo(halfWidth * .78, 0);
    torsoShape.closePath();
    mesh(upper, new THREE.ExtrudeGeometry(torsoShape, {
      depth: .28, bevelEnabled: true, bevelSegments: 2,
      steps: 1, bevelSize: .022, bevelThickness: .018, curveSegments: 8,
    }), coat, [0, 0, -.14], 'coat-body');

    // Front layers break up the broad, single-color silhouette at camera distance.
    frontPanel(upper, [[-.072, .56], [-.04, .48], [0, .39], [.04, .48], [.072, .56]], shirt, .144, 'shirt-front');
    const vestColor = coatStyle === 'worker' ? '#544d43' : captain ? '#26394b' : '#55483c';
    frontPanel(upper, [[-.043, .47], [-.034, .09], [.034, .09], [.043, .47]], mat(vestColor), .151, 'waistcoat');
    frontPanel(upper, [[-.025, .46], [0, .405], [.025, .46], [.011, .17], [-.011, .17]], mat(captain ? '#8d754d' : '#714943'), .158, 'tie');
    frontPanel(upper, [[-.13, .56], [-.075, .54], [-.012, .4], [-.064, .42]], shirt, .159, 'left-collar');
    frontPanel(upper, [[.13, .56], [.075, .54], [.012, .4], [.064, .42]], shirt, .159, 'right-collar');

    const coatButtons = captain ? brass : mat('#332f2a');
    for (let i = 0; i < 4; i++) {
      mesh(upper, new THREE.SphereGeometry(.009, 8, 6), coatButtons, [.058, .15 + i * .087, .166], `coat-button-${i + 1}`);
    }
    for (const side of [-1, 1]) {
      const pocket = frontPanel(upper, [
        [side * .17 - .047, .24], [side * .17 + .047, .24],
        [side * .17 + .04, .19], [side * .17 - .04, .19],
      ], trim, .154, side < 0 ? 'left-pocket' : 'right-pocket');
      if (coatStyle === 'worker') pocket.visible = false;
    }
  }
  if (coatStyle === 'dress') {
    const skirt = new THREE.Shape();
    skirt.moveTo(-.19, .055);
    skirt.lineTo(.19, .055);
    skirt.lineTo(.32, -.43);
    skirt.quadraticCurveTo(0, -.47, -.32, -.43);
    skirt.closePath();
    mesh(upper, new THREE.ExtrudeGeometry(skirt, {
      depth: .19, bevelEnabled: true, bevelSegments: 1,
      steps: 1, bevelSize: .012, bevelThickness: .01, curveSegments: 6,
    }), coat, [0, 0, -.09], 'skirt');
    mesh(upper, new THREE.BoxGeometry(.34, .018, .018), trim, [0, .025, .151], 'waistband');
  }

  const neck = mesh(upper, new THREE.CylinderGeometry(.047, .055, .09, 14), skin, [0, .605, 0], 'neck');
  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = .7;
  head.scale.set(.94, .96, .93);
  upper.add(head);
  const skull = mesh(head, new THREE.SphereGeometry(.116, 24, 16), skin, [0, 0, 0], 'face');
  skull.scale.set(.87, 1.13, .87);
  addHair(head, hairStyle, hair);

  const brows = [];
  const pupils = [];
  for (const side of [-1, 1]) {
    const ear = mesh(head, new THREE.SphereGeometry(.015, 12, 8), skin, [side * .098, -.013, -.002], side < 0 ? 'left-ear' : 'right-ear');
    ear.scale.set(.72, .95, .52);
    const eyeWhite = mesh(head, new THREE.SphereGeometry(.0115, 14, 10), mat('#e4ddd0'), [side * .042, .021, .104], 'eye-white');
    eyeWhite.scale.set(1.05, .64, .48);
    const pupil = mesh(head, new THREE.SphereGeometry(.0055, 12, 8), mat('#302a25'), [side * .042, .021, .113], 'pupil');
    pupils.push(pupil);
    const brow = mesh(head, new THREE.CapsuleGeometry(.004, .026, 2, 6), hair, [side * .043, .052, .09], 'brow');
    brow.rotation.z = Math.PI / 2 + side * .1;
    brows.push(brow);
  }
  const nose = mesh(head, new THREE.SphereGeometry(.0125, 12, 8), skin, [0, -.018, .102], 'nose');
  nose.scale.set(.76, 1.22, 1.15);
  for (const side of [-1, 1]) {
    const moustache = mesh(head, new THREE.SphereGeometry(.021, 12, 8), hair, [side * .018, -.04, .096], 'moustache');
    moustache.scale.set(1, .38, .44);
    moustache.visible = beard;
  }
  if (beard) {
    const chin = mesh(head, new THREE.SphereGeometry(.061, 14, 10), hair, [0, -.074, .052], 'beard');
    chin.scale.set(.82, .42, .52);
  }
  const lips = [];
  for (const side of [-1, 1]) {
    const lip = mesh(head, new THREE.CapsuleGeometry(.0025, .009, 2, 5), mat('#715b50'), [side * .0055, -.057, .094], 'lip');
    lip.rotation.z = Math.PI / 2;
    lips.push({ lip, side });
  }

  const capStyle = hatStyle || (captain ? 'officer' : hat ? (female ? 'wide-brim' : 'bowler') : 'none');
  addHat(head, capStyle, hatColor || (female ? '#55473f' : '#37332e'), brass);
  if (captain) {
    for (const side of [-1, 1]) {
      mesh(upper, new THREE.BoxGeometry(.095, .022, .12), brass, [side * .205, .53, .008], 'shoulder-epaulette');
    }
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? 'left-arm' : 'right-arm';
    arm.position.set(side * halfWidth * .93, .46, 0);
    upper.add(arm);
    if (coatStyle === 'casual') {
      mesh(arm, new THREE.CapsuleGeometry(.055, .045, 4, 12), coat, [side * .023, -.045, 0], 'short-sleeve');
      const sleeveHem = mesh(arm, new THREE.TorusGeometry(.048, .006, 5, 14), shirt, [side * .027, -.092, 0], 'short-sleeve-hem');
      sleeveHem.rotation.x = Math.PI / 2;
    } else {
      mesh(arm, new THREE.CapsuleGeometry(.052, .235, 3, 10), coat, [side * .032, -.13, 0], 'sleeve');
      const cuff = mesh(arm, new THREE.CylinderGeometry(.043, .05, .052, 12), shirt, [side * .047, -.265, .006], 'cuff');
      cuff.rotation.z = side * .08;
    }
    const elbow = new THREE.Group();
    elbow.name = side < 0 ? 'left-elbow' : 'right-elbow';
    elbow.position.set(side * .052, coatStyle === 'casual' ? -.13 : -.29, .008);
    arm.add(elbow);
    mesh(elbow, new THREE.CapsuleGeometry(coatStyle === 'casual' ? .04 : .044, coatStyle === 'casual' ? .16 : .145, 4, 12), coatStyle === 'casual' ? skin : coat, [0, -.074, .025], 'forearm');
    const hand = mesh(elbow, new THREE.SphereGeometry(.038, 12, 9), skin, [0, -.235, .046], 'hand');
    hand.scale.set(.86, 1, .72);
    arms.push({ arm, elbow, hand, side });
  }

  const pelvis = mesh(root, new THREE.SphereGeometry(.2, 16, 12), trouser, [0, .78, -.05], 'trouser-waist');
  pelvis.scale.set(.9, .68, .65);

  const legs = [];
  const kneeSegmentLength = coatStyle === 'casual' ? .395 : .42;
  for (const side of [-1, 1]) {
    if (seated) {
      beam(root, [side * .12, .87, 0], [side * .12, .85, .40], .062, trouser);
      beam(root, [side * .12, .85, .40], [side * .12, .4, .45], .055, trouser);
      mesh(root, SHOE_GEOMETRY, dark, [side * .12, .39, .54], 'shoe');
    } else {
      const thigh = mesh(root, new THREE.CylinderGeometry(.063, .056, 1, 12), trouser, [0, 0, 0], 'thigh');
      const shin = mesh(root, new THREE.CylinderGeometry(.054, .046, 1, 12), trouser, [0, 0, 0], 'shin');
      const foot = mesh(root, SHOE_GEOMETRY, dark, [0, 0, 0], 'shoe');
      legs.push({ side, thigh, shin, foot });
    }
  }

  function segment(part, start, end) {
    const delta = end.clone().sub(start);
    part.position.copy(start).addScaledVector(delta, .5);
    part.scale.y = delta.length();
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  }

  function setFeet(time = 0, walk = false, drop = 0) {
    for (const { side, thigh, shin, foot } of legs) {
      const phase = ((time / 1.2 + (side > 0 ? .5 : 0)) % 1 + 1) % 1;
      let z = .09;
      let y = .06 + drop;
      if (walk) {
        if (phase < .5) z = .3 - phase * 1.2;
        else {
          const u = (phase - .5) * 2;
          z = -.3 + .6 * u;
          y += Math.sin(Math.PI * u) * .13;
        }
      }
      const hip = new THREE.Vector3(side * .12, .87, 0);
      const ankle = new THREE.Vector3(side * .12, y + .06, z);
      const vector = ankle.clone().sub(hip);
      const length = Math.min(.839, vector.length());
      const bend = Math.sqrt(Math.max(0, kneeSegmentLength * kneeSegmentLength - length * length / 4));
      const knee = hip.clone().addScaledVector(vector, .5).add(new THREE.Vector3(
        0, vector.z / vector.length() * bend, -vector.y / vector.length() * bend,
      ));
      segment(thigh, hip, knee);
      segment(shin, knee, ankle);
      foot.position.set(side * .12, y, z + .055);
    }
  }

  const gaitPhase = pose.length * .173;
  const base = {
    upperX: pose === 'brace' ? .055 : pose === 'look-down' ? .035 : 0,
    upperY: pose === 'turn' ? -.12 : pose === 'steady' ? .08 : 0,
    headY: pose === 'watch-left' ? -.34 : pose === 'watch-right' ? .34 : pose === 'look-down' ? -.08 : .04,
  };
  function sample(t = 0) {
    const breath = Math.sin(t * .92 + gaitPhase);
    upper.position.y = Math.sin(t * .92 + gaitPhase) * .009;
    upper.rotation.x = base.upperX + breath * .012;
    upper.rotation.y = base.upperY + Math.sin(t * .37 + gaitPhase) * .022;
    head.rotation.y = base.headY + Math.sin(t * .48 + gaitPhase) * .075;
    head.rotation.x = (pose === 'look-down' ? .12 : 0) + Math.sin(t * .64 + gaitPhase) * .018;
    for (const { arm, elbow, side } of arms) {
      arm.rotation.set(0, 0, side * .025);
      elbow.rotation.set(-.1, 0, 0);
      if (pose === 'brace') {
        arm.rotation.x = -.22 + .025 * breath;
        arm.rotation.z = side * .12;
        elbow.rotation.x = -.4;
      } else if (pose === 'clutch') {
        arm.rotation.x = -.62;
        arm.rotation.z = side * .3;
        elbow.rotation.x = -.72;
      } else if (pose === 'signal' && side > 0) {
        arm.rotation.z = -2.28 + .025 * Math.sin(t * 1.5 + gaitPhase);
        arm.rotation.x = -.22;
        elbow.rotation.x = -.2;
      } else if (pose === 'point' && side > 0) {
        arm.rotation.x = -.92;
        arm.rotation.z = -.1;
        elbow.rotation.x = -.08;
      } else if (pose === 'protect') {
        arm.rotation.x = -.38;
        arm.rotation.z = side * .22;
        elbow.rotation.x = -.62;
      } else if (pose === 'reassure' && side > 0) {
        arm.rotation.x = -.42 + Math.sin(t * .9 + gaitPhase) * .035;
        arm.rotation.z = -.18;
        elbow.rotation.x = -.32;
      } else if (seated) {
        arm.rotation.x = -.47 + Math.sin(t * .52 + gaitPhase) * .012;
        arm.rotation.z = side * .06;
        elbow.rotation.x = -.48;
      } else {
        arm.rotation.x = -.04 + Math.sin(t * .8 + gaitPhase + side) * .018;
      }
    }
    setFeet();
  }

  root.userData.setFeet = setFeet;
  // Optional world-space contacts for authored ladder/rescue actions. Idle and
  // walking poses keep the original setFeet path until a caller opts in.
  root.userData.setFootTargets = (contacts) => {
    root.updateMatrixWorld(true);
    const errors = [];
    for (const { side, thigh, shin, foot } of legs) {
      const world = contacts[side < 0 ? 'left' : 'right'];
      if (!world) continue;
      const sole = root.worldToLocal(new THREE.Vector3(...world));
      const ankle = sole.clone().add(new THREE.Vector3(0, .12, 0));
      const hip = new THREE.Vector3(side * .12, .87, 0);
      const axis = ankle.clone().sub(hip), distance = axis.length();
      if (distance > .84) errors.push({ side, excess: distance - .84 });
      const direction = axis.clone().normalize();
      const pole = new THREE.Vector3(0, 0, 1).addScaledVector(direction, -direction.z).normalize();
      const bend = Math.sqrt(Math.max(0, kneeSegmentLength ** 2 - Math.min(.84, distance) ** 2 / 4));
      const knee = hip.clone().addScaledVector(axis, .5).addScaledVector(pole, bend);
      segment(thigh, hip, knee);
      segment(shin, knee, ankle);
      foot.position.copy(sole).add(new THREE.Vector3(0, .06, .055));
      foot.quaternion.identity();
    }
    root.userData.footContactErrors = errors;
    return errors;
  };
  root.userData.rig = { head, upper, arms, brows, pupils, lips, torso: hips };
  root.userData.sample = sample;
  root.userData.character = { pose, build, coatStyle, hatStyle: capStyle };
  sample(0);
  return root;
}
