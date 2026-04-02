import type { BDNFParams, BDNFPoint, BDNFResult } from '../types';

const instrumentMotorFactor: Record<string, number> = {
  piano:          1.35,
  organ:          1.32,
  harpsichord:    1.28,
  synthesizer:    1.05,
  violin:         1.40,
  viola:          1.38,
  cello:          1.33,
  'double bass':  1.20,
  guitar:         1.20,
  'classical guitar': 1.28,
  bass:           1.05,
  harp:           1.38,
  ukulele:        1.08,
  banjo:          1.15,
  mandolin:       1.22,
  flute:          1.28,
  clarinet:       1.25,
  oboe:           1.32,
  bassoon:        1.28,
  saxophone:      1.20,
  trumpet:        1.18,
  trombone:       1.15,
  'french horn':  1.26,
  tuba:           1.10,
  drums:          1.15,
  marimba:        1.25,
  voice:          0.90,
};

const BDNF_HALF_LIFE_DAYS = 1.5;
const DECAY_CONSTANT = Math.LN2 / BDNF_HALF_LIFE_DAYS;
const BDNF_BASELINE = 100;
const SESSION_MAX_DELTA = 32;

function sessionBDNFDelta(
  durationMin: number,
  complexity: number,
  instrument: string,
): number {
  const durationFactor = 1.2 * Math.log1p(durationMin / 25);
  const complexityFactor = 0.5 + (complexity / 5) * 1.2;
  const motorFactor = instrumentMotorFactor[instrument] ?? 1.0;
  const rawDelta = durationFactor * complexityFactor * motorFactor * 8.5;
  return Math.min(SESSION_MAX_DELTA, rawDelta);
}

function neuroplasticityIndex(bdnf: number, sessionsToDate: number): number {
  const bdnfComponent = Math.min(60, ((bdnf - BDNF_BASELINE) / BDNF_BASELINE) * 120);
  const experienceComponent = Math.min(40, sessionsToDate * 1.2);
  return Math.max(0, parseFloat((bdnfComponent + experienceComponent).toFixed(1)));
}

function synapticDensity(accumulatedBDNF: number, baseline: number): number {
  const maxDensityGain = 0.45;
  const k = 0.015;
  const densityGain = maxDensityGain * (1 - Math.exp(-k * accumulatedBDNF));
  return parseFloat((1.0 + densityGain).toFixed(4));
}

export function simulateBDNF(params: BDNFParams): BDNFResult {
  const {
    sessionDurationMin,
    complexity,
    frequencyPerWeek,
    totalWeeks,
    instrument,
  } = params;

  const totalDays = totalWeeks * 7;
  const deltaBDNF = sessionBDNFDelta(sessionDurationMin, complexity, instrument);

  const practiceDays = new Set<number>();
  for (let week = 0; week < totalWeeks; week++) {
    for (let s = 0; s < frequencyPerWeek; s++) {
      const dayOffset = Math.round((s / frequencyPerWeek) * 7);
      practiceDays.add(week * 7 + dayOffset);
    }
  }

  let bdnf = BDNF_BASELINE;
  let cumulativeExposure = 0;
  let sessionsCompleted = 0;
  const trajectory: BDNFPoint[] = [];

  for (let day = 0; day < totalDays; day++) {
    bdnf *= Math.exp(-DECAY_CONSTANT);

    const hasPractice = practiceDays.has(day);

    if (hasPractice) {
      const streakBonus = 1.0 + 0.08 * Math.min(sessionsCompleted, 12) / 12;
      bdnf += deltaBDNF * streakBonus;
      cumulativeExposure += deltaBDNF * streakBonus;
      sessionsCompleted++;
    }

    if (!hasPractice && sessionsCompleted > 0 && day < 30) {
      bdnf += 0.8;
    }

    bdnf = Math.max(BDNF_BASELINE * 0.8, Math.min(BDNF_BASELINE * 2.2, bdnf));

    trajectory.push({
      day,
      bdnf: parseFloat(bdnf.toFixed(2)),
      neuroplasticityIndex: neuroplasticityIndex(bdnf, sessionsCompleted),
      hasPractice,
      synapticDensity: synapticDensity(cumulativeExposure, BDNF_BASELINE),
    });
  }

  const bdnfValues = trajectory.map(p => p.bdnf);
  const peakBDNF   = parseFloat(Math.max(...bdnfValues).toFixed(2));
  const avgBDNF    = parseFloat((bdnfValues.reduce((a, b) => a + b, 0) / bdnfValues.length).toFixed(2));
  const finalNPI   = trajectory[trajectory.length - 1].neuroplasticityIndex;
  const finalDensity = trajectory[trajectory.length - 1].synapticDensity;
  const densityGain = parseFloat(((finalDensity - 1.0) * 100).toFixed(1));

  return {
    trajectory,
    finalNPI,
    peakBDNF,
    averageBDNF: avgBDNF,
    densityGain,
  };
}
