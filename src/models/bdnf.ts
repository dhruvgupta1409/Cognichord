import type { BDNFParams, BDNFPoint, BDNFResult } from '../types';

const instrumentMotorFactor: Record<string, number> = {
  drums:          1.22,
  organ:          1.20,
  piano:          1.18,
  marimba:        1.17,
  harp:           1.17,
  synthesizer:    1.15,
  harpsichord:    1.14,
  violin:         1.15,
  viola:          1.14,
  cello:          1.13,
  'classical guitar': 1.13,
  flute:          1.12,
  saxophone:      1.12,
  oboe:           1.12,
  'french horn':  1.11,
  'double bass':  1.11,
  guitar:         1.11,
  mandolin:       1.10,
  bassoon:        1.10,
  clarinet:       1.09,
  trumpet:        1.08,
  banjo:          1.08,
  trombone:       1.07,
  bass:           1.06,
  tuba:           1.05,
  ukulele:        1.04,
  voice:          1.10,
};

const BDNF_HALF_LIFE_DAYS = 3.0;
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
  const rawDelta = durationFactor * complexityFactor * motorFactor * 11;
  return Math.min(SESSION_MAX_DELTA, rawDelta);
}

function neuroplasticityIndex(bdnf: number, sessionsToDate: number): number {
  const bdnfExcess = Math.max(0, (bdnf - BDNF_BASELINE) / BDNF_BASELINE);
  const expPart = 40 * (1 - Math.exp(-0.08 * sessionsToDate));
  const signal  = bdnfExcess * 90 + expPart;
  const npi = 100 * Math.exp(-5000 * Math.exp(-0.075 * signal));
  return parseFloat(npi.toFixed(1));
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
    bdnf = BDNF_BASELINE + (bdnf - BDNF_BASELINE) * Math.exp(-DECAY_CONSTANT);

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

    bdnf = Math.min(BDNF_BASELINE * 2.2, bdnf);

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
