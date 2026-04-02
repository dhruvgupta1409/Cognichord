import type { DopamineParams, DopaminePoint, DopamineResult } from '../types';

function makeRNG(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

function bpmRewardFactor(bpm: number): number {
  const optimal = 122;
  const sigma = 38;
  return 0.55 + 0.75 * Math.exp(-Math.pow(bpm - optimal, 2) / (2 * sigma * sigma));
}

const modeFactors: Record<string, number> = {
  major:      1.18,
  lydian:     1.22,
  mixolydian: 1.10,
  dorian:     0.98,
  minor:      0.87,
  phrygian:   0.79,
};

function eventsPerMinute(bpm: number, complexity: number): number {
  const barDuration = 4 * (60 / bpm);
  const cadenceRate = 60 / (6 * barDuration);
  const surpriseRate = (complexity / 5) * 1.5;
  return cadenceRate + surpriseRate;
}

export function simulateDopamine(params: DopamineParams): DopamineResult {
  const {
    bpm,
    mode,
    sessionDurationMin,
    complexity,
    novelty,
    practiceFrequency,
  } = params;

  const rng = makeRNG(
    Math.round(bpm * 13 + sessionDurationMin * 7 + complexity * 31 + novelty * 97)
  );

  const numPoints = 200;
  const dt = sessionDurationMin / numPoints;

  const bpmFactor    = bpmRewardFactor(bpm);
  const modeFactor   = modeFactors[mode] ?? 1.0;
  const eventRate    = eventsPerMinute(bpm, complexity);
  const habituation  = 1 - 0.35 * (1 - novelty);

  const tauReuptake = 6.5;

  const tonicBaseline = 1.0 + 0.12 * Math.min(practiceFrequency / 7, 1);

  const trace: DopaminePoint[] = [];

  const eventTimes: number[] = [];
  let t = rng() * (60 / eventRate / 60);
  while (t < sessionDurationMin) {
    eventTimes.push(t);
    t += (1 / eventRate) * (0.7 + 0.6 * rng());
  }

  for (let i = 0; i < numPoints; i++) {
    const time = i * dt;

    const rampFactor = 1 - Math.exp(-time / 8);
    const tonic = tonicBaseline * modeFactor * bpmFactor * rampFactor;

    let phasicSum = 0;
    for (const ev of eventTimes) {
      const delta = time - ev;
      if (delta >= 0 && delta < 12) {
        const burstAmp = novelty * habituation * bpmFactor * (0.8 + 0.5 * rng());
        phasicSum += burstAmp * Math.exp(-delta / tauReuptake);
      }
    }

    const rpe = (phasicSum > 0)
      ? phasicSum * (1 - 0.6 * (time / sessionDurationMin))
      : 0;

    const noise = 0.04 * (rng() - 0.5) * 2;

    const dopamine = tonic + phasicSum + noise;

    trace.push({
      time: parseFloat(time.toFixed(2)),
      dopamine: parseFloat(Math.max(0.1, dopamine).toFixed(3)),
      phasic: parseFloat(Math.max(0, phasicSum).toFixed(3)),
      tonic: parseFloat(tonic.toFixed(3)),
      rpe: parseFloat(Math.max(0, rpe).toFixed(3)),
    });
  }

  const daValues = trace.map(p => p.dopamine);
  const peakDA   = parseFloat(Math.max(...daValues).toFixed(3));
  const meanDA   = parseFloat((daValues.reduce((a, b) => a + b, 0) / daValues.length).toFixed(3));
  const rewardIndex = parseFloat(((peakDA * meanDA * novelty * bpmFactor * 20)).toFixed(1));

  const summary = buildSummary(peakDA, meanDA, bpmFactor, mode, complexity);

  return {
    trace,
    peakDA,
    meanDA,
    rewardIndex: Math.min(100, rewardIndex),
    dopamineHalfLife: parseFloat(tauReuptake.toFixed(1)),
    sessionSummary: summary,
  };
}

function buildSummary(peak: number, mean: number, bpmFactor: number, mode: string, complexity: number): string {
  const engagement = mean > 1.3 ? 'high' : mean > 1.1 ? 'moderate' : 'low';
  const tempo = bpmFactor > 0.9 ? 'near-optimal' : bpmFactor > 0.7 ? 'sub-optimal' : 'subthreshold';
  return `${mode.charAt(0).toUpperCase() + mode.slice(1)}-mode stimulus at ${tempo} tempo produced ${engagement} mesolimbic engagement. Peak phasic DA: ×${peak.toFixed(2)} baseline. Complexity ${complexity}/5 contributed ${(complexity * 0.15).toFixed(2)} events/min.`;
}
