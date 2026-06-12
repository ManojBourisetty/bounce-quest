const MOVE_KEYS_LEFT = ['ArrowLeft', 'a', 'A'];
const MOVE_KEYS_RIGHT = ['ArrowRight', 'd', 'D'];
const JUMP_KEYS = [' ', 'ArrowUp', 'w', 'W'];

export class InputManager {
  constructor() {
    this.left = false;
    this.right = false;
    this.jumpHeld = false;
    this.jumpPressed = false;
    this.jumpReleasedEdge = false;

    this._bindKeyboard();
    this._bindButton(document.getElementById('btn-left'), 'left');
    this._bindButton(document.getElementById('btn-right'), 'right');
    this._bindJumpButton(document.getElementById('btn-jump'));

    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.reset();
    });
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (MOVE_KEYS_LEFT.includes(e.key)) this.left = true;
      else if (MOVE_KEYS_RIGHT.includes(e.key)) this.right = true;
      else if (JUMP_KEYS.includes(e.key)) {
        if (!this.jumpHeld) this.jumpPressed = true;
        this.jumpHeld = true;
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (MOVE_KEYS_LEFT.includes(e.key)) this.left = false;
      else if (MOVE_KEYS_RIGHT.includes(e.key)) this.right = false;
      else if (JUMP_KEYS.includes(e.key)) {
        if (this.jumpHeld) this.jumpReleasedEdge = true;
        this.jumpHeld = false;
      }
    });
  }

  _bindButton(el, prop) {
    if (!el) return;
    const start = (e) => {
      e.preventDefault();
      this[prop] = true;
    };
    const end = (e) => {
      e.preventDefault();
      this[prop] = false;
    };
    el.addEventListener('pointerdown', start, { passive: false });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _bindJumpButton(el) {
    if (!el) return;
    const start = (e) => {
      e.preventDefault();
      if (!this.jumpHeld) this.jumpPressed = true;
      this.jumpHeld = true;
    };
    const end = (e) => {
      e.preventDefault();
      if (this.jumpHeld) this.jumpReleasedEdge = true;
      this.jumpHeld = false;
    };
    el.addEventListener('pointerdown', start, { passive: false });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  endFrame() {
    this.jumpPressed = false;
    this.jumpReleasedEdge = false;
  }

  reset() {
    this.left = false;
    this.right = false;
    this.jumpHeld = false;
    this.jumpPressed = false;
    this.jumpReleasedEdge = false;
  }
}
