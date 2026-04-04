import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FlaskConical } from 'lucide-react';
import NeuralCanvas from './NeuralCanvas';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-neural" />
      <NeuralCanvas />
      <div className="absolute inset-0 bg-neural-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,212,255,0.04),transparent)]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <span className="tag tag-cyan">
            <FlaskConical className="w-3 h-3" />
            Computational Neuroscience
          </span>
          <span className="tag tag-purple">Music Cognition</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05] mb-6"
        >
          <span className="gradient-text">Cognichord</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-3"
        >
          Explore what practicing music does to your brain!
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-slate-500 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed"
        >
          Four neuroscience-inspired computational models run in real time on musical parameters.
          Log your practice sessions and see what the models predict about your dopamine, BDNF,
          and synaptic plasticity.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/lab" className="btn-primary flex items-center gap-2 py-3 px-6 text-sm">
            Open the Simulation Lab
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/dashboard" className="btn-secondary flex items-center gap-2 py-3 px-6 text-sm">
            Track My Practice
          </Link>
          <Link to="/learn" className="btn-ghost text-sm py-3 px-6">
            The Science
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-cyan/40 to-transparent animate-pulse-slow" />
        <span className="text-xs text-slate-600 tracking-widest uppercase">scroll</span>
      </motion.div>
    </section>
  );
}
