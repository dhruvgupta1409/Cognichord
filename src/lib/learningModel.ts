export type SystemId =
  | 'prefrontal' | 'motor' | 'somatosensory' | 'auditory' | 'visual'
  | 'cerebellum' | 'basalGanglia' | 'thalamus' | 'hippocampus' | 'limbic';

export const SYSTEM_REGION: Record<SystemId, number> = {
  prefrontal: 1, motor: 2, somatosensory: 3, auditory: 5, visual: 6,
  cerebellum: 7, basalGanglia: 9, thalamus: 12, hippocampus: 10, limbic: 11,
};

export type TractGroup = 'audiomotor' | 'cerebellar' | 'bg' | 'thalamocortical' | 'prefrontal' | 'hippocampal' | 'visual';
export const TRACT_GROUPS: TractGroup[] = ['audiomotor', 'cerebellar', 'bg', 'thalamocortical', 'prefrontal', 'hippocampal', 'visual'];

export type Focus = 'technical' | 'sightread' | 'expressive' | 'memorize' | 'balanced';

export interface Schedule {
  minutesPerDay: number;
  daysPerWeek: number;
  weeks: number;
  focus: Focus;
  label?: string;
}

export interface DayState {
  day: number;
  week: number;
  practiced: boolean;
  encoding: number;
  automaticity: number;
  fast: number;
  slow: number;
  skill: number;
  errorRate: number;
  fatigue: number;
  retention: number;
  myelin: Record<TractGroup, number>;
  engagement: Record<SystemId, number>;
  metrics: { efficiency: number; synchronization: number; redundancy: number; automaticity: number };
}

const SYSTEMS: SystemId[] = ['prefrontal', 'motor', 'somatosensory', 'auditory', 'visual', 'cerebellum', 'basalGanglia', 'thalamus', 'hippocampus', 'limbic'];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function doseOf(minutes: number, fatigue: number): number {
  const raw = minutes / (minutes + 32);
  return raw * (1 - 0.55 * fatigue);
}

function focusWeights(focus: Focus) {
  switch (focus) {
    case 'technical':  return { drill: 1.0, sightread: 0.1, expressive: 0.2, memorize: 0.3 };
    case 'sightread':  return { drill: 0.3, sightread: 1.0, expressive: 0.3, memorize: 0.4 };
    case 'expressive': return { drill: 0.3, sightread: 0.2, expressive: 1.0, memorize: 0.3 };
    case 'memorize':   return { drill: 0.4, sightread: 0.2, expressive: 0.3, memorize: 1.0 };
    default:           return { drill: 0.6, sightread: 0.5, expressive: 0.5, memorize: 0.5 };
  }
}

function engagementOf(automaticity: number, practiced: boolean, w: ReturnType<typeof focusWeights>): Record<SystemId, number> {
  const a = automaticity, early = 1 - a;
  const p = practiced ? 1 : 0;
  const eng: Record<SystemId, number> = {
    motor:         clamp01(p * (0.6 + 0.35 * a) + (1 - p) * 0.12 * a),
    prefrontal:    clamp01(p * (0.25 + 0.6 * early) + (1 - p) * 0.08),
    hippocampus:   clamp01(p * (0.2 + 0.65 * early) * w.memorize + (1 - p) * 0.18 * early),
    cerebellum:    clamp01(p * (0.15 + 0.7 * a) * (0.6 + 0.4 * w.drill) + (1 - p) * 0.12 * a),
    basalGanglia:  clamp01(p * (0.15 + 0.7 * a) + (1 - p) * 0.14 * a),
    thalamus:      clamp01(p * 0.5 + (1 - p) * 0.1),
    auditory:      clamp01(p * 0.55 + (1 - p) * 0.08),
    somatosensory: clamp01(p * (0.35 + 0.3 * a) + (1 - p) * 0.05),
    visual:        clamp01(p * (0.2 + 0.6 * w.sightread) + (1 - p) * 0.03),
    limbic:        clamp01(p * (0.15 + 0.5 * w.expressive) + (1 - p) * 0.05),
  };
  return eng;
}

