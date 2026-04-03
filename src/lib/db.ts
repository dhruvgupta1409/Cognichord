import { ref, push, onValue, type DataSnapshot } from 'firebase/database';
import { db } from './firebase';
import type { PracticeSession } from '../types';

export interface CommunitySession {
  instrument: string;
  durationMin: number;
  complexity: number;
  sessionType: string;
  date: string;
  timestamp: number;
  // Self-report fields (optional — older records won't have them)
  timeOfDay?: string;
  practiceContext?: string;
  preMood?: number;
  preEnergy?: number;
  preAnxiety?: number;
  sleepQuality?: number;
  postMood?: number;
  sessionFocus?: number;
  flowState?: number;
  perceivedProgress?: number;
  hadFrustration?: boolean;
  goalsMet?: string;
}

export function submitSession(session: PracticeSession): void {
  const payload: Record<string, unknown> = {
    instrument:    session.instrument,
    durationMin:   session.durationMin,
    complexity:    session.complexity,
    sessionType:   session.sessionType,
    date:          session.date,
    timestamp:     Date.now(),
  };

  // Include self-report fields when present
  if (session.timeOfDay      != null) payload.timeOfDay      = session.timeOfDay;
  if (session.practiceContext != null) payload.practiceContext = session.practiceContext;
  if (session.preMood         != null) payload.preMood         = session.preMood;
  if (session.preEnergy       != null) payload.preEnergy       = session.preEnergy;
  if (session.preAnxiety      != null) payload.preAnxiety      = session.preAnxiety;
  if (session.sleepQuality    != null) payload.sleepQuality    = session.sleepQuality;
  if (session.postMood        != null) payload.postMood        = session.postMood;
  if (session.sessionFocus    != null) payload.sessionFocus    = session.sessionFocus;
  if (session.flowState       != null) payload.flowState       = session.flowState;
  if (session.perceivedProgress != null) payload.perceivedProgress = session.perceivedProgress;
  if (session.hadFrustration  != null) payload.hadFrustration  = session.hadFrustration;
  if (session.goalsMet        != null) payload.goalsMet        = session.goalsMet;

  push(ref(db, 'sessions'), payload);
}

export function subscribeCommunitySession(
  callback: (sessions: CommunitySession[]) => void
): () => void {
  const sessionsRef = ref(db, 'sessions');
  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    callback(Object.values(data) as CommunitySession[]);
  };
  return onValue(sessionsRef, handler);
}
