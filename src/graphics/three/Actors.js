// 3D actors: enemies, pickups, instanced bullets and clay debris.
import * as THREE from 'three';
import { clayMat, glowMat } from './ClayMaterial.js';
import { PartBuilder, capsuleGeo, sphereGeo, slabGeo, sculpt } from './ClayGeo.js';
import { getEnemyTemplate, getEnemyDef } from './EnemyModels.js';

const TAU = Math.PI * 2;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/* ============================== ENEMY ACTOR ============================== */
export class EnemyActor {
  constructor(type) {
    this.type = type;
    this.def = getEnemyDef(type);
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.tilt.rotation.x = 0.34; // 3/4 presentation: top surfaces read as volume
    this.yawG = new THREE.Group();
    this.pitchG = new THREE.Group();
    this.rollG = new THREE.Group();
    this.body = getEnemyTemplate(type).clone(true);
    this.root.add(this.tilt);
    this.tilt.add(this.yawG);
    this.yawG.add(this.pitchG);
    this.pitchG.add(this.rollG);
    this.rollG.add(this.body);

    this.parts = {};
    this.body.traverse(o => { if (o.name) (this.parts[o.name] ||= []).push(o); });
  }

  reset(e) {
    this.lastX = null;
    this.lastY = null;
    this.vx = e.vx ?? -1;
    this.vy = e.vy ?? 0;
    this.yaw = (e.vx ?? -1) > 0 ? -0.25 : Math.PI + 0.25;
    this.pitch = 0; this.vPitch = 0;
    this.roll = 0; this.vRoll = 0;
    this.prevHp = e.hp;
    this.jelly = 0;
    this.time = Math.random() * 10;
  }

