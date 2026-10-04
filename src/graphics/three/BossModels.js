// 3D Claymation Boss Models & Actor
// Bosses are built nose +X and placed inside a yawed frame so they face the player (left).
import * as THREE from 'three';
import { clayMat, glowMat } from './ClayMaterial.js';
import { PartBuilder, fuselageGeo, wingGeo, slabGeo, capsuleGeo, sphereGeo, cylX, sculpt } from './ClayGeo.js';

const DARK = '#212b30';
const steel = () => clayMat('#90a4ae', { roughness: 0.42, clearcoat: 0.35 });

function flame(color, len, rad) {
  const g = new THREE.Group();
  g.name = 'flame';
  const geo = new THREE.ConeGeometry(1, 1, 16, 1, true);
  geo.translate(0, 0.5, 0);
  geo.rotateZ(Math.PI / 2);
  const o = new THREE.Mesh(geo, glowMat(color, 0.7));
  o.scale.set(len, rad, rad);
  const c = new THREE.Mesh(geo, glowMat('#ffffff', 0.85));
  c.scale.set(len * 0.45, rad * 0.45, rad * 0.45);
  g.add(o, c);
  g.userData.baseLen = len;
  return g;
}

function turret(name, size, bodyCol, barrels = 2, barrelLen = 46) {
  const t = new THREE.Group();
  t.name = name;
  const pb = new PartBuilder();
  pb.add(sculpt(sphereGeo(size, 1.25, 0.8, 1.15, 22), 0.6, 0.15, 2), clayMat(bodyCol));
  pb.add(new THREE.CylinderGeometry(size * 1.15, size * 1.25, size * 0.4, 24), clayMat(DARK), [0, -size * 0.55, 0]);
  for (let i = 0; i < barrels; i++) {
    const z = (i - (barrels - 1) / 2) * size * 0.55;
    pb.add(cylX(size * 0.18, size * 0.24, barrelLen, 12), clayMat(DARK), [size * 0.5 + barrelLen / 2, size * 0.05, z]);
    pb.add(cylX(size * 0.3, size * 0.3, size * 0.4, 12), steel(), [size * 0.5 + barrelLen, size * 0.05, z]);
  }
  pb.build(t);
  return t;
}

function coreOrb(r, color) {
  const m = new THREE.Mesh(sculpt(sphereGeo(r, 1, 1, 1, 26), r * 0.04, 0.2, 3), glowMat(color));
  m.name = 'core';
  return m;
}

function shield(r, color = '#00e5ff') {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 40, 28),
    new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.25, roughness: 0.1, clearcoat: 1, emissive: color, emissiveIntensity: 0.45, depthWrite: false })
  );
  m.name = 'shield';
  m.visible = false;
  return m;
}

