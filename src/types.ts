export type InstrumentType =
  | 'piano' | 'organ' | 'harpsichord' | 'synthesizer'
  | 'violin' | 'viola' | 'cello' | 'double bass'
  | 'guitar' | 'classical guitar' | 'bass' | 'harp' | 'ukulele' | 'banjo' | 'mandolin'
  | 'flute' | 'clarinet' | 'oboe' | 'bassoon' | 'saxophone'
  | 'trumpet' | 'trombone' | 'french horn' | 'tuba'
  | 'drums' | 'marimba' | 'voice';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type PracticeContext = 'alone' | 'teacher' | 'group';
export type GoalsMet = 'yes' | 'partial' | 'no';

export interface PracticeSession {
  id: string;
  userId?: string;
  date: string;
  instrument: InstrumentType;
  durationMin: number;
  sessionType: 'new_piece' | 'technique' | 'improvisation' | 'memory_recall' | 'performance';
  complexity: number;
  notes?: string;

  timeOfDay?: TimeOfDay;
  practiceContext?: PracticeContext;
  preMood?: number;
  preEnergy?: number;
  preAnxiety?: number;
  sleepQuality?: number;

  postMood?: number;
  sessionFocus?: number;
  flowState?: 1 | 2 | 3;
  perceivedProgress?: number;
  hadFrustration?: boolean;
  goalsMet?: GoalsMet;
}

export interface CumulativeMetrics {
  totalSessions: number;
  totalHours: number;
  weeklyFrequency: number;
  streakDays: number;
  longestStreak: number;
  consistencyScore: number;
  avgAffectChange: number | null;
  avgPreMood: number | null;
  avgPostMood: number | null;
  avgSessionFocus: number | null;
  avgPerceivedProgress: number | null;
  flowRate: number | null;
  avgPreAnxiety: number | null;
}

export interface Neurotransmitter {
  id: string;
  name: string;
  formula: string;
  color: string;
  glow: string;
  function: string;
  musicalRole: string;
  brainRegions: string[];
  halfLife: string;
  keyPathway: string;
  insight: string;
}
