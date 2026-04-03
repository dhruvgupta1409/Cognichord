import type { InstrumentType, MusicalMode } from '../types';

// ─── Instrument motor-complexity factors ────────────────────────────────────
// Derived from literature on bimanual coordination demands and fine-motor
// requirements (Bangert & Schlaug, 2006; Wan & Schlaug, 2010). Values are
// modelling approximations scaled to [0.90, 1.40].
const MOTOR_FACTOR: Record<string, number> = {
  piano: 1.35, organ: 1.32, harpsichord: 1.28, synthesizer: 1.05,
  violin: 1.40, viola: 1.38, cello: 1.33, 'double bass': 1.20,
  guitar: 1.20, 'classical guitar': 1.28, bass: 1.05, harp: 1.38,
  ukulele: 1.08, banjo: 1.15, mandolin: 1.22,
  flute: 1.28, clarinet: 1.25, oboe: 1.32, bassoon: 1.28, saxophone: 1.20,
  trumpet: 1.18, trombone: 1.15, 'french horn': 1.26, tuba: 1.10,
  drums: 1.15, marimba: 1.25, voice: 0.90,
};

// ─── Mode × dopamine factors ─────────────────────────────────────────────────
// Based on the consistent finding that major-mode music is rated as more
// positive/arousing than minor-mode music (Juslin & Laukka, 2004; Dalla Bella
// et al., 2001). Lydian > major > mixolydian > dorian > minor > phrygian
// reflects the emotional valence ordering across modes in the music affect
// literature. Scaling is a modelling choice; relative order is theory-grounded.
const MODE_DA_FACTOR: Record<string, number> = {
  major: 1.18, lydian: 1.22, mixolydian: 1.10,
  dorian: 0.98, minor: 0.87, phrygian: 0.79,
};

const ALL_INSTRUMENTS: InstrumentType[] = [
  'piano', 'violin', 'guitar', 'drums', 'voice', 'cello',
  'flute', 'clarinet', 'saxophone', 'trumpet', 'viola', 'oboe',
  'trombone', 'harp', 'organ', 'french horn', 'marimba',
  'ukulele', 'mandolin', 'double bass', 'bassoon', 'bass', 'classical guitar',
];

const ALL_MODES: MusicalMode[] = ['major', 'minor', 'dorian', 'mixolydian', 'lydian', 'phrygian'];

// Deterministic LCG PRNG (seed = 2025) — same output every page load.
function makeLCG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─── SimSession interface ────────────────────────────────────────────────────
export interface SimSession {
  instrument: InstrumentType;
  durationMin: number;
  complexity: number;        // 1–5
  frequencyPerWeek: number;  // 1–7
  mode: MusicalMode;
  bpm: number;               // 60–180
  novelty: number;           // 0.2–1.0 (proportion of repertoire that is new)
  npi: number;               // Neuroplasticity Index 0–100 (BDNF model output)
  bdnfDelta: number;         // BDNF-like signal above baseline (a.u.)
  dopamineIndex: number;     // Dopamine reward index 0–100 (RPE model output)
}