// ---------- Boss builders (native size == px for the listed canon radius) ----------
function buildDreadnought() {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const hull = clayMat('#546e7a'), belt = clayMat('#b71c1c'), deck = clayMat('#cfd8dc'), dark = clayMat(DARK);
  pb.add(sculpt(fuselageGeo(220, [[4, 0], [30, 0.05], [44, 0.2], [50, 0.45], [48, 0.7], [40, 0.88], [22, 0.97], [6, 1]], 36, 0.9, 0.85), 1.6, 0.04, 2), hull);
  pb.add(fuselageGeo(18, [[49, 0], [52, 0.5], [49, 1]], 36, 0.92, 0.87), belt, [10, 0, 0]);
  pb.add(fuselageGeo(10, [[44, 0], [47, 0.5], [44, 1]], 36, 0.92, 0.87), belt, [-50, 0, 0]);
  // bridge superstructure
  pb.add(sculpt(new THREE.BoxGeometry(56, 26, 34, 3, 3, 3), 1.2, 0.08, 4), deck, [-20, 46, 0]);
  pb.add(sculpt(new THREE.BoxGeometry(30, 18, 24, 2, 2, 2), 0.8, 0.1, 5), deck, [-24, 66, 0]);
  pb.add(capsuleGeo(3, 22, 'z'), glowMat('#fff59d'), [-9, 66, 0]);
  for (const x of [-48, -36]) pb.add(cylX(5, 5, 1, 12).rotateZ(Math.PI / 2), dark, [x, 76, 0], [0, 0, 0], [1, 16, 1]);
  // side armor plates & portholes
  for (let i = 0; i < 5; i++) {
    pb.addPair(sculpt(slabGeo(30, 18, 5, 5), 0.6, 0.15, i), deck, [60 - i * 34, -6, 40], [0.15, 0, 0]);
    pb.addPair(sphereGeo(3.4, 1, 1, 0.5, 10), glowMat('#ffe082'), [62 - i * 34, 10, 39]);
  }
  // fins
  pb.add(sculpt(slabGeo(44, 44, 6, 10), 0.8, 0.08, 7), belt, [-96, 40, 0], [0, 0, -0.4]);
  pb.add(sculpt(wingGeo(130, 36, 8, 0.6, 10), 1, 0.05, 8), hull, [-80, -6, 0]);
  // engine block
  pb.addPair(cylX(16, 20, 30, 20), steel(), [-104, -10, 26]);
  pb.build(g);
  for (const z of [-26, 26]) {
    const f = flame('#ff6d00', 40, 13);
    f.position.set(-120, -10, z);
    g.add(f);
  }
  const tt = turret('turretTop', 18, '#78909c', 2, 50);
  tt.position.set(40, 44, 0);
  const tb = turret('turretBottom', 18, '#78909c', 2, 50);
  tb.position.set(40, -44, 0);
  tb.scale.y = -1;
  g.add(tt, tb);
  const core = coreOrb(16, '#ffea00');
  core.position.set(104, 0, 0);
  g.add(core);
  return g;
}

function buildZeppelin() {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const env = clayMat('#bcaaa4', { sheen: 0.6 }), rib = clayMat('#6d4c41'), red = clayMat('#c62828'), dark = clayMat(DARK);
  pb.add(sculpt(sphereGeo(56, 2.5, 1, 1, 44), 2.2, 0.03, 4), env);
  for (const x of [-100, -55, -10, 35, 80]) {
    const r = 56 * Math.sqrt(Math.max(0.04, 1 - (x / 140) ** 2));
    pb.add(new THREE.TorusGeometry(r + 0.5, 3, 10, 48).rotateY(Math.PI / 2), rib, [x, 0, 0]);
  }
  pb.add(new THREE.TorusGeometry(56.5, 4, 10, 64).rotateX(Math.PI / 2).scale(2.5, 1, 1), red);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    pb.add(sculpt(slabGeo(52, 40, 7, 12), 0.8, 0.06, i), red, [-126, Math.sin(a) * 30, Math.cos(a) * 30], [a + Math.PI / 2, 0, 0]);
  }
  // gondola
  pb.add(sculpt(capsuleGeo(18, 90, 'x'), 1, 0.06, 3), clayMat('#8d6e63'), [10, -66, 0]);
  pb.add(capsuleGeo(4, 80, 'x'), glowMat('#ffe082'), [12, -62, 17]);
  for (let i = 0; i < 4; i++) pb.add(cylX(3, 3.6, 24, 10), dark, [-20 + i * 26, -76, 19], [0, -0.2, 0]);
  pb.build(g);

  for (const [x, y, z] of [[-60, -40, 64], [-60, -40, -64], [60, -40, 64], [60, -40, -64]]) {
    const prop = new THREE.Group();
    prop.name = 'spin';
    const p = new PartBuilder();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      p.add(capsuleGeo(3, 22, 'y'), clayMat('#5d4037'), [0, Math.cos(a) * 14, Math.sin(a) * 14], [a, 0.4, 0], [0.5, 1, 1.3]);
    }
    p.add(sphereGeo(6, 1.4, 1, 1, 12), red);
    p.build(prop);
    const nac = new THREE.Mesh(cylX(8, 10, 26, 16), steel());
    nac.position.set(x - 16, y, z);
    nac.castShadow = true;
    g.add(nac);
    prop.position.set(x, y, z);
    g.add(prop);
  }

  const mortar = turret('mortar', 22, '#6d4c41', 1, 40);
  mortar.position.set(10, 56, 0);
  g.add(mortar);

  const hangar = new THREE.Group();
  hangar.name = 'hangar';
  const hb = new PartBuilder();
  hb.add(sculpt(new THREE.BoxGeometry(60, 26, 44, 3, 2, 3), 1, 0.08, 6), clayMat('#4e342e'), [0, 0, 0]);
  hb.add(new THREE.BoxGeometry(40, 14, 2), glowMat('#ff9100'), [0, -2, 23]);
  hb.build(hangar);
  hangar.position.set(-50, -88, 0);
  g.add(hangar);

  const core = coreOrb(14, '#ffea00');
  core.position.set(138, 0, 0);
  g.add(core);
  return g;
}

