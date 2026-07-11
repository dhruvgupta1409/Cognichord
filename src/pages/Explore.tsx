import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MousePointerClick, PenLine } from 'lucide-react';
import BrainStage from '../components/brain/BrainStage';
import BrainExplorer from '../components/brain/BrainExplorer';
import { REGIONS, REGION_BY_KEY } from '../components/brain/regions';
import { ATLAS } from '../data/brainAtlas';

const SKILL_STEPS = [
  { key: 'hippocampus',   n: '01', title: 'You memorize it', body: 'At first, remembering what comes next takes conscious effort. The hippocampus stores the piece in memory and replays it during sleep, which helps move it toward long-term storage.' },
  { key: 'basal-ganglia', n: '02', title: 'It becomes a habit', body: 'With each accurate repetition, dopamine strengthens the movements that succeeded. The basal ganglia gradually takes over control of these movements from the conscious, effortful systems.' },
  { key: 'cerebellum',    n: '03', title: 'It gets smooth and fast', body: 'The cerebellum corrects the small timing errors in each repetition, which turns an uneven passage into a smooth and even one.' },
];

export default function Explore() {
  const [open, setOpen] = useState(false);
  const [regionId, setRegionId] = useState<number | null>(null);

  const openAt = (id: number) => { setRegionId(id); setOpen(true); };

  return (
    <div>
      <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-12">
        <div className="absolute inset-0 bg-gradient-neural" />
        <div className="absolute inset-0 bg-neural-grid opacity-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-cyan text-sm font-semibold tracking-wide uppercase mb-5">
              CogniChord
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.05] mb-6">
              How the brain learns and responds to{' '}
              <span className="gradient-text">music.</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-xl mb-8">
              This is an interactive 3D brain model. You can rotate it, zoom in, and click any region to read what that region does while you play.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => openAt(2)} className="btn-primary flex items-center gap-2 py-3 px-6 text-sm">
                Explore the brain <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/practice" className="btn-ghost text-sm py-3 px-6 flex items-center gap-2">
                <PenLine className="w-4 h-4" /> Track your practice
              </Link>
            </div>
            <div className="hidden sm:flex items-center gap-2 mt-8 text-xs text-slate-600">
              <MousePointerClick className="w-3.5 h-3.5" />
              Drag to rotate · scroll to zoom · click a region to open it
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative h-[380px] sm:h-[480px] lg:h-[580px]"
          >
            <div className="group relative w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-[#04060e] ring-1 ring-white/[0.04] shadow-[0_20px_60px_-20px_rgba(0,212,255,0.35)] hover:border-cyan/30 transition-colors duration-500">
              <div className="pointer-events-none absolute -inset-6 bg-[radial-gradient(circle_at_50%_45%,rgba(0,212,255,0.12),transparent_60%)] blur-2xl" />
              <BrainStage onOpen={openAt} paused={open} className="relative w-full h-full cursor-grab active:cursor-grabbing" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.06] bg-gradient-to-t from-black/40 via-transparent to-black/10" />
              <div className="pointer-events-none absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] uppercase tracking-widest text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" /> Live model
              </div>
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 text-xs text-slate-200 opacity-90 group-hover:opacity-100 group-hover:border-cyan/30 transition-all pointer-events-none">
                <MousePointerClick className="w-3.5 h-3.5 text-cyan" /> Click any region to explore
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-600">
              A general representation — not an anatomically exact model.{' '}
              <Link to="/about#credits" className="underline underline-offset-2 hover:text-slate-400 transition-colors">Data &amp; credits</Link>
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mb-28">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="section-label justify-center">The tour</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100">
            Each region has a specific role when you play
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mt-3">
            Click any region to open it in the full brain model, with its anatomy, the underlying biology, and what it means for your playing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGIONS.map((r, i) => {
            const entry = ATLAS[r.key];
            if (!entry) return null;
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.06 }}
                onClick={() => openAt(r.id)}
                className="text-left sim-panel !p-5 hover:border-white/[0.14] transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: r.color }} />
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
                  <h3 className="font-display font-semibold text-slate-100">{r.name}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{entry.oneLiner}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: r.color }}>
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mb-28">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="section-label justify-center">The big idea</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100">
            How a new piece becomes <span className="gradient-text">automatic</span>
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mt-3">
            As you practice, three brain systems pass the work between one another. Click any step to see the structure responsible for it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SKILL_STEPS.map((s, i) => {
            const r = REGION_BY_KEY[s.key];
            return (
              <motion.button
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => openAt(r.id)}
                className="text-left sim-panel relative overflow-hidden hover:border-white/[0.14] transition-all"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: r.color, opacity: 0.6 }} />
                <div className="font-mono text-3xl font-bold mb-3" style={{ color: r.color }}>{s.n}</div>
                <h3 className="font-display font-semibold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-3">{s.body}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: r.color }}>
                  Open the {r.name.toLowerCase()} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to="/practice" className="card-glass card-glass-hover rounded-2xl p-8 border border-emerald/20 hover:border-emerald/40 flex flex-col transition-all">
            <h3 className="font-display font-bold text-xl text-slate-100 mb-2">Track your practice</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Log a practice session to see which of these brain systems that session engaged, along with research-based suggestions for your next session.
            </p>
            <span className="text-emerald text-sm font-medium flex items-center gap-1.5">Go to Practice <ArrowRight className="w-4 h-4" /></span>
          </Link>
          <Link to="/learn" className="card-glass card-glass-hover rounded-2xl p-8 border border-cyan/20 hover:border-cyan/40 flex flex-col transition-all">
            <h3 className="font-display font-bold text-xl text-slate-100 mb-2">Learn the science</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Explanations of why slow practice, sleep, and spacing help, with the supporting research available in one click.
            </p>
            <span className="text-cyan text-sm font-medium flex items-center gap-1.5">Go to Learn <ArrowRight className="w-4 h-4" /></span>
          </Link>
        </div>
      </section>

      <BrainExplorer open={open} initialRegionId={regionId} onClose={() => setOpen(false)} />
    </div>
  );
}
