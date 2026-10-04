// 3D Claymation Enemy Model Library
// Archetype builders (fighter / biplane / drone / spinner / mine / heavy / blimp / jumbo)
// parameterised per enemy type. Templates are built once and cloned (shared geometry/materials).
// Local axes: nose = +X, up = +Y, span = Z.
import * as THREE from 'three';
import { clayMat, glowMat } from './ClayMaterial.js';
import {
  PartBuilder, fuselageGeo, wingGeo, slabGeo, capsuleGeo, sphereGeo, cylX, sculpt
} from './ClayGeo.js';

const DARK = '#263238';
const glassMat = (tint = '#b3e5fc') =>
  clayMat(tint, { roughness: 0.12, clearcoat: 1, sheen: 0, transparent: true, opacity: 0.8, bump: false });

// ---------- shared dynamic parts ----------
function makeFlame(color, len = 12, rad = 3.6, name = 'flame') {
  const g = new THREE.Group();
  g.name = name;
  const geo = new THREE.ConeGeometry(1, 1, 14, 1, true);
  geo.translate(0, 0.5, 0);
  geo.rotateZ(Math.PI / 2);
  const outer = new THREE.Mesh(geo, glowMat(color, 0.7));
  outer.scale.set(len, rad, rad);
  const core = new THREE.Mesh(geo, glowMat('#ffffff', 0.85));
  core.scale.set(len * 0.45, rad * 0.45, rad * 0.45);
  g.add(outer, core);
  g.userData.baseLen = len;
  return g;
}

function makeProp(radius, bladeColor, hubColor, blades = 3) {
  const g = new THREE.Group();
  g.name = 'spin';
  const pb = new PartBuilder();
  const blade = sculpt(capsuleGeo(radius * 0.13, radius * 0.8, 'y'), 0.1, 0.6, 2);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    pb.add(blade, clayMat(bladeColor), [0, Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5], [a, 0.45, 0], [0.5, 1, 1.2]);
  }
  pb.add(sphereGeo(radius * 0.28, 1.4, 1, 1, 14), clayMat(hubColor), [radius * 0.12, 0, 0]);
  pb.build(g);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 28),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })
  );
  disc.rotation.y = Math.PI / 2;
  g.add(disc);
  return g;
}

function makeEye(r, irisColor = '#212121') {
  const g = new THREE.Group();
  g.name = 'eye';
  const white = new THREE.Mesh(sphereGeo(r, 1, 1, 0.8, 18), clayMat('#fafafa', { bump: false, clearcoat: 0.5 }));
  const pupil = new THREE.Mesh(sphereGeo(r * 0.5, 1, 1, 0.6, 14), clayMat(irisColor, { bump: false, clearcoat: 0.8 }));
  pupil.position.z = r * 0.62;
  pupil.name = 'pupil';
  const glint = new THREE.Mesh(sphereGeo(r * 0.14, 1, 1, 1, 8), glowMat('#ffffff'));
  glint.position.set(-r * 0.15, r * 0.2, r * 0.9);
  g.add(white, pupil, glint);
  return g;
}

function makeShield(r, color = '#00e5ff') {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 24),
    new THREE.MeshPhysicalMaterial({
      color, transparent: true, opacity: 0.22, roughness: 0.1, clearcoat: 1,
      emissive: color, emissiveIntensity: 0.35, depthWrite: false
    })
  );
  m.name = 'shield';
  return m;
}