  update(e, dt) {
    this.time += dt;
    const def = this.def;
    const s = (e.radius || def.canon) / def.canon;
    this.root.scale.setScalar(s);
    this.root.position.set(e.x, -e.y, 0);

    // smoothed velocity from motion
    if (this.lastX !== null) {
      const ivx = (e.x - this.lastX) / dt, ivy = (e.y - this.lastY) / dt;
      if (Math.abs(ivx) < 4000 && Math.abs(ivy) < 4000) {
        const k = Math.min(1, dt * 10);
        this.vx += (ivx - this.vx) * k;
        this.vy += (ivy - this.vy) * k;
      }
    }
    this.lastX = e.x; this.lastY = e.y;
    const speed = Math.hypot(this.vx, this.vy);

    // ---- heading ----
    let targetYaw = this.yaw, targetPitch = 0, targetRoll = 0;
    if (!def.noYaw) {
      let dirX = this.vx, dirY = this.vy;
      if (def.aim && e.aimAngle !== undefined) { dirX = Math.cos(e.aimAngle); dirY = Math.sin(e.aimAngle); }
      if (Math.abs(dirX) > 8 || def.aim) {
        // facing left gets a slight yaw toward the camera so the 3D silhouette reads
        targetYaw = dirX < 0 ? Math.PI + 0.25 : -0.25;
      }
      if (e.isAnchored) {
        targetYaw = Math.PI + 0.25;
      }
      const vyN = Math.max(-1, Math.min(1, this.vy / 380));
      if (def.dir || def.aim) {
        targetPitch = Math.atan2(-dirY, Math.abs(dirX) + 1e-3);
        targetPitch = Math.max(-1.45, Math.min(1.45, targetPitch));
      } else {
        targetPitch = -vyN * 0.35;
      }
      targetRoll = vyN * 0.85 * (targetYaw > 1.5 ? -1 : 1);
    } else {
      targetRoll = Math.max(-0.4, Math.min(0.4, this.vx / 900));
      targetPitch = Math.max(-0.3, Math.min(0.3, -this.vy / 900));
    }

    // real 3D turn-around: interpolate yaw through the camera-facing side
    const dy = wrapAngle(targetYaw - this.yaw);
    this.yaw += dy * Math.min(1, dt * 5);
    this.yawG.rotation.y = this.yaw;

    const k = 110, c = 15;
    this.vPitch += ((targetPitch - this.pitch) * k - this.vPitch * c) * dt;
    this.pitch += this.vPitch * dt;
    this.vRoll += ((targetRoll - this.roll) * k - this.vRoll * c) * dt;
    this.roll += this.vRoll * dt;
    this.pitchG.rotation.z = this.pitch;
    this.rollG.rotation.x = this.roll + Math.sin(this.time * 2.2) * 0.04;

    // hit jelly (squash & stretch)
    if (e.hp < this.prevHp) this.jelly = 1;
    this.prevHp = e.hp;
    this.jelly = Math.max(0, this.jelly - dt * 4);
    const j = Math.sin(this.time * 40) * 0.13 * this.jelly;
    const hpRatio = e.maxHp ? Math.max(0, e.hp / e.maxHp) : 1;
    const shake = hpRatio < 0.35 ? Math.sin(this.time * 31) * 0.05 : 0;
    this.body.scale.set(1 + j, 1 - j, 1 + j * 0.5);
    this.body.rotation.x = shake;

    // ---- animated parts ----
    const P = this.parts;
    if (P.spin) for (const o of P.spin) o.rotation.x += dt * 40;
    if (P.spinY) for (const o of P.spinY) o.rotation.y += dt * (this.type === 'COSMIC_ORBITER' ? 2.5 : 30);
    if (P.spinZ) for (const o of P.spinZ) o.rotation.z -= dt * 14;
    if (P.pendulum) for (const o of P.pendulum) o.rotation.z = Math.sin(this.time * 2.4) * 0.6;
    if (P.glow) for (const o of P.glow) o.scale.setScalar(1 + Math.sin(this.time * 8) * 0.25);
    if (P.flame) {
      const boost = 1 + Math.min(1, speed / 600) * 0.6;
      for (const o of P.flame) o.scale.x = boost * (0.85 + Math.sin(this.time * 30) * 0.1 + Math.random() * 0.12);
    }
    if (P.flame2) for (const o of P.flame2) o.scale.x = 0.9 + Math.random() * 0.2;
    if (P.eye) for (const o of P.eye) o.rotation.x = Math.sin(this.time * 0.9) * 0.15;
    if (P.turret && e.aimAngle !== undefined) {
      for (const o of P.turret) o.rotation.z = Math.sin(this.time) * 0.2;
    }
    if (P.shield) {
      const sr = e.maxShieldHp ? Math.max(0, (e.shieldHp || 0) / e.maxShieldHp) : 0;
      for (const o of P.shield) {
        o.visible = sr > 0;
        o.material.opacity = 0.1 + sr * 0.22 + Math.sin(this.time * 5) * 0.03;
      }
    }
    if (this.body.userData.tumble) {
      this.body.rotation.y += dt * 1.2;
      this.body.rotation.z += dt * 0.7;
    }
  }
}

/* ============================== PICKUPS ============================== */
const WEAPON_COLORS = { SPREAD: '#e53935', LASER: '#1e88e5', HOMING: '#43a047', FLAK: '#fbc02d', PLASMA: '#8e24aa' };
const pickupTemplates = new Map();

function buildCapsule(color) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  pb.add(sculpt(capsuleGeo(12, 20, 'x'), 0.4, 0.3, 2), clayMat(color, { clearcoat: 0.4 }));
  pb.add(new THREE.TorusGeometry(12.3, 2.2, 10, 28).rotateY(Math.PI / 2), clayMat('#fafafa'), [-6, 0, 0]);
  pb.add(new THREE.TorusGeometry(12.3, 2.2, 10, 28).rotateY(Math.PI / 2), clayMat('#fafafa'), [6, 0, 0]);
  pb.build(g);
  const core = new THREE.Mesh(sphereGeo(5, 1, 1, 1, 14), glowMat('#ffffff'));
  core.position.z = 11;
  core.name = 'glow';
  g.add(core);
  const halo = new THREE.Mesh(sphereGeo(22, 1, 1, 1, 20), glowMat(color, 0.18));
  halo.name = 'glow';
  g.add(halo);
  return g;
}

