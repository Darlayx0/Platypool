// Procedural Claymation Graphics Engine for Platypus AI
import { Clay3D } from './Clay3D.js';

export class ClayRenderer {
  // When true, entity bodies are rendered by the WebGL Scene3D layer instead of these 2D routines
  static use3D = false;
  // Flyweight cache for radial and linear CanvasGradient objects
  static gradientCache = new Map();

  static evictOldGradients(count = 60) {
    const iter = ClayRenderer.gradientCache.keys();
    for (let i = 0; i < count; i++) {
      const k = iter.next().value;
      if (k) ClayRenderer.gradientCache.delete(k);
      else break;
    }
  }

  static getRadialGradient(ctx, lx, ly, r0, r1, baseColor, shadowColor) {
    const key = `rad_${Math.round(lx)}_${Math.round(ly)}_${Math.round(r0)}_${Math.round(r1)}_${baseColor}_${shadowColor}`;
    let grad = ClayRenderer.gradientCache.get(key);
    if (!grad) {
      if (ClayRenderer.gradientCache.size > 500) {
        ClayRenderer.evictOldGradients(60);
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
      if (ClayRenderer.gradientCache.size > 500) {
        ClayRenderer.evictOldGradients(60);
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
    radiusX = Math.max(0.5, Math.abs(radiusX));
    radiusY = Math.max(0.5, Math.abs(radiusY));
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
    width = Math.max(1, Math.abs(width));
    height = Math.max(1, Math.abs(height));
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
   * Ultra-HD 4K Claymorphic Plate / Card
   * Features:
   * - Volumetric tactile plasticine bevel with dual inner highlight & shadow
   * - Diffused soft elevation drop shadow
   * - Smooth rounded vector bounds
   */
  static drawClaymorphicPlate(ctx, x, y, width, height, radius = 20, baseColor = '#2a1e18', shadowColor = '#140c08', borderColor = 'rgba(255, 255, 255, 0.12)') {
    ctx.save();

    // 1. Soft diffused elevation drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;

    // Rounded rectangle path
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      ctx.closePath();
    }

    // 2. Base clay body gradient
    const grad = ctx.createLinearGradient(x, y, x + width * 0.25, y + height);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(1, shadowColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // Disable outer shadow for crisp inner details
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 3. Subtle outer border rim
    if (borderColor) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }

    // 4. Volumetric Clay Highlight (Top & Left Inner Bevel)
    ctx.save();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineCap = 'round';
    const inset = 3;
    const innerR = Math.max(2, radius - inset);

    ctx.beginPath();
    ctx.moveTo(x + innerR + 4, y + inset);
    ctx.lineTo(x + width - innerR - 4, y + inset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + inset, y + innerR + 4);
    ctx.lineTo(x + inset, y + height - innerR - 4);
    ctx.stroke();
    ctx.restore();

    // 5. Ambient Clay Occlusion (Bottom & Right Inner Shadow)
    ctx.save();
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x + innerR + 4, y + height - inset);
    ctx.lineTo(x + width - innerR - 4, y + height - inset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width - inset, y + innerR + 4);
    ctx.lineTo(x + width - inset, y + height - innerR - 4);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw the iconic Player Fighter Plane (Novocastrian style)
   * Full 3D Volumetric Claymation: 3D Roll Banking, Pitch Kinematics, Beveled Wings & Canopy
   */
  static drawPlayerShip(ctx, x, y, tilt = 0, invulnerable = false, engineTick = 0, weaponType = 'NORMAL', roll = 0, pitch = 0, isBoosted = false) {
    ctx.save();
    ctx.translate(x, y);

    // Compute effective roll and pitch (fallback to tilt if roll not explicitly supplied)
    const effRoll = roll !== 0 ? roll : (tilt * 0.45);
    const effPitch = pitch !== 0 ? pitch : (-tilt * 0.12);

    // Pitch attitude rotation on 2D screen
    ctx.rotate(tilt * 0.22);

    // Invulnerability flashing
    if (invulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.42;
    }

    // Shield bubble if invulnerable (with 3D depth orbital rings)
    if (invulnerable) {
      ctx.save();
      // Outer 3D orbital shield ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 42, effRoll * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(66, 165, 245, 0.88)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([9, 6]);
      ctx.lineDashOffset = -engineTick * 4;
      ctx.stroke();

      // Translucent clay energy field
      ctx.fillStyle = 'rgba(33, 150, 243, 0.20)';
      ctx.fill();

      // Inner specular rim
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 38, effRoll * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 1. Engine exhaust 3D volumetric fire plumes
    Clay3D.drawVolumetricExhaust(ctx, -26, 0, effRoll, effPitch, engineTick, isBoosted);

    // 2. Vertical Rudder (Tail fin) with 3D leaning angle
    ctx.save();
    const rudderLean = -0.28 + effRoll * 0.42;
    const rudderY = -14 - Math.sin(effRoll) * 7;
    this.drawClayCapsule(ctx, -26, rudderY, 18, 9, '#cfd8dc', '#78909c', rudderLean);
    this.drawClayBlob(ctx, -26, rudderY - 5, 5, 5, '#e53935', '#b71c1c');
    ctx.restore();

    // 3. Lower Wing (Sub-fuselage 3D depth layer)
    Clay3D.draw3DWing(ctx, 0, 0, effRoll, effPitch, false, weaponType, engineTick);

    // 4. Volumetric Main Fuselage (Chunky rounded vintage clay rocket-plane)
    Clay3D.drawVolumetricFuselage(ctx, 0, 0, effRoll, effPitch, 58, 13, 15, '#eceff1', '#607d8b', '#e53935');

    // 5. Upper Wing (Supra-fuselage 3D depth layer)
    Clay3D.draw3DWing(ctx, 0, 0, effRoll, effPitch, true, weaponType, engineTick);

    // 6. Cockpit Canopy Bubble (Yellow clay glass with 3D refraction arcs)
    Clay3D.draw3DCockpitCanopy(ctx, 0, 0, effRoll, effPitch, 14, 9);

    // 7. 3D Inclined Propeller Disk & Sculpted Spinner Hub
    Clay3D.draw3DPropeller(ctx, 29, 0, effRoll, effPitch, 19, engineTick);

    ctx.restore();
  }

  /**
   * Draw Stage 5 Wave 1 Special Fruit Carrier Ship
   * A delightful golden-amber clay transport aircraft loaded with juicy fruits
   */
  static drawFruitCarrier(ctx, x, y, tick = 0, color = '#ffb300', shadowColor = '#e65100', roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Subtle gentle bobbing and 3D banking
    const bob = Math.sin(tick * 0.05) * 2.0;
    ctx.translate(0, bob);
    ctx.rotate(roll * 0.28);
    const sinR = Math.sin(roll);

    // 1. Soft clay shadow underneath
    this.drawClayBlob(ctx, 4, 18 + sinR * 4, 28, 8, 'rgba(0,0,0,0.22)', 'transparent');

    // 2. Twin Wings (Upper & Lower biplane / transport wings) with 3D displacement
    this.drawClayCapsule(ctx, 2, -18 + sinR * 6, 54, 12, '#ffe082', '#ffb300', -0.06 + roll * 0.12);
    this.drawClayCapsule(ctx, 2, 18 + sinR * 6, 54, 12, '#ffe082', '#ffb300', 0.06 + roll * 0.12);

    // Wing vertical struts
    this.drawClayCapsule(ctx, -8, 0, 8, 32, '#ffca28', '#f57f17');
    this.drawClayCapsule(ctx, 14, 0, 8, 32, '#ffca28', '#f57f17');

    // 3. Tail stabilizer & fin with 3D lean
    this.drawClayCapsule(ctx, 24, -12 - sinR * 4, 18, 10, color, shadowColor, -0.4 + roll * 0.2);
    this.drawClayBlob(ctx, 26, -16 - sinR * 4, 7, 9, '#ff5722', '#bf360c');

    // 4. Main Fuselage (Chunky rounded transport body)
    this.drawClayCapsule(ctx, 0, 0, 64, 28, color, shadowColor);

    // 5. Cargo compartment stripe (Pastel cream belly with 3D shift)
    this.drawClayCapsule(ctx, 2, 4 + sinR * 3, 44, 13, '#fff9c4', '#fff59d');

    // 6. Fruit crate emblem on the side (Colorful clay fruit slice badge)
    this.drawClayBlob(ctx, -3, 4 + sinR * 3, 7, 7, '#4caf50', '#2e7d32');
    this.drawClayBlob(ctx, -3, 4 + sinR * 3, 4.5, 4.5, '#e91e63', '#c2185b');
    this.drawClayBlob(ctx, 8, 3 + sinR * 3, 5.5, 5.5, '#ffd600', '#f57f17');

    // 7. Cockpit window (Teal/cyan clay bubble)
    this.drawClayBlob(ctx, -18, -4 - sinR * 3, 9, 8, '#00e5ff', '#0097a7');
    this.drawClayBlob(ctx, -20, -6 - sinR * 3, 3.5, 3.5, '#ffffff', '#e0f7fa');

    // 8. Spinning Propeller at Nose (Left side)
    const propAngle = tick * 24;
    ctx.save();
    ctx.translate(-33, 0);
    this.drawClayBlob(ctx, 0, 0, 5, 5, '#d84315', '#bf360c');
    ctx.rotate(propAngle);
    this.drawClayCapsule(ctx, 0, 0, 6, 28, 'rgba(255, 255, 255, 0.85)', '#cfd8dc');
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Scout (small red/purple rounded insectoid plane)
   */
  static drawScout(ctx, x, y, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll * 0.35);

    const flap = Math.sin(tick * 0.4) * 4;
    const sinR = Math.sin(roll);

    // Small exhaust puff with 3D wobble
    this.drawClayBlob(ctx, 18, 0, 5, 4, '#ffb74d', '#e65100');

    // 3D Beveled Wings
    const wingY1 = -12 + flap + sinR * 6;
    const wingY2 = 12 - flap + sinR * 6;
    this.drawClayCapsule(ctx, 0, wingY1, 24, 7, '#ab47bc', '#6a1b9a', -0.15 + roll * 0.2);
    this.drawClayCapsule(ctx, 0, wingY2, 24, 7, '#ab47bc', '#6a1b9a', 0.15 + roll * 0.2);

    // Main bulbous body with 3D normal lighting
    this.drawClayBlob(ctx, 0, 0, 18, 14, '#e91e63', '#880e4f', -Math.PI / 4 + roll * 0.35);

    // Cockpit / eye with 3D glass highlight
    this.drawClayBlob(ctx, -8, -sinR * 2, 7, 7, '#80deea', '#00838f');

    // Nose stinger / gun
    this.drawClayCapsule(ctx, -18, 0, 10, 4, '#424242', '#212121');

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Drone (fast green beetle craft)
   */
  static drawDrone(ctx, x, y, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll * 0.35);

    const sinR = Math.sin(roll);

    // Twin engines with 3D depth offset
    this.drawClayCapsule(ctx, 12, -9 + sinR * 5, 14, 6, '#66bb6a', '#2e7d32');
    this.drawClayCapsule(ctx, 12, 9 + sinR * 5, 14, 6, '#66bb6a', '#2e7d32');

    // Main hull with 3D normal lighting
    this.drawClayBlob(ctx, 0, 0, 20, 12, '#43a047', '#1b5e20', -Math.PI / 4 + roll * 0.35);

    // Yellow armored back stripes with 3D curve
    this.drawClayCapsule(ctx, 4, -sinR * 3, 8, 10, '#fbc02d', '#f57f17');

    // Red visor with tactile specular arc
    this.drawClayCapsule(ctx, -10, -sinR * 2, 6, 8, '#ff5252', '#b71c1c');

    ctx.restore();
  }

  /**
   * Draw Enemy: Heavy Gunship (armored blue flying fortress)
   */
  static drawGunship(ctx, x, y, hpRatio = 1, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll * 0.28);

    const sinR = Math.sin(roll);

    // 1. Massive 3D wings with depth layer displacement and bevels
    this.drawClayCapsule(ctx, 10, -28 + sinR * 8, 48, 16, '#3949ab', '#1a237e', -0.2 + roll * 0.15);
    this.drawClayCapsule(ctx, 10, 28 + sinR * 8, 48, 16, '#3949ab', '#1a237e', 0.2 + roll * 0.15);

    // Wing turrets with 3D highlight
    this.drawClayBlob(ctx, 4, -32 + sinR * 8, 9, 9, '#ffca28', '#f57f17', -Math.PI / 4 + roll * 0.3);
    this.drawClayBlob(ctx, 4, 32 + sinR * 8, 9, 9, '#ffca28', '#f57f17', -Math.PI / 4 + roll * 0.3);

    // 2. Main heavy fuselage with volumetric clay gradient
    this.drawClayCapsule(ctx, 0, 0, 72, 34, '#42a5f5', '#0d47a1');

    // 3. Armored frontal cockpit with 3D visor
    this.drawClayBlob(ctx, -22, -sinR * 3, 15, 12, '#cfd8dc', '#455a64');
    this.drawClayCapsule(ctx, -26, -sinR * 3, 6, 12, '#ff1744', '#b71c1c');

    // 4. Dual heavy cannons with 3D perspective
    this.drawClayCapsule(ctx, -28, -12 + sinR * 4, 22, 7, '#37474f', '#212121');
    this.drawClayCapsule(ctx, -28, 12 + sinR * 4, 22, 7, '#37474f', '#212121');

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
  static drawBlimp(ctx, x, y, hpRatio = 1, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);

    const bob = Math.sin(tick * 0.05) * 3;
    ctx.translate(0, bob);
    ctx.rotate(roll * 0.16);
    const sinR = Math.sin(roll);

    // Rear rudder fins with 3D banking angles
    this.drawClayCapsule(ctx, 60, -32 - sinR * 6, 26, 14, '#ffb74d', '#e65100', -0.4 + roll * 0.15);
    this.drawClayCapsule(ctx, 60, 32 - sinR * 6, 26, 14, '#ffb74d', '#e65100', 0.4 + roll * 0.15);
    this.drawClayCapsule(ctx, 65, 0, 24, 12, '#ffb74d', '#e65100');

    // Giant Gasbag (Clay Zeppelin body)
    this.drawClayCapsule(ctx, 0, 0, 130, 62, '#ffe082', '#ff8f00');

    // 3D dynamic rotating latitude ridges on balloon
    const ridgeShift = Math.sin(tick * 0.03 + roll) * 8;
    ctx.strokeStyle = 'rgba(191, 54, 12, 0.42)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ridgeShift, 0, 56, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ridgeShift - 14, 0, 42, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    // Underbelly cabin / gondola with 3D drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(-10, 34 + sinR * 4, 25, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawClayCapsule(ctx, -10, 36 + sinR * 4, 48, 16, '#8d6e63', '#4e342e');

    // Cabin windows
    for (let i = -22; i <= 6; i += 10) {
      this.drawClayBlob(ctx, i, 36 + sinR * 4, 3, 3, '#81d4fa', '#0288d1');
    }

    // Front Gun Turret with 3D highlight
    this.drawClayBlob(ctx, -56, 10 + sinR * 2, 14, 14, '#78909c', '#37474f', -Math.PI / 4 + roll * 0.25);
    this.drawClayCapsule(ctx, -68, 10 + sinR * 2, 16, 6, '#263238', '#000000');

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
  static drawStinger(ctx, x, y, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll * 0.38);

    const sinR = Math.sin(roll);

    // Jet thruster flames
    const flame = 12 + Math.sin(tick * 0.8) * 5;
    this.drawClayBlob(ctx, 16 + flame * 0.3, 0, flame, flame * 0.5, '#ff3d00', '#bf360c');
    this.drawClayBlob(ctx, 12, 0, 6, 4, '#ffee58', '#f57c00');

    // Swept-forward wings with 3D depth displacement
    this.drawClayCapsule(ctx, 2, -14 + sinR * 6, 22, 6, '#ffa000', '#e65100', -0.35 + roll * 0.2);
    this.drawClayCapsule(ctx, 2, 14 + sinR * 6, 22, 6, '#ffa000', '#e65100', 0.35 + roll * 0.2);

    // Aerodynamic wasp fuselage with 3D volumetric shading
    this.drawClayCapsule(ctx, 0, 0, 32, 13, '#ffb300', '#e65100');

    // Black clay stinger stripes with 3D curvature
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(3, -sinR * 2, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-3, -sinR * 2, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sharp stinger nose
    this.drawClayCapsule(ctx, -18, 0, 14, 4, '#d84315', '#bf360c');

    // Glowing red ocular sensor with specular glare
    this.drawClayBlob(ctx, -8, -sinR * 2, 5, 5, '#ff1744', '#b71c1c');

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Sniper Skiff (long range precision craft)
   */
  static drawSniper(ctx, x, y, isAiming = false, aimProgress = 0, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll * 0.26);

    const sinR = Math.sin(roll);

    // Engine exhaust
    this.drawClayBlob(ctx, 22, 0, 7, 5, '#ab47bc', '#4a148c');

    // Sleek needle wings with 3D depth
    this.drawClayCapsule(ctx, 6, -16 + sinR * 5, 26, 6, '#7e57c2', '#311b92', -0.2 + roll * 0.15);
    this.drawClayCapsule(ctx, 6, 16 + sinR * 5, 26, 6, '#7e57c2', '#311b92', 0.2 + roll * 0.15);

    // Main stealth chassis
    this.drawClayCapsule(ctx, 2, 0, 44, 15, '#512da8', '#1a237e');

    // Long Railgun barrel
    this.drawClayCapsule(ctx, -26, 0, 28, 5, '#263238', '#000000');
    // Railgun muzzle glow
    if (isAiming) {
      const chargePulse = 5 + aimProgress * 6;
      this.drawClayBlob(ctx, -40, 0, chargePulse, chargePulse, '#ff1744', '#b71c1c');
    }

    // Targeting scanner optic with 3D glare
    this.drawClayBlob(ctx, -8, -sinR * 2, 6, 6, isAiming ? '#ff1744' : '#00e676', '#004d40');

    ctx.restore();
  }

  /**
   * Draw Enemy: Clay Heavy Bomber
   */
  static drawBomber(ctx, x, y, hpRatio = 1, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll * 0.25);

    const sinR = Math.sin(roll);

    // Heavy dual propeller engines with 3D depth displacement
    this.drawClayCapsule(ctx, 4, -26 + sinR * 8, 32, 12, '#558b2f', '#1b5e20');
    this.drawClayCapsule(ctx, 4, 26 + sinR * 8, 32, 12, '#558b2f', '#1b5e20');

    // Propeller spinners with 3D tilt
    const prop1 = tick * 0.8;
    ctx.save();
    ctx.translate(-12, -26 + sinR * 8);
    ctx.rotate(prop1);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-2, -12, 4, 24);
    ctx.restore();

    ctx.save();
    ctx.translate(-12, 26 + sinR * 8);
    ctx.rotate(-prop1);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-2, -12, 4, 24);
    ctx.restore();

    // Main heavy fuselage with volumetric shading
    this.drawClayCapsule(ctx, 0, 0, 68, 30, '#689f38', '#2e7d32');

    // Bomb bay doors underbelly
    this.drawClayCapsule(ctx, 0, 10 + sinR * 4, 30, 8, '#33691e', '#1b5e20');

    // Glass bubble cockpit
    this.drawClayBlob(ctx, -22, -4 - sinR * 3, 11, 9, '#80deea', '#00838f');

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
  static drawSpinner(ctx, x, y, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);

    // 3D Oblique Perspective Foreshortening
    const tiltScale = Math.max(0.65, 1.0 - Math.abs(roll) * 0.35);
    ctx.scale(1.0, tiltScale);
    ctx.rotate(roll * 0.3);

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

    // Outer disc ring with 3D gradient
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
  static drawShieldCruiser(ctx, x, y, shieldRatio = 1, hpRatio = 1, tick = 0, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(roll * 0.28);

    const sinR = Math.sin(roll);

    // Twin heavy ion thrusters
    const thrust = 12 + Math.sin(tick * 0.5) * 4;
    this.drawClayBlob(ctx, 32 + thrust * 0.2, -14 + sinR * 5, thrust, thrust * 0.5, '#00e5ff', '#00838f');
    this.drawClayBlob(ctx, 32 + thrust * 0.2, 14 + sinR * 5, thrust, thrust * 0.5, '#00e5ff', '#00838f');

    // Heavy battleship hull with 3D volumetric shading
    this.drawClayCapsule(ctx, 0, 0, 68, 34, '#37474f', '#212121');

    // Cyan reinforced plating with 3D depth displacement
    this.drawClayCapsule(ctx, -8, -14 + sinR * 6, 38, 10, '#00acc1', '#006064');
    this.drawClayCapsule(ctx, -8, 14 + sinR * 6, 38, 10, '#00acc1', '#006064');

    // Shield Projector emitters at prow
    this.drawClayBlob(ctx, -32, -16 + sinR * 4, 7, 7, '#00e5ff', '#00838f');
    this.drawClayBlob(ctx, -32, 16 + sinR * 4, 7, 7, '#00e5ff', '#00838f');

    // Forward Energy Shield Dome (3D elliptical arc in perspective)
    if (shieldRatio > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(-26, 0, 36, 42, roll * 0.25, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + shieldRatio * 0.5})`;
      ctx.lineWidth = 6;
      ctx.stroke();

      // Shield shimmer arc
      ctx.beginPath();
      ctx.ellipse(-26, 0, 33, 39, roll * 0.25, -Math.PI * 0.38, Math.PI * 0.38);
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
  static drawInterceptor(ctx, x, y, hpRatio = 1, tick = 0, isAiming = false, aimAngle = Math.PI) {
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

    // 3-Laser telegraph aiming lines when preparing to shoot
    if (isAiming) {
      ctx.save();
      const offs = [-0.20, 0, 0.20];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      for (const off of offs) {
        const ang = aimAngle + off;
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-25 + Math.cos(ang) * 220, Math.sin(ang) * 220);
        ctx.stroke();
      }
      ctx.restore();
    }

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
   * Draw Enemy: Retro Biplane (World 1 vintage aircraft)
   */
  static drawRetroBiplane(ctx, x, y, tick = 0, hpRatio = 1, isAnchored = false, facingLeft = true, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    if (!facingLeft) ctx.scale(-1, 1);

    // 3D Roll Banking
    ctx.rotate(roll * 0.35);
    const sinR = Math.sin(roll);

    // Propeller spinning animation at nose with 3D skewed disk
    const propPhase = Math.sin(tick * 1.2);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-26, 0, 3.5, Math.max(1, Math.abs(17 * propPhase)), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Nose spinner cap (Clay cone)
    this.drawClayBlob(ctx, -24, 0, 6, 6, '#d84315', '#bf360c');

    // Fuselage (warm clay orange with 3D shading)
    this.drawClayCapsule(ctx, 0, 0, 44, 16, '#ff7043', '#d84315');

    // Upper wing (3D depth displaced)
    this.drawClayCapsule(ctx, -2, -14 + sinR * 6, 46, 8, '#ffa726', '#e65100', -roll * 0.15);
    // Lower wing (3D depth displaced)
    this.drawClayCapsule(ctx, 2, 14 + sinR * 6, 42, 8, '#ffa726', '#e65100', roll * 0.15);

    // Wing connecting struts (3D perspective slant)
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, -10 + sinR * 6); ctx.lineTo(-10, 10 + sinR * 6);
    ctx.moveTo(10, -10 + sinR * 6); ctx.lineTo(10, 10 + sinR * 6);
    ctx.stroke();

    // Tail fin and rudder with 3D lean
    this.drawClayCapsule(ctx, 20, -8 - sinR * 4, 12, 14, '#ff7043', '#bf360c', 0.2 + roll * 0.2);

    // Cockpit windscreen
    this.drawClayBlob(ctx, -4, -4 - sinR * 2, 7, 5, '#80deea', '#0097a7');

    // Wheels undercarriage with depth
    this.drawClayBlob(ctx, -6, 12 + sinR * 4, 5, 5, '#37474f', '#212121');

    if (isAnchored) {
      // Thruster brake glow when anchored at right screen
      ctx.fillStyle = 'rgba(255, 179, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(22, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -26, 36, 4);
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(-18, -26, 36 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Swing Glider (World 1 aerodynamic pendulum glider)
   */
  static drawSwingGlider(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);

    // Dynamic bank tilt based on pendulum motion
    const bankAngle = Math.sin(tick * 0.1) * 0.22;
    ctx.rotate(bankAngle);

    // Decorative clay tail streamers
    const tailWave = Math.sin(tick * 0.2) * 8;
    ctx.strokeStyle = 'rgba(38, 166, 154, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(34, tailWave, 46, -tailWave);
    ctx.stroke();

    // Broad swept delta wings (teal/emerald clay)
    this.drawClayCapsule(ctx, -2, -16, 28, 9, '#26a69a', '#004d40', -0.35);
    this.drawClayCapsule(ctx, -2, 16, 28, 9, '#26a69a', '#004d40', 0.35);

    // Central rounded pod fuselage
    this.drawClayCapsule(ctx, 0, 0, 40, 15, '#00897b', '#004d40');

    // Canopy jewel
    this.drawClayBlob(ctx, -8, 0, 8, 5, '#80cbc4', '#004d40');

    // Wingtip orb blasters
    this.drawClayBlob(ctx, -14, -18, 4, 4, '#ffb300', '#ff6f00');
    this.drawClayBlob(ctx, -14, 18, 4, 4, '#ffb300', '#ff6f00');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#26a69a';
      ctx.fillRect(-16, -26, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Canyon Diver (World 2 steep dive-bomber from sky)
   */
  static drawCanyonDiver(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);
    // Heading angled downward
    ctx.rotate(0.55);

    // Sand dust plume from exhaust
    const exhaust = 14 + Math.sin(tick * 0.4) * 4;
    this.drawClayBlob(ctx, 24, 0, exhaust, exhaust * 0.45, '#ffb74d', '#e65100');

    // Sharp hawk-beak fuselage (amber / terracotta)
    this.drawClayCapsule(ctx, 0, 0, 44, 14, '#ff9800', '#e65100');

    // Knife-edged dive fins
    this.drawClayCapsule(ctx, 4, -16, 26, 7, '#ffa726', '#bf360c', -0.5);
    this.drawClayCapsule(ctx, 4, 16, 26, 7, '#ffa726', '#bf360c', 0.5);

    // Sharp beak nose cone
    this.drawClayBlob(ctx, -22, 0, 8, 4, '#d84315', '#8c2600');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(-16, -26, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Geyser Rusher (World 2 rocket jumper from bottom)
   */
  static drawGeyserRusher(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);
    // Heading angled upward
    ctx.rotate(-0.55);

    // Fiery sand booster flame plume
    const flame = 18 + Math.sin(tick * 0.5) * 5;
    this.drawClayBlob(ctx, 24, 0, flame, flame * 0.45, '#ff5722', '#b71c1c');

    // Heavy rocket canister hull (brick red / dark rust)
    this.drawClayCapsule(ctx, 0, 0, 42, 16, '#d84315', '#bf360c');

    // Stabilizer fins
    this.drawClayCapsule(ctx, 16, -14, 18, 6, '#e64a19', '#8c2600', -0.4);
    this.drawClayCapsule(ctx, 16, 14, 18, 6, '#e64a19', '#8c2600', 0.4);

    // Reinforced drill nose
    this.drawClayBlob(ctx, -20, 0, 7, 6, '#ffab91', '#d84315');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -24, 32, 4);
      ctx.fillStyle = '#ff5722';
      ctx.fillRect(-16, -24, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Falcon Tracker (World 2 active 2D pursuit raptor)
   */
  static drawFalconTracker(ctx, x, y, angle = Math.PI, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);
    // Orient towards actual heading angle
    ctx.rotate(angle);

    // Twin vector thrust nozzles
    const thruster = 12 + Math.sin(tick * 0.3) * 3;
    this.drawClayBlob(ctx, -20, -8, thruster, 4, '#ff9800', '#e65100');
    this.drawClayBlob(ctx, -20, 8, thruster, 4, '#ff9800', '#e65100');

    // Raptor swept-forward wings
    this.drawClayCapsule(ctx, -2, -18, 30, 8, '#f57c00', '#b26a00', 0.45);
    this.drawClayCapsule(ctx, -2, 18, 30, 8, '#f57c00', '#b26a00', -0.45);

    // Main raptor body (golden canyon clay)
    this.drawClayCapsule(ctx, 0, 0, 46, 15, '#ffb300', '#e65100');

    // Sensor eye cluster
    this.drawClayBlob(ctx, 16, -4, 4, 3, '#d50000', '#b71c1c');
    this.drawClayBlob(ctx, 16, 4, 4, 3, '#d50000', '#b71c1c');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -28, 36, 4);
      ctx.fillStyle = '#f57c00';
      ctx.fillRect(-18, -28, 36 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Cyber Phantom (World 3 stealth jet with rear flank & anchor)
   */
  static drawCyberPhantom(ctx, x, y, tick = 0, hpRatio = 1, isAnchored = false) {
    ctx.save();
    ctx.translate(x, y);
    if (isAnchored) {
      // Facing player to the left
      ctx.scale(1, 1);
    } else {
      // Moving right forward
      ctx.scale(-1, 1);
    }

    // Neon cyan grid aura
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-22, -14, 44, 28);

    // Sleek faceted obsidian stealth body
    this.drawClayCapsule(ctx, 0, 0, 48, 14, '#1a237e', '#0d1338');

    // Razor wings with cyan circuit lines
    this.drawClayCapsule(ctx, 4, -18, 28, 7, '#00bcd4', '#006064', -0.4);
    this.drawClayCapsule(ctx, 4, 18, 28, 7, '#00bcd4', '#006064', 0.4);

    // Visor eye
    this.drawClayBlob(ctx, -18, 0, 8, 4, '#00e5ff', '#00838f');

    if (isAnchored) {
      // Pulsing EMP emitter coil when locked on target
      const empGlow = 10 + Math.sin(tick * 0.4) * 4;
      ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(-24, 0, empGlow, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -26, 36, 4);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-18, -26, 36 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Cyber Pendulum (World 3 magnetic laser sweeper)
   */
  static drawCyberPendulum(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);

    // Magnetic flux beam from top screen
    ctx.strokeStyle = 'rgba(124, 77, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating gyro rings (purple & electric violet)
    ctx.save();
    ctx.rotate(tick * 0.08);
    ctx.strokeStyle = 'rgba(179, 136, 255, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Spherical core
    this.drawClayBlob(ctx, 0, 0, 18, 18, '#7c4dff', '#4527a0');
    // Inner pulse lens
    this.drawClayBlob(ctx, -4, 0, 8, 8, '#e040fb', '#aa00ff');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#b388ff';
      ctx.fillRect(-16, -26, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Void Stalker (World 4 alien cosmic homing biomech)
   */
  static drawVoidStalker(ctx, x, y, angle = Math.PI, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Undulating alien bio-tentacles
    for (let k = -1; k <= 1; k++) {
      const tWave = Math.sin(tick * 0.2 + k * 1.5) * 8;
      ctx.strokeStyle = 'rgba(234, 128, 252, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-20, k * 10);
      ctx.quadraticCurveTo(-32, k * 14 + tWave, -44, k * 10 - tWave);
      ctx.stroke();
    }

    // Alien crystal carapace (cosmic violet / dark nebula)
    this.drawClayCapsule(ctx, 0, 0, 48, 16, '#6a1b9a', '#38006b');

    // Forward chitinous mandibles
    this.drawClayCapsule(ctx, 18, -8, 16, 5, '#ab47bc', '#4a148c', 0.35);
    this.drawClayCapsule(ctx, 18, 8, 16, 5, '#ab47bc', '#4a148c', -0.35);

    // Glowing cosmic pupil
    const eyeP = 7 + Math.sin(tick * 0.2) * 2;
    this.drawClayBlob(ctx, 6, 0, eyeP, eyeP * 0.6, '#00e5ff', '#00b0ff');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -28, 36, 4);
      ctx.fillStyle = '#ea80fc';
      ctx.fillRect(-18, -28, 36 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Meteor Diver (World 4 burning cosmic shard from above)
   */
  static drawMeteorDiver(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.65);

    // Flaming comet tail
    const flameL = 28 + Math.sin(tick * 0.5) * 6;
    this.drawClayBlob(ctx, 28, 0, flameL, flameL * 0.4, '#ff1744', '#b71c1c');
    this.drawClayBlob(ctx, 16, 0, 16, 10, '#ff9100', '#d50000');

    // Rough asteroid chunk body
    this.drawClayBlob(ctx, 0, 0, 22, 16, '#c62828', '#5f0909');
    // Molten magma fissures
    this.drawClayBlob(ctx, -8, -4, 6, 4, '#ffd600', '#ff6d00');
    this.drawClayBlob(ctx, 4, 6, 5, 3, '#ffd600', '#ff6d00');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#ff5252';
      ctx.fillRect(-16, -26, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Abyss Ascender (World 4 void rocket from bottom)
   */
  static drawAbyssAscender(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.65);

    // Violet plasma booster trail
    const pTrail = 26 + Math.sin(tick * 0.4) * 6;
    this.drawClayBlob(ctx, 28, 0, pTrail, pTrail * 0.38, '#d500f9', '#4a148c');

    // Dark void hull with radiant violet edges
    this.drawClayCapsule(ctx, 0, 0, 46, 16, '#4a148c', '#12005e');

    // Swept starlight fins
    this.drawClayCapsule(ctx, 14, -14, 20, 6, '#aa00ff', '#4a148c', -0.4);
    this.drawClayCapsule(ctx, 14, 14, 20, 6, '#aa00ff', '#4a148c', 0.4);

    // Crystalline nose cone
    this.drawClayBlob(ctx, -20, 0, 8, 5, '#ea80fc', '#aa00ff');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#ea80fc';
      ctx.fillRect(-16, -26, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Warp Flanker (World 4 dimension jumper)
   */
  static drawWarpFlanker(ctx, x, y, tick = 0, hpRatio = 1, isAnchored = false) {
    ctx.save();
    ctx.translate(x, y);
    if (!isAnchored) ctx.scale(-1, 1);

    // Warp ripple rings
    ctx.strokeStyle = 'rgba(224, 64, 251, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Delta needle craft
    this.drawClayCapsule(ctx, 0, 0, 48, 14, '#8e24aa', '#4a148c');
    this.drawClayCapsule(ctx, 2, -16, 26, 6, '#ba68c8', '#6a1b9a', -0.4);
    this.drawClayCapsule(ctx, 2, 16, 26, 6, '#ba68c8', '#6a1b9a', 0.4);

    // Warp core
    this.drawClayBlob(ctx, -14, 0, 7, 5, '#f48fb1', '#c2185b');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#e040fb';
      ctx.fillRect(-16, -26, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Cosmic Orbiter (World 4 gyroscopic gravity orbiter)
   */
  static drawCosmicOrbiter(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);

    // Dual gyroscopic orbits
    ctx.save();
    ctx.rotate(tick * 0.05);
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 16, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = 'rgba(128, 222, 234, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Central pulsing nebula sphere
    const p = 18 + Math.sin(tick * 0.15) * 3;
    this.drawClayBlob(ctx, 0, 0, p, p, '#004d40', '#00251a');
    this.drawClayBlob(ctx, 0, 0, 9, 9, '#64ffda', '#00bfa5');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -34, 36, 4);
      ctx.fillStyle = '#64ffda';
      ctx.fillRect(-18, -34, 36 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Quantum Warper (World 4 phase-shifting teleporter)
   */
  static drawQuantumWarper(ctx, x, y, tick = 0, hpRatio = 1, blinkAlpha = 1, roll = 0, pitch = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = Math.max(0.12, Math.min(1.0, blinkAlpha));
    if (roll) ctx.rotate(roll * 0.4);

    // Quantum distortion trail
    for (let i = 1; i <= 3; i++) {
      const trailAlpha = (1 - i * 0.28) * blinkAlpha * 0.45;
      ctx.strokeStyle = `rgba(0, 229, 255, ${trailAlpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-24 - i * 8, -12, 12, 24);
    }

    // Prismatic hull
    this.drawClayCapsule(ctx, 0, 0, 38, 14, '#00e5ff', '#006064');
    this.drawClayBlob(ctx, 6, 0, 10, 8, '#e0f7fa', '#80deea');

    // Tachyon wings
    this.drawClayCapsule(ctx, -6, -14, 20, 6, '#00b4d8', '#0077b6', -0.35);
    this.drawClayCapsule(ctx, -6, 14, 20, 6, '#00b4d8', '#0077b6', 0.35);

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-16, -22, 32, 4);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-16, -22, 32 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Singularity Orb (World 4 micro-gravitational well)
   */
  static drawSingularityOrb(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);

    // Event Horizon swirling rings
    ctx.save();
    ctx.rotate(tick * 0.05);
    ctx.strokeStyle = 'rgba(224, 64, 251, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(Math.PI / 3);
    ctx.strokeStyle = 'rgba(124, 77, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Black hole sphere with purple accretion fringe
    const r = 20 + Math.sin(tick * 0.2) * 2;
    this.drawClayBlob(ctx, 0, 0, r, r, '#0d001a', '#311b92');
    this.drawClayBlob(ctx, 0, 0, 10, 10, '#e040fb', '#7b1fa2');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -28, 36, 4);
      ctx.fillStyle = '#e040fb';
      ctx.fillRect(-18, -28, 36 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Binary Tether (World 4 dual crystal pylons with active laser tether)
   */
  static drawBinaryTether(ctx, x, y, partnerX, partnerY, tick = 0, isLinked = true) {
    // 1. Draw Active Laser Beam if partner is linked and alive
    if (isLinked && partnerX !== null && partnerY !== null && typeof partnerX === 'number' && typeof partnerY === 'number') {
      ctx.save();
      const beamGrad = ctx.createLinearGradient(x, y, partnerX, partnerY);
      beamGrad.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
      beamGrad.addColorStop(0.5, 'rgba(255, 109, 0, 0.85)');
      beamGrad.addColorStop(1, 'rgba(255, 215, 0, 0.9)');

      // Outer glow beam
      ctx.strokeStyle = 'rgba(255, 171, 0, 0.4)';
      ctx.lineWidth = 7 + Math.sin(tick * 0.3) * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(partnerX, partnerY);
      ctx.stroke();

      // Core electric beam
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(partnerX, partnerY);
      ctx.stroke();

      // Energy sparks along beam
      const midX = (x + partnerX) / 2 + Math.sin(tick * 0.4) * 8;
      const midY = (y + partnerY) / 2;
      this.drawClayBlob(ctx, midX, midY, 6, 6, '#ffffff', '#ffd700');
      ctx.restore();
    }

    // 2. Draw Pylon Body
    ctx.save();
    ctx.translate(x, y);
    this.drawClayCapsule(ctx, 0, 0, 32, 16, '#ffd700', '#ff6d00');
    this.drawClayBlob(ctx, 0, 0, 10, 10, '#ffffff', '#ff9100');
    ctx.restore();
  }

  /**
   * Draw Enemy: Chrono Leech (World 4 time-dilation void entity)
   */
  static drawChronoLeech(ctx, x, y, tick = 0, hpRatio = 1) {
    ctx.save();
    ctx.translate(x, y);

    // Undulating temporal tentacles
    for (let k = -1; k <= 1; k += 2) {
      const wave = Math.sin(tick * 0.18 + k) * 7;
      ctx.strokeStyle = 'rgba(234, 128, 252, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, k * 8);
      ctx.quadraticCurveTo(-28, k * 14 + wave, -38, k * 8 - wave);
      ctx.stroke();
    }

    // Chrono Leech carapace
    this.drawClayCapsule(ctx, 0, 0, 42, 18, '#aa00ff', '#4a148c');
    this.drawClayBlob(ctx, 8, 0, 12, 12, '#ea80fc', '#7b1fa2');

    // Chrono glow eye
    this.drawClayBlob(ctx, 12, 0, 5, 5, '#ffffff', '#e040fb');

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-18, -26, 36, 4);
      ctx.fillStyle = '#ea80fc';
      ctx.fillRect(-18, -26, 36 * hpRatio, 4);
    }
    ctx.restore();
  }

