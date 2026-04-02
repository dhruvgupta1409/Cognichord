import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';
import { FlaskConical, Users, Info, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getSimulatedSessions,
  aggregateByInstrument,
  aggregateByFrequency,
  aggregateByDuration,
  aggregateByComplexity,
  npiHistogram,
} from '../data/simulatedSessions';
import { usePracticeStore } from '../store/practiceStore';
import type { SimSession } from '../data/simulatedSessions';
import { subscribeCommunitySession, type CommunitySession } from '../lib/db';

const PUBLISHED_COGNITIVE = [
  { subject: 'Working Memory',  musicians: 76, baseline: 50 },
  { subject: 'Reaction Time',   musicians: 71, baseline: 50 },
  { subject: 'Pattern Recog.',  musicians: 83, baseline: 50 },
  { subject: 'Verbal Fluency',  musicians: 68, baseline: 50 },
  { subject: 'Attention Span',  musicians: 79, baseline: 50 },
  { subject: 'Exec. Function',  musicians: 64, baseline: 50 },
];

function sessionsToSim(sessions: Array<{ instrument: string; durationMin: number; complexity: number }>): SimSession[] {
  return sessions.map(s => {
    const complexity = s.complexity;
    const durationMin = s.durationMin;
    const freq = 4;
    const DECAY = Math.LN2 / 1.5;
    const motorMap: Record<string, number> = {
      piano: 1.35, violin: 1.40, guitar: 1.20, drums: 1.15, voice: 0.90, bass: 1.05,
      flute: 1.28, clarinet: 1.25, cello: 1.33, saxophone: 1.20, trumpet: 1.18,
      viola: 1.38, oboe: 1.32, trombone: 1.15, harp: 1.38, organ: 1.32,
      'french horn': 1.26, marimba: 1.25, ukulele: 1.08, mandolin: 1.22,
      'double bass': 1.20, bassoon: 1.28, 'classical guitar': 1.28,
    };
    const motorFactor = motorMap[s.instrument] ?? 1.0;
    const delta = Math.min(32, 1.2 * Math.log1p(durationMin / 25) * (0.5 + complexity / 5) * 1.2 * motorFactor * 8.5);
    let bdnf = 100;
    for (let day = 0; day < 28; day++) {
      bdnf *= Math.exp(-DECAY);
      if (day % Math.round(7 / freq) === 0) bdnf = Math.min(220, bdnf + delta);
      bdnf = Math.max(80, bdnf);
    }
    const npi = Math.min(100, Math.max(0, ((bdnf - 100) / 100) * 120 + Math.min(40, 5 * 1.2)));
    return {
      instrument: s.instrument as SimSession['instrument'],
      durationMin,
      complexity,
      frequencyPerWeek: freq,
      mode: 'major',
      bpm: 120,
      npi: parseFloat(npi.toFixed(1)),
      bdnfDelta: parseFloat((bdnf - 100).toFixed(1)),
      dopamineIndex: parseFloat(Math.min(100, 55 + complexity * 8 + (durationMin > 30 ? 10 : 0)).toFixed(1)),
    };
  });
}

