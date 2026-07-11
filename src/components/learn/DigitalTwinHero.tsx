import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowRight, Cpu } from 'lucide-react';
import BrainStage from '../brain/BrainStage';
import {
  simulate, engagementRegionArray, myelinGroupArray,
  type Schedule, type DayState, type SystemId,
} from '../../lib/learningModel';

const SYSTEM_SHORT: Record<SystemId, string> = {
  motor: 'Motor cortex', auditory: 'Auditory', somatosensory: 'Somatosensory', thalamus: 'Thalamus',
  cerebellum: 'Cerebellum', basalGanglia: 'Basal ganglia', prefrontal: 'Prefrontal', hippocampus: 'Hippocampus',
  visual: 'Visual', limbic: 'Limbic',
};

function stageOf(a: number) {
  if (a < 0.34) return 'Cognitive';
  if (a < 0.72) return 'Associative';
  return 'Autonomous';
}

export default function DigitalTwinHero({ onLaunch, paused = false }: { onLaunch: () => void; paused?: boolean }) {
  const schedule: Schedule = useMemo(() => ({ minutesPerDay: 25, daysPerWeek: 6, weeks: 12, focus: 'balanced' }), []);
  const sim = useMemo(() => simulate(schedule), [schedule]);
  const [di, setDi] = useState(0);

  const raf = useRef<number>();
  const acc = useRef(0);
  const dir = useRef(1);
  const last = useRef(0);
  useEffect(() => {
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000; last.current = now;
      acc.current += dt * 6;
      if (acc.current >= 1) {
        const step = Math.floor(acc.current); acc.current -= step;
        setDi(p => {
          let n = p + step * dir.current;
          if (n >= sim.length - 1) { n = sim.length - 1; dir.current = -1; }
          else if (n <= 0) { n = 0; dir.current = 1; }
          return n;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [sim.length]);

  const day: DayState = sim[Math.min(di, sim.length - 1)];
  const engagement = useMemo(() => engagementRegionArray(day.engagement), [day]);
  const myelin = useMemo(() => myelinGroupArray(day.myelin), [day]);
  const activity = 0.12 + 0.4 * day.retention + (day.practiced ? 0.2 : 0);
  const locus = (Object.entries(day.engagement) as [SystemId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#04060e] ring-1 ring-white/[0.04] shadow-[0_24px_70px_-24px_rgba(0,212,255,0.35)]">
      <div className="relative aspect-[3/2] sm:aspect-[21/9]">
        <BrainStage onOpen={() => {}} activity={activity} engagement={engagement} myelin={myelin} bloom={0.32} paused={paused} className="absolute inset-0" />

        <div className="absolute top-4 left-4 max-w-[260px] pointer-events-none">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cyan mb-2 px-2 py-1 rounded-md bg-cyan/10 border border-cyan/25">
            <Cpu className="w-3 h-3" /> Live model · week {day.week + 1}
          </div>
          <div className="font-display font-bold text-2xl text-slate-100">{stageOf(day.automaticity)} stage</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {locus.map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded border border-white/12 bg-black/40 text-slate-300">{SYSTEM_SHORT[s]}</span>)}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex gap-4 max-sm:bottom-[4.25rem] max-sm:gap-2">
          <Chip label="Playable" value={day.skill} color="#34D399" />
          <Chip label="Retained" value={day.retention} color="#00D4FF" />
          <Chip label="Automatic" value={day.automaticity} color="#C4B5FD" />
        </div>

        <div className="absolute bottom-4 right-4 max-sm:left-4 max-sm:right-4">
          <button onClick={onLaunch} className="btn-primary inline-flex items-center gap-2 !py-2 max-sm:w-full max-sm:justify-center">
            Open the full simulation <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-black/45 border border-white/10 px-3 py-1.5 backdrop-blur-sm">
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums" style={{ color }}>{Math.round(value * 100)}<span className="text-slate-600 text-[10px]">%</span></div>
    </div>
  );
}