// ─── BDNF / NPI model ────────────────────────────────────────────────────────
// Inspired by the exercise–BDNF relationship (Gomez-Pinilla & Hillman, 2013).
// Two-compartment: per-session BDNF pulse (deltaB) decays exponentially between
// sessions (half-life chosen for the model signal, not plasma BDNF kinetics).
// NPI combines a BDNF-derived plasticity term with a cumulative-sessions term.
//
// Equation: ΔBDNF = C·log(1 + T/25)·(0.5 + k/5)·M  (capped at 32 a.u.)
//   where T = duration (min), k = complexity/5, M = instrument motor factor
// NPI = min(60, (bdnf−100)/100 · 120) + min(40, N_sessions · 1.2)
export function fastBDNF(
  durationMin: number,
  complexity: number,
  frequencyPerWeek: number,
  instrument: string,
): { npi: number; bdnfDelta: number } {
  const DECAY = Math.LN2 / 1.5;          // model half-life = 1.5 days
  const motorFactor    = MOTOR_FACTOR[instrument] ?? 1.0;
  const durationFactor = 1.2 * Math.log1p(durationMin / 25);
  const complexityFactor = 0.5 + (complexity / 5) * 1.2;
  const deltaBDNF = Math.min(32, durationFactor * complexityFactor * motorFactor * 8.5);

  // Schedule practice days over 4 weeks
  const practiceDays = new Set<number>();
  for (let week = 0; week < 4; week++) {
    for (let s = 0; s < frequencyPerWeek; s++) {
      practiceDays.add(Math.round(week * 7 + (s * 7 / frequencyPerWeek)));
    }
  }

  let bdnf = 100;               // baseline = 100 a.u.
  let sessionsCompleted = 0;
  for (let day = 0; day < 28; day++) {
    bdnf *= Math.exp(-DECAY);
    if (practiceDays.has(day)) {
      const streakBonus = 1 + 0.08 * Math.min(sessionsCompleted, 12) / 12;
      bdnf = Math.min(220, bdnf + deltaBDNF * streakBonus);
      sessionsCompleted++;
    }
    // Small consolidation uplift on rest days in first fortnight
    if (!practiceDays.has(day) && sessionsCompleted > 0 && day < 14) bdnf += 0.8;
    bdnf = Math.max(80, bdnf);
  }

  const npi = Math.max(0, Math.min(100,
    Math.min(60, ((bdnf - 100) / 100) * 120) + Math.min(40, sessionsCompleted * 1.2),
  ));

  return {
    npi:       parseFloat(npi.toFixed(1)),
    bdnfDelta: parseFloat((bdnf - 100).toFixed(1)),
  };
}

// ─── Dopamine reward model ────────────────────────────────────────────────────
// Inspired by the Schultz (1998) reward prediction error (RPE) framework and
// Witek et al. (2014) groove/BPM data. BPM effect: inverted-U with peak ~122 BPM
// (Gaussian kernel σ = 38). Mode effect: see MODE_DA_FACTOR above. Novelty
// drives dopamine via RPE — unexpected/new stimuli elicit stronger phasic DA.
export function fastDopamine(
  bpm: number,
  mode: string,
  complexity: number,
  novelty: number,
): number {
  const bpmFactor   = 0.55 + 0.75 * Math.exp(-Math.pow(bpm - 122, 2) / (2 * 38 * 38));
  const modeFactor  = MODE_DA_FACTOR[mode] ?? 1.0;
  const peakDA  = 1.0 + novelty * bpmFactor * 2.0 * (complexity / 5) * modeFactor;
  const meanDA  = 1.0 + (bpmFactor * modeFactor - 1) * 0.5 + novelty * 0.3;
  return parseFloat(Math.min(100, peakDA * meanDA * novelty * bpmFactor * 20).toFixed(1));
}

// ─── Convert a real practice session to a SimSession ─────────────────────────
// Used by the Research page to optionally overlay user-logged sessions on the
// simulation charts. Mode, BPM, and novelty are not tracked in the practice log,
// so representative defaults are used (major, 120 BPM, moderate novelty = 0.5).
export function sessionToSimSession(
  instrument: string,
  durationMin: number,
  complexity: number,
  frequencyPerWeek: number = 4,
  mode: string = 'major',
  bpm: number = 120,
  novelty: number = 0.5,
): SimSession {
  const { npi, bdnfDelta } = fastBDNF(durationMin, complexity, frequencyPerWeek, instrument);
  const dopamineIndex = fastDopamine(bpm, mode, complexity, novelty);
  return {
    instrument: instrument as InstrumentType,
    durationMin,
    complexity,
    frequencyPerWeek,
    mode: mode as MusicalMode,
    bpm,
    novelty,
    npi,
    bdnfDelta,
    dopamineIndex,
  };
}

// ─── Generate the 5,000-session dataset ──────────────────────────────────────
// Parameters are uniformly sampled using a deterministic LCG (seed = 2025):
//   instrument  — uniform over 23 instruments
//   durationMin — uniform [15, 120] min
//   complexity  — uniform integer [1, 5]
//   freq        — uniform integer [1, 7] sessions/week
//   mode        — uniform over 6 modes
//   bpm         — uniform [60, 180]
//   novelty     — uniform [0.20, 1.00]
let _cache: SimSession[] | null = null;