// ---------- archetypes ----------
function fighter(o) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const body = clayMat(o.body), acc = clayMat(o.accent), dark = clayMat(o.dark || DARK);
  const len = o.len || 48;

  const nose = o.nose === 'needle'
    ? [[0.6, 0], [5, 0.05], [7.5, 0.2], [9, 0.45], [8.6, 0.65], [6, 0.85], [2.5, 0.96], [0.3, 1]]
    : [[0.6, 0], [5, 0.05], [8, 0.22], [10, 0.5], [9.6, 0.72], [7.6, 0.9], [4.5, 0.98], [0.5, 1]];
  pb.add(sculpt(fuselageGeo(len, nose, 24, o.tall || 1, 0.9), 0.35, 0.16, o.seed || 1), body);
  // accent band
  pb.add(fuselageGeo(6, [[8.9, 0], [9.7, 0.5], [8.9, 1]], 24, o.tall || 1, 0.92), acc, [len * 0.12, 0, 0]);

  // main wings
  if (o.wing !== false) {
    const span = o.span || 52, chord = o.chord || 15;
    pb.add(sculpt(wingGeo(span, chord, 3, o.taper ?? 0.55, o.sweep ?? 6), 0.3, 0.12, 3), body, [o.wingX ?? -2, o.wingY ?? -2, 0]);
    // wingtip pods / lights
    pb.addPair(sphereGeo(2.8, 1.8, 0.8, 1, 12), acc, [(o.wingX ?? -2) - (o.sweep ?? 6), o.wingY ?? -2, span / 2 - 1.5]);
    if (o.glowLines) {
      pb.addPair(capsuleGeo(0.7, span * 0.32, 'z'), glowMat(o.glowLines), [(o.wingX ?? -2) - 2, (o.wingY ?? -2) + 1.8, span * 0.24]);
    }
  }
  // canards
  if (o.canard) pb.add(wingGeo(18, 6, 2, 0.6, 2), acc, [len * 0.28, 0, 0]);

  // tail
  if (o.twinFin) {
    pb.addPair(slabGeo(11, 12, 2.2, 3.5), acc, [-len * 0.4, 7, 5], [0.25, 0, -0.35]);
  } else if (o.fin !== false) {
    pb.add(sculpt(slabGeo(12, 13, 2.4, 4), 0.2, 0.2, 2), acc, [-len * 0.4, 7, 0], [0, 0, -0.35]);
  }
  pb.add(wingGeo(o.stab || 20, 7, 2.2, 0.6, 2), body, [-len * 0.4, 1, 0]);

  // canopy
  if (o.canopy !== false) pb.add(sphereGeo(6, 1.5, 0.7, 0.85, 18), glassMat(o.canopy || '#b3e5fc'), [len * 0.16, 6.2, 0]);

  // nozzle
  pb.add(cylX(3.8, 3.2, 3, 14), dark, [-len * 0.5, 0, 0]);

  // extras
  if (o.barrel) {
    pb.add(cylX(1.6, 2.2, 26, 10), dark, [len * 0.5 + 10, -1, 0]);
    pb.add(cylX(3, 3, 4, 12), acc, [len * 0.5 + 22, -1, 0]);
  }
  if (o.stinger) pb.add(new THREE.ConeGeometry(3, 14, 12).rotateZ(Math.PI / 2), dark, [-len * 0.5 - 6, 0, 0]);
  if (o.stripes) {
    for (let i = 0; i < 3; i++) pb.add(fuselageGeo(3, [[9.4, 0], [10.2, 0.5], [9.4, 1]], 24, 1, 0.92), dark, [-6 - i * 7, 0, 0], [0, 0, 0], [1, 0.9 - i * 0.1, 0.9 - i * 0.1]);
  }
  if (o.guns) pb.addPair(cylX(1.1, 1.3, 12, 8), dark, [6, -3, 10]);
  if (o.rocky) {
    for (let i = 0; i < 7; i++) {
      const a = i * 1.7;
      pb.add(sculpt(new THREE.DodecahedronGeometry(3 + (i % 3), 0), 0.5, 0.4, i), clayMat(o.accent), [len * 0.25 - i * 4, Math.sin(a) * 7, Math.cos(a) * 7]);
    }
  }
  pb.build(g);

  const flame = makeFlame(o.flame || '#ff9100', o.flameLen || 12, 3.2);
  flame.position.x = -len * 0.5 - 1;
  g.add(flame);
  return g;
}

