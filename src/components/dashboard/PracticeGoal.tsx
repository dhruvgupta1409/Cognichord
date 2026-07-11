import { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import type { PracticeSession } from '../../types';

export default function PracticeGoal({ sessions }: { sessions: PracticeSession[] }) {
  const [goal, setGoal] = useState<number>(() => {
    const v = typeof window !== 'undefined' ? Number(window.localStorage.getItem('cc_weekly_goal')) : 0;
    return v && v > 0 ? v : 150;
  });
  const setGoalPersist = (g: number) => { setGoal(g); try { window.localStorage.setItem('cc_weekly_goal', String(g)); } catch { } };

  const { minutes, days } = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    const recent = sessions.filter(s => new Date(s.date).getTime() >= weekAgo);
    const mins = recent.reduce((a, s) => a + s.durationMin, 0);
    const uniqueDays = new Set(recent.map(s => new Date(s.date).toISOString().slice(0, 10))).size;
    return { minutes: mins, days: uniqueDays };
  }, [sessions]);

  const pct = Math.min(1, goal > 0 ? minutes / goal : 0);
  const met = minutes >= goal;

  return (
    <div className="sim-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald" />
          <h3 className="text-sm font-semibold text-slate-200">Weekly goal</h3>
        </div>
        <span className="text-[10px] text-slate-500">last 7 days</span>
      </div>

      <div className="flex items-end justify-between mb-1.5">
        <span className="font-mono text-3xl font-bold text-slate-100 tabular-nums">{minutes}<span className="text-base text-slate-500"> / {goal} min</span></span>
        <span className={`text-xs font-medium ${met ? 'text-emerald' : 'text-slate-400'}`}>{met ? 'Goal met 🎉' : `${Math.round(pct * 100)}%`}</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct * 100}%`, background: met ? '#10B981' : 'linear-gradient(90deg,#00D4FF,#10B981)', boxShadow: met ? '0 0 10px #10B981' : 'none' }} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <span>Practiced <span className="text-slate-300 font-medium">{days}</span> {days === 1 ? 'day' : 'days'} this week</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">Target</span>
        <input type="range" min={30} max={600} step={15} value={goal} onChange={e => setGoalPersist(Number(e.target.value))} className="flex-1 accent-emerald cursor-pointer" />
        <span className="text-xs font-mono text-slate-400 w-16 text-right">{goal} min</span>
      </div>
    </div>
  );
}