  /**
   * Draw Enemy: Cosmic Cruiser (World 4 armored heavy fortress ship, non-miniboss)
   */
  static drawCosmicCruiser(ctx, x, y, shieldRatio = 1, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Obsidian heavy cruiser hull
    this.drawClayCapsule(ctx, 0, 0, 74, 34, '#263238', '#102027');
    this.drawClayCapsule(ctx, -10, 0, 56, 26, '#37474f', '#212121');

    // Forward armor bow & heavy turrets
    this.drawClayCapsule(ctx, 24, -10, 20, 8, '#455a64', '#1c313a');
    this.drawClayCapsule(ctx, 24, 10, 20, 8, '#455a64', '#1c313a');

    // Orbiting defensive satellite shield nodes
    for (let k = 0; k < 2; k++) {
      const a = tick * 0.05 + k * Math.PI;
      const sx = Math.cos(a) * 36;
      const sy = Math.sin(a) * 22;
      this.drawClayBlob(ctx, sx, sy, 7, 7, '#00e5ff', '#006064');
    }

    // Shield energy arc
    if (shieldRatio > 0) {
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + shieldRatio * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 42, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    if (hpRatio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-24, -30, 48, 5);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-24, -30, 48 * hpRatio, 5);
    }
    ctx.restore();
  }

  /**
   * Draw Jumbo Enemy: JUMBO DREAD CRUISER (World 1 Steam Sky Fortress)
   */
  static drawJumboDreadCruiser(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Dual steam funnels with puffing steam clouds
    [-20, 20].forEach((fx, idx) => {
      this.drawClayCapsule(ctx, fx, -34, 12, 22, '#455a64', '#1c313a');
      const puffY = -50 - ((tick * 1.5 + idx * 25) % 30);
      const puffR = 8 + ((tick + idx * 15) % 15) * 0.6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(fx + Math.sin(tick * 0.1 + idx) * 5, puffY, puffR, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Colossal Bronze / Iron Hull (Radius ~62)
    this.drawClayCapsule(ctx, 0, 0, 128, 58, '#546e7a', '#263238');
    this.drawClayCapsule(ctx, -10, 0, 110, 48, '#607d8b', '#37474f');

    // Armor plating banding and rivets
    [-40, 0, 40].forEach(bx => {
      this.drawClayCapsule(ctx, bx, 0, 16, 52, '#78909c', '#37474f');
    });

    // 3. Rotating Clay Gun Turrets (Front, Top, Rear)
    // Front heavy turret
    this.drawClayBlob(ctx, -46, 0, 16, 16, '#ff9800', '#e65100');
    this.drawClayCapsule(ctx, -62, 0, 24, 6, '#263238', '#000000');
    // Top turret
    this.drawClayBlob(ctx, -10, -22, 12, 12, '#ffb74d', '#f57c00');
    this.drawClayCapsule(ctx, -24, -22, 18, 5, '#263238', '#000000', 0.2);
    // Bottom turret
    this.drawClayBlob(ctx, -10, 22, 12, 12, '#ffb74d', '#f57c00');
    this.drawClayCapsule(ctx, -24, 22, 18, 5, '#263238', '#000000', -0.2);

    // Rear engine giant propeller
    const propP = Math.sin(tick * 0.8);
    ctx.fillStyle = 'rgba(255, 179, 0, 0.85)';
    ctx.beginPath();
    ctx.ellipse(66, 0, 6, Math.max(0.5, Math.abs(36 * propP)), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw Jumbo Enemy: JUMBO SAND FORTRESS (World 2 Flying Sandstone Citadel)
   */
  static drawJumboSandFortress(ctx, x, y, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Sand dust swirl aura
    ctx.strokeStyle = 'rgba(216, 155, 123, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 78, 48, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Tiered sandstone fortress slabs
    this.drawClayCapsule(ctx, 0, 0, 138, 64, '#a1887f', '#4e342e');
    this.drawClayCapsule(ctx, -12, 0, 118, 52, '#bcaaa4', '#5d4037');

    // Central sand turbine wheel
    ctx.save();
    ctx.rotate(tick * 0.08);
    for (let b = 0; b < 4; b++) {
      ctx.rotate(Math.PI / 2);
      this.drawClayCapsule(ctx, 16, 0, 24, 8, '#d7ccc8', '#6d4c41');
    }
    ctx.restore();

    // Twin heavy mortars top and bottom
    this.drawClayCapsule(ctx, -48, -20, 36, 12, '#3e2723', '#1b0000');
    this.drawClayCapsule(ctx, -48, 20, 36, 12, '#3e2723', '#1b0000');

    // Glowing combustion furnaces
    const glow = 10 + Math.sin(tick * 0.3) * 3;
    this.drawClayBlob(ctx, -56, -20, glow, 6, '#ff5722', '#d50000');
    this.drawClayBlob(ctx, -56, 20, glow, 6, '#ff5722', '#d50000');

    ctx.restore();
  }

  /**
   * Draw Jumbo Enemy: JUMBO CYBER GARGANTUA (World 3 Shielded Obsidian Titan)
   */
  static drawJumboCyberGargantua(ctx, x, y, shieldRatio = 1, hpRatio = 1, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Heavy glowing frontal energy barrier dome
    if (shieldRatio > 0) {
      ctx.save();
      const sAlpha = 0.45 + Math.sin(tick * 0.25) * 0.25;
      ctx.strokeStyle = `rgba(0, 229, 255, ${sAlpha})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(-20, 0, 72, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      // Hexagonal energy lattice pattern
      ctx.fillStyle = `rgba(0, 229, 255, ${sAlpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(-20, 0, 70, Math.PI * 0.5, Math.PI * 1.5);
      ctx.fill();
      ctx.restore();
    }

    // Heavy faceted obsidian chassis
    this.drawClayCapsule(ctx, 0, 0, 144, 70, '#0d1338', '#000010');
    this.drawClayCapsule(ctx, -8, 0, 124, 56, '#1a237e', '#0d1338');

    // Twin giant railgun needles
    this.drawClayCapsule(ctx, -58, -22, 54, 8, '#00bcd4', '#006064');
    this.drawClayCapsule(ctx, -58, 22, 54, 8, '#00bcd4', '#006064');

    // Central pulsing EMP reactor core
    const coreP = 22 + Math.sin(tick * 0.3) * 4;
    this.drawClayBlob(ctx, 6, 0, coreP, coreP, '#311b92', '#12005e');
    this.drawClayBlob(ctx, 6, 0, 10, 10, '#00e5ff', '#00b0ff');

    // Reactor cooling fins
    [-18, 30].forEach(cx => {
      this.drawClayCapsule(ctx, cx, 0, 14, 62, '#00838f', '#004d40');
    });

    ctx.restore();
  }

  /**
   * Draw Jumbo Enemy: JUMBO SINGULARITY TITAN (World 4 Cosmic Singularity Behemoth)
   */
  static drawJumboSingularityTitan(ctx, x, y, shieldRatio = 1, hpRatio = 1, tick = 0, fromBehind = false) {
    ctx.save();
    ctx.translate(x, y);
    if (fromBehind) {
      ctx.scale(-1, 1);
    }

    // 1. Cosmic distortion aura with swirling event horizon
    ctx.save();
    ctx.rotate(tick * 0.04);
    for (let r = 0; r < 3; r++) {
      ctx.strokeStyle = `rgba(213, 0, 249, ${0.3 + r * 0.15})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 84 + r * 6, 50 + r * 5, (r * Math.PI) / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Colossal cosmic void body
    this.drawClayCapsule(ctx, 0, 0, 154, 76, '#12005e', '#000000');
    this.drawClayCapsule(ctx, -10, 0, 134, 62, '#311b92', '#12005e');

    // 3. Central black hole vortex
    const vPulse = 26 + Math.sin(tick * 0.2) * 4;
    this.drawClayBlob(ctx, 0, 0, vPulse, vPulse, '#000000', '#4a148c');
    this.drawClayBlob(ctx, 0, 0, 12, 12, '#e040fb', '#7b1fa2');

    // 4. Four orbiting satellite nodes
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + tick * 0.06;
      const sx = Math.cos(a) * 65;
      const sy = Math.sin(a) * 36;
      this.drawClayBlob(ctx, sx, sy, 8, 8, '#64ffda', '#004d40');
    }

    // Heavy frontal cosmic spires
    this.drawClayCapsule(ctx, -65, -24, 48, 10, '#aa00ff', '#4a148c');
    this.drawClayCapsule(ctx, -65, 24, 48, 10, '#aa00ff', '#4a148c');

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

    // Electro-paralysis plasma aura when Boss is affected by plasma slow
    if (boss.slowTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#ea80fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8 + boss.tick * 0.2;
        const r = boss.radius + 8 + Math.sin(boss.tick * 0.5 + i * 1.5) * 8;
        const px = boss.x + Math.cos(a) * r;
        const py = boss.y + Math.sin(a) * (r * 0.8);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
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

      // Trajectory dash warning line pointing to player coordinate
      const dy = (boss.targetDashY || boss.y) - boss.y;
      ctx.beginPath();
      ctx.moveTo(-boss.radius, 0);
      ctx.lineTo(-880, dy);
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([16, 8]);
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 6;
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

    // Wave Barrage charging ring indicator
    if (boss.sineStreamDuration > 0) {
      ctx.save();
      const wavePulse = 26 + Math.sin(boss.tick * 0.5) * 6;
      ctx.beginPath();
      ctx.arc(-75, 0, wavePulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

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

    // Upper Catapult Flight Deck Track
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-65, -78, 70, 5);
    ctx.fillStyle = boss.rageMode ? '#ff1744' : '#ffd54f';
    for (let tx = -60; tx <= -5; tx += 12) {
      ctx.fillRect(tx, -77, 6, 3);
    }

    // Lower Drone Hangar Bay (if alive)
    if (boss.hangarAlive) {
      this.drawClayCapsule(ctx, 20, 65, 60, 22, '#00838f', '#004d40');
      // Glowing launch doors
      const glow = Math.sin(boss.tick * 0.2) > 0 ? '#00e5ff' : '#0097a7';
      this.drawClayCapsule(ctx, 20, 65, 42, 10, glow, '#006064');
    } else {
      this.drawClayCapsule(ctx, 20, 65, 48, 18, '#37474f', '#212121');
      this.drawClayBlob(ctx, 20, 65, 8, 8, '#ff5722', '#bf360c');
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

    // Sonic Laser Warning charging beam & telegraph guide lines if firing laser
    if (boss.isChargingLaser) {
      ctx.save();
      // Glowing core charge orb
      ctx.beginPath();
      ctx.arc(-110, 0, 16 + (boss.laserChargeRatio || 0) * 22, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${0.4 + (boss.laserChargeRatio || 0) * 0.5})`;
      ctx.fill();

      // 15-way fanned laser telegraph guidance beams across screen (derajat sedikit diperbesar)
      const laserCount = boss.laserCount || 15;
      const half = Math.floor(laserCount / 2);
      ctx.lineWidth = 1.5 + (boss.laserChargeRatio || 0) * 1.5;
      for (let i = 0; i < laserCount; i++) {
        const lAngle = (i - half) * 0.125;
        const beamAlpha = 0.15 + (boss.laserChargeRatio || 0) * 0.35;
        ctx.strokeStyle = `rgba(0, 229, 255, ${beamAlpha})`;
        ctx.beginPath();
        ctx.moveTo(-110, 0);
        ctx.lineTo(
          -110 + Math.cos(Math.PI + lAngle) * 1200,
          Math.sin(Math.PI + lAngle) * 1200
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw Modern, Elegant, Minimalist Vector Weapon Icons (Free of any text letters)
   */
  static drawWeaponIcon(ctx, x, y, type, size = 16, color = '#ffffff') {
    ctx.save();
    ctx.translate(x, y);

    switch (type) {
      case 'SPREAD': {
        // 3-way elegant aerodynamic spread darts / shot rays fanning forward
        const angles = [-0.46, 0, 0.46];
        angles.forEach((ang, idx) => {
          ctx.save();
          ctx.rotate(ang);
          const dartLen = idx === 1 ? size * 0.95 : size * 0.82;
          const dartW = size * 0.22;
          ctx.beginPath();
          ctx.moveTo(-size * 0.35, -dartW * 0.5);
          ctx.lineTo(dartLen * 0.55, -dartW * 0.5);
          ctx.lineTo(dartLen * 0.95, 0);
          ctx.lineTo(dartLen * 0.55, dartW * 0.5);
          ctx.lineTo(-size * 0.35, dartW * 0.5);
          ctx.closePath();
          ctx.fillStyle = idx === 1 ? '#ffffff' : color;
          ctx.fill();
          ctx.restore();
        });
        // Rear focal hub
        ctx.beginPath();
        ctx.arc(-size * 0.4, 0, size * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        break;
      }

      case 'LASER': {
        // Piercing high-energy directed beam with focus brackets
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.8, size * 0.15);
        ctx.lineCap = 'round';

        // Outer focus brackets
        ctx.beginPath();
        ctx.arc(-size * 0.45, 0, size * 0.52, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(size * 0.45, 0, size * 0.52, Math.PI * 0.65, Math.PI * 1.35);
        ctx.stroke();

        // Primary horizontal beam
        ctx.beginPath();
        ctx.moveTo(-size * 0.85, 0);
        ctx.lineTo(size * 0.85, 0);
        ctx.lineWidth = Math.max(2.6, size * 0.26);
        ctx.stroke();

        // Core white beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.2, size * 0.12);
        ctx.beginPath();
        ctx.moveTo(-size * 0.72, 0);
        ctx.lineTo(size * 0.72, 0);
        ctx.stroke();

        // Central emitter lens node
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        break;
      }

      case 'HOMING': {
        // Tactical lock-on reticle brackets + guided seeker dart
        const r = size * 0.66;
        const b = size * 0.32;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.8, size * 0.15);
        ctx.lineCap = 'round';

        // 4 Reticle corner brackets
        ctx.beginPath();
        ctx.moveTo(-r, -r + b);
        ctx.lineTo(-r, -r);
        ctx.lineTo(-r + b, -r);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(r - b, -r);
        ctx.lineTo(r, -r);
        ctx.lineTo(r, -r + b);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(r, r - b);
        ctx.lineTo(r, r);
        ctx.lineTo(r - b, r);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r + b, r);
        ctx.lineTo(-r, r);
        ctx.lineTo(-r, r - b);
        ctx.stroke();

        // Center seeker missile diamond
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.36);
        ctx.lineTo(size * 0.28, 0);
        ctx.lineTo(0, size * 0.36);
        ctx.lineTo(-size * 0.28, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Center lock dot
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        break;
      }

      case 'FLAK': {
        // 8-point radial fragmentation detonation starburst
        const points = 8;
        const outerR = size * 0.78;
        const innerR = size * 0.32;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const ang = (i * Math.PI) / points - Math.PI / 2;
          const rad = (i % 2 === 0) ? outerR : innerR;
          const px = Math.cos(ang) * rad;
          const py = Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Explosive core dot
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        break;
      }

      case 'PLASMA': {
        // Tilted orbital elliptical ion ring + high-voltage central plasma nucleus
        ctx.save();
        ctx.rotate(-Math.PI * 0.2);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.8, size * 0.14);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.8, size * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Orbital nodes
        ctx.beginPath();
        ctx.arc(size * 0.72, 0, size * 0.14, 0, Math.PI * 2);
        ctx.arc(-size * 0.72, 0, size * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        // Dense plasma nucleus
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glowing center core
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        break;
      }

      case 'SPEED_BOOST': {
        // Twin supersonic forward velocity chevrons
        const drawChevron = (cx, fill) => {
          ctx.beginPath();
          ctx.moveTo(cx - size * 0.3, -size * 0.52);
          ctx.lineTo(cx + size * 0.22, 0);
          ctx.lineTo(cx - size * 0.3, size * 0.52);
          ctx.lineTo(cx - size * 0.08, size * 0.52);
          ctx.lineTo(cx + size * 0.44, 0);
          ctx.lineTo(cx - size * 0.08, -size * 0.52);
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
        };

        // Left chevron
        drawChevron(-size * 0.32, color);
        // Right lead chevron
        drawChevron(size * 0.22, '#ffffff');
        break;
      }


      default: {
        // Fallback smooth geometric diamond
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(size * 0.6, 0);
        ctx.lineTo(0, size * 0.6);
        ctx.lineTo(-size * 0.6, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Draw the cycling Weapon Power-Up Capsule (Classic Platypus mechanic)
   * 3D Tumbling Medallion with Extruded Bevel & Perspective Foreshortening
   */
  static drawPowerUpCapsule(ctx, x, y, weaponType, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    const colors = {
      SPREAD: { main: '#e53935', shadow: '#b71c1c', name: 'SPREAD' },
      LASER: { main: '#1e88e5', shadow: '#0d47a1', name: 'LASER' },
      HOMING: { main: '#43a047', shadow: '#1b5e20', name: 'HOMING' },
      FLAK: { main: '#fbc02d', shadow: '#f57f17', name: 'FLAK' },
      PLASMA: { main: '#ab47bc', shadow: '#4a148c', name: 'PLASMA' }
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

    // 3D Tumbling Y-Spin & X-Tilt
    const spinY = tick * 0.07;
    const cosY = Math.cos(spinY);
    const sinY = Math.sin(spinY);
    const absCosY = Math.max(0.18, Math.abs(cosY));

    // 1. Extruded 3D Clay Rim Edge (Thickness visible during spin)
    const thickness = 5.5;
    const edgeOffset = sinY * thickness;
    if (Math.abs(edgeOffset) > 0.6) {
      ctx.beginPath();
      ctx.ellipse(edgeOffset * 0.5, 0, Math.max(2, 24 * absCosY), 24, 0, 0, Math.PI * 2);
      ctx.fillStyle = edgeOffset > 0 ? '#78909c' : '#cfd8dc';
      ctx.fill();
    }

    // 2. Outer translucent clay crystal shell & inner core with 3D perspective
    ctx.save();
    ctx.scale(absCosY, 1.0);
    this.drawClayBlob(ctx, 0, 0, 24, 24, '#ffffff', '#b0bec5');

    // Inner vibrant spinning powerup core
    this.drawClayBlob(ctx, 0, 0, 16, 16, cfg.main, cfg.shadow);

    // Weapon vector graphic emblem
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    this.drawWeaponIcon(ctx, 0, 0, weaponType, 13, '#ffffff');
    ctx.restore();

    // 3. Studio Specular Light Glint that sweeps across surface
    const glintX = -12 * cosY;
    ctx.beginPath();
    ctx.ellipse(glintX, -8, Math.max(1.5, 6 * absCosY), 4, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    ctx.restore();
  }


  /**
   * Draw the Speed Boost Drop Collectible (Sculpted 3D Claymorphism >> Chevrons, no round container)
   */
  static drawSpeedBoostDrop(ctx, x, y, tick = 0, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    const floatY = Math.sin(tick * 0.12) * 3.5;
    ctx.translate(0, floatY);
    if (angle) ctx.rotate(angle);

    // Glowing fiery sonic aura
    const auraPulse = 20 + Math.sin(tick * 0.2) * 4;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, auraPulse + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6d00';
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.restore();

    // Helper to draw beveled chevron path
    const drawChevronPath = (cx, cyOff, s) => {
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.42, cyOff - s * 0.75);
      ctx.lineTo(cx + s * 0.35, cyOff);
      ctx.lineTo(cx - s * 0.42, cyOff + s * 0.75);
      ctx.lineTo(cx - s * 0.12, cyOff + s * 0.75);
      ctx.lineTo(cx + s * 0.65, cyOff);
      ctx.lineTo(cx - s * 0.12, cyOff - s * 0.75);
      ctx.closePath();
    };

    const s = 18;

    // 1. Ambient Drop Shadow underneath both chevrons
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#bf360c';
    drawChevronPath(-s * 0.45, 0, s);
    ctx.fill();
    drawChevronPath(s * 0.35, 0, s);
    ctx.fill();
    ctx.restore();

    // 2. REAR CHEVRON (Warm Amber Clay)
    // Darker underside bevel
    ctx.fillStyle = '#d84315';
    drawChevronPath(-s * 0.45, 1.5, s);
    ctx.fill();
    // Main vibrant body
    ctx.fillStyle = '#ff9100';
    drawChevronPath(-s * 0.45, 0, s);
    ctx.fill();
    // Specular light edge highlight
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.45 - s * 0.12, -s * 0.75);
    ctx.lineTo(-s * 0.45 + s * 0.65, 0);
    ctx.stroke();

    // 3. LEAD CHEVRON (Golden-Yellow Clay with Specular Glare)
    // Darker underside bevel
    ctx.fillStyle = '#f57c00';
    drawChevronPath(s * 0.35, 1.5, s);
    ctx.fill();
    // Main bright body
    ctx.fillStyle = '#ffd54f';
    drawChevronPath(s * 0.35, 0, s);
    ctx.fill();
    // Highlight facet
    ctx.fillStyle = '#fff9c4';
    drawChevronPath(s * 0.35, -0.8, s * 0.88);
    ctx.fill();
    // Specular top highlight glare
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(s * 0.35 - s * 0.12, -s * 0.75);
    ctx.lineTo(s * 0.35 + s * 0.65, 0);
    ctx.stroke();

    // 4. Trailing clay propulsion exhaust nodules
    this.drawClayBlob(ctx, -s * 1.05, -s * 0.25, 4, 3, '#ffab00', '#bf360c');
    this.drawClayBlob(ctx, -s * 1.05, s * 0.25, 4, 3, '#ffab00', '#bf360c');

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
    const floatY = Math.sin(tick * 0.1) * 3.5;
    ctx.translate(0, floatY);

    if (angle) {
      ctx.rotate(angle);
    }

    // 3D Organic Tumbling Motion
    const spinY = Math.sin(tick * 0.08) * 0.35;
    const tiltX = Math.cos(tick * 0.06) * 0.18;
    ctx.rotate(tiltX);
    ctx.scale(1.0 - Math.abs(spinY) * 0.22, 1.0);

    // Soft tactile drop shadow under fruit
    ctx.beginPath();
    ctx.ellipse(2, 6, 16, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fill();

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
      // 5. DRAGONFRUIT (Very Rare - Base 126,000)
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
      // 6. GOLDEN_FRUIT / STAR (Special / Legendary - Base 180,000)
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
   * Draw Clay Splat Particles (direct single-pass 3D faceted rendering)
   */
  static drawClayChunk(ctx, x, y, size, color, shadowColor, angle) {
    ctx.save();
    ctx.translate(x, y);
    if (angle !== 0) ctx.rotate(angle);

    const rx = Math.max(1, Math.round(size));
    const ry = rx * 0.72;

    // 1. Ambient Drop shadow
    ctx.beginPath();
    ctx.ellipse(2, 4, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // 2. Plasticine irregular chunk contour (faceted 3D clay look)
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.lineTo(-rx * 0.6, -ry * 0.9);
    ctx.lineTo(rx * 0.5, -ry);
    ctx.lineTo(rx, -ry * 0.3);
    ctx.lineTo(rx * 0.8, ry * 0.8);
    ctx.lineTo(-rx * 0.4, ry);
    ctx.closePath();

    const lx = Math.round(-rx * 0.3);
    const ly = Math.round(-ry * 0.35);
    const grad = ClayRenderer.getRadialGradient(ctx, lx, ly, Math.round(rx * 0.1), Math.round(rx * 1.2), color, shadowColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // 3. Tactile Faceted Bevel / Inner Clay Edge
    ctx.lineWidth = Math.max(1.2, rx * 0.08);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.stroke();

    // 4. Crisp Specular Glint Point
    ctx.beginPath();
    ctx.arc(lx, ly, Math.max(1.2, rx * 0.18), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fill();

    ctx.restore();
  }
}