function biplane(o) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const body = clayMat(o.body), acc = clayMat(o.accent), wood = clayMat('#8d5a3b'), wing = clayMat(o.wing || '#efe6d2');
  pb.add(sculpt(fuselageGeo(44, [[0.5, 0], [4, 0.04], [6, 0.2], [8.5, 0.5], [9.5, 0.75], [8.5, 0.92], [6.5, 1]], 24, 1, 0.92), 0.35, 0.16, 4), body);
  pb.add(sculpt(wingGeo(60, 13, 3, 0.8, 1), 0.3, 0.12, 2), wing, [4, 14, 0]);
  pb.add(sculpt(wingGeo(52, 11, 3, 0.8, 1), 0.3, 0.12, 6), wing, [3, -6, 0]);
  for (const s of [-1, 1]) {
    for (const dx of [-2, 8]) pb.add(new THREE.CylinderGeometry(0.9, 0.9, 20, 6), wood, [dx, 4, s * 19]);
    pb.add(sphereGeo(3, 2, 0.8, 1, 10), acc, [3, 14, s * 29]);
  }
  pb.add(sculpt(slabGeo(10, 11, 2.2, 3.5), 0.2, 0.2, 1), acc, [-19, 6, 0], [0, 0, -0.3]);
  pb.add(wingGeo(22, 7, 2.2, 0.7, -1), wing, [-19, 1, 0]);
  pb.add(cylX(7, 9, 6, 20), clayMat('#78909c', { roughness: 0.45 }), [20, 0, 0]);
  pb.add(new THREE.TorusGeometry(5, 1.3, 8, 18).rotateX(Math.PI / 2), wood, [2, 8.5, 0]);
  pb.add(sphereGeo(3.6, 1, 1, 1, 12), clayMat('#5d4037'), [1, 11, 0]);
  pb.addPair(new THREE.TorusGeometry(2.6, 1.4, 8, 14), clayMat(DARK), [7, -14, 7]);
  pb.build(g);
  const prop = makeProp(15, '#8d5a3b', o.accent);
  prop.position.x = 24;
  g.add(prop);
  return g;
}

function drone(o) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const body = clayMat(o.body), acc = clayMat(o.accent), dark = clayMat(DARK);
  pb.add(sculpt(sphereGeo(15, 1.15, 0.85, 1.1, 28), 0.6, 0.18, o.seed || 2), body);
  pb.add(new THREE.TorusGeometry(15.5, 2.6, 10, 32).rotateX(Math.PI / 2), acc, [0, -1, 0]);
  pb.add(sphereGeo(6, 1, 0.6, 1, 16), dark, [0, -11, 0]);
  if (o.antenna) {
    pb.add(new THREE.CylinderGeometry(0.6, 0.6, 9, 6), dark, [-3, 15, 0]);
    pb.add(sphereGeo(2, 1, 1, 1, 10), glowMat(o.glow || '#ff5252'), [-3, 20, 0]);
  }
  if (o.rocketPods) {
    pb.addPair(capsuleGeo(3.2, 12, 'x'), acc, [-2, -4, 18]);
    pb.addPair(new THREE.ConeGeometry(3.2, 6, 12).rotateZ(-Math.PI / 2), clayMat('#ff1744'), [9, -4, 18]);
  }
  if (o.spikes) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pb.add(new THREE.ConeGeometry(2.5, 8, 10), acc, [Math.cos(a) * 15, Math.sin(a) * 12, 0], [0, 0, a - Math.PI / 2]);
    }
  }
  pb.build(g);

  const eye = makeEye(6.5, o.iris || '#1b1b1b');
  eye.position.set(9, 2, 9);
  eye.rotation.y = 0.6;
  g.add(eye);

  if (o.rotor) {
    const rotor = new THREE.Group();
    rotor.name = 'spinY';
    const rb = new PartBuilder();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      rb.add(capsuleGeo(1.6, 14, 'x'), acc, [Math.cos(a) * 9, 0, Math.sin(a) * 9], [0, -a, 0], [1, 0.4, 1.6]);
    }
    rb.add(new THREE.CylinderGeometry(2, 2, 5, 10), dark, [0, -2, 0]);
    rb.build(rotor);
    rotor.position.y = 16;
    g.add(rotor);
  }
  if (o.orbitRing) {
    const ring = new THREE.Group();
    ring.name = 'spinY';
    const rb = new PartBuilder();
    rb.add(new THREE.TorusGeometry(26, 1.2, 8, 48).rotateX(Math.PI / 2), glowMat(o.glow || '#64ffda', 0.8));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      rb.add(sculpt(sphereGeo(4, 1, 1, 1, 14), 0.3, 0.4, i), acc, [Math.cos(a) * 26, 0, Math.sin(a) * 26]);
    }
    rb.build(ring);
    ring.rotation.z = 0.35;
    g.add(ring);
  }
  if (o.pendulum) {
    const pend = new THREE.Group();
    pend.name = 'pendulum';
    const pbb = new PartBuilder();
    pbb.add(new THREE.CylinderGeometry(0.8, 0.8, 18, 6), dark, [0, -9, 0]);
    pbb.add(sculpt(sphereGeo(7, 1, 1, 1, 18), 0.4, 0.3, 5), acc, [0, -21, 0]);
    pbb.build(pend);
    const core = new THREE.Mesh(sphereGeo(3, 1, 1, 1, 10), glowMat(o.glow || '#b388ff'));
    core.position.set(0, -21, 6);
    pend.add(core);
    pend.position.y = -10;
    g.add(pend);
  }
  return g;
}

