const MASTER_VOLUME = 0.6;
const AMBIENT_VOLUME = 0.3;

interface AudioContextConstructor {
  new (): AudioContext;
}

function resolveAudioContextConstructor(): AudioContextConstructor | null {
  const withWebkit = window as unknown as { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? withWebkit.webkitAudioContext ?? null;
}

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private fireBuffer: AudioBuffer | null = null;
  private muted = false;

  /** Lazily creates the AudioContext. Returns null if WebAudio isn't supported. */
  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;

    const Ctor = resolveAudioContextConstructor();
    if (!Ctor) return null;

    this.context = new Ctor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.muted ? 0 : MASTER_VOLUME;
    this.masterGain.connect(this.context.destination);

    this.ambientGain = this.context.createGain();
    this.ambientGain.gain.value = AMBIENT_VOLUME;
    this.ambientGain.connect(this.masterGain);

    this.fireBuffer = this.buildFireNoiseBuffer(this.context);

    return this.context;
  }

  /** Call on the first user gesture to satisfy mobile/desktop autoplay policies. */
  public unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Ignore — will retry on the next gesture.
      });
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.context && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, this.context.currentTime, 0.05);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private buildFireNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 2.5;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let smoothed = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      smoothed = (smoothed + 0.02 * white) / 1.02;
      data[i] = smoothed * 3.2;
    }
    return buffer;
  }

  public startCampAmbience(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain || !this.fireBuffer) return;
    this.stopCampAmbience();

    const source = ctx.createBufferSource();
    source.buffer = this.fireBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 650;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(this.ambientGain);
    source.start();
    this.ambientSource = source;
  }

  public stopCampAmbience(): void {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch {
        // Already stopped.
      }
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }
  }

  public playHover(): void {
    this.playTone(880, 0.04, 'sine', 0.05);
  }

  public playSelect(): void {
    this.playTone(520, 0.08, 'triangle', 0.16);
  }

  public playWhoosh(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.55);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }
}
