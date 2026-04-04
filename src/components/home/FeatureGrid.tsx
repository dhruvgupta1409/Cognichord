import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Atom, TrendingUp, BookOpen, ArrowRight } from 'lucide-react';

const features = [
  {
    icon:      Atom,
    color:     'cyan',
    tag:       'Simulation Lab',
    title:     'Four Interconnected Models',
    desc:      'Dopamine reward, BDNF neuroplasticity, synaptic plasticity, and neural oscillations — all driven by your musical parameters in real time. Change a tempo or instrument and watch the neuroscience respond.',
    link:      '/lab',
    linkLabel: 'Open Lab',
  },
  {
    icon:      TrendingUp,
    color:     'emerald',
    tag:       'Your Practice',
    title:     'Neural Impact from Real Sessions',
    desc:      'Log your practice sessions and the models run on your actual data. See your BDNF trajectory built from your history, your LTP threshold today, and how one more session per week changes your 8-week projection.',
    link:      '/dashboard',
    linkLabel: 'Track Sessions',
  },
  {
    icon:      BookOpen,
    color:     'gold',
    tag:       'The Science',
    title:     'Mechanisms Behind the Models',
    desc:      'From mesolimbic reward circuits to NMDA-dependent LTP and theta-gamma coupling — understand the peer-reviewed science each model is grounded in, with honest notes on what is literature-supported and what is a modelling assumption.',
    link:      '/learn',
    linkLabel: 'Explore Science',
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; tag: string }> = {
  cyan:   { border: 'border-cyan/20 hover:border-cyan/40',      bg: 'bg-cyan/10',    text: 'text-cyan',         tag: 'tag-cyan'   },
  emerald:{ border: 'border-emerald/20 hover:border-emerald/40', bg: 'bg-emerald/10', text: 'text-emerald-light', tag: 'tag-emerald' },
  gold:   { border: 'border-gold/20 hover:border-gold/40',      bg: 'bg-gold/10',    text: 'text-gold-light',   tag: 'tag-gold'   },
};

const stats = [
  { value: '4',   label: 'Biochemistry Models',  suffix: ''  },
  { value: '12',  label: 'Tunable Parameters',   suffix: '+' },
  { value: '5',   label: 'Neural Frequency Bands', suffix: '' },
  { value: '100', label: 'Browser-Private',       suffix: '%' },
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
        <span className="section-label justify-center">What Cognichord Does</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-4">
          One Cohesive Platform —<br />
          <span className="gradient-text">Not Four Separate Tools</span>
        </h2>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Your logged practice sessions feed directly into the simulators.
          The BDNF model talks to the plasticity model. Every number has a source.
          Every chart connects to the same underlying story.
        </p>
      </motion.div>

      {/* Stats */}
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

      {/* 3 Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          const c = colorMap[f.color] ?? colorMap.cyan;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
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
    </div>
  );
}