export function getSimulatedSessions(): SimSession[] {
  if (_cache) return _cache;

  const rng = makeLCG(2025);
  const sessions: SimSession[] = [];

  for (let i = 0; i < 5000; i++) {
    const instrument  = ALL_INSTRUMENTS[Math.floor(rng() * ALL_INSTRUMENTS.length)];
    const durationMin = Math.round(15 + rng() * 105);
    const complexity  = Math.round(1 + rng() * 4);
    const freq        = Math.round(1 + rng() * 6);
    const mode        = ALL_MODES[Math.floor(rng() * ALL_MODES.length)];
    const bpm         = Math.round(60 + rng() * 120);
    const novelty     = parseFloat((0.2 + rng() * 0.8).toFixed(3));

    const { npi, bdnfDelta } = fastBDNF(durationMin, complexity, freq, instrument);
    const dopamineIndex = fastDopamine(bpm, mode, complexity, novelty);

    sessions.push({ instrument, durationMin, complexity, frequencyPerWeek: freq, mode, bpm, novelty, npi, bdnfDelta, dopamineIndex });
  }

  _cache = sessions;
  return sessions;
}

// ─── Aggregate functions ─────────────────────────────────────────────────────

export function aggregateByInstrument(sessions: SimSession[]) {
  const map = new Map<string, { npi: number; bdnf: number; da: number; n: number }>();
  for (const s of sessions) {
    const e = map.get(s.instrument) ?? { npi: 0, bdnf: 0, da: 0, n: 0 };
    map.set(s.instrument, { npi: e.npi + s.npi, bdnf: e.bdnf + s.bdnfDelta, da: e.da + s.dopamineIndex, n: e.n + 1 });
  }
  return Array.from(map.entries())
    .map(([inst, d]) => ({
      instrument: inst.replace(/\b\w/g, c => c.toUpperCase()),
      avgNPI:  parseFloat((d.npi  / d.n).toFixed(1)),
      avgBDNF: parseFloat((d.bdnf / d.n + 100).toFixed(1)),
      avgDA:   parseFloat((d.da   / d.n).toFixed(1)),
      sessions: d.n,
    }))
    .sort((a, b) => b.avgNPI - a.avgNPI)
    .slice(0, 14);
}

export function aggregateByFrequency(sessions: SimSession[]) {
  const map = new Map<number, { npi: number; n: number }>();
  for (const s of sessions) {
    const e = map.get(s.frequencyPerWeek) ?? { npi: 0, n: 0 };
    map.set(s.frequencyPerWeek, { npi: e.npi + s.npi, n: e.n + 1 });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([freq, d]) => ({
      label: `${freq}×`,
      freq,
      avgNPI: parseFloat((d.npi / d.n).toFixed(1)),
      sessions: d.n,
    }));
}

export function aggregateByDuration(sessions: SimSession[]) {
  const buckets = [15, 30, 45, 60, 90, 120];
  const map = new Map<number, { bdnf: number; n: number }>();
  for (const b of buckets) map.set(b, { bdnf: 0, n: 0 });

  for (const s of sessions) {
    let closest = buckets[0];
    let minDiff = Math.abs(s.durationMin - buckets[0]);
    for (const b of buckets) {
      const diff = Math.abs(s.durationMin - b);
      if (diff < minDiff) { minDiff = diff; closest = b; }
    }
    const e = map.get(closest)!;
    map.set(closest, { bdnf: e.bdnf + s.bdnfDelta, n: e.n + 1 });
  }

  return buckets.map(b => {
    const d = map.get(b)!;
    return {
      label: `${b} min`,
      duration: b,
      avgBDNF: d.n > 0 ? parseFloat((d.bdnf / d.n + 100).toFixed(1)) : 100,
      sessions: d.n,
    };
  });
}

export function aggregateByComplexity(sessions: SimSession[]) {
  const map = new Map<number, { npi: number; da: number; n: number }>();
  for (const s of sessions) {
    const e = map.get(s.complexity) ?? { npi: 0, da: 0, n: 0 };
    map.set(s.complexity, { npi: e.npi + s.npi, da: e.da + s.dopamineIndex, n: e.n + 1 });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([c, d]) => ({
      complexity: c,
      label: `Level ${c}`,
      avgNPI: parseFloat((d.npi / d.n).toFixed(1)),
      avgDA:  parseFloat((d.da  / d.n).toFixed(1)),
      sessions: d.n,
    }));
}