function spinner(o) {
  const g = new THREE.Group();
  const saw = new THREE.Group();
  saw.name = 'spinZ';
  const pb = new PartBuilder();
  const body = clayMat(o.body), acc = clayMat(o.accent);
  pb.add(sculpt(new THREE.CylinderGeometry(16, 16, 7, 32).rotateX(Math.PI / 2), 0.4, 0.2, 3), body);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pb.add(new THREE.ConeGeometry(5, 12, 4), acc, [Math.cos(a) * 19, Math.sin(a) * 19, 0], [0, 0, a - Math.PI / 2 - 0.4], [1, 1, 0.5]);
  }
  pb.add(sphereGeo(6, 1, 1, 0.8, 16), clayMat('#fafafa'), [0, 0, 4]);
  pb.build(saw);
  const core = new THREE.Mesh(sphereGeo(3, 1, 1, 1, 12), glowMat('#ffeb3b'));
  core.position.z = 8;
  core.name = 'glow';
  saw.add(core);
  g.add(saw);
  return g;
}

function mine(o) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const body = clayMat(o.body, { roughness: 0.5, clearcoat: 0.3 }), acc = clayMat(o.accent);
  pb.add(sculpt(sphereGeo(12, 1, 1, 1, 24), 0.5, 0.25, 7), body);
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0.7, -0.7, 0], [-0.7, -0.7, 0]];
  const up = new THREE.Vector3(0, 1, 0);
  for (const d of dirs) {
    const v = new THREE.Vector3(...d).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, v);
    const e = new THREE.Euler().setFromQuaternion(q);
    pb.add(new THREE.ConeGeometry(2.6, 8, 10), acc, [v.x * 13, v.y * 13, v.z * 13], [e.x, e.y, e.z]);
  }
  pb.add(new THREE.TorusGeometry(12.3, 1.2, 8, 30), clayMat('#ffca28'));
  pb.build(g);
  const light = new THREE.Mesh(sphereGeo(3, 1, 1, 1, 12), glowMat('#ff1744'));
  light.position.set(0, 4, 11);
  light.name = 'glow';
  g.add(light);
  g.userData.tumble = true;
  return g;
}

