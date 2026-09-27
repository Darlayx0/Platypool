// Camera with Screen Shake (Trauma model)
export class Camera {
  constructor(width = 1280, height = 720) {
    this.width = width;
    this.height = height;
    this.trauma = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  addTrauma(amount) {
    // Shake effect on background and environment removed per user request
    this.trauma = 0;
  }

  update(dt) {
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.trauma = 0;
  }

  apply(ctx) {
    // Rock-solid rendering: background and environment never shake
  }
}