function buildFruit(type, color) {
  const g = new THREE.Group();
  const pb = new PartBuilder();
  const stem = clayMat('#6d4c41'), leaf = clayMat('#43a047');
  const c = clayMat(color, { clearcoat: 0.45 });
  switch (type) {
    case 'CHERRY':
      pb.add(sculpt(sphereGeo(8, 1, 1, 1, 18), 0.2, 0.5, 1), c, [-6, -5, 0]);
      pb.add(sculpt(sphereGeo(8, 1, 1, 1, 18), 0.2, 0.5, 2), c, [6, -6, 2]);
      pb.add(new THREE.CylinderGeometry(0.8, 0.8, 16, 6), stem, [-3, 6, 0], [0, 0, -0.4]);
      pb.add(new THREE.CylinderGeometry(0.8, 0.8, 16, 6), stem, [3, 6, 0], [0, 0, 0.4]);
      pb.add(sphereGeo(4, 1.8, 0.4, 1, 10), leaf, [3, 13, 0]);
      break;
    case 'BANANA':
      pb.add(new THREE.TorusGeometry(13, 4.5, 12, 24, Math.PI * 0.85), c, [0, -6, 0], [0, 0, Math.PI * 0.08]);
      pb.add(new THREE.CylinderGeometry(1.4, 1.4, 5, 6), stem, [-11, 3, 0]);
      break;
    case 'WATERMELON':
      pb.add(sculpt(sphereGeo(14, 1.2, 1, 1, 24), 0.3, 0.3, 4), c);
      for (let i = 0; i < 6; i++) pb.add(new THREE.TorusGeometry(14.2, 1.1, 6, 30).rotateY((i / 6) * Math.PI).scale(1.2, 1, 1), clayMat('#1b5e20'));
      break;
    case 'DRAGONFRUIT':
      pb.add(sculpt(sphereGeo(12, 1, 1.25, 1, 22), 0.3, 0.3, 5), c);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        pb.add(sphereGeo(4, 0.5, 1.6, 1, 8), leaf, [Math.cos(a) * 11, Math.sin(a) * 13, 4], [0, 0, a - Math.PI / 2]);
      }
      break;
    case 'GOLDEN_FRUIT':
      pb.add(sculpt(sphereGeo(13, 1, 1, 1, 26), 0.2, 0.4, 6), clayMat(color, { roughness: 0.25, clearcoat: 1, sheen: 0.8 }));
      pb.add(sphereGeo(5, 1.8, 0.4, 1, 10), leaf, [4, 14, 0], [0, 0, 0.4]);
      break;
    case 'APPLE':
    default:
      pb.add(sculpt(sphereGeo(13, 1.05, 0.95, 1.05, 24), 0.4, 0.3, 7), c);
      pb.add(new THREE.CylinderGeometry(1, 1, 7, 6), stem, [0, 13, 0], [0, 0, 0.2]);
      pb.add(sphereGeo(5, 1.8, 0.35, 1, 10), leaf, [5, 14, 0], [0, 0, 0.5]);
  }
  pb.build(g);
  return g;
}

function buildSpeedBoost() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-4, 14); s.lineTo(8, 14); s.lineTo(2, 3); s.lineTo(10, 3); s.lineTo(-6, -16); s.lineTo(-1, -2); s.lineTo(-9, -2); s.closePath();
  const bolt = new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.6, bevelSegments: 3 });
  bolt.translate(0, 0, -2);
  const pb = new PartBuilder();
  pb.add(bolt, clayMat('#ffd600', { clearcoat: 0.6 }));
  pb.add(new THREE.TorusGeometry(19, 2.6, 10, 36), clayMat('#00b8d4'));
  pb.build(g);
  const halo = new THREE.Mesh(sphereGeo(24, 1, 1, 1, 20), glowMat('#00e5ff', 0.16));
  halo.name = 'glow';
  g.add(halo);
  return g;
}