export function simulate(schedule: Schedule): DayState[] {
  const w = focusWeights(schedule.focus);
  const totalDays = schedule.weeks * 7;
  const practiceDaysInWeek = new Set<number>();
  {
    const n = Math.max(0, Math.min(7, Math.round(schedule.daysPerWeek)));
    for (let i = 0; i < n; i++) practiceDaysInWeek.add(Math.floor((i * 7) / n));
  }

  let encoding = 0, automaticity = 0, fatigue = 0;
  let cumPractice = 0;
  const myelin: Record<TractGroup, number> = { audiomotor: 0, cerebellar: 0, bg: 0, thalamocortical: 0, prefrontal: 0, hippocampal: 0, visual: 0 };
  let daysSincePractice = 99;
  const out: DayState[] = [];

  for (let day = 0; day < totalDays; day++) {
    const dow = day % 7;
    const practiced = practiceDaysInWeek.has(dow);

    if (practiced) {
      const dose = doseOf(schedule.minutesPerDay, fatigue);
      const error = 1 - clamp01(0.4 * encoding + 0.85 * automaticity);
      cumPractice += dose * (1 - 0.5 * fatigue);
      encoding = clamp01(encoding + 0.55 * dose * error);
      fatigue = clamp01(fatigue + 0.35 * (schedule.minutesPerDay / 120) - 0.15);
      daysSincePractice = 0;
    } else {
      fatigue = clamp01(fatigue - 0.34);
      daysSincePractice++;
    }

    const eng = engagementOf(automaticity, practiced, w);
    const spacing = practiced ? clamp01(0.15 + 0.22 * Math.min(daysSincePractice + 1, 3)) : 0.05;
    const consolidation = 0.092 * encoding * (1 + spacing);
    automaticity = clamp01(automaticity + consolidation * (1 - automaticity));
    encoding = clamp01(encoding * (practiced ? 0.9 : 0.82) - 0.02 * (1 - automaticity));
    automaticity = clamp01(automaticity - 0.004 * (1 - automaticity));

    const replay = practiced ? 1 : 0.12;
    const grow = (g: TractGroup, use: number, rate: number) => { myelin[g] = clamp01(myelin[g] + rate * replay * use * (1 - myelin[g])); };
    grow('audiomotor', Math.min(eng.auditory, eng.motor), 0.040);
    grow('cerebellar', eng.cerebellum, 0.055);
    grow('bg', eng.basalGanglia, 0.052);
    grow('thalamocortical', eng.thalamus * (0.4 + 0.6 * automaticity), 0.044);
    grow('prefrontal', eng.prefrontal, 0.024);
    grow('hippocampal', eng.hippocampus, 0.016);
    grow('visual', eng.visual, 0.034);

    const retention = clamp01(0.35 * encoding + 0.75 * automaticity);
    const skill = clamp01(0.4 * encoding + 0.85 * automaticity);
    const errorRate = Math.pow(1 + cumPractice / 2.2, -0.55);
    const efficiency = (myelin.cerebellar + myelin.bg + myelin.thalamocortical + myelin.audiomotor) / 4;
    const synchronization = clamp01(0.2 * efficiency + 0.9 * automaticity);
    const strong = TRACT_GROUPS.filter(g => myelin[g] > 0.5).length;
    const redundancy = strong / TRACT_GROUPS.length;

    out.push({
      day, week: Math.floor(day / 7), practiced,
      encoding, automaticity, fast: encoding, slow: automaticity, skill, errorRate, fatigue, retention,
      myelin: { ...myelin },
      engagement: eng,
      metrics: { efficiency, synchronization, redundancy, automaticity },
    });
  }
  return out;
}

export interface Mechanism { key: string; name: string; detail: string; source: string; evidence: 'established' | 'approximation'; }

export const MECHANISMS: Mechanism[] = [
  { key: 'acquire', name: 'Fast acquisition, then plateau', detail: 'The fresh trace of a passage climbs quickly at first and then saturates, so extra minutes in one sitting are worth progressively less.', source: 'Ericsson, Krampe & Tesch-Römer 1993, Psych Review', evidence: 'established' },
  { key: 'consolidate', name: 'Sleep-dependent consolidation', detail: 'Overnight, an effortful trace is replayed and converted into durable procedural skill, so you often play better the next morning without touching the instrument.', source: 'Walker et al. 2002/2005, Neuron', evidence: 'established' },
  { key: 'spacing', name: 'Spacing effect', detail: 'The same total practice spread over more days is retained far better than the same minutes massed into one session.', source: 'Cepeda et al. 2006, Psych Bulletin (meta-analysis)', evidence: 'established' },
  { key: 'migrate', name: 'Automaticity migrates', detail: 'Control shifts from prefrontal cortex and hippocampus (effortful, attentive) to the basal ganglia and cerebellum (automatic) as a skill consolidates.', source: 'Doyon & Benali 2005; Floyer-Lea & Matthews 2005', evidence: 'established' },
  { key: 'myelin', name: 'Practice myelinates tracts', detail: 'White-matter structure on the pathways you use grows with cumulative practice, which makes conduction faster and timing tighter.', source: 'Bengtsson et al. 2005, Nat Neurosci; Fields 2015', evidence: 'established' },
  { key: 'forget', name: 'Forgetting between sessions', detail: 'The fresh trace decays between sessions (quickly if you never consolidate it). Procedural skill, once automatic, is very durable.', source: 'Ebbinghaus 1885; Romano et al. 2010', evidence: 'established' },
  { key: 'rates', name: 'Exact rates are illustrative', detail: 'The mechanisms above are supported by research. The specific per-day rate constants are tuned for a readable weeks-long view, and they are not fit to an individual.', source: 'CogniChord model', evidence: 'approximation' },
];

export function myelinForGroups(m: Record<TractGroup, number>): Record<TractGroup, number> { return m; }

export function engagementRegionArray(eng: Record<SystemId, number>): number[] {
  const arr = new Array(13).fill(0);
  for (const s of SYSTEMS) { const r = SYSTEM_REGION[s]; arr[r] = Math.max(arr[r], eng[s]); }
  return arr;
}

export function myelinGroupArray(m: Record<TractGroup, number>): number[] {
  return TRACT_GROUPS.map(g => m[g]);
}
