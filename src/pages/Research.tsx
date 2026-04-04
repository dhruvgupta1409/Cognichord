import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';
import {
  FlaskConical, Users, Info, ToggleLeft, ToggleRight,
  ChevronDown, Download, ShieldOff, Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getSimulatedSessions,
  aggregateByInstrument,
  aggregateByFrequency,
  aggregateByDuration,
  aggregateByComplexity,
  aggregateByMode,
  aggregateByBPM,
  aggregateByNovelty,
  npiHistogram,
  exportSimCSV,
  sessionToSimSession,
} from '../data/simulatedSessions';
import { usePracticeStore } from '../store/practiceStore';

const PUBLISHED_COGNITIVE = [
  { subject: 'Working Memory',   musicians: 0.40, baseline: 0 },
  { subject: 'Processing Speed', musicians: 0.25, baseline: 0 },
  { subject: 'Pattern Recog.',   musicians: 0.55, baseline: 0 },
  { subject: 'Verbal Memory',    musicians: 0.35, baseline: 0 },
  { subject: 'Attention',        musicians: 0.30, baseline: 0 },
  { subject: 'Exec. Function',   musicians: 0.20, baseline: 0 },
];

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export default function Research() {
  const userSessions  = usePracticeStore(s => s.sessions);
  const contribute    = usePracticeStore(s => s.contributeToResearch);
  const setContribute = usePracticeStore(s => s.setContributeToResearch);

  const [showMethodology, setShowMethodology] = useState(false);
  const [showPrivacy, setShowPrivacy]         = useState(false);

  const simSessions = useMemo(() => getSimulatedSessions(), []);

  const userConverted = useMemo(
    () => contribute
      ? userSessions.map(s => sessionToSimSession(s.instrument, s.durationMin, s.complexity))
      : [],
    [userSessions, contribute],
  );

  const allSessions = useMemo(
    () => [...simSessions, ...userConverted],
    [simSessions, userConverted],
  );

  const byInstrument = useMemo(() => aggregateByInstrument(allSessions),  [allSessions]);
  const byFrequency  = useMemo(() => aggregateByFrequency(allSessions),   [allSessions]);
  const byDuration   = useMemo(() => aggregateByDuration(allSessions),    [allSessions]);
  const byComplexity = useMemo(() => aggregateByComplexity(allSessions),  [allSessions]);
  const histogram    = useMemo(() => npiHistogram(allSessions),           [allSessions]);

  const byMode       = useMemo(() => aggregateByMode(simSessions),    [simSessions]);
  const byBPM        = useMemo(() => aggregateByBPM(simSessions),     [simSessions]);
  const byNovelty    = useMemo(() => aggregateByNovelty(simSessions), [simSessions]);

  const avgNPI  = parseFloat((allSessions.reduce((a, s) => a + s.npi,           0) / allSessions.length).toFixed(1));
  const avgBDNF = parseFloat((allSessions.reduce((a, s) => a + s.bdnfDelta,     0) / allSessions.length + 100).toFixed(1));
  const avgDA   = parseFloat((allSessions.reduce((a, s) => a + s.dopamineIndex, 0) / allSessions.length).toFixed(1));

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="section-label">Dataset Explorer</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-3">
            Practice Session{' '}
            <span className="gradient-text">Research Dataset</span>
          </h1>
          <p className="text-slate-400 text-base max-w-2xl">
            Explore model-predicted outcomes across{' '}
            <span className="text-cyan font-medium">{allSessions.length.toLocaleString()} practice scenarios</span>.
            All charts are computed live from model equations — no hardcoded summary statistics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-4 rounded-xl border border-cyan/20 bg-cyan/[0.04] p-5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-200 block mb-1.5">
                What this data is — and isn't
              </span>
              <p className="text-sm text-slate-400 leading-relaxed">
                <strong className="text-slate-300">5,000 computer-simulated scenarios</strong> generated
                deterministically (seed 2025) from the BDNF and dopamine reward models that power the Lab
                simulators. Every number in these charts is direct model output — no empirical biomarker
                measurements are used or implied. Parameters (instrument, duration, complexity,
                frequency/week, mode, BPM, novelty) are uniformly sampled across their full ranges.
                {contribute && userSessions.length > 0 && (
                  <span className="text-emerald-light">
                    {' '}Your <strong>{userSessions.length} practice session{userSessions.length !== 1 ? 's' : ''}</strong> are
                    merged into the neuroplasticity charts. Mode/tempo/novelty charts remain simulation-only
                    (those parameters are not captured in the practice log).
                  </span>
                )}
              </p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <button
                  onClick={() => setShowMethodology(v => !v)}
                  className="flex items-center gap-1 text-xs text-cyan hover:text-cyan-light transition-colors"
                >
                  {showMethodology ? 'Hide' : 'Show'} methodology
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMethodology ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {showMethodology && (
                <div className="mt-3 pt-3 border-t border-cyan/10 text-xs text-slate-500 leading-relaxed space-y-1.5">
                  <p>• All 5,000 sessions use a deterministic LCG PRNG (seed = 2025) — identical output every page load.</p>
                  <p>• NPI values come from running the BDNF accumulation/decay model over a simulated 28-day period at the given frequency (see About page for full equation).</p>
                  <p>• Dopamine Index comes from the RPE-inspired model given BPM (Gaussian peak ~122), mode (valence scaling), complexity, and novelty.</p>
                  <p>• Instrument distribution is uniform over 23 instruments; duration uniform [15–120 min]; complexity uniform integer [1–5]; frequency uniform integer [1–7]/week; mode uniform over 6 modes; BPM uniform [60–180]; novelty uniform [0.20–1.00].</p>
                  <p>• No participant demographics, real user data, or external empirical datasets are used in the baseline simulations. The dataset is fully reproducible from the source code.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="mb-8 rounded-xl border border-pink/15 bg-pink/[0.03] p-4"
        >
          <button
            onClick={() => setShowPrivacy(v => !v)}
            className="w-full flex items-center gap-3 text-left"
          >
            <ShieldOff className="w-4 h-4 text-pink flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-300">
                Community data removed — Privacy &amp; COPPA notice
              </span>
              <span className="ml-2 text-xs text-slate-500">
                Why we no longer share session data across users
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showPrivacy ? 'rotate-180' : ''}`} />
          </button>
          {showPrivacy && (
            <div className="mt-3 pt-3 border-t border-pink/10 text-xs text-slate-500 leading-relaxed space-y-2.5">
              <p>
                A previous version of Cognichord used Firebase Realtime Database to submit every practice
                session to a shared database streamed live to all site visitors. This was removed because:
              </p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-pink font-semibold flex-shrink-0">COPPA</span>
                  <span>
                    The Children's Online Privacy Protection Act (USA) prohibits collecting and sharing
                    personal data — including mood scores, anxiety ratings, and behavioral measures — from
                    users under 13 without verifiable parental consent. Music education tools are routinely
                    used by children, and a website toggle does not constitute compliant consent.
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-pink font-semibold flex-shrink-0">Research ethics</span>
                  <span>
                    In any legitimate study, participants must give informed consent before their data is
                    shared, even anonymously. IRB/ethics board review is required before aggregating and
                    publishing real participant data. Displaying personal health-adjacent self-reports
                    (mood, anxiety, frustration) publicly without this process is ethically unacceptable.
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-pink font-semibold flex-shrink-0">Sensitive data</span>
                  <span>
                    Mood, anxiety, and frustration self-reports are personal and health-adjacent. Making
                    them visible to all site visitors — especially for minors — creates meaningful privacy
                    and welfare risks regardless of perceived anonymity.
                  </span>
                </div>
              </div>
              <p className="text-slate-400">
                <Lock className="w-3.5 h-3.5 inline mr-1 text-emerald" />
                Your session data now lives only in your own browser (localStorage). Nothing is transmitted
                to any server. The simulation dataset below is entirely computer-generated.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="sim-panel sm:col-span-2 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-slate-200 mb-0.5">Include your practice sessions</div>
              <p className="text-xs text-slate-500 max-w-sm">
                {userSessions.length === 0
                  ? 'No sessions logged yet. Go to the Dashboard to start tracking.'
                  : `${userSessions.length} session${userSessions.length !== 1 ? 's' : ''} in your practice log.`
                }{' '}
                {userSessions.length > 0 &&
                  'Merges them into the neuroplasticity charts. Mode, tempo, and novelty charts remain simulation-only.'
                }
              </p>
            </div>
            <button
              onClick={() => setContribute(!contribute)}
              disabled={userSessions.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                contribute
                  ? 'bg-emerald/15 text-emerald border border-emerald/30'
                  : 'bg-white/[0.05] text-slate-400 border border-white/[0.08] hover:text-slate-200'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {contribute ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {contribute ? 'Included' : 'Not included'}
            </button>
          </div>

          <div className="sim-panel flex flex-col justify-center text-center">
            <div className="font-mono text-2xl font-bold text-cyan mb-0.5">
              {allSessions.length.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              Sessions analyzed
              {contribute && userSessions.length > 0 && (
                <span className="block text-slate-500 mt-0.5">
                  {simSessions.length.toLocaleString()} simulated + {userSessions.length} yours
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { value: avgNPI.toFixed(1),  label: 'Mean NPI (Simulated)',        unit: '/ 100', color: '#00D4FF' },
            { value: avgBDNF.toFixed(1), label: 'Mean Growth Factor Signal',   unit: 'a.u.',  color: '#10B981' },
            { value: avgDA.toFixed(1),   label: 'Mean Dopamine (Simulated)',   unit: '/ 100', color: '#F59E0B' },
            { value: '23',               label: 'Instruments covered',        unit: 'types', color: '#8B5CF6' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 + i * 0.04 }}
              className="sim-panel text-center"
            >
              <div className="font-mono text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-500 mb-0.5">{s.label}</div>
              <div className="text-xs" style={{ color: `${s.color}80` }}>{s.unit}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mb-2">
          <span className="section-label">Neuroplasticity Model</span>
          <h2 className="font-display font-semibold text-slate-100 text-xl mb-6">
            BDNF Signal &amp; Neuroplasticity Index
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <motion.div
            initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">NPI by Instrument</h3>
            <p className="text-xs text-slate-500 mb-4">
              Average Neuroplasticity Index after 4 weeks of simulated practice · sorted by score.
              Instruments with higher bimanual/fine-motor demands (violin, viola, piano) produce
              higher model NPI through the instrument motor-complexity factor.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byInstrument} layout="vertical" margin={{ top: 4, right: 16, left: 70, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} domain={[0, 80]} />
                <YAxis type="category" dataKey="instrument" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} width={68} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v.toFixed(1), 'Avg NPI']}
                />
                <Bar dataKey="avgNPI" radius={[0, 4, 4, 0]} name="Avg NPI">
                  {byInstrument.map((_, i) => (
                    <Cell key={i} fill={`rgba(0,212,255,${0.9 - i * 0.04})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">NPI Score Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribution across all {allSessions.length.toLocaleString()} sessions.
              Reflects the full BDNF accumulation/decay model with uniform parameter sampling.
              The spread across the range shows that NPI is sensitive to frequency, duration,
              and complexity, with the highest scores requiring their joint optimization.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogram} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v, 'Sessions']}
                />
                <Bar dataKey="count" name="Sessions" radius={[3, 3, 0, 0]}>
                  {histogram.map((_, i) => (
                    <Cell key={i} fill={`rgba(139,92,246,${0.4 + i * 0.06})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Practice Frequency → Neuroplasticity</h3>
            <p className="text-xs text-slate-500 mb-4">
              Sessions per week vs. mean NPI. Reflects the BDNF accumulation model:
              more frequent sessions prevent decay between bouts, consistent with
              the spacing effect in motor learning (Shea &amp; Morgan, 1979).
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byFrequency} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[0, 80]} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v.toFixed(1), 'Avg NPI']}
                />
                <Bar dataKey="avgNPI" fill="rgba(16,185,129,0.75)" radius={[4, 4, 0, 0]} name="Avg NPI" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Session Duration → BDNF Signal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mean BDNF-like signal (a.u. = arbitrary units) by session length. The log-scaling
              (ΔBDNF ∝ log(1 + T/25)) reflects diminishing returns for very long sessions,
              consistent with the exercise–BDNF dose-response literature.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDuration} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[95, 150]} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v.toFixed(1), 'Avg BDNF (a.u.)']}
                />
                <Bar dataKey="avgBDNF" fill="rgba(245,158,11,0.75)" radius={[4, 4, 0, 0]} name="Avg BDNF" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Piece Complexity → NPI &amp; Dopamine Index</h3>
            <p className="text-xs text-slate-500 mb-4">
              How technically demanding repertoire affects both plasticity and reward signals.
              Complexity increases NPI through the motor-complexity factor in the BDNF model, and
              increases dopamine through the RPE model (more difficult material → larger prediction errors
              on success). This predicts an interaction between challenge level and both learning and motivation.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byComplexity} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="avgNPI" fill="rgba(0,212,255,0.7)"  radius={[4, 4, 0, 0]} name="Avg NPI" />
                <Bar dataKey="avgDA"  fill="rgba(245,158,11,0.5)" radius={[4, 4, 0, 0]} name="Avg Dopamine Index" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-5 mt-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-cyan/70" /> Neuroplasticity Index</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(245,158,11,0.5)' }} /> Dopamine Index</span>
            </div>
          </motion.div>
        </div>

        <div className="mb-2">
          <span className="section-label">Dopamine Reward Model</span>
          <h2 className="font-display font-semibold text-slate-100 text-xl mb-1">
            Sensitivity Analysis: Mode, Tempo &amp; Novelty
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Simulation data only — these parameters are not captured in the personal practice log.
            Charts show how the RPE-inspired dopamine model responds to musical variables that
            have established empirical effects on affect and reward in the music cognition literature.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Musical Mode → Dopamine</h3>
            <p className="text-xs text-slate-500 mb-3">
              Sorted darkest→brightest. Consistent with the robust finding that major-mode music
              is perceived as more positive and activating than minor-mode music
              (Juslin &amp; Laukka, 2004; Dalla Bella et al., 2001). Lydian &gt; Major &gt; Mixolydian
              &gt; Dorian &gt; Minor &gt; Phrygian reflects the emotional valence ordering across modes.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byMode} margin={{ top: 4, right: 8, left: -28, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="mode" tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[0, 40]} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v.toFixed(1), 'Avg DA Index']}
                />
                <Bar dataKey="avgDA" radius={[4, 4, 0, 0]} name="Avg Dopamine Index">
                  {byMode.map((entry, i) => {
                    const intensity = 0.35 + (i / (byMode.length - 1)) * 0.65;
                    return <Cell key={i} fill={`rgba(245,158,11,${intensity})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Tempo (BPM) → Dopamine</h3>
            <p className="text-xs text-slate-500 mb-3">
              Inverted-U relationship peaking near 120–140 BPM. The model uses a Gaussian kernel
              centred at 122 BPM (σ = 38), consistent with the groove optimum reported by
              Witek et al. (2014): groove ratings and movement desire peak around 120–130 BPM across
              genres, with both very slow and very fast tempos reducing reward engagement.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byBPM} margin={{ top: 4, right: 8, left: -28, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[0, 40]} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v.toFixed(1), 'Avg DA Index']}
                />
                <Bar dataKey="avgDA" radius={[4, 4, 0, 0]} name="Avg Dopamine Index">
                  {byBPM.map((entry, i) => {
                    const dist = Math.abs(i - 3);
                    const intensity = Math.max(0.3, 0.9 - dist * 0.18);
                    return <Cell key={i} fill={`rgba(0,212,255,${intensity})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Repertoire Novelty → Dopamine</h3>
            <p className="text-xs text-slate-500 mb-3">
              Monotonically increasing with proportion of new/unfamiliar repertoire.
              Driven by reward prediction error: novel stimuli produce larger
              phasic dopamine responses than familiar ones (Schultz, 1998; Barto, 2013).
              This predicts that introducing new pieces or unfamiliar styles sustains
              higher dopaminergic engagement than drilling known material.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byNovelty} margin={{ top: 4, right: 8, left: -28, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} interval={0}
                  tickFormatter={v => v.split(' ')[0]} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[0, 40]} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v.toFixed(1), 'Avg DA Index']}
                />
                <Bar dataKey="avgDA" radius={[4, 4, 0, 0]} name="Avg Dopamine Index">
                  {byNovelty.map((_, i) => (
                    <Cell key={i} fill={`rgba(139,92,246,${0.35 + i * 0.20})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="sim-panel"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-slate-200 text-sm">Cognitive Profile: Musicians vs. Non-musicians</h3>
              <span className="tag tag-gold flex-shrink-0">Literature effect sizes</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              From published cognitive research —{' '}
              <strong className="text-slate-400">not from this simulation dataset</strong>.
              Values are Cohen's d effect sizes (musician advantage over non-musicians) estimated from
              meta-analytic and review data. Cohen's d: small = 0.2, medium = 0.5, large = 0.8.
              Sources: Sala &amp; Gobet (2017) meta-analysis of music training and cognitive abilities;
              Schellenberg (2004); Miendlarzewska &amp; Trost (2014).
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={PUBLISHED_COGNITIVE}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 1.0]} tick={{ fill: '#475569', fontSize: 8 }} tickCount={3} />
                <Radar name="Musicians (Cohen's d)" dataKey="musicians"    stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Non-musicians (baseline)" dataKey="baseline"  stroke="rgba(255,255,255,0.25)" fill="transparent" strokeWidth={1} strokeDasharray="4 4" />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="sim-panel flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-4 h-4 text-emerald" />
                <h3 className="font-semibold text-slate-200 text-sm">Download Simulation Dataset</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Download the full 5,000-session dataset as CSV for analysis in R, Python/pandas, SPSS,
                or any statistical package. All 10 columns are included: instrument, duration_min,
                complexity, frequency_per_week, mode, bpm, novelty, npi, bdnf_delta_au, dopamine_index.
              </p>
              <p className="text-xs text-slate-600 mb-5">
                Suitable for descriptive statistics, dose-response regression, and cross-parameter
                correlation analysis. The dataset is fully deterministic (seed = 2025) and
                reproducible from the source code.
              </p>
            </div>
            <button
              onClick={() => downloadText(exportSimCSV(simSessions), 'cognichord-simulation-5000.csv', 'text/csv')}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Download 5,000-session CSV
            </button>
          </motion.div>
        </div>

        {userSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-xl border border-emerald/15 bg-emerald/[0.04] p-7 flex flex-col sm:flex-row items-center justify-between gap-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FlaskConical className="w-4 h-4 text-emerald" />
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald">Add your own data</span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-100 mb-1.5">Log your practice sessions</h3>
              <p className="text-slate-500 text-sm max-w-md">
                Go to the Dashboard, log sessions with mood, focus, and anxiety measures, then return here
                and enable "Include your practice sessions" to overlay your data on the neuroplasticity charts.
                Your data stays on your device only.
              </p>
            </div>
            <Link to="/dashboard" className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Users className="w-4 h-4" /> Go to Dashboard
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
