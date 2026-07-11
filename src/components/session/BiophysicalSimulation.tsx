import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { Cpu, Play, RefreshCw, ServerCrash, Zap, Activity, Droplets, Waves } from 'lucide-react';
import {
  runSimulation,
  type SimParams, type SimResult, type SimError, type Raster,
} from '../../lib/simApi';

const axis = { stroke: '#3a4763', fontSize: 10 };
const grid = 'rgba(255,255,255,0.05)';
const tipStyle = {
  contentStyle: { background: '#070b16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#94a3b8' }, itemStyle: { padding: 0 },
};

function LayerHead({ icon: Icon, title, sub, color }: { icon: typeof Zap; title: string; sub: string; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{sub}</p>
    </div>
  );
}

function RasterPlot({ raster, nCtx, nStr, label }: { raster: Raster; nCtx: number; nStr: number; label: string }) {
  const W = 300, H = 150, pad = 4;
  const win = raster.window_ms || 200;
  const total = nCtx + nStr;
  const yFor = (row: number) => pad + (row / total) * (H - 2 * pad);
  const xFor = (t: number) => pad + (t / win) * (W - 2 * pad);
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg bg-black/25 border border-white/[0.05]">
        <line x1={0} x2={W} y1={yFor(nCtx)} y2={yFor(nCtx)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        {raster.cortex.t.map((t, k) => (
          <circle key={`c${k}`} cx={xFor(t)} cy={yFor(raster.cortex.i[k])} r={0.9} fill="#00D4FF" opacity={0.75} />
        ))}
        {raster.striatum.t.map((t, k) => (
          <circle key={`s${k}`} cx={xFor(t)} cy={yFor(nCtx + raster.striatum.i[k])} r={1.1} fill="#FF2D78" opacity={0.85} />
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
        <span><span className="text-cyan">●</span> notes coming in &nbsp; <span className="text-pink">●</span> the circuit playing</span>
        <span>{raster.striatum.t.length} response firings</span>
      </div>
    </div>
  );
}

function Explain({ what, why }: { what: string; why: string }) {
  return (
    <div className="mt-2 space-y-1">
      <p className="text-[11px] text-slate-400 leading-snug"><span className="font-semibold text-slate-300">What you are seeing: </span>{what}</p>
      <p className="text-[11px] text-emerald-light/90 leading-snug"><span className="font-semibold">What it means for you: </span>{why}</p>
    </div>
  );
}

type Status = 'idle' | 'running' | 'done' | 'error';

export default function BiophysicalSimulation({ params, sessionLabel }: { params: SimParams; sessionLabel: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<SimResult | null>(null);
  const [err, setErr] = useState<SimError | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);

  const run = useMemo(() => async () => {
    setStatus('running'); setErr(null); setElapsed(0);
    const t0 = performance.now();
    const timer = setInterval(() => setElapsed((performance.now() - t0) / 1000), 100);
    try {
      const res = await runSimulation(params);
      setData(res); setStatus('done');
    } catch (e) {
      setErr(e as SimError); setStatus('error');
    } finally {
      clearInterval(timer);
    }
  }, [params]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
  }, [run]);

  return (
    <div className="sim-panel">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Cpu className="w-4 h-4 text-cyan" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-cyan">Live spiking-network simulation</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border text-emerald border-emerald/25 bg-emerald/[0.08]">Brian2 engine</span>
          </div>
          <h3 className="font-display font-semibold text-slate-100 text-lg leading-snug">A small model brain circuit, practising a passage like yours</h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            This is a small working model of the brain circuit that learns physical skills. It uses simulated
            nerve cells, wired the way a musician’s motor circuits are, and it rehearses a passage using the
            settings from your session ({sessionLabel}). Everything below is what happened <em>inside that model</em> as it
            learned. It illustrates how skill-learning works in general — it is not a scan, measurement, or simulation of your own brain.
            <span className="block mt-1 text-slate-600">For the curious: this is a conductance-based cortico-striatal spiking network with Tsodyks–Markram synaptic release and dopamine-modulated STDP, solved in Brian2.</span>
          </p>
        </div>
        {status === 'done' && (
          <button onClick={run} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Re-run
          </button>
        )}
      </div>

      {status === 'running' && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}>
            <Cpu className="w-8 h-8 text-cyan" />
          </motion.div>
          <p className="text-sm text-slate-300 mt-3">Integrating the network in Brian2...</p>
          <p className="text-[11px] text-slate-500 mt-1">Solving conductance and gating ODEs across {params.repetitions} rehearsal trials · {elapsed.toFixed(1)}s</p>
        </div>
      )}

      {status === 'error' && err && (
        <div className="py-8 px-4 rounded-xl border border-gold/20 bg-gold/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <ServerCrash className="w-4 h-4 text-gold-light" />
            <span className="text-sm font-semibold text-slate-200">
              {err.kind === 'offline' ? 'This runs as an optional local simulation' : err.kind === 'timeout' ? 'Simulation timed out' : 'Simulation failed'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            The live spiking-network view is powered by a Brian2 Python backend, which is optional and runs on your own machine — it is not hosted with the site. If you have the project locally, start it with one command (it sets up its own environment the first time) and this panel runs automatically:
          </p>
          <div className="rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-[12px] text-emerald-light leading-relaxed overflow-x-auto">
            npm run sim
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            (equivalently: <span className="font-mono">bash backend/run.sh</span>). No data is shown until a run succeeds.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={run} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        </div>
      )}

      {status === 'done' && data && <Results data={data} />}
    </div>
  );
}

function Results({ data }: { data: SimResult }) {
  const learn = useMemo(() => data.learning.trial.map((tr, i) => ({
    trial: tr,
    response: +(data.learning.response[i] * 100).toFixed(1),
    weight: +(data.learning.weight[i]).toFixed(3),
    dopamine: +(data.learning.dopamine[i]).toFixed(3),
  })), [data]);

  const stp = useMemo(() => data.stp.t.map((t, i) => ({ t, u: data.stp.u[i], x: data.stp.x[i] })), [data]);
  const released = useMemo(() => data.stp.spikes.map((s, i) => ({ spike: i + 1, released: +(s.released).toFixed(3) })), [data]);
  const hh = useMemo(() => data.hh.t.map((t, i) => ({ t, v: data.hh.v[i], m: data.hh.m[i], h: data.hh.h[i], n: data.hh.n[i] })), [data]);

  const finalResp = data.learning.response[data.learning.response.length - 1];
  const firstReleased = data.stp.spikes[0]?.released ?? 0;
  const lastReleased = data.stp.spikes[data.stp.spikes.length - 1]?.released ?? 0;
  const dropPct = firstReleased > 0 ? Math.round((1 - lastReleased / firstReleased) * 100) : 0;
  const [showGates, setShowGates] = useState(false);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 -mt-1">
        <span className="font-mono text-slate-400">{data.meta.neurons.cortex + data.meta.neurons.striatum + data.meta.neurons.inhibitory} simulated nerve cells</span>
        <span className="font-mono text-slate-400">{data.meta.synapses} adjustable connections</span>
        <span className="font-mono text-slate-400">{data.meta.trials} rehearsals</span>
        <span>solved live in {data.meta.engine}</span>
      </div>

      <div>
        <LayerHead icon={Activity} color="#34D399"
          title="Watch it learn, one rehearsal at a time"
          sub="The same result shown three ways: how well the circuit plays the passage, the brain's built-in reward signal, and how physically strong the practiced connections have grown." />
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={learn} margin={{ top: 6, right: 10, bottom: 2, left: -6 }}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="trial" {...axis} tickLine={false} label={{ value: 'number of rehearsals', position: 'insideBottom', offset: -2, fill: '#3a4763', fontSize: 9 }} />
              <YAxis yAxisId="l" {...axis} tickLine={false} domain={[0, 100]} width={34} />
              <YAxis yAxisId="r" orientation="right" {...axis} tickLine={false} domain={[0, 'auto']} width={30} />
              <Tooltip {...tipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconType="plainline" />
              <Line yAxisId="l" type="monotone" dataKey="response" name="how well it plays it (%)" stroke="#34D399" strokeWidth={2.4} dot={false} isAnimationActive={false} />
              <Line yAxisId="r" type="monotone" dataKey="dopamine" name={'"that went well" reward signal'} stroke="#00D4FF" strokeWidth={1.8} dot={false} isAnimationActive={false} />
              <Line yAxisId="r" type="monotone" dataKey="weight" name="strength of practiced connections" stroke="#F59E0B" strokeWidth={1.8} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Explain
          what={`Green climbs from shaky to about ${Math.round(finalResp * 100)}% accurate, then levels off once the circuit has learned it. Blue is the brain's reward signal, and orange is how strong the connections physically grew with practice.`}
          why="The reward signal is strongest early, while you are still improving, and it fades as the passage becomes automatic. This is why a piece feels most rewarding to practice while it is still a real challenge, and why keeping that feeling means working just past what is comfortable." />
      </div>

      <div>
        <LayerHead icon={Zap} color="#FF2D78"
          title="Every dot is a nerve cell firing: first try vs. after practice"
          sub="The left panel is the circuit's first attempt, and the right is after it has rehearsed." />
        <div className="flex flex-col sm:flex-row gap-3">
          <RasterPlot raster={data.raster_first} nCtx={data.meta.neurons.cortex} nStr={data.meta.neurons.striatum} label="First attempt" />
          <RasterPlot raster={data.raster_last} nCtx={data.meta.neurons.cortex} nStr={data.meta.neurons.striatum} label={`After ${data.meta.trials} rehearsals`} />
        </div>
        <Explain
          what="Blue dots are the notes coming in, identical every time, like the notes on the page. Pink dots are the circuit actually playing them: scattered and unreliable at first (left), then dense and dependable after rehearsing (right)."
          why={'This is what "it is in the fingers now" looks like from the inside: practice turns a weak, unreliable response into a strong, reliable one that you do not have to think about.'} />
      </div>

      <div>
        <LayerHead icon={Droplets} color="#00D4FF"
          title="Why one connection tires, and why rests help"
          sub="Zooming in on a single connection between two cells, fired rapidly twelve times." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Its supply, over time</div>
            <div className="h-40 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stp} margin={{ top: 6, right: 10, bottom: 2, left: -6 }}>
                  <CartesianGrid stroke={grid} />
                  <XAxis dataKey="t" {...axis} tickLine={false} domain={[0, 'dataMax']} type="number" label={{ value: 'milliseconds', position: 'insideBottom', offset: -2, fill: '#3a4763', fontSize: 9 }} />
                  <YAxis {...axis} tickLine={false} domain={[0, 1]} width={38} />
                  <Tooltip {...tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconType="plainline" />
                  <Line type="monotone" dataKey="x" name="messenger left in the tank" stroke="#7CC5FF" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="u" name="how much each hit uses" stroke="#C084FC" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Signal strength on each hit</div>
            <div className="h-40 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={released} margin={{ top: 6, right: 10, bottom: 2, left: -6 }}>
                  <CartesianGrid stroke={grid} vertical={false} />
                  <XAxis dataKey="spike" {...axis} tickLine={false} label={{ value: 'firing number', position: 'insideBottom', offset: -2, fill: '#3a4763', fontSize: 9 }} />
                  <YAxis {...axis} tickLine={false} domain={[0, 'dataMax']} width={40} tickFormatter={v => Number(v).toFixed(2)} />
                  <Tooltip {...tipStyle} />
                  <Bar dataKey="released" name="signal strength" fill="#00D4FF" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <Explain
          what={`Each time the connection fires, it releases a small amount of chemical messenger across the gap to pass the signal along. Fire it rapidly and the supply runs low, so each hit lands weaker than the last. Here the signal drops about ${dropPct}% from the first firing to the twelfth. A brief pause lets the supply refill.`}
          why="This is one real reason that repeating the same passage over and over gives less with each repetition: the connection runs low on messenger and needs a moment to recover. Short breaks and spacing practice out let it refill, so more of each repetition counts." />
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
          <LayerHead icon={Waves} color="#8B5CF6"
            title={'A single nerve impulse: the brain\'s basic "note"'}
            sub="One cell firing once, zoomed in to a few thousandths of a second." />
          <button onClick={() => setShowGates(v => !v)} className="btn-ghost text-[11px] py-1 px-2.5 flex-shrink-0 whitespace-nowrap">
            {showGates ? 'Hide' : 'Show'} the tiny detail
          </button>
        </div>
        <div className="h-52 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hh} margin={{ top: 6, right: 10, bottom: 2, left: -6 }}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="t" {...axis} tickLine={false} type="number" domain={[0, 'dataMax']} label={{ value: 'milliseconds (thousandths of a second)', position: 'insideBottom', offset: -2, fill: '#3a4763', fontSize: 9 }} />
              <YAxis yAxisId="v" {...axis} tickLine={false} domain={[-90, 55]} width={32} label={{ value: 'voltage', angle: -90, position: 'insideLeft', fill: '#3a4763', fontSize: 9 }} />
              {showGates && <YAxis yAxisId="g" orientation="right" {...axis} tickLine={false} domain={[0, 1]} width={26} />}
              <Tooltip {...tipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconType="plainline" />
              <ReferenceLine yAxisId="v" y={0} stroke="rgba(255,255,255,0.08)" />
              <Line yAxisId="v" type="monotone" dataKey="v" name="the cell’s voltage" stroke="#8B5CF6" strokeWidth={2.4} dot={false} isAnimationActive={false} />
              {showGates && <Line yAxisId="g" type="monotone" dataKey="m" name="sodium door opening" stroke="#FF2D78" strokeWidth={1.2} dot={false} isAnimationActive={false} />}
              {showGates && <Line yAxisId="g" type="monotone" dataKey="h" name="sodium door closing" stroke="#F59E0B" strokeWidth={1.2} dot={false} isAnimationActive={false} />}
              {showGates && <Line yAxisId="g" type="monotone" dataKey="n" name="potassium door (reset)" stroke="#34D399" strokeWidth={1.2} dot={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Explain
          what="When a nerve cell fires, its voltage rises sharply and returns to baseline in about two-thousandths of a second, producing a single spike. Millions of these, timed correctly, produced everything in the charts above."
          why={showGates
            ? "The colored lines are the microscopic ion channels that open and close to produce the spike, which is the real machinery behind every note. These are the Hodgkin–Huxley equations, the model that won a Nobel Prize."
            : "This is the basic on-and-off event underneath every note you play, and everything else on this page is built from it. To see how it works, tap \"show the tiny detail.\""} />
      </div>

      <div className="pt-3 border-t border-white/[0.06]">
        <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-1.5">The science this is built on</div>
        {data.meta.citations.map((c, i) => (
          <p key={i} className="text-[10px] text-slate-600 leading-relaxed">• {c}</p>
        ))}
      </div>
    </div>
  );
}
