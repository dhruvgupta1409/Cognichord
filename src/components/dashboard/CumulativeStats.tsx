import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, Clock, Calendar, Zap, Brain, Activity, Flame, Target
} from 'lucide-react';
import { usePracticeStore } from '../../store/practiceStore';
import { simulateBDNF } from '../../models/bdnf';

export default function CumulativeStats() {
  const allSessions = usePracticeStore(s => s.sessions);
  const currentUserId = usePracticeStore(s => s.currentUserId);
  const getMetrics = usePracticeStore(s => s.getMetrics);

  const sessions = currentUserId
    ? allSessions.filter(s => s.userId === currentUserId)
    : [];

  const metrics = getMetrics();

  const bdnfPrediction = useMemo(() => {
    if (sessions.length === 0) return null;

    const instrument = sessions[0]?.instrument ?? 'piano';
    const avgDuration = sessions.reduce((a, s) => a + s.durationMin, 0) / sessions.length;
    const avgComplexity = sessions.reduce((a, s) => a + s.complexity, 0) / sessions.length;

    const result = simulateBDNF({
      sessionDurationMin: Math.round(avgDuration),
      complexity: Math.round(avgComplexity),
      frequencyPerWeek: Math.min(7, Math.round(metrics.weeklyFrequency)),
      totalWeeks: 8,
      instrument,
    });

    return result.trajectory;
  }, [sessions, metrics]);

  const sessionBars = useMemo(() =>
    sessions.slice(0, 20).reverse().map((s, i) => ({
      label: `S${i + 1}`,
      duration: s.durationMin,
      complexity: s.complexity * 10,
      bdnf: Math.round(
        Math.log1p(s.durationMin / 25) * (0.5 + s.complexity / 5) * 50
      ),
    })),
    [sessions]
  );

  const statCards = [
    { label: 'Total Sessions',    value: metrics.totalSessions.toString(),           color: '#00D4FF', icon: Calendar,   unit: 'logged'    },
    { label: 'Practice Hours',    value: metrics.totalHours.toFixed(1),               color: '#8B5CF6', icon: Clock,      unit: 'hours'     },
    { label: 'Weekly Frequency',  value: `${metrics.weeklyFrequency}×`,               color: '#10B981', icon: TrendingUp, unit: '/week'     },
    { label: 'Neuroplasticity',   value: `${metrics.currentNPI.toFixed(0)}`,          color: '#F59E0B', icon: Brain,      unit: '/ 100 NPI' },
    { label: 'Dopamine Index',    value: metrics.averageDopamineIndex.toFixed(1),     color: '#FF2D78', icon: Zap,        unit: 'avg score' },
    { label: 'Syn. Potentiation', value: `+${metrics.synapticPotentiation.toFixed(1)}%`, color: '#00D4FF', icon: Activity, unit: 'vs baseline'},
    { label: 'Current Streak',    value: `${metrics.streakDays}`,                     color: '#F59E0B', icon: Flame,      unit: 'days'      },
    { label: 'Best Streak',       value: `${metrics.longestStreak}`,                  color: '#10B981', icon: Target,     unit: 'days'      },
  ];

  if (sessions.length === 0) {
    return (
      <div className="sim-panel text-center py-12">
        <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No sessions logged yet.</p>
        <p className="text-slate-600 text-xs mt-1">Log your first practice session to see predictions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="sim-panel"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <div className="font-mono text-xl font-semibold mb-0.5" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs text-slate-600">{s.unit}</div>
            </motion.div>
          );
        })}
      </div>

      {bdnfPrediction && (
        <div className="sim-panel">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">BDNF Projection (8-week forecast)</h4>
              <p className="text-xs text-slate-500">
                Based on your avg {(sessions.reduce((a, s) => a + s.durationMin, 0) / sessions.length).toFixed(0)} min sessions
                at {metrics.weeklyFrequency}×/week (model‑predicted serum/tissue BDNF signal in arbitrary units)
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={bdnfPrediction} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} domain={[80, 'auto']} />
              <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 10 }} />
              <Area dataKey="bdnf" fill="url(#projGrad)" stroke="#10B981" strokeWidth={2} name="Predicted BDNF" type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="sim-panel">
        <h4 className="text-sm font-semibold text-slate-200 mb-1">Session History</h4>
        <p className="text-xs text-slate-500 mb-3">Duration and estimated BDNF per session (most recent 20)</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={sessionBars} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
            <Tooltip contentStyle={{ background: '#07111e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 10 }} />
            <Bar dataKey="duration" fill="rgba(0,212,255,0.6)" name="Duration (min)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="bdnf"     fill="rgba(16,185,129,0.6)"  name="BDNF Est."      radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="sim-panel">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-200">Neuroplasticity Index</span>
          <span className="font-mono text-emerald text-lg">{metrics.currentNPI.toFixed(0)} / 100</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #10B981, #00D4FF, #8B5CF6)' }}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.currentNPI}%` }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1.5">
          <span>0 — Untrained</span>
          <span>50 — Intermediate</span>
          <span>100 — Expert</span>
        </div>
      </div>
    </div>
  );
}
