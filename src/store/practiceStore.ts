import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PracticeSession, CumulativeMetrics } from '../types';

interface PracticeStore {
  sessions: PracticeSession[];
  currentUserId: string;
  contributeToResearch: boolean;

  addSession: (session: Omit<PracticeSession, 'id' | 'userId'>) => void;
  removeSession: (id: string) => void;
  clearSessions: () => void;
  setUserId: (id: string) => void;
  setContributeToResearch: (v: boolean) => void;
  getMetrics: () => CumulativeMetrics;
  exportJSON: () => string;
  exportCSV: () => string;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeConsistencyScore(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0;
  const dates = sessions.map(s => new Date(s.date).getTime()).sort((a, b) => a - b);
  const spanDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24) + 1;
  const totalWeeksSpan = Math.max(1, Math.ceil(spanDays / 7));

  const weeksWithPractice = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.date);
    // ISO-like week key: year + week-of-year
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    const weekNum = Math.ceil(dayOfYear / 7);
    weeksWithPractice.add(`${d.getFullYear()}-W${weekNum}`);
  }
  return Math.min(100, Math.round((weeksWithPractice.size / totalWeeksSpan) * 100));
}

function computeMetrics(sessions: PracticeSession[]): CumulativeMetrics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0, totalHours: 0, weeklyFrequency: 0,
      streakDays: 0, longestStreak: 0, consistencyScore: 0,
      avgAffectChange: null, avgPreMood: null, avgPostMood: null,
      avgSessionFocus: null, avgPerceivedProgress: null,
      flowRate: null, avgPreAnxiety: null,
    };
  }

  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((sum, s) => sum + s.durationMin / 60, 0);

  const dates = sessions.map(s => new Date(s.date).getTime()).sort((a, b) => a - b);
  const spanDays   = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24) + 1;
  const spanWeeks  = Math.max(1, spanDays / 7);
  const weeklyFrequency = parseFloat((totalSessions / spanWeeks).toFixed(1));

  // ── Streak ────────────────────────────────────────────────────────────────
  const sessionDates = new Set(sessions.map(s => s.date.split('T')[0]));
  const today = new Date();
  let streakDays = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessionDates.has(d.toISOString().split('T')[0])) streakDays++;
    else if (i > 0) break;
  }

  const sortedDates = Array.from(sessionDates).sort();
  let longestStreak = 0;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    if ((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24) === 1) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }

  const consistencyScore = computeConsistencyScore(sessions);

  // ── Self-report metrics (null when <3 sessions have the field) ─────────────
  const MIN_N = 3;

  const withMoods       = sessions.filter(s => s.preMood != null && s.postMood != null);
  const withFocus       = sessions.filter(s => s.sessionFocus != null);
  const withProgress    = sessions.filter(s => s.perceivedProgress != null);
  const withFlow        = sessions.filter(s => s.flowState != null);
  const withAnxiety     = sessions.filter(s => s.preAnxiety != null);

  const avgAffectChange = withMoods.length >= MIN_N
    ? parseFloat(mean(withMoods.map(s => s.postMood! - s.preMood!)).toFixed(2))
    : null;

  const avgPreMood = withMoods.length >= MIN_N
    ? parseFloat(mean(withMoods.map(s => s.preMood!)).toFixed(2))
    : null;

  const avgPostMood = withMoods.length >= MIN_N
    ? parseFloat(mean(withMoods.map(s => s.postMood!)).toFixed(2))
    : null;

  const avgSessionFocus = withFocus.length >= MIN_N
    ? parseFloat(mean(withFocus.map(s => s.sessionFocus!)).toFixed(2))
    : null;

  const avgPerceivedProgress = withProgress.length >= MIN_N
    ? parseFloat(mean(withProgress.map(s => s.perceivedProgress!)).toFixed(2))
    : null;

  const flowRate = withFlow.length >= MIN_N
    ? parseFloat((withFlow.filter(s => s.flowState === 3).length / withFlow.length * 100).toFixed(1))
    : null;

  const avgPreAnxiety = withAnxiety.length >= MIN_N
    ? parseFloat(mean(withAnxiety.map(s => s.preAnxiety!)).toFixed(2))
    : null;

  return {
    totalSessions,
    totalHours:     parseFloat(totalHours.toFixed(1)),
    weeklyFrequency,
    streakDays,
    longestStreak:  Math.max(streakDays, longestStreak),
    consistencyScore,
    avgAffectChange,
    avgPreMood,
    avgPostMood,
    avgSessionFocus,
    avgPerceivedProgress,
    flowRate,
    avgPreAnxiety,
  };
}

function toCSV(sessions: PracticeSession[]): string {
  const header = [
    'id', 'date', 'instrument', 'duration_min', 'session_type', 'complexity',
    'time_of_day', 'practice_context',
    'pre_mood', 'pre_energy', 'pre_anxiety', 'sleep_quality',
    'post_mood', 'session_focus', 'flow_state', 'perceived_progress',
    'had_frustration', 'goals_met', 'affect_change',
    'notes',
  ].join(',');

  const rows = sessions.map(s => [
    s.id,
    s.date,
    s.instrument,
    s.durationMin,
    s.sessionType,
    s.complexity,
    s.timeOfDay  ?? '',
    s.practiceContext ?? '',
    s.preMood    ?? '',
    s.preEnergy  ?? '',
    s.preAnxiety ?? '',
    s.sleepQuality ?? '',
    s.postMood   ?? '',
    s.sessionFocus ?? '',
    s.flowState  ?? '',
    s.perceivedProgress ?? '',
    s.hadFrustration != null ? (s.hadFrustration ? '1' : '0') : '',
    s.goalsMet   ?? '',
    (s.preMood != null && s.postMood != null) ? (s.postMood - s.preMood) : '',
    `"${(s.notes ?? '').replace(/"/g, '""')}"`,
  ].join(','));

  return [header, ...rows].join('\n');
}

export const usePracticeStore = create<PracticeStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentUserId: '',
      contributeToResearch: false,

      addSession: (session) => {
        const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const userId = get().currentUserId;
        const fullSession = { ...session, id, userId };
        set(state => ({
          sessions: [fullSession, ...state.sessions],
        }));
      },

      removeSession: (id) => {
        set(state => ({ sessions: state.sessions.filter(s => s.id !== id) }));
      },

      clearSessions: () => {
        const uid = get().currentUserId;
        set(state => ({
          sessions: uid
            ? state.sessions.filter(s => s.userId !== uid)
            : [],
        }));
      },

      setUserId: (id) => set({ currentUserId: id.trim() }),

      setContributeToResearch: (v) => set({ contributeToResearch: v }),

      getMetrics: () => {
        const { sessions, currentUserId } = get();
        const mine = currentUserId
          ? sessions.filter(s => s.userId === currentUserId)
          : sessions;
        return computeMetrics(mine);
      },

      exportJSON: () => {
        const { sessions, currentUserId } = get();
        const mine = currentUserId ? sessions.filter(s => s.userId === currentUserId) : sessions;
        return JSON.stringify(mine, null, 2);
      },

      exportCSV: () => {
        const { sessions, currentUserId } = get();
        const mine = currentUserId ? sessions.filter(s => s.userId === currentUserId) : sessions;
        return toCSV(mine);
      },
    }),
    {
      name: 'cognichord-practice-log',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        currentUserId: state.currentUserId,
        contributeToResearch: state.contributeToResearch,
      }),
    }
  )
);