function buildLeviathan() {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const skin = clayMat('#00695c'), belly = clayMat('#b2dfdb'), plate = clayMat('#263238'), teeth = clayMat('#fafafa');
  pb.add(sculpt(sphereGeo(58, 2.3, 1, 1.05, 48), 2.8, 0.035, 5), skin);
  pb.add(sculpt(sphereGeo(50, 2.1, 0.7, 0.95, 36), 1.6, 0.05, 6), belly, [6, -20, 0]);
  for (let i = 0; i < 7; i++) {
    pb.add(sculpt(sphereGeo(16, 1.6, 0.5, 1.4, 16), 0.8, 0.1, i), plate, [80 - i * 26, 48 - Math.abs(i - 3) * 3, 0], [0, 0, -0.1]);
  }
  for (let i = 0; i < 9; i++) pb.add(new THREE.ConeGeometry(3.6, 12, 8), teeth, [104 + (i % 2) * 4, -8, -32 + i * 8], [0, 0, Math.PI]);
  // gill glow strips
  for (let i = 0; i < 4; i++) pb.addPair(capsuleGeo(1.6, 26, 'y'), glowMat('#00e5ff'), [40 - i * 12, 4, 54 - i * 2], [0, 0, 0.2]);
  // tail flukes
  pb.add(sculpt(wingGeo(120, 40, 8, 0.4, -20), 1, 0.06, 2), skin, [-140, 0, 0], [Math.PI / 2, 0, 0]);
  pb.build(g);

  const eye = new THREE.Group();
  const ew = new THREE.Mesh(sphereGeo(13, 1, 1, 0.8, 22), clayMat('#fff59d', { bump: false, clearcoat: 0.8 }));
  const ep = new THREE.Mesh(sphereGeo(6, 0.6, 1.3, 0.6, 16), clayMat('#000000', { bump: false, clearcoat: 1 }));
  ep.position.z = 9;
  eye.add(ew, ep);
  eye.position.set(84, 22, 46);
  g.add(eye);

  const mkWing = (name, sign) => {
    const w = new THREE.Group();
    w.name = name;
    const wb = new PartBuilder();
    wb.add(sculpt(wingGeo(130, 60, 7, 0.35, 30), 1.2, 0.05, sign + 3), skin, [0, 0, sign * 65], [0, 0, 0]);
    for (let i = 0; i < 3; i++) wb.add(capsuleGeo(2.5, 90 - i * 20, 'z'), plate, [-10 - i * 14, 3, sign * (55 + i * 4)]);
    wb.build(w);
    w.position.set(10, sign * 10, 0);
    w.rotation.x = sign * -0.9;
    w.userData.sign = sign;
    return w;
  };
  g.add(mkWing('wingTop', 1), mkWing('wingBottom', -1));

  const pod = new THREE.Group();
  pod.name = 'pod';
  const pp = new PartBuilder();
  pp.add(sculpt(new THREE.BoxGeometry(52, 22, 34, 2, 2, 2), 0.9, 0.1, 3), plate);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) pp.add(new THREE.ConeGeometry(4, 12, 10).rotateZ(-Math.PI / 2), clayMat('#ff1744'), [26, 12, -10 + c * 10 + r * 0], [0, 0, 0.6 + r * 0.25]);
  pp.build(pod);
  pod.position.set(-30, 62, 0);
  g.add(pod);

  const laser = new THREE.Mesh(sphereGeo(16, 1, 1, 1, 22), glowMat('#00e5ff', 0.85));
  laser.name = 'laserOrb';
  laser.position.set(130, -4, 0);
  laser.visible = false;
  g.add(laser);

  const core = coreOrb(10, '#00e5ff');
  core.position.set(0, 10, 58);
  g.add(core);
  return g;
}

