// Input Manager for Keyboard, Mouse, and Touch controls
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = {
      x: 200,
      y: 360,
      isDown: false,
      active: true // default to mouse active if moved
    };

    this.controlMode = 'MOUSE'; // 'MOUSE' or 'KEYBOARD'
    this.autoFire = false;
    this.pauseRequested = false;

    this.bindEvents();
  }

  bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);

      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.pauseRequested = true;
      }

      // Switch to keyboard mode if arrow or WASD pressed
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        this.controlMode = 'KEYBOARD';
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Mouse movement inside canvas coordinates
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
      this.mouse.active = true;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = true;
        this.mouse.active = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
      }
    });

    // Touch events for mobile/tablets
    const handleTouch = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.mouse.x = (touch.clientX - rect.left) * scaleX;
        this.mouse.y = (touch.clientY - rect.top) * scaleY;
        this.mouse.isDown = true;
        this.controlMode = 'MOUSE';
      }
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTouch(e);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleTouch(e);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.mouse.isDown = false;
    });
  }

  isShooting() {
    if (this.autoFire) return true;
    return this.mouse.isDown || this.keys.has('Space') || this.keys.has('KeyJ');
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }

  toggleControlMode() {
    this.controlMode = this.controlMode === 'MOUSE' ? 'KEYBOARD' : 'MOUSE';
    return this.controlMode;
  }

  toggleAutoFire() {
    this.autoFire = !this.autoFire;
    return this.autoFire;
  }

  consumePause() {
    const p = this.pauseRequested;
    this.pauseRequested = false;
    return p;
  }
}