export default function Research() {
  const userSessions     = usePracticeStore(s => s.sessions);
  const contribute       = usePracticeStore(s => s.contributeToResearch);
  const setContribute    = usePracticeStore(s => s.setContributeToResearch);
  const [showMethodology, setShowMethodology] = useState(false);

  const simSessions = useMemo(() => getSimulatedSessions(), []);

  const [communitySessions, setCommunitySessions] = useState<CommunitySession[]>([]);
  useEffect(() => subscribeCommunitySession(setCommunitySessions), []);
  const communityConverted = useMemo(() => sessionsToSim(communitySessions), [communitySessions]);

  const userConverted = useMemo(
    () => contribute ? sessionsToSim(userSessions) : [],
    [userSessions, contribute]
  );

  const allSessions = useMemo(
    () => [...simSessions, ...communityConverted, ...userConverted],
    [simSessions, communityConverted, userConverted]
  );

  const byInstrument = useMemo(() => aggregateByInstrument(allSessions),  [allSessions]);
  const byFrequency  = useMemo(() => aggregateByFrequency(allSessions),   [allSessions]);
  const byDuration   = useMemo(() => aggregateByDuration(allSessions),    [allSessions]);
  const byComplexity = useMemo(() => aggregateByComplexity(allSessions),  [allSessions]);
  const histogram    = useMemo(() => npiHistogram(allSessions),           [allSessions]);

  const avgNPI  = parseFloat((allSessions.reduce((a, s) => a + s.npi, 0)  / allSessions.length).toFixed(1));
  const avgBDNF = parseFloat((allSessions.reduce((a, s) => a + s.bdnfDelta, 0) / allSessions.length + 100).toFixed(1));
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
            Explore patterns across{' '}
            <span className="text-cyan font-medium">{allSessions.length.toLocaleString()} practice scenarios</span>.
            All charts are built live from current model output — no hardcoded summary numbers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8 rounded-xl border border-cyan/20 bg-cyan/[0.04] p-5"
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-sm font-semibold text-slate-200">What this data is — and isn't</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                <strong className="text-slate-300">5,000 computer-simulated scenarios</strong> — randomly generated
                using our BDNF and dopamine models with a fixed seed (2025). Every single number in these charts
                is the direct output of the same equations powering the Lab simulators; no empirical biomarker values are imported or interpolated.
                {communityConverted.length > 0 && (
                  <span className="text-cyan">
                    {' '}Plus <strong>{communityConverted.length} real community session{communityConverted.length !== 1 ? 's' : ''}</strong> submitted by users worldwide.
                  </span>
                )}
                {contribute && userSessions.length > 0 && (
                  <span className="text-emerald-light">
                    {' '}Plus <strong>{userSessions.length} of your own session{userSessions.length !== 1 ? 's' : ''}</strong> from the practice log.
                  </span>
                )}
              </p>
              <button
                onClick={() => setShowMethodology(v => !v)}
                className="flex items-center gap-1 text-xs text-cyan mt-2 hover:text-cyan-light transition-colors"
              >
                {showMethodology ? 'Hide' : 'Show'} methodology
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMethodology ? 'rotate-180' : ''}`} />
              </button>
              {showMethodology && (
                <div className="mt-3 pt-3 border-t border-cyan/10 text-xs text-slate-500 leading-relaxed space-y-1.5">
                  <p>• All 5,000 sessions use deterministic LCG random parameters (seed=2025), so results are identical every page load.</p>
                  <p>• NPI values come from running the BDNF decay + accumulation model over a simulated 4-week practice period at the given frequency.</p>
                  <p>• Dopamine Index comes from the reward prediction error–style model given BPM, mode, complexity, and novelty.</p>
                  <p>• Instrument distribution is uniform across all 23 supported instruments; duration is uniform between 15–120 min; complexity is uniform 1–5; frequency is uniform 1–7 sessions/week.</p>
                  <p>• No participant demographics, real user data, or external empirical datasets are used in the baseline simulations.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="sim-panel sm:col-span-2 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-slate-200 mb-0.5">Include user practice sessions</div>
              <p className="text-xs text-slate-500">
                {userSessions.length === 0
                  ? 'No user sessions logged yet.'
                  : `There are ${userSessions.length} user-logged session${userSessions.length !== 1 ? 's' : ''} in the practice log.`
                }{' '}
                {userSessions.length > 0 && 'Turning this on merges them into all charts below.'}
              </p>
            </div>
            <button
              onClick={() => setContribute(!contribute)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                contribute
                  ? 'bg-emerald/15 text-emerald border border-emerald/30'
                  : 'bg-white/[0.05] text-slate-400 border border-white/[0.08] hover:text-slate-200'
              }`}
              disabled={userSessions.length === 0}
            >
              {contribute
                ? <ToggleRight className="w-4 h-4" />
                : <ToggleLeft  className="w-4 h-4" />
              }
              {contribute ? 'Included' : 'Not included'}
            </button>
          </div>

          <div className="sim-panel flex flex-col justify-center text-center">
            <div className="font-mono text-2xl font-bold text-cyan mb-0.5">
              {allSessions.length.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              Total sessions analyzed
              {(communityConverted.length > 0 || (contribute && userSessions.length > 0)) && (
                <span className="block text-slate-500 mt-0.5">
                  {simSessions.length.toLocaleString()} simulated
                  {communityConverted.length > 0 && ` + ${communityConverted.length} community`}
                  {contribute && userSessions.length > 0 && ` + ${userSessions.length} yours`}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { value: avgNPI.toFixed(1),  label: 'Mean Neuroplasticity Index', unit: '/ 100', color: '#00D4FF' },
            { value: avgBDNF.toFixed(1), label: 'Mean Growth Factor Level',   unit: 'a.u.',  color: '#10B981' },
            { value: avgDA.toFixed(1),   label: 'Mean Dopamine Index',        unit: '/ 100', color: '#F59E0B' },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Neuroplasticity Index by Instrument</h3>
            <p className="text-xs text-slate-500 mb-4">
              Average NPI after 4 weeks of simulated practice · sorted by score
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
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">NPI Score Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">
              How NPI scores are spread across all {allSessions.length.toLocaleString()} sessions
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
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-slate-600">
                The distribution peaks in the 20–40 range because random parameters cluster around moderate frequency/duration.
                Higher NPI requires the coincident combination of more frequent and longer sessions in the model.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Practice Frequency → Neuroplasticity</h3>
            <p className="text-xs text-slate-500 mb-4">Sessions per week vs. average NPI score</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byFrequency} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false}
                  label={{ value: 'sessions/week', position: 'insideBottomRight', fill: '#475569', fontSize: 9 }} />
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
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Session Length → Growth Factor Level</h3>
            <p className="text-xs text-slate-500 mb-4">Average predicted BDNF‑like signal by session duration (a.u. = arbitrary units)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDuration} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[95, 150]} />
                <Tooltip
                  contentStyle={{ background: '#07111e', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [v.toFixed(1), 'Avg BDNF']}
                />
                <Bar dataKey="avgBDNF" fill="rgba(245,158,11,0.75)" radius={[4, 4, 0, 0]} name="Avg BDNF" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sim-panel"
          >
            <h3 className="font-semibold text-slate-200 text-sm mb-0.5">Piece Complexity → NPI & Dopamine</h3>
            <p className="text-xs text-slate-500 mb-4">How challenging repertoire affects predicted outcomes in reward and plasticity models</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byComplexity} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="avgNPI" fill="rgba(0,212,255,0.7)" radius={[4, 4, 0, 0]} name="Avg NPI" />
                <Bar dataKey="avgDA"  fill="rgba(245,158,11,0.5)" radius={[4, 4, 0, 0]} name="Avg Dopamine" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sim-panel"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-slate-200 text-sm">Cognitive Profile: Musicians vs. Non-musicians</h3>
              <span className="tag tag-gold flex-shrink-0">Published data</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              From published cognitive studies — <strong className="text-slate-400">not from this simulated dataset</strong>.
              Scores normalized to population mean = 50. Values are illustrative estimates synthesized across studies that compare groups with and without long‑term musical training; they are not extracted verbatim from any single paper. Sources: Schellenberg (2004), Miendlarzewska &amp; Trost (2014) and related meta‑analyses.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={PUBLISHED_COGNITIVE}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar name="Musicians (published)" dataKey="musicians" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Non-musicians (baseline)" dataKey="baseline" stroke="rgba(255,255,255,0.25)" fill="transparent" strokeWidth={1} strokeDasharray="4 4" />
                <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {userSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-emerald/15 bg-emerald/[0.04] p-7 flex flex-col sm:flex-row items-center justify-between gap-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FlaskConical className="w-4 h-4 text-emerald" />
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald">Add real data</span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-100 mb-1.5">Log your practice sessions</h3>
              <p className="text-slate-500 text-sm max-w-md">
                Go to the Dashboard, log your sessions, then come back and turn on "Include user practice sessions"
                to see how the logged data compares to the simulated distribution.
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
