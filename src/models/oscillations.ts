import type { OscillationParams, OscillationPoint, OscillationResult, BandPowers } from '../types';

const instrumentBetaFactor: Record<string, number> = {
  drums:          1.22,
  organ:          1.20,
  piano:          1.18,
  marimba:        1.17,
  harp:           1.16,
  violin:         1.15,
  viola:          1.15,
  cello:          1.14,
  'classical guitar': 1.14,
  harpsichord:    1.13,
  'french horn':  1.12,
  oboe:           1.12,
  synthesizer:    1.12,
  'double bass':  1.11,
  guitar:         1.11,
  mandolin:       1.10,
  flute:          1.10,
  bassoon:        1.10,
  clarinet:       1.09,
  saxophone:      1.09,
  voice:          1.08,
  trumpet:        1.08,
  trombone:       1.07,
  banjo:          1.07,
  bass:           1.06,
  tuba:           1.05,
  ukulele:        1.04,
};

const instrumentThetaFactor: Record<string, number> = {
  voice:          1.22,
  piano:          1.19,
  harpsichord:    1.18,
  harp:           1.18,
  'classical guitar': 1.16,
  organ:          1.16,
  violin:         1.16,
  viola:          1.15,
  cello:          1.14,
  flute:          1.14,
  oboe:           1.14,
  guitar:         1.13,
  'french horn':  1.13,
  clarinet:       1.13,
  saxophone:      1.13,
  marimba:        1.13,
  synthesizer:    1.08,
  bassoon:        1.11,
  mandolin:       1.11,
  trumpet:        1.09,
  trombone:       1.09,
  'double bass':  1.08,
  banjo:          1.06,
  bass:           1.06,
  tuba:           1.05,
  ukulele:        1.05,
  drums:          1.02,
};

