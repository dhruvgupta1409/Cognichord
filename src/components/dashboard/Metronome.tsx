import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Minus, Plus } from 'lucide-react';

export default function Metronome() {
  const [bpm, setBpm] = useState(90);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const nextTime = useRef(0);
  const beatInBar = useRef(0);
  const timer = useRef<number>();
  const tapTimes = useRef<number[]>([]);
  const bpmRef = useRef(bpm); bpmRef.current = bpm;
  const beatsRef = useRef(beats); beatsRef.current = beats;

  const click = (time: number, accent: boolean) => {
    const ctx = ctxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 900;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.32, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(time); osc.stop(time + 0.06);
  };

  useEffect(() => {
    if (!running) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = ctxRef.current ?? (ctxRef.current = new AC());
    if (ctx.state === 'suspended') ctx.resume();
    nextTime.current = ctx.currentTime + 0.1;
    beatInBar.current = 0;
    const schedule = () => {
      while (nextTime.current < ctx.currentTime + 0.12) {
        const b = beatInBar.current;
        click(nextTime.current, b === 0);
        const when = nextTime.current;
        const bb = b;
        const delay = Math.max(0, (when - ctx.currentTime) * 1000);
        window.setTimeout(() => setBeat(bb), delay);
        nextTime.current += 60 / bpmRef.current;
        beatInBar.current = (b + 1) % beatsRef.current;
      }
      timer.current = window.setTimeout(schedule, 25);
    };
    schedule();
    return () => { if (timer.current) clearTimeout(timer.current); setBeat(-1); };
  }, [running]);

  const tap = () => {
    const now = performance.now();
    tapTimes.current = tapTimes.current.filter(t => now - t < 2000);
    tapTimes.current.push(now);
    if (tapTimes.current.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < tapTimes.current.length; i++) gaps.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.max(40, Math.min(240, Math.round(60000 / avg))));
    }
  };

  return (
    <div className="sim-panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Metronome</h3>
        <span className="text-[10px] text-slate-500">tap tempo & count-in</span>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => setBpm(b => Math.max(40, b - 1))} className="w-8 h-8 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
        <div className="text-center">
          <div className="font-mono text-4xl font-bold text-slate-100 tabular-nums">{bpm}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">BPM</div>
        </div>
        <button onClick={() => setBpm(b => Math.min(240, b + 1))} className="w-8 h-8 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
      </div>

      <input type="range" min={40} max={240} value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full accent-cyan cursor-pointer mb-4" />

      <div className="flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: beats }).map((_, i) => (
          <span key={i} className="w-3 h-3 rounded-full transition-all" style={{ background: beat === i ? (i === 0 ? '#00D4FF' : '#10B981') : 'rgba(255,255,255,0.12)', boxShadow: beat === i ? `0 0 10px ${i === 0 ? '#00D4FF' : '#10B981'}` : 'none', transform: beat === i ? 'scale(1.25)' : 'scale(1)' }} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setRunning(r => !r)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${running ? 'bg-pink/15 border border-pink/30 text-pink' : 'bg-cyan/15 border border-cyan/30 text-cyan hover:bg-cyan/25'}`}>
          {running ? <><Pause className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4 ml-0.5" /> Start</>}
        </button>
        <button onClick={tap} className="px-4 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium">Tap</button>
        <select value={beats} onChange={e => setBeats(Number(e.target.value))} className="bg-white/[0.04] border border-white/10 rounded-lg text-xs text-slate-200 px-2 py-2.5 outline-none">
          {[2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n} className="bg-[#0b1020]">{n}/4</option>)}
        </select>
      </div>
    </div>
  );
}
