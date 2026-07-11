import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { PracticeSession } from '../../types';
import { seedFromString, type SimParams } from '../../lib/simApi';
import BiophysicalSimulation from './BiophysicalSimulation';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

function simParamsFor(session: PracticeSession): SimParams {
  const repetitions = clamp(Math.round(session.durationMin / 2), 6, 48);
  const difficulty = clamp((session.complexity - 1) / 4, 0, 1);
  const focus = session.sessionFocus != null ? clamp((session.sessionFocus - 1) / 4, 0, 1) : 0.6;
  return { repetitions, difficulty, focus, seed: seedFromString(session.id) };
}

export default function SessionAnalysis({ session }: { session: PracticeSession }) {
  const params = useMemo(() => simParamsFor(session), [session]);
  const label = `${params.repetitions} rehearsals · difficulty ${Math.round(params.difficulty * 100)}% · gain ${Math.round(params.focus * 100)}%`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-cyan" />
        <h2 className="font-display font-bold text-xl text-slate-100">Session simulation</h2>
        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border text-emerald border-emerald/25 bg-emerald/[0.08]">Brian2 · real</span>
      </div>
      <p className="text-xs text-slate-500 mb-4 max-w-2xl">
        Your {session.durationMin}-minute {session.sessionType.replace('_', ' ')} session, run through a conductance-based spiking-network simulation. Every curve below is simulation output from the Brian2 library. It is a demonstration of the standard mechanism with parameters from the literature, not a measurement of your brain.
      </p>
      <BiophysicalSimulation params={params} sessionLabel={label} />
    </div>
  );
}
