import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis,
} from 'recharts';
import { FlaskConical, Info, ArrowRight, Dna, Zap, Layers, Download, Activity } from 'lucide-react';
import {
  getSimulatedSessions, aggregateByInstrument, aggregateByFrequency,
  aggregateByDuration, aggregateByComplexity, aggregateByMode,
  aggregateByBPM, aggregateByNovelty, npiHistogram,
  sessionToSimSession, exportSimCSV,
  type SimSession,
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

// ── Statistics helpers ───────────────────────────────────────────────────────
function mean(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function sd(arr: number[]) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}
function median(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}
function iqr(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length * 0.75)] - s[Math.floor(s.length * 0.25)];
}
function skewness(arr: number[]) {
  const m = mean(arr), s = sd(arr);
  if (s === 0) return 0;
  return arr.reduce((a, x) => a + ((x - m) / s) ** 3, 0) / arr.length;
}
function pearsonR(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return 0;
  const xm = mean(xs), ym = mean(ys), sx = sd(xs), sy = sd(ys);
  if (sx === 0 || sy === 0) return 0;
  let cov = 0;
  for (let i = 0; i < n; i++) cov += (xs[i] - xm) * (ys[i] - ym);
  return cov / (n * sx * sy);
}
function f(n: number, d = 1) { return n.toFixed(d); }

// ── Correlation color / strength label ──────────────────────────────────────
function rStyle(r: number): { color: string; label: string } {
  const abs = Math.abs(r);
  const dir = r >= 0 ? '+' : '−';
  if (abs >= 0.7) return { color: r >= 0 ? '#10B981' : '#F87171', label: `${dir} strong`   };
  if (abs >= 0.4) return { color: r >= 0 ? '#6EE7B7' : '#FCA5A5', label: `${dir} moderate` };
  if (abs >= 0.2) return { color: r >= 0 ? '#A7F3D0' : '#FECACA', label: `${dir} weak`     };
  return { color: '#475569', label: 'negligible' };
}

// ── Computed insight helpers — every string derived from the data array ──────

function freqInsight(data: ReturnType<typeof aggregateByFrequency>) {
  if (data.length < 2) return null;
  const sorted = [...data].sort((a, b) => a.freq - b.freq);
  const lo = sorted[0], hi = sorted[sorted.length - 1];
  const diff = hi.avgNPI - lo.avgNPI;
  const pct  = (diff / lo.avgNPI * 100).toFixed(1);
  return `${hi.label} vs ${lo.label}: NPI ${lo.avgNPI} → ${hi.avgNPI} (Δ = ${f(diff)} pts, +${pct}% relative). Marginal gains computed across each frequency step.`;
}

function durInsight(data: ReturnType<typeof aggregateByDuration>) {
  if (data.length < 3) return null;
  const gains = data.slice(1).map((d, i) => ({
    label: `${data[i].label} → ${d.label}`,
    gain:  parseFloat((d.avgBDNF - data[i].avgBDNF).toFixed(2)),
  }));
  const maxG = gains.reduce((a, b) => a.gain > b.gain ? a : b);
  const minG = gains.reduce((a, b) => a.gain < b.gain ? a : b);
  const totalGain = data[data.length - 1].avgBDNF - data[0].avgBDNF;
  return `Total BDNF gain across full duration range: +${f(totalGain)} a.u. Largest per-step gain: ${maxG.label} (+${maxG.gain}). Smallest: ${minG.label} (+${minG.gain}).`;
}

function complexityInsight(data: ReturnType<typeof aggregateByComplexity>) {
  if (data.length < 2) return null;
  const npiHi = data.reduce((a, b) => a.avgNPI > b.avgNPI ? a : b);
  const npiLo = data.reduce((a, b) => a.avgNPI < b.avgNPI ? a : b);
  const daHi  = data.reduce((a, b) => a.avgDA  > b.avgDA  ? a : b);
  const daLo  = data.reduce((a, b) => a.avgDA  < b.avgDA  ? a : b);
  return `NPI range: ${npiLo.avgNPI} (${npiLo.label}) → ${npiHi.avgNPI} (${npiHi.label}), span = ${f(npiHi.avgNPI - npiLo.avgNPI)} pts. DA range: ${daLo.avgDA} → ${daHi.avgDA}, span = ${f(daHi.avgDA - daLo.avgDA)} pts.`;
}

