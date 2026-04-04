import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { FlaskConical, Info, ArrowRight, Dna, Zap, Layers } from 'lucide-react';
import { simulateBDNF } from '../models/bdnf';
import { simulateDopamine } from '../models/dopamine';

// ── Parameter sweep helpers ────────────────────────────────────────────────────
// Each function runs the model across a range of one parameter while holding
// the others at representative "typical musician" values.

const BASE = {
  sessionDurationMin: 45,
  complexity: 3,
  frequencyPerWeek: 4,
  totalWeeks: 8,
  instrument: 'piano' as const,
};

function sweepFrequency() {
  return [1, 2, 3, 4, 5, 6, 7].map(freq => {
    const r = simulateBDNF({ ...BASE, frequencyPerWeek: freq });
    return { frequency: `${freq}×/wk`, npi: r.finalNPI, bdnf: r.averageBDNF };
  });
}

function sweepDuration() {
  return [15, 30, 45, 60, 75, 90, 120].map(dur => {
    const r = simulateBDNF({ ...BASE, sessionDurationMin: dur });
    return { duration: `${dur}m`, npi: r.finalNPI, bdnf: r.averageBDNF };
  });
}

function sweepComplexity() {
  const labels = ['1 — Beginner', '2', '3 — Moderate', '4', '5 — Virtuoso'];
  return [1, 2, 3, 4, 5].map((c, i) => {
    const r = simulateBDNF({ ...BASE, complexity: c });
    const d = simulateDopamine({ bpm: 120, mode: 'major', sessionDurationMin: 45, complexity: c, novelty: 0.7, practiceFrequency: 4 });
    return { complexity: labels[i], npi: r.finalNPI, rewardIndex: d.rewardIndex };
  });
}

const TOP_INSTRUMENTS = ['piano', 'drums', 'violin', 'voice', 'guitar', 'flute', 'saxophone', 'trumpet'] as const;

function sweepInstrument() {
  return TOP_INSTRUMENTS.map(inst => {
    const r = simulateBDNF({ ...BASE, instrument: inst });
    return { instrument: inst, npi: r.finalNPI };
  });
}

