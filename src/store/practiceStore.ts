import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PracticeSession, CumulativeMetrics } from '../types';
import { submitSession } from '../lib/db';

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

function computeMetrics(sessions: PracticeSession[]): CumulativeMetrics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0, totalHours: 0, weeklyFrequency: 0,
      currentNPI: 0, cumulativeBDNF: 0, averageDopamineIndex: 0,
      synapticPotentiation: 0, streakDays: 0, longestStreak: 0,
    };
  }

  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((sum, s) => sum + s.durationMin / 60, 0);

  const dates = sessions.map(s => new Date(s.date).getTime()).sort((a, b) => a - b);
  const spanDays   = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24) + 1;
  const spanWeeks  = Math.max(1, spanDays / 7);
  const weeklyFrequency = parseFloat((totalSessions / spanWeeks).toFixed(1));

  const DECAY = Math.LN2 / 1.5;
  let bdnf = 100;
  let cumulativeBDNF = 0;
  let prevDate: Date | null = null;
  const sorted = [...sessions].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  for (const s of sorted) {
    const date = new Date(s.date);
    if (prevDate) {
      const daysDiff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      bdnf *= Math.exp(-DECAY * daysDiff);
    }
    const delta = Math.log1p(s.durationMin / 25) * (0.5 + s.complexity / 5) * 8.5;
    bdnf = Math.min(220, bdnf + delta);
    cumulativeBDNF += delta;
    prevDate = date;
  }

  const currentNPI = Math.min(100, ((bdnf - 100) / 100) * 120 + Math.min(40, totalSessions * 1.2));
  const averageDopamineIndex = parseFloat(Math.min(100,
    sessions.reduce((sum, s) => sum + (55 + s.complexity * 8 + (s.durationMin > 30 ? 10 : 0)), 0) / totalSessions
  ).toFixed(1));
  const synapticPotentiation = parseFloat(Math.min(80, cumulativeBDNF / 15).toFixed(1));

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

  return {
    totalSessions,
    totalHours:         parseFloat(totalHours.toFixed(1)),
    weeklyFrequency,
    currentNPI:         parseFloat(currentNPI.toFixed(1)),
    cumulativeBDNF:     parseFloat(cumulativeBDNF.toFixed(1)),
    averageDopamineIndex,
    synapticPotentiation,
    streakDays,
    longestStreak:      Math.max(streakDays, longestStreak),
  };
}

function toCSV(sessions: PracticeSession[]): string {
  const header = 'id,date,instrument,duration_min,session_type,complexity,notes';
  const rows = sessions.map(s =>
    [
      s.id,
      s.date,
      s.instrument,
      s.durationMin,
      s.sessionType,
      s.complexity,
      `"${(s.notes ?? '').replace(/"/g, '""')}"`,
    ].join(',')
  );
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
        if (get().contributeToResearch) {
          submitSession(fullSession);
        }
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
