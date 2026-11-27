class HapticsManager {
  private enabled = true;

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled() {
    return this.enabled;
  }

  public vibrate(pattern: number | number[]) {
    if (!this.enabled) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore on browsers/devices without Vibration API
    }
  }

  public tapDpad() {
    this.vibrate(14);
  }

  public tapAction() {
    this.vibrate(24);
  }

  public tapUi() {
    this.vibrate(12);
  }

  public impact() {
    this.vibrate([28, 25, 40]);
  }

  public reward() {
    this.vibrate([16, 28, 24]);
  }
}

export const haptics = new HapticsManager();