function seededRNG(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

function computeBandPowers(
  bpm: number,
  complexity: number,
  instrument: string,
): BandPowers {
  const beatHz = bpm / 60;

  const deltaEntrainment = Math.exp(-Math.pow(beatHz - 1.8, 2) / (2 * 0.8 * 0.8));
  const delta = parseFloat((0.8 + 0.6 * deltaEntrainment).toFixed(3));

  const thetaFactor = instrumentThetaFactor[instrument] ?? 1.0;
  const thetaBase = 0.6 + 0.5 * (complexity / 5) * thetaFactor;
  const thetaBeats = [2, 3, 4].reduce((sum, mult) => {
    const harmHz = beatHz * mult;
    if (harmHz >= 4 && harmHz <= 8) {
      return sum + 0.3 * Math.exp(-Math.pow(harmHz - 6, 2) / 4);
    }
    return sum;
  }, 0);
  const theta = parseFloat(Math.min(2.0, thetaBase + thetaBeats).toFixed(3));

  const alphaSupp = 0.3 * (complexity / 5);
  const alpha = parseFloat(Math.max(0.3, 1.2 - alphaSupp).toFixed(3));

  const betaFactor = instrumentBetaFactor[instrument] ?? 1.0;
  const betaBase = 0.4 + 0.8 * betaFactor * (0.6 + 0.4 * (complexity / 5));
  const betaRebound = 0.2 * Math.exp(-Math.pow(beatHz - 2.5, 2) / 2);
  const beta = parseFloat(Math.min(2.2, betaBase + betaRebound).toFixed(3));

  const gammaBase = 0.3 + 0.9 * (complexity / 5);
  const thetaGammaCoupling = 0.4 * (theta / 1.5) * (complexity / 5);
  const gamma = parseFloat(Math.min(2.0, gammaBase + thetaGammaCoupling).toFixed(3));

  return { delta, theta, alpha, beta, gamma };
}

export function simulateOscillations(params: OscillationParams): OscillationResult {
  const { bpm, complexity, instrument, durationSec } = params;

  const rng = seededRNG(Math.round(bpm * 11 + complexity * 47 + durationSec * 7));

  const beatHz = bpm / 60;
  const steadyBandPowers = computeBandPowers(bpm, complexity, instrument);

  const numPoints = Math.min(300, Math.floor(durationSec));
  const dt = durationSec / numPoints;

  const timeSeries: OscillationPoint[] = [];

  let phaseTheta = rng() * Math.PI * 2;
  let phaseAlpha = rng() * Math.PI * 2;
  let phaseBeta  = rng() * Math.PI * 2;
  let phaseGamma = rng() * Math.PI * 2;

  const beatCoupling = 0.35 + 0.45 * Math.exp(-Math.pow(bpm - 120, 2) / (2 * 35 * 35));

  for (let i = 0; i < numPoints; i++) {
    const t = i * dt;
    const rampIn = 1 - Math.exp(-t / 8);

    phaseTheta += 2 * Math.PI * 6.0 * dt;
    phaseAlpha += 2 * Math.PI * 10.5 * dt;
    phaseBeta  += 2 * Math.PI * 20.0 * dt;
    phaseGamma += 2 * Math.PI * 40.0 * dt;

    const beatPhase = 2 * Math.PI * beatHz * t;
    const beatMod = beatCoupling * Math.cos(beatPhase);

    const noise = () => 0.06 * (rng() - 0.5);

    const thetaEnv = steadyBandPowers.theta * rampIn
      * (1 + 0.3 * Math.sin(phaseTheta) * (1 + 0.4 * beatMod)) + noise();

    const alphaEnv = steadyBandPowers.alpha * rampIn
      * (1 + 0.25 * Math.cos(phaseAlpha)) + noise();

    const betaEnv = steadyBandPowers.beta * rampIn
      * (1 + 0.35 * Math.sin(phaseBeta) * (1 + beatMod * 0.5)) + noise();

    const thetaGammaMod = 0.5 * (1 + Math.sin(phaseTheta));
    const gammaEnv = steadyBandPowers.gamma * rampIn
      * (1 + 0.4 * Math.sin(phaseGamma) * thetaGammaMod) + noise();

    const entrainment = rampIn * (0.4 + beatCoupling * Math.abs(Math.cos(phaseTheta - beatPhase)));

    timeSeries.push({
      time: parseFloat(t.toFixed(2)),
      theta: parseFloat(Math.max(0, thetaEnv).toFixed(3)),
      alpha: parseFloat(Math.max(0, alphaEnv).toFixed(3)),
      beta: parseFloat(Math.max(0, betaEnv).toFixed(3)),
      gamma: parseFloat(Math.max(0, gammaEnv).toFixed(3)),
      entrainment: parseFloat(Math.min(1, Math.max(0, entrainment)).toFixed(3)),
    });
  }

  const entrainmentValues = timeSeries.map(p => p.entrainment);
  const entrainmentStrength = parseFloat(
    (entrainmentValues.reduce((a, b) => a + b, 0) / entrainmentValues.length).toFixed(3)
  );

  const powers = steadyBandPowers;
  type BandName = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
  const bandNames: BandName[] = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
  const bandCenters: Record<BandName, number> = { delta: 2, theta: 6, alpha: 10, beta: 20, gamma: 45 };
  let maxBand: BandName = bandNames[0];
  for (const b of bandNames) {
    if (powers[b] > powers[maxBand]) maxBand = b;
  }
  const dominantFrequency = bandCenters[maxBand];

  const cognitiveEngagementIndex = parseFloat(Math.min(100,
    ((powers.theta * 25 + powers.beta * 20 + powers.gamma * 30) - powers.alpha * 15)
  ).toFixed(1));

  return {
    bandPowers: steadyBandPowers,
    timeSeries,
    entrainmentStrength,
    dominantFrequency,
    cognitiveEngagementIndex: Math.max(0, cognitiveEngagementIndex),
  };
}
