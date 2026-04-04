export type MusicalMode = 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian';
export type InstrumentType =
  | 'piano' | 'organ' | 'harpsichord' | 'synthesizer'
  | 'violin' | 'viola' | 'cello' | 'double bass'
  | 'guitar' | 'classical guitar' | 'bass' | 'harp' | 'ukulele' | 'banjo' | 'mandolin'
  | 'flute' | 'clarinet' | 'oboe' | 'bassoon' | 'saxophone'
  | 'trumpet' | 'trombone' | 'french horn' | 'tuba'
  | 'drums' | 'marimba' | 'voice';
export type RhythmPattern = 'steady' | 'syncopated' | 'triplet' | 'complex' | 'polyrhythm';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type PracticeContext = 'alone' | 'teacher' | 'group';
export type GoalsMet = 'yes' | 'partial' | 'no';

// ─── Simulator model types (unchanged, used in Lab page) ────────────────────

export interface DopamineParams {
  bpm: number;
  mode: MusicalMode;
  sessionDurationMin: number;
  complexity: number;
  novelty: number;
  practiceFrequency: number;
}

export interface DopaminePoint {
  time: number;
  dopamine: number;
  phasic: number;
  tonic: number;
  rpe: number;
}

export interface DopamineResult {
  trace: DopaminePoint[];
  peakDA: number;
  meanDA: number;
  rewardIndex: number;
  dopamineHalfLife: number;
  sessionSummary: string;
}

export interface BDNFParams {
  sessionDurationMin: number;
  complexity: number;
  frequencyPerWeek: number;
  totalWeeks: number;
  instrument: InstrumentType;
  /** Starting BDNF level (default 100 = baseline). Used when projecting forward from a real history. */
  initialBDNF?: number;
}

export interface BDNFPoint {
  day: number;
  bdnf: number;
  neuroplasticityIndex: number;
  hasPractice: boolean;
  synapticDensity: number;
}

export interface BDNFResult {
  trajectory: BDNFPoint[];
  finalNPI: number;
  peakBDNF: number;
  averageBDNF: number;
  densityGain: number;
}

export interface PlasticityParams {
  rhythmPattern: RhythmPattern;
  stimulationAmplitude: number;
  sessionDurationMin: number;
  practiceDays: number;
  restPeriodHours: number;
  /** Current BDNF level (a.u.). When elevated above 100 (baseline), lowers θ_M via TrkB signaling (Figurov et al. 1996). */
  bdnfLevel?: number;
}

export interface PlasticityPoint {
  time: number;
  weight: number;
  calcium: number;
  threshold: number;
  phase: 'LTP' | 'LTD' | 'neutral';
}

export interface PlasticityResult {
  curve: PlasticityPoint[];
  finalWeight: number;
  ltpEvents: number;
  ltdEvents: number;
  potentiationPercent: number;
  plasticityIndex: number;
  /** θ_M at session start, BDNF-adjusted when bdnfLevel is provided */
  initialThreshold: number;
}

export interface OscillationParams {
  bpm: number;
  complexity: number;
  instrument: InstrumentType;
  durationSec: number;
}

export interface BandPowers {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface OscillationPoint {
  time: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
  entrainment: number;
}

export interface OscillationResult {
  bandPowers: BandPowers;
  timeSeries: OscillationPoint[];
  entrainmentStrength: number;
  dominantFrequency: number;
  cognitiveEngagementIndex: number;
}

// ─── Practice session (self-reported, stored in Firebase + localStorage) ─────

export interface PracticeSession {
  id: string;
  userId?: string;
  date: string;
  instrument: InstrumentType;
  durationMin: number;
  sessionType: 'new_piece' | 'technique' | 'improvisation' | 'memory_recall' | 'performance';
  /** 1–5 technical difficulty of material practiced */
  complexity: number;
  notes?: string;

  // ── Pre-session context ─────────────────────────────────────────────────────
  timeOfDay?: TimeOfDay;
  practiceContext?: PracticeContext;
  /** 1–7: 1 = very negative, 4 = neutral, 7 = very positive  (single-item affect measure) */
  preMood?: number;
  /** 1–5 self-rated energy / alertness before session */
  preEnergy?: number;
  /** 1–5 music performance anxiety before session (1 = none, 5 = severe) */
  preAnxiety?: number;
  /** 1–5 subjective sleep quality the previous night */
  sleepQuality?: number;

  // ── Post-session outcomes ────────────────────────────────────────────────────
  /** 1–7 same scale as preMood; affect delta = postMood − preMood */
  postMood?: number;
  /** 1–5 attentional focus during session */
  sessionFocus?: number;
  /** 1 = no flow, 2 = partial flow, 3 = full flow state */
  flowState?: 1 | 2 | 3;
  /** 1–5 self-rated progress toward practice goals */
  perceivedProgress?: number;
  /** Did frustrating moments significantly disrupt the session? */
  hadFrustration?: boolean;
  goalsMet?: GoalsMet;
}

// ─── Aggregate metrics computed from logged sessions ─────────────────────────

export interface CumulativeMetrics {
  totalSessions: number;
  totalHours: number;
  weeklyFrequency: number;
  streakDays: number;
  longestStreak: number;
  /** 0–100: percentage of calendar weeks that contained ≥1 session */
  consistencyScore: number;
  /** Mean (postMood − preMood); null when <3 sessions have mood data */
  avgAffectChange: number | null;
  avgPreMood: number | null;
  avgPostMood: number | null;
  /** Mean sessionFocus (1–5); null when insufficient data */
  avgSessionFocus: number | null;
  /** Mean perceivedProgress (1–5); null when insufficient data */
  avgPerceivedProgress: number | null;
  /** % of sessions where flowState === 3 (full flow) */
  flowRate: number | null;
  /** Mean preAnxiety (1–5) */
  avgPreAnxiety: number | null;
}

// ─── Other shared types ───────────────────────────────────────────────────────

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

export interface BrainRegion {
  id: string;
  name: string;
  role: string;
  musicalFunction: string;
  activation: number;
}

export interface ResearchContribution {
  userId: string;
  sessions: number;
  avgDuration: number;
  instrument: InstrumentType;
  npiGain: number;
  weeklyFreq: number;
}

export interface AggregateInsight {
  metric: string;
  value: number;
  unit: string;
  significance: 'high' | 'medium' | 'low';
  description: string;
}
