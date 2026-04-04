import type { InstrumentType, MusicalMode } from '../types';
import { simulateBDNF } from '../models/bdnf';
import { simulateDopamine } from '../models/dopamine';

const ALL_INSTRUMENTS: InstrumentType[] = [
  'piano', 'violin', 'guitar', 'drums', 'voice', 'cello',
  'flute', 'clarinet', 'saxophone', 'trumpet', 'viola', 'oboe',
  'trombone', 'harp', 'organ', 'french horn', 'marimba',
  'ukulele', 'mandolin', 'double bass', 'bassoon', 'bass', 'classical guitar',
];

const ALL_MODES: MusicalMode[] = ['major', 'minor', 'dorian', 'mixolydian', 'lydian', 'phrygian'];

function makeLCG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export interface SimSession {
  instrument: InstrumentType;
  durationMin: number;
  complexity: number;
  frequencyPerWeek: number;
  mode: MusicalMode;
  bpm: number;
  novelty: number;
  npi: number;
  bdnfDelta: number;
  dopamineIndex: number;
}

function runBDNF(
  durationMin: number,
  complexity: number,
  frequencyPerWeek: number,
  instrument: InstrumentType,
): { npi: number; bdnfDelta: number } {
  const result = simulateBDNF({
    sessionDurationMin: durationMin,
    complexity,
    frequencyPerWeek,
    totalWeeks: 4,
    instrument,
  });
  const finalBDNF = result.trajectory[result.trajectory.length - 1].bdnf;
  return {
    npi:       result.finalNPI,
    bdnfDelta: parseFloat((finalBDNF - 100).toFixed(1)),
  };
}

function runDopamine(
  bpm: number,
  mode: MusicalMode,
  sessionDurationMin: number,
  complexity: number,
  novelty: number,
  practiceFrequency: number,
): number {
  const result = simulateDopamine({
    bpm,
    mode,
    sessionDurationMin,
    complexity,
    novelty,
    practiceFrequency,
  });
  return result.rewardIndex;
}

export function sessionToSimSession(
  instrument: string,
  durationMin: number,
  complexity: number,
  frequencyPerWeek: number = 4,
  mode: string = 'major',
  bpm: number = 120,
  novelty: number = 0.5,
): SimSession {
  const { npi, bdnfDelta } = runBDNF(durationMin, complexity, frequencyPerWeek, instrument as InstrumentType);
  const dopamineIndex = runDopamine(bpm, mode as MusicalMode, durationMin, complexity, novelty, frequencyPerWeek);
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

    const { npi, bdnfDelta } = runBDNF(durationMin, complexity, freq, instrument);
    const dopamineIndex = runDopamine(bpm, mode, durationMin, complexity, novelty, freq);

    sessions.push({ instrument, durationMin, complexity, frequencyPerWeek: freq, mode, bpm, novelty, npi, bdnfDelta, dopamineIndex });
  }

  _cache = sessions;
  return sessions;
}

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
