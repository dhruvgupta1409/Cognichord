import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { createNet, forward, trainStep, loss as netLoss, match as netMatch, type MiniNet } from '../../lib/miniNet';

const N_IN = 6;
const N_HID = 10;
const N_OUT = 4;
const SEED = 1337;
const DECAY = 0.0006;

const STIMULUS = [0.92, 0.24, 0.71, 0.4, 0.86, 0.33];

interface Preset {
  name: string;
  target: number[];
}
const PRESETS: Preset[] = [
  { name: 'Ascending', target: [0.1, 0.4, 0.72, 0.95] },
  { name: 'Twin peaks', target: [0.95, 0.14, 0.14, 0.95] },
  { name: 'Alternating', target: [0.94, 0.08, 0.94, 0.08] },
];

const COL_IN = [0, 212, 255];
const COL_HID = [139, 92, 246];
const COL_OUT = [52, 211, 153];
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

interface Pulse {
  layer: 0 | 1;
  a: number;
  b: number;
  t: number;
  speed: number;
}

interface NodePos {
  x: number;
  y: number;
  col: number[];
}

function layout(): { input: NodePos[]; hidden: NodePos[]; output: NodePos[] } {
  const col = (n: number, i: number, top = 0.12, bot = 0.88) =>
    n === 1 ? (top + bot) / 2 : top + ((bot - top) * i) / (n - 1);
  return {
    input: Array.from({ length: N_IN }, (_, i) => ({ x: 0.09, y: col(N_IN, i), col: COL_IN })),
    hidden: Array.from({ length: N_HID }, (_, j) => ({ x: 0.5, y: col(N_HID, j), col: COL_HID })),
    output: Array.from({ length: N_OUT }, (_, k) => ({ x: 0.91, y: col(N_OUT, k), col: COL_OUT })),
  };
}
const POS = layout();

type Badge = { label: string; className: string };
const BADGE: Record<'established' | 'approx', Badge> = {
  established: { label: 'Established', className: 'text-emerald border-emerald/25 bg-emerald/[0.08]' },
  approx: { label: 'Approximation', className: 'text-cyan border-cyan/25 bg-cyan/[0.08]' },
};

interface Rule {
  title: string;
  badge: 'established' | 'approx';
  body: string;
}
const RULES: Rule[] = [
  {
    title: 'Hebbian learning',
    badge: 'established',
    body: '"Neurons that fire together wire together." A synapse strengthens when the pre-synaptic and post-synaptic cells are active at the same time, which is the coincidence at the core of long-term potentiation. In this simulation it is the a_pre × a_post term of every weight update.',
  },
  {
    title: 'STDP (spike timing)',
    badge: 'established',
    body: 'Spike-timing-dependent plasticity: whether a synapse strengthens or weakens depends on the millisecond order of the pre-synaptic and post-synaptic spikes. This rate-coded simulation abstracts that timing into coincident activity, and the propagating spikes you see are the physical event that STDP reads.',
  },
  {
    title: 'Three-factor update rule',
    badge: 'approx',
    body: 'Plain Hebbian learning has no signal for what is correct. A third factor, a neuromodulator such as dopamine carrying a reward or error signal, gates it: Δw = η · a_pre · a_post · δ. It is established that dopamine gates plasticity. Representing δ as this exact gradient-equivalent error, with these rate constants, is an approximation made by this app.',
  },
  {
    title: 'Synaptic pruning',
    badge: 'established',
    body: '"Use it or lose it." Synapses that rarely coincide with useful output slowly weaken and are removed, which frees the circuit to specialize. A small weight-decay term (−λ·w) reproduces this, so you can watch faint connections thin out and disappear as training proceeds.',
  },
  {
    title: 'Activity-dependent myelination',
    badge: 'established',
    body: 'Axons that are driven repeatedly get wrapped in myelin, which speeds up conduction. This is a slow, structural form of learning beyond the synapse. Pathways carrying the most coincident traffic here brighten and thicken, and their spikes travel faster, as a myelinating tract would.',
  },
];

