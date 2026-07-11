import type { MidiSong, MidiNote } from './midi';
import type { SystemId } from './learningModel';

export interface SongFeatures {
  noteDensity: number;
  polyphony: number;
  pitchRange: number;
  rhythmicComplexity: number;
  dynamicRange: number;
  difficulty: number;
  dominant: SystemId[];
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function windowNotes(notes: MidiNote[], t: number, win: number): MidiNote[] {
  return notes.filter(n => n.time <= t && n.time + n.duration >= t - win);
}

function rhythmComplexity(onsets: number[]): number {
  if (onsets.length < 3) return 0;
  const iois: number[] = [];
  for (let i = 1; i < onsets.length; i++) iois.push(onsets[i] - onsets[i - 1]);
  const mean = iois.reduce((a, b) => a + b, 0) / iois.length;
  if (mean <= 0) return 0;
  const cv = Math.sqrt(iois.reduce((a, b) => a + (b - mean) ** 2, 0) / iois.length) / mean;
  return clamp01(cv * 0.9);
}

export function analyzeSong(song: MidiSong): SongFeatures {
  const N = song.notes;
  if (!N.length) return { noteDensity: 0, polyphony: 0, pitchRange: 0, rhythmicComplexity: 0, dynamicRange: 0, difficulty: 0, dominant: [] };
  const rates: number[] = [];
  for (let t = 0; t < song.durationSec; t += 0.5) rates.push(N.filter(n => n.time >= t && n.time < t + 1).length);
  rates.sort((a, b) => a - b);
  const noteDensity = rates[Math.floor(rates.length * 0.9)] ?? 0;

  const pitches = N.map(n => n.pitch);
  const pitchRange = Math.max(...pitches) - Math.min(...pitches);

  let poly = 0;
  for (const n of N) poly += N.filter(m => m.time <= n.time + 0.03 && m.time + m.duration > n.time).length;
  const polyphony = poly / N.length;

  const rhythmicComplexity = rhythmComplexity(N.map(n => n.time));

  const vels = N.map(n => n.velocity);
  const vmean = vels.reduce((a, b) => a + b, 0) / vels.length;
  const dynamicRange = clamp01(Math.sqrt(vels.reduce((a, b) => a + (b - vmean) ** 2, 0) / vels.length) / 40);

  const difficulty = clamp01(0.4 * clamp01(noteDensity / 12) + 0.25 * rhythmicComplexity + 0.2 * clamp01(polyphony / 4) + 0.15 * clamp01(pitchRange / 48));

  const scores: Record<SystemId, number> = {
    motor: 0.5 + 0.5 * clamp01(noteDensity / 12), cerebellum: clamp01(noteDensity / 10), basalGanglia: rhythmicComplexity,
    limbic: dynamicRange, visual: clamp01(pitchRange / 40), auditory: 0.6,
    somatosensory: 0.4, thalamus: 0.4, prefrontal: 0.4, hippocampus: 0.4,
  };
  const dominant = (Object.entries(scores) as [SystemId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

  return { noteDensity, polyphony, pitchRange, rhythmicComplexity, dynamicRange, difficulty, dominant };
}

export function engagementAtTime(song: MidiSong, t: number, mastery: number): Record<SystemId, number> {
  const win = 0.9;
  const w = windowNotes(song.notes, t, win);
  const active = w.length > 0;
  const density = clamp01(w.length / 6);
  const poly = clamp01(w.length ? new Set(w.map(n => n.pitch)).size / 5 : 0);
  const onsets = w.map(n => n.time).sort((a, b) => a - b);
  const rc = rhythmComplexity(onsets);
  const vels = w.map(n => n.velocity);
  const vmean = vels.length ? vels.reduce((a, b) => a + b, 0) / vels.length : 90;
  const dyn = clamp01(vels.length ? Math.sqrt(vels.reduce((a, b) => a + (b - vmean) ** 2, 0) / vels.length) / 35 : 0);
  const pRange = w.length ? clamp01((Math.max(...w.map(n => n.pitch)) - Math.min(...w.map(n => n.pitch))) / 30) : 0;

  const early = 1 - mastery;
  const a = active ? 1 : 0;
  return {
    motor:         clamp01(a * (0.55 + 0.4 * density)),
    auditory:      clamp01(a * (0.5 + 0.35 * density)),
    somatosensory: clamp01(a * (0.3 + 0.35 * density)),
    thalamus:      clamp01(a * 0.5),
    cerebellum:    clamp01(a * (0.2 + 0.7 * density) * (0.5 + 0.5 * mastery)),
    basalGanglia:  clamp01(a * (0.2 + 0.7 * rc) * (0.4 + 0.6 * mastery)),
    prefrontal:    clamp01(a * (0.25 + 0.55 * early + 0.3 * poly)),
    hippocampus:   clamp01(a * (0.2 + 0.6 * early)),
    visual:        clamp01(a * (0.2 + 0.6 * pRange) * (0.4 + 0.6 * early)),
    limbic:        clamp01(a * (0.15 + 0.7 * dyn)),
  };
}

export function notesAt(song: MidiSong, t: number, dt: number): MidiNote[] {
  return song.notes.filter(n => n.time > t - dt && n.time <= t);
}

export interface FeatureDoc { name: string; formula: string; drives: string; why: string; source: string; evidence: 'established' | 'approximation'; }

export const MUSIC_FEATURES: FeatureDoc[] = [
  { name: 'Note density', formula: '90th-percentile notes per second, measured over 1-second windows', drives: 'Motor cortex + cerebellum', why: 'Faster, denser passages require rapid finger sequencing and finer sub-second timing, which depend on motor cortex and the cerebellum.', source: 'Penhune & Steele 2012, Behav Brain Res; Jäncke 2000', evidence: 'established' },
  { name: 'Rhythmic complexity', formula: 'coefficient of variation of inter-onset intervals (standard deviation divided by the mean of the gaps between note starts)', drives: 'Basal ganglia', why: 'Irregular, off-beat timing recruits the basal-ganglia circuits that track and predict a beat.', source: 'Grahn & Brett 2007, J Cogn Neurosci', evidence: 'established' },
  { name: 'Dynamic range', formula: 'standard deviation of note velocities (how much the loudness varies)', drives: 'Limbic + reward', why: 'Expressive shaping of loudness, including swells and accents, engages emotion and reward circuitry.', source: 'Blood & Zatorre 2001, PNAS', evidence: 'established' },
  { name: 'Pitch range & variety', formula: 'span between the highest and lowest pitch; number of distinct pitches in the current window', drives: 'Visual + dorsal attention', why: 'Reading wide-ranging, less predictable material loads the visual and attention networks used in sight-reading.', source: 'Stewart et al. 2003, Brain', evidence: 'established' },
  { name: 'Repetition (mastery)', formula: 'number of play-throughs, mapped to a 0–1 automaticity level', drives: 'Shifts control toward cerebellum + basal ganglia', why: 'With repetition, control moves from attention and memory systems to automatic ones, which is the same shift the practice simulation models.', source: 'Doyon & Benali 2005, Curr Opin Neurobiol', evidence: 'approximation' },
];
