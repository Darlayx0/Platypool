// Procedural Claymation Graphics Engine for Platypus AI
export class ClayRenderer {
  // Flyweight cache for radial and linear CanvasGradient objects
  static gradientCache = new Map();

  static getRadialGradient(ctx, lx, ly, r0, r1, baseColor, shadowColor) {
    const key = `rad_${Math.round(lx)}_${Math.round(ly)}_${Math.round(r0)}_${Math.round(r1)}_${baseColor}_${shadowColor}`;
    let grad = ClayRenderer.gradientCache.get(key);
    if (!grad) {
      if (ClayRenderer.gradientCache.size > 300) {
        ClayRenderer.gradientCache.clear();
      }
      grad = ctx.createRadialGradient(lx, ly, r0, 0, 0, r1);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, baseColor);
      grad.addColorStop(0.8, baseColor);
      grad.addColorStop(1, shadowColor);
      ClayRenderer.gradientCache.set(key, grad);
    }
    return grad;
  }

  static getLinearGradient(ctx, r, baseColor, shadowColor) {
    const key = `lin_${Math.round(r)}_${baseColor}_${shadowColor}`;
    let grad = ClayRenderer.gradientCache.get(key);
    if (!grad) {
      if (ClayRenderer.gradientCache.size > 300) {
        ClayRenderer.gradientCache.clear();
      }
      grad = ctx.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.7)');
      grad.addColorStop(0.18, baseColor);
      grad.addColorStop(0.8, baseColor);
      grad.addColorStop(1, shadowColor);
      ClayRenderer.gradientCache.set(key, grad);
    }
    return grad;
  }

  /**
   * Helper to draw a shaded clay sphere/blob with 3D depth and specular highlight
   */
  static drawClayBlob(ctx, x, y, radiusX, radiusY, baseColor, shadowColor, lightAngle = -Math.PI / 4) {
    ctx.save();
    ctx.translate(x, y);

    // Organic clay drop shadow
    ctx.beginPath();
    ctx.ellipse(2, 3, radiusX * 1.02, radiusY * 1.02, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // Base body gradient (plasticine bevel with flyweight cache)
    const lx = Math.cos(lightAngle) * radiusX * 0.42;
    const ly = Math.sin(lightAngle) * radiusY * 0.42;
    const maxR = Math.max(radiusX, radiusY);
    const grad = ClayRenderer.getRadialGradient(ctx, lx, ly, radiusX * 0.08, maxR, baseColor, shadowColor);

    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer rim highlight / inner glow
    ctx.lineWidth = Math.max(1.5, radiusX * 0.075);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.stroke();

    // Specular shine 1: soft diffused shine
    ctx.beginPath();
    ctx.ellipse(lx * 0.76, ly * 0.76, radiusX * 0.28, radiusY * 0.20, lightAngle, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    // Specular shine 2: crisp glint point
    ctx.beginPath();
    ctx.ellipse(lx * 0.88, ly * 0.88, Math.max(1.2, radiusX * 0.12), Math.max(1.2, radiusY * 0.09), lightAngle, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Helper to draw a rounded clay capsule / hull
   */
  static drawClayCapsule(ctx, x, y, width, height, baseColor, shadowColor, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }

    const r = height / 2;
    const hw = width / 2;

    ctx.beginPath();
    ctx.moveTo(-hw + r, -r);
    ctx.lineTo(hw - r, -r);
    ctx.arc(hw - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-hw + r, r);
    ctx.arc(-hw + r, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    const grad = ClayRenderer.getLinearGradient(ctx, r, baseColor, shadowColor);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = shadowColor;
    ctx.stroke();

    // Highlight stripe along the top
    ctx.beginPath();
    ctx.moveTo(-hw + r + 4, -r + 3);
    ctx.lineTo(hw - r - 4, -r + 3);
    ctx.lineWidth = Math.max(2, height * 0.15);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw the iconic Player Fighter Plane (Novocastrian style)
   */
  static drawPlayerShip(ctx, x, y, tilt = 0, invulnerable = false, engineTick = 0, weaponType = 'NORMAL') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt * 0.25); // tilt based on vertical movement

    // Invulnerability flashing
    if (invulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shield bubble if invulnerable
    if (invulnerable) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(66, 165, 245, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -engineTick * 4;
      ctx.stroke();
      ctx.fillStyle = 'rgba(33, 150, 243, 0.18)';
      ctx.fill();
      ctx.restore();
    }

    // Engine exhaust clay fire plumes (animated dual-layer)
    const flameSize = 11 + Math.sin(engineTick * 0.8) * 4;
    this.drawClayBlob(ctx, -34 - flameSize * 0.45, 0, flameSize, flameSize * 0.55, '#ff9800', '#d84315');
    this.drawClayBlob(ctx, -28 - flameSize * 0.2, 0, flameSize * 0.65, flameSize * 0.4, '#fff59d', '#f57c00');
    this.drawClayBlob(ctx, -24, 0, 5, 4, '#ffffff', '#ffee58');

    // Tail fin (vertical rudder)
    this.drawClayCapsule(ctx, -26, -14, 18, 10, '#cfd8dc', '#78909c', -0.3);
    this.drawClayBlob(ctx, -26, -18, 5, 5, '#e53935', '#b71c1c');

    // Lower wing
    this.drawClayCapsule(ctx, 4, 16, 32, 10, '#b0bec5', '#546e7a', 0.15);

    // Main fuselage body (Chunky rounded vintage clay rocket-plane)
    this.drawClayCapsule(ctx, -2, 0, 56, 26, '#eceff1', '#607d8b');

    // Red clay accent stripe along fuselage
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(2, 0, 20, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e53935';
    ctx.fill();
    ctx.restore();

    // Upper wing
    this.drawClayCapsule(ctx, 4, -14, 38, 12, '#cfd8dc', '#546e7a', -0.1);

    // Wing tip red clay caps
    this.drawClayBlob(ctx, 16, -18, 6, 6, '#e53935', '#b71c1c');
    this.drawClayBlob(ctx, 16, 18, 6, 6, '#e53935', '#b71c1c');

    // Active special weapon energy aura on wing pylons
    const weaponGlows = {
      SPREAD: '#ff5252',
      LASER: '#00e5ff',
      HOMING: '#69f0ae',
      FLAK: '#ffd54f',
      PLASMA: '#e040fb'
    };
    if (weaponType && weaponGlows[weaponType]) {
      const glowCol = weaponGlows[weaponType];
      ctx.save();
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = 8;
      this.drawClayBlob(ctx, 16, -18, 4, 4, glowCol, '#ffffff');
      this.drawClayBlob(ctx, 16, 18, 4, 4, glowCol, '#ffffff');
      ctx.restore();
    }

    // Dual gun barrels on wings
    this.drawClayCapsule(ctx, 14, -10, 16, 5, '#37474f', '#212121');
    this.drawClayCapsule(ctx, 14, 10, 16, 5, '#37474f', '#212121');

    // Cockpit Canopy (Yellow clay glass bubble with curved specular highlights)
    this.drawClayBlob(ctx, 6, -3, 14, 9, '#fff176', '#fbc02d', -Math.PI / 3);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(5, -4, 6, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
    ctx.restore();

    // Nose cone (Red clay bulb)
    this.drawClayBlob(ctx, 27, 0, 8, 8, '#e53935', '#b71c1c');

    // Spinning propeller with motion blur disc
    ctx.save();
    ctx.translate(34, 0);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fill();

    const propAngle = engineTick * 0.9;
    ctx.rotate(propAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(-2, -18, 4, 36);
    this.drawClayBlob(ctx, 0, 0, 5, 5, '#ffb300', '#ff6f00');
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Scout (small red/purple rounded insectoid plane)
   */
  static drawScout(ctx, x, y, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Wing flap
    const flap = Math.sin(tick * 0.4) * 4;

    // Small exhaust puff
    this.drawClayBlob(ctx, 18, 0, 5, 4, '#ffb74d', '#e65100');

    // Wings
    this.drawClayCapsule(ctx, 0, -12 + flap, 24, 7, '#ab47bc', '#6a1b9a', -0.1);
    this.drawClayCapsule(ctx, 0, 12 - flap, 24, 7, '#ab47bc', '#6a1b9a', 0.1);

    // Main bulbous body
    this.drawClayBlob(ctx, 0, 0, 18, 14, '#e91e63', '#880e4f');

    // Cockpit / eye
    this.drawClayBlob(ctx, -8, 0, 7, 7, '#80deea', '#00838f');

    // Nose stinger / gun
    this.drawClayCapsule(ctx, -18, 0, 10, 4, '#424242', '#212121');

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Drone (fast green beetle craft)
   */
  static drawDrone(ctx, x, y, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Twin engines
    this.drawClayCapsule(ctx, 12, -9, 14, 6, '#66bb6a', '#2e7d32');
    this.drawClayCapsule(ctx, 12, 9, 14, 6, '#66bb6a', '#2e7d32');

    // Main hull
    this.drawClayBlob(ctx, 0, 0, 20, 12, '#43a047', '#1b5e20');

    // Yellow armored back stripes
    this.drawClayCapsule(ctx, 4, 0, 8, 10, '#fbc02d', '#f57f17');

    // Red visor
    this.drawClayCapsule(ctx, -10, 0, 6, 8, '#ff5252', '#b71c1c');

    ctx.restore();
  }

  /**
   * Draw Enemy: Heavy Gunship (armored blue flying fortress)
   */
  static drawGunship(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Massive wings
    this.drawClayCapsule(ctx, 10, -28, 48, 16, '#3949ab', '#1a237e', -0.2);
    this.drawClayCapsule(ctx, 10, 28, 48, 16, '#3949ab', '#1a237e', 0.2);

    // Wing turrets
    this.drawClayBlob(ctx, 4, -32, 9, 9, '#ffca28', '#f57f17');
    this.drawClayBlob(ctx, 4, 32, 9, 9, '#ffca28', '#f57f17');

    // Main heavy fuselage
    this.drawClayCapsule(ctx, 0, 0, 72, 34, '#42a5f5', '#0d47a1');

    // Armored frontal cockpit
    this.drawClayBlob(ctx, -22, 0, 15, 12, '#cfd8dc', '#455a64');
    this.drawClayCapsule(ctx, -26, 0, 6, 12, '#ff1744', '#b71c1c');

    // Dual heavy cannons
    this.drawClayCapsule(ctx, -28, -12, 22, 7, '#37474f', '#212121');
    this.drawClayCapsule(ctx, -28, 12, 22, 7, '#37474f', '#212121');

    // HP bar above gunship if damaged
    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-30, -45, 60, 6);
      ctx.fillStyle = hpRatio > 0.4 ? '#4caf50' : '#f44336';
      ctx.fillRect(-30, -45, 60 * hpRatio, 6);
    }

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Zeppelin / Blimp
   */
  static drawBlimp(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    const bob = Math.sin(tick * 0.05) * 3;
    ctx.translate(0, bob);

    // Rear rudder fins
    this.drawClayCapsule(ctx, 60, -32, 26, 14, '#ffb74d', '#e65100', -0.4);
    this.drawClayCapsule(ctx, 60, 32, 26, 14, '#ffb74d', '#e65100', 0.4);
    this.drawClayCapsule(ctx, 65, 0, 24, 12, '#ffb74d', '#e65100');

    // Giant Gasbag (Clay Zeppelin body)
    this.drawClayCapsule(ctx, 0, 0, 130, 62, '#ffe082', '#ff8f00');

    // Seams and clay ridges on balloon
    ctx.strokeStyle = 'rgba(191, 54, 12, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 56, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 42, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    // Underbelly cabin / gondola
    this.drawClayCapsule(ctx, -10, 36, 48, 16, '#8d6e63', '#4e342e');

    // Cabin windows
    for (let i = -22; i <= 6; i += 10) {
      this.drawClayBlob(ctx, i, 36, 3, 3, '#81d4fa', '#0288d1');
    }

    // Front Gun Turret
    this.drawClayBlob(ctx, -56, 10, 14, 14, '#78909c', '#37474f');
    this.drawClayCapsule(ctx, -68, 10, 16, 6, '#263238', '#000000');

    // HP Bar
    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-45, -45, 90, 8);
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(-45, -45, 90 * hpRatio, 8);
    }

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Stinger (fast aggressive wasp interceptor)
   */
  static drawStinger(ctx, x, y, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Jet thruster flames
    const flame = 12 + Math.sin(tick * 0.8) * 5;
    this.drawClayBlob(ctx, 16 + flame * 0.3, 0, flame, flame * 0.5, '#ff3d00', '#bf360c');
    this.drawClayBlob(ctx, 12, 0, 6, 4, '#ffee58', '#f57c00');

    // Swept-forward wings
    this.drawClayCapsule(ctx, 2, -14, 22, 6, '#ffa000', '#e65100', -0.35);
    this.drawClayCapsule(ctx, 2, 14, 22, 6, '#ffa000', '#e65100', 0.35);

    // Aerodynamic wasp fuselage
    this.drawClayCapsule(ctx, 0, 0, 32, 13, '#ffb300', '#e65100');

    // Black clay stinger stripes
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(3, 0, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-3, 0, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sharp stinger nose
    this.drawClayCapsule(ctx, -18, 0, 14, 4, '#d84315', '#bf360c');

    // Glowing red ocular sensor
    this.drawClayBlob(ctx, -8, 0, 5, 5, '#ff1744', '#b71c1c');

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Sniper Skiff (long range precision craft)
   */
  static drawSniper(ctx, x, y, isAiming = false, aimProgress = 0, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Engine exhaust
    this.drawClayBlob(ctx, 22, 0, 7, 5, '#ab47bc', '#4a148c');

    // Sleek needle wings
    this.drawClayCapsule(ctx, 6, -16, 26, 6, '#7e57c2', '#311b92', -0.2);
    this.drawClayCapsule(ctx, 6, 16, 26, 6, '#7e57c2', '#311b92', 0.2);

    // Main stealth chassis
    this.drawClayCapsule(ctx, 2, 0, 44, 15, '#512da8', '#1a237e');

    // Long Railgun barrel
    this.drawClayCapsule(ctx, -26, 0, 28, 5, '#263238', '#000000');
    // Railgun muzzle glow
    if (isAiming) {
      const chargePulse = 5 + aimProgress * 6;
      this.drawClayBlob(ctx, -40, 0, chargePulse, chargePulse, '#ff1744', '#b71c1c');
    }

    // Targeting scanner optic
    this.drawClayBlob(ctx, -8, 0, 6, 6, isAiming ? '#ff1744' : '#00e676', '#004d40');

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Heavy Bomber
   */
  static drawBomber(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Heavy dual propeller engines
    this.drawClayCapsule(ctx, 4, -26, 32, 12, '#558b2f', '#1b5e20');
    this.drawClayCapsule(ctx, 4, 26, 32, 12, '#558b2f', '#1b5e20');

    // Propeller spinners
    const prop1 = tick * 0.8;
    ctx.save();
    ctx.translate(-12, -26);
    ctx.rotate(prop1);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-2, -12, 4, 24);
    ctx.restore();

    ctx.save();
    ctx.translate(-12, 26);
    ctx.rotate(-prop1);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-2, -12, 4, 24);
    ctx.restore();

    // Main heavy fuselage
    this.drawClayCapsule(ctx, 0, 0, 68, 30, '#689f38', '#2e7d32');

    // Bomb bay doors underbelly
    this.drawClayCapsule(ctx, 0, 10, 30, 8, '#33691e', '#1b5e20');

    // Glass bubble cockpit
    this.drawClayBlob(ctx, -22, -4, 11, 9, '#80deea', '#00838f');

    // HP bar if damaged
    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-25, -38, 50, 6);
      ctx.fillStyle = '#8bc34a';
      ctx.fillRect(-25, -38, 50 * hpRatio, 6);
    }

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Spinner (buzzing blade disc)
   */
  static drawSpinner(ctx, x, y, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    const spinAngle = tick * 0.2;
    ctx.rotate(spinAngle);

    // Outer rotating clay saw teeth
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      ctx.save();
      ctx.rotate(a);
      this.drawClayCapsule(ctx, 18, 0, 16, 8, '#e53935', '#b71c1c', 0.4);
      ctx.restore();
    }

    // Outer disc ring
    this.drawClayBlob(ctx, 0, 0, 20, 20, '#d32f2f', '#7f0000');

    // Core bronze cap
    this.drawClayBlob(ctx, 0, 0, 10, 10, '#ffd54f', '#ff8f00');
    // Inner pulse eye
    this.drawClayBlob(ctx, 0, 0, 5, 5, '#ffffff', '#ffd54f');

    ctx.restore();
  }

  /**
   * Draw Enemy: Shield Cruiser (front energy shield)
   */
  static drawShieldCruiser(ctx, x, y, shieldRatio = 1, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Twin heavy ion thrusters
    const thrust = 12 + Math.sin(tick * 0.5) * 4;
    this.drawClayBlob(ctx, 32 + thrust * 0.2, -14, thrust, thrust * 0.5, '#00e5ff', '#00838f');
    this.drawClayBlob(ctx, 32 + thrust * 0.2, 14, thrust, thrust * 0.5, '#00e5ff', '#00838f');

    // Heavy battleship hull
    this.drawClayCapsule(ctx, 0, 0, 68, 34, '#37474f', '#212121');

    // Cyan reinforced plating
    this.drawClayCapsule(ctx, -8, -14, 38, 10, '#00acc1', '#006064');
    this.drawClayCapsule(ctx, -8, 14, 38, 10, '#00acc1', '#006064');

    // Shield Projector emitters at prow
    this.drawClayBlob(ctx, -32, -16, 7, 7, '#00e5ff', '#00838f');
    this.drawClayBlob(ctx, -32, 16, 7, 7, '#00e5ff', '#00838f');

    // Forward Energy Shield Dome (if active)
    if (shieldRatio > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(-26, 0, 36, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + shieldRatio * 0.5})`;
      ctx.lineWidth = 6;
      ctx.stroke();

      // Shield shimmer arc
      ctx.beginPath();
      ctx.arc(-26, 0, 33, -Math.PI * 0.38, Math.PI * 0.38);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // HP & Shield bar
    if (hpRatio < 1 || shieldRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-25, -34, 50, 8);
      // Hull hp
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(-25, -34, 50 * hpRatio, 4);
      // Shield hp
      if (shieldRatio > 0) {
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-25, -30, 50 * shieldRatio, 4);
      }
    }

    ctx.restore();
  }

  /**
   * Draw Enemy: Mine Layer Drone
   */
  static drawMineLayer(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Industrial body
    this.drawClayCapsule(ctx, 4, 0, 42, 26, '#d84315', '#bf360c');
    // Hazard stripes
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.fillRect(-6, -10, 4, 20);
    ctx.fillRect(4, -10, 4, 20);
    ctx.closePath();

    // Rear Mine Dispenser Rack
    this.drawClayCapsule(ctx, 22, 0, 16, 18, '#4e342e', '#271612');
    this.drawClayBlob(ctx, 24, 0, 6, 6, '#212121', '#000000');

    // Drone optics
    this.drawClayBlob(ctx, -14, 0, 7, 7, '#ff5722', '#e64a19');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-20, -25, 40, 5);
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(-20, -25, 40 * hpRatio, 5);
    }

    ctx.restore();
  }

  /**
   * Draw Floating Clay Mine
   */
  static drawMine(ctx, x, y, tick = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tick * 0.03);

    // 8 clay spikes around sphere
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      ctx.save();
      ctx.rotate(a);
      this.drawClayCapsule(ctx, 14, 0, 10, 5, '#424242', '#212121');
      ctx.restore();
    }

    // Main mine sphere
    this.drawClayBlob(ctx, 0, 0, 15, 15, '#37474f', '#212121');

    // Pulsating warning light
    const pulse = Math.sin(tick * 0.15) > 0;
    this.drawClayBlob(ctx, 0, 0, 6, 6, pulse ? '#ff1744' : '#b71c1c', '#7f0000');

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Ace Interceptor (golden acrobatic fighter)
   */
  static drawAce(ctx, x, y, tilt = 0, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt * 0.3);

    // Dual afterburner fire
    const flame = 14 + Math.sin(tick * 0.7) * 4;
    this.drawClayBlob(ctx, 20 + flame * 0.3, -7, flame, flame * 0.5, '#ffd54f', '#ff6f00');
    this.drawClayBlob(ctx, 20 + flame * 0.3, 7, flame, flame * 0.5, '#ffd54f', '#ff6f00');

    // Swept golden fighter wings
    this.drawClayCapsule(ctx, 4, -20, 32, 8, '#fbc02d', '#f57f17', -0.3);
    this.drawClayCapsule(ctx, 4, 20, 32, 8, '#fbc02d', '#f57f17', 0.3);

    // Crimson wingtips
    this.drawClayBlob(ctx, -8, -26, 6, 6, '#d32f2f', '#851414');
    this.drawClayBlob(ctx, -8, 26, 6, 6, '#d32f2f', '#851414');

    // Golden sleek fuselage
    this.drawClayCapsule(ctx, 0, 0, 46, 17, '#ffca28', '#ff6f00');

    // Sleek cockpit canopy
    this.drawClayBlob(ctx, -6, 0, 11, 7, '#00e5ff', '#00838f');

    // Dual nose blasters
    this.drawClayCapsule(ctx, -24, -4, 10, 4, '#212121', '#000000');
    this.drawClayCapsule(ctx, -24, 4, 10, 4, '#212121', '#000000');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-20, -32, 40, 5);
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(-20, -32, 40 * hpRatio, 5);
    }

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Interceptor (high-speed cloaking dart jet)
   */
  static drawInterceptor(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Glowing cyan plasma exhaust trail
    const flame = 18 + Math.sin(tick * 0.8) * 5;
    this.drawClayBlob(ctx, 22 + flame * 0.3, 0, flame, flame * 0.4, '#00e5ff', '#0097a7');

    // Sharp forward-swept dart wings (neon violet & magenta)
    this.drawClayCapsule(ctx, 2, -18, 30, 7, '#ab47bc', '#6a1b9a', -0.45);
    this.drawClayCapsule(ctx, 2, 18, 30, 7, '#ab47bc', '#6a1b9a', 0.45);

    // Main needle fuselage
    this.drawClayCapsule(ctx, 0, 0, 48, 14, '#7b1fa2', '#4a148c');

    // Cockpit visor
    this.drawClayBlob(ctx, -8, 0, 10, 5, '#e040fb', '#aa00ff');

    // Twin nose needle blasters
    this.drawClayCapsule(ctx, -25, -3, 12, 3, '#212121', '#000000');
    this.drawClayCapsule(ctx, -25, 3, 12, 3, '#212121', '#000000');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-20, -28, 40, 5);
      ctx.fillStyle = '#e040fb';
      ctx.fillRect(-20, -28, 40 * hpRatio, 5);
    }

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Juggernaut (armored heavy fortress ship)
   */
  static drawJuggernaut(ctx, x, y, shieldRatio = 1, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Dual Heavy Engines
    const enginePulse = 18 + Math.sin(tick * 0.4) * 4;
    this.drawClayBlob(ctx, 42, -16, enginePulse, enginePulse * 0.5, '#ff9100', '#d50000');
    this.drawClayBlob(ctx, 42, 16, enginePulse, enginePulse * 0.5, '#ff9100', '#d50000');

    // 2. Heavy Armored Hull (Dark Obsidian Clay)
    this.drawClayCapsule(ctx, 0, 0, 84, 46, '#263238', '#000a12');

    // Armor plating slabs
    [-15, 10].forEach(sx => {
      this.drawClayCapsule(ctx, sx, 0, 18, 40, '#37474f', '#1b2327');
    });

    // Hazard yellow/black chevrons on sides
    this.drawClayBlob(ctx, 5, -18, 8, 5, '#ffd54f', '#f57f17');
    this.drawClayBlob(ctx, 5, 18, 8, 5, '#ffd54f', '#f57f17');

    // Dual Twin Heavy Cannon Barrels
    this.drawClayCapsule(ctx, -38, -14, 26, 8, '#1e293b', '#0f172a');
    this.drawClayCapsule(ctx, -38, 14, 26, 8, '#1e293b', '#0f172a');

    // Bridge / Command Dome
    this.drawClayBlob(ctx, -6, 0, 16, 12, '#ff5252', '#b71c1c');

    // Energy Shield Barrier (when shield active)
    if (shieldRatio > 0) {
      ctx.save();
      const sAlpha = 0.25 + shieldRatio * 0.35 + Math.sin(tick * 0.2) * 0.1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 52, 34, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${sAlpha})`;
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    if (hpRatio < 1 || shieldRatio < 1) {
      // Shield bar
      if (shieldRatio > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-30, -38, 60, 4);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-30, -38, 60 * shieldRatio, 4);
      }
      // HP bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-30, -32, 60, 5);
      ctx.fillStyle = hpRatio > 0.4 ? '#4caf50' : '#f44336';
      ctx.fillRect(-30, -32, 60 * hpRatio, 5);
    }

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Vortex Drone (cosmic gravitational anomaly)
   */
  static drawVortexDrone(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Concentric rotating cosmic aura rings
    ctx.save();
    ctx.rotate(tick * 0.05);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = 'rgba(213, 0, 249, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Central pulsing anomaly sphere
    const pulse = 20 + Math.sin(tick * 0.15) * 3;
    this.drawClayBlob(ctx, 0, 0, pulse, pulse, '#4a148c', '#12005e');

    // Inner glowing core
    this.drawClayBlob(ctx, 0, 0, 9, 9, '#00e5ff', '#0097a7');

    // Satellite clay nodes rotating around core
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + tick * 0.08;
      const nx = Math.cos(a) * 22;
      const ny = Math.sin(a) * 16;
      this.drawClayBlob(ctx, nx, ny, 5, 5, '#e040fb', '#7b1fa2');
    }

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -32, 36, 5);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-18, -32, 36 * hpRatio, 5);
    }

    ctx.restore();
  }

  /**
   * Main Boss Dispatcher
   */
  static drawBoss(ctx, boss) {
    if (boss.rageMode) {
      // Crimson rage aura with flame lobes and embers for enraged bosses
      ctx.save();
      const auraPulse = Math.sin(boss.tick * 0.25) * 6 + 12;
      ctx.beginPath();
      ctx.ellipse(boss.x, boss.y, boss.radius + auraPulse + 16, boss.radius * 0.75 + auraPulse, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 23, 68, 0.24)';
      ctx.fill();

      // Pulsing outer warning halo
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.75)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dynamic flame lobes around perimeter
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6 + boss.tick * 0.1;
        const dist = boss.radius + 8 + Math.sin(boss.tick * 0.4 + i) * 6;
        const fx = boss.x + Math.cos(a) * dist;
        const fy = boss.y + Math.sin(a) * (dist * 0.75);
        this.drawClayBlob(ctx, fx, fy, 8, 8, '#ff5252', '#d50000');
        this.drawClayBlob(ctx, fx, fy, 4, 4, '#ffeb3b', '#ff6f00');
      }
      ctx.restore();
    }

    if (boss.bossType === 'OMEGA_CORE_SPAWN') {
      this.drawOmegaCoreSpawn(ctx, boss);
    } else if (boss.bossType === 'OMEGA_COLOSSUS') {
      this.drawOmegaBoss(ctx, boss);
    } else if (boss.bossType === 'GOLIATH_ZEPPELIN') {
      this.drawGoliathBoss(ctx, boss);
    } else if (boss.bossType === 'LEVIATHAN_TITAN') {
      this.drawLeviathanBoss(ctx, boss);
    } else {
      this.drawDreadnoughtBoss(ctx, boss);
    }
  }

  /**
   * Draw Stage 20 Final Boss: "The Omega Clay Colossus"
   */
  static drawOmegaBoss(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Sinusoidal floating hover
    const hoverY = Math.sin(boss.tick * 0.04) * 8;
    ctx.translate(0, hoverY);

    // 1. Triple Cosmic Ion Thruster Plumes
    const thrusterPulse = 28 + Math.sin(boss.tick * 0.35) * 8;
    [-45, 0, 45].forEach(offsetY => {
      this.drawClayBlob(ctx, 135, offsetY, thrusterPulse, thrusterPulse * 0.55, '#d500f9', '#4a148c');
      this.drawClayBlob(ctx, 120, offsetY, thrusterPulse * 0.6, thrusterPulse * 0.35, '#00e5ff', '#0097a7');
    });

    // 2. Heavy Armored Rear Wings / Armor Spoilers
    this.drawClayCapsule(ctx, 100, -75, 70, 26, '#312e43', '#181726', -0.35);
    this.drawClayCapsule(ctx, 100, 75, 70, 26, '#312e43', '#181726', 0.35);

    // 3. Main Colossal Chassis (Dark Obsidian Cosmic Clay)
    this.drawClayCapsule(ctx, 0, 0, 260, 115, '#1e1c2e', '#0c0a17');

    // Layered armor plating
    [-60, -20, 25, 70].forEach(sx => {
      this.drawClayCapsule(ctx, sx, 0, 36, 95, '#2d2a45', '#161324');
    });

    // 4. Upper Plasma Railgun Cannon (if alive)
    if (boss.railTopAlive) {
      this.drawClayBlob(ctx, -10, -85, 26, 22, '#00e5ff', '#00838f');
      // Extended railgun barrel
      this.drawClayCapsule(ctx, -55, -85, 80, 14, '#1e293b', '#0f172a');
      // Glowing rail accelerator coils
      [-80, -60, -40].forEach(rx => {
        this.drawClayBlob(ctx, rx, -85, 7, 7, '#00e5ff', '#0097a7');
      });
    } else {
      this.drawClayBlob(ctx, -10, -85, 18, 14, '#242133', '#110f1a');
    }

    // 5. Lower Plasma Railgun Cannon (if alive)
    if (boss.railBottomAlive) {
      this.drawClayBlob(ctx, -10, 85, 26, 22, '#00e5ff', '#00838f');
      // Extended railgun barrel
      this.drawClayCapsule(ctx, -55, 85, 80, 14, '#1e293b', '#0f172a');
      // Glowing rail accelerator coils
      [-80, -60, -40].forEach(rx => {
        this.drawClayBlob(ctx, rx, 85, 7, 7, '#00e5ff', '#0097a7');
      });
    } else {
      this.drawClayBlob(ctx, -10, 85, 18, 14, '#242133', '#110f1a');
    }

    // 6. Central Drone Matrix / Quantum Reactor (if alive)
    if (boss.droneCoreAlive) {
      const rot = boss.tick * 0.08;
      ctx.save();
      ctx.translate(-25, 0);
      // Rotating containment ring
      ctx.rotate(rot);
      this.drawClayCapsule(ctx, 0, 0, 48, 16, '#c084fc', '#581c87');
      this.drawClayCapsule(ctx, 0, 0, 16, 48, '#c084fc', '#581c87');
      ctx.restore();
      // Glowing quantum core
      this.drawClayBlob(ctx, -25, 0, 18, 18, '#f0abfc', '#a855f7');
    } else {
      this.drawClayBlob(ctx, -25, 0, 18, 14, '#262235', '#100e19');
    }

    // 7. Omega Singularity Core (Front Central Weakpoint)
    const coreColor = boss.rageMode ? '#ff1744' : '#00e5ff';
    const coreShadow = boss.rageMode ? '#b71c1c' : '#00838f';
    const corePulse = 26 + Math.sin(boss.tick * 0.25) * 6;
    this.drawClayBlob(ctx, -100, 0, corePulse, corePulse, coreColor, coreShadow);
    // Core white-hot pupil
    this.drawClayBlob(ctx, -104, 0, 11, 11, '#ffffff', coreColor);

    // 8. Front Menacing Heavy Ramming Prow
    this.drawClayCapsule(ctx, -125, -34, 60, 20, '#38324f', '#19152b', 0.28);
    this.drawClayCapsule(ctx, -125, 34, 60, 20, '#38324f', '#19152b', -0.28);

    ctx.restore();
  }

  /**
   * Draw Stage 20 Phase 2 Boss: "The Omega Apex Core" (Anak Core Boss Lanjutan)
   */
  static drawOmegaCoreSpawn(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Sinusoidal floating hover
    const hoverY = Math.sin(boss.tick * 0.06) * 6;
    ctx.translate(0, hoverY);

    // 1. Telegraph Charge Warning & Dash Trails
    if (boss.dashState === 'TELEGRAPH') {
      // Crackling energy arcs and warning aura
      ctx.save();
      const tPulse = 18 + Math.sin(boss.tick * 0.8) * 8;
      ctx.beginPath();
      ctx.arc(0, 0, boss.radius + tPulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 6]);
      ctx.stroke();
      ctx.restore();
    } else if (boss.dashState === 'RUSH') {
      // Hyper-speed supersonic cone trailing to the right
      ctx.save();
      const coneGrad = ctx.createLinearGradient(0, 0, 160, 0);
      coneGrad.addColorStop(0, 'rgba(213, 0, 249, 0.7)');
      coneGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(-10, -boss.radius * 0.7);
      ctx.lineTo(160, -boss.radius * 1.3);
      ctx.lineTo(160, boss.radius * 1.3);
      ctx.lineTo(-10, boss.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Writhing Organic Clay Bio-Tentacles / Winglets
    [-1, 1].forEach(side => {
      for (let i = 0; i < 4; i++) {
        const wave = Math.sin(boss.tick * 0.12 + i * 0.8) * 12;
        const tx = 30 + i * 18;
        const ty = (side * (32 + i * 14)) + wave;
        const r = 16 - i * 2.5;
        this.drawClayBlob(ctx, tx, ty, r, r * 0.8, '#6a1b9a', '#38006b');
        this.drawClayBlob(ctx, tx - 5, ty, r * 0.5, r * 0.5, '#ab47bc', '#4a148c');
      }
    });

    // 3. Central Mutant Core Body (Alien Cyber-Clay Embryo)
    const corePulse = Math.sin(boss.tick * 0.18) * 4;
    this.drawClayBlob(ctx, 0, 0, boss.radius + corePulse, boss.radius * 0.82 + corePulse, '#311b92', '#000051');
    this.drawClayCapsule(ctx, -10, 0, boss.radius * 1.4, boss.radius * 0.8, '#4a148c', '#12005e');

    // Clay bio-chitin armored plates
    [-35, -5, 25].forEach(sx => {
      this.drawClayCapsule(ctx, sx, 0, 22, boss.radius * 0.9, '#6a1b9a', '#38006b');
    });

    // 4. Central Giant Robotic Eye / Core Reactor
    const eyeSize = 34 + Math.sin(boss.tick * 0.25) * 4;
    this.drawClayBlob(ctx, -20, 0, eyeSize, eyeSize, '#1a237e', '#000051');
    this.drawClayBlob(ctx, -22, 0, eyeSize * 0.65, eyeSize * 0.65, boss.rageMode ? '#ff1744' : '#00e5ff', boss.rageMode ? '#b71c1c' : '#00838f');

    // Dynamic Eye Pupil looking forward / at player
    const pupilX = boss.dashState === 'RUSH' ? -30 : -25;
    this.drawClayBlob(ctx, pupilX, 0, 7, 7, '#ffffff', '#e0e0e0');

    // 5. Invulnerable Skill Barrier (Kubah Perisai Kebal Holografik)
    if (boss.isInvulnerable) {
      ctx.save();
      const shieldR = boss.radius + 28 + Math.sin(boss.tick * 0.3) * 4;
      const sGrad = ctx.createRadialGradient(0, 0, boss.radius * 0.5, 0, 0, shieldR);
      sGrad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
      sGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.35)');
      sGrad.addColorStop(1, 'rgba(255, 215, 64, 0.85)');

      ctx.beginPath();
      ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
      ctx.fillStyle = sGrad;
      ctx.fill();

      // Shimmering outer barrier ring
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Rotating hexagonal crystal nodes around shield
      ctx.rotate(boss.tick * 0.04);
      for (let h = 0; h < 6; h++) {
        const hAng = (h * Math.PI * 2) / 6;
        const hx = Math.cos(hAng) * shieldR;
        const hy = Math.sin(hAng) * shieldR;
        this.drawClayBlob(ctx, hx, hy, 8, 8, '#ffd54f', '#ff8f00');
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw Stage 5 Boss: "The Iron Clay Dreadnought"
   */
  static drawDreadnoughtBoss(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Floating breathing hover
    const hoverY = Math.sin(boss.tick * 0.04) * 6;
    ctx.translate(0, hoverY);

    // Massive aft thruster glow
    const thrusterPulse = 18 + Math.sin(boss.tick * 0.3) * 6;
    this.drawClayBlob(ctx, 110, -25, thrusterPulse, thrusterPulse * 0.6, '#ff5722', '#bf360c');
    this.drawClayBlob(ctx, 110, 25, thrusterPulse, thrusterPulse * 0.6, '#ff5722', '#bf360c');

    // Back Armor Fins
    this.drawClayCapsule(ctx, 90, -60, 50, 24, '#78909c', '#37474f', -0.3);
    this.drawClayCapsule(ctx, 90, 60, 50, 24, '#78909c', '#37474f', 0.3);

    // Main Superstructure (Giant Dreadnought Hull)
    this.drawClayCapsule(ctx, 0, 0, 220, 100, '#90a4ae', '#263238');

    // Riveted armor plating panels
    this.drawClayCapsule(ctx, -10, -32, 90, 22, '#cfd8dc', '#546e7a');
    this.drawClayCapsule(ctx, -10, 32, 90, 22, '#cfd8dc', '#546e7a');

    // Top Turret (if alive)
    if (boss.turretTopAlive) {
      this.drawClayBlob(ctx, -30, -50, 22, 22, '#e53935', '#b71c1c');
      const angleTop = boss.topTurretAngle || Math.PI;
      ctx.save();
      ctx.translate(-30, -50);
      ctx.rotate(angleTop);
      this.drawClayCapsule(ctx, 22, 0, 32, 9, '#212121', '#000000');
      ctx.restore();
    } else {
      this.drawClayBlob(ctx, -30, -50, 16, 14, '#424242', '#212121');
    }

    // Bottom Turret (if alive)
    if (boss.turretBottomAlive) {
      this.drawClayBlob(ctx, -30, 50, 22, 22, '#e53935', '#b71c1c');
      const angleBottom = boss.bottomTurretAngle || Math.PI;
      ctx.save();
      ctx.translate(-30, 50);
      ctx.rotate(angleBottom);
      this.drawClayCapsule(ctx, 22, 0, 32, 9, '#212121', '#000000');
      ctx.restore();
    } else {
      this.drawClayBlob(ctx, -30, 50, 16, 14, '#424242', '#212121');
    }

    // Central Core / Eye (Weakpoint)
    const coreColor = boss.rageMode ? '#ff1744' : '#ffea00';
    const coreShadow = boss.rageMode ? '#b71c1c' : '#ff6f00';
    const corePulse = 18 + Math.sin(boss.tick * 0.2) * 3;
    this.drawClayBlob(ctx, -75, 0, corePulse, corePulse, coreColor, coreShadow);

    // Front ramming jaw
    this.drawClayCapsule(ctx, -95, -22, 45, 14, '#455a64', '#1c2833', 0.25);
    this.drawClayCapsule(ctx, -95, 22, 45, 14, '#455a64', '#1c2833', -0.25);

    ctx.restore();
  }

  /**
   * Draw Stage 10 Boss: "The Clay Goliath Zeppelin"
   */
  static drawGoliathBoss(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const bob = Math.sin(boss.tick * 0.03) * 8;
    ctx.translate(0, bob);

    // Huge Rear Steampunk Propellers & Thrusters
    const propSpin = boss.tick * 0.4;
    [-40, 0, 40].forEach(offsetY => {
      this.drawClayCapsule(ctx, 110, offsetY, 30, 16, '#6d4c41', '#3e2723');
      ctx.save();
      ctx.translate(125, offsetY);
      ctx.rotate(propSpin);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(-3, -20, 6, 40);
      ctx.restore();
    });

    // Gigantic Gasbag Balloon (Amber/Bronze clay with steel ribs)
    this.drawClayCapsule(ctx, 0, -25, 250, 95, '#d7ccc8', '#8d6e63');

    // Armored Iron Rib Bands
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 4;
    [-60, 0, 60].forEach(rx => {
      ctx.beginPath();
      ctx.ellipse(rx, -25, 24, 46, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Underbelly Armored Gondola / Fortress
    this.drawClayCapsule(ctx, -10, 40, 190, 52, '#455a64', '#263238');

    // Heavy Top Mortar Cannon (if alive)
    if (boss.mortarAlive) {
      this.drawClayBlob(ctx, -40, -78, 24, 20, '#d84315', '#bf360c');
      // Mortar barrel
      const mAngle = boss.mortarAngle || (Math.PI * 0.85);
      ctx.save();
      ctx.translate(-40, -78);
      ctx.rotate(mAngle);
      this.drawClayCapsule(ctx, 24, 0, 36, 14, '#263238', '#000000');
      ctx.restore();
    } else {
      this.drawClayBlob(ctx, -40, -78, 16, 12, '#37474f', '#212121');
    }

    // Lower Drone Hangar Bay (if alive)
    if (boss.hangarAlive) {
      this.drawClayCapsule(ctx, 20, 65, 60, 22, '#00838f', '#004d40');
      // Glowing launch doors
      const glow = Math.sin(boss.tick * 0.2) > 0 ? '#00e5ff' : '#0097a7';
      this.drawClayCapsule(ctx, 20, 65, 42, 10, glow, '#006064');
    } else {
      this.drawClayCapsule(ctx, 20, 65, 48, 18, '#37474f', '#212121');
    }

    // Forward Ramming Nose & Core
    this.drawClayBlob(ctx, -115, 0, 36, 36, '#bf360c', '#3e2723');
    // Glowing Furnace / Core
    const furnaceColor = boss.rageMode ? '#ff1744' : '#ff9100';
    this.drawClayBlob(ctx, -125, 0, 18, 18, furnaceColor, '#d50000');

    // Broadside gunports
    for (let gx = -65; gx <= 65; gx += 32) {
      this.drawClayBlob(ctx, gx, 35, 6, 6, '#212121', '#000000');
    }

    ctx.restore();
  }

  /**
   * Draw Stage 15 Boss: "The Ultimate Clay Leviathan"
   */
  static drawLeviathanBoss(ctx, boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Sinusoidal undulating dragon/titan movement
    const undulate = Math.sin(boss.tick * 0.05) * 12;
    ctx.translate(0, undulate);

    // Glowing Cosmic Plasma Thruster Plumes
    const cosmicPulse = 26 + Math.sin(boss.tick * 0.3) * 8;
    this.drawClayBlob(ctx, 130, -35, cosmicPulse, cosmicPulse * 0.6, '#e040fb', '#4a148c');
    this.drawClayBlob(ctx, 130, 35, cosmicPulse, cosmicPulse * 0.6, '#e040fb', '#4a148c');

    // Upper Plasma Blade Wing (if alive)
    if (boss.wingTopAlive) {
      ctx.save();
      const wingFlap = Math.sin(boss.tick * 0.08) * 0.15;
      ctx.rotate(-0.2 + wingFlap);
      this.drawClayCapsule(ctx, 20, -85, 130, 30, '#7b1fa2', '#311b92');
      // Glowing energy edge
      this.drawClayCapsule(ctx, 0, -100, 100, 10, '#00e5ff', '#0097a7', -0.1);
      ctx.restore();
    } else {
      this.drawClayBlob(ctx, 10, -75, 22, 16, '#212121', '#000000');
    }

    // Lower Plasma Blade Wing (if alive)
    if (boss.wingBottomAlive) {
      ctx.save();
      const wingFlap = Math.sin(boss.tick * 0.08) * 0.15;
      ctx.rotate(0.2 - wingFlap);
      this.drawClayCapsule(ctx, 20, 85, 130, 30, '#7b1fa2', '#311b92');
      this.drawClayCapsule(ctx, 0, 100, 100, 10, '#00e5ff', '#0097a7', 0.1);
      ctx.restore();
    } else {
      this.drawClayBlob(ctx, 10, 85, 22, 16, '#212121', '#000000');
    }

    // Main Colossal Leviathan Body (Dark Obsidian & Violet Clay)
    this.drawClayCapsule(ctx, 0, 0, 240, 110, '#263238', '#000a12');

    // Heavy segmented armor scales
    [-50, -10, 30, 70].forEach(sx => {
      this.drawClayCapsule(ctx, sx, 0, 32, 90, '#37474f', '#102027');
    });

    // Twin Missile Battery Pods (if alive)
    if (boss.missilePodAlive) {
      this.drawClayCapsule(ctx, -20, -42, 60, 22, '#c2185b', '#880e4f');
      this.drawClayCapsule(ctx, -20, 42, 60, 22, '#c2185b', '#880e4f');
      // Missile tubes
      [-36, -20, -4].forEach(mx => {
        this.drawClayBlob(ctx, mx, -42, 5, 5, '#ffee58', '#f57f17');
        this.drawClayBlob(ctx, mx, 42, 5, 5, '#ffee58', '#f57f17');
      });
    } else {
      this.drawClayBlob(ctx, -20, -42, 20, 14, '#212121', '#000000');
      this.drawClayBlob(ctx, -20, 42, 20, 14, '#212121', '#000000');
    }

    // Prismatic Mega Eye / Core (Central Weakpoint)
    const pPulse = 24 + Math.sin(boss.tick * 0.25) * 5;
    const pColor = boss.rageMode ? '#ff1744' : '#00e5ff';
    const pShadow = boss.rageMode ? '#b71c1c' : '#00838f';
    this.drawClayBlob(ctx, -85, 0, pPulse, pPulse, pColor, pShadow);
    // Core pupil iris
    this.drawClayBlob(ctx, -88, 0, 10, 10, '#ffffff', pColor);

    // Front Maw / Cyber Jaw
    this.drawClayCapsule(ctx, -115, -28, 55, 18, '#455a64', '#1c2833', 0.28);
    this.drawClayCapsule(ctx, -115, 28, 55, 18, '#455a64', '#1c2833', -0.28);

    // Sonic Laser Warning charging beam if firing laser
    if (boss.isChargingLaser) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(-110, 0, 16 + boss.laserChargeRatio * 20, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${0.4 + boss.laserChargeRatio * 0.5})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw the cycling Weapon Power-Up Capsule (Classic Platypus mechanic)
   */
  static drawPowerUpCapsule(ctx, x, y, weaponType, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    const colors = {
      SPREAD: { main: '#e53935', shadow: '#b71c1c', label: 'S', name: 'SPREAD' },
      LASER: { main: '#1e88e5', shadow: '#0d47a1', label: 'L', name: 'LASER' },
      HOMING: { main: '#43a047', shadow: '#1b5e20', label: 'H', name: 'HOMING' },
      FLAK: { main: '#fbc02d', shadow: '#f57f17', label: 'F', name: 'FLAK' },
      PLASMA: { main: '#ab47bc', shadow: '#4a148c', label: 'P', name: 'PLASMA' }
    };

    const cfg = colors[weaponType] || colors.SPREAD;

    // Glowing clay aura
    const pulse = 24 + Math.sin(tick * 0.15) * 4;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, pulse + 6, 0, Math.PI * 2);
    ctx.fillStyle = cfg.main;
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.restore();

    // Outer translucent clay crystal shell
    this.drawClayBlob(ctx, 0, 0, 24, 24, '#ffffff', '#b0bec5');

    // Inner vibrant spinning powerup core
    ctx.save();
    ctx.rotate(tick * 0.05);
    this.drawClayBlob(ctx, 0, 0, 16, 16, cfg.main, cfg.shadow);
    ctx.restore();

    // Weapon letter emblem
    ctx.font = 'bold 15px Luckiest Guy, cursive';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(cfg.label, 0, 1);

    ctx.restore();
  }

  /**
   * Draw Bonus Score Fruits & Stars (dropped when eliminating enemy formations)
   */
  /**
   * Draw Bonus Score Fruits (6 types: CHERRY, BANANA, APPLE, WATERMELON, DRAGONFRUIT, GOLDEN_FRUIT)
   */
  static drawFruit(ctx, x, y, type = 'CHERRY', tick = 0, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    const floatY = Math.sin(tick * 0.1) * 3;
    ctx.translate(0, floatY);

    if (angle) {
      ctx.rotate(angle);
    }

    if (type === 'CHERRY') {
      // 1. CHERRY (Common / Ordinary - Base 2,000)
      // Twin clay cherries
      this.drawClayBlob(ctx, -6, 4, 8, 8, '#d32f2f', '#851414');
      this.drawClayBlob(ctx, 6, 2, 8, 8, '#d32f2f', '#851414');
      // Green stems
      ctx.strokeStyle = '#388e3c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.quadraticCurveTo(-2, -12, 0, -14);
      ctx.moveTo(6, -4);
      ctx.quadraticCurveTo(2, -12, 0, -14);
      ctx.stroke();
      this.drawClayBlob(ctx, 3, -13, 4, 3, '#81c784', '#2e7d32', 0.5);
    } else if (type === 'BANANA') {
      // 2. BANANA (Common / Ordinary - Base 5,000)
      // Yellow clay banana curve
      this.drawClayCapsule(ctx, 0, 0, 26, 9, '#fdd835', '#f57f17', 0.35);
      this.drawClayBlob(ctx, -12, -4, 3, 3, '#5d4037', '#3e2723');
      this.drawClayBlob(ctx, 12, 4, 3, 3, '#7cb342', '#33691e');
    } else if (type === 'APPLE') {
      // 3. APPLE (Standard - Base 12,000)
      // Red clay apple body
      this.drawClayBlob(ctx, 0, 2, 13, 13, '#e53935', '#b71c1c');
      // Top indentation highlight
      this.drawClayBlob(ctx, -2, 0, 4, 4, '#ff8a80', '#c62828');
      // Stem & leaf
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(1, -15);
      ctx.stroke();
      this.drawClayBlob(ctx, 5, -13, 5, 3, '#4caf50', '#1b5e20', 0.4);
    } else if (type === 'WATERMELON') {
      // 4. WATERMELON (Rare - Base 25,000)
      // Green outer rind curve
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -4, 16, 0.25, Math.PI - 0.25);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#2e7d32';
      ctx.stroke();

      // Pale green/white inner border
      ctx.beginPath();
      ctx.arc(0, -4, 13, 0.3, Math.PI - 0.3);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#c8e6c9';
      ctx.stroke();
      ctx.restore();

      // Sweet juicy red flesh wedge
      this.drawClayBlob(ctx, 0, 2, 12, 9, '#e53935', '#b71c1c');
      // Little black clay watermelon seeds
      this.drawClayBlob(ctx, -4, 1, 2, 2, '#212121', '#000000');
      this.drawClayBlob(ctx, 3, 3, 2, 2, '#212121', '#000000');
      this.drawClayBlob(ctx, -1, 5, 2, 2, '#212121', '#000000');
      this.drawClayBlob(ctx, 4, 0, 1.8, 1.8, '#212121', '#000000');
    } else if (type === 'DRAGONFRUIT') {
      // 5. DRAGONFRUIT (Very Rare - Base 42,000)
      // Exotic magenta dragonfruit body
      this.drawClayBlob(ctx, 0, 2, 13, 16, '#d81b60', '#880e4f');
      // Green flame-like scales curling out
      this.drawClayBlob(ctx, -9, 0, 5, 7, '#00e676', '#1b5e20', -0.5);
      this.drawClayBlob(ctx, 9, 1, 5, 7, '#00e676', '#1b5e20', 0.5);
      this.drawClayBlob(ctx, -6, 9, 4, 6, '#76ff03', '#2e7d32', -0.8);
      this.drawClayBlob(ctx, 6, 8, 4, 6, '#76ff03', '#2e7d32', 0.8);
      // Top crown scale
      this.drawClayBlob(ctx, 0, -11, 5, 8, '#76ff03', '#2e7d32');
      // Central speckled clay flesh highlight
      this.drawClayBlob(ctx, 0, 1, 7, 9, '#f8bbd0', '#c2185b');
      this.drawClayBlob(ctx, -1, 0, 1.5, 1.5, '#212121', '#000000');
      this.drawClayBlob(ctx, 1, 3, 1.5, 1.5, '#212121', '#000000');
    } else {
      // 6. GOLDEN_FRUIT / STAR (Special / Legendary - Base 60,000)
      // Radiant mythical glowing golden fruit with sparkles
      const pulse = 1 + Math.sin(tick * 0.12) * 0.1;
      ctx.save();
      ctx.scale(pulse, pulse);

      // Golden Aura Glow
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.28)';
      ctx.fill();

      // Golden starburst body
      this.drawClayBlob(ctx, 0, 0, 14, 14, '#ffd700', '#ff8f00');
      // 5 Radiant Golden Starpoints
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2 + (tick * 0.02);
        const px = Math.cos(a) * 16;
        const py = Math.sin(a) * 16;
        this.drawClayBlob(ctx, px, py, 6, 6, '#fff176', '#f57f17');
      }

      // Royal Golden Leaf Crown
      this.drawClayBlob(ctx, -4, -13, 5, 4, '#ffca28', '#ff6f00', -0.3);
      this.drawClayBlob(ctx, 4, -13, 5, 4, '#ffca28', '#ff6f00', 0.3);
      this.drawClayBlob(ctx, 0, -16, 4, 5, '#ffee58', '#f57f17');

      // Brilliant diamond glint highlight
      this.drawClayBlob(ctx, -3, -3, 4, 4, '#ffffff', '#fff59d');
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw Clay Splat Particles (direct single-pass rendering)
   */
  static drawClayChunk(ctx, x, y, size, color, shadowColor, angle) {
    ctx.save();
    ctx.translate(x, y);
    if (angle !== 0) ctx.rotate(angle);

    const rx = size;
    const ry = size * 0.7;

    // Drop shadow
    ctx.beginPath();
    ctx.ellipse(2, 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();

    // Plasticine body with cached radial gradient
    const lx = -rx * 0.28;
    const ly = -ry * 0.28;
    const grad = ClayRenderer.getRadialGradient(ctx, lx, ly, rx * 0.1, rx, color, shadowColor);

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim highlight
    ctx.lineWidth = Math.max(1.2, rx * 0.08);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.stroke();

    ctx.restore();
  }
}
