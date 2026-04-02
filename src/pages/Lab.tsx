import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Dna, Layers, Radio } from 'lucide-react';
import DopamineSimulator from '../components/simulators/DopamineSimulator';
import BDNFSimulator from '../components/simulators/BDNFSimulator';
import PlasticitySimulator from '../components/simulators/PlasticitySimulator';
import OscillationSimulator from '../components/simulators/OscillationSimulator';

const TABS = [
  {
    id: 'dopamine',
    label: 'Dopamine',
    sublabel: 'Reward Dynamics',
    icon: Zap,
    color: 'cyan',
    Component: DopamineSimulator,
  },
  {
    id: 'bdnf',
    label: 'BDNF',
    sublabel: 'Neuroplasticity',
    icon: Dna,
    color: 'emerald',
    Component: BDNFSimulator,
  },
  {
    id: 'plasticity',
    label: 'Synaptic',
    sublabel: 'Plasticity',
    icon: Layers,
    color: 'purple',
    Component: PlasticitySimulator,
  },
  {
    id: 'oscillations',
    label: 'Neural',
    sublabel: 'Oscillations',
    icon: Radio,
    color: 'pink',
    Component: OscillationSimulator,
  },
] as const;

const colorMap: Record<string, { active: string; border: string; bg: string; text: string }> = {
  cyan:   { active: 'border-cyan/40 bg-cyan/[0.08]',    border: 'border-white/[0.06]', bg: '', text: 'text-cyan'         },
  emerald:{ active: 'border-emerald/40 bg-emerald/[0.08]', border: 'border-white/[0.06]', bg: '', text: 'text-emerald'   },
  purple: { active: 'border-purple/40 bg-purple/[0.08]', border: 'border-white/[0.06]', bg: '', text: 'text-purple-light'},
  pink:   { active: 'border-pink/40 bg-pink/[0.08]',    border: 'border-white/[0.06]', bg: '', text: 'text-pink-light'  },
};

export default function Lab() {
  const [activeTab, setActiveTab] = useState<string>('dopamine');

  const active = TABS.find(t => t.id === activeTab)!;
  const ActiveComponent = active.Component;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
                <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <span className="section-label">Simulation Lab</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-2">
            Computational Biochemistry{' '}
            <span className="gradient-text">Simulators</span>
          </h1>
          <p className="text-slate-500 text-base max-w-2xl">
            Four interconnected models link musical stimuli to neurotransmitter dynamics,
            synaptic plasticity, and neural oscillation patterns. All parameters update in real time and are meant for exploration, not diagnosis or individualized medical prediction.
          </p>
        </motion.div>

                <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-2 mb-7 flex-wrap"
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const c = colorMap[tab.color];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? `${c.active} ${c.text}`
                    : 'border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-semibold leading-none mb-0.5">{tab.label}</div>
                  <div className="text-xs opacity-70">{tab.sublabel}</div>
                </div>
              </button>
            );
          })}
        </motion.div>

                <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