function heavy(o) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const body = clayMat(o.body), acc = clayMat(o.accent), dark = clayMat(DARK);
  const steel = clayMat('#90a4ae', { roughness: 0.45, clearcoat: 0.3 });
  const L = o.len || 70;
  pb.add(sculpt(fuselageGeo(L, [[1, 0], [10, 0.04], [15, 0.18], [17, 0.45], [16.5, 0.75], [13, 0.92], [6, 1]], 28, o.tall || 1.05, 1), 0.6, 0.12, o.seed || 5), body);
  // armor plates
  for (let i = 0; i < 3; i++) pb.addPair(sculpt(slabGeo(14, 9, 2.4, 3), 0.25, 0.3, i), acc, [L * 0.2 - i * 15, 2, 15.5], [0, 0, 0]);
  // cockpit window strip
  pb.add(capsuleGeo(2.2, 12, 'z'), glowMat(o.window || '#fff59d'), [L * 0.36, 6, 0], [0, 0, 0], [1, 1, 1]);
  // wings stubs
  pb.add(sculpt(wingGeo(o.span || 62, 18, 4, 0.7, 4), 0.4, 0.12, 9), acc, [-4, -3, 0]);
  // engine nacelles
  const ez = (o.span || 62) * 0.38;
  pb.addPair(sculpt(cylX(5, 6.5, 22, 18), 0.25, 0.3, 2), steel, [-6, -3, ez]);
  pb.addPair(cylX(4.2, 4.2, 2, 14), dark, [-17.5, -3, ez]);
  // tail
  pb.add(sculpt(slabGeo(16, 18, 3, 5), 0.3, 0.2, 4), acc, [-L * 0.42, 12, 0], [0, 0, -0.35]);
  pb.add(wingGeo(32, 10, 3, 0.6, 2), body, [-L * 0.42, 2, 0]);

  if (o.cargo) {
    pb.add(sculpt(new THREE.BoxGeometry(22, 14, 18, 2, 2, 2), 0.8, 0.2, 8), clayMat('#8d6e63'), [0, -20, 0]);
    pb.add(new THREE.BoxGeometry(23, 2, 19), clayMat('#5d4037'), [0, -15, 0]);
    const fruitCols = ['#e53935', '#fdd835', '#43a047', '#e040fb', '#ff9800'];
    for (let i = 0; i < 5; i++) pb.add(sculpt(sphereGeo(4, 1, 1, 1, 14), 0.3, 0.5, i), clayMat(fruitCols[i]), [-8 + i * 4, -12, (i % 2 ? 4 : -4)]);
  }
  if (o.bombBay) {
    for (let i = 0; i < 3; i++) pb.add(capsuleGeo(3.2, 7, 'x'), dark, [8 - i * 10, -17, 0]);
  }
  if (o.mineRack) {
    for (let i = 0; i < 3; i++) pb.add(sculpt(sphereGeo(4.5, 1, 1, 1, 14), 0.3, 0.4, i), clayMat('#37474f'), [6 - i * 11, -18, 0]);
  }
  if (o.armorHeavy) {
    pb.add(sculpt(sphereGeo(14, 2.4, 0.7, 1.3, 24), 0.6, 0.15, 3), acc, [4, 12, 0]);
    pb.addPair(sculpt(slabGeo(40, 14, 4, 5), 0.4, 0.2, 7), steel, [0, -4, 19], [0.25, 0, 0]);
  }
  pb.build(g);

  // engines: propellers or flames
  if (o.props) {
    for (const s of [-1, 1]) {
      const p = makeProp(9, '#5d4037', o.accent, 3);
      p.position.set(6, -3, s * ez);
      g.add(p);
    }
  } else {
    for (const s of [-1, 1]) {
      const f = makeFlame(o.flame || '#ff9100', 14, 3.8, s > 0 ? 'flame' : 'flame2');
      f.position.set(-18.5, -3, s * ez);
      g.add(f);
    }
  }

  if (o.turret) {
    const t = new THREE.Group();
    t.name = 'turret';
    const tb = new PartBuilder();
    tb.add(sculpt(sphereGeo(7, 1.2, 0.8, 1.2, 18), 0.3, 0.3, 1), steel);
    tb.add(cylX(1.8, 2.2, 16, 10), dark, [9, 0, 0]);
    tb.build(t);
    t.position.set(6, 15, 0);
    g.add(t);
  }
  if (o.shield) g.add(makeShield(o.shieldR || 46, o.shieldColor || '#00e5ff'));
  return g;
}