export default function NeuralNetLab() {
  const netCanvas = useRef<HTMLCanvasElement>(null);
  const lossCanvas = useRef<HTMLCanvasElement>(null);

  const [training, setTraining] = useState(false);
  const [lr, setLr] = useState(0.35);
  const [preset, setPreset] = useState(0);
  const [tele, setTele] = useState({ epoch: 0, mse: 0, match: 0 });

  const net = useRef<MiniNet>(createNet(N_IN, N_HID, N_OUT, SEED));
  const pulses = useRef<Pulse[]>([]);
  const lossHist = useRef<number[]>([]);
  const maxLoss = useRef(0.001);
  const flash = useRef<Float32Array>(new Float32Array(N_OUT));

  const trainingRef = useRef(training);
  const lrRef = useRef(lr);
  const presetRef = useRef(preset);
  const raf = useRef<number>();
  const lastT = useRef(0);
  const trainAcc = useRef(0);
  const spikeAcc = useRef(0);
  const teleAcc = useRef(0);

  trainingRef.current = training;
  lrRef.current = lr;

  const resetNet = (p: number) => {
    net.current = createNet(N_IN, N_HID, N_OUT, SEED);
    forward(net.current, STIMULUS);
    pulses.current = [];
    lossHist.current = [];
    maxLoss.current = 0.001;
    presetRef.current = p;
    setTele({ epoch: 0, mse: netLoss(net.current, PRESETS[p].target), match: netMatch(net.current, PRESETS[p].target) });
  };

  const handleReset = () => {
    setTraining(false);
    resetNet(presetRef.current);
  };
  const handlePreset = (p: number) => {
    setPreset(p);
    resetNet(p);
  };

  const emitVolley = () => {
    const n = net.current;
    if (pulses.current.length > 150) return;
    for (let i = 0; i < N_IN; i++) {
      for (let j = 0; j < N_HID; j++) {
        const drive = n.aIn[i] * Math.abs(n.W1[i][j]);
        if (Math.random() < drive * 0.5) {
          pulses.current.push({ layer: 0, a: i, b: j, t: 0, speed: 0.9 + n.use1[i][j] * 6 });
        }
      }
    }
    for (let j = 0; j < N_HID; j++) {
      for (let k = 0; k < N_OUT; k++) {
        const drive = n.aHid[j] * Math.abs(n.W2[j][k]);
        if (Math.random() < drive * 0.5) {
          pulses.current.push({ layer: 1, a: j, b: k, t: 0, speed: 0.9 + n.use2[j][k] * 6 });
        }
      }
    }
  };

  useEffect(() => {
    forward(net.current, STIMULUS);
    setTele({ epoch: 0, mse: netLoss(net.current, PRESETS[0].target), match: netMatch(net.current, PRESETS[0].target) });

    const nc = netCanvas.current;
    const lc = lossCanvas.current;
    if (!nc || !lc) return;
    const nctx = nc.getContext('2d');
    const lctx = lc.getContext('2d');
    if (!nctx || !lctx) return;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const [cv, cx] of [[nc, nctx], [lc, lctx]] as const) {
        cv.width = cv.clientWidth * dpr;
        cv.height = cv.clientHeight * dpr;
        cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    lastT.current = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastT.current) / 1000);
      lastT.current = now;
      const n = net.current;
      const target = PRESETS[presetRef.current].target;

      if (trainingRef.current) {
        trainAcc.current += dt;
        const stepEvery = 0.05;
        let steps = 0;
        while (trainAcc.current >= stepEvery && steps < 6) {
          trainAcc.current -= stepEvery;
          const l = trainStep(n, STIMULUS, target, lrRef.current, DECAY);
          lossHist.current.push(l);
          if (l > maxLoss.current) maxLoss.current = l;
          if (lossHist.current.length > 1400) lossHist.current.shift();
          steps++;
        }
      } else {
        forward(n, STIMULUS);
      }

      spikeAcc.current += dt;
      if (spikeAcc.current > 0.1) {
        spikeAcc.current = 0;
        emitVolley();
      }

      teleAcc.current += dt;
      if (teleAcc.current > 0.12) {
        teleAcc.current = 0;
        setTele({ epoch: n.epoch, mse: netLoss(n, target), match: netMatch(n, target) });
      }

      drawNetwork(nctx, nc.clientWidth, nc.clientHeight, n, target, pulses.current, flash.current, dt);
      drawLoss(lctx, lc.clientWidth, lc.clientHeight, lossHist.current, maxLoss.current);

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 sim-panel !p-0 overflow-hidden relative">
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">Cortical microcircuit</span>
        </div>
        <div className="absolute top-3 right-4 z-10 flex items-center gap-3 pointer-events-none text-[10px] uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1.5" style={{ color: rgba(COL_IN, 0.9) }}><i className="w-2 h-2 rounded-full inline-block" style={{ background: rgba(COL_IN, 1) }} />input</span>
          <span className="flex items-center gap-1.5" style={{ color: rgba(COL_HID, 0.9) }}><i className="w-2 h-2 rounded-full inline-block" style={{ background: rgba(COL_HID, 1) }} />hidden</span>
          <span className="flex items-center gap-1.5" style={{ color: rgba(COL_OUT, 0.9) }}><i className="w-2 h-2 rounded-full inline-block" style={{ background: rgba(COL_OUT, 1) }} />output</span>
        </div>
        <canvas ref={netCanvas} style={{ width: '100%', height: 440, display: 'block' }} />
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-4 pointer-events-none text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5"><i className="inline-block w-4 h-0.5 rounded" style={{ background: rgba(COL_IN, 0.8) }} />excitatory</span>
          <span className="flex items-center gap-1.5"><i className="inline-block w-4 h-0.5 rounded" style={{ background: 'rgba(255,45,120,0.8)' }} />inhibitory</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-cyan-light" />action potential</span>
        </div>
      </div>

      <div className="sim-panel flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTraining((v) => !v)}
            className={training ? 'btn-secondary inline-flex items-center gap-2 flex-1 justify-center' : 'btn-primary inline-flex items-center gap-2 flex-1 justify-center'}
          >
            {training ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Train</>}
          </button>
          <button onClick={handleReset} className="btn-ghost inline-flex items-center gap-2" title="Re-initialise weights">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="epoch" value={String(tele.epoch)} color="#94a3b8" />
          <Stat label="loss (MSE)" value={tele.mse.toFixed(3)} color="#FCD34D" />
          <Stat label="match" value={`${Math.round(tele.match * 100)}%`} color="#34D399" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="control-label !mb-0">Learning curve · loss / epoch</span>
          </div>
          <canvas ref={lossCanvas} style={{ width: '100%', height: 120, display: 'block' }} />
          <p className="text-[10px] text-slate-600 mt-1 leading-snug">The squared error between the response and the target, computed live from the network. It is a real calculation, not a scripted animation.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="control-label !mb-0">Learning rate η</span>
            <span className="control-value">{lr.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.02}
            max={1}
            step={0.01}
            value={lr}
            onChange={(e) => setLr(parseFloat(e.target.value))}
            className="slider-custom purple"
          />
          <p className="text-[10px] text-slate-600 mt-1 leading-snug">The learning rate sets how large each weight step is. A higher rate learns faster but can step past the best value and oscillate around it instead of settling.</p>
        </div>

        <div>
          <span className="control-label">Target response pattern</span>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => handlePreset(i)}
                className="toggle-btn text-center"
                style={
                  preset === i
                    ? { background: 'rgba(0,212,255,0.12)', color: '#80EAFF', borderColor: 'rgba(0,212,255,0.35)' }
                    : { background: 'rgba(255,255,255,0.03)', color: '#94a3b8', borderColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="mb-3">
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            Practice pushes your brain to optimize how it performs a task, in a way similar to this simulation: a stimulus drives a circuit, the result is compared to what you intended, and a neuromodulated plasticity rule adjusts each synapse so that the next response lands closer to the goal. Below is exactly what each rule does, and how confidently each claim can be made.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {RULES.map((r) => {
            const b = BADGE[r.badge];
            return (
              <div key={r.title} className="sim-panel !p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-display font-semibold text-slate-100 text-sm leading-snug">{r.title}</h4>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${b.className}`}>
                    {b.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{r.body}</p>
              </div>
            );
          })}
          <div className="sim-panel !p-4 border border-cyan/20" style={{ background: 'rgba(0,212,255,0.04)' }}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="font-display font-semibold text-slate-100 text-sm">The exact rule running</h4>
              <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${BADGE.approx.className}`}>
                {BADGE.approx.label}
              </span>
            </div>
            <p className="font-mono text-[11px] text-cyan-light leading-relaxed mb-2">Δw = η · apre · apost · δ − λ·w</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              For an output synapse, δ = (target − apost)(1 − apost). For a hidden synapse, δ is that error carried back through its outgoing weights. Because apost(1 − apost) is the slope of the logistic function, this Hebbian-form rule is gradient descent on the plotted loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">{label}</div>
      <div className="font-mono text-lg leading-none" style={{ color }}>{value}</div>
    </div>
  );
}

function drawNetwork(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  n: MiniNet,
  target: number[],
  pulses: Pulse[],
  flash: Float32Array,
  dt: number,
) {
  const px = (x: number) => x * W;
  const py = (y: number) => y * H;
  ctx.clearRect(0, 0, W, H);

  for (let k = 0; k < N_OUT; k++) flash[k] = Math.max(0, flash[k] - dt * 2.2);

  const maxAbs1 = maxAbsW(n.W1) || 1;
  const maxAbs2 = maxAbsW(n.W2) || 1;

  ctx.lineCap = 'round';
  drawConns(ctx, px, py, POS.input, POS.hidden, n.W1, n.use1, maxAbs1);
  drawConns(ctx, px, py, POS.hidden, POS.output, n.W2, n.use2, maxAbs2);

  ctx.globalCompositeOperation = 'lighter';
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    p.t += dt * p.speed;
    const from = p.layer === 0 ? POS.input[p.a] : POS.hidden[p.a];
    const to = p.layer === 0 ? POS.hidden[p.b] : POS.output[p.b];
    if (p.t >= 1) {
      if (p.layer === 1) flash[p.b] = Math.min(1.5, flash[p.b] + 0.5);
      pulses.splice(i, 1);
      continue;
    }
    const x = px(from.x) + (px(to.x) - px(from.x)) * p.t;
    const y = py(from.y) + (py(to.y) - py(from.y)) * p.t;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, 8);
    grd.addColorStop(0, 'rgba(190,245,255,0.95)');
    grd.addColorStop(0.4, 'rgba(120,220,255,0.6)');
    grd.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 6.2832);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  drawNeurons(ctx, px, py, POS.input, n.aIn, null, null);
  drawNeurons(ctx, px, py, POS.hidden, n.aHid, null, null);
  drawNeurons(ctx, px, py, POS.output, n.aOut, target, flash);
}

function drawConns(
  ctx: CanvasRenderingContext2D,
  px: (x: number) => number,
  py: (y: number) => number,
  pre: NodePos[],
  post: NodePos[],
  W: number[][],
  use: number[][],
  maxAbs: number,
) {
  for (let i = 0; i < pre.length; i++) {
    for (let j = 0; j < post.length; j++) {
      const w = W[i][j];
      const mag = Math.abs(w) / maxAbs;
      if (mag < 0.04) continue;
      const ax = px(pre[i].x);
      const ay = py(pre[i].y);
      const bx = px(post[j].x);
      const by = py(post[j].y);
      const u = Math.min(1, use[i][j] * 8);
      const col = w >= 0 ? [90, 200, 235] : [255, 45, 120];
      ctx.strokeStyle = rgba(col, 0.06 + 0.42 * mag);
      ctx.lineWidth = 0.6 + 3.4 * mag;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      if (u > 0.25 && mag > 0.3) {
        ctx.strokeStyle = rgba([200, 235, 255], 0.14 * u);
        ctx.lineWidth = 0.6 + 4.6 * mag;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
  }
}

function drawNeurons(
  ctx: CanvasRenderingContext2D,
  px: (x: number) => number,
  py: (y: number) => number,
  nodes: NodePos[],
  act: number[],
  target: number[] | null,
  flash: Float32Array | null,
) {
  for (let i = 0; i < nodes.length; i++) {
    const x = px(nodes[i].x);
    const y = py(nodes[i].y);
    const a = act[i];
    const col = nodes[i].col;
    const r = 9 + 5 * a;

    if (target) {
      const tr = 9 + 5 * target[i] + 5;
      ctx.strokeStyle = 'rgba(226,232,240,0.28)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, tr, 0, 6.2832);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (flash && flash[i] > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
      g.addColorStop(0, rgba(col, 0.5 * flash[i]));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, 6.2832);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, rgba(col, 0.35 + 0.6 * a));
    grd.addColorStop(0.65, rgba(col, 0.25 + 0.4 * a));
    grd.addColorStop(1, rgba(col, 0.05));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = rgba([235, 245, 255], 0.35 + 0.55 * a);
    ctx.beginPath();
    ctx.arc(x, y, 2 + 1.5 * a, 0, 6.2832);
    ctx.fill();
  }
}

function maxAbsW(W: number[][]): number {
  let m = 0;
  for (const row of W) for (const v of row) m = Math.max(m, Math.abs(v));
  return m;
}

function drawLoss(ctx: CanvasRenderingContext2D, W: number, H: number, hist: number[], maxLoss: number) {
  ctx.clearRect(0, 0, W, H);
  const padL = 4;
  const padB = 4;
  const padT = 6;
  const plotW = W - padL;
  const plotH = H - padB - padT;

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 3; g++) {
    const y = padT + (plotH * g) / 3;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  if (hist.length < 2) {
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('press Train to begin...', padL + 6, padT + plotH / 2);
    return;
  }

  const yMax = Math.max(maxLoss, 1e-4);
  const n = hist.length;
  const stride = Math.max(1, Math.floor(n / Math.max(1, plotW)));
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i += stride) {
    const x = padL + (plotW * i) / (n - 1);
    const y = padT + plotH * (1 - hist[i] / yMax);
    pts.push([x, y]);
  }
  const lastX = padL + plotW;
  const lastY = padT + plotH * (1 - hist[n - 1] / yMax);
  pts.push([lastX, lastY]);

  const fill = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  fill.addColorStop(0, 'rgba(245,158,11,0.28)');
  fill.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], padT + plotH);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(pts[pts.length - 1][0], padT + plotH);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#FCD34D';
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();

  const [cx, cy] = pts[pts.length - 1];
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.6, 0, 6.2832);
  ctx.fill();
}
