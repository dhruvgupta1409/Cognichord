export interface MidiNote {
  time: number;
  duration: number;
  pitch: number;
  velocity: number;
  track: number;
}

export interface MidiSong {
  name: string;
  notes: MidiNote[];
  durationSec: number;
  ppq: number;
  bpmAtStart: number;
}

class Reader {
  p = 0;
  constructor(public d: DataView) {}
  u8() { return this.d.getUint8(this.p++); }
  u16() { const v = this.d.getUint16(this.p); this.p += 2; return v; }
  u32() { const v = this.d.getUint32(this.p); this.p += 4; return v; }
  str(n: number) { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(this.u8()); return s; }
  vlq() { let v = 0, b: number; do { b = this.u8(); v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; }
}

export function parseMidi(buffer: ArrayBuffer, name = 'Uploaded piece'): MidiSong {
  const r = new Reader(new DataView(buffer));
  if (r.str(4) !== 'MThd') throw new Error('Not a MIDI file');
  r.u32();
  r.u16();
  const ntrks = r.u16();
  const division = r.u16();
  if (division & 0x8000) throw new Error('SMPTE time division not supported');
  const ppq = division;

  interface Ev { tick: number; type: 'on' | 'off' | 'tempo'; pitch?: number; vel?: number; usPerQuarter?: number; track: number; }
  const evs: Ev[] = [];

  for (let t = 0; t < ntrks; t++) {
    if (r.str(4) !== 'MTrk') break;
    const len = r.u32();
    const end = r.p + len;
    let tick = 0;
    let running = 0;
    while (r.p < end) {
      tick += r.vlq();
      let status = r.d.getUint8(r.p);
      if (status & 0x80) { r.p++; running = status; } else { status = running; }
      const hi = status & 0xf0;
      if (status === 0xff) {
        const meta = r.u8();
        const mlen = r.vlq();
        if (meta === 0x51 && mlen === 3) {
          const usPerQuarter = (r.u8() << 16) | (r.u8() << 8) | r.u8();
          evs.push({ tick, type: 'tempo', usPerQuarter, track: t });
        } else { r.p += mlen; }
      } else if (status === 0xf0 || status === 0xf7) {
        const slen = r.vlq(); r.p += slen;
      } else if (hi === 0x90) {
        const pitch = r.u8(), vel = r.u8();
        evs.push({ tick, type: vel > 0 ? 'on' : 'off', pitch, vel, track: t });
      } else if (hi === 0x80) {
        const pitch = r.u8(); r.u8();
        evs.push({ tick, type: 'off', pitch, track: t });
      } else if (hi === 0xa0 || hi === 0xb0 || hi === 0xe0) { r.p += 2; }
      else if (hi === 0xc0 || hi === 0xd0) { r.p += 1; }
      else { r.p++; }
    }
    r.p = end;
  }

  evs.sort((a, b) => a.tick - b.tick);

  let curUs = 500000;
  let lastTick = 0, lastSec = 0;
  const bpmAtStart = evs.find(e => e.type === 'tempo')?.usPerQuarter ? 6e7 / evs.find(e => e.type === 'tempo')!.usPerQuarter! : 120;
  const secAt = (tick: number) => lastSec + ((tick - lastTick) / ppq) * (curUs / 1e6);

  const open = new Map<number, { time: number; vel: number; track: number }>();
  const notes: MidiNote[] = [];
  for (const e of evs) {
    const sec = secAt(e.tick);
    if (e.type === 'tempo') { lastSec = sec; lastTick = e.tick; curUs = e.usPerQuarter!; continue; }
    const key = (e.track << 8) | (e.pitch ?? 0);
    if (e.type === 'on') {
      open.set(key, { time: sec, vel: e.vel ?? 96, track: e.track });
    } else {
      const o = open.get(key);
      if (o) { notes.push({ time: o.time, duration: Math.max(0.03, sec - o.time), pitch: e.pitch ?? 0, velocity: o.vel, track: o.track }); open.delete(key); }
    }
  }
  notes.sort((a, b) => a.time - b.time);
  const durationSec = notes.reduce((m, n) => Math.max(m, n.time + n.duration), 0);
  return { name, notes, durationSec, ppq, bpmAtStart: Math.round(bpmAtStart) };
}

export function songFromNotes(name: string, notes: MidiNote[], bpm = 100): MidiSong {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const durationSec = sorted.reduce((m, n) => Math.max(m, n.time + n.duration), 0);
  return { name, notes: sorted, durationSec, ppq: 480, bpmAtStart: bpm };
}
