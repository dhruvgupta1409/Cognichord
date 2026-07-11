import { songFromNotes, type MidiNote, type MidiSong } from '../lib/midi';

const n = (time: number, pitch: number, duration: number, velocity = 88): MidiNote => ({ time, duration, pitch, velocity, track: 0 });

function scaleStudy(): MidiNote[] {
  const notes: MidiNote[] = [];
  const step = 0.14;
  const up = [60, 62, 64, 65, 67, 69, 71, 72];
  const seq = [...up, ...[...up].reverse()];
  let t = 0;
  for (let rep = 0; rep < 6; rep++) for (const p of seq) { notes.push(n(t, p, step * 0.9, 84)); t += step; }
  return notes;
}

function arpeggios(): MidiNote[] {
  const notes: MidiNote[] = [];
  const beat = 0.19;
  const chords = [
    [60, 64, 67, 72],
    [57, 60, 64, 69],
    [65, 69, 72, 77],
    [67, 71, 74, 79],
  ];
  let t = 0;
  for (let rep = 0; rep < 2; rep++) for (const ch of chords) {
    const pattern = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1]];
    for (const p of pattern) { notes.push(n(t, p, beat * 1.4, 78)); t += beat; }
  }
  return notes;
}

function pentatonic(): MidiNote[] {
  const seq: [number, number][] = [
    [72, 1], [69, 0.5], [67, 0.5], [69, 1], [64, 1],
    [67, 0.5], [69, 0.5], [72, 1], [74, 1.5], [72, 0.5],
    [69, 1], [67, 1], [64, 0.5], [67, 0.5], [69, 2],
    [67, 0.5], [69, 0.5], [72, 0.5], [74, 0.5], [76, 1], [72, 1], [69, 2],
  ];
  const beat = 0.44; let t = 0; const notes: MidiNote[] = [];
  for (const [p, b] of seq) {
    const swell = 58 + Math.round(34 * Math.sin(t / 2.2));
    notes.push(n(t, p, beat * b * 0.92, swell)); t += beat * b;
  }
  return notes;
}

function waltz(): MidiNote[] {
  const notes: MidiNote[] = [];
  const beat = 0.34;
  const bars = [
    { bass: 48, up: [64, 67] },
    { bass: 55, up: [71, 74] },
    { bass: 57, up: [64, 69] },
    { bass: 53, up: [69, 72] },
  ];
  let t = 0;
  for (let rep = 0; rep < 2; rep++) for (const bar of bars) {
    notes.push(n(t, bar.bass, beat * 0.9, 82));
    notes.push(n(t + beat, bar.up[0], beat * 0.8, 66));
    notes.push(n(t + 2 * beat, bar.up[1], beat * 0.8, 66));
    t += 3 * beat;
  }
  return notes;
}

export const PIECES: MidiSong[] = [
  songFromNotes('Scale study', scaleStudy(), 110),
  songFromNotes('Arpeggios', arpeggios(), 100),
  songFromNotes('Pentatonic reverie', pentatonic(), 84),
  songFromNotes('Waltz', waltz(), 96),
];
