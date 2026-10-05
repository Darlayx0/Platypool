// Input Manager for Keyboard, Mouse, and Touch controls
// Fully optimized for Desktop, Mobile, and macOS keyboards & trackpads
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

    this.touchSteerId = null;
    this.controlMode = 'UNIFIED';
    this.mouseSteeringActive = false;
    this.autoFire = false;
    this.pauseRequested = false;
    this.onAutoFireChanged = null;

    this._moveVector = { dx: 0, dy: 0 };
    this._cachedRect = null;

    this.isMac = typeof navigator !== 'undefined' && 
      (/Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent || ''));

    this.bindEvents();
  }

  bindEvents() {
    // Prevent default context menu on game canvas so right click and Mac Control-Click are responsive
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Prevent macOS Safari trackpad pinch-to-zoom gestures on canvas
    this.canvas.addEventListener('gesturestart', (e) => e.preventDefault());
    this.canvas.addEventListener('gesturechange', (e) => e.preventDefault());
    this.canvas.addEventListener('gestureend', (e) => e.preventDefault());

    // Window blur & visibility listeners to fix the macOS stuck-key bug
    // (When user Cmd+Tabs, opens Spotlight Cmd+Space, or switches windows, keyup is never fired by macOS)
    const clearAllKeys = () => {
      this.clearInputState();
    };
    window.addEventListener('blur', clearAllKeys);
    window.addEventListener('focus', clearAllKeys);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearAllKeys();
      }
    });

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      // Do not intercept if user is typing in any text input or textarea
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) {
        return;
      }

      // Allow macOS system reload / quit shortcuts without blocking
      if (e.metaKey && ['KeyR', 'KeyW', 'KeyQ'].includes(e.code)) {
        return;
      }

      // Track both code and normalized lowercase key
      this.keys.add(e.code);
      if (e.key) {
        this.keys.add(e.key.toLowerCase());
      }

      // Prevent macOS Safari / Chrome from scrolling on Space and Arrow keys
      const scrollKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
      if (scrollKeys.includes(e.code) || e.key === ' ') {
        e.preventDefault();
      }

      // Pause toggle: P or Escape
      if (e.code === 'KeyP' || e.code === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.pauseRequested = true;
      }

      // Keyboard M: Toggle Auto-Fire
      if (e.code === 'KeyM' || (e.key && e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        this.toggleAutoFire();
      }

      // Responsive keyboard movement - seamlessly takes control over mouse
      const moveKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const moveChar = e.key ? e.key.toLowerCase() : '';
      if (moveKeys.includes(e.code) || ['w', 'a', 's', 'd', 'z', 'q'].includes(moveChar)) {
        this.mouseSteeringActive = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.key) {
        this.keys.delete(e.key.toLowerCase());
      }

      // Critical for macOS: When Command (Meta) key is released, clear all keys
      // because macOS swallows keyup events for any keys released while Meta was down
      if (e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
        this.keys.clear();
      }
    });

    this.updateRect = () => {
      if (this.canvas) this._cachedRect = this.canvas.getBoundingClientRect();
    };
    window.addEventListener('resize', this.updateRect, { passive: true });
    window.addEventListener('scroll', this.updateRect, { passive: true });

    // Mouse & Touchpad movement inside canvas coordinates (canonical 1280x720 UHD logical space)
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this._cachedRect || (this._cachedRect = this.canvas.getBoundingClientRect());
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const scaleX = 1280 / rect.width;
      const scaleY = 720 / rect.height;

      const rawX = (e.clientX - rect.left) * scaleX;
      const rawY = (e.clientY - rect.top) * scaleY;
      const clampedX = Math.max(0, Math.min(1280, rawX));
      const clampedY = Math.max(0, Math.min(720, rawY));

      const mdx = clampedX - this.mouse.x;
      const mdy = clampedY - this.mouse.y;
      if (mdx * mdx + mdy * mdy > 1.44) {
        this.mouse.x = clampedX;
        this.mouse.y = clampedY;
        this.mouseSteeringActive = true;
        this.mouse.active = true;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      // MacOS Secondary Click support: Control + Left Click (standard macOS trackpad gesture) OR right click (button 2)
      const isRightClick = (e.button === 2) || (e.button === 0 && (e.ctrlKey || e.metaKey));
      if (isRightClick) {
        e.preventDefault();
        this.toggleAutoFire();
        return;
      }

      if (e.button === 0) {
        // Left click: shoot
        this.mouse.isDown = true;
        this.mouse.active = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
      }
    });

    // Touch events for mobile/tablets with multi-touch steering isolation (canonical 1280x720 UHD logical space)
    const updateTouchCoords = (touch) => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scaleX = 1280 / rect.width;
      const scaleY = 720 / rect.height;

      const rawX = (touch.clientX - rect.left) * scaleX;
      const rawY = (touch.clientY - rect.top) * scaleY;
      this.mouse.x = Math.max(0, Math.min(1280, rawX));
      this.mouse.y = Math.max(0, Math.min(720, rawY));
      this.mouseSteeringActive = true;
      this.mouse.active = true;
    };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        if (this.touchSteerId === null) {
          this.touchSteerId = touch.identifier;
        }
        updateTouchCoords(touch);
        if (checkVirtualHudButtons(this.mouse.x, this.mouse.y)) {
          return;
        }
        this.mouse.isDown = true;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      let steerTouch = null;
      if (this.touchSteerId !== null && e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.touchSteerId) {
            steerTouch = e.touches[i];
            break;
          }
        }
      }
      if (!steerTouch && e.touches && e.touches.length > 0) {
        steerTouch = e.touches[0];
        this.touchSteerId = steerTouch.identifier;
      }
      if (steerTouch) {
        updateTouchCoords(steerTouch);
        this.mouse.isDown = true;
      }
    }, { passive: false });

    const handleTouchEnd = (e) => {
      e.preventDefault();
      let endingOurSteer = false;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchSteerId) {
            endingOurSteer = true;
            break;
          }
        }
      }
      if (endingOurSteer || !e.touches || e.touches.length === 0) {
        if (e.touches && e.touches.length > 0) {
          this.touchSteerId = e.touches[0].identifier;
          updateTouchCoords(e.touches[0]);
        } else {
          this.touchSteerId = null;
          this.mouse.isDown = false;
        }
      }
    };

    this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  }

  clearInputState() {
    this.keys.clear();
    this.mouse.isDown = false;
    this.touchSteerId = null;
    this.pauseRequested = false;
    this.mouseSteeringActive = false;
    if (this.updateRect) this.updateRect();
  }

  isShooting() {
    if (this.autoFire) return true;
    return this.mouse.isDown || 
           this.keys.has('Space') || 
           this.keys.has(' ') || 
           this.keys.has('KeyJ') || 
           this.keys.has('j');
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    // Handles QWERTY, AZERTY (W/Z & A/Q), and Arrow keys
    const isUp = this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('w');
    const isDown = this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.keys.has('s');
    const isLeft = this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('q');
    const isRight = this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.keys.has('d');

    if (isUp) dy -= 1;
    if (isDown) dy += 1;
    if (isLeft) dx -= 1;
    if (isRight) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    this._moveVector.dx = dx;
    this._moveVector.dy = dy;
    return this._moveVector;
  }

  setControlMode(mode) {
    this.controlMode = 'UNIFIED';
    return this.controlMode;
  }

  toggleControlMode() {
    this.controlMode = 'UNIFIED';
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
