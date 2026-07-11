const API_BASE: string =
  (import.meta as any).env?.VITE_SIM_API?.replace(/\/$/, '') || 'http://localhost:8000';

export interface SimParams {
  repetitions: number;
  difficulty: number;
  focus: number;
  seed: number;
}

export interface RasterSide { i: number[]; t: number[]; }
export interface Raster { cortex: RasterSide; striatum: RasterSide; window_ms: number; }

export interface SimResult {
  meta: {
    model: string;
    engine: string;
    neurons: { cortex: number; striatum: number; inhibitory: number };
    synapses: number;
    trials: number;
    protocol: { reps: number; difficulty: number; focus: number; seed: number };
    citations: string[];
  };
  learning: { trial: number[]; weight: number[]; response: number[]; dopamine: number[]; rpe: number[] };
  raster_first: Raster;
  raster_last: Raster;
  stp: { t: number[]; u: number[]; x: number[]; spikes: { t: number; released: number }[]; rate_hz: number; note: string };
  vm: { t: number[]; v: number[] };
  hh: { t: number[]; v: number[]; m: number[]; h: number[]; n: number[]; note: string };
}

export type SimError =
  | { kind: 'offline'; base: string }
  | { kind: 'http'; status: number; message: string }
  | { kind: 'timeout' }
  | { kind: 'unknown'; message: string };

export const SIM_API_BASE = API_BASE;

export async function checkSimHealth(timeoutMs = 2500): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
    clearTimeout(to);
    return res.ok;
  } catch {
    return false;
  }
}

export async function runSimulation(params: SimParams, timeoutMs = 120000): Promise<SimResult> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
      signal: ctrl.signal,
    });
  } catch (e: any) {
    clearTimeout(to);
    if (e?.name === 'AbortError') throw { kind: 'timeout' } as SimError;
    throw { kind: 'offline', base: API_BASE } as SimError;
  }
  clearTimeout(to);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw { kind: 'http', status: res.status, message: text } as SimError;
  }
  return res.json();
}

export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h) % 2_000_000;
}