function buildColossus() {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const armor = clayMat('#37474f'), trim = clayMat('#ffab00'), dark = clayMat(DARK);
  pb.add(sculpt(sphereGeo(80, 1.7, 1.1, 1, 48), 3, 0.025, 3), armor);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pb.add(sculpt(slabGeo(50, 30, 10, 8), 1, 0.06, i), clayMat('#546e7a'), [Math.cos(a) * 120, Math.sin(a) * 82, 40], [0, 0.3 * Math.cos(a), a]);
  }
  pb.add(new THREE.TorusGeometry(82, 6, 12, 64).rotateY(Math.PI / 2).scale(1, 1.1, 1), trim, [40, 0, 0]);
  pb.add(new THREE.TorusGeometry(70, 4, 12, 64).rotateY(Math.PI / 2), trim, [-60, 0, 0]);
  pb.addPair(cylX(22, 30, 50, 22), steel(), [-140, 0, 40]);
  pb.build(g);
  for (const z of [-40, 40]) {
    const f = flame('#00e5ff', 60, 18);
    f.position.set(-166, 0, z);
    g.add(f);
  }
  const mkRail = (name, y) => {
    const r = new THREE.Group();
    r.name = name;
    const rb = new PartBuilder();
    rb.add(sculpt(new THREE.BoxGeometry(70, 26, 34, 3, 2, 2), 1, 0.08, 4), armor);
    rb.add(new THREE.BoxGeometry(130, 6, 6), dark, [90, 6, 0]);
    rb.add(new THREE.BoxGeometry(130, 6, 6), dark, [90, -6, 0]);
    rb.add(new THREE.BoxGeometry(110, 2, 2), glowMat('#00e5ff'), [94, 0, 0]);
    rb.build(r);
    r.position.set(40, y, 0);
    return r;
  };
  g.add(mkRail('railTop', 92), mkRail('railBottom', -92));

  const dc = new THREE.Group();
  dc.name = 'droneCore';
  const db = new PartBuilder();
  db.add(new THREE.TorusGeometry(46, 6, 12, 48), trim);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    db.add(sculpt(sphereGeo(10, 1, 1, 1, 16), 0.6, 0.2, i), clayMat('#00838f'), [Math.cos(a) * 46, Math.sin(a) * 46, 0]);
  }
  db.build(dc);
  dc.position.set(0, 0, 84);
  g.add(dc);

  const core = coreOrb(28, '#00e5ff');
  core.position.set(110, 0, 0);
  g.add(core);
  return g;
}

