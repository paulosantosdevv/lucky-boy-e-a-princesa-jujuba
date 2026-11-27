// Haptic feedback helper using the browser Vibration API (Android Chrome / supported mobile devices)

class HapticsManager {
  public enabled = true;

  public trigger(pattern: number | number[]) {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore on unsupported browsers (e.g. desktop or iOS Safari)
    }
  }

  public dpad() {
    this.trigger(12);
  }

  public buttonA() {
    this.trigger(18);
  }

  public buttonB() {
    this.trigger(22);
  }

  public buttonX() {
    this.trigger(16);
  }

  public buttonY() {
    this.trigger([18, 22, 24]);
  }

  public bounce() {
    this.trigger(24);
  }

  public impact() {
    this.trigger(32);
  }

  public hurt() {
    this.trigger([40, 28, 40]);
  }

  public collect() {
    this.trigger([14, 18, 26]);
  }
}

export const haptics = new HapticsManager();