export class PickupActor {
  constructor(kind, sub, color) {
    const key = kind + ':' + sub;
    let t = pickupTemplates.get(key);
    if (!t) {
      t = kind === 'CAPSULE' ? buildCapsule(WEAPON_COLORS[sub] || '#e53935')
        : kind === 'FRUIT' ? buildFruit(sub, color || '#e53935')
        : buildSpeedBoost();
      pickupTemplates.set(key, t);
    }
    this.kind = kind;
    this.root = new THREE.Group();
    this.tilt = new THREE.Group();
    this.tilt.rotation.x = 0.3;
    this.body = t.clone(true);
    this.root.add(this.tilt);
    this.tilt.add(this.body);
    this.glows = [];
    this.body.traverse(o => { if (o.name === 'glow') this.glows.push(o); });
    this.time = Math.random() * 10;
  }
  reset() {}
  update(c, dt) {
    this.time += dt;
    const bob = this.kind === 'FRUIT' ? 0 : Math.sin(this.time * 3) * 4;
    this.root.position.set(c.x, -(c.y + bob), 0);
    if (this.kind === 'FRUIT') {
      this.body.rotation.z = -(c.rotation || 0);
      this.body.rotation.y = this.time * 1.6;
      // fade near end of life
      this.root.visible = !(c.life !== undefined && c.life < 2.5 && Math.floor(this.time * 8) % 2 === 0);
    } else if (this.kind === 'CAPSULE') {
      this.body.rotation.y = this.time * 2.2;
      this.body.rotation.z = Math.sin(this.time * 1.5) * 0.35;
    } else {
      this.body.rotation.y = this.time * 3;
    }
    const pulse = 1 + Math.sin(this.time * 6) * 0.12;
    for (const g of this.glows) g.scale.setScalar(pulse);
  }
}

/* ============================== BULLETS (instanced) ============================== */
// CSS colour string -> linear RGB triplet, parsed exactly once (THREE.Color.set(string) runs a regex
// plus a colour-space conversion, which used to execute for every instance on every frame).
const _c = new THREE.Color();
const _colorCache = new Map();
function linearRGB(css) {
  let rgb = _colorCache.get(css);
  if (!rgb) {
    _c.set(css);
    rgb = [_c.r, _c.g, _c.b];
    _colorCache.set(css, rgb);
  }
  return rgb;
}