function blimp(o) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const env = clayMat(o.body, { sheen: 0.5 }), acc = clayMat(o.accent), dark = clayMat(DARK);
  pb.add(sculpt(sphereGeo(22, 2.7, 1, 1, 36), 0.9, 0.08, 6), env);
  for (const x of [-30, 0, 30]) {
    const r = 22 * Math.sqrt(Math.max(0.05, 1 - (x / 59.4) ** 2));
    pb.add(new THREE.TorusGeometry(r + 0.3, 1.3, 8, 36).rotateY(Math.PI / 2), acc, [x, 0, 0]);
  }
  // tail fins (cross)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    pb.add(sculpt(slabGeo(18, 14, 2.6, 5), 0.3, 0.2, i), acc, [-50, Math.sin(a) * 12, Math.cos(a) * 12], [a + Math.PI / 2, 0, 0]);
  }
  // gondola
  pb.add(sculpt(capsuleGeo(6, 20, 'x'), 0.4, 0.2, 2), clayMat('#8d6e63'), [4, -25, 0]);
  pb.add(capsuleGeo(1.4, 18, 'x'), glowMat('#fff59d'), [5, -24, 5.5]);
  pb.add(new THREE.CylinderGeometry(0.6, 0.6, 6, 5), dark, [-4, -20, 0]);
  pb.add(new THREE.CylinderGeometry(0.6, 0.6, 6, 5), dark, [12, -20, 0]);
  // side cannons
  pb.addPair(cylX(1.8, 2.4, 14, 10), dark, [6, -26, 7]);
  pb.build(g);
  const p = makeProp(8, '#5d4037', o.accent, 3);
  p.position.set(-22, -25, 0);
  p.rotation.y = Math.PI;
  g.add(p);
  return g;
}

