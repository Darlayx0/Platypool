// High-Fidelity 3D Volumetric Claymation Geometry & Lighting Engine
// Provides 3D Euler Kinematics, Surface Normal Shading, Beveled Clay Extrusions & Tactile Depth

export class Clay3D {
  // Studio 3-Point Claymation Lighting Rig (Calibrated for Stop-Motion Clay Look)
  static KEY_LIGHT = { x: -0.48, y: -0.62, z: 0.62 };   // Primary warm directional light
  static FILL_LIGHT = { x: 0.55, y: 0.45, z: 0.70 };    // Soft ambient fill from bottom-right
  static RIM_LIGHT = { x: -0.15, y: 0.85, z: -0.50 };   // Sharp edge rim glint

  // Color shading cache to avoid runtime hex parsing allocations
  static colorCache = new Map();

  /**
   * Fast hex color brightness adjuster with caching
   */
  static adjustColor(hex, factor) {
    const key = `${hex}_${factor.toFixed(2)}`;
    let cached = Clay3D.colorCache.get(key);
    if (cached) return cached;

    if (Clay3D.colorCache.size > 800) Clay3D.colorCache.clear();

    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.min(255, Math.max(0, Math.round(r * factor)));
    g = Math.min(255, Math.max(0, Math.round(g * factor)));
    b = Math.min(255, Math.max(0, Math.round(b * factor)));

    cached = `rgb(${r},${g},${b})`;
    Clay3D.colorCache.set(key, cached);
    return cached;
  }

  /**
   * Rotate a 3D coordinate around X (roll), Y (pitch), and Z (yaw) axes
   */
  static rotatePoint(x, y, z, roll = 0, pitch = 0, yaw = 0) {
    // 1. Roll around X (longitudinal axis)
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);
    const y1 = y * cosR - z * sinR;
    const z1 = y * sinR + z * cosR;

    // 2. Pitch around Y (lateral axis)
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const x2 = x * cosP + z1 * sinP;
    const z2 = -x * sinP + z1 * cosP;

    // 3. Yaw around Z (normal axis)
    if (yaw === 0) {
      return { x: x2, y: y1, z: z2 };
    }
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x3 = x2 * cosY - y1 * sinY;
    const y3 = x2 * sinY + y1 * cosY;

