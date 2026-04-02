import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Atom, Activity, BookOpen, Users, TrendingUp, Zap, ArrowRight, Microscope
} from 'lucide-react';

const features = [
  {
    icon:     Atom,
    color:    'cyan',
    tag:      'Simulation',
    title:    'Interactive Biochemistry Models',
    desc:     'Run real-time dopamine, BDNF, and synaptic plasticity simulations driven by musical parameters — tempo, mode, complexity, practice schedule.',
    link:     '/lab',
    linkLabel: 'Open Lab',
  },
  {
    icon:     Activity,
    color:    'purple',
    tag:      'Neural Science',
    title:    'Neural Oscillation Analyzer',
    desc:     'Model how musical stimuli entrain theta, alpha, beta, and gamma oscillations in auditory and motor cortex. Visualize cross‑frequency coupling patterns that have been implicated in timing and memory.',
    link:     '/lab',
    linkLabel: 'Run Analyzer',
  },
  {
    icon:     TrendingUp,
    color:    'emerald',
    tag:      'Dashboard',
    title:    'Practice → Biochemistry Tracker',
    desc:     'Log your sessions and watch the model estimate cumulative BDNF exposure, synaptic potentiation curves, and neuroplasticity indices over weeks.',
    link:     '/dashboard',
    linkLabel: 'Track Sessions',
  },
  {
    icon:     BookOpen,
    color:    'gold',
    tag:      'Education',
    title:    'Biochemistry of Music — Explained',
    desc:     'From the mesolimbic reward circuit to NMDA‑dependent LTP: understand the molecular mechanisms neuroscientists study when they investigate why music can be so rewarding and transformative.',
    link:     '/learn',
    linkLabel: 'Explore Science',
  },
  {
    icon:     Users,
    color:    'pink',
    tag:      'Community',
    title:    'Virtual Research Studies',
    desc:     'Contribute to anonymous aggregate datasets. Compare your practice patterns and model‑predicted outcomes to the broader Cognichord community.',
    link:     '/research',
    linkLabel: 'Join Study',
  },
  {
    icon:     Microscope,
    color:    'cyan',
    tag:      'Methodology',
    title:    'Literature‑Inspired Model Foundations',
    desc:     'Every simulation is inspired by published neuroscience — Schultz\'s reward prediction error framework, the BCM plasticity rule, oscillatory entrainment models, and the exercise–BDNF relationship — and implemented as hypothesis‑generating computational models with transparent assumptions.',
    link:     '/about',
    linkLabel: 'See Methods',
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; tag: string }> = {
  cyan:   { border: 'border-cyan/20 hover:border-cyan/40',    bg: 'bg-cyan/10',   text: 'text-cyan',         tag: 'tag-cyan'   },
  purple: { border: 'border-purple/20 hover:border-purple/40', bg: 'bg-purple/10', text: 'text-purple-light', tag: 'tag-purple' },
  pink:   { border: 'border-pink/20 hover:border-pink/40',    bg: 'bg-pink/10',   text: 'text-pink-light',   tag: 'tag-pink'   },
  emerald:{ border: 'border-emerald/20 hover:border-emerald/40', bg: 'bg-emerald/10', text: 'text-emerald-light', tag: 'tag-emerald'},
  gold:   { border: 'border-gold/20 hover:border-gold/40',    bg: 'bg-gold/10',   text: 'text-gold-light',   tag: 'tag-gold'   },
};

const stats = [
  { value: '4',    label: 'Biochemistry Models',    suffix: '' },
  { value: '12',   label: 'Tunable Parameters',     suffix: '+' },
  { value: '100',  label: 'Neuroplasticity Index',  suffix: 'pt' },
  { value: '5',    label: 'Neural Frequency Bands', suffix: '' },
];

export default function FeatureGrid() {
  return (
    <div className="max-w-7xl mx-auto px-6">
            <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <span className="section-label justify-center">Platform Overview</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-4">
          An Interactive Online Lab<br />
          <span className="gradient-text">for Music Cognition</span>
        </h2>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Every module is inspired by peer‑reviewed neuroscience and implemented as an
          interactive computational model you can run in the browser. Parameters blend
          empirically informed ranges with explicit modelling assumptions — each simulator's
          "Model basis" note details what is literature‑supported vs. what is a modelling choice.
        </p>
      </motion.div>

            <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
      >
        {stats.map((s, i) => (
          <div key={i} className="sim-panel text-center">
            <div className="stat-value gradient-text-cyan mb-1">
              {s.value}<span className="text-cyan/60 text-xl">{s.suffix}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          const c = colorMap[f.color] ?? colorMap.cyan;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className={`card-glass card-glass-hover rounded-xl p-6 border ${c.border} transition-all duration-300 flex flex-col`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <span className={`tag ${c.tag}`}>{f.tag}</span>
              </div>
              <h3 className="font-display font-semibold text-slate-100 text-base mb-2.5 leading-snug">
                {f.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-5">
                {f.desc}
              </p>
              <Link
                to={f.link}
                className={`flex items-center gap-1.5 text-sm font-medium ${c.text} hover:gap-2.5 transition-all`}
              >
                {f.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          );
        })}
      </div>

            <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-16 rounded-2xl border border-cyan/15 bg-gradient-to-r from-cyan/[0.04] via-purple/[0.04] to-pink/[0.04] p-10 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-cyan" />
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan">Ready to run your first simulation?</span>
        </div>
        <h3 className="font-display font-bold text-2xl text-slate-100 mb-3">
          Open the Dopamine Simulator
        </h3>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          Input a BPM, choose a musical mode, set your session length, and watch a simplified
          mesolimbic reward circuit model respond in real time.
        </p>
        <Link to="/lab" className="btn-primary inline-flex items-center gap-2">
          Launch Lab <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
