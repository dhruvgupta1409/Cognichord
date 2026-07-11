export class MidiSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private live: OscillatorNode[] = [];
  private _muted = false;
  private _vol = 0.5;

  private ensure(): boolean {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.comp = this.ctx.createDynamicsCompressor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : this._vol;
      this.master.connect(this.comp);
      this.comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  unlock() { this.ensure(); }

  private freq(pitch: number) { return 440 * Math.pow(2, (pitch - 69) / 12); }

  noteOn(pitch: number, velocity: number, duration: number) {
    if (!this.ensure() || !this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, out = this.master!;
    const t0 = ctx.currentTime + 0.004;
    const dur = Math.max(0.08, Math.min(duration, 3.0));
    const peak = (velocity / 127) * 0.22;
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 2200 + velocity * 12;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.55), t0 + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.16);
    const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = this.freq(pitch);
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = this.freq(pitch); o2.detune.value = 6;
    o1.connect(gain); o2.connect(gain); gain.connect(filt); filt.connect(out);
    o1.start(t0); o2.start(t0); o1.stop(t0 + dur + 0.22); o2.stop(t0 + dur + 0.22);
    this.live.push(o1, o2);
    if (this.live.length > 200) this.live.splice(0, this.live.length - 200);
    o1.onended = () => { const i = this.live.indexOf(o1); if (i >= 0) this.live.splice(i, 1); };
  }

  allNotesOff() { const now = this.ctx?.currentTime ?? 0; for (const o of this.live) { try { o.stop(now); } catch { } } this.live = []; }

  get running() { return this.ctx?.state === 'running'; }
  setMuted(m: boolean) { this._muted = m; if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this._vol, this.ctx.currentTime, 0.02); }
  get muted() { return this._muted; }
  dispose() { this.allNotesOff(); this.ctx?.close(); this.ctx = null; }
}