export class BulletLayer {
  constructor(scene, max = 1200) {
    this.max = max;
    const mk = (geo, mat) => {
      const m = new THREE.InstancedMesh(geo, mat, max);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
      m.instanceColor.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      m.count = 0;
      scene.add(m);
      return m;
    };
    const solid = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.38, clearcoat: 0.6, sheen: 0.3, emissive: 0x222222 });
    // unit capsule along X (total length 2, radius 1) and unit sphere
    const cap = new THREE.CapsuleGeometry(1, 2, 4, 12).rotateZ(Math.PI / 2).scale(0.5, 1, 1);
    this.caps = mk(cap, solid);
    this.balls = mk(new THREE.SphereGeometry(1, 16, 12), solid);
    this.halos = mk(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    this.caps.castShadow = this.balls.castShadow = true;
    this._meshes = [this.caps, this.balls, this.halos];
  }

  /**
   * Writes one instance. The transform is Translate(x,-y,z) * RotZ(-ang) * Scale(sx,sy,sz),
   * composed analytically straight into the instance buffer (same matrix as the previous
   * Object3D/Euler path, without the intermediate objects).
   */
  _put(mesh, x, y, z, ang, sx, sy, sz, color) {
    const i = mesh.count;
    if (i >= this.max) return;
    const c = Math.cos(ang), s = -Math.sin(ang); // rotation about Z by -ang
    const m = mesh.instanceMatrix.array;
    const o = i * 16;
    m[o] = c * sx;  m[o + 1] = s * sx; m[o + 2] = 0;  m[o + 3] = 0;
    m[o + 4] = -s * sy; m[o + 5] = c * sy; m[o + 6] = 0;  m[o + 7] = 0;
    m[o + 8] = 0;   m[o + 9] = 0;      m[o + 10] = sz; m[o + 11] = 0;
    m[o + 12] = x;  m[o + 13] = -y;    m[o + 14] = z;  m[o + 15] = 1;

    const rgb = linearRGB(color);
    const col = mesh.instanceColor.array;
    const k = i * 3;
    col[k] = rgb[0]; col[k + 1] = rgb[1]; col[k + 2] = rgb[2];
    mesh.count = i + 1;
  }

  sync(bullets, time) {
    this.caps.count = this.balls.count = this.halos.count = 0;
    for (const b of bullets) {
      const ang = Math.atan2(b.vy || 0, b.vx || 1);
      const r = b.radius || 6;
      const x = b.x, y = b.y;
      if (b.isEnemy) {
        switch (b.type) {
          case 'ENEMY_SNIPER':
            this._put(this.caps, x, y, 0, ang, 36, 3.5, 3.5, '#ff1744');
            this._put(this.halos, x, y, 0, ang, 26, 8, 8, '#ff5252');
            break;
          case 'ENEMY_BOMB':
            this._put(this.balls, x, y, 0, 0, 11, 11, 11, '#5d4037');
            this._put(this.balls, x, y - 9, 0, 0, 3.5, 3.5, 3.5, '#ff3d00');
            this._put(this.halos, x, y - 9, 0, 0, 7 + Math.sin(time * 30) * 2, 7, 7, '#ff9100');
            break;
          case 'ENEMY_MORTAR':
            this._put(this.balls, x, y, 0, 0, 13, 13, 13, '#e65100');
            this._put(this.halos, x, y, 0, 0, 20, 20, 20, '#ff6d00');
            break;
          case 'ENEMY_HOMING':
            this._put(this.caps, x, y, 0, ang, 20, 4, 4, '#d50000');
            this._put(this.balls, x + Math.cos(ang) * 9, y + Math.sin(ang) * 9, 0, 0, 3.5, 3.5, 3.5, '#ffeb3b');
            this._put(this.halos, x - Math.cos(ang) * 12, y - Math.sin(ang) * 12, 0, 0, 7, 7, 7, '#ff9100');
            break;
          default:
            this._put(this.balls, x, y, 0, 0, r, r, r, '#ff7043');
            this._put(this.halos, x, y, 0, 0, r * 1.9, r * 1.9, r * 1.9, '#ffab40');
        }
        continue;
      }
      switch (b.type) {
        case 'SPREAD':
          this._put(this.balls, x, y, 0, ang, 8, 6, 6, '#ef5350');
          this._put(this.halos, x, y, 0, ang, 12, 9, 9, '#ff8a80');
          break;
        case 'LASER':
          this._put(this.caps, x, y, 0, ang, 44, 4.5, 4.5, '#42a5f5');
          this._put(this.halos, x, y, 0, ang, 30, 9, 9, '#40c4ff');
          break;
        case 'HOMING':
          this._put(this.caps, x, y, 0, ang, 22, 4.5, 4.5, '#43a047');
          this._put(this.balls, x + Math.cos(ang) * 10, y + Math.sin(ang) * 10, 0, 0, 4.5, 4.5, 4.5, '#ffee58');
          this._put(this.halos, x - Math.cos(ang) * 12, y - Math.sin(ang) * 12, 0, 0, 7, 7, 7, '#69f0ae');
          break;
        case 'FLAK':
          this._put(this.balls, x, y, 0, time * 6, 14, 14, 14, '#fbc02d');
          this._put(this.balls, x - 8, y - 6, 5, 0, 4, 4, 4, '#ff3d00');
          break;
        case 'FLAK_SHRAPNEL':
          this._put(this.balls, x, y, 0, 0, 5, 5, 5, '#ffb300');
          break;
        case 'PLASMA': {
          const pr = r + Math.sin(time * 20 + x) * 1.5;
          this._put(this.balls, x, y, 0, 0, pr, pr, pr, '#ab47bc');
          this._put(this.halos, x, y, 0, 0, pr + 9, pr + 9, pr + 9, '#e040fb');
          break;
        }
        case 'NORMAL':
        default:
          if (b.boosted) {
            this._put(this.caps, x, y, 0, ang, 24, 3.5, 3.5, '#00e5ff');
            this._put(this.halos, x - 10, y, 0, ang, 26, 5, 5, '#18ffff');
          } else {
            this._put(this.caps, x, y, 0, ang, 18, 3.3, 3.3, '#ffee58');
            this._put(this.halos, x, y, 0, ang, 13, 5, 5, '#ffd54f');
          }
      }
    }
    // Partial GPU upload: send only the live prefix of each buffer instead of the whole capacity.
    const meshes = this._meshes;
    for (let mi = 0; mi < meshes.length; mi++) {
      const m = meshes[mi];
      const n = m.count;
      if (n === 0) continue; // nothing drawn -> nothing to upload
      m.instanceMatrix.clearUpdateRanges();
      m.instanceMatrix.addUpdateRange(0, n * 16);
      m.instanceMatrix.needsUpdate = true;
      m.instanceColor.clearUpdateRanges();
      m.instanceColor.addUpdateRange(0, n * 3);
      m.instanceColor.needsUpdate = true;
    }
  }
}

