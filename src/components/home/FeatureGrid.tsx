import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Dna, BookOpen, BarChart2, Microscope, Activity, ArrowRight } from 'lucide-react';

const pages = [
  {
    icon:      Zap,
    color:     'cyan',
    name:      'Lab',
    path:      '/lab',
    desc:      'Four live simulators covering dopamine reward dynamics, BDNF neuroplasticity, BCM synaptic plasticity, and neural oscillation entrainment. Adjust musical parameters with sliders and watch each model respond in real time.',
    linkLabel: 'Open Lab',
  },
  {
    icon:      Dna,
    color:     'emerald',
    name:      'Dashboard',
    path:      '/dashboard',
    desc:      'Log practice sessions with self-reported mood, focus, and flow state. Once you have sessions, the dashboard runs the BDNF and dopamine models on your actual data and shows a neural impact analysis alongside your session history.',
    linkLabel: 'Track Sessions',
  },
  {
    icon:      BookOpen,
    color:     'gold',
    name:      'Learn',
    path:      '/learn',
    desc:      'Read about the neuroscience behind the simulations. Covers mesolimbic reward pathways, activity-dependent BDNF release, BCM plasticity rules, and theta-gamma coupling, with citations to peer-reviewed literature.',
    linkLabel: 'Explore Science',
  },
  {
    icon:      BarChart2,
    color:     'purple',
    name:      'Explorer',
    path:      '/research',
    desc:      'Dig into how practice parameters shape model outputs. Built from 5,000 randomized simulated sessions, this page charts what the models predict across the full input space — frequency, duration, complexity, and instrument. Model outputs only, not empirical human data.',
    linkLabel: 'Explore Parameters',
  },
  {
    icon:      Microscope,
    color:     'pink',
    name:      'About',
    path:      '/about',
    desc:      'Read the science and research behind each model. Learn about our purpose, the assumptions we make, and the peer-reviewed literature that inspired the project.',
    linkLabel: 'See Methods',
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; tag: string }> = {
  cyan:   { border: 'border-cyan/20 hover:border-cyan/40',      bg: 'bg-cyan/10',    text: 'text-cyan',         tag: 'tag-cyan'   },
  emerald:{ border: 'border-emerald/20 hover:border-emerald/40', bg: 'bg-emerald/10', text: 'text-emerald-light', tag: 'tag-emerald' },
  gold:   { border: 'border-gold/20 hover:border-gold/40',      bg: 'bg-gold/10',    text: 'text-gold-light',   tag: 'tag-gold'   },
  purple: { border: 'border-purple/20 hover:border-purple/40',  bg: 'bg-purple/10',  text: 'text-purple-light', tag: 'tag-purple' },
  pink:   { border: 'border-pink/20 hover:border-pink/40',      bg: 'bg-pink/10',    text: 'text-pink-light',   tag: 'tag-pink'   },
};

const stats = [
  { value: '4',   label: 'Biochemistry Models',  suffix: ''  },
  { value: '12',  label: 'Tunable Parameters',   suffix: '+' },
  { value: '5,000', label: 'Simulated Sessions',    suffix: '' },
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
        <span className="section-label justify-center">What's here</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-4">
          Five pages,{' '}
          <span className="gradient-text">each with a purpose</span>
        </h2>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Cognichord is built around four neuroscience-inspired computational models,
          a personal practice tracker, and a library of educational content.
          Each page below has a specific role towards this project. Start anywhere that interests you.
        </p>
      </motion.div>

      {/* Stats row */}
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

      {/* Page links grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pages.map((p, i) => {
          const Icon = p.icon;
          const c = colorMap[p.color] ?? colorMap.cyan;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`card-glass card-glass-hover rounded-xl p-6 border ${c.border} transition-all duration-300 flex flex-col`}
            >
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-4.5 h-4.5 ${c.text}`} />
              </div>
              <h3 className="font-display font-semibold text-slate-100 text-base mb-2">
                {p.name}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-5">
                {p.desc}
              </p>
              <Link
                to={p.path}
                className={`flex items-center gap-1.5 text-sm font-medium ${c.text} hover:gap-2.5 transition-all`}
              >
                {p.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