function jumbo(o) {
  const g = heavy({ ...o, len: 90, span: 84, tall: 1.15, shield: false, turret: true });
  const pb = new PartBuilder();
  const acc = clayMat(o.accent), dark = clayMat(DARK);
  // command tower + secondary turrets
  pb.add(sculpt(new THREE.BoxGeometry(18, 16, 14, 2, 2, 2), 0.6, 0.2, 3), acc, [-12, 20, 0]);
  pb.add(capsuleGeo(1.6, 12, 'z'), glowMat(o.window || '#fff59d'), [-3, 23, 0]);
  pb.addPair(cylX(2, 2.6, 20, 10), dark, [30, -10, 14]);
  if (o.style === 'sand') {
    pb.add(sculpt(sphereGeo(14, 1.6, 0.8, 1.2, 20), 0.9, 0.2, 2), clayMat('#d7ccc8'), [10, 18, 0]);
    for (let i = 0; i < 4; i++) pb.add(new THREE.ConeGeometry(4, 10, 6), clayMat('#bcaaa4'), [-20 + i * 10, 26, i % 2 ? 6 : -6]);
  } else if (o.style === 'cyber') {
    for (let i = 0; i < 4; i++) pb.addPair(capsuleGeo(0.8, 26, 'x'), glowMat('#00e5ff'), [-10 + i * 3, 4 - i * 5, 18.5]);
  } else if (o.style === 'dread') {
    pb.add(sculpt(slabGeo(34, 8, 22, 3), 0.5, 0.2, 9), clayMat('#37474f'), [8, 14, 0]);
  }
  pb.build(g);

  const core = new THREE.Mesh(sculpt(sphereGeo(9, 1, 1, 1, 22), 0.3, 0.4, 2), glowMat(o.glow || '#ffea00'));
  core.name = 'glow';
  core.position.set(20, 0, 15);
  g.add(core);

  if (o.style === 'singularity') {
    const hole = new THREE.Mesh(sphereGeo(12, 1, 1, 1, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    hole.position.set(10, 28, 0);
    g.add(hole);
    const ring = new THREE.Group();
    ring.name = 'spinY';
    ring.add(new THREE.Mesh(new THREE.TorusGeometry(20, 2.5, 10, 48).rotateX(Math.PI / 2), glowMat('#e040fb', 0.85)));
    ring.add(new THREE.Mesh(new THREE.TorusGeometry(26, 1, 8, 48).rotateX(Math.PI / 2), glowMat('#7c4dff', 0.7)));
    ring.position.set(10, 28, 0);
    ring.rotation.z = 0.4;
    g.add(ring);
  }
  if (o.shield) g.add(makeShield(o.shieldR || 80, o.shieldColor || '#00e5ff'));
  return g;
}

// ---------- type table ----------
// canon = model's native "radius" used to scale to the gameplay hitbox
export const ENEMY_DEFS = {
  SCOUT:          { a: fighter, canon: 22, body: '#e91e63', accent: '#fce4ec', span: 44, sweep: 8, nose: 'needle', flame: '#ff4081' },
  STINGER:        { a: fighter, canon: 22, body: '#ffb300', accent: '#212121', stripes: true, stinger: true, span: 40, sweep: 10, fin: false, canopy: '#ff6f00', flame: '#ffd740' },
  ACE:            { a: biplane, canon: 26, body: '#ffca28', accent: '#d50000', wing: '#fff8e1' },
  INTERCEPTOR:    { a: fighter, canon: 24, body: '#ab47bc', accent: '#e1bee7', span: 50, sweep: -6, canard: true, twinFin: true, nose: 'needle', flame: '#ea80fc', guns: true },
  SNIPER:         { a: fighter, canon: 24, body: '#512da8', accent: '#b39ddb', barrel: true, span: 46, sweep: 4, twinFin: true, flame: '#7c4dff' },
  RETRO_BIPLANE:  { a: biplane, canon: 25, body: '#ff7043', accent: '#5d4037' },
  SWING_GLIDER:   { a: fighter, canon: 24, body: '#26a69a', accent: '#e0f2f1', span: 70, chord: 11, sweep: 0, taper: 0.8, flameLen: 6, flame: '#64ffda' },
  CANYON_DIVER:   { a: fighter, canon: 24, body: '#ff9800', accent: '#4e342e', span: 40, sweep: 14, nose: 'needle', flame: '#ffab40', dir: true },
  GEYSER_RUSHER:  { a: fighter, canon: 22, body: '#d84315', accent: '#ffccbc', wing: false, stab: 26, twinFin: true, flame: '#ff6d00', flameLen: 20, dir: true },
  FALCON_TRACKER: { a: fighter, canon: 26, body: '#f57c00', accent: '#fff3e0', span: 58, sweep: 12, taper: 0.4, canopy: '#ffe082', flame: '#ffab40', aim: true, dir: true },
  CYBER_PHANTOM:  { a: fighter, canon: 24, body: '#263238', accent: '#00e5ff', dark: '#000a12', span: 52, sweep: 14, twinFin: true, nose: 'needle', glowLines: '#00e5ff', canopy: '#00e5ff', flame: '#00e5ff' },
  VOID_STALKER:   { a: fighter, canon: 26, body: '#311b92', accent: '#b388ff', span: 54, sweep: 16, taper: 0.35, twinFin: true, glowLines: '#b388ff', canopy: '#ea80fc', flame: '#b388ff', aim: true, dir: true },
  METEOR_DIVER:   { a: fighter, canon: 24, body: '#ff5252', accent: '#6d4c41', wing: false, rocky: true, stab: 22, flame: '#ff3d00', flameLen: 22, dir: true },
  ABYSS_ASCENDER: { a: fighter, canon: 24, body: '#ea80fc', accent: '#4a148c', span: 36, sweep: 10, twinFin: true, glowLines: '#ea80fc', flame: '#e040fb', flameLen: 18, dir: true },
  WARP_FLANKER:   { a: fighter, canon: 26, body: '#e040fb', accent: '#f3e5f5', span: 54, sweep: -4, canard: true, twinFin: true, glowLines: '#ffffff', flame: '#ea80fc' },
  DRONE:          { a: drone, canon: 18, body: '#43a047', accent: '#c8e6c9', rotor: true, noYaw: true },
  VORTEX_DRONE:   { a: drone, canon: 24, body: '#00838f', accent: '#00e5ff', rocketPods: true, antenna: true, glow: '#00e5ff', noYaw: true },
  COSMIC_ORBITER: { a: drone, canon: 26, body: '#1de9b6', accent: '#004d40', orbitRing: true, glow: '#64ffda', noYaw: true },
  CYBER_PENDULUM: { a: drone, canon: 24, body: '#7c4dff', accent: '#311b92', pendulum: true, antenna: true, glow: '#b388ff', noYaw: true },
  SPINNER:        { a: spinner, canon: 22, body: '#e53935', accent: '#ffcdd2', noYaw: true },
  MINE:           { a: mine, canon: 16, body: '#37474f', accent: '#90a4ae', noYaw: true },
  GUNSHIP:        { a: heavy, canon: 36, body: '#3949ab', accent: '#c5cae9', turret: true },
  BOMBER:         { a: heavy, canon: 36, body: '#689f38', accent: '#dcedc8', props: true, bombBay: true },
  SHIELD_CRUISER: { a: heavy, canon: 36, body: '#00acc1', accent: '#e0f7fa', shield: true, shieldR: 50 },
  MINE_LAYER:     { a: heavy, canon: 32, body: '#d84315', accent: '#ffccbc', mineRack: true, props: true },
  JUGGERNAUT:     { a: heavy, canon: 40, body: '#37474f', accent: '#ffb300', armorHeavy: true, turret: true, shield: true, shieldR: 56, shieldColor: '#ffb300' },
  FRUIT_CARRIER:  { a: heavy, canon: 32, body: '#ffb300', accent: '#fff8e1', cargo: true, props: true },
  BLIMP:          { a: blimp, canon: 50, body: '#ffe082', accent: '#e53935' },
  JUMBO_DREAD_CRUISER:     { a: jumbo, canon: 52, body: '#455a64', accent: '#cfd8dc', style: 'dread', glow: '#ffea00' },
  JUMBO_SAND_FORTRESS:     { a: jumbo, canon: 52, body: '#a1887f', accent: '#efebe9', style: 'sand', glow: '#ff9100', props: true },
  JUMBO_CYBER_GARGANTUA:   { a: jumbo, canon: 52, body: '#1a237e', accent: '#00e5ff', style: 'cyber', glow: '#00e5ff', shield: true, shieldR: 82 },
  JUMBO_SINGULARITY_TITAN: { a: jumbo, canon: 52, body: '#311b92', accent: '#b388ff', style: 'singularity', glow: '#e040fb', shield: true, shieldR: 84, shieldColor: '#e040fb' }
};

const templates = new Map();

export function getEnemyTemplate(type) {
  let t = templates.get(type);
  if (t) return t;
  const def = ENEMY_DEFS[type] || ENEMY_DEFS.SCOUT;
  t = def.a(def);
  templates.set(type, t);
  return t;
}

export function getEnemyDef(type) {
  return ENEMY_DEFS[type] || ENEMY_DEFS.SCOUT;
}
