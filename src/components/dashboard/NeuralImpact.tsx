import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Scatter,
} from 'recharts';
import { Brain, Dna, Zap, Layers, ArrowRight, Info } from 'lucide-react';
import { simulateBDNFFromHistory, simulateBDNF } from '../../models/bdnf';
import { simulateDopamine } from '../../models/dopamine';
import { simulatePlasticity } from '../../models/plasticity';
import type { PracticeSession, InstrumentType } from '../../types';

// Map session type to estimated novelty (drives dopamine phasic response)
const NOVELTY_BY_TYPE: Record<string, number> = {
  new_piece:    0.85,
  improvisation: 0.80,
  performance:  0.70,
  technique:    0.45,
  memory_recall: 0.35,
};

interface Props {
  sessions: PracticeSession[];
}

const HistoryTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-primary/95 border border-emerald/20 rounded-lg p-3 text-xs font-mono shadow-lg">
      <div className="text-slate-400 mb-1.5">Day {label}</div>
      {payload.map((p: any, i: number) => (
        p.value != null && (
          <div key={i} className="flex items-center gap-2">
            <span style={{ color: p.color }}>●</span>
            <span className="text-slate-400">{p.name}:</span>
            <span style={{ color: p.color }}>{Number(p.value).toFixed(2)}</span>
          </div>
        )
      ))}
    </div>
  );
};

const ProjectionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-primary/95 border border-purple/20 rounded-lg p-3 text-xs font-mono shadow-lg">
      <div className="text-slate-400 mb-1.5">Week {Math.ceil((Number(label) + 1) / 7)}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-400">{p.name}:</span>
          <span style={{ color: p.color }}>{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export default function NeuralImpact({ sessions }: Props) {
  if (sessions.length === 0) return null;

  // Sort newest-first for display, oldest-first for BDNF computation
  const byDate = useMemo(() =>
    [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [sessions]
  );

  // ── BDNF from actual history ────────────────────────────────────────────────
  const { trajectory, currentBDNF, finalNPI, densityGain } = useMemo(() =>
    simulateBDNFFromHistory(byDate.map(s => ({
      date: s.date,
      durationMin: s.durationMin,
      complexity: s.complexity,
      instrument: s.instrument,
    }))),
    [byDate]
  );

  // ── Derived session averages ────────────────────────────────────────────────
  const avgDuration = useMemo(() =>
    Math.round(byDate.reduce((s, x) => s + x.durationMin, 0) / byDate.length),
    [byDate]
  );
  const avgComplexity = useMemo(() =>
    Math.round(byDate.reduce((s, x) => s + x.complexity, 0) / byDate.length),
    [byDate]
  );
  const primaryInstrument = byDate[byDate.length - 1].instrument as InstrumentType;

  // Weekly frequency from actual session dates
  const weeklyFreq = useMemo(() => {
    if (byDate.length < 2) return 1;
    const oldest = new Date(byDate[0].date);
    const newest = new Date(byDate[byDate.length - 1].date);
    const weeks = Math.max(1, (newest.getTime() - oldest.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.round((byDate.length / weeks) * 10) / 10;
  }, [byDate]);

  const roundedFreq = Math.max(1, Math.round(weeklyFreq));

  // ── 8-week forward projections from current BDNF level ─────────────────────
  const projectionCurrent = useMemo(() => simulateBDNF({
    sessionDurationMin: avgDuration,
    complexity: avgComplexity,
    frequencyPerWeek: roundedFreq,
    totalWeeks: 8,
    instrument: primaryInstrument,
    initialBDNF: currentBDNF,
  }), [avgDuration, avgComplexity, roundedFreq, primaryInstrument, currentBDNF]);

  const projectionPlus = useMemo(() => simulateBDNF({
    sessionDurationMin: avgDuration,
    complexity: avgComplexity,
    frequencyPerWeek: Math.min(7, roundedFreq + 1),
    totalWeeks: 8,
    instrument: primaryInstrument,
    initialBDNF: currentBDNF,
  }), [avgDuration, avgComplexity, roundedFreq, primaryInstrument, currentBDNF]);

  const projectionData = useMemo(() =>
    projectionCurrent.trajectory.map((p, i) => ({
      day: p.day,
      current: p.neuroplasticityIndex,
      plus: projectionPlus.trajectory[i]?.neuroplasticityIndex ?? p.neuroplasticityIndex,
    })),
    [projectionCurrent, projectionPlus]
  );

  // ── Dopamine from most recent session ───────────────────────────────────────
  const latestSession = byDate[byDate.length - 1];
  const dopamineResult = useMemo(() => simulateDopamine({
    bpm: 120,
    mode: 'major',
    sessionDurationMin: latestSession.durationMin,
    complexity: latestSession.complexity,
    novelty: NOVELTY_BY_TYPE[latestSession.sessionType] ?? 0.65,
    practiceFrequency: roundedFreq,
  }), [latestSession, roundedFreq]);

  // ── BDNF-coupled plasticity threshold ──────────────────────────────────────
  const plasticityResult = useMemo(() => simulatePlasticity({
    rhythmPattern: 'syncopated',
    stimulationAmplitude: Math.min(5, Math.max(1, avgComplexity)),
    sessionDurationMin: Math.min(60, avgDuration),
    practiceDays: Math.min(30, byDate.length * 2),
    restPeriodHours: 20,
    bdnfLevel: currentBDNF,
  }), [avgComplexity, avgDuration, byDate.length, currentBDNF]);

  // ── Derived display values ──────────────────────────────────────────────────
  const bdnfPct = ((currentBDNF - 100) / 100 * 100);
  const bdnfPctStr = bdnfPct >= 0 ? `+${bdnfPct.toFixed(1)}%` : `${bdnfPct.toFixed(1)}%`;
  const theta_m = plasticityResult.initialThreshold;
  const thetaShiftPct = Math.round(((0.40 - theta_m) / 0.40) * 100);
  const npiDelta = parseFloat((projectionPlus.finalNPI - projectionCurrent.finalNPI).toFixed(1));
  const npiDeltaPct = Math.round((npiDelta / Math.max(1, projectionCurrent.finalNPI)) * 100);

  // BDNF history chart data
  const historyData = trajectory.map(p => ({
    day: p.day,
    bdnf: p.bdnf,
    practiceMarker: p.hasPractice ? p.bdnf : null,
  }));

  const weeksSpan = byDate.length < 2 ? 1 :
    Math.ceil((new Date(byDate[byDate.length-1].date).getTime() - new Date(byDate[0].date).getTime())
      / (7 * 24 * 60 * 60 * 1000));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <span className="section-label">Neural Impact</span>
        <h2 className="font-display font-bold text-2xl text-slate-100 mb-1">
          Your Practice,{' '}
          <span className="gradient-text">Modeled</span>
        </h2>
        <p className="text-slate-500 text-sm">
          {byDate.length} session{byDate.length !== 1 ? 's' : ''} logged
          {weeksSpan > 1 ? ` across ${weeksSpan} week${weeksSpan !== 1 ? 's' : ''}` : ''} ·{' '}
          {primaryInstrument} · avg {avgDuration} min · {weeklyFreq.toFixed(1)}×/week ·{' '}
          <span className="text-slate-600">model estimates, not measured values</span>
        </p>
      </div>

      {/* 3 key stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sim-panel border-emerald/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Dna className="w-3.5 h-3.5 text-emerald" />
            <span className="text-xs text-slate-500">Estimated BDNF</span>
          </div>
          <div className="font-mono text-2xl font-bold text-emerald mb-0.5">
            {currentBDNF.toFixed(1)}
            <span className="text-sm font-normal text-slate-500 ml-1">a.u.</span>
          </div>
          <div className="text-xs text-emerald/70">
            {bdnfPctStr} from baseline
          </div>
        </div>

        <div className="sim-panel border-cyan/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-cyan" />
            <span className="text-xs text-slate-500">Reward Index</span>
          </div>
          <div className="font-mono text-2xl font-bold text-cyan mb-0.5">
            {dopamineResult.rewardIndex.toFixed(0)}
            <span className="text-sm font-normal text-slate-500 ml-1">/ 100</span>
          </div>
          <div className="text-xs text-slate-500">
            {latestSession.sessionType.replace('_', ' ')} · {latestSession.durationMin} min
          </div>
        </div>

        <div className="sim-panel border-purple/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3.5 h-3.5 text-purple-light" />
            <span className="text-xs text-slate-500">LTP Threshold θ_M</span>
          </div>
          <div className="font-mono text-2xl font-bold text-purple-light mb-0.5">
            {theta_m.toFixed(3)}
          </div>
          <div className="text-xs text-purple-light/70">
            {thetaShiftPct > 0
              ? `↓${thetaShiftPct}%, wider plasticity window`
              : 'at baseline (no BDNF elevation)'}
          </div>
        </div>
      </div>

      {/* BDNF History Chart */}
      <div className="sim-panel">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">BDNF Trajectory from Your Practice History</h4>
            <p className="text-xs text-slate-500">
              Estimated serum BDNF built from your {byDate.length} logged sessions ·{' '}
              gold dots mark practice days
            </p>
          </div>
          <span className="tag tag-emerald flex items-center gap-1">
            <Dna className="w-3 h-3" /> Live from your data
          </span>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={historyData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="bdnfHistGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              label={{ value: 'Day', position: 'insideBottomRight', fill: '#475569', fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              domain={[90, 'auto']}
              label={{ value: 'BDNF (a.u.)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, dx: 14 }}
            />
            <Tooltip content={<HistoryTooltip />} />
            <ReferenceLine
              y={100}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 4"
              label={{ value: 'baseline', position: 'right', fill: '#475569', fontSize: 9 }}
            />
            <Area
              dataKey="bdnf"
              fill="url(#bdnfHistGrad)"
              stroke="#10B981"
              strokeWidth={2}
              name="BDNF"
              type="monotone"
              dot={false}
            />
            <Scatter dataKey="practiceMarker" fill="#F59E0B" name="Session" opacity={0.9} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 8-Week Forward Projection */}
      <div className="sim-panel">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              8-Week Projection
            </h4>
            <p className="text-xs text-slate-500">
              Neuroplasticity Index: current pace vs. one more session per week
            </p>
          </div>
          <span className="tag tag-purple flex items-center gap-1">
            <Brain className="w-3 h-3" /> What-If
          </span>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={projectionData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="projCurrentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="projPlusGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              tickFormatter={d => `W${Math.ceil((d + 1) / 7)}`}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              domain={[0, 100]}
              label={{ value: 'NPI', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, dx: 14 }}
            />
            <Tooltip content={<ProjectionTooltip />} />
            <Area
              dataKey="current"
              fill="url(#projCurrentGrad)"
              stroke="#8B5CF6"
              strokeWidth={2}
              name={`Current (${roundedFreq}×/wk)`}
              type="monotone"
              dot={false}
            />
            <Area
              dataKey="plus"
              fill="url(#projPlusGrad)"
              stroke="#00D4FF"
              strokeWidth={2}
              strokeDasharray="6 3"
              name={`+1 session (${Math.min(7, roundedFreq + 1)}×/wk)`}
              type="monotone"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {npiDelta > 0 && (
          <div className="mt-3 flex items-start gap-2.5 bg-cyan/[0.05] border border-cyan/15 rounded-lg px-3.5 py-2.5">
            <Zap className="w-3.5 h-3.5 text-cyan mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Adding one session per week would raise your NPI from{' '}
              <span className="text-purple-light font-mono">{projectionCurrent.finalNPI.toFixed(1)}</span> to{' '}
              <span className="text-cyan font-mono">{projectionPlus.finalNPI.toFixed(1)}</span> at week 8,
              a <span className="text-cyan font-semibold">+{npiDeltaPct}% gain</span> in neuroplasticity index
              with the same session format.
            </p>
          </div>
        )}
      </div>

      {/* BDNF → Plasticity Connection */}
      <div className="rounded-xl border border-purple/20 bg-purple/[0.04] p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Layers className="w-4 h-4 text-purple-light" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">
              How BDNF Is Changing Your Plasticity Right Now
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              {bdnfPct > 5 ? (
                <>
                  Your estimated BDNF is{' '}
                  <span className="text-emerald font-mono">{bdnfPctStr} above baseline</span>.
                  At this level, BDNF upregulates TrkB receptors on your synapses, which enhances
                  NMDA receptor conductance and lowers the Ca²⁺ threshold required to trigger LTP.
                  In BCM terms, this shifts your modification threshold θ_M from{' '}
                  <span className="font-mono text-slate-300">0.40</span> down to{' '}
                  <span className="font-mono text-purple-light">{theta_m.toFixed(3)}</span>,
                  a <span className="text-purple-light font-semibold">{thetaShiftPct}% reduction</span>.
                  Your synapses are more receptive to long-term change right now than when you started.
                </>
              ) : (
                <>
                  With only a few sessions logged, your estimated BDNF is near baseline ({currentBDNF.toFixed(1)} a.u.).
                  As you build consistency, BDNF elevation will lower your BCM modification threshold θ_M,
                  making LTP progressively easier to achieve. This is the compounding return of
                  consistent practice: the biology gets more receptive over time.
                </>
              )}
            </p>
            <Link
              to="/lab"
              className="inline-flex items-center gap-1.5 text-xs text-purple-light hover:text-purple font-medium transition-colors"
            >
              Explore in the Plasticity Simulator
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-1">
        <Info className="w-3 h-3 text-slate-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed">
          Neural Impact outputs are model predictions derived from your logged session parameters
          (instrument, duration, complexity). They are not measured biological values.
          BDNF = 100 is an arbitrary baseline. Dopamine estimates assume a default tempo of 120 BPM
          and major mode; reward index reflects session type–adjusted novelty. Plasticity threshold
          coupling is inspired by Figurov et al. (1996) and Bramham &amp; Messaoudi (2005).
        </p>
      </div>
    </motion.div>
  );
}
