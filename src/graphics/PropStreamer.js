// Chunk-Based Deterministic Prop Streamer
// Splits an infinite parallax layer into fixed-width world chunks. Each chunk's content is
// generated lazily from hash(seed, chunkIndex), so props never loop, stay stable while on
// screen, and old chunks are evicted to keep memory bounded.
import { mulberry32, hash3 } from './Noise.js';

export class PropStreamer {
  /**
   * @param {object} cfg
   * @param {number} cfg.seed
   * @param {number} [cfg.chunkSize=512]  World px per chunk
   * @param {number} cfg.spacing          Slot width (px). One candidate per slot, jittered.
   * @param {number} [cfg.jitter=0.6]     Fraction of slot used for random offset (keeps min gap)
   * @param {(rng:Function, worldX:number, ctx:object) => object|null} cfg.generate
   *        Returns a prop object (any shape) or null to leave the slot empty.
   *        ctx.prevKind lets the generator avoid repeating the same variant back-to-back.
   * @param {number} [cfg.maxChunks=12]
   */
  constructor(cfg) {
    this.seed = cfg.seed >>> 0;
    this.chunkSize = cfg.chunkSize || 512;
    this.spacing = cfg.spacing;
    this.jitter = cfg.jitter !== undefined ? cfg.jitter : 0.6;
    this.generate = cfg.generate;
    this.maxChunks = cfg.maxChunks || 12;
    this.chunks = new Map();
  }

  reset() {
    this.chunks.clear();
  }

  getChunk(index) {
    let chunk = this.chunks.get(index);
    if (chunk) return chunk;

    const rng = mulberry32(hash3(this.seed, index, 77));
    const start = index * this.chunkSize;
    const slots = Math.max(1, Math.floor(this.chunkSize / this.spacing));
    const slotW = this.chunkSize / slots;
    const items = [];
    const genCtx = { prevKind: null, chunkIndex: index };

    for (let s = 0; s < slots; s++) {
      const offset = (1 - this.jitter) * 0.5 + rng() * this.jitter;
      const worldX = start + (s + offset) * slotW;
      const prop = this.generate(rng, worldX, genCtx);
      if (prop) {
        prop.worldX = worldX;
        genCtx.prevKind = prop.kind || null;
        items.push(prop);
      }
    }

    chunk = { index, items };
    this.chunks.set(index, chunk);

    // Evict oldest chunks (Map preserves insertion order)
    while (this.chunks.size > this.maxChunks) {
      const firstKey = this.chunks.keys().next().value;
      this.chunks.delete(firstKey);
    }
    return chunk;
  }

  /**
   * Iterate props visible for a layer scrolled to layerX.
   * cb(prop, screenX) is called in increasing world X order.
   */
  forEachVisible(layerX, viewWidth, margin, cb) {
    const first = Math.floor((layerX - margin) / this.chunkSize);
    const last = Math.floor((layerX + viewWidth + margin) / this.chunkSize);
    for (let c = first; c <= last; c++) {
      const chunk = this.getChunk(c);
      const items = chunk.items;
      for (let i = 0; i < items.length; i++) {
        const sx = items[i].worldX - layerX;
        if (sx > -margin && sx < viewWidth + margin) cb(items[i], sx);
      }
    }
  }
}
