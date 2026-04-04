import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, Clock, Calendar, Brain, Activity, Flame, Target,
  CheckCircle, Download, ChevronDown,
} from 'lucide-react';
import { usePracticeStore } from '../../store/practiceStore';

function sd(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

function fmt(v: number | null, decimals = 1): string {
  if (v == null) return '—';
  return v.toFixed(decimals);
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  missing?: boolean;
}

function StatCard({ label, value, unit, color, Icon, missing }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="sim-panel"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div
        className={`font-mono text-xl font-semibold mb-0.5 ${missing ? 'text-slate-600' : ''}`}
        style={missing ? {} : { color }}
      >
        {value}
      </div>
      <div className="text-xs text-slate-600">{missing ? 'log mood to unlock' : unit}</div>
    </motion.div>
  );
}

export default function CumulativeStats() {
  const allSessions  = usePracticeStore(s => s.sessions);
  const currentUserId = usePracticeStore(s => s.currentUserId);
  const getMetrics   = usePracticeStore(s => s.getMetrics);
  const exportCSV    = usePracticeStore(s => s.exportCSV);
  const exportJSON   = usePracticeStore(s => s.exportJSON);
  const [showResearch, setShowResearch] = useState(false);

  const sessions = currentUserId
    ? allSessions.filter(s => s.userId === currentUserId)
    : [];

  const metrics = getMetrics();

  const moodData = useMemo(() =>
    [...sessions]
      .filter(s => s.preMood != null && s.postMood != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s, i) => ({
        session: i + 1,
        pre:    s.preMood,
        post:   s.postMood,
        change: s.postMood! - s.preMood!,
        label:  new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })),
    [sessions]
  );

  const qualityData = useMemo(() =>
    [...sessions]
      .filter(s => s.sessionFocus != null || s.perceivedProgress != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-20)
      .map((s, i) => ({
        label:    `S${i + 1}`,
        focus:    s.sessionFocus    ?? 0,
        progress: s.perceivedProgress ?? 0,
        duration: s.durationMin,
      })),
    [sessions]
  );

  const research = useMemo(() => {
    const full = sessions.filter(s =>
      s.preMood != null && s.postMood != null &&
      s.sessionFocus != null && s.perceivedProgress != null
    );
    if (full.length < 3) return null;

    const preMoods  = full.map(s => s.preMood!);
    const postMoods = full.map(s => s.postMood!);
    const changes   = full.map(s => s.postMood! - s.preMood!);
    const focuses   = full.map(s => s.sessionFocus!);
    const progs     = full.map(s => s.perceivedProgress!);
    const anxieties = full.filter(s => s.preAnxiety   != null).map(s => s.preAnxiety!);
    const energies  = full.filter(s => s.preEnergy    != null).map(s => s.preEnergy!);
    const sleeps    = full.filter(s => s.sleepQuality != null).map(s => s.sleepQuality!);
    const m = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      n:           full.length,
      preMoodM:    m(preMoods).toFixed(2),
      preMoodSD:   sd(preMoods).toFixed(2),
      postMoodM:   m(postMoods).toFixed(2),
      postMoodSD:  sd(postMoods).toFixed(2),
      affectM:     m(changes).toFixed(2),
      affectSD:    sd(changes).toFixed(2),
      focusM:      m(focuses).toFixed(2),
      focusSD:     sd(focuses).toFixed(2),
      progressM:   m(progs).toFixed(2),
      progressSD:  sd(progs).toFixed(2),
      anxietyM:    anxieties.length >= 3 ? m(anxieties).toFixed(2) : null,
      anxietySD:   anxieties.length >= 3 ? sd(anxieties).toFixed(2) : null,
      energyM:     energies.length  >= 3 ? m(energies).toFixed(2)  : null,
      energySD:    energies.length  >= 3 ? sd(energies).toFixed(2) : null,
      sleepM:      sleeps.length    >= 3 ? m(sleeps).toFixed(2)    : null,
      sleepSD:     sleeps.length    >= 3 ? sd(sleeps).toFixed(2)   : null,
      flowN:       full.filter(s => s.flowState === 3).length,
      flowPct:     (full.filter(s => s.flowState === 3).length / full.length * 100).toFixed(1),
      avgDuration: (full.reduce((a, s) => a + s.durationMin, 0) / full.length).toFixed(0),
      durationSD:  sd(full.map(s => s.durationMin)).toFixed(1),
    };
  }, [sessions]);

  const affectColor = metrics.avgAffectChange == null
    ? '#475569'
    : metrics.avgAffectChange >= 0 ? '#10B981' : '#ef4444';

  const affectStr = metrics.avgAffectChange == null
    ? '—'
    : `${metrics.avgAffectChange >= 0 ? '+' : ''}${metrics.avgAffectChange.toFixed(2)}`;

  if (sessions.length === 0) {
    return (
      <div className="sim-panel text-center py-12">
        <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No sessions logged yet.</p>
        <p className="text-slate-600 text-xs mt-1">Log your first practice session to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Sessions', value: metrics.totalSessions.toString(),
            color: '#00D4FF', Icon: Calendar, unit: 'logged',
          },
          {
            label: 'Practice Hours', value: metrics.totalHours.toFixed(1),
            color: '#8B5CF6', Icon: Clock, unit: 'hours',
          },
          {
            label: 'Weekly Frequency', value: `${metrics.weeklyFrequency}×`,
            color: '#10B981', Icon: TrendingUp, unit: '/week',
          },
          {
            label: 'Consistency', value: `${metrics.consistencyScore}%`,
            color: '#F59E0B', Icon: CheckCircle, unit: 'weeks practiced',
          },
          {
            label: 'Avg Mood Lift', value: affectStr,
            color: affectColor, Icon: Activity, unit: 'pts/session (1–7)',
            missing: metrics.avgAffectChange == null,
          },
          {
            label: 'Flow Rate', value: fmt(metrics.flowRate, 0) + (metrics.flowRate != null ? '%' : ''),
            color: '#F59E0B', Icon: Brain, unit: 'full flow sessions',
            missing: metrics.flowRate == null,
          },
          {
            label: 'Avg Focus', value: fmt(metrics.avgSessionFocus),
            color: '#00D4FF', Icon: Target, unit: 'out of 5',
            missing: metrics.avgSessionFocus == null,
          },
          {
            label: 'Current Streak', value: `${metrics.streakDays}`,
            color: '#F59E0B', Icon: Flame, unit: 'days',
          },
        ].map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {moodData.length >= 2 ? (
        <div className="sim-panel">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-slate-200">Pre vs Post-Session Mood</h4>
            <p className="text-xs text-slate-500">
              Affect trajectory across sessions — does practice improve your mood?
              Scale 1 (very low) to 7 (very high).
            </p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moodData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="postGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
              <YAxis domain={[1, 7]} ticks={[1, 2, 3, 4, 5, 6, 7]}
                tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
              <ReferenceLine y={4} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{ background: '#07111e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 10 }}
                formatter={(v: number, name: string) => [v, name === 'pre' ? 'Pre-mood' : 'Post-mood']}
              />
              <Line dataKey="pre"  stroke="#475569" strokeWidth={1.5} dot={false} name="pre"
                strokeDasharray="4 3" />
              <Line dataKey="post" stroke="#10B981" strokeWidth={2}   dot={{ r: 2.5 }} name="post" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-px bg-slate-500 inline-block" style={{ borderTop: '1px dashed' }} />
              Pre-mood
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-emerald inline-block rounded" />
              Post-mood
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              Dashed line = neutral (4)
            </span>
          </div>
        </div>
      ) : (
        <div className="sim-panel border border-dashed border-white/[0.06]">
          <h4 className="text-sm font-semibold text-slate-400 mb-1">Pre vs Post-Session Mood</h4>
          <p className="text-xs text-slate-600">
            Log mood in at least 2 sessions to see your affect trajectory.
          </p>
        </div>
      )}

      {qualityData.length > 0 ? (
        <div className="sim-panel">
          <h4 className="text-sm font-semibold text-slate-200 mb-1">Session Quality</h4>
          <p className="text-xs text-slate-500 mb-3">
            Focus and perceived progress per session (most recent 20) — 1–5 scale
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={qualityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]}
                tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }}
                formatter={(v: number, name: string) => [
                  `${v}/5`,
                  name === 'focus' ? 'Focus' : 'Progress',
                ]}
              />
              <Bar dataKey="focus"    fill="rgba(0,212,255,0.6)"  name="focus"    radius={[2, 2, 0, 0]} />
              <Bar dataKey="progress" fill="rgba(16,185,129,0.6)" name="progress" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(0,212,255,0.6)' }} />
              Focus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(16,185,129,0.6)' }} />
              Perceived Progress
            </span>
          </div>
        </div>
      ) : (
        <div className="sim-panel border border-dashed border-white/[0.06]">
          <h4 className="text-sm font-semibold text-slate-400 mb-1">Session Quality</h4>
          <p className="text-xs text-slate-600">
            Log focus or perceived progress in at least 1 session to see quality bars.
          </p>
        </div>
      )}

      <div className="sim-panel">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-semibold text-slate-200">Practice Consistency</span>
            <p className="text-xs text-slate-500 mt-0.5">% of calendar weeks containing ≥1 session</p>
          </div>
          <span className="font-mono text-emerald text-lg">{metrics.consistencyScore}%</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #10B981, #00D4FF)' }}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.consistencyScore}%` }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1.5">
          <span>0% — Sporadic</span>
          <span>50% — Regular</span>
          <span>100% — Daily</span>
        </div>
      </div>

      <div className="sim-panel">
        <button
          onClick={() => setShowResearch(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="text-left">
            <h4 className="text-sm font-semibold text-slate-200">Research Data Summary</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Descriptive statistics for sessions with full self-report data
              {research && ` (N = ${research.n})`}
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showResearch ? 'rotate-180' : ''}`} />
        </button>

        {showResearch && (
          <div className="mt-4 space-y-3">
            {!research ? (
              <p className="text-xs text-slate-500">
                Log at least 3 sessions with mood, focus, and progress data to generate research statistics.
              </p>
            ) : (
              <>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Values below are computed from N={research.n} sessions with complete self-report measures
                  (preMood, postMood, sessionFocus, perceivedProgress). Suitable for reporting in a research paper as
                  participant-level descriptive statistics.
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-[10px] text-slate-500 font-medium pb-1.5">Measure</th>
                      <th className="text-right text-[10px] text-slate-500 font-medium pb-1.5">M</th>
                      <th className="text-right text-[10px] text-slate-500 font-medium pb-1.5">SD</th>
                      <th className="text-right text-[10px] text-slate-500 font-medium pb-1.5">Scale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[
                      { label: 'Session duration (min)',  m: research.avgDuration, sd: research.durationSD,  scale: '5–180'    },
                      { label: 'Pre-session mood',        m: research.preMoodM,    sd: research.preMoodSD,   scale: '1–7'      },
                      { label: 'Post-session mood',       m: research.postMoodM,   sd: research.postMoodSD,  scale: '1–7'      },
                      { label: 'Affect change (Δmood)',   m: research.affectM,     sd: research.affectSD,    scale: '−6 to +6' },
                      { label: 'Session focus',           m: research.focusM,      sd: research.focusSD,     scale: '1–5'      },
                      { label: 'Perceived progress',      m: research.progressM,   sd: research.progressSD,  scale: '1–5'      },
                      ...(research.anxietyM
                        ? [{ label: 'Pre-session anxiety', m: research.anxietyM, sd: research.anxietySD, scale: '1–5' }]
                        : []),
                      ...(research.energyM
                        ? [{ label: 'Pre-session energy',  m: research.energyM,  sd: research.energySD,  scale: '1–5' }]
                        : []),
                      ...(research.sleepM
                        ? [{ label: 'Sleep quality',       m: research.sleepM,   sd: research.sleepSD,   scale: '1–5' }]
                        : []),
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="py-1.5 text-slate-400">{row.label}</td>
                        <td className="py-1.5 text-right font-mono text-slate-300">{row.m ?? '—'}</td>
                        <td className="py-1.5 text-right font-mono text-slate-500">{row.sd ?? '—'}</td>
                        <td className="py-1.5 text-right text-slate-600">{row.scale}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-1.5 text-slate-400">Full flow rate</td>
                      <td className="py-1.5 text-right font-mono text-slate-300">{research.flowPct}%</td>
                      <td className="py-1.5 text-right font-mono text-slate-500">—</td>
                      <td className="py-1.5 text-right text-slate-600">flowState = 3</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-[10px] text-slate-600 leading-relaxed mt-2">
                  All measures are single-item Likert-style self-reports collected immediately after each session.
                  Affect change (Δmood) = postMood − preMood; positive values indicate practice-associated mood improvement.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="sim-panel">
        <h4 className="text-sm font-semibold text-slate-200 mb-1">Export Your Data</h4>
        <p className="text-xs text-slate-500 mb-3">
          Download your raw session log for analysis in R, Python, SPSS, or Excel.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => downloadText(exportCSV(), `cognichord-sessions-${Date.now()}.csv`, 'text/csv')}
            className="btn-secondary flex items-center gap-2 text-xs py-2 px-4"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </button>
          <button
            onClick={() => downloadText(exportJSON(), `cognichord-sessions-${Date.now()}.json`, 'application/json')}
            className="btn-ghost flex items-center gap-2 text-xs py-2 px-4"
          >
            <Download className="w-3.5 h-3.5" /> Download JSON
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          CSV columns: id, date, instrument, duration_min, session_type, complexity, time_of_day,
          practice_context, pre_mood, pre_energy, pre_anxiety, sleep_quality, post_mood, session_focus,
          flow_state, perceived_progress, had_frustration, goals_met, affect_change, notes
        </p>
      </div>

    </div>
  );
}
