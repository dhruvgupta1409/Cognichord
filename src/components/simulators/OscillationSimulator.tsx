import { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Info, Radio, Brain, Waves } from 'lucide-react';
import { simulateOscillations } from '../../models/oscillations';
import InstrumentPicker from '../ui/InstrumentPicker';
import type { OscillationParams, InstrumentType } from '../../types';

const BAND_INFO: Record<string, { color: string; hz: string; role: string }> = {
  delta: { color: '#F59E0B', hz: '0.5–4 Hz',   role: 'Beat/meter tracking' },
  theta: { color: '#00D4FF', hz: '4–8 Hz',      role: 'Memory encoding'     },
  alpha: { color: '#8B5CF6', hz: '8–13 Hz',     role: 'Relaxed attention'   },
  beta:  { color: '#FF2D78', hz: '13–30 Hz',    role: 'Sensorimotor'        },
  gamma: { color: '#10B981', hz: '30–100 Hz',   role: 'Feature binding'     },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-primary/95 border border-cyan/20 rounded-lg p-3 text-xs font-mono">
      <div className="text-slate-400 mb-1.5">t = {Number(label).toFixed(1)}s</div>
      {payload.slice(0, 3).map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-400">{p.name}:</span>
          <span style={{ color: p.color }}>{Number(p.value).toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
};

export default function OscillationSimulator() {
  const [params, setParams] = useState<OscillationParams>({
    bpm: 120,
    complexity: 3,
    instrument: 'piano',
    durationSec: 60,
  });

  const result = useMemo(() => simulateOscillations(params), [params]);

  const set = (key: keyof OscillationParams, val: number | string) =>
    setParams(prev => ({ ...prev, [key]: val }));

    const radarData = [
    { band: 'Delta', power: result.bandPowers.delta, fullMark: 2 },
    { band: 'Theta', power: result.bandPowers.theta, fullMark: 2 },
    { band: 'Alpha', power: result.bandPowers.alpha, fullMark: 2 },
    { band: 'Beta',  power: result.bandPowers.beta,  fullMark: 2 },
    { band: 'Gamma', power: result.bandPowers.gamma, fullMark: 2 },
  ];

    const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(result.timeSeries.length / 200));
    return result.timeSeries.filter((_, i) => i % step === 0);
  }, [result.timeSeries]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="sim-panel space-y-5">
          <div>
            <h3 className="font-display font-semibold text-slate-200 text-sm mb-1">Oscillation Analyzer</h3>
            <p className="text-xs text-slate-500">EEG band entrainment to musical stimuli</p>
          </div>

                    <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Musical Tempo</label>
              <span className="control-value">{params.bpm} BPM</span>
            </div>
            <input
              type="range" min={60} max={180} value={params.bpm}
              onChange={e => set('bpm', +e.target.value)}
              className="slider-custom"
            />
            <p className="text-xs text-slate-600 mt-1">
              Beat freq: <span className="text-cyan/70">{(params.bpm / 60).toFixed(2)} Hz</span>
            </p>
          </div>

                    <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Musical Complexity</label>
              <span className="control-value">{params.complexity}/5</span>
            </div>
            <input
              type="range" min={1} max={5} step={1} value={params.complexity}
              onChange={e => set('complexity', +e.target.value)}
              className="slider-custom"
            />
          </div>

                    <InstrumentPicker
            value={params.instrument}
            onChange={v => set('instrument', v)}
            accentColor="#00D4FF"
          />

                    <div>
            <div className="flex items-center justify-between mb-2">
              <label className="control-label">Analysis Window</label>
              <span className="control-value">{params.durationSec}s</span>
            </div>
            <input
              type="range" min={15} max={120} step={5} value={params.durationSec}
              onChange={e => set('durationSec', +e.target.value)}
              className="slider-custom"
            />
          </div>

                    <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">Neural Entrainment</span>
                <span className="font-mono text-cyan">{(result.entrainmentStrength * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.entrainmentStrength * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">Cognitive Engagement</span>
                <span className="font-mono text-gold">{result.cognitiveEngagementIndex.toFixed(1)}/100</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.cognitiveEngagementIndex}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Dominant frequency</span>
              <span className="font-mono text-purple-light">{result.dominantFrequency} Hz</span>
            </div>
          </div>
        </div>

                <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sim-panel">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-cyan" />
                <h4 className="text-sm font-semibold text-slate-200">Band Power Spectrum</h4>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="band"
                    tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 2]}
                    tick={{ fill: '#475569', fontSize: 8 }}
                    tickCount={3}
                  />
                  <Radar
                    name="Power"
                    dataKey="power"
                    stroke="#00D4FF"
                    fill="#00D4FF"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

                        <div className="sim-panel">
              <div className="flex items-center gap-2 mb-3">
                <Waves className="w-4 h-4 text-purple-light" />
                <h4 className="text-sm font-semibold text-slate-200">Relative Powers</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(result.bandPowers).map(([band, power]) => {
                  const info = BAND_INFO[band];
                  return (
                    <div key={band}>
                      <div className="flex justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />
                          <span className="text-slate-400 capitalize font-medium">{band}</span>
                          <span className="text-slate-600">{info.hz}</span>
                        </div>
                        <span className="font-mono" style={{ color: info.color }}>
                          {power.toFixed(3)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: info.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(power / 2) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{info.role}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

                    <div className="sim-panel">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-cyan" />
              <h4 className="text-sm font-semibold text-slate-200">Oscillation Time Series</h4>
              <span className="text-xs text-slate-500">Theta · Beta · Gamma envelopes</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#475569', fontSize: 9 }}
                  tickLine={false}
                  tickFormatter={v => `${Number(v).toFixed(0)}s`}
                />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="theta" stroke="#00D4FF" strokeWidth={1.5} dot={false} name="Theta" type="monotone" />
                <Line dataKey="beta"  stroke="#FF2D78" strokeWidth={1.5} dot={false} name="Beta"  type="monotone" />
                <Line dataKey="gamma" stroke="#10B981" strokeWidth={1.5} dot={false} name="Gamma" type="monotone" strokeOpacity={0.8} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-cyan/[0.04] border border-cyan/10 rounded-lg px-4 py-3 flex items-start gap-2.5">
        <Info className="w-3.5 h-3.5 text-cyan mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Model basis: </span>
          Neural entrainment to musical beat in low‑frequency bands (delta/theta) has been demonstrated in EEG/MEG studies, and beta‑band activity over auditory–motor networks tracks temporal predictions and is modulated by rhythmic stimulation, even during passive listening. Large &amp; Snyder's neural resonance framework and related work motivate representing pulse and meter as synchronized oscillators, and Lisman &amp; Jensen's theta–gamma code provides a general mechanism for nesting faster item‑scale activity within slower temporal contexts. In this simulator, band roles (delta for slow temporal structure, theta for beat‑level chunking, alpha for relaxed attention, beta for sensorimotor timing, gamma for local feature binding) follow common EEG conventions. "Theta–gamma coupling for musical memory" is implemented as an application of the broader theta–gamma coding hypothesis to musical material; the specific coupling strengths and their dependence on tempo/complexity are modelling choices. Instrument‑dependent sensorimotor coupling strengths are qualitatively informed by structural and functional differences observed between musicians and non‑musicians (e.g., in motor cortex, basal ganglia, and callosal pathways), but no parameter here is numerically fitted to a particular instrument study.
        </p>
      </div>
    </div>
  );
}
