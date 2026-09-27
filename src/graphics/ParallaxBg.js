// Parallax Background with High-Fidelity Claymorphism for 4 Biomes
import { ClayRenderer } from './ClayRenderer.js';

export const BIOMES = {
  VALLEY: {
    name: 'CLAY VALLEY',
    sky: ['#4a7da5', '#73a9d4', '#bde0fe'],
    cloudBase: '#ffffff',
    cloudHighlight: '#ffffff',
    cloudShadow: '#90a4ae',
    mountainFar: ['#9575cd', '#673ab7', '#311b92'],
    mountainNear: ['#7e57c2', '#512da8', '#280680'],
    hillMid: ['#7cb342', '#558b2f', '#2e5b15'],
    hillNear: ['#8bc34a', '#689f38', '#33691e'],
    islandRock: '#795548',
    islandRockDark: '#3e2723',
    islandTop: '#689f38',
    islandTopDark: '#2e5b15',
    treeTrunk: '#5d4037',
    treeTrunkDark: '#271612',
    treeFoliage: ['#66bb6a', '#81c784', '#388e3c'],
    hasStars: false,
    ambientType: 'POLLEN',
    ambientColor: 'rgba(255, 245, 157, '
  },
  CANYON: {
    name: 'SUNSET CANYON',
    sky: ['#282c44', '#5e5069', '#d89b7b'],
    cloudBase: '#f5ebe0',
    cloudHighlight: '#fff8f0',
    cloudShadow: '#a38f85',
    mountainFar: ['#755a6d', '#533c4c', '#33232f'],
    mountainNear: ['#8c655b', '#6d453b', '#482a22'],
    hillMid: ['#b86b4d', '#8c482e', '#5a2a19'],
    hillNear: ['#c97b5d', '#a35538', '#6d311d'],
    islandRock: '#6e493b',
    islandRockDark: '#3d251d',
    islandTop: '#99583d',
    islandTopDark: '#542d1e',
    treeTrunk: '#4e332a',
    treeTrunkDark: '#261611',
    treeFoliage: ['#7a8465', '#98a57e', '#555f45'],
    hasStars: false,
    ambientType: 'DUST',
    ambientColor: 'rgba(255, 183, 77, '
  },
  CYBER_NIGHT: {
    name: 'MIDNIGHT CYBER-CLAY',
    sky: ['#060913', '#111936', '#1d2754'],
    cloudBase: '#4d5b9e',
    cloudHighlight: '#7986cb',
    cloudShadow: '#1a237e',
    mountainFar: ['#5c3d8a', '#3f1f6c', '#18073b'],
    mountainNear: ['#703399', '#4d1970', '#240638'],
    hillMid: ['#00838f', '#004d40', '#00251a'],
    hillNear: ['#00b0ff', '#0077b6', '#023e8a'],
    islandRock: '#1c2430',
    islandRockDark: '#0b1017',
    islandTop: '#6a1b9a',
    islandTopDark: '#38006b',
    treeTrunk: '#2a3547',
    treeTrunkDark: '#121820',
    treeFoliage: ['#00e5ff', '#1de9b6', '#00b0ff'],
    hasStars: true,
    ambientType: 'CYBER',
    ambientColor: 'rgba(0, 229, 255, '
  },
  COSMIC_VOID: {
    name: 'COSMIC SINGULARITY',
    sky: ['#030208', '#0c081f', '#191136'],
    cloudBase: '#64398c',
    cloudHighlight: '#9c64cc',
    cloudShadow: '#280c42',
    mountainFar: ['#6d28d9', '#4c1d95', '#1e054a'],
    mountainNear: ['#7c3aed', '#5b21b6', '#2e1065'],
    hillMid: ['#0e7490', '#155e75', '#083344'],
    hillNear: ['#06b6d4', '#0891b2', '#164e63'],
    islandRock: '#141124',
    islandRockDark: '#08060f',
    islandTop: '#86198f',
    islandTopDark: '#4a044e',
    treeTrunk: '#291d45',
    treeTrunkDark: '#120b24',
    treeFoliage: ['#c084fc', '#38bdf8', '#818cf8'],
    hasStars: true,
    ambientType: 'COSMIC',
    ambientColor: 'rgba(216, 180, 254, '
  }
};

