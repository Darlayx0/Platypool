// Procedural Claymation Micro-Texture & Studio Lighting Engine for Platypus AI
export class ClayTexture {
  static patternCanvas = null;
  static pattern = null;

  /**
   * Generates a seamless procedural clay thumbprint & stipple pattern canvas.
   * Cached once globally across all background renderers.
   */
  static getPattern(ctx) {
    if (this.pattern) return this.pattern;

    const size = 128;
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return null;

    canvas.width = size;
    canvas.height = size;
    const pCtx = canvas.getContext('2d');

    // Base neutral midtone
    pCtx.fillStyle = 'rgba(128, 128, 128, 0.05)';
    pCtx.fillRect(0, 0, size, size);

    // 1. Procedural Thumbprint Whorls / Curved Friction Ridges
    pCtx.lineWidth = 1.2;
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    for (let r = 8; r < size * 0.9; r += 7) {
      pCtx.beginPath();
      pCtx.arc(size * 0.45, size * 0.5, r, Math.PI * 0.15, Math.PI * 0.95);
      pCtx.stroke();

      pCtx.beginPath();
      pCtx.arc(size * 0.55, size * 0.45, r + 2, Math.PI * 1.15, Math.PI * 1.95);
      pCtx.stroke();
    }

    // Shadow ridges for plasticine grooves
    pCtx.strokeStyle = 'rgba(0, 0, 0, 0.07)';
    for (let r = 9; r < size * 0.9; r += 7) {
      pCtx.beginPath();
      pCtx.arc(size * 0.45 + 1, size * 0.5 + 1, r, Math.PI * 0.15, Math.PI * 0.95);
      pCtx.stroke();

      pCtx.beginPath();
      pCtx.arc(size * 0.55 + 1, size * 0.45 + 1, r + 2, Math.PI * 1.15, Math.PI * 1.95);
      pCtx.stroke();
    }

    // 2. Micro-Stipple / Plasticine Surface Pores
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const rad = 0.5 + Math.random() * 1.2;
      const isLight = Math.random() > 0.5;

      pCtx.beginPath();
      pCtx.arc(x, y, rad, 0, Math.PI * 2);
      pCtx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.07)';
      pCtx.fill();
    }

    this.patternCanvas = canvas;
    if (ctx && ctx.createPattern) {
      this.pattern = ctx.createPattern(canvas, 'repeat');
    }
    return this.pattern;
  }

  /**
   * Applies subtle claymation texture over an existing shape on an offscreen canvas
   */
  static overlayTexture(ctx, x, y, width, height, alpha = 0.08) {
    const pat = this.getPattern(ctx);
    if (!pat) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pat;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }
}
