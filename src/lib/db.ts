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
}

export function submitSession(session: PracticeSession): void {
  push(ref(db, 'sessions'), {
    instrument: session.instrument,
    durationMin: session.durationMin,
    complexity: session.complexity,
    sessionType: session.sessionType,
    date: session.date,
    timestamp: Date.now(),
  });
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