export class ParallaxBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Multi-layer calibrated offsets
    this.cloudOffset = 0;
    this.farMountainOffset = 0;
    this.nearMountainOffset = 0;
    this.midHillOffset = 0;
    this.nearHillOffset = 0;
    this.islandOffset = 0;
    this.tick = 0;

    this.currentBiomeKey = 'VALLEY';
    this.biome = BIOMES.VALLEY;

    this.initFeatures();
  }

  setBiome(biomeKey) {
    if (BIOMES[biomeKey]) {
      this.currentBiomeKey = biomeKey;
      this.biome = BIOMES[biomeKey];
    }
  }

  initFeatures() {
    // 1. Stars & Celestial Shimmer (Cyber Night & Cosmic Void)
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.65),
        size: 1 + Math.random() * 2.8,
        twinkleSpeed: 0.05 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 2. Volumetric Clay Clouds with Shading
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      this.clouds.push({
        x: Math.random() * this.width * 2,
        y: 35 + Math.random() * 190,
        scale: 0.65 + Math.random() * 0.75,
        blobs: [
          { dx: 0, dy: 0, rx: 42 + Math.random() * 18, ry: 32 + Math.random() * 12 },
          { dx: -28, dy: 6, rx: 28 + Math.random() * 14, ry: 24 + Math.random() * 10 },
          { dx: 28, dy: 8, rx: 32 + Math.random() * 14, ry: 26 + Math.random() * 10 },
          { dx: -52, dy: 14, rx: 20 + Math.random() * 10, ry: 16 + Math.random() * 8 },
          { dx: 52, dy: 16, rx: 22 + Math.random() * 10, ry: 18 + Math.random() * 8 }
        ]
      });
    }

    // 3. Multi-Strata Floating Clay Islands
    this.islands = [];
    for (let i = 0; i < 5; i++) {
      this.islands.push({
        x: i * 420 + Math.random() * 120,
        y: 470 + Math.random() * 170,
        width: 150 + Math.random() * 100,
        height: 65 + Math.random() * 45,
        hasTree: Math.random() > 0.3,
        mossRoots: [
          { dx: -35, len: 12 + Math.random() * 14, r: 4 },
          { dx: 0, len: 16 + Math.random() * 18, r: 5 },
          { dx: 38, len: 10 + Math.random() * 12, r: 4 }
        ]
      });
    }

    // 4. Dynamic Smart Ambient Particles (Pollen, Dust, Cyber Glimmers, Stardust)
    this.ambientParticles = [];
    for (let i = 0; i < 35; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: -25 - Math.random() * 45,
        vy: -10 + Math.random() * 20,
        size: 1.5 + Math.random() * 3.5,
        alpha: 0.3 + Math.random() * 0.5,
        bobSpeed: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt, speedMultiplier = 1) {
    this.tick += dt;
    const baseSpeed = 80 * speedMultiplier * dt;

    // 5 Calibrated Differential Parallax Layers
    this.cloudOffset = (this.cloudOffset + baseSpeed * 0.3) % (this.width * 2);
    this.farMountainOffset = (this.farMountainOffset + baseSpeed * 0.55) % this.width;
    this.nearMountainOffset = (this.nearMountainOffset + baseSpeed * 0.95) % this.width;
    this.midHillOffset = (this.midHillOffset + baseSpeed * 1.55) % this.width;
    this.nearHillOffset = (this.nearHillOffset + baseSpeed * 2.1) % this.width;
    this.islandOffset = (this.islandOffset + baseSpeed * 2.85) % (this.width * 2);

    // Update ambient particles
    for (const p of this.ambientParticles) {
      p.x += p.vx * dt;
      p.y += (p.vy + Math.sin(this.tick * p.bobSpeed + p.phase) * 15) * dt;

      if (p.x < -20) {
        p.x = this.width + 20;
        p.y = Math.random() * this.height;
      }
      if (p.y < -20) p.y = this.height + 20;
      if (p.y > this.height + 20) p.y = -20;
    }
  }

  draw(ctx) {
    const b = this.biome;

    // 1. Sky Gradient & Atmospheric Depth
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, b.sky[0]);
    skyGrad.addColorStop(0.45, b.sky[1]);
    skyGrad.addColorStop(1, b.sky[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 1b. Stars if in Cyber Night or Cosmic Void
    if (b.hasStars) {
      this.drawStars(ctx);
    }

    // 2. Sculpted Clay Clouds Layer (with 3D volumetric shading)
    this.drawClayClouds(ctx, b);

    // 3. Distant Far Mountain Range
    this.drawMountainRange(ctx, this.farMountainOffset, b.mountainFar, 270, 0.004, 0.010, 50, 25, 0.15);

    // 4. Near Mountain Range with Clay Ridges
    this.drawMountainRange(ctx, this.nearMountainOffset, b.mountainNear, 210, 0.006, 0.015, 65, 30, 0.25);

    // 5. Midground Rolling Clay Hills
    this.drawRollingClayHills(ctx, this.midHillOffset, b.hillMid, 150, 0.007, 0.016, 48, 22, 0.35);

    // 6. Near Ground Rolling Clay Hills
    this.drawRollingClayHills(ctx, this.nearHillOffset, b.hillNear, 90, 0.009, 0.022, 38, 16, 0.45);

    // 7. Foreground Floating Clay Islands (with geologic strata & trees)
    this.drawClayIslands(ctx, b);

    // 8. Dynamic Ambient Particulate Motes (pollen, dust, cyber sparks, stardust)
    this.drawAmbientParticles(ctx, b);
  }

  drawStars(ctx) {
    ctx.save();
    for (const s of this.stars) {
      const alpha = 0.3 + Math.sin(this.tick * s.twinkleSpeed * 12 + s.phase) * 0.45;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      // Subtle glow for larger stars
      if (s.size > 2) {
        ctx.fillStyle = `rgba(180, 220, 255, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawClayClouds(ctx, b) {
    ctx.save();
    for (const c of this.clouds) {
      let cx = (c.x - this.cloudOffset);
      if (cx < -200) cx += this.width * 2;

      ctx.save();
      ctx.translate(cx, c.y);
      ctx.scale(c.scale, c.scale);

      // Draw each cloud blob with 3D volumetric clay shading
      for (const blob of c.blobs) {
        // Blob drop shadow
        ctx.beginPath();
        ctx.ellipse(blob.dx + 4, blob.dy + 8, blob.rx, blob.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fill();

        // Clay blob radial shading (plasticine gradient)
        const lightX = blob.dx - blob.rx * 0.35;
        const lightY = blob.dy - blob.ry * 0.35;
        const grad = ctx.createRadialGradient(lightX, lightY, blob.rx * 0.1, blob.dx, blob.dy, Math.max(blob.rx, blob.ry));
        grad.addColorStop(0, b.cloudHighlight);
        grad.addColorStop(0.3, b.cloudBase);
        grad.addColorStop(0.85, b.cloudBase);
        grad.addColorStop(1, b.cloudShadow);

        ctx.beginPath();
        ctx.ellipse(blob.dx, blob.dy, blob.rx, blob.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Rim highlight on upper-left ridge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawMountainRange(ctx, offset, palette, baseHeight, freq1, freq2, amp1, amp2, ridgeHighlightAlpha) {
    ctx.save();
    const h = this.height;
    const step = 60;
    const totalPoints = Math.ceil(this.width / step) + 3;

    ctx.beginPath();
    ctx.moveTo(0, h);

    const points = [];
    for (let i = 0; i <= totalPoints; i++) {
      const x = i * step - (offset % step);
      const worldX = i * step + Math.floor(offset / step) * step;
      const y = h - baseHeight - Math.sin(worldX * freq1) * amp1 - Math.cos(worldX * freq2) * amp2;
      points.push({ x, y });
      ctx.lineTo(x, y);
    }

    ctx.lineTo(this.width, h);
    ctx.closePath();

    // Multi-stop mountain gradient
    const grad = ctx.createLinearGradient(0, h - baseHeight - amp1 - amp2, 0, h);
    grad.addColorStop(0, palette[0]);
    grad.addColorStop(0.4, palette[1]);
    grad.addColorStop(1, palette[2]);
    ctx.fillStyle = grad;
    ctx.fill();

    // Sculpted Clay Bevel Ridge Line
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${ridgeHighlightAlpha})`;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }

  drawRollingClayHills(ctx, offset, palette, baseHeight, freq1, freq2, amp1, amp2, highlightAlpha) {
    ctx.save();
    const h = this.height;
    const step = 45;
    const totalPoints = Math.ceil(this.width / step) + 3;

    ctx.beginPath();
    ctx.moveTo(0, h);

    const points = [];
    for (let i = 0; i <= totalPoints; i++) {
      const x = i * step - (offset % step);
      const worldX = i * step + Math.floor(offset / step) * step;
      const y = h - baseHeight - Math.sin(worldX * freq1) * amp1 - Math.sin(worldX * freq2) * amp2;
      points.push({ x, y });
      ctx.lineTo(x, y);
    }

    ctx.lineTo(this.width, h);
    ctx.closePath();

    const hillGrad = ctx.createLinearGradient(0, h - baseHeight - amp1 - amp2, 0, h);
    hillGrad.addColorStop(0, palette[0]);
    hillGrad.addColorStop(0.3, palette[1]);
    hillGrad.addColorStop(1, palette[2]);
    ctx.fillStyle = hillGrad;
    ctx.fill();

    // Beveled ridge highlight (giving the tangible plasticine rim)
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.restore();
  }

  drawClayIslands(ctx, b) {
    ctx.save();
    for (const isl of this.islands) {
      let ix = (isl.x - this.islandOffset);
      if (ix < -300) ix += this.width * 2;

      ctx.save();
      ctx.translate(ix, isl.y);

      // Island drop shadow
      ctx.beginPath();
      ctx.ellipse(6, isl.height * 0.4 + 10, isl.width * 0.5, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();

      // Hanging clay roots & vines
      for (const root of isl.mossRoots) {
        ClayRenderer.drawClayCapsule(ctx, root.dx, isl.height * 0.4 + root.len / 2, root.r * 2, root.len, b.islandRockDark, '#140d0a');
        ClayRenderer.drawClayBlob(ctx, root.dx, isl.height * 0.4 + root.len, root.r + 1, root.r + 1, b.islandTopDark, '#140d0a');
      }

      // Geologic Clay Strata (Rock Base)
      ClayRenderer.drawClayCapsule(ctx, 0, 10, isl.width, isl.height * 0.65, b.islandRock, b.islandRockDark);

      // Strata Banding Stripe
      ClayRenderer.drawClayCapsule(ctx, 0, 8, isl.width * 0.9, isl.height * 0.16, b.islandRockDark, '#180e0a');

      // Grassy Clay Plateau Top
      ClayRenderer.drawClayCapsule(ctx, 0, -isl.height * 0.26, isl.width * 1.06, isl.height * 0.45, b.islandTop, b.islandTopDark);

      // Clay Tree with Multi-Tier Foliage Blobs
      if (isl.hasTree) {
        const tx = 14;
        const ty = -isl.height * 0.52;

        // Trunk
        ClayRenderer.drawClayCapsule(ctx, tx, ty, 14, 30, b.treeTrunk, b.treeTrunkDark);

        // Foliage Blobs (3D clustered clay balls)
        ClayRenderer.drawClayBlob(ctx, tx, ty - 26, 24, 20, b.treeFoliage[0], b.treeFoliage[2]);
        ClayRenderer.drawClayBlob(ctx, tx - 14, ty - 18, 18, 16, b.treeFoliage[1], b.treeFoliage[2]);
        ClayRenderer.drawClayBlob(ctx, tx + 14, ty - 18, 18, 16, b.treeFoliage[0], b.treeFoliage[2]);
        ClayRenderer.drawClayBlob(ctx, tx, ty - 34, 16, 14, b.treeFoliage[1], b.treeFoliage[2]);
      }

      ctx.restore();
    }
    ctx.restore();
  }

  drawAmbientParticles(ctx, b) {
    ctx.save();
    for (const p of this.ambientParticles) {
      ctx.fillStyle = `${b.ambientColor}${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow aura
      ctx.fillStyle = `${b.ambientColor}${p.alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
