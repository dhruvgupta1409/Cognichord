import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { Info, Layers, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { simulatePlasticity } from '../../models/plasticity';
import type { PlasticityParams, RhythmPattern } from '../../types';

const RHYTHMS: { id: RhythmPattern; label: string; desc: string }[] = [
  { id: 'steady',     label: 'Steady (4/4)',   desc: 'Uniform beat' },
  { id: 'syncopated', label: 'Syncopated',     desc: 'Off-beat accents' },
  { id: 'triplet',    label: 'Triplet (3/4)',  desc: '3-feel subdivisions' },
  { id: 'complex',    label: 'Complex',        desc: 'Mixed meter' },
  { id: 'polyrhythm', label: 'Polyrhythm',     desc: '2-against-3' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-primary/95 border border-purple/20 rounded-lg p-3 text-xs font-mono">
      <div className="text-slate-400 mb-1.5">t = {Number(label).toFixed(2)} min</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-400">{p.name}:</span>
          <span style={{ color: p.color }}>{Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
};

export default function PlasticitySimulator() {
  const [params, setParams] = useState<PlasticityParams>({
    rhythmPattern: 'syncopated',
    stimulationAmplitude: 3,
    sessionDurationMin: 30,
    practiceDays: 14,
    restPeriodHours: 16,
  });

  const result = useMemo(() => simulatePlasticity(params), [params]);

  const set = (key: keyof PlasticityParams, val: number | string) =>
    setParams(prev => ({ ...prev, [key]: val }));

    const phaseData = [
    { name: 'LTP', value: result.ltpEvents, color: '#00D4FF' },
    { name: 'LTD', value: result.ltdEvents, color: '#FF2D78' },
    { name: 'Neutral', value: Math.max(0, result.curve.length - result.ltpEvents - result.ltdEvents), color: '#475569' },
  ];

  const metrics = [
    { label: 'Final Weight',    value: result.finalWeight.toFixed(3),      color: '#8B5CF6', icon: Layers    },
    { label: 'LTP Events',      value: result.ltpEvents.toString(),          color: '#00D4FF', icon: TrendingUp },
    { label: 'LTD Events',      value: result.ltdEvents.toString(),          color: '#FF2D78', icon: TrendingDown },
    { label: 'Potentiation',    value: `+${result.potentiationPercent}%`,   color: '#F59E0B', icon: Zap       },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="sim-panel space-y-5">
          <div>
            <h3 className="font-display font-semibold text-slate-200 text-sm mb-1">Plasticity Simulator</h3>
            <p className="text-xs text-slate-500">BCM rule + Ca²⁺ dynamics</p>
          </div>

                    <div>
            <label className="control-label block mb-2">Rhythm Pattern</label>
            <div className="space-y-1.5">
              {RHYTHMS.map(r => (
                <button
                  key={r.id}
                  onClick={() => set('rhythmPattern', r.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all ${
                    params.rhythmPattern === r.id
                      ? 'bg-purple/20 text-purple-light border border-purple/30'
                      : 'bg-white/4 text-slate-500 border border-white/[0.06] hover:text-slate-300'
                  }`}
                >
                  <span className="font-medium">{r.label}</span>
                  <span className="text-slate-600">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

                    <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Stimulation Amplitude</label>
              <span className="control-value">{params.stimulationAmplitude}/5</span>
            </div>
            <input
              type="range" min={1} max={5} step={1} value={params.stimulationAmplitude}
              onChange={e => set('stimulationAmplitude', +e.target.value)}
              className="slider-custom purple"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Soft</span><span>Intense</span>
            </div>
          </div>

                    <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Session Duration</label>
              <span className="control-value">{params.sessionDurationMin} min</span>
            </div>
            <input
              type="range" min={5} max={60} value={params.sessionDurationMin}
              onChange={e => set('sessionDurationMin', +e.target.value)}
              className="slider-custom purple"
            />
          </div>

                    <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Practice Days</label>
              <span className="control-value">{params.practiceDays} days</span>
            </div>
            <input
              type="range" min={1} max={30} value={params.practiceDays}
              onChange={e => set('practiceDays', +e.target.value)}
              className="slider-custom purple"
            />
          </div>

                    <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Rest Between Sessions</label>
              <span className="control-value">{params.restPeriodHours}h</span>
            </div>
            <input
              type="range" min={8} max={72} step={4} value={params.restPeriodHours}
              onChange={e => set('restPeriodHours', +e.target.value)}
              className="slider-custom purple"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>8h</span><span className="text-slate-500">↑ Often optimal: 16–24h for consolidation</span><span>72h</span>
            </div>
          </div>
        </div>

                <div className="lg:col-span-2 sim-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Synaptic Weight + Ca²⁺</h4>
              <p className="text-xs text-slate-500">
                {params.rhythmPattern} rhythm · {params.sessionDurationMin} min session
              </p>
            </div>
            <span className="tag tag-purple flex items-center gap-1">
              <Layers className="w-3 h-3" /> BCM Rule
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={result.curve} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#475569', fontSize: 10 }}
                tickLine={false}
                label={{ value: 'time (min)', position: 'insideBottomRight', fill: '#475569', fontSize: 10 }}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10 }}
                tickLine={false}
                domain={[0, 2]}
                label={{ value: 'value (a.u.)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, dx: 14 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4"
                label={{ value: 'W₀', position: 'right', fill: '#475569', fontSize: 9 }} />
              <Line dataKey="weight" stroke="#8B5CF6" strokeWidth={2.5} dot={false}
                name="Synaptic Weight W" type="monotone" />
              <Line dataKey="calcium" stroke="#00D4FF" strokeWidth={1.5} dot={false}
                name="[Ca²⁺]" type="monotone" strokeOpacity={0.8} />
              <Line dataKey="threshold" stroke="#F59E0B" strokeWidth={1.5} dot={false}
                name="θ_M (BCM threshold)" type="monotone" strokeDasharray="5 3" strokeOpacity={0.7} />
            </LineChart>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="sim-panel">
          <h4 className="text-sm font-semibold text-slate-200 mb-1">Plasticity Phase Distribution</h4>
          <p className="text-xs text-slate-500 mb-4">LTP vs LTD event counts during session</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={phaseData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
              <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 10 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Events">
                {phaseData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sim-panel">
          <h4 className="text-sm font-semibold text-slate-200 mb-3">
            Multi-day Potentiation ({params.practiceDays} days)
          </h4>
                    <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">Cumulative Synaptic Weight</span>
                <span className="font-mono text-purple-light">{result.finalWeight.toFixed(3)}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #8B5CF6, #00D4FF)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.finalWeight / 2) * 100}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0 (silent)</span><span>2.0 (max LTP)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">Plasticity Index</span>
                <span className="font-mono text-gold">{result.plasticityIndex.toFixed(1)} / 100</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #F59E0B, #FF2D78)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.plasticityIndex}%` }}
                  transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                <div className="text-xs text-slate-500 mb-1">LTP : LTD Ratio</div>
                <div className="font-mono text-purple-light text-sm">
                  {result.ltdEvents > 0
                    ? (result.ltpEvents / result.ltdEvents).toFixed(2)
                    : '∞'
                  }
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                <div className="text-xs text-slate-500 mb-1">Net Potentiation</div>
                <div className="font-mono text-cyan text-sm">+{result.potentiationPercent}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-purple/[0.04] border border-purple/10 rounded-lg px-4 py-3 flex items-start gap-2.5">
        <Info className="w-3.5 h-3.5 text-purple-light mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Model basis: </span>
          BCM‑style synaptic modification (Bienenstock, Cooper &amp; Munro, 1982) with a sliding modification threshold that depends on recent postsynaptic activity, extended with a calcium‑based LTP/LTD gating scheme inspired by Shouval‑type models. Calcium‑dependent thresholds for LTD vs. LTP (here, θ_LTD and θ_LTP in arbitrary units, e.g., 0.6 and 1.8) and the NMDA‑mediated Ca²⁺ decay constant (τ ≈ 80 ms) are representative modelling values that produce realistic frequency‑dependent LTD/LTP curves, not fixed biophysical constants measured in a single experiment. Empirical work in visual cortex supports the existence of a sliding LTD/LTP crossover threshold that shifts with prior activity (Kirkwood &amp; Bear and related work), but the exact mapping from musical rhythm patterns to spike‑timing–dependent plasticity (STDP) windows is a deliberate modelling assumption in this simulator. Rhythm → STDP window coupling is included to let users explore how temporal structure might interact with calcium thresholds; there is currently no single paper that quantitatively calibrates this specific relationship for musical practice.
        </p>
      </div>
    </div>
  );
}
