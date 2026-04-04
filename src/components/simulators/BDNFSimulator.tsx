import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart, Scatter,
} from 'recharts';
import { motion } from 'framer-motion';
import { Info, Dna, TrendingUp, Calendar, Layers, GitCompare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { simulateBDNF } from '../../models/bdnf';
import InstrumentPicker from '../ui/InstrumentPicker';
import type { BDNFParams } from '../../types';

const WEEK_OPTIONS = [4, 8, 12, 24];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-primary/95 border border-emerald/20 rounded-lg p-3 text-xs font-mono shadow-glow-emerald">
      <div className="text-slate-400 mb-1.5">Day {label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-400">{p.name}:</span>
          <span style={{ color: p.color }}>{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default function BDNFSimulator() {
  const [params, setParams] = useState<BDNFParams>({
    sessionDurationMin: 45,
    complexity: 3,
    frequencyPerWeek: 4,
    totalWeeks: 8,
    instrument: 'piano',
  });

  const [comparing, setComparing] = useState(false);
  const [compareFreq, setCompareFreq] = useState(6);
  const [compareDuration, setCompareDuration] = useState(60);

  const result = useMemo(() => simulateBDNF(params), [params]);

  const compareResult = useMemo(() => comparing ? simulateBDNF({
    ...params,
    frequencyPerWeek: compareFreq,
    sessionDurationMin: compareDuration,
  }) : null, [comparing, params, compareFreq, compareDuration]);

  const set = (key: keyof BDNFParams, val: number | string) =>
    setParams(prev => ({ ...prev, [key]: val }));

  const chartData = useMemo(() =>
    result.trajectory.map((p, i) => ({
      ...p,
      practiceMarker: p.hasPractice ? p.bdnf : null,
      npiLine: p.neuroplasticityIndex,
      npiCompare: compareResult?.trajectory[i]?.neuroplasticityIndex ?? null,
      densityLine: p.synapticDensity * 100,
    })),
    [result, compareResult]
  );

  const metrics = [
    { label: 'Final NPI (Model Est.)', value: result.finalNPI.toFixed(1),  unit: '/ 100',   color: '#10B981', icon: TrendingUp },
    { label: 'Peak BDNF',       value: result.peakBDNF.toFixed(1),  unit: 'a.u.',    color: '#00D4FF', icon: Dna       },
    { label: 'Avg BDNF',        value: result.averageBDNF.toFixed(1),unit: 'a.u.',   color: '#8B5CF6', icon: Layers    },
    { label: 'Density Gain',    value: `+${result.densityGain.toFixed(1)}`, unit: '%', color: '#F59E0B', icon: Calendar },
  ];

  const npiGain = compareResult
    ? parseFloat((compareResult.finalNPI - result.finalNPI).toFixed(1))
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="sim-panel space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-slate-200 text-sm mb-1">BDNF Modeler</h3>
              <p className="text-xs text-slate-500">Neuroplasticity over practice weeks</p>
            </div>
            <button
              onClick={() => setComparing(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                comparing
                  ? 'bg-cyan/10 border-cyan/30 text-cyan'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:text-slate-300'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Session Duration</label>
              <span className="control-value">{params.sessionDurationMin} min</span>
            </div>
            <input
              type="range" min={15} max={120} value={params.sessionDurationMin}
              onChange={e => set('sessionDurationMin', +e.target.value)}
              className="slider-custom emerald"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Piece Complexity</label>
              <span className="control-value">{params.complexity}/5</span>
            </div>
            <input
              type="range" min={1} max={5} step={1} value={params.complexity}
              onChange={e => set('complexity', +e.target.value)}
              className="slider-custom emerald"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Beginner</span><span>Virtuoso</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">
                Sessions / Week
                {comparing && <span className="ml-1 text-emerald/70">(Scenario A)</span>}
              </label>
              <span className="control-value">{params.frequencyPerWeek}×</span>
            </div>
            <input
              type="range" min={1} max={7} step={1} value={params.frequencyPerWeek}
              onChange={e => set('frequencyPerWeek', +e.target.value)}
              className="slider-custom emerald"
            />
          </div>

          <div>
            <label className="control-label block mb-2">Study Duration</label>
            <div className="grid grid-cols-4 gap-1.5">
              {WEEK_OPTIONS.map(w => (
                <button
                  key={w}
                  onClick={() => set('totalWeeks', w)}
                  className={`py-1.5 rounded-md text-xs font-medium transition-all ${
                    params.totalWeeks === w
                      ? 'bg-emerald/20 text-emerald border border-emerald/30'
                      : 'bg-white/4 text-slate-500 border border-white/[0.06] hover:text-slate-300'
                  }`}
                >
                  {w}w
                </button>
              ))}
            </div>
          </div>

          <InstrumentPicker
            value={params.instrument}
            onChange={v => set('instrument', v)}
            accentColor="#10B981"
          />

          {/* Scenario B controls */}
          {comparing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-cyan/15 space-y-4"
            >
              <p className="text-xs text-cyan font-semibold">Scenario B with same instrument &amp; complexity</p>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="control-label">Sessions / Week <span className="text-cyan/70">(B)</span></label>
                  <span className="control-value text-cyan">{compareFreq}×</span>
                </div>
                <input
                  type="range" min={1} max={7} step={1} value={compareFreq}
                  onChange={e => setCompareFreq(+e.target.value)}
                  className="slider-custom emerald"
                  style={{ accentColor: '#00D4FF' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="control-label">Duration <span className="text-cyan/70">(B)</span></label>
                  <span className="control-value text-cyan">{compareDuration} min</span>
                </div>
                <input
                  type="range" min={15} max={120} value={compareDuration}
                  onChange={e => setCompareDuration(+e.target.value)}
                  className="slider-custom emerald"
                  style={{ accentColor: '#00D4FF' }}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Main chart panel */}
        <div className="lg:col-span-2 sim-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">BDNF Trajectory</h4>
              <p className="text-xs text-slate-500">
                Serum BDNF over {params.totalWeeks} weeks · {params.instrument}
              </p>
            </div>
            <span className="tag tag-emerald flex items-center gap-1">
              <Dna className="w-3 h-3" /> Neuroplasticity
            </span>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="bdnfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
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
                domain={[80, 'auto']}
                label={{ value: 'BDNF (a.u.)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, dx: 14 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={100} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4"
                label={{ value: 'baseline', position: 'right', fill: '#475569', fontSize: 9 }} />
              <Area dataKey="bdnf" fill="url(#bdnfGrad)" stroke="#10B981"
                strokeWidth={2} name="BDNF (A)" type="monotone" />
              <Scatter dataKey="practiceMarker" fill="#F59E0B" name="Session" opacity={0.9} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3 h-3" style={{ color: m.color }} />
                    <span className="text-xs text-slate-500">{m.label}</span>
                  </div>
                  <div className="font-mono text-base font-semibold" style={{ color: m.color }}>
                    {m.value}
                  </div>
                  <div className="text-xs text-slate-600">{m.unit}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* NPI Comparison chart, only visible in compare mode */}
      {comparing && compareResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sim-panel border-cyan/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Neuroplasticity Index, Schedule Comparison</h4>
              <p className="text-xs text-slate-500">
                A: {params.frequencyPerWeek}×/week · {params.sessionDurationMin} min &nbsp;|&nbsp;
                B: {compareFreq}×/week · {compareDuration} min
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="npiAGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="npiBGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 10 }} />
              <Area dataKey="npiLine"    fill="url(#npiAGrad)" stroke="#10B981" strokeWidth={2} name={`A (${params.frequencyPerWeek}×)`} type="monotone" dot={false} />
              <Area dataKey="npiCompare" fill="url(#npiBGrad)" stroke="#00D4FF" strokeWidth={2} strokeDasharray="6 3" name={`B (${compareFreq}×)`} type="monotone" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <div className={`mt-3 flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 border ${
            npiGain > 0 ? 'bg-cyan/[0.05] border-cyan/15' : npiGain < 0 ? 'bg-pink/[0.05] border-pink/15' : 'bg-white/[0.03] border-white/[0.06]'
          }`}>
            <span className={`font-mono text-sm font-bold ${npiGain > 0 ? 'text-cyan' : npiGain < 0 ? 'text-pink' : 'text-slate-400'}`}>
              {npiGain > 0 ? '+' : ''}{npiGain.toFixed(1)} NPI
            </span>
            <span className="text-xs text-slate-400">
              {npiGain > 0
                ? `Schedule B reaches NPI ${compareResult.finalNPI.toFixed(1)} vs. ${result.finalNPI.toFixed(1)}, ${Math.round((npiGain / result.finalNPI) * 100)}% higher at week ${params.totalWeeks}`
                : npiGain < 0
                ? `Schedule A is more effective, NPI ${result.finalNPI.toFixed(1)} vs. ${compareResult.finalNPI.toFixed(1)}`
                : 'Both schedules produce equivalent neuroplasticity at this timeframe'}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-600">
            Log your actual practice in the{' '}
            <Link to="/dashboard" className="text-emerald hover:text-emerald-light transition-colors underline underline-offset-2">
              Dashboard
            </Link>{' '}
            to see projections based on your real session history.
          </p>
        </motion.div>
      )}

      {/* NPI + Density small panels (single-scenario view) */}
      {!comparing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="sim-panel">
            <h4 className="text-sm font-semibold text-slate-200 mb-1">Neuroplasticity Index</h4>
            <p className="text-xs text-slate-500 mb-4">
              Composite index: BDNF elevation + accumulated practice exposure
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="npiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 10 }} />
                <Area dataKey="npiLine" fill="url(#npiGrad)" stroke="#8B5CF6"
                  strokeWidth={2} name="NPI (0–100)" type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="sim-panel">
            <h4 className="text-sm font-semibold text-slate-200 mb-1">Synaptic Density Estimate</h4>
            <p className="text-xs text-slate-500 mb-4">Relative to baseline (100%) via Gompertz saturation curve</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="densGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} tickFormatter={v => v + '%'} domain={[99, 'auto']} />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: any) => [v.toFixed(2) + '%', 'Density']} />
                <ReferenceLine y={100} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <Area dataKey="densityLine" fill="url(#densGrad)" stroke="#00D4FF"
                  strokeWidth={2} name="Synaptic Density (%)" type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="sim-panel">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-200">
            Neuroplasticity Index at {params.totalWeeks} weeks
          </span>
          <span className="font-mono text-emerald text-lg">{result.finalNPI.toFixed(1)} / 100</span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #10B981, #00D4FF)' }}
            initial={{ width: 0 }}
            animate={{ width: `${result.finalNPI}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1.5">
          <span>0 (Untrained)</span>
          <span className="text-slate-500">
            Density gain: <span className="text-emerald-light">+{result.densityGain.toFixed(1)}%</span>
          </span>
          <span>100 (Expert)</span>
        </div>
      </div>

      <div className="bg-emerald/[0.04] border border-emerald/10 rounded-lg px-4 py-3 flex items-start gap-2.5">
        <Info className="w-3.5 h-3.5 text-emerald mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Model basis: </span>
          BDNF is strongly implicated in activity‑dependent synaptic plasticity, LTP facilitation, and neuronal survival (Bathina &amp; Das, 2015; multiple mechanistic reviews). Exercise and enriched activity robustly elevate BDNF, particularly in hippocampus and cortex, and blocking TrkB can abolish exercise‑related cognitive benefits in animal models (Gomez‑Pinilla &amp; colleagues). The simulator borrows the form of standard pharmacokinetic equations (exponential decay with a half‑life, accumulation with repeated bouts) but uses an effective half‑life on the order of a day for the modelled serum/tissue BDNF signal. In vivo, free BDNF in plasma is cleared much faster (sub‑10‑minute half‑life), whereas tissue turnover is slower and less precisely characterized; our time constants are therefore convenient approximations, not directly measured human kinetics. Whether music practice alone, without aerobic exertion, produces BDNF elevations comparable to exercise is not yet established; the assumption that complex instrumental practice can modestly elevate cortical BDNF is a biologically plausible extrapolation, and the magnitude of that effect in this model should be interpreted as a hypothesis, not a fact. Instrument‑specific "motor demand" scaling is qualitatively inspired by structural differences in motor and callosal regions reported in musician‑brain studies; no instrument's BDNF response is quantitatively fit to a particular dataset. Synaptic density estimates via a Gompertz saturation curve are a theoretical linkage between cumulative BDNF exposure and structural change, not a direct readout of measured synapse counts.{' '}
          <span className="text-slate-400">
            The BDNF → plasticity coupling (θ_M reduction) visible in the Dashboard's Neural Impact panel
            is grounded in Figurov et al. (1996) and Bramham &amp; Messaoudi (2005).
          </span>
        </p>
      </div>
    </div>
  );
}
