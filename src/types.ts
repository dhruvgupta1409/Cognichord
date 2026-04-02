export type MusicalMode = 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian';
export type InstrumentType =
  | 'piano' | 'organ' | 'harpsichord' | 'synthesizer'
  | 'violin' | 'viola' | 'cello' | 'double bass'
  | 'guitar' | 'classical guitar' | 'bass' | 'harp' | 'ukulele' | 'banjo' | 'mandolin'
  | 'flute' | 'clarinet' | 'oboe' | 'bassoon' | 'saxophone'
  | 'trumpet' | 'trombone' | 'french horn' | 'tuba'
  | 'drums' | 'marimba' | 'voice';
export type RhythmPattern = 'steady' | 'syncopated' | 'triplet' | 'complex' | 'polyrhythm';

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

export interface PracticeSession {
  id: string;
  userId?: string;
  date: string;
  instrument: InstrumentType;
  durationMin: number;
  sessionType: 'new_piece' | 'technique' | 'improvisation' | 'memory_recall' | 'performance';
  complexity: number;
  notes?: string;
  predictedBDNF?: number;
  predictedDA?: number;
  predictedLTP?: number;
}

export interface CumulativeMetrics {
  totalSessions: number;
  totalHours: number;
  weeklyFrequency: number;
  currentNPI: number;
  cumulativeBDNF: number;
  averageDopamineIndex: number;
  synapticPotentiation: number;
  streakDays: number;
  longestStreak: number;
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