    return { x: x3, y: y3, z: z2 };
  }

  /**
   * Project a 3D point onto a 2D canvas with subtle perspective foreshortening
   */
  static project(x, y, z, focalLength = 700) {
    const scale = focalLength / (focalLength + z);
    return {
      x: x * scale,
      y: y * scale,
      scale,
      z
    };
  }

  /**
   * Calculate Lambertian diffuse dot product with Key Light
   */
  static getDiffuse(normal) {
    const dot = normal.x * Clay3D.KEY_LIGHT.x + normal.y * Clay3D.KEY_LIGHT.y + normal.z * Clay3D.KEY_LIGHT.z;
    return Math.max(0.18, (dot + 1) * 0.5); // Range ~0.18 to 1.0 (prevents harsh pitch black)
  }

  /**
   * Draw a 3D Volumetric Fuselage (Chunky Clay Rocket-Plane Hull)
   * Responds dynamically to roll (banking) and pitch (climb/dive)
   */
  static drawVolumetricFuselage(ctx, x, y, roll = 0, pitch = 0, length = 56, radiusY = 13, radiusZ = 15, baseColor = '#eceff1', shadowColor = '#607d8b', stripeColor = '#e53935') {
    ctx.save();
    ctx.translate(x, y);

    // Dynamic perspective foreshortening based on pitch
    const pitchCompress = Math.cos(pitch);
    const effectiveLength = length * pitchCompress;
    const halfL = effectiveLength / 2;

    // Roll angle dictates the visible surface rotation and cross-section perspective
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);

    // 1. Ambient Drop Shadow / Contact Crease under fuselage
    ctx.beginPath();
    ctx.ellipse(2, 6 + sinR * 3, halfL * 1.04, radiusY * 0.95, pitch * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // 2. Main Fuselage Clay Body (Multi-section rounded capsule with 3D normal curvature)
    const noseX = halfL;
    const tailX = -halfL;
    const midX = -2;

    // Generate dynamic 3D gradient that shifts highlight across curvature when rolling
    const highlightY = -radiusY * 0.45 * cosR + radiusY * 0.35 * sinR;
    const grad = ctx.createLinearGradient(0, -radiusY, 0, radiusY);
    const lightFactor = Math.max(0.7, Math.min(1.2, 1.0 - sinR * 0.3));
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.2, Clay3D.adjustColor(baseColor, 1.08 * lightFactor));
    grad.addColorStop(0.75, Clay3D.adjustColor(baseColor, 0.92 * lightFactor));
    grad.addColorStop(1, shadowColor);

    // Fuselage contour (vintage streamlined tear-drop)
    ctx.beginPath();
    ctx.moveTo(noseX, 0);
    ctx.bezierCurveTo(noseX * 0.7, -radiusY * 1.15, midX - 8, -radiusY * 1.05, tailX + 6, -radiusY * 0.65);
    ctx.lineTo(tailX, -radiusY * 0.4);
    ctx.lineTo(tailX, radiusY * 0.4);
    ctx.lineTo(tailX + 6, radiusY * 0.65);
    ctx.bezierCurveTo(midX - 8, radiusY * 1.05, noseX * 0.7, radiusY * 1.15, noseX, 0);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Fuselage Outer Tactile Clay Edge Highlight
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.stroke();

    // 3. Volumetric Racing Stripe (Curves around 3D cylinder when rolling)
    ctx.save();
    ctx.beginPath();
    // Clip inside the fuselage body
    ctx.moveTo(noseX, 0);
    ctx.bezierCurveTo(noseX * 0.7, -radiusY * 1.15, midX - 8, -radiusY * 1.05, tailX + 6, -radiusY * 0.65);
    ctx.lineTo(tailX, -radiusY * 0.4);
    ctx.lineTo(tailX, radiusY * 0.4);
    ctx.lineTo(tailX + 6, radiusY * 0.65);
    ctx.bezierCurveTo(midX - 8, radiusY * 1.05, noseX * 0.7, radiusY * 1.15, noseX, 0);
    ctx.closePath();
    ctx.clip();

    // Stripe shifts in Y proportional to sin(roll)
    const stripeCenterY = -sinR * radiusY * 0.65;
    const stripeThick = Math.max(3, (radiusY * 0.48) * Math.abs(cosR));
    const stripeGrad = ctx.createLinearGradient(0, stripeCenterY - stripeThick, 0, stripeCenterY + stripeThick);
    stripeGrad.addColorStop(0, '#ff7043');
    stripeGrad.addColorStop(0.3, stripeColor);
    stripeGrad.addColorStop(1, '#b71c1c');

    ctx.beginPath();
    ctx.ellipse(midX + 2, stripeCenterY, halfL * 0.68, stripeThick, pitch * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = stripeGrad;
    ctx.fill();

    // Specular streak along the longitudinal curve
    ctx.beginPath();
    ctx.ellipse(midX, highlightY, halfL * 0.6, radiusY * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    // Crisp micro glint
    ctx.beginPath();
    ctx.ellipse(midX + 6, highlightY, halfL * 0.3, radiusY * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();

    ctx.restore();

    // 4. Rear Exhaust Recessed Nozzle (Interior depth 3D hole)
    const nozzleW = 5 * pitchCompress;
    const nozzleH = radiusY * 0.75;
    ctx.beginPath();
    ctx.ellipse(tailX, 0, Math.max(1.5, nozzleW), nozzleH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#212121';
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#455a64';
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw a 3D Beveled Clay Wing with Realistic Roll Foreshortening & Edge Bevels
   * isUpperWing: true for top wing (shifts up/left in 3D), false for lower wing
   */
  static draw3DWing(ctx, x, y, roll = 0, pitch = 0, isUpperWing = false, weaponType = 'NORMAL', tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    const sinR = Math.sin(roll);
    const cosR = Math.cos(roll);

    // Upper wing is situated on top of fuselage (negative Z in 3D local coordinates)
    // Lower wing is situated below (positive Z)
    const zOffset = isUpperWing ? -14 : 14;
    const baseSpan = isUpperWing ? 38 : 34;
    const chord = isUpperWing ? 14 : 11;

    // 3D perspective displacement: as ship rolls, one wing moves toward camera (scales up),
    // other wing moves away (foreshortens and tilts)
    const rollDisplaceY = isUpperWing ? (-14 + sinR * 12) : (16 + sinR * 12);
    const spanScale = Math.max(0.4, cosR + (isUpperWing ? -sinR * 0.45 : sinR * 0.45));
    const effectiveSpan = baseSpan * spanScale;
    const wingAngle = (isUpperWing ? -0.1 : 0.15) + (sinR * 0.22);

    ctx.translate(2, rollDisplaceY);
    ctx.rotate(wingAngle);

    // 1. Wing Drop Shadow onto lower structures
    ctx.beginPath();
    ctx.ellipse(0, 3, effectiveSpan * 0.52, chord * 0.48, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fill();

    // 2. Extruded Clay Wing Bevel (Thickness edge facing viewer)
    const thickness = 4.5 * Math.abs(cosR);
    const bevelY = isUpperWing ? (sinR > 0 ? thickness : -thickness) : (sinR < 0 ? thickness : -thickness);
    if (Math.abs(bevelY) > 0.8) {
      ctx.beginPath();
      ctx.ellipse(0, bevelY, effectiveSpan * 0.5, chord * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = sinR > 0 ? '#455a64' : '#78909c';
      ctx.fill();
    }

    // 3. Main Aerofoil Clay Surface
    const wingGrad = ctx.createLinearGradient(0, -chord * 0.5, 0, chord * 0.5);
    const baseCol = isUpperWing ? '#cfd8dc' : '#b0bec5';
    const shadCol = isUpperWing ? '#546e7a' : '#37474f';
    wingGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    wingGrad.addColorStop(0.25, baseCol);
    wingGrad.addColorStop(0.85, baseCol);
    wingGrad.addColorStop(1, shadCol);

    ctx.beginPath();
    ctx.ellipse(0, 0, effectiveSpan * 0.5, chord * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = wingGrad;
    ctx.fill();

    // Tactile rim highlight on leading edge
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();

    // 4. Red Clay Wingtip Caps (Sculpted rounded hemisphere)
    const tipX = effectiveSpan * 0.48;
    const tipR = isUpperWing ? 5.5 : 4.5;
    ctx.beginPath();
    ctx.ellipse(tipX, 0, tipR, tipR * 0.85, 0, 0, Math.PI * 2);
    const tipGrad = ctx.createRadialGradient(tipX - 1, -1, 1, tipX, 0, tipR);
    tipGrad.addColorStop(0, '#ffffff');
    tipGrad.addColorStop(0.3, '#e53935');
    tipGrad.addColorStop(1, '#b71c1c');
    ctx.fillStyle = tipGrad;
    ctx.fill();

    // 5. Wing-Mounted Gun Barrels with Recessed Bores
    ctx.save();
    const gunX = tipX - 5;
    const gunY = isUpperWing ? -2 : 2;
    ctx.beginPath();
    ctx.roundRect(gunX, gunY - 2.5, 14, 5, 2.5);
    const gunGrad = ctx.createLinearGradient(0, gunY - 2.5, 0, gunY + 2.5);
    gunGrad.addColorStop(0, '#78909c');
    gunGrad.addColorStop(0.5, '#37474f');
    gunGrad.addColorStop(1, '#212121');
    ctx.fillStyle = gunGrad;
    ctx.fill();

    // Dark bore hole
    ctx.beginPath();
    ctx.ellipse(gunX + 14, gunY, 1.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();

    // 6. Active Weapon Pylon Energy FX
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
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(tipX, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = glowCol;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw Convex Clay Glass Canopy Bubble with Dynamic Refraction Specular Rings
   */
  static draw3DCockpitCanopy(ctx, x, y, roll = 0, pitch = 0, rx = 14, ry = 9) {
    ctx.save();
    ctx.translate(x, y);

    const sinR = Math.sin(roll);
    const cosR = Math.cos(roll);

    // Canopy displacement shifts opposite to roll for 3D convex parallax
    const canopyX = 6 + pitch * 3;
    const canopyY = -3 - sinR * 5;
    ctx.translate(canopyX, canopyY);

    // 1. Canopy Base Ambient Occlusion Shadow (sculpted contact into fuselage)
    ctx.beginPath();
    ctx.ellipse(0, 2, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // 2. Translucent Clay Glass Body
    const canopyGrad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.35, 1, 0, 0, rx);
    canopyGrad.addColorStop(0, '#ffffff');
    canopyGrad.addColorStop(0.2, '#fff59d');
    canopyGrad.addColorStop(0.65, '#fdd835');
    canopyGrad.addColorStop(1, '#f57f17');

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, -roll * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = canopyGrad;
    ctx.fill();

    // 3. Pilot Silhouette / Internal Depth Core
    ctx.beginPath();
    ctx.ellipse(-1, 1, rx * 0.45, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(62, 39, 35, 0.42)';
    ctx.fill();

    // 4. Primary Specular Arc (Rotates with roll)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-2, -2, rx * 0.55, -Math.PI * 0.85 - roll * 0.3, -Math.PI * 0.25 - roll * 0.3);
    ctx.stroke();

    // Secondary subtle rim glint
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(2, 2, rx * 0.5, Math.PI * 0.15, Math.PI * 0.55);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw 3D Inclined Propeller Disk & Sculpted Spinner Hub
   */
  static draw3DPropeller(ctx, x, y, roll = 0, pitch = 0, radius = 19, tick = 0) {
    ctx.save();
    ctx.translate(x, y);

    const sinP = Math.sin(pitch);
    const cosR = Math.cos(roll);

    // Propeller disk skews according to pitch & roll perspective
    const diskW = Math.max(3.5, 6.0 * Math.abs(cosR));
    const diskH = radius * 2;

    // 1. Spinning Motion Blur Disc (Translucent Clay Dust)
    ctx.beginPath();
    ctx.ellipse(0, 0, diskW, diskH * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fill();

    // 2. High-Speed Rotating Blades with 3D Bevel
    const propAngle = tick * 0.95;
    ctx.save();
    ctx.rotate(propAngle);

    // Main dual blades
    const bladeGrad = ctx.createLinearGradient(0, -radius, 0, radius);
    bladeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.90)');
    bladeGrad.addColorStop(0.5, 'rgba(255, 235, 59, 0.75)');
    bladeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.90)');

    ctx.fillStyle = bladeGrad;
    ctx.fillRect(-2, -radius, 4, radius * 2);

    // Yellow tip warning dip on blades
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(-2.5, -radius, 5, 5);
    ctx.fillRect(-2.5, radius - 5, 5, 5);
    ctx.restore();

    // 3. Nose Cone Spinner (3D Sculpted Red Clay Bulb)
    const hubR = 7;
    const hubGrad = ctx.createRadialGradient(-hubR * 0.3, -hubR * 0.3, 1, 0, 0, hubR);
    hubGrad.addColorStop(0, '#ffffff');
    hubGrad.addColorStop(0.3, '#e53935');
    hubGrad.addColorStop(1, '#b71c1c');

    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    // Hub drop shadow onto propeller disk
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw Volumetric Engine Fire Exhaust (Dynamic multi-layered 3D plumes)
   */
  static drawVolumetricExhaust(ctx, x, y, roll = 0, pitch = 0, tick = 0, boosted = false) {
    ctx.save();
    ctx.translate(x, y);

    const baseLen = boosted ? 32 : 18;
    const flameSize = baseLen + Math.sin(tick * 0.85) * 5;
    const wobbleY = Math.cos(tick * 0.6) * 1.5;

    // Layer 1: Outer Orange-Red Plasticine Fire Lobe
    ctx.beginPath();
    ctx.ellipse(-flameSize * 0.5, wobbleY, flameSize * 0.6, flameSize * 0.32, 0, 0, Math.PI * 2);
    const grad1 = ctx.createRadialGradient(-flameSize * 0.3, 0, 2, -flameSize * 0.5, 0, flameSize * 0.6);
    grad1.addColorStop(0, boosted ? '#00e5ff' : '#ff9800');
    grad1.addColorStop(0.6, boosted ? '#0097a7' : '#f57c00');
    grad1.addColorStop(1, 'rgba(216, 67, 21, 0.15)');
    ctx.fillStyle = grad1;
    ctx.fill();

    // Layer 2: Mid Yellow Core
    const midSize = flameSize * 0.65;
    ctx.beginPath();
    ctx.ellipse(-midSize * 0.45, wobbleY * 0.5, midSize * 0.55, midSize * 0.24, 0, 0, Math.PI * 2);
    const grad2 = ctx.createRadialGradient(-midSize * 0.2, 0, 1, -midSize * 0.45, 0, midSize * 0.55);
    grad2.addColorStop(0, '#ffffff');
    grad2.addColorStop(0.5, boosted ? '#e0f7fa' : '#fff59d');
    grad2.addColorStop(1, boosted ? '#00e5ff' : '#f57c00');
    ctx.fillStyle = grad2;
    ctx.fill();

    // Layer 3: White-Hot Center Spark
    ctx.beginPath();
    ctx.ellipse(-4, 0, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw Projected Ground / Cloud Shadow for Altitude Depth Perception
   * Drawn on terrain/cloud layer before drawing airborne crafts
   */
  static draw3DGroundShadow(ctx, x, y, altitude = 1.0, radiusX = 35, radiusY = 16) {
    ctx.save();
    // Offset shadow diagonally based on key light direction
    const offsetX = 18 * altitude;
    const offsetY = 32 * altitude;
    const scale = 1.0 + altitude * 0.28;
    const alpha = Math.max(0.08, 0.30 - altitude * 0.08);

    ctx.beginPath();
    ctx.ellipse(x + offsetX, y + offsetY, radiusX * scale, radiusY * scale, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(18, 12, 10, ${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw a 3D Tumbling Collectible (Fruit or Weapon Capsule)
   * Rotates continuously around Y-axis with 3D edge thickness
   */
  static drawTumblingItem(ctx, x, y, radius, spinY = 0, tiltX = 0, drawFaceFn, baseColor, shadowColor) {
    ctx.save();
    ctx.translate(x, y);

    const cosY = Math.cos(spinY);
    const sinY = Math.sin(spinY);
    const thickness = 6;

    // 1. Soft Drop Shadow
    ctx.beginPath();
    ctx.ellipse(2, 6, radius * 1.1, radius * 0.65, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // 2. Extruded Rim Bevel (drawn when angled)
    const bevelW = Math.abs(cosY) * radius;
    const edgeOffset = sinY * thickness;

    if (Math.abs(edgeOffset) > 0.5) {
      ctx.beginPath();
      ctx.ellipse(edgeOffset * 0.5, 0, Math.max(2, bevelW), radius, 0, 0, Math.PI * 2);
      ctx.fillStyle = edgeOffset > 0 ? shadowColor : Clay3D.adjustColor(baseColor, 1.2);
      ctx.fill();
    }

    // 3. Front Face (Perspective foreshortened on X)
    ctx.save();
    ctx.scale(Math.max(0.12, Math.abs(cosY)), 1.0);
    drawFaceFn(ctx, 0, 0, radius);
    ctx.restore();

    // 4. Studio Specular Highlight Glint
    const glintX = -radius * 0.35 * cosY;
    ctx.beginPath();
    ctx.ellipse(glintX, -radius * 0.35, Math.max(1, radius * 0.25 * Math.abs(cosY)), radius * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fill();

    ctx.restore();
  }
}