// Musical mode → mean Dopamine Index.
// Sorted darkest→brightest (Phrygian→Lydian) to visually reflect emotional valence.
export function aggregateByMode(sessions: SimSession[]) {
  const map = new Map<string, { da: number; n: number }>();
  for (const s of sessions) {
    const e = map.get(s.mode) ?? { da: 0, n: 0 };
    map.set(s.mode, { da: e.da + s.dopamineIndex, n: e.n + 1 });
  }
  const MODE_ORDER = ['phrygian', 'minor', 'dorian', 'mixolydian', 'major', 'lydian'];
  return MODE_ORDER
    .filter(m => map.has(m))
    .map(m => {
      const d = map.get(m)!;
      return {
        mode:    m.charAt(0).toUpperCase() + m.slice(1),
        rawMode: m,
        avgDA:   parseFloat((d.da / d.n).toFixed(1)),
        sessions: d.n,
      };
    });
}

// Tempo (BPM) → mean Dopamine Index.
// The model shows an inverted-U peaking near 122 BPM, consistent with
// groove research (Witek et al., 2014) showing optimal groove around
// 120–130 BPM for most genres.
export function aggregateByBPM(sessions: SimSession[]) {
  const buckets = [
    { label: '<80',      min: 0,   max: 80  },
    { label: '80–100',   min: 80,  max: 100 },
    { label: '100–120',  min: 100, max: 120 },
    { label: '120–140',  min: 120, max: 140 },
    { label: '140–160',  min: 140, max: 160 },
    { label: '>160',     min: 160, max: Infinity },
  ];
  const map = new Map(buckets.map(b => [b.label, { da: 0, n: 0 }]));
  for (const s of sessions) {
    const b = buckets.find(b => s.bpm >= b.min && s.bpm < b.max);
    if (!b) continue;
    const e = map.get(b.label)!;
    map.set(b.label, { da: e.da + s.dopamineIndex, n: e.n + 1 });
  }
  return buckets.map(b => {
    const d = map.get(b.label)!;
    return { label: b.label, avgDA: d.n > 0 ? parseFloat((d.da / d.n).toFixed(1)) : 0, sessions: d.n };
  });
}

// Novelty → mean Dopamine Index.
// Novelty drives dopamine via reward prediction error (Schultz, 1998; Barto, 2013).
// Higher proportion of new/unfamiliar repertoire → larger RPE → stronger phasic DA.
export function aggregateByNovelty(sessions: SimSession[]) {
  const buckets = [
    { label: 'Low (0.2–0.4)',       min: 0.2,  max: 0.4  },
    { label: 'Moderate (0.4–0.6)',  min: 0.4,  max: 0.6  },
    { label: 'High (0.6–0.8)',      min: 0.6,  max: 0.8  },
    { label: 'Very High (0.8–1.0)', min: 0.8,  max: 1.01 },
  ];
  const map = new Map(buckets.map(b => [b.label, { da: 0, n: 0 }]));
  for (const s of sessions) {
    const b = buckets.find(b => s.novelty >= b.min && s.novelty < b.max);
    if (!b) continue;
    const e = map.get(b.label)!;
    map.set(b.label, { da: e.da + s.dopamineIndex, n: e.n + 1 });
  }
  return buckets.map(b => {
    const d = map.get(b.label)!;
    return { label: b.label, avgDA: d.n > 0 ? parseFloat((d.da / d.n).toFixed(1)) : 0, sessions: d.n };
  });
}

export function npiHistogram(sessions: SimSession[]) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${(i + 1) * 10}`,
    min: i * 10, max: (i + 1) * 10, count: 0,
  }));
  for (const s of sessions) {
    const idx = Math.min(9, Math.floor(s.npi / 10));
    buckets[idx].count++;
  }
  return buckets;
}

// ─── CSV export of full simulation dataset ───────────────────────────────────
// Exports all sessions with every input and output parameter.
// Suitable for import into R, Python/pandas, or SPSS for statistical analysis.
// Columns: instrument, duration_min, complexity, frequency_per_week, mode,
//          bpm, novelty, npi, bdnf_delta_au, dopamine_index
export function exportSimCSV(sessions: SimSession[]): string {
  const header = [
    'instrument', 'duration_min', 'complexity', 'frequency_per_week',
    'mode', 'bpm', 'novelty', 'npi', 'bdnf_delta_au', 'dopamine_index',
  ].join(',');
  const rows = sessions.map(s => [
    s.instrument, s.durationMin, s.complexity, s.frequencyPerWeek,
    s.mode, s.bpm, s.novelty.toFixed(3), s.npi, s.bdnfDelta, s.dopamineIndex,
  ].join(','));
  return [header, ...rows].join('\n');
}