function instrumentInsight(data: ReturnType<typeof aggregateByInstrument>) {
  if (data.length < 2) return null;
  const top = data[0], bot = data[data.length - 1];
  return `Top-ranked: ${top.instrument} (NPI = ${top.avgNPI}, n=${top.sessions}). Bottom of shown range: ${bot.instrument} (${bot.avgNPI}, n=${bot.sessions}). Spread: ${f(top.avgNPI - bot.avgNPI)} pts across top 14.`;
}

function modeInsight(data: ReturnType<typeof aggregateByMode>) {
  if (data.length < 2) return null;
  const hi = data.reduce((a, b) => a.avgDA > b.avgDA ? a : b);
  const lo = data.reduce((a, b) => a.avgDA < b.avgDA ? a : b);
  return `${hi.mode} → highest avg DA (${hi.avgDA}, n=${hi.sessions}). ${lo.mode} → lowest (${lo.avgDA}). Cross-mode spread: ${f(hi.avgDA - lo.avgDA)} pts.`;
}

function bpmInsight(data: ReturnType<typeof aggregateByBPM>) {
  const filled = data.filter(d => d.sessions > 0);
  if (filled.length < 2) return null;
  const hi = filled.reduce((a, b) => a.avgDA > b.avgDA ? a : b);
  const lo = filled.reduce((a, b) => a.avgDA < b.avgDA ? a : b);
  return `Highest DA reward: ${hi.label} BPM (avg ${hi.avgDA}, n=${hi.sessions}). Lowest: ${lo.label} BPM (avg ${lo.avgDA}). Tempo-linked DA range: ${f(hi.avgDA - lo.avgDA)} pts.`;
}

function noveltyInsight(data: ReturnType<typeof aggregateByNovelty>) {
  const filled = data.filter(d => d.sessions > 0);
  if (filled.length < 2) return null;
  const hi = filled.reduce((a, b) => a.avgDA > b.avgDA ? a : b);
  const lo = filled.reduce((a, b) => a.avgDA < b.avgDA ? a : b);
  return `${hi.label}: avg DA ${hi.avgDA} (n=${hi.sessions}). ${lo.label}: avg DA ${lo.avgDA}. Novelty-linked DA range: ${f(hi.avgDA - lo.avgDA)} pts.`;
}

