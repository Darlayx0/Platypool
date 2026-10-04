// 3D Claymation Player Biplane — hero asset
// Local axes: nose = +X, up = +Y, wingspan = Z (toward camera / away).
import * as THREE from 'three';
import { clayMat, glowMat } from './ClayMaterial.js';
import { fuselageGeo, wingGeo, slabGeo, capsuleGeo, sphereGeo, cylX, sculpt } from './ClayGeo.js';

const WEAPON_GLOW = {
  NORMAL: '#ffe082',
  SPREAD: '#ff5252',
  LASER: '#00e5ff',
  HOMING: '#69f0ae',
  FLAK: '#ffd54f',
  PLASMA: '#e040fb'
};

function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

export class PlayerModel {
  constructor() {
    this.root = new THREE.Group();      // world position
    this.pitchGroup = new THREE.Group(); // nose up/down (Z)
    this.rollGroup = new THREE.Group();  // banking (X)
    this.body = new THREE.Group();       // squash & stretch
    this.root.add(this.pitchGroup);
    this.pitchGroup.add(this.rollGroup);
    this.rollGroup.add(this.body);

    // Smoothed kinematic state
    this.vRoll = 0;
    this.vPitch = 0;
    this.roll = 0;
    this.pitch = 0;
    this.lastX = null;
    this.lastY = null;
    this.squash = 1;

    this.build();
  }

  build() {
    const white = clayMat('#f1ece4');
    const cream = clayMat('#e3d9c6');
    const red = clayMat('#e53935');
    const darkRed = clayMat('#a31b1b');
    const steel = clayMat('#78909c', { roughness: 0.45, clearcoat: 0.3 });
    const dark = clayMat('#2b2f33', { roughness: 0.8 });
    const wingMat = clayMat('#d7dde0');
    const wood = clayMat('#8d5a3b', { roughness: 0.7 });
    const yellow = clayMat('#ffca28');
    const glass = clayMat('#ffe58a', { roughness: 0.15, clearcoat: 1, sheen: 0, transparent: true, opacity: 0.82, bump: false });
    const b = this.body;

    // --- Fuselage (teardrop lathe, slightly taller than wide) ---
    const fus = mesh(sculpt(fuselageGeo(64, [
      [0.5, 0.0], [5.5, 0.03], [7.5, 0.15], [10.5, 0.4], [13.0, 0.62],
      [13.4, 0.78], [12.6, 0.9], [10.5, 0.97], [8.5, 1.0]
    ], 32, 1.0, 0.92), 0.45, 0.14, 1.3), white);
    b.add(fus);

    // Red racing band wrapping the fuselage (true 3D ring, visible while rolling)
    const band = mesh(sculpt(fuselageGeo(10, [[12.9, 0], [13.5, 0.2], [13.6, 0.8], [13.0, 1]], 32, 1.0, 0.94), 0.25, 0.2, 4), red);
    band.position.x = 9;
    b.add(band);
    const band2 = mesh(fuselageGeo(4, [[7.2, 0], [7.9, 0.5], [7.4, 1]], 28, 1.0, 0.94), red);
    band2.position.x = -18;
    b.add(band2);

    // Engine cowling + exhaust stubs
    const cowl = mesh(sculpt(cylX(9.5, 12.8, 9, 28), 0.3, 0.3, 2), steel);
    cowl.position.x = 28;
    b.add(cowl);
    for (const s of [-1, 1]) {
      const stub = mesh(cylX(1.6, 2, 7, 10), dark);
      stub.position.set(20, -6, s * 11);
      stub.rotation.y = s * 0.2;
      b.add(stub);
    }

    // Tail nozzle (recessed)
    const nozzle = mesh(cylX(5.2, 4.2, 4, 20), dark);
    nozzle.position.x = -31.5;
    b.add(nozzle);

    // --- Cockpit: rim + glass bubble + pilot ---
    const rim = mesh(new THREE.TorusGeometry(7.5, 1.8, 10, 24), wood);
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1.25, 1, 1);
    rim.position.set(2, 11.5, 0);
    b.add(rim);
    const pilotHead = mesh(sphereGeo(4.6, 1, 1, 1, 18), clayMat('#8d6e63'));
    pilotHead.position.set(1, 15, 0);
    b.add(pilotHead);
    const goggles = mesh(new THREE.TorusGeometry(4.7, 0.9, 8, 18), clayMat('#3e2723'));
    goggles.position.set(1, 15.6, 0);
    goggles.rotation.y = Math.PI / 2;
    b.add(goggles);
    const scarf = mesh(sculpt(capsuleGeo(1.6, 10, 'x'), 0.3, 0.5, 9), red);
    scarf.position.set(-7, 12.5, 2);
    scarf.rotation.z = 0.15;
    this.scarf = scarf;
    b.add(scarf);
    const canopy = mesh(sphereGeo(8, 1.3, 0.75, 1, 24), glass, false);
    canopy.position.set(6, 13, 0);
    b.add(canopy);

