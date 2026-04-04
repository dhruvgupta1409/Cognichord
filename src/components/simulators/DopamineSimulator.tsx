import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { Info, Zap, TrendingUp, Clock, Activity } from 'lucide-react';
import { simulateDopamine } from '../../models/dopamine';
import type { DopamineParams, MusicalMode } from '../../types';

const MODES: MusicalMode[] = ['major', 'lydian', 'mixolydian', 'dorian', 'minor', 'phrygian'];
const MODE_VALENCE: Record<MusicalMode, string> = {
  major: 'Positive', lydian: 'Euphoric', mixolydian: 'Energetic',
  dorian: 'Bittersweet', minor: 'Melancholic', phrygian: 'Dark',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-primary/95 border border-cyan/20 rounded-lg p-3 text-xs font-mono shadow-glow-cyan">
      <div className="text-slate-400 mb-1.5">t = {label} min</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-400">{p.name}:</span>
          <span style={{ color: p.color }}>{Number(p.value).toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
};

export default function DopamineSimulator() {
  const [params, setParams] = useState<DopamineParams>({
    bpm: 120,
    mode: 'major',
    sessionDurationMin: 45,
    complexity: 3,
    novelty: 0.7,
    practiceFrequency: 4,
  });

  const result = useMemo(() => simulateDopamine(params), [params]);

  const set = (key: keyof DopamineParams, val: number | string) =>
    setParams(prev => ({ ...prev, [key]: val }));

  const sensitivityData = useMemo(() => {
    return Array.from({ length: 30 }, (_, day) => {
      const sessions = day * (params.practiceFrequency / 7);
      const habituation = Math.exp(-0.03 * sessions);
      const upregulation = 1 + 0.4 * (1 - Math.exp(-0.08 * sessions));
      return {
        day: day + 1,
        sensitivity: parseFloat((habituation * upregulation * 100).toFixed(1)),
        baseline: 100,
      };
    });
  }, [params.practiceFrequency]);

  const metrics = [
    { label: 'Peak DA', value: `×${result.peakDA.toFixed(3)}`, color: '#00D4FF', icon: TrendingUp, unit: 'baseline' },
    { label: 'Mean DA', value: `×${result.meanDA.toFixed(3)}`, color: '#8B5CF6', icon: Activity, unit: 'baseline' },
    { label: 'Reward Index (Simulated)', value: result.rewardIndex.toFixed(1), color: '#F59E0B', icon: Zap, unit: '/ 100' },
    { label: 'DA Effective Decay', value: `${result.dopamineHalfLife}`, color: '#10B981', icon: Clock, unit: 'min' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="sim-panel space-y-5">
          <div>
            <h3 className="font-display font-semibold text-slate-200 text-sm mb-1">Dopamine Simulator</h3>
            <p className="text-xs text-slate-500">Mesolimbic reward circuit response</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Tempo (BPM)</label>
              <span className="control-value">{params.bpm}</span>
            </div>
            <input
              type="range" min={60} max={200} value={params.bpm}
              onChange={e => set('bpm', +e.target.value)}
              className="slider-custom"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>60</span><span className="text-cyan/50">↑ Model peak reward often near mid‑tempo (~120)</span><span>200</span>
            </div>
          </div>

          <div>
            <label className="control-label block mb-2">Musical Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MODES.map(m => (
                <button
                  key={m}
                  onClick={() => set('mode', m)}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    params.mode === m
                      ? 'bg-cyan/20 text-cyan border border-cyan/30'
                      : 'bg-white/4 text-slate-500 border border-white/[0.06] hover:text-slate-300'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Valence: <span className="text-slate-400">{MODE_VALENCE[params.mode]}</span>
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Session Duration</label>
              <span className="control-value">{params.sessionDurationMin} min</span>
            </div>
            <input
              type="range" min={10} max={120} value={params.sessionDurationMin}
              onChange={e => set('sessionDurationMin', +e.target.value)}
              className="slider-custom"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Musical Complexity</label>
              <span className="control-value">{params.complexity}/5</span>
            </div>
            <input
              type="range" min={1} max={5} step={1} value={params.complexity}
              onChange={e => set('complexity', +e.target.value)}
              className="slider-custom purple"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Simple</span><span>Expert</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Novelty Factor</label>
              <span className="control-value">{(params.novelty * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.05} value={params.novelty}
              onChange={e => set('novelty', +e.target.value)}
              className="slider-custom pink"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Familiar</span><span>Novel</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Sessions / Week</label>
              <span className="control-value">{params.practiceFrequency}×</span>
            </div>
            <input
              type="range" min={1} max={7} step={1} value={params.practiceFrequency}
              onChange={e => set('practiceFrequency', +e.target.value)}
              className="slider-custom emerald"
            />
          </div>
        </div>

        <div className="lg:col-span-2 sim-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Dopamine Trace</h4>
              <p className="text-xs text-slate-500">Tonic + phasic release over session</p>
            </div>
            <span className="tag tag-cyan flex items-center gap-1">
              <Zap className="w-3 h-3" /> Live
            </span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={result.trace} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                label={{ value: 'time (min)', position: 'insideBottomRight', fill: '#475569', fontSize: 10, dy: 8 }}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                tickFormatter={v => v.toFixed(1)}
                domain={['auto', 'auto']}
                label={{ value: 'DA (normalized)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, dx: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4"
                label={{ value: 'baseline', position: 'right', fill: '#475569', fontSize: 9 }} />
              <Area dataKey="tonic" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.4)"
                strokeWidth={1.5} name="Tonic" type="monotone" />
              <Line dataKey="dopamine" stroke="#00D4FF" strokeWidth={2} dot={false}
                name="Total DA" type="monotone" />
              <Bar dataKey="phasic" fill="rgba(0,212,255,0.25)" name="Phasic" radius={[2, 2, 0, 0]} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="sim-panel">
          <h4 className="text-sm font-semibold text-slate-200 mb-1">D2 Receptor Sensitivity (30 days)</h4>
          <p className="text-xs text-slate-500 mb-4">
            Receptor up/downregulation with practice frequency ×{params.practiceFrequency}/week
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={sensitivityData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="sensGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false}
                label={{ value: 'Day', position: 'insideBottomRight', fill: '#475569', fontSize: 9 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} tickFormatter={v => v + '%'} />
              <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 10 }} />
              <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Area dataKey="sensitivity" fill="url(#sensGrad)" stroke="#F59E0B"
                strokeWidth={2} name="Receptor Sensitivity (%)" type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="sim-panel">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1.5">Session Analysis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{result.sessionSummary}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Mesolimbic engagement</span>
              <div className="flex-1 mx-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan to-purple rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, result.rewardIndex)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="text-cyan font-mono">{result.rewardIndex.toFixed(0)}/100</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Phasic:Tonic ratio</span>
              <span className="font-mono text-purple-light">
                {(result.peakDA / result.meanDA).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Mode valence effect</span>
              <span className="font-mono text-emerald-light">{MODE_VALENCE[params.mode]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-cyan/[0.04] border border-cyan/10 rounded-lg px-4 py-3 flex items-start gap-2.5">
        <Info className="w-3.5 h-3.5 text-cyan mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Model basis: </span>
          Conceptually inspired by Schultz's reward prediction error framework, in which midbrain dopamine neurons encode differences between expected and received rewards and show distinct responses to unpredicted vs. predicted outcomes. The music‑specific parameters (BPM, mode, "valence", novelty) and their weights are modelling assumptions, not values taken from Schultz's work. Witek et al. (2014) supports an inverted‑U relationship between rhythmic syncopation and groove‑related pleasure; the mid‑tempo (~120 BPM) optimum implemented here is a reasonable but unreported assumption, not a number from that study. Mode valence ordering reflects general affective‑music findings and predictive‑coding accounts of musical pleasure (Zatorre &amp; Salimpoor, 2013), but the exact mode coefficients in this simulator are not directly calibrated from empirical dopamine measurements. The model uses an effective minutes‑scale decay constant (~6.5 min) to capture slow changes in "session‑level" dopamine tone; in reality, synaptic dopamine transients decay over milliseconds via diffusion and DAT‑mediated uptake, and systemic plasma dopamine has a short half‑life on the order of a few minutes; this simulator abstracts those fast processes into a smoother signal suitable for practice‑scale visualization.
        </p>
      </div>
    </div>
  );
}