/* ============================== CLAY DEBRIS ============================== */
export class DebrisSystem {
  constructor(scene, max = 260) {
    this.max = max;
    this.items = [];   // active slots
    this.free = [];    // idle slots
    const geos = [0, 1, 2].map(i => sculpt(new THREE.DodecahedronGeometry(1, 0), 0.18, 1.3, i));
    const baseMat = clayMat('#888888');
    for (let i = 0; i < max; i++) {
      const m = new THREE.Mesh(geos[i % 3], baseMat);
      m.visible = false;
      m.castShadow = true;
      scene.add(m);
      // Preallocated physics record bound to its mesh for the whole lifetime of the system
      this.free.push({ m, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, life: 0, s: 0 });
    }
  }

  burst(x, y, size, colors, count = 10) {
    for (let i = 0; i < count && this.free.length; i++) {
      const d = this.free.pop();
      const m = d.m;
      m.material = clayMat(colors[i % colors.length]);
      const s = size * (0.12 + Math.random() * 0.16);
      m.scale.set(s, s * (0.6 + Math.random() * 0.6), s);
      m.position.set(x + (Math.random() - 0.5) * size * 0.6, -y + (Math.random() - 0.5) * size * 0.6, (Math.random() - 0.5) * size);
      m.visible = true;
      const a = Math.random() * TAU, sp = 120 + Math.random() * 260;
      d.vx = Math.cos(a) * sp - 60;
      d.vy = Math.sin(a) * sp + 120;
      d.vz = (Math.random() - 0.3) * 300;
      d.rx = (Math.random() - 0.5) * 14;
      d.ry = (Math.random() - 0.5) * 14;
      d.life = 1.1 + Math.random() * 0.7;
      d.s = s;
      this.items.push(d);
    }
  }

  update(dt) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const d = items[i];
      const m = d.m;
      d.life -= dt;
      d.vy -= 700 * dt;
      m.position.x += d.vx * dt;
      m.position.y += d.vy * dt;
      m.position.z += d.vz * dt;
      m.rotation.x += d.rx * dt;
      m.rotation.y += d.ry * dt;
      if (d.life < 0.35) m.scale.multiplyScalar(Math.max(0, 1 - dt * 6));
      if (d.life <= 0) {
        m.visible = false;
        this.free.push(d);
        // O(1) swap-and-pop (iteration runs backwards so the swapped-in slot was already processed)
        const last = items.length - 1;
        if (i !== last) items[i] = items[last];
        items.pop();
      }
    }
  }
}