    // --- Wings (biplane) ---
    const upper = mesh(sculpt(wingGeo(86, 18, 4.2, 0.78, 1.5), 0.35, 0.09, 2), wingMat);
    upper.position.set(6, 21, 0);
    b.add(upper);
    const lower = mesh(sculpt(wingGeo(74, 15, 3.8, 0.75, 1), 0.35, 0.09, 5), cream);
    lower.position.set(4, -8, 0);
    b.add(lower);

    // Red wingtip caps
    this.tipLights = [];
    for (const [wy, span, wx] of [[21, 86, 6], [-8, 74, 4]]) {
      for (const s of [-1, 1]) {
        const cap = mesh(sphereGeo(4.2, 2.1, 0.75, 1.1, 18), red);
        cap.position.set(wx - 1, wy, s * (span / 2 - 3));
        b.add(cap);
      }
    }
    // Weapon energy pods (upper wingtips) — colored by active weapon
    this.weaponPodMats = {};
    for (const key of Object.keys(WEAPON_GLOW)) this.weaponPodMats[key] = glowMat(WEAPON_GLOW[key]);
    this._podWeapon = null;
    for (const s of [-1, 1]) {
      const pod = new THREE.Mesh(sphereGeo(2.6, 1, 1, 1, 14), glowMat('#ffe082'));
      pod.position.set(10, 21, s * 40);
      b.add(pod);
      this.tipLights.push(pod);
    }

    // Interplane struts (wood) + cross wires
    for (const s of [-1, 1]) {
      for (const dx of [-4, 10]) {
        const strut = mesh(new THREE.CylinderGeometry(1.2, 1.2, 29, 8), wood);
        strut.position.set(dx, 6.5, s * 27);
        strut.rotation.x = -s * 0.06;
        b.add(strut);
      }
      // cabane struts from fuselage to upper wing
      const cab = mesh(new THREE.CylinderGeometry(0.9, 0.9, 10, 6), steel);
      cab.position.set(8, 16, s * 6);
      cab.rotation.x = s * 0.4;
      b.add(cab);
    }

    // Wing guns
    for (const s of [-1, 1]) {
      const gun = mesh(cylX(1.5, 1.8, 16, 10), steel);
      gun.position.set(16, -10, s * 18);
      b.add(gun);
      const bore = mesh(cylX(0.8, 0.8, 0.6, 8), dark);
      bore.position.set(24.2, -10, s * 18);
      b.add(bore);
    }

    // --- Tail ---
    const hStab = mesh(sculpt(wingGeo(36, 11, 2.8, 0.7, -2), 0.25, 0.15, 7), wingMat);
    hStab.position.set(-26, 2, 0);
    b.add(hStab);
    const fin = mesh(sculpt(slabGeo(14, 16, 2.8, 5), 0.25, 0.2, 3), red);
    fin.position.set(-26, 10, 0);
    fin.rotation.z = -0.25;
    b.add(fin);
    const finStripe = mesh(slabGeo(8, 3, 3.2, 1.4), white);
    finStripe.position.set(-25.4, 12, 0);
    finStripe.rotation.z = -0.25;
    b.add(finStripe);

    // --- Landing gear ---
    for (const s of [-1, 1]) {
      const leg = mesh(new THREE.CylinderGeometry(1, 1, 12, 6), steel);
      leg.position.set(10, -15, s * 7);
      leg.rotation.x = s * 0.35;
      b.add(leg);
      const wheel = mesh(new THREE.TorusGeometry(3.6, 2, 10, 18), dark);
      wheel.position.set(10, -21, s * 9.5);
      b.add(wheel);
      const hub = mesh(sphereGeo(1.8, 1, 1, 0.6, 10), yellow);
      hub.position.set(10, -21, s * 9.5);
      b.add(hub);
    }

