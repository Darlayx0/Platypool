// Shared infrastructure for scenery biomes: grouping, grounding and baking of streamed props,
// procedural cloud layers and ambient motes. Biome subclasses provide materials & composition.
import { ClayProps } from '../ClayProps.js';
import { mixHex } from '../ColorUtil.js';

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export class BiomeBase {
  constructor(bg, seed) {
    this.bg = bg;
    this.seed = seed >>> 0;
    this.width = bg.width;
    this.height = bg.height;
    this.allStreamers = [];
    this.motes = [];
  }

  onResize(width, height) {
    this.width = width;
    this.height = height;
    for (const s of this.allStreamers) s.reset();
  }

  aerial(hex, fog, ts) {
    return ts.map((t) => mixHex(hex, fog, t));
  }

  slopeAt(profile, wx) {
    return Math.abs(profile.heightAt(wx + 6) - profile.heightAt(wx - 6)) / 12;
  }

  // ---------------------------------------------------------------------------
  // Prop groups
  // ---------------------------------------------------------------------------

  group(members, extra = {}) {
    members = members.filter(Boolean);
    if (!members.length) return null;
    members.sort((a, b) => a.dy - b.dy);
    return { kind: members[0].kind, members, sink: 2, ...extra };
  }

  cluster(rng, kinds, pal, count, spread) {
    const members = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const dx = count === 1 ? 0 : (t - 0.5) * spread + (rng() - 0.5) * spread * 0.25;
      const dy = -rng() * 4;
      members.push(this.member(rng, pick(rng, kinds), pal, dx, dy));
    }
    return members;
  }

  memberExtent(mb) {
    const v = mb.v;
    switch (mb.kind) {
      case 'tree': return { hw: v.canopy * 1.35, h: v.height + v.canopy * 0.25 };
      case 'conifer': return { hw: v.height * v.ratio * 0.6 + 3, h: v.height + 4 };
      case 'poplar': return { hw: 9 * v.girth, h: v.height + 2 };
      case 'bush': return { hw: v.size * 1.4, h: v.size * 1.4 };
      case 'rock': return { hw: v.w * 0.7, h: v.h + 2 };
      case 'hay': return { hw: v.count * 7 + 4, h: 14 };
      case 'cottage': return { hw: v.w / 2 + 6, h: v.h + v.roofH + 4 };
      case 'windmill': return { hw: 20, h: v.height + 12 };
      case 'saguaro': {
        let reach = 0;
        for (const a of v.arms) reach = Math.max(reach, a.reach + 5);
        return { hw: reach + 6, h: v.height + 2 };
      }
      case 'barrel': return { hw: 9, h: 16 };
      case 'hoodoo': {
        let h = 0;
        let w = 0;
        for (const sg of v.segments) { h += sg.h * 0.92; w = Math.max(w, sg.w / 2 + Math.abs(sg.dx)); }
        return { hw: w + 4, h: h + 4 };
      }
      default: return { hw: 10, h: 10 };
    }
  }

  drawMember(c, s, pal, mb, L) {
    switch (mb.kind) {
      case 'tree': ClayProps.deciduousTree(c, s, pal, mb.v, L); break;
      case 'conifer': ClayProps.conifer(c, s, pal, mb.v, L); break;
      case 'poplar': ClayProps.poplar(c, s, pal, mb.v, L); break;
      case 'bush': ClayProps.bush(c, s, pal, mb.v, L); break;
      case 'rock': ClayProps.rock(c, s, pal, mb.v, L); break;
      case 'hay': ClayProps.hay(c, s, pal, mb.v, L); break;
      case 'cottage': ClayProps.cottage(c, s, pal, mb.v, L); break;
      case 'windmill': ClayProps.windmillBody(c, s, pal, mb.v, L); break;
      case 'saguaro': ClayProps.saguaro(c, s, pal, mb.v, L); break;
      case 'barrel': ClayProps.barrelCactus(c, s, pal, mb.v, L); break;
      case 'hoodoo': ClayProps.hoodoo(c, s, pal, mb.v, L); break;
    }
  }

  /** Compute bake box, ground elevation and attachment points for a prop group. */
  finalizeProp(prop, layer, wx) {
    if (!prop) return null;
    prop.elev = layer.profile.heightAt(wx);
    const s = layer.s;
    let hw = 0;
    let h = 0;
    prop.chimneys = [];
    for (const mb of prop.members) {
      const e = this.memberExtent(mb);
      hw = Math.max(hw, Math.abs(mb.dx) + e.hw);
      h = Math.max(h, e.h - mb.dy);
      if (mb.kind === 'cottage' && mb.v.chimney) {
        prop.chimneys.push({ dx: (mb.dx + mb.v.w * 0.18 + 2.5) * s, dy: (mb.dy - mb.v.h - mb.v.roofH * 0.85) * s });
      }
      if (mb.kind === 'windmill') prop.hub = { dx: mb.dx * s, dy: (mb.dy - mb.v.height - 2) * s };
    }
    prop.box = { w: hw * 2 * s, h: h * s + 4 };
    return prop;
  }

  bakeProp(prop, layer, pal) {
    const s = layer.s;
    const L = this.bg.light;
    return ClayProps.bake(this.bg, prop.box, (c) => {
      for (const mb of prop.members) {
        c.save();
        c.translate(mb.dx * s, mb.dy * s);
        this.drawMember(c, s, pal, mb, L);
        c.restore();
      }
    });
  }

  /** Draw streamed, grounded props for a terrain layer. onProp(prop, sx, gy) for live extras. */
  drawPropLayer(ctx, streamer, layer, pal, onProp = null) {
    const bg = this.bg;
    const lx = bg.layerX(layer.factor);
    const yShift = bg.cameraYShift * layer.yFactor;
    const H = this.height;
    streamer.forEachVisible(lx, this.width, 120, (p, sx) => {
      if (!p.sprite) p.sprite = this.bakeProp(p, layer, pal);
      const gy = H - p.elev + yShift + p.sink;
      ClayProps.drawSprite(ctx, p.sprite, sx, gy);
      if (onProp) onProp(p, sx, gy);
    });
  }

  // ---------------------------------------------------------------------------
  // Clouds & motes
  // ---------------------------------------------------------------------------

  drawClouds(ctx, streamer, factor, drift, pal) {
    const bg = this.bg;
    const lx = bg.distance * factor + bg.tick * drift;
    const yShift = bg.cameraYShift * 0.02;
    streamer.forEachVisible(lx, this.width, 260, (p, sx) => {
      if (!p.sprite) p.sprite = bg.bakeCloud(p.hash, p.size, pal, { flatness: p.flatness });
      const sp = p.sprite;
      if (!sp) return;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.drawImage(sp.canvas, sx - sp.ax, p.y + yShift - sp.ay, sp.w, sp.h);
      ctx.restore();
    });
  }

  initMotes(count, opts = {}) {
    this.motes = [];
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (opts.vx || -18) - Math.random() * (opts.vxRand || 22),
        vy: -6 + Math.random() * 12,
        size: (opts.size || 1.2) + Math.random() * (opts.sizeRand || 1.6),
        alpha: (opts.alpha || 0.14) + Math.random() * (opts.alphaRand || 0.2),
        bobSpeed: 0.6 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  updateMotes(dt, speedMultiplier) {
    for (const p of this.motes) {
      p.x += p.vx * dt * speedMultiplier;
      p.y += (p.vy + Math.sin(this.bg.tick * p.bobSpeed + p.phase) * 8) * dt;
      if (p.x < -20) { p.x = this.width + 20; p.y = Math.random() * this.height; }
      if (p.y < -20) p.y = this.height + 20;
      if (p.y > this.height + 20) p.y = -20;
    }
  }

  drawMotes(ctx, color) {
    ctx.save();
    ctx.fillStyle = color;
    for (const p of this.motes) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
