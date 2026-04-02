import type { PlasticityParams, PlasticityPoint, PlasticityResult } from '../types';

const rhythmFrequencies: Record<string, number> = {
  steady:      1.5,
  syncopated:  2.2,
  triplet:     2.8,
  complex:     3.5,
  polyrhythm:  4.2,
};

const rhythmAmplitudes: Record<string, number> = {
  steady:      1.0,
  syncopated:  1.15,
  triplet:     1.2,
  complex:     1.3,
  polyrhythm:  1.45,
};

function seededRNG(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

function bcmPhi(v: number, theta_m: number): number {
  return v * (v - theta_m);
}

export function simulatePlasticity(params: PlasticityParams): PlasticityResult {
  const {
    rhythmPattern,
    stimulationAmplitude,
    sessionDurationMin,
    practiceDays,
    restPeriodHours,
  } = params;

  const rng = seededRNG(
    Math.round(stimulationAmplitude * 41 + sessionDurationMin * 17 + practiceDays * 53)
  );

  const baseFreq  = rhythmFrequencies[rhythmPattern] ?? 1.5;
  const baseAmp   = rhythmAmplitudes[rhythmPattern] ?? 1.0;
  const ampScale  = (stimulationAmplitude / 3) * baseAmp;

  const dt_sec    = 0.2;
  const totalSec  = sessionDurationMin * 60;
  const numSteps  = Math.floor(totalSec / dt_sec);
  const downsample = Math.max(1, Math.floor(numSteps / 300));

  let W       = 0.50;
  let Ca      = 0.0;
  let theta_m = 0.40;

  const tau_ca     = 0.08;
  const ca_amp     = ampScale * 3.5;

  const eta_ltp    = 0.0008;
  const eta_ltd    = 0.0004;
  const w_decay    = 0.00008;
  const theta_tau  = 80.0;

  const Ca_LTP = 1.8;
  const Ca_LTD = 0.6;

  let ltpEvents = 0;
  let ltdEvents = 0;

  const curve: PlasticityPoint[] = [];

  for (let step = 0; step < numSteps; step++) {
    const t = step * dt_sec;

    const jitter = 1 + 0.12 * (rng() - 0.5);
    const stim = ca_amp * Math.pow(
      Math.max(0, Math.sin(2 * Math.PI * baseFreq * t * jitter)),
      2
    );

    const dCa = -Ca / tau_ca + stim;
    Ca = Math.max(0, Ca + dCa * dt_sec);

    const phi = bcmPhi(Ca, theta_m);

    let dW: number;
    let phase: 'LTP' | 'LTD' | 'neutral' = 'neutral';
    if (Ca > Ca_LTP) {
      dW = eta_ltp * phi - w_decay * W;
      ltpEvents++;
      phase = 'LTP';
    } else if (Ca > Ca_LTD) {
      dW = eta_ltd * phi - w_decay * W;
      ltdEvents++;
      phase = 'LTD';
    } else {
      dW = -w_decay * W;
    }

    W = Math.max(0, Math.min(2.0, W + dW * dt_sec));

    const dTheta = (Ca * Ca - theta_m) / theta_tau;
    theta_m = Math.max(0.05, Math.min(2.5, theta_m + dTheta * dt_sec));

    if (step % downsample === 0) {
      curve.push({
        time: parseFloat((t / 60).toFixed(3)),
        weight: parseFloat(W.toFixed(4)),
        calcium: parseFloat(Math.min(Ca, 5).toFixed(4)),
        threshold: parseFloat(theta_m.toFixed(4)),
        phase,
      });
    }
  }

  const singleSessionGain = W - 0.5;
  let cumulativeW = 0.5;
  const restDecay = Math.exp(-Math.log(2) * (restPeriodHours / 18));
  for (let day = 0; day < practiceDays; day++) {
    cumulativeW += singleSessionGain * Math.pow(0.72, day);
    if (day < practiceDays - 1) cumulativeW *= restDecay;
  }
  cumulativeW = Math.max(0.5, Math.min(2.0, cumulativeW));

  const potentiationPercent = parseFloat(((cumulativeW - 0.5) / 0.5 * 100).toFixed(1));
  const plasticityIndex = parseFloat(Math.min(100, ltpEvents / (ltpEvents + ltdEvents + 1) * 100 * (cumulativeW / 2)).toFixed(1));

  return {
    curve,
    finalWeight: parseFloat(cumulativeW.toFixed(3)),
    ltpEvents,
    ltdEvents,
    potentiationPercent,
    plasticityIndex,
  };
}