    // --- Propeller assembly ---
    this.prop = new THREE.Group();
    this.prop.position.x = 34;
    b.add(this.prop);
    const spinner = mesh(sculpt(sphereGeo(6.5, 1.5, 1, 1, 20), 0.2, 0.4, 1), red);
    spinner.position.x = 2;
    this.prop.add(spinner);
    this.blades = new THREE.Group();
    this.prop.add(this.blades);
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Group();
      blade.rotation.x = (i / 3) * Math.PI * 2;
      const bl = mesh(sculpt(capsuleGeo(2.4, 18, 'y'), 0.2, 0.4, i), wood);
      bl.scale.set(0.55, 1, 1.25);
      bl.position.y = 11;
      bl.rotation.y = 0.5;
      blade.add(bl);
      const tip = mesh(sphereGeo(2.5, 0.6, 1.1, 1.3, 10), yellow);
      tip.position.y = 21;
      blade.add(tip);
      this.blades.add(blade);
    }
    // motion-blur disc
    this.propDisc = new THREE.Mesh(
      new THREE.CircleGeometry(23, 40),
      new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })
    );
    this.propDisc.rotation.y = Math.PI / 2;
    this.propDisc.position.x = 0.5;
    this.prop.add(this.propDisc);

    // --- Exhaust flame (layered additive clay plumes) ---
    this.flame = new THREE.Group();
    this.flame.position.x = -33;
    b.add(this.flame);
    const coneGeo = new THREE.ConeGeometry(1, 1, 18, 1, true);
    coneGeo.translate(0, 0.5, 0);   // base at origin, tip at +Y
    coneGeo.rotateZ(Math.PI / 2);   // tip now points toward -X (behind the plane)
    this.flameOuter = new THREE.Mesh(coneGeo, glowMat('#ff7a1a', 0.75));
    this.flameMid = new THREE.Mesh(coneGeo, glowMat('#ffd54f', 0.85));
    this.flameCore = new THREE.Mesh(coneGeo, glowMat('#ffffff', 0.9));
    this.flame.add(this.flameOuter, this.flameMid, this.flameCore);
    this.flameMats = [this.flameOuter.material, this.flameMid.material];

    // pre-made boosted materials
    this.boostOuter = glowMat('#00b8d4', 0.75);
    this.boostMid = glowMat('#84ffff', 0.85);
    this.normOuter = this.flameOuter.material;
    this.normMid = this.flameMid.material;

    // Slightly larger than legacy sprite to fill same hitbox visually
    this.body.scale.setScalar(0.86);
  }

  /**
   * Sync model to the gameplay entity. Gameplay coordinates are screen pixels (y down).
   */
  update(player, dt) {
    dt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    const tick = player.engineTick || 0;
    const boosted = Boolean(player.speedBoostActive && player.speedBoostTimeLeft > 0);

    // Velocity from positional delta (works for keyboard, mouse, touch)
    const vx = this.lastX === null ? 0 : (player.x - this.lastX) / dt;
    const vy = this.lastY === null ? 0 : (player.y - this.lastY) / dt;
    this.lastX = player.x;
    this.lastY = player.y;

    // Targets: climb -> nose up, bank strongly into vertical maneuvers (reveal wing tops/bottoms)
    const vyN = Math.max(-1, Math.min(1, vy / 460));
    const vxN = Math.max(-1, Math.min(1, vx / 460));
    const targetPitch = -vyN * 0.38 + vxN * 0.06 + (boosted ? 0.04 : 0);
    const targetRoll = vyN * 0.95 + (player.roll || 0) * 0.3;

    // Critically-damped-ish springs with slight overshoot (plasticine elasticity)
    const k = 120, c = 16;
    this.vRoll += ((targetRoll - this.roll) * k - this.vRoll * c) * dt;
    this.vPitch += ((targetPitch - this.pitch) * k - this.vPitch * c) * dt;
    this.roll += this.vRoll * dt;
    this.pitch += this.vPitch * dt;

    const bob = Math.sin(tick * 0.06) * 2.2;
    this.root.position.set(player.x, -(player.y + bob), 0);

    // Base 3/4 presentation tilt so the top surfaces read as true volume
    this.rollGroup.rotation.x = 0.42 + this.roll + Math.sin(tick * 0.05) * 0.03;
    this.pitchGroup.rotation.z = this.pitch;
    this.pitchGroup.rotation.y = -0.18 - vxN * 0.12; // slight yaw toward camera

    // Squash & stretch: boost stretches the fuselage, sharp turns squash
    const targetSquash = boosted ? 1.1 : 1 + Math.abs(vxN) * 0.03;
    this.squash += (targetSquash - this.squash) * Math.min(1, dt * 8);
    const breathe = 1 + Math.sin(tick * 0.2) * 0.006;
    this.body.scale.set(0.86 * this.squash * breathe, 0.86 / Math.sqrt(this.squash), 0.86 / Math.sqrt(this.squash));

    // Propeller spin (faster when boosted) — blades fade into disc at speed
    this.blades.rotation.x -= dt * (boosted ? 70 : 42);
    this.propDisc.material.opacity = boosted ? 0.26 : 0.16;

    // Scarf flutter
    this.scarf.rotation.y = Math.sin(tick * 0.5) * 0.35;
    this.scarf.rotation.z = 0.15 + Math.sin(tick * 0.37) * 0.12;

    // Flame
    const len = (boosted ? 30 : 15) + Math.sin(tick * 0.85) * 3 + Math.random() * 2;
    const rad = boosted ? 6 : 4.6;
    this.flameOuter.scale.set(len, rad, rad);
    this.flameMid.scale.set(len * 0.66, rad * 0.62, rad * 0.62);
    this.flameCore.scale.set(len * 0.32, rad * 0.32, rad * 0.32);
    this.flameOuter.material = boosted ? this.boostOuter : this.normOuter;
    this.flameMid.material = boosted ? this.boostMid : this.normMid;

    // Weapon pods: material swap only on weapon change (was a string-key lookup per pod per frame)
    const weapon = player.activeWeapon;
    if (weapon !== this._podWeapon) {
      this._podWeapon = weapon;
      const mat = this.weaponPodMats[weapon] || this.weaponPodMats.NORMAL;
      for (const p of this.tipLights) p.material = mat;
    }
    const podScale = 1 + Math.sin(tick * 0.3) * 0.18;
    for (const p of this.tipLights) p.scale.setScalar(podScale);

    // Invulnerability blink
    const invuln = player.invulnerableTimer > 0;
    this.root.visible = !invuln || Math.floor(tick / 4) % 2 === 0;
  }
}