function histInsight(data: ReturnType<typeof npiHistogram>, total: number) {
  if (data.length === 0 || total === 0) return null;
  const peak    = data.reduce((a, b) => a.count > b.count ? a : b);
  const above50 = data.filter(d => parseInt(d.label.split('–')[0]) >= 50).reduce((a, b) => a + b.count, 0);
  const above70 = data.filter(d => parseInt(d.label.split('–')[0]) >= 70).reduce((a, b) => a + b.count, 0);
  return `Modal bucket: ${peak.label} (n=${peak.count.toLocaleString()}, ${f(peak.count / total * 100)}%). NPI ≥ 50: ${above50.toLocaleString()} sessions (${f(above50 / total * 100)}%). NPI ≥ 70: ${above70.toLocaleString()} (${f(above70 / total * 100)}%).`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Research() {
  const [includeOwn, setIncludeOwn] = useState(false);
  const allSessions   = usePracticeStore(s => s.sessions);
  const currentUserId = usePracticeStore(s => s.currentUserId);

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

  // ── Aggregated chart data ─────────────────────────────────────────────────
  const freqData    = useMemo(() => aggregateByFrequency(sessions),  [sessions]);
  const durData     = useMemo(() => aggregateByDuration(sessions),   [sessions]);
  const complexData = useMemo(() => aggregateByComplexity(sessions), [sessions]);
  const instData    = useMemo(() => aggregateByInstrument(sessions), [sessions]);
  const modeData    = useMemo(() => aggregateByMode(sessions),       [sessions]);
  const bpmData     = useMemo(() => aggregateByBPM(sessions),        [sessions]);
  const noveltyData = useMemo(() => aggregateByNovelty(sessions),    [sessions]);
  const histData    = useMemo(() => npiHistogram(sessions),          [sessions]);

  // ── BDNF distribution histogram ───────────────────────────────────────────
  const bdnfHistData = useMemo(() => {
    const vals = sessions.map(s => s.bdnfDelta + 100);
    const lo = Math.floor(Math.min(...vals) / 10) * 10;
    const hi = Math.ceil(Math.max(...vals) / 10) * 10;
    const bins: { label: string; count: number }[] = [];
    for (let b = lo; b < hi; b += 10) {
      bins.push({ label: `${b}`, count: vals.filter(v => v >= b && v < b + 10).length });
    }
    return bins;
  }, [sessions]);

  // ── Sampled scatter: NPI vs. DA (every 20th session ≈ 250 points) ─────────
  const scatterData = useMemo(() =>
    sessions
      .filter((_, i) => i % 20 === 0)
      .map(s => ({ npi: s.npi, da: s.dopamineIndex })),
  [sessions]);

  // ── Pearson r: NPI vs. DA Index (cross-outcome correlation) ──────────────
  const rNPI_DA = useMemo(() =>
    pearsonR(sessions.map(s => s.npi), sessions.map(s => s.dopamineIndex)).toFixed(3),
  [sessions]);

  // ── Correlation matrix — 5 continuous predictors × 3 outcomes ────────────
  const corrMatrix = useMemo(() => {
    const predictors: Array<{ label: string; getValue: (s: SimSession) => number }> = [
      { label: 'Frequency (×/wk)', getValue: s => s.frequencyPerWeek },
      { label: 'Duration (min)',    getValue: s => s.durationMin      },
      { label: 'Complexity (1–5)', getValue: s => s.complexity        },
      { label: 'Tempo (BPM)',      getValue: s => s.bpm               },
      { label: 'Novelty (0–1)',    getValue: s => s.novelty           },
    ];
    return predictors.map(p => {
      const xs = sessions.map(p.getValue);
      return {
        label: p.label,
        rNPI:  pearsonR(xs, sessions.map(s => s.npi)),
        rBDNF: pearsonR(xs, sessions.map(s => s.bdnfDelta + 100)),
        rDA:   pearsonR(xs, sessions.map(s => s.dopamineIndex)),
      };
    });
  }, [sessions]);

  // ── Interaction effect: Frequency × Duration → NPI, BDNF, DA ─────────────
  const interactionData = useMemo(() => {
    if (sessions.length === 0) return null;
    const medDur  = median(sessions.map(s => s.durationMin));
    const medFreq = median(sessions.map(s => s.frequencyPerWeek));
    const groups = [
      { dur: 'Short', freq: 'Low',  filter: (s: SimSession) => s.durationMin <= medDur  && s.frequencyPerWeek <= medFreq },
      { dur: 'Short', freq: 'High', filter: (s: SimSession) => s.durationMin <= medDur  && s.frequencyPerWeek >  medFreq },
      { dur: 'Long',  freq: 'Low',  filter: (s: SimSession) => s.durationMin >  medDur  && s.frequencyPerWeek <= medFreq },
      { dur: 'Long',  freq: 'High', filter: (s: SimSession) => s.durationMin >  medDur  && s.frequencyPerWeek >  medFreq },
    ];
    return {
      medDur:  Math.round(medDur),
      medFreq: Math.round(medFreq),
      cells: groups.map(g => {
        const grp = sessions.filter(g.filter);
        return {
          dur: g.dur, freq: g.freq, n: grp.length,
          avgNPI:  grp.length > 0 ? f(mean(grp.map(s => s.npi)))             : '—',
          avgBDNF: grp.length > 0 ? f(mean(grp.map(s => s.bdnfDelta + 100))) : '—',
          avgDA:   grp.length > 0 ? f(mean(grp.map(s => s.dopamineIndex)))   : '—',
        };
      }),
    };
  }, [sessions]);

  // ── Descriptive statistics — mean, SD, median, IQR, min, max, skewness ────
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;
    const npis  = sessions.map(s => s.npi);
    const bdnfs = sessions.map(s => s.bdnfDelta + 100);
    const das   = sessions.map(s => s.dopamineIndex);
    return {
      n:        sessions.length,
      npiM:     f(mean(npis)),    npiSD:   f(sd(npis)),   npiMed: f(median(npis)), npiIQR: f(iqr(npis)),
      npiMin:   f(Math.min(...npis)),   npiMax:  f(Math.max(...npis)),  npiSkew: f(skewness(npis), 2),
      bdnfM:    f(mean(bdnfs)),   bdnfSD:  f(sd(bdnfs)),  bdnfMed: f(median(bdnfs)), bdnfIQR: f(iqr(bdnfs)),
      bdnfMin:  f(Math.min(...bdnfs)),  bdnfMax: f(Math.max(...bdnfs)), bdnfSkew: f(skewness(bdnfs), 2),
      daM:      f(mean(das)),     daSD:    f(sd(das)),    daMed:  f(median(das)),  daIQR:  f(iqr(das)),
      daMin:    f(Math.min(...das)),    daMax:   f(Math.max(...das)),   daSkew:  f(skewness(das), 2),
    };
  }, [sessions]);

  // ── Per-chart insights — all computed, none hardcoded ─────────────────────
  const iFreq    = useMemo(() => freqInsight(freqData),                  [freqData]);
  const iDur     = useMemo(() => durInsight(durData),                    [durData]);
  const iComplex = useMemo(() => complexityInsight(complexData),         [complexData]);
  const iInst    = useMemo(() => instrumentInsight(instData),            [instData]);
  const iMode    = useMemo(() => modeInsight(modeData),                  [modeData]);
  const iBPM     = useMemo(() => bpmInsight(bpmData),                    [bpmData]);
  const iNovelty = useMemo(() => noveltyInsight(noveltyData),            [noveltyData]);
  const iHist    = useMemo(() => histInsight(histData, sessions.length), [histData, sessions.length]);

  const totalCount = sessions.length;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
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
            The BDNF neuroplasticity and dopamine reward models were run across{' '}
            {totalCount.toLocaleString()} randomly generated practice sessions, independently varying
            instrument, duration, complexity, frequency per week, musical mode, tempo, and novelty.
            Every chart, statistic, and inline finding is computed at render time from the session array —
            no results are stated a priori.
          </p>
        </motion.div>

        {/* ── Why simulated + toggle ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 rounded-xl border border-gold/20 bg-gold/[0.04] p-4 flex flex-col sm:flex-row items-start gap-4"
        >
          <Info className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 font-semibold mb-1">Why simulated data — not real community sessions?</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Collecting real practice data from users would require IRB approval and could raise COPPA concerns for
              minors. Instead, all {totalCount.toLocaleString()} sessions are generated with a fixed LCG seed (2025) —
              fully reproducible, zero personal data, and uniformly covering the complete parameter space the models
              support. Session fields are identical to Dashboard sessions: instrument, duration, complexity, frequency,
              mode, BPM, and novelty. You can optionally layer your own logged sessions into the analysis below.
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

        {/* ── Methodology transparency ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-8 rounded-xl border border-cyan/10 bg-cyan/[0.03] p-4"
        >
          <p className="text-xs font-semibold text-cyan/70 uppercase tracking-widest mb-2">How findings are computed</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every insight on this page — Pearson <em>r</em> values, group means, marginal comparisons,
            distribution statistics — is generated at render time by a pure TypeScript function applied
            to the <code className="text-slate-400 font-mono">SimSession[]</code> array. Nothing is
            written by hand. For example, the "largest per-step BDNF gain" label is produced by
            computing consecutive differences between{' '}
            <code className="text-slate-400 font-mono">aggregateByDuration</code> bucket means and
            reporting whichever bucket-to-bucket step the data actually shows as largest.
            Pearson <em>r</em> uses the standard sum-of-products formula over all{' '}
            {totalCount.toLocaleString()} sessions. Medians use sorted-array indexing.
            Skewness is the third standardized moment (γ₁). Source:{' '}
            <code className="text-slate-400 font-mono">src/data/simulatedSessions.ts</code> ·{' '}
            <code className="text-slate-400 font-mono">src/pages/Research.tsx</code>.
          </p>
        </motion.div>

        {/* ── Descriptive statistics ────────────────────────────────────────── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6 sim-panel"
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-purple-light" />
              <h3 className="text-sm font-semibold text-slate-200">
                Descriptive Statistics — N = {stats.n.toLocaleString()} sessions
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] text-slate-500 font-medium pb-2 pr-4">Outcome</th>
                    <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-3">Mean</th>
                    <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-3">SD</th>
                    <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-3">Median</th>
                    <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-3">IQR</th>
                    <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-3">Min</th>
                    <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-3">Max</th>
                    <th className="text-right text-[10px] text-slate-500 font-medium pb-2">Skew γ₁</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="py-1.5 pr-4 text-slate-400">Neuroplasticity Index (NPI, 0–100)</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-emerald">{stats.npiM}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-500">{stats.npiSD}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-300">{stats.npiMed}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-500">{stats.npiIQR}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{stats.npiMin}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{stats.npiMax}</td>
                    <td className="py-1.5 text-right font-mono text-slate-600">{stats.npiSkew}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 text-slate-400">BDNF at 4 weeks (a.u., baseline = 100)</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-emerald">{stats.bdnfM}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-500">{stats.bdnfSD}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-300">{stats.bdnfMed}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-500">{stats.bdnfIQR}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{stats.bdnfMin}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{stats.bdnfMax}</td>
                    <td className="py-1.5 text-right font-mono text-slate-600">{stats.bdnfSkew}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-4 text-slate-400">Dopamine Reward Index (0–100)</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-cyan">{stats.daM}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-500">{stats.daSD}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-300">{stats.daMed}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-500">{stats.daIQR}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{stats.daMin}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{stats.daMax}</td>
                    <td className="py-1.5 text-right font-mono text-slate-600">{stats.daSkew}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
              Parameters were independently sampled: instrument (23 types), duration 15–120 min, complexity 1–5,
              frequency 1–7 ×/wk, mode (6), BPM 60–180, novelty 0.2–1.0 (LCG seed 2025). BDNF run at 4-week
              horizon. All statistics computed from the session array — nothing hardcoded.
            </p>
          </motion.div>
        )}

        {/* ── Correlation matrix ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-6 sim-panel"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-cyan" />
            <h3 className="text-sm font-semibold text-slate-200">
              Correlation Matrix — Pearson <em>r</em>, continuous predictors × outcomes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] text-slate-500 font-medium pb-2 pr-8">Predictor</th>
                  <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-8">
                    r (NPI)
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium pb-2 pr-8">
                    r (BDNF)
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium pb-2">
                    r (DA Index)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {corrMatrix.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-8 text-slate-400 font-medium">{row.label}</td>
                    {[row.rNPI, row.rBDNF, row.rDA].map((r, j) => {
                      const { color, label } = rStyle(r);
                      return (
                        <td key={j} className={`py-1.5 text-right ${j < 2 ? 'pr-8' : ''}`}>
                          <span style={{ color }} className="font-mono font-semibold">
                            {r.toFixed(3)}
                          </span>
                          <span className="text-[9px] text-slate-600 ml-2">{label}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
            Pearson <em>r</em> computed on all {totalCount.toLocaleString()} sessions. Strength thresholds:
            |r| ≥ 0.7 strong, ≥ 0.4 moderate, ≥ 0.2 weak, &lt; 0.2 negligible. Categorical predictors
            (instrument, mode) are shown in the bar charts below. Cross-outcome correlation
            r(NPI, DA) = {rNPI_DA}.
          </p>
        </motion.div>

        {/* ── Interaction effect: Frequency × Duration ─────────────────────── */}
        {interactionData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-8 sim-panel"
          >
            <div className="flex items-center gap-2 mb-1">
              <Dna className="w-4 h-4 text-emerald" />
              <h3 className="text-sm font-semibold text-slate-200">
                Interaction Effect — Practice Frequency × Session Duration
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sessions split at median duration ({interactionData.medDur} min) and median frequency (
              {interactionData.medFreq}×/wk). Each cell reports mean NPI, BDNF (a.u.), and dopamine reward
              for that quadrant of the parameter space.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {interactionData.cells.map((cell, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="text-[10px] text-slate-500 font-medium mb-2">
                    {cell.freq} freq · {cell.dur} dur
                    <span className="text-slate-600 ml-1">(n = {cell.n.toLocaleString()})</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">NPI</div>
                      <div className="text-sm font-mono font-bold text-emerald">{cell.avgNPI}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">BDNF</div>
                      <div className="text-sm font-mono font-bold text-purple-light">{cell.avgBDNF}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-wide mb-0.5">DA</div>
                      <div className="text-sm font-mono font-bold text-cyan">{cell.avgDA}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
              The four cells are mutually exclusive and exhaustive (all {totalCount.toLocaleString()} sessions
              are distributed across the quadrants). Comparing high-freq + long-dur against low-freq + short-dur
              isolates the combined effect of both scheduling variables simultaneously.
            </p>
          </motion.div>
        )}

        {/* ── Chart rows ───────────────────────────────────────────────────── */}
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
                Mean Neuroplasticity Index at 4 weeks, grouped by sessions/week ·{' '}
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
                      [`NPI = ${v}  (n = ${e.payload.sessions})`, 'Avg NPI']} />
                  <Bar dataKey="avgNPI" name="Avg NPI" fill="#10B981" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {iFreq && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iFreq}</p>}
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
                Mean serum BDNF (a.u.) at 4 weeks, by session length ·{' '}
                {totalCount.toLocaleString()} sessions
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={durData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Avg BDNF (a.u.)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v} a.u.  (n = ${e.payload.sessions})`, 'Avg BDNF']} />
                  <Line type="monotone" dataKey="avgBDNF" name="Avg BDNF"
                    stroke="#8B5CF6" strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              {iDur && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iDur}</p>}
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
                Mean NPI and dopamine reward index at each complexity level (1–5)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={complexData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, name: string, e: any) =>
                      [`${v}  (n = ${e.payload.sessions})`, name]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#475569' }} />
                  <Bar dataKey="avgNPI" name="Avg NPI"      fill="#10B981" fillOpacity={0.8} radius={[4,4,0,0]} />
                  <Bar dataKey="avgDA"  name="Avg Dopamine" fill="#00D4FF" fillOpacity={0.7} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {iComplex && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iComplex}</p>}
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
                Top 14 instruments by mean NPI across all simulated sessions
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={instData} layout="vertical"
                  margin={{ top: 5, right: 16, left: 75, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                  <YAxis type="category" dataKey="instrument"
                    tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} width={75} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`NPI = ${v}  (n = ${e.payload.sessions})`, 'Avg NPI']} />
                  <Bar dataKey="avgNPI" name="Avg NPI" fill="#F59E0B" fillOpacity={0.8} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
              {iInst && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iInst}</p>}
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
                Mean dopamine reward index per mode · ordered dark → bright by model valence
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modeData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="mode" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Avg DA Index', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v}  (n = ${e.payload.sessions})`, 'Avg Dopamine']} />
                  <Bar dataKey="avgDA" name="Avg Dopamine" fill="#00D4FF" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {iMode && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iMode}</p>}
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
                Mean dopamine reward index per tempo bucket
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bpmData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Avg DA Index', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v}  (n = ${e.payload.sessions})`, 'Avg Dopamine']} />
                  <Bar dataKey="avgDA" name="Avg Dopamine" fill="#FF2D78" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {iBPM && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iBPM}</p>}
            </motion.div>
          </div>

          {/* Row 4: Novelty + NPI histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-gold-light" />
                <h3 className="text-sm font-semibold text-slate-200">Novelty → Avg Dopamine</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Mean dopamine reward index by novelty quartile
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={noveltyData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Avg DA Index', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _: string, e: any) =>
                      [`${v}  (n = ${e.payload.sessions})`, 'Avg Dopamine']} />
                  <Bar dataKey="avgDA" name="Avg Dopamine" fill="#F59E0B" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {iNovelty && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iNovelty}</p>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-purple-light" />
                <h3 className="text-sm font-semibold text-slate-200">NPI Score Distribution</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Session count per 10-point NPI bucket · {totalCount.toLocaleString()} sessions
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={histData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 10 }} />
                  <Bar dataKey="count" name="Sessions" fill="#8B5CF6" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {iHist && <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">{iHist}</p>}
            </motion.div>
          </div>

          {/* Row 5: BDNF distribution + NPI vs DA scatter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Dna className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-semibold text-slate-200">BDNF Level Distribution</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Session count per 10-unit BDNF bucket (a.u., baseline = 100) ·{' '}
                {totalCount.toLocaleString()} sessions
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bdnfHistData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }} />
                  <Tooltip
                    contentStyle={{ background: '#07111e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 10 }}
                    formatter={(v: number) => [v.toLocaleString(), 'Sessions']}
                    labelFormatter={(l) => `BDNF ${l}–${parseInt(l) + 10} a.u.`}
                  />
                  <Bar dataKey="count" name="Sessions" fill="#10B981" fillOpacity={0.75} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {stats && (
                <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">
                  mean = {stats.bdnfM} a.u. · median = {stats.bdnfMed} · SD = {stats.bdnfSD} · skew = {stats.bdnfSkew}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-cyan" />
                <h3 className="text-sm font-semibold text-slate-200">NPI vs. Dopamine Index — Joint Distribution</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Each point = one session · {scatterData.length} sampled (1-in-20, deterministic)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ top: 5, right: 16, left: -10, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    type="number" dataKey="npi" name="NPI"
                    tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'NPI', position: 'insideBottom', fill: '#475569', fontSize: 9, dy: 14 }}
                  />
                  <YAxis
                    type="number" dataKey="da" name="DA Index"
                    tick={{ fill: '#475569', fontSize: 10 }} tickLine={false}
                    label={{ value: 'DA Index', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9, dx: 14 }}
                  />
                  <ZAxis range={[16, 16]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.08)' }}
                    contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }}
                    formatter={(v: number, name: string) => [v.toFixed(1), name]}
                  />
                  <Scatter data={scatterData} fill="#00D4FF" fillOpacity={0.3} />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-slate-600 mt-2 font-mono leading-relaxed">
                r(NPI, DA) = {rNPI_DA} — computed on full {totalCount.toLocaleString()}-session array.
                Scatter shows every 20th session for rendering performance.
              </p>
            </motion.div>
          </div>

        </div>

        {/* ── Export + CTA ──────────────────────────────────────────────────── */}
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
                All {totalCount.toLocaleString()} sessions as CSV — instrument, duration, complexity,
                frequency, mode, BPM, novelty, NPI, BDNF delta, and dopamine index. Fixed seed, fully
                reproducible.
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