function sweepWeeks() {
  const freqs = [2, 4, 7];
  const colors = ['#8B5CF6', '#10B981', '#00D4FF'];
  const labels = ['2×/week', '4×/week', '7×/week'];
  const weeks = [4, 8, 12, 16, 20, 24];
  return weeks.map(w => {
    const point: Record<string, number | string> = { week: `W${w}` };
    freqs.forEach((freq, i) => {
      const r = simulateBDNF({ ...BASE, frequencyPerWeek: freq, totalWeeks: w });
      point[labels[i]] = r.finalNPI;
    });
    return point;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

const BAR_TOOLTIP_STYLE = {
  background: '#07111e',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: 8,
  fontSize: 10,
};

export default function Research() {
  const freqData       = useMemo(() => sweepFrequency(),   []);
  const durData        = useMemo(() => sweepDuration(),    []);
  const complexityData = useMemo(() => sweepComplexity(),  []);
  const instrumentData = useMemo(() => sweepInstrument(),  []);
  const weeksData      = useMemo(() => sweepWeeks(),       []);

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
          <span className="section-label">Model Explorer</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-2">
            How Practice Parameters{' '}
            <span className="gradient-text">Shape Model Predictions</span>
          </h1>
          <p className="text-slate-500 text-base max-w-2xl">
            Each chart below sweeps one practice variable while holding others fixed,
            showing how our computational models respond. These are{' '}
            <span className="text-slate-300 font-medium">model predictions</span> — not
            empirical data from human participants. Use them to build intuition about
            the models, then{' '}
            <Link to="/lab" className="text-cyan hover:text-cyan-light underline underline-offset-2 transition-colors">
              explore the simulators directly
            </Link>{' '}
            or{' '}
            <Link to="/dashboard" className="text-emerald hover:text-emerald-light underline underline-offset-2 transition-colors">
              log your own sessions
            </Link>{' '}
            to see predictions driven by your real data.
          </p>
        </motion.div>

        {/* Disclaimer banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 rounded-xl border border-gold/20 bg-gold/[0.04] p-4 flex items-start gap-3"
        >
          <Info className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-400 leading-relaxed">
            <span className="text-gold font-semibold">Model Explorer — not a research database.</span>{' '}
            All values here are outputs from our BDNF and dopamine computational models
            run across parameter ranges. No human participant data is displayed or aggregated.
            Default parameters: piano, 45-minute sessions, complexity 3, 4×/week, 8-week horizon.
            Each chart varies exactly one parameter to show its effect on model output.
          </p>
        </motion.div>

        {/* Charts grid */}
        <div className="space-y-6">

          {/* Row 1: Frequency + Duration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Frequency → NPI */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-semibold text-slate-200">Practice Frequency → NPI</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Neuroplasticity Index at 8 weeks · piano · 45 min · complexity 3
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={freqData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="frequency" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={BAR_TOOLTIP_STYLE} />
                  <Bar dataKey="npi" name="NPI" fill="#10B981" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                NPI is highly sensitive to frequency — daily practice nearly doubles the 8-week gain vs. once weekly in this model.
              </p>
            </motion.div>

            {/* Duration → NPI */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-semibold text-slate-200">Session Duration → NPI</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Neuroplasticity Index at 8 weeks · piano · 4×/week · complexity 3
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={durData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="duration" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={BAR_TOOLTIP_STYLE} />
                  <Bar dataKey="npi" name="NPI" fill="#8B5CF6" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                Duration effects follow a log function — going from 15→45 min matters more than 60→120 min in this model.
              </p>
            </motion.div>
          </div>

          {/* Row 2: Complexity + Instrument */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Complexity → NPI + Reward */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-cyan" />
                <h3 className="text-sm font-semibold text-slate-200">Complexity → NPI + Dopamine Reward</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Two model outputs at once · piano · 4×/week · 45 min · 8 weeks
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complexityData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="complexity" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={BAR_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
                  <Bar dataKey="npi" name="NPI" fill="#10B981" fillOpacity={0.8} radius={[4,4,0,0]} />
                  <Bar dataKey="rewardIndex" name="Dopamine Reward" fill="#00D4FF" fillOpacity={0.7} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                Complexity drives both BDNF accumulation and phasic dopamine. Here both models agree: harder material produces more neural signal, up to a point.
              </p>
            </motion.div>

            {/* Instrument → NPI */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-semibold text-slate-200">Instrument → NPI</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Motor demand factor comparison · 4×/week · 45 min · complexity 3 · 8 weeks
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={instrumentData} layout="vertical" margin={{ top: 5, right: 16, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <YAxis type="category" dataKey="instrument" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} width={55} />
                  <Tooltip contentStyle={BAR_TOOLTIP_STYLE} />
                  <Bar dataKey="npi" name="NPI" fill="#F59E0B" fillOpacity={0.8} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2">
                Instrument differences reflect qualitative motor demand scaling from musician-brain literature — no single instrument's BDNF is fit to a specific dataset.
              </p>
            </motion.div>
          </div>

          {/* Row 3: Long-term NPI trajectories */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="sim-panel"
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-purple-light" />
              <h3 className="text-sm font-semibold text-slate-200">
                Long-Term NPI Trajectories — Frequency Comparison
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              NPI over 24 weeks at three practice frequencies · piano · 45 min · complexity 3
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeksData} margin={{ top: 5, right: 24, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
                <Line dataKey="2×/week"  stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Line dataKey="4×/week"  stroke="#10B981" strokeWidth={2} dot={false} />
                <Line dataKey="7×/week"  stroke="#00D4FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-600 mt-2">
              The model shows diminishing returns at high frequency as BDNF approaches its ceiling (×2.2 baseline).
              The gap between 2× and 4× is larger than between 4× and 7× — suggesting moderate consistency beats sporadic intensity in this model.
            </p>
          </motion.div>

        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-10 rounded-2xl border border-emerald/15 bg-gradient-to-r from-emerald/[0.04] via-cyan/[0.04] to-purple/[0.04] p-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-emerald" />
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald">
              See predictions from your real practice
            </span>
          </div>
          <h3 className="font-display font-bold text-xl text-slate-100 mb-2">
            Log sessions in the Dashboard
          </h3>
          <p className="text-slate-500 text-sm mb-5 max-w-md mx-auto">
            Once you've logged practice sessions, the Dashboard's Neural Impact panel
            runs these models on your actual data — showing your real BDNF trajectory,
            reward index, and LTP threshold, plus an 8-week projection.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/lab" className="btn-secondary inline-flex items-center gap-2">
              Open Lab <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
