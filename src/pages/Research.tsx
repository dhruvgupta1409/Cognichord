import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { FlaskConical, Info, ArrowRight, Dna, Zap, Layers, Download } from 'lucide-react';
import {
  getSimulatedSessions, aggregateByInstrument, aggregateByFrequency,
  aggregateByDuration, aggregateByComplexity, aggregateByMode,
  aggregateByBPM, npiHistogram, sessionToSimSession, exportSimCSV,
} from '../data/simulatedSessions';
import { usePracticeStore } from '../store/practiceStore';

const TOOLTIP_STYLE = {
  background: '#07111e',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: 8,
  fontSize: 10,
};

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export default function Research() {
  const [includeOwn, setIncludeOwn] = useState(false);
  const allSessions    = usePracticeStore(s => s.sessions);
  const currentUserId  = usePracticeStore(s => s.currentUserId);

  const userSessions = currentUserId
    ? allSessions.filter(s => s.userId === currentUserId)
    : [];

  const baseSessions = useMemo(() => getSimulatedSessions(), []);

  const sessions = useMemo(() => {
    if (!includeOwn || userSessions.length === 0) return baseSessions;
    const converted = userSessions.map(s =>
      sessionToSimSession(s.instrument, s.durationMin, s.complexity)
    );
    return [...baseSessions, ...converted];
  }, [baseSessions, includeOwn, userSessions]);

  const freqData       = useMemo(() => aggregateByFrequency(sessions),  [sessions]);
  const durData        = useMemo(() => aggregateByDuration(sessions),   [sessions]);
  const complexityData = useMemo(() => aggregateByComplexity(sessions), [sessions]);
  const instrumentData = useMemo(() => aggregateByInstrument(sessions), [sessions]);
  const modeData       = useMemo(() => aggregateByMode(sessions),       [sessions]);
  const bpmData        = useMemo(() => aggregateByBPM(sessions),        [sessions]);
  const histData       = useMemo(() => npiHistogram(sessions),          [sessions]);

  const totalCount = sessions.length;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <span className="section-label">Explorer</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-2">
            5,000 Simulated Sessions,{' '}
            <span className="gradient-text">Analyzed</span>
          </h1>
          <p className="text-slate-500 text-base max-w-2xl">
            This page runs our BDNF and dopamine models across 5,000 randomly generated practice sessions —
            spanning every instrument, duration, complexity, frequency, mode, BPM, and novelty level — and
            visualizes what the models predict across the full input space. Charts show aggregate model outputs
            grouped by each parameter.
          </p>
        </motion.div>

        {/* Why simulated + toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 rounded-xl border border-gold/20 bg-gold/[0.04] p-4 flex flex-col sm:flex-row items-start gap-4"
        >
          <Info className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 font-semibold mb-1">Why simulated data — not real community sessions?</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Collecting real practice data from users would require IRB approval and could raise COPPA concerns
              for minors. Instead, all {totalCount.toLocaleString()} sessions here are generated with a fixed seed —
              fully reproducible, zero personal data, and covering the complete parameter space the models support.
              If you've logged your own sessions, you can toggle them into the analysis below.
            </p>
          </div>
          <button
            onClick={() => setIncludeOwn(v => !v)}
            disabled={userSessions.length === 0}
            title={userSessions.length === 0 ? 'Log sessions in the Dashboard first' : undefined}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              userSessions.length === 0
                ? 'opacity-40 cursor-not-allowed border-white/[0.06] text-slate-600'
                : includeOwn
                ? 'border-emerald/40 bg-emerald/[0.08] text-emerald'
                : 'border-white/[0.1] text-slate-400 hover:text-slate-200 hover:border-white/[0.2]'
            }`}
          >
            {userSessions.length === 0
              ? 'No sessions logged'
              : includeOwn
              ? `− Remove my ${userSessions.length} sessions`
              : `+ Add my ${userSessions.length} sessions`}
          </button>
        </motion.div>

        <div className="space-y-6">

          {/* Row 1: Frequency + Duration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-semibold text-slate-200">Practice Frequency → Avg NPI</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Average Neuroplasticity Index at 4 weeks, grouped by sessions/week ·{' '}
                {totalCount.toLocaleString()} sessions
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={freqData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]}
                    label={{ value: 'Avg NPI', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v} NPI  (n=${e.payload.sessions})`, 'Avg NPI']} />
                  <Bar dataKey="avgNPI" name="Avg NPI" fill="#10B981" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                NPI is highly sensitive to frequency. Daily practice nearly doubles the 4-week gain vs. once weekly in this model.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-semibold text-slate-200">Session Duration → Avg BDNF</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Average serum BDNF (a.u.) at 4 weeks, bucketed by session length ·{' '}
                {totalCount.toLocaleString()} sessions
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={durData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Avg BDNF (a.u.)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v} a.u.  (n=${e.payload.sessions})`, 'Avg BDNF']} />
                  <Bar dataKey="avgBDNF" name="Avg BDNF" fill="#8B5CF6" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                Duration has a logarithmic effect. Going from 15 → 45 min matters more than 60 → 120 min in this model.
              </p>
            </motion.div>
          </div>

          {/* Row 2: Complexity + Instrument */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-cyan" />
                <h3 className="text-sm font-semibold text-slate-200">Complexity → Avg NPI + Dopamine</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Both models respond to difficulty — harder material drives higher outputs up to a ceiling
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complexityData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
                  <Bar dataKey="avgNPI" name="Avg NPI"      fill="#10B981" fillOpacity={0.8} radius={[4,4,0,0]} />
                  <Bar dataKey="avgDA"  name="Avg Dopamine" fill="#00D4FF" fillOpacity={0.7} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-semibold text-slate-200">Instrument → Avg NPI</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Motor demand scaling by instrument · top 14 by avg NPI across all simulated sessions
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={instrumentData} layout="vertical"
                  margin={{ top: 5, right: 16, left: 75, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <YAxis type="category" dataKey="instrument"
                    tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} width={75} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v} NPI  (n=${e.payload.sessions})`, 'Avg NPI']} />
                  <Bar dataKey="avgNPI" name="Avg NPI" fill="#F59E0B" fillOpacity={0.8} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                Differences reflect qualitative motor demand scaling from musician-brain literature — no instrument's BDNF response is fit to a specific dataset.
              </p>
            </motion.div>
          </div>

          {/* Row 3: Mode + BPM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-cyan" />
                <h3 className="text-sm font-semibold text-slate-200">Musical Mode → Avg Dopamine</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Average reward index per mode · ordered dark → bright by valence
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modeData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="mode" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Avg DA Index', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v}  (n=${e.payload.sessions})`, 'Avg Dopamine']} />
                  <Bar dataKey="avgDA" name="Avg Dopamine" fill="#00D4FF" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-pink-light" />
                <h3 className="text-sm font-semibold text-slate-200">Tempo (BPM) → Avg Dopamine</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Average reward index by tempo range · model peaks near mid-tempo (~120 BPM)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bpmData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Avg DA Index', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v}  (n=${e.payload.sessions})`, 'Avg Dopamine']} />
                  <Bar dataKey="avgDA" name="Avg Dopamine" fill="#FF2D78" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Row 4: NPI distribution histogram */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="sim-panel"
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-purple-light" />
              <h3 className="text-sm font-semibold text-slate-200">NPI Score Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              How many of the {totalCount.toLocaleString()} sessions fall into each Neuroplasticity Index bucket ·
              naturally skewed low because sessions are modeled over a 4-week window
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={histData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                  label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="count" name="Sessions" fill="#8B5CF6" fillOpacity={0.8} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

        </div>

        {/* Export + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 rounded-2xl border border-emerald/15 bg-gradient-to-r from-emerald/[0.04] via-cyan/[0.04] to-purple/[0.04] p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-4 h-4 text-emerald" />
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald">
                  Take the data with you
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-slate-100 mb-1">
                Download the full simulated dataset
              </h3>
              <p className="text-slate-500 text-sm max-w-md">
                All {totalCount.toLocaleString()} sessions as CSV — instrument, duration, complexity, frequency,
                mode, BPM, novelty, NPI, BDNF delta, and dopamine index. Fully reproducible (fixed seed, no personal data).
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => downloadText(
                  exportSimCSV(sessions),
                  `cognichord-simulated-${totalCount}.csv`,
                  'text/csv'
                )}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
              <div className="flex items-center gap-3 mt-1">
                <Link to="/dashboard" className="btn-secondary inline-flex items-center gap-2 text-xs py-2">
                  Log my sessions
                </Link>
                <Link to="/lab" className="btn-ghost inline-flex items-center gap-2 text-xs py-2">
                  Open Lab <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
