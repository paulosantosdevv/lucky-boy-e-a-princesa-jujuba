import { InputState } from '../types/game';

export type VirtualButton = 'left' | 'right' | 'up' | 'down' | 'a' | 'b' | 'x' | 'y' | 'pause';

class InputManager {
  private keys = new Set<string>();
  private virtual = new Set<VirtualButton>();
  private prevA = false;
  private prevB = false;
  private prevX = false;
  private prevY = false;
  private prevPause = false;
  private bound = false;

  public bind() {
    if (this.bound || typeof window === 'undefined') return;
    this.bound = true;

    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  public unbind() {
    if (!this.bound || typeof window === 'undefined') return;
    this.bound = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
      ].includes(code)
    ) {
      e.preventDefault();
    }
    this.keys.add(code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onBlur = () => {
    this.keys.clear();
    this.virtual.clear();
  };

  public setVirtual(btn: VirtualButton, pressed: boolean) {
    if (pressed) this.virtual.add(btn);
    else this.virtual.delete(btn);
  }

  public clearAll() {
    this.keys.clear();
    this.virtual.clear();
  }

  public poll(): InputState {
    // Poll Gamepad API if connected
    let gpLeft = false;
    let gpRight = false;
    let gpUp = false;
    let gpDown = false;
    let gpAxisX = 0;
    let gpAxisY = 0;
    let gpA = false;
    let gpB = false;
    let gpX = false;
    let gpY = false;
    let gpPause = false;

    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      for (let i = 0; i < pads.length; i++) {
        const gp = pads[i];
        if (!gp) continue;
        const ax0 = gp.axes[0] || 0;
        const ax1 = gp.axes[1] || 0;
        if (Math.abs(ax0) > 0.22) gpAxisX = ax0;
        if (Math.abs(ax1) > 0.22) gpAxisY = ax1;
        if (ax0 < -0.35 || gp.buttons[14]?.pressed) gpLeft = true;
        if (ax0 > 0.35 || gp.buttons[15]?.pressed) gpRight = true;
        if (ax1 < -0.35 || gp.buttons[12]?.pressed) gpUp = true;
        if (ax1 > 0.35 || gp.buttons[13]?.pressed) gpDown = true;
        if (gp.buttons[0]?.pressed) gpA = true;
        if (gp.buttons[1]?.pressed || gp.buttons[2]?.pressed) gpB = true;
        if (gp.buttons[2]?.pressed || gp.buttons[5]?.pressed) gpX = true;
        if (gp.buttons[3]?.pressed || gp.buttons[4]?.pressed) gpY = true;
        if (gp.buttons[9]?.pressed) gpPause = true;
        break;
      }
    }

    const left =
      this.keys.has('ArrowLeft') ||
      this.keys.has('KeyA') ||
      this.virtual.has('left') ||
      gpLeft;
    const right =
      this.keys.has('ArrowRight') ||
      this.keys.has('KeyD') ||
      this.virtual.has('right') ||
      gpRight;
    const up =
      this.keys.has('ArrowUp') ||
      this.keys.has('KeyW') ||
      this.virtual.has('up') ||
      gpUp;
    const down =
      this.keys.has('ArrowDown') ||
      this.keys.has('KeyS') ||
      this.virtual.has('down') ||
      gpDown;

    const a = this.keys.has('Space') || this.keys.has('KeyZ') || this.virtual.has('a') || gpA;
    const b = this.keys.has('KeyJ') || this.keys.has('KeyX') || this.virtual.has('b') || gpB;
    const x =
      this.keys.has('KeyK') ||
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.virtual.has('x') ||
      gpX;
    const y = this.keys.has('KeyL') || this.keys.has('KeyE') || this.virtual.has('y') || gpY;
    const pause = this.keys.has('Escape') || this.virtual.has('pause') || gpPause;

    const axisX = gpAxisX !== 0 ? gpAxisX : (right ? 1 : 0) - (left ? 1 : 0);
    const axisY = gpAxisY !== 0 ? gpAxisY : (down ? 1 : 0) - (up ? 1 : 0);

    const state: InputState = {
      left,
      right,
      up,
      down,
      axisX,
      axisY,
      a,
      b,
      x,
      y,
      pause,
      aJustPressed: a && !this.prevA,
      bJustPressed: b && !this.prevB,
      xJustPressed: x && !this.prevX,
      yJustPressed: y && !this.prevY,
      pauseJustPressed: pause && !this.prevPause,
    };

    this.prevA = a;
    this.prevB = b;
    this.prevX = x;
    this.prevY = y;
    this.prevPause = pause;

    return state;
  }
}

export const inputManager = new InputManager();
