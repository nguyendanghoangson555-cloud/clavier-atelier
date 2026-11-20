import type { PianoVoice } from '../types/piano';
import { midiToFrequency } from './musicTheory';

interface ActiveVoice {
  midi: number;
  stopGain: GainNode;
  oscillators: OscillatorNode[];
  released: boolean;
  timerId?: number;
}

class PianoAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private activeVoices = new Map<string, ActiveVoice>();
  private sustainedIds = new Set<string>();
  private sustainPedal = false;
  private volume = 0.78;
  private voice: PianoVoice = 'grand';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;

        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.value = 0.82;

        this.wetGain = this.ctx.createGain();
        this.wetGain.gain.value = 0.24;

        // Subtle warm compressor to prevent clipping on dense chords
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.004;
        compressor.release.value = 0.22;

        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = this.createHallImpulse(this.ctx, 1.85, 2.8);

        this.dryGain.connect(compressor);
        this.wetGain.connect(this.convolver);
        this.convolver.connect(compressor);
        compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createHallImpulse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
    }
    return buffer;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public setVoice(voice: PianoVoice) {
    this.voice = voice;
  }

  public setSustain(active: boolean) {
    this.sustainPedal = active;
    if (!active && this.ctx) {
      const toRelease = [...this.sustainedIds];
      this.sustainedIds.clear();
      for (const id of toRelease) {
        this.dampVoice(id, 0.16);
      }
    }
  }

  public noteOn(keyId: string, midi: number, velocity = 0.78) {
    const ctx = this.ensureContext();
    if (!ctx || !this.dryGain || !this.wetGain) return;

    // Retrigger cleanly if same keyId already ringing
    if (this.activeVoices.has(keyId)) {
      this.dampVoice(keyId, 0.03);
    }
    this.sustainedIds.delete(keyId);

    const now = ctx.currentTime;
    const freq = midiToFrequency(midi);
    const vel = Math.max(0.15, Math.min(1, velocity));

    // Register-based decay: low bass strings ring longer than high treble strings
    const registerNorm = Math.max(0, Math.min(1, (midi - 21) / 87));
    const decaySec =
      this.voice === 'harpsichord'
        ? 1.6 - registerNorm * 0.8
        : this.voice === 'electric'
          ? 2.8 - registerNorm * 1.1
          : 4.5 - registerNorm * 2.6;

    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner();
    panner.pan.value = (registerNorm - 0.5) * 0.72;

    filter.type = 'lowpass';
    const baseCutoff =
      this.voice === 'upright'
        ? 1800
        : this.voice === 'harpsichord'
          ? 5200
          : this.voice === 'electric'
            ? 2400
            : 3200;
    const peakCutoff = Math.min(14000, baseCutoff + vel * 4800 + (1 - registerNorm) * 600);
    filter.frequency.setValueAtTime(peakCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(350, freq * (this.voice === 'harpsichord' ? 4.2 : 2.1)),
      now + 0.32
    );
    filter.Q.value = this.voice === 'electric' ? 1.8 : 0.85;

    const peakAmp = vel * (this.voice === 'electric' ? 0.24 : 0.28);
    const attack = this.voice === 'upright' ? 0.008 : 0.004;
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakAmp, now + attack);
    noteGain.gain.exponentialRampToValueAtTime(peakAmp * 0.42, now + 0.16);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, now + decaySec);

    const oscillators: OscillatorNode[] = [];

    const addPartial = (ratio: number, type: OscillatorType, level: number, detuneCents = 0) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * ratio, now);
      if (detuneCents !== 0) {
        osc.detune.setValueAtTime(detuneCents, now);
      }
      g.gain.value = level;
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      oscillators.push(osc);
    };

    if (this.voice === 'grand') {
      addPartial(1, 'triangle', 0.72, -1.5);
      addPartial(1, 'sine', 0.55, 1.5);
      addPartial(2, 'sine', 0.28 * vel);
      addPartial(3, 'triangle', 0.12 * vel);
      addPartial(4, 'sine', 0.05 * vel);
    } else if (this.voice === 'upright') {
      addPartial(1, 'triangle', 0.78, -3.5);
      addPartial(1, 'sine', 0.52, 3.5);
      addPartial(2, 'sine', 0.22);
      addPartial(3, 'sine', 0.07);
    } else if (this.voice === 'electric') {
      addPartial(1, 'sine', 0.85);
      addPartial(2, 'sine', 0.18 * vel, 2);
      addPartial(4, 'sine', 0.09 * vel);
    } else {
      // harpsichord
      addPartial(1, 'sawtooth', 0.42);
      addPartial(2, 'triangle', 0.32);
      addPartial(3, 'sine', 0.18);
    }

    filter.connect(noteGain);
    noteGain.connect(panner);
    panner.connect(this.dryGain);
    panner.connect(this.wetGain);

    const timerId = window.setTimeout(() => {
      this.cleanupVoice(keyId);
    }, (decaySec + 0.25) * 1000);

    this.activeVoices.set(keyId, {
      midi,
      stopGain: noteGain,
      oscillators,
      released: false,
      timerId,
    });
  }

  public noteOff(keyId: string) {
    const voice = this.activeVoices.get(keyId);
    if (!voice) return;
    if (this.sustainPedal) {
      voice.released = true;
      this.sustainedIds.add(keyId);
      return;
    }
    this.dampVoice(keyId, this.voice === 'electric' ? 0.22 : 0.16);
  }

  private dampVoice(keyId: string, releaseSec: number) {
    const voice = this.activeVoices.get(keyId);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    try {
      voice.stopGain.gain.cancelScheduledValues(now);
      voice.stopGain.gain.setValueAtTime(Math.max(0.0001, voice.stopGain.gain.value), now);
      voice.stopGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseSec);
    } catch {
      // Ignore scheduling errors on ended nodes
    }

    if (voice.timerId) {
      window.clearTimeout(voice.timerId);
    }

    const activeRef = voice;
    this.activeVoices.delete(keyId);
    this.sustainedIds.delete(keyId);

    window.setTimeout(() => {
      for (const osc of activeRef.oscillators) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // already stopped
        }
      }
      try {
        activeRef.stopGain.disconnect();
      } catch {
        // ignore
      }
    }, releaseSec * 1000 + 30);
  }

  private cleanupVoice(keyId: string) {
    const voice = this.activeVoices.get(keyId);
    if (!voice) return;
    for (const osc of voice.oscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeVoices.delete(keyId);
    this.sustainedIds.delete(keyId);
  }

  public stopAll() {
    this.sustainedIds.clear();
    const ids = [...this.activeVoices.keys()];
    for (const id of ids) {
      this.dampVoice(id, 0.06);
    }
  }

  public playMetronomeTick(accent: boolean) {
    const ctx = this.ensureContext();
    if (!ctx || !this.dryGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(accent ? 1240 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
    g.gain.setValueAtTime(accent ? 0.16 : 0.09, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    osc.connect(g);
    g.connect(this.dryGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const pianoAudio = new PianoAudioEngine();
