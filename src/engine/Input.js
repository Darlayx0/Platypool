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
    this.onAutoFireChanged = null;

    this.bindEvents();
  }

  bindEvents() {
    // Prevent default context menu on game canvas so right click is responsive
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);

      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.pauseRequested = true;
      }

      // Keyboard M: Toggle Auto-Fire
      if (e.code === 'KeyM') {
        // Only trigger during active game if no text input focused
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        this.toggleAutoFire();
      }

      // Switch to keyboard mode if arrow or WASD pressed
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        this.controlMode = 'KEYBOARD';
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Mouse movement inside canvas coordinates (canonical 1280x720 UHD logical space)
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scaleX = 1280 / rect.width;
      const scaleY = 720 / rect.height;

      const rawX = (e.clientX - rect.left) * scaleX;
      const rawY = (e.clientY - rect.top) * scaleY;
      this.mouse.x = Math.max(0, Math.min(1280, rawX));
      this.mouse.y = Math.max(0, Math.min(720, rawY));
      this.mouse.active = true;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Left click: shoot
        this.mouse.isDown = true;
        this.mouse.active = true;
      } else if (e.button === 2) {
        // Right click: toggle auto-fire
        e.preventDefault();
        this.toggleAutoFire();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
      }
    });

    // Touch events for mobile/tablets (canonical 1280x720 UHD logical space)
    const handleTouch = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const scaleX = 1280 / rect.width;
        const scaleY = 720 / rect.height;

        const rawX = (touch.clientX - rect.left) * scaleX;
        const rawY = (touch.clientY - rect.top) * scaleY;
        this.mouse.x = Math.max(0, Math.min(1280, rawX));
        this.mouse.y = Math.max(0, Math.min(720, rawY));
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

  setControlMode(mode) {
    this.controlMode = mode === 'KEYBOARD' ? 'KEYBOARD' : 'MOUSE';
    return this.controlMode;
  }

  toggleControlMode() {
    this.controlMode = this.controlMode === 'MOUSE' ? 'KEYBOARD' : 'MOUSE';
    return this.controlMode;
  }

  setAutoFire(enabled, notify = true) {
    this.autoFire = Boolean(enabled);
    if (notify && this.onAutoFireChanged) {
      this.onAutoFireChanged(this.autoFire);
    }
    return this.autoFire;
  }

  toggleAutoFire() {
    this.autoFire = !this.autoFire;
    if (this.onAutoFireChanged) {
      this.onAutoFireChanged(this.autoFire);
    }
    return this.autoFire;
  }

  consumePause() {
    const p = this.pauseRequested;
    this.pauseRequested = false;
    return p;
  }
}