function buildCoreSpawn() {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const flesh = clayMat('#4a148c'), deep = clayMat('#311b92'), ridge = clayMat('#7b1fa2');
  pb.add(sculpt(sphereGeo(62, 1.2, 1, 1, 48), 3, 0.04, 9), flesh);
  pb.add(sculpt(capsuleGeo(40, 70, 'x'), 2, 0.05, 2), deep, [-30, 0, 0]);
  for (let i = 0; i < 6; i++) pb.addPair(sculpt(capsuleGeo(6, 60, 'y'), 0.6, 0.1, i), ridge, [-60 + i * 22, 0, 46], [0.3, 0, 0]);
  pb.build(g);
  const eye = new THREE.Group();
  eye.name = 'eye';
  const white = new THREE.Mesh(sphereGeo(34, 1, 1, 0.75, 32), clayMat('#fafafa', { bump: false, clearcoat: 0.7 }));
  const iris = new THREE.Mesh(sphereGeo(18, 1, 1, 0.6, 26), glowMat('#00e5ff'));
  iris.name = 'core';
  iris.position.z = 18;
  const pupil = new THREE.Mesh(sphereGeo(8, 1, 1.4, 0.6, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  pupil.position.z = 27;
  eye.add(white, iris, pupil);
  eye.position.set(40, 0, 30);
  eye.rotation.y = 0.9;
  g.add(eye);
  const tent = new THREE.Group();
  tent.name = 'tentacles';
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(sculpt(capsuleGeo(7 - i * 0.4, 70, 'x'), 0.8, 0.1, i), ridge);
    t.castShadow = true;
    t.position.set(-90, (i - 2.5) * 22, (i % 2 ? 20 : -20));
    t.userData.phase = i * 0.9;
    tent.add(t);
  }
  g.add(tent);
  return g;
}

const BUILDERS = {
  DREADNOUGHT: [buildDreadnought, 95],
  GOLIATH_ZEPPELIN: [buildZeppelin, 110],
  LEVIATHAN_TITAN: [buildLeviathan, 120],
  OMEGA_COLOSSUS: [buildColossus, 135],
  OMEGA_CORE_SPAWN: [buildCoreSpawn, 75]
};
export const BOSS_COLORS = {
  DREADNOUGHT: ['#546e7a', '#b71c1c'],
  GOLIATH_ZEPPELIN: ['#bcaaa4', '#c62828'],
  LEVIATHAN_TITAN: ['#00695c', '#263238'],
  OMEGA_COLOSSUS: ['#37474f', '#ffab00'],
  OMEGA_CORE_SPAWN: ['#4a148c', '#7b1fa2']
};

export class BossActor {
  constructor(type) {
    const [fn, canon] = BUILDERS[type] || BUILDERS.DREADNOUGHT;
    this.type = type;
    this.canon = canon;
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.tilt.rotation.x = 0.28;
    this.yaw = new THREE.Group();
    this.yaw.rotation.y = Math.PI - 0.22; // face left with 3/4 angle toward camera
    this.motion = new THREE.Group();
    this.body = fn();
    this.root.add(this.tilt);
    this.tilt.add(this.yaw);
    this.yaw.add(this.motion);
    this.motion.add(this.body);

    const shR = { OMEGA_CORE_SPAWN: 110 }[type] || canon * 1.35;
    this.shield = shield(shR, type === 'OMEGA_CORE_SPAWN' ? '#e040fb' : '#00e5ff');
    this.motion.add(this.shield);

    this.parts = {};
    this.body.traverse(o => { if (o.name) (this.parts[o.name] ||= []).push(o); });
    this.coreMats = (this.parts.core || []).map(c => c.material);
    this.rageMat = glowMat('#ff1744');
    this.lastY = null;
    this.vPitch = 0;
    this.pitch = 0;
    this.prevHp = null;
    this.jelly = 0;
    this.time = 0;
  }

  setVisible(name, v) {
    for (const o of this.parts[name] || []) o.visible = v;
  }

  update(b, dt) {
    this.time += dt;
    const t = b.tick || 0;
    const s = (b.radius || this.canon) / this.canon;
    this.root.scale.setScalar(s);

    const vy = this.lastY === null ? 0 : (b.y - this.lastY) / Math.max(dt, 0.001);
    this.lastY = b.y;
    const targetPitch = Math.max(-0.25, Math.min(0.25, -vy / 900));
    this.vPitch += ((targetPitch - this.pitch) * 40 - this.vPitch * 9) * dt;
    this.pitch += this.vPitch * dt;

    let ox = 0, oy = 0;
    if (b.isDying) {
      ox = (Math.random() - 0.5) * 10;
      oy = (Math.random() - 0.5) * 10;
      this.motion.rotation.x += dt * 0.6;
      this.motion.rotation.z = Math.sin(this.time * 9) * 0.06;
    } else {
      this.motion.rotation.x = Math.sin(t * 0.03) * 0.05;
      this.motion.rotation.z = this.pitch;
    }
    const hover = Math.sin(t * 0.04) * 6;
    this.root.position.set(b.x + ox, -(b.y + hover + oy), 0);

    // hit jelly
    const hp = b.currentHp;
    if (this.prevHp !== null && hp < this.prevHp) this.jelly = Math.min(1, this.jelly + 0.35);
    this.prevHp = hp;
    this.jelly = Math.max(0, this.jelly - dt * 3);
    const j = Math.sin(this.time * 38) * 0.035 * this.jelly;
    this.body.scale.set(1 + j, 1 - j, 1 + j);

    // modules
    const vis = (flag, name) => { if (flag !== undefined) this.setVisible(name, Boolean(flag)); };
    vis(b.turretTopAlive, 'turretTop');
    vis(b.turretBottomAlive, 'turretBottom');
    vis(b.mortarAlive, 'mortar');
    vis(b.hangarAlive, 'hangar');
    vis(b.wingTopAlive, 'wingTop');
    vis(b.wingBottomAlive, 'wingBottom');
    vis(b.missilePodAlive, 'pod');
    vis(b.railTopAlive, 'railTop');
    vis(b.railBottomAlive, 'railBottom');
    vis(b.droneCoreAlive, 'droneCore');

    for (const o of this.parts.turretTop || []) o.rotation.z = (b.topTurretAngle ?? Math.PI) - Math.PI;
    for (const o of this.parts.turretBottom || []) o.rotation.z = (b.bottomTurretAngle ?? Math.PI) - Math.PI;
    for (const o of this.parts.mortar || []) o.rotation.z = (b.mortarAngle ?? Math.PI * 0.85) - Math.PI;
    for (const o of this.parts.spin || []) o.rotation.x += dt * 28;
    for (const o of this.parts.droneCore || []) o.rotation.z += dt * 1.4;
    for (const o of this.parts.wingTop || []) o.rotation.x = -0.9 + Math.sin(t * 0.08) * 0.25;
    for (const o of this.parts.wingBottom || []) o.rotation.x = 0.9 - Math.sin(t * 0.08) * 0.25;
    for (const tg of this.parts.tentacles || []) {
      for (const c of tg.children) {
        c.rotation.z = Math.sin(t * 0.1 + c.userData.phase) * 0.35;
        c.rotation.y = Math.cos(t * 0.08 + c.userData.phase) * 0.3;
      }
    }
    for (const f of this.parts.flame || []) {
      f.scale.x = 0.85 + Math.sin(t * 0.7 + f.id) * 0.12 + Math.random() * 0.08;
    }
    for (const o of this.parts.laserOrb || []) {
      o.visible = Boolean(b.isChargingLaser);
      const r = 0.4 + (b.laserChargeRatio || 0) * 1.6 + Math.sin(t * 0.8) * 0.08;
      o.scale.setScalar(r);
    }
    // eye tracking (Omega spawn)
    for (const e of this.parts.eye || []) {
      e.rotation.z = Math.sin(t * 0.05) * 0.15;
    }

    // rage / core pulse
    const cores = this.parts.core || [];
    for (let i = 0; i < cores.length; i++) {
      cores[i].material = b.rageMode ? this.rageMat : this.coreMats[i];
      cores[i].scale.setScalar(1 + Math.sin(t * (b.rageMode ? 0.4 : 0.2)) * 0.12);
    }

    // shield bubble
    this.shield.visible = Boolean(b.isInvulnerable);
    if (this.shield.visible) {
      this.shield.material.opacity = 0.2 + Math.sin(t * 0.3) * 0.08;
      this.shield.rotation.y += dt;
    }
    this.root.visible = !b.dead;
  }
}
