// Refined Clay Prop Library for Background Scenery
// Soft, matte plasticine shading (no glossy toy glints), consistent with the global key light.
// Props are baked once into offscreen sprites and reused while their chunk is alive.
import { mixHex, rgba } from './ColorUtil.js';

const WARM_LIGHT = '#fff3e2';
const COOL_DARK = '#1c2330';

export const ClayProps = {
  /**
   * Bake a prop into an offscreen sprite. drawFn(c) draws with origin at the ground anchor.
   * box = { w, h } in logical px (anchor at bottom-center).
   */
  bake(bg, box, drawFn) {
    if (typeof document === 'undefined') return null;
    const dpr = Math.min(bg.dpr || 1, 2);
    const pad = 8;
    const w = box.w + pad * 2;
    const h = box.h + pad * 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(w * dpr));
    canvas.height = Math.max(1, Math.ceil(h * dpr));
    const c = canvas.getContext('2d');
    c.scale(dpr, dpr);
    const ax = w / 2;
    const ay = box.h + pad;
    c.translate(ax, ay);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    drawFn(c);
    return { canvas, w, h, ax, ay };
  },

  drawSprite(ctx, sprite, x, y, alpha = 1) {
    if (!sprite) return;
    if (alpha < 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite.canvas, x - sprite.ax, y - sprite.ay, sprite.w, sprite.h);
      ctx.restore();
    } else {
      ctx.drawImage(sprite.canvas, x - sprite.ax, y - sprite.ay, sprite.w, sprite.h);
    }
  },

  // ---------------------------------------------------------------------------
  // Primitives
  // ---------------------------------------------------------------------------

  contactShadow(c, w, s, alpha = 0.22) {
    c.save();
    c.beginPath();
    c.ellipse(0, 1.5 * s, w * 0.5, Math.max(1.5, 3 * s), 0, 0, Math.PI * 2);
    c.fillStyle = `rgba(18, 22, 20, ${alpha})`;
    c.fill();
    c.restore();
  },

  /** Matte clay ellipse lit from L. */
  blob(c, x, y, rx, ry, base, L, lightAmt = 0.26, darkAmt = 0.36) {
    const r = Math.max(rx, ry);
    const g = c.createRadialGradient(x + L.x * rx * 0.5, y + L.y * ry * 0.5, r * 0.05, x, y, r * 1.08);
    g.addColorStop(0, mixHex(base, WARM_LIGHT, lightAmt));
    g.addColorStop(0.55, base);
    g.addColorStop(1, mixHex(base, COOL_DARK, darkAmt));
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  },

  /** Linear light-to-shade gradient across a box (light from L). */
  boxGradient(c, x, y, w, h, base, L, lightAmt = 0.22, darkAmt = 0.32) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const hw = w / 2;
    const hh = h / 2;
    const g = c.createLinearGradient(cx + L.x * hw, cy + L.y * hh, cx - L.x * hw, cy - L.y * hh);
    g.addColorStop(0, mixHex(base, WARM_LIGHT, lightAmt));
    g.addColorStop(0.5, base);
    g.addColorStop(1, mixHex(base, COOL_DARK, darkAmt));
    return g;
  },

  roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  },

  softBox(c, x, y, w, h, r, base, L, lightAmt, darkAmt) {
    this.roundRect(c, x, y, w, h, r);
    c.fillStyle = this.boxGradient(c, x, y, w, h, base, L, lightAmt, darkAmt);
    c.fill();
  },

  /** Rounded triangle (used for conifer tiers, roofs, rock spires). */
  softTriangle(c, x0, y0, x1, y1, x2, y2, base, L, round = 2.5) {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.lineTo(x2, y2);
    c.closePath();
    const minX = Math.min(x0, x1, x2);
    const maxX = Math.max(x0, x1, x2);
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    const fill = this.boxGradient(c, minX, minY, maxX - minX, maxY - minY, base, L);
    c.fillStyle = fill;
    c.strokeStyle = fill;
    c.lineWidth = round * 2;
    c.lineJoin = 'round';
    c.stroke();
    c.fill();
  },

  // ---------------------------------------------------------------------------
  // Valley props
  // ---------------------------------------------------------------------------

  deciduousTree(c, s, pal, v, L) {
    const h = v.height * s;
    this.contactShadow(c, v.canopy * 1.4 * s, s);
    this.softBox(c, -2.2 * s, -h * 0.48, 4.4 * s, h * 0.48 + 1.5 * s, 2 * s, pal.trunk, L);
    const back = mixHex(v.color, COOL_DARK, 0.14);
    const cy = -h + v.canopy * 0.85 * s;
    for (const b of v.blobs) {
      if (b.back) this.blob(c, b.dx * s, cy + b.dy * s, b.r * s, b.r * 0.92 * s, back, L);
    }
    for (const b of v.blobs) {
      if (!b.back) this.blob(c, b.dx * s, cy + b.dy * s, b.r * s, b.r * 0.92 * s, v.color, L);
    }
  },

  conifer(c, s, pal, v, L) {
    const H = v.height * s;
    const W = H * v.ratio;
    this.contactShadow(c, W * 1.1, s);
    this.softBox(c, -1.8 * s, -H * 0.16, 3.6 * s, H * 0.16 + 1.5 * s, 1.5 * s, pal.trunk, L);
    const tiers = v.tiers;
    for (let t = 0; t < tiers; t++) {
      const k = t / tiers;
      const top = -H + k * H * 0.32;
      const bottom = -H * 0.12 - (tiers - 1 - t) * H * 0.18;
      const halfW = (W / 2) * (0.62 + k * 0.38);
      const col = mixHex(v.color, COOL_DARK, 0.1 - k * 0.1);
      this.softTriangle(c, 0, top, -halfW, bottom, halfW, bottom, col, L, 2.2 * s);
    }
  },

  poplar(c, s, pal, v, L) {
    const H = v.height * s;
    this.contactShadow(c, 12 * s, s);
    this.softBox(c, -1.6 * s, -H * 0.22, 3.2 * s, H * 0.22 + 1.5 * s, 1.5 * s, pal.trunk, L);
    this.blob(c, 0, -H * 0.58, 6.5 * s * v.girth, H * 0.42, v.color, L, 0.22, 0.34);
  },

  bush(c, s, pal, v, L) {
    this.contactShadow(c, 22 * s, s, 0.18);
    for (const b of v.blobs) {
      this.blob(c, b.dx * s, b.dy * s, b.r * s, b.r * 0.85 * s, v.color, L, 0.2, 0.32);
    }
  },

  rock(c, s, pal, v, L) {
    this.contactShadow(c, v.w * 1.1 * s, s, 0.25);
    this.blob(c, -v.w * 0.18 * s, -v.h * 0.42 * s, v.w * 0.42 * s, v.h * 0.5 * s, v.color, L, 0.22, 0.4);
    this.blob(c, v.w * 0.16 * s, -v.h * 0.3 * s, v.w * 0.34 * s, v.h * 0.36 * s, mixHex(v.color, COOL_DARK, 0.06), L, 0.2, 0.4);
  },

  hay(c, s, pal, v, L) {
    this.contactShadow(c, v.count * 13 * s, s, 0.2);
    for (let i = 0; i < v.count; i++) {
      const x = (i - (v.count - 1) / 2) * 12 * s;
      this.blob(c, x, -6 * s, 6.4 * s, 6 * s, pal.hay, L, 0.25, 0.3);
    }
  },

  cottage(c, s, pal, v, L) {
    const w = v.w * s;
    const h = v.h * s;
    const roofH = v.roofH * s;
    this.contactShadow(c, w * 1.25, s, 0.24);
    // Chimney (behind roof)
    if (v.chimney) {
      this.softBox(c, w * 0.18, -h - roofH * 0.85, 5 * s, roofH * 0.7, 1.2 * s, pal.chimney, L);
    }
    // Walls
    this.softBox(c, -w / 2, -h, w, h, 2.2 * s, v.wall, L, 0.18, 0.26);
    // Roof
    const eave = 3.5 * s;
    this.softTriangle(c, 0, -h - roofH, -w / 2 - eave, -h + 1.5 * s, w / 2 + eave, -h + 1.5 * s, v.roof, L, 1.8 * s);
    // Door & windows (muted warm interior)
    this.softBox(c, -w * 0.3, -h * 0.58, w * 0.18, h * 0.58, 1.5 * s, mixHex(v.roof, COOL_DARK, 0.35), L, 0.1, 0.2);
    c.fillStyle = rgba(pal.window, 0.85);
    this.roundRect(c, w * 0.06, -h * 0.68, w * 0.2, h * 0.28, 1.2 * s);
    c.fill();
    if (v.w > 30) {
      this.roundRect(c, w * 0.3 - w * 0.02, -h * 0.68, w * 0.14, h * 0.28, 1.2 * s);
      c.fill();
    }
  },

  windmillBody(c, s, pal, v, L) {
    const H = v.height * s;
    const bw = 15 * s;
    const tw = 9 * s;
    this.contactShadow(c, bw * 2.2, s, 0.24);
    c.beginPath();
    c.moveTo(-bw, 0);
    c.lineTo(-tw, -H);
    c.lineTo(tw, -H);
    c.lineTo(bw, 0);
    c.closePath();
    const g = this.boxGradient(c, -bw, -H, bw * 2, H, pal.stone, L, 0.2, 0.3);
    c.fillStyle = g;
    c.strokeStyle = g;
    c.lineWidth = 2.5 * s;
    c.stroke();
    c.fill();
    // Door
    this.softBox(c, -3 * s, -10 * s, 6 * s, 10 * s, 2.5 * s, mixHex(pal.millCap, COOL_DARK, 0.35), L, 0.1, 0.2);
    // Window
    c.fillStyle = rgba(pal.window, 0.7);
    this.roundRect(c, -2 * s, -H * 0.62, 4 * s, 5 * s, 1.5 * s);
    c.fill();
    // Cap
    this.blob(c, 0, -H - 2 * s, tw * 1.25, 7 * s, pal.millCap, L, 0.2, 0.34);
  },

  windmillSails(ctx, x, y, s, angle, pal) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = pal.sailFrame;
      ctx.fillRect(-1.1 * s, -30 * s, 2.2 * s, 30 * s);
      ctx.fillStyle = pal.sail;
      ctx.fillRect(1.4 * s, -28 * s, 6.5 * s, 22 * s);
    }
    ctx.fillStyle = pal.millCap;
    ctx.beginPath();
    ctx.arc(0, 0, 2.6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // ---------------------------------------------------------------------------
  // Canyon props
  // ---------------------------------------------------------------------------

  saguaro(c, s, pal, v, L) {
    const H = v.height * s;
    const r = 4.2 * s * v.girth;
    this.contactShadow(c, r * 4, s, 0.22);
    this.softBox(c, -r, -H, r * 2, H + 1, r, v.color, L, 0.22, 0.34);
    for (const a of v.arms) {
      const ay = -H * a.at;
      const dir = a.side;
      const reach = a.reach * s;
      const rise = a.rise * s;
      const ar = r * 0.72;
      // elbow
      this.softBox(c, dir > 0 ? 0 : -reach, ay - ar, reach, ar * 2, ar, v.color, L, 0.2, 0.34);
      // upright
      this.softBox(c, dir * reach - ar, ay - rise, ar * 2, rise + ar, ar, v.color, L, 0.22, 0.34);
    }
  },

  barrelCactus(c, s, pal, v, L) {
    this.contactShadow(c, 14 * s, s, 0.2);
    this.blob(c, 0, -6 * s, 7 * s, 7.5 * s, v.color, L, 0.22, 0.34);
    if (v.flower) this.blob(c, 0, -13 * s, 2.4 * s, 2 * s, pal.flower, L, 0.2, 0.25);
  },

  hoodoo(c, s, pal, v, L) {
    this.contactShadow(c, v.w * 1.3 * s, s, 0.24);
    let y = 0;
    for (const seg of v.segments) {
      const w = seg.w * s;
      const h = seg.h * s;
      this.softBox(c, -w / 2 + seg.dx * s, y - h, w, h + 1, Math.min(w, h) * 0.45, seg.color, L, 0.2, 0.34);
      y -= h * 0.92;
    }
  },

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  /** Build a deciduous canopy blob layout from a PRNG. */
  makeCanopy(rng, canopy) {
    const blobs = [];
    const n = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      blobs.push({
        dx: (t - 0.5) * canopy * 1.1 + (rng() - 0.5) * canopy * 0.2,
        dy: (rng() - 0.5) * canopy * 0.35 + Math.abs(t - 0.5) * canopy * 0.35,
        r: canopy * (0.5 + rng() * 0.25) * (1 - Math.abs(t - 0.5) * 0.4),
        back: i % 2 === 1
      });
    }
    // crown
    blobs.push({ dx: (rng() - 0.5) * canopy * 0.3, dy: -canopy * 0.42, r: canopy * 0.52, back: false });
    return blobs;
  },

  makeBushBlobs(rng, size) {
    const blobs = [];
    const n = 3 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      blobs.push({
        dx: (t - 0.5) * size * 1.4,
        dy: -size * (0.45 + rng() * 0.25) * (1 - Math.abs(t - 0.5)),
        r: size * (0.42 + rng() * 0.2)
      });
    }
    return blobs;
  }
};
