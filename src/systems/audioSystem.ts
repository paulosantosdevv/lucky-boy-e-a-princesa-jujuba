import { MusicTrack } from '../types/game';

export type SfxName =
  | 'jump'
  | 'double_jump'
  | 'bark'
  | 'super_bark'
  | 'belly_flop'
  | 'treat'
  | 'paw'
  | 'powerup'
  | 'hurt'
  | 'enemy_defeat'
  | 'checkpoint'
  | 'star'
  | 'shoot'
  | 'boost'
  | 'splash'
  | 'gift'
  | 'win'
  | 'click';

// Frequency map (Hz)
const N: Record<string, number> = {
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, A5: 880.0, B5: 987.77,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  R: 0,
};

const TRACKS: Record<MusicTrack, { tempo: number; wave: OscillatorType; melody: string[]; bass: string[] }> = {
  menu: {
    tempo: 135,
    wave: 'triangle',
    melody: ['E5', 'E5', 'E5', 'R', 'E5', 'E5', 'E5', 'R', 'E5', 'G5', 'C5', 'D5', 'E5', 'R', 'R', 'R', 'F5', 'F5', 'F5', 'F5', 'F5', 'E5', 'E5', 'E5', 'E5', 'D5', 'D5', 'E5', 'D5', 'R', 'G5', 'R'],
    bass: ['C3', 'R', 'G3', 'R', 'C3', 'R', 'G3', 'R', 'C3', 'R', 'E3', 'R', 'C3', 'G3', 'C4', 'R', 'F3', 'R', 'C4', 'R', 'C3', 'R', 'G3', 'R', 'D3', 'R', 'G3', 'R', 'G3', 'R', 'B3', 'R'],
  },
  adventure: {
    tempo: 152,
    wave: 'triangle',
    melody: ['C5', 'E5', 'G5', 'E5', 'A5', 'G5', 'E5', 'C5', 'D5', 'F5', 'A5', 'G5', 'E5', 'D5', 'C5', 'R'],
    bass: ['C3', 'G3', 'C3', 'G3', 'F3', 'C4', 'G3', 'D3', 'D3', 'A3', 'G3', 'B3', 'C3', 'G3', 'C3', 'R'],
  },
  forest: {
    tempo: 136,
    wave: 'sine',
    melody: ['A4', 'C5', 'E5', 'D5', 'C5', 'B4', 'A4', 'E4', 'F4', 'A4', 'C5', 'B4', 'A4', 'G4', 'A4', 'R'],
    bass: ['A3', 'E3', 'A3', 'E3', 'F3', 'C3', 'E3', 'B3', 'D3', 'A3', 'E3', 'G3', 'A3', 'E3', 'A3', 'R'],
  },
  kart: {
    tempo: 185,
    wave: 'square',
    melody: ['G5', 'E5', 'C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'F5', 'D5', 'B4', 'D5', 'G5', 'F5', 'E5', 'D5'],
    bass: ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'E3', 'E3', 'F3', 'F3', 'D3', 'D3', 'G3', 'G3', 'G3', 'B3'],
  },
  factory: {
    tempo: 148,
    wave: 'sawtooth',
    melody: ['C5', 'Eb5', 'G5', 'Fs5', 'G5', 'Eb5', 'C5', 'B4', 'C5', 'D5', 'Eb5', 'G5', 'F5', 'D5', 'C5', 'R'],
    bass: ['C3', 'G3', 'C3', 'G3', 'Ab4', 'Eb4', 'G3', 'D3', 'C3', 'G3', 'F3', 'C3', 'G3', 'D3', 'C3', 'G3'],
  },
  water: {
    tempo: 108,
    wave: 'sine',
    melody: ['E5', 'G5', 'B5', 'G5', 'F5', 'A5', 'G5', 'R', 'D5', 'F5', 'A5', 'F5', 'E5', 'G5', 'C5', 'R'],
    bass: ['C3', 'G3', 'E3', 'G3', 'F3', 'C4', 'G3', 'B3', 'D3', 'A3', 'G3', 'B3', 'C3', 'G3', 'C3', 'R'],
  },
  sky: {
    tempo: 164,
    wave: 'triangle',
    melody: ['G4', 'C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'E5', 'G5', 'B5', 'A5', 'G5', 'E5', 'D5', 'C5'],
    bass: ['C3', 'E3', 'G3', 'C4', 'F3', 'A3', 'C4', 'F3', 'E3', 'G3', 'B3', 'E3', 'G3', 'B3', 'D3', 'G3'],
  },
  spooky: {
    tempo: 122,
    wave: 'triangle',
    melody: ['A4', 'C5', 'Eb5', 'D5', 'C5', 'Ab4', 'A4', 'R', 'E5', 'Eb5', 'D5', 'C5', 'B4', 'Ab4', 'A4', 'R'],
    bass: ['A3', 'R', 'E3', 'R', 'F3', 'R', 'E3', 'R', 'D3', 'R', 'C3', 'R', 'B3', 'E3', 'A3', 'R'],
  },
  snow: {
    tempo: 142,
    wave: 'sine',
    melody: ['G5', 'E5', 'F5', 'D5', 'E5', 'C5', 'D5', 'B4', 'C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'C5', 'R'],
    bass: ['C3', 'G3', 'D3', 'G3', 'C3', 'E3', 'G3', 'B3', 'C3', 'E3', 'F3', 'A3', 'G3', 'D3', 'C3', 'R'],
  },
  village: {
    tempo: 140,
    wave: 'triangle',
    melody: ['C5', 'F5', 'F5', 'G5', 'F5', 'E5', 'D5', 'D5', 'D5', 'G5', 'G5', 'A5', 'G5', 'F5', 'E5', 'C5'],
    bass: ['F3', 'C4', 'F3', 'C4', 'G3', 'D3', 'G3', 'D3', 'G3', 'D3', 'C3', 'G3', 'C3', 'E3', 'F3', 'C4'],
  },
  boss: {
    tempo: 172,
    wave: 'sawtooth',
    melody: ['D5', 'D5', 'F5', 'E5', 'D5', 'C5', 'Bb4', 'A4', 'D5', 'F5', 'A5', 'G5', 'F5', 'E5', 'D5', 'A4'],
    bass: ['D3', 'D3', 'A3', 'A3', 'Bb4', 'A4', 'G3', 'A3', 'D3', 'D3', 'F3', 'G3', 'A3', 'A3', 'D3', 'A3'],
  },
  victory: {
    tempo: 132,
    wave: 'triangle',
    melody: ['C5', 'E5', 'G5', 'C5', 'D5', 'F5', 'A5', 'G5', 'E5', 'G5', 'C5', 'D5', 'E5', 'G5', 'A5', 'C5'],
    bass: ['C3', 'G3', 'E3', 'G3', 'F3', 'C4', 'G3', 'B3', 'C3', 'G3', 'A3', 'E3', 'F3', 'G3', 'C3', 'G3'],
  },
};

class AudioSystem {
  private ctx: AudioContext | null = null;
  private musicVolume = 0.45;
  private sfxVolume = 0.7;
  private currentTrack: MusicTrack | null = null;
  private timerId: number | null = null;
  private step = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        this.ctx = new Ctx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
  }

  public playMusic(track: MusicTrack) {
    if (this.currentTrack === track && this.timerId !== null) return;
    this.stopMusic();
    this.currentTrack = track;
    this.step = 0;

    const spec = TRACKS[track];
    const stepMs = (60 / spec.tempo / 2) * 1000;

    this.timerId = window.setInterval(() => {
      if (this.musicVolume <= 0.01) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;

      const idx = this.step % spec.melody.length;
      const mFreq = N[spec.melody[idx]] || 0;
      const bFreq = N[spec.bass[idx % spec.bass.length]] || 0;

      const now = ctx.currentTime;
      const dur = stepMs / 1000 * 0.85;

      if (mFreq > 0) {
        this.playTone(ctx, mFreq, spec.wave, this.musicVolume * 0.11, now, dur);
      }
      if (bFreq > 0) {
        this.playTone(ctx, bFreq, 'sine', this.musicVolume * 0.09, now, dur * 1.1);
      }

      this.step++;
    }, stepMs);
  }

  public stopMusic() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentTrack = null;
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    type: OscillatorType,
    vol: number,
    startTime: number,
    duration: number,
    endFreq?: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), startTime + duration);
    }
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  public playSfx(name: SfxName) {
    if (this.sfxVolume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const v = this.sfxVolume * 0.22;

    switch (name) {
      case 'jump':
        this.playTone(ctx, 290, 'triangle', v, now, 0.14, 590);
        break;
      case 'double_jump':
        this.playTone(ctx, 440, 'triangle', v, now, 0.12, 880);
        this.playTone(ctx, 660, 'sine', v * 0.7, now + 0.05, 0.12, 1040);
        break;
      case 'bark':
        this.playTone(ctx, 420, 'sawtooth', v * 0.75, now, 0.07, 680);
        this.playTone(ctx, 620, 'square', v * 0.65, now + 0.05, 0.09, 280);
        break;
      case 'super_bark':
        this.playTone(ctx, 320, 'sawtooth', v * 1.1, now, 0.12, 720);
        this.playTone(ctx, 720, 'triangle', v * 1.0, now + 0.08, 0.25, 190);
        break;
      case 'belly_flop':
        this.playTone(ctx, 220, 'sine', v * 1.2, now, 0.22, 65);
        this.playTone(ctx, 130, 'triangle', v * 0.9, now + 0.04, 0.18, 55);
        break;
      case 'treat':
        this.playTone(ctx, 660, 'sine', v * 0.85, now, 0.08, 990);
        this.playTone(ctx, 990, 'triangle', v * 0.65, now + 0.06, 0.1, 1320);
        break;
      case 'paw':
        [523, 659, 784, 1046].forEach((f, i) => {
          this.playTone(ctx, f, 'triangle', v * 0.9, now + i * 0.06, 0.16);
        });
        break;
      case 'powerup':
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          this.playTone(ctx, f, 'triangle', v * 0.85, now + i * 0.055, 0.14);
        });
        break;
      case 'hurt':
        this.playTone(ctx, 260, 'sawtooth', v, now, 0.18, 95);
        this.playTone(ctx, 170, 'square', v * 0.7, now + 0.1, 0.16, 75);
        break;
      case 'enemy_defeat':
        this.playTone(ctx, 350, 'square', v * 0.8, now, 0.1, 620);
        this.playTone(ctx, 620, 'triangle', v * 0.8, now + 0.07, 0.12, 920);
        break;
      case 'checkpoint':
        [523, 659, 784].forEach((f, i) => {
          this.playTone(ctx, f, 'sine', v * 0.9, now + i * 0.08, 0.22);
        });
        break;
      case 'star':
      case 'win':
        [523, 659, 784, 1046, 1318].forEach((f, i) => {
          this.playTone(ctx, f, 'triangle', v * 1.0, now + i * 0.09, 0.28);
        });
        break;
      case 'shoot':
        this.playTone(ctx, 760, 'square', v * 0.6, now, 0.09, 280);
        break;
      case 'boost':
        this.playTone(ctx, 320, 'sawtooth', v * 0.7, now, 0.26, 980);
        break;
      case 'splash':
        this.playTone(ctx, 480, 'sine', v * 0.65, now, 0.14, 240);
        break;
      case 'gift':
        [587, 740, 880, 1175].forEach((f, i) => {
          this.playTone(ctx, f, 'sine', v * 0.9, now + i * 0.11, 0.35);
        });
        break;
      case 'click':
        this.playTone(ctx, 600, 'triangle', v * 0.5, now, 0.05, 780);
        break;
    }
  }
}

export const audioSystem = new AudioSystem();
