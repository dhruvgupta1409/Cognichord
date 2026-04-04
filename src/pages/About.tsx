import { motion } from 'framer-motion';
import { FlaskConical, BookOpen, Code, Brain, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MODELS = [
  {
    title: 'Dopamine Dynamics Model',
    tag: 'Reward Signaling',
    tagColor: 'tag-cyan',
    basis: 'Inspired by Schultz (1998) reward prediction error (RPE) framework and groove literature (Witek et al., 2014); music‑specific parameterization is a modelling extension.',
    params: ['BPM', 'Musical Mode', 'Session Duration', 'Novelty Factor', 'Practice Frequency'],
    outputs: ['Phasic/Tonic DA trace', 'Reward Index', 'D2 receptor sensitivity curve'],
    equations: ['D(t) = D_tonic + Σᵢ A·RPE(tᵢ)·exp(−(t − tᵢ)/τ_effective)', 'RPE = Actual − Expected reward (modelled at musical events)', 'τ_effective ≈ several minutes (session‑scale effective decay constant; actual synaptic dopamine transients are ms‑scale and plasma half‑life is ≈2 min).'],
    color: '#00D4FF',
  },
  {
    title: 'BDNF Release & Neuroplasticity',
    tag: 'Neurotrophic Factor',
    tagColor: 'tag-emerald',
    basis: 'Exercise–BDNF relationship (Gomez‑Pinilla & Hillman, 2013) and reviews on BDNF in activity‑dependent plasticity; kinetics and mapping from practice to BDNF are modelling approximations.',
    params: ['Session Duration', 'Complexity', 'Frequency/Week', 'Instrument'],
    outputs: ['BDNF‑like trajectory', 'Neuroplasticity Index', 'Synaptic density (Gompertz curve)'],
    equations: ['ΔBDNF = C·log(1 + T/25)·(0.5 + k/5)·M', 'decay: dB/dt = −B·ln2 / t₁/₂ (t₁/₂ chosen in the hours–day range for the model signal; real plasma BDNF half‑life is minutes)', 'NPI = min(60, ΔBDNF%) + min(40, N_sessions·1.2)'],
    color: '#10B981',
  },
  {
    title: 'Synaptic Plasticity (BCM Rule)',
    tag: 'LTP/LTD',
    tagColor: 'tag-purple',
    basis: 'Bienenstock, Cooper & Munro (1982) and later calcium‑dependent BCM‑like models.',
    params: ['Rhythm Pattern', 'Stimulation Amplitude', 'Session Duration', 'Practice Days'],
    outputs: ['Synaptic weight W(t)', 'Ca²⁺ dynamics', 'BCM threshold θ_M'],
    equations: ['dW/dt = η·φ(v, θ_M) − ε·W', 'φ(v, θ_M) = v·(v − θ_M) (postsynaptic‑activity‑dependent LTD/LTP function)', 'dθM/dt = (v² − θ_M)/τθ'],
    color: '#8B5CF6',
  },
  {
    title: 'Neural Oscillation Entrainment',
    tag: 'EEG Bands',
    tagColor: 'tag-pink',
    basis: 'Neural entrainment and predictive‑timing work (Large & Snyder 2009; Fujioka et al. and related studies on beta‑band timing and auditory–motor coupling).',
    params: ['BPM', 'Complexity', 'Instrument', 'Duration'],
    outputs: ['Band power spectrum', 'Theta–gamma coupling index', 'Entrainment strength'],
    equations: ['P_band(ω) = f(BPM, complexity, instrument) (phenomenological band‑power function)', 'Entrainment: E = ∫ |cos(φ_θ(t) − φ_beat(t))| dt', 'CEI (Cognitive Engagement Index) = P_θ·a_θ + P_β·a_β + P_γ·a_γ − P_α·a_α, with coefficients chosen for interpretability rather than fit to a specific dataset.'],
    color: '#FF2D78',
  },
];

const TECH_STACK = [
  { name: 'React 18 + TypeScript', role: 'Frontend framework' },
  { name: 'Recharts', role: 'Scientific data visualization' },
  { name: 'Framer Motion', role: 'UI animations' },
  { name: 'Zustand', role: 'Practice session state' },
  { name: 'Tailwind CSS', role: 'Design system' },
  { name: 'Vite', role: 'Build toolchain' },
];

export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
                <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <span className="section-label">About</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-4">
            The Science Behind{' '}
            <span className="gradient-text">Cognichord</span>
          </h1>
          <p className="text-slate-400 text-base max-w-3xl leading-relaxed">
            Cognichord is a unique platform where music meets molecular neuroscience.
            Every simulation is inspired by peer‑reviewed biochemistry and systems‑neuroscience
            research, including models of synaptic dynamics, neurotrophic factor kinetics, and cortical
            oscillation entrainment, and is built as a hypothesis‑generating tool rather than a
            direct implementation of measured biophysical constants. Where the literature is
            uncertain or mixed, we treat the models as explicit, testable proposals.
          </p>
        </motion.div>

                <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14"
        >
          <div className="lg:col-span-2 sim-panel">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-7 h-7 text-cyan" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-slate-100">Founder & Developer - Dhruv Gupta</h2>
                <p className="text-cyan text-sm font-medium">HS Student Deeply Interested in Biochemistry, Neuroscience, and Music</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Hi! I'm Dhruv Gupta, a high school student deeply interested in music, neuroscience,
              and the ways our brains respond to creative activity. I've always been fascinated by
              how playing an instrument can shape the mind: how practice changes not just our skill
              on an instrument, but attention and memory. That curiosity led me to create Cognichord:
              a way to explore and visualize the biological effects of music in a hands-on,
              interactive way.
            </p>

            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Cognichord is an online platform where users can tweak musical parameters like tempo,
              complexity, or mode, and see how these choices might influence dopamine release, BDNF
              levels, synaptic plasticity, and neural oscillations. It's designed for musicians,
              learners, and educators to experiment safely with music-driven neuroscience, track
              practice, and understand how their brains might be changing over time. You can simulate
              sessions, log your own practice with validated self-report measures (mood, anxiety,
              focus, flow state), and explore how musical parameters interact with the computational models.
            </p>

            <p className="text-slate-400 text-sm leading-relaxed">
              Beyond personal exploration, Cognichord is ultimately built to support community
              learning. It encourages students, educators, and young musicians to engage with science
              through music, share insights, and learn collectively. Teaching the arts, especially
              music, is crucial to us; it cultivates focus, creativity, and mental resilience.
              Cognichord aims to make that experience measurable through a scientific lens,
              understandable, and inspiring, showing how the arts can transform the mind and enrich
              our communities.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {['Computational Neuroscience', 'Signal Transduction', 'Music Cognition', 'BDNF Dynamics', 'Synaptic Plasticity', 'Neural Oscillations'].map(tag => (
                <span key={tag} className="tag tag-cyan">{tag}</span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Research Focus', value: 'Activity‑dependent neuroplasticity in music learning', icon: Brain, color: '#00D4FF' },
              { title: 'Approach', value: 'Computational modeling + biophysical equations', icon: Code, color: '#8B5CF6' },
              { title: 'Models built', value: '4 interconnected simulation models', icon: FlaskConical, color: '#10B981' },
              { title: 'Peer-reviewed basis', value: '12+ cited neuroscience and biochemistry papers', icon: BookOpen, color: '#F59E0B' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="sim-panel">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-xs text-slate-500 font-medium">{item.title}</span>
                  </div>
                  <p className="text-sm text-slate-300">{item.value}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Model documentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <div className="mb-6">
            <span className="section-label">Model Documentation</span>
            <h2 className="font-display font-bold text-2xl text-slate-100">
              The Computational Models
            </h2>
          </div>

          <div className="space-y-4">
            {MODELS.map((model, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="card-glass rounded-xl border overflow-hidden"
                style={{ borderColor: `${model.color}22` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`tag ${model.tagColor}`}>{model.tag}</span>
                        <span className="text-xs text-slate-600">Based on: {model.basis}</span>
                      </div>
                      <h3 className="font-display font-semibold text-slate-100">{model.title}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Inputs */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Inputs</div>
                      {model.params.map(p => (
                        <div key={p} className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                          <ChevronRight className="w-3 h-3" style={{ color: model.color }} />
                          {p}
                        </div>
                      ))}
                    </div>
                    {/* Outputs */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Outputs</div>
                      {model.outputs.map(o => (
                        <div key={o} className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                          <ChevronRight className="w-3 h-3" style={{ color: model.color }} />
                          {o}
                        </div>
                      ))}
                    </div>
                    {/* Equations */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Key Equations</div>
                      {model.equations.map(eq => (
                        <div key={eq} className="text-xs font-mono text-slate-500 mb-1.5 leading-relaxed"
                          style={{ color: `${model.color}BB` }}>
                          {eq}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          <div className="sim-panel">
            <h3 className="font-display font-semibold text-slate-200 mb-4">Technical Implementation</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              All simulations run entirely in the browser via TypeScript with no server‑side
              computation required. The mathematical models are implemented as pure functions
              with deterministic seeded noise for reproducibility. Numerical integration uses
              explicit Euler with adaptive time‑stepping appropriate for the timescales involved
              (milliseconds for Ca²⁺ dynamics, minutes for dopamine traces, days for BDNF kinetics).
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {TECH_STACK.map((t, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5">
                  <div className="text-xs font-medium text-slate-300">{t.name}</div>
                  <div className="text-xs text-slate-600">{t.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-display font-semibold text-slate-200 mb-4">Limitations & Future Work</h3>
            <div className="space-y-3">
              {[
                { title: 'Simplified pharmacokinetics', desc: 'The models use single‑compartment, single‑half‑life kinetics; real brain pharmacokinetics involve multiple compartments (plasma, CSF, tissue), blood–brain barrier transport, protein binding, and regional heterogeneity.' },
                { title: 'Individual variability', desc: 'Parameters are tuned to be plausible for population averages. Genetic polymorphisms (e.g., COMT Val158Met, BDNF Val66Met) and life‑history factors can produce multi‑fold variation in neurotransmitter and growth‑factor dynamics that are not captured here.' },
                { title: 'Cross-model coupling', desc: 'Future versions will couple models bidirectionally: for example, dopamine and stress hormones modulating BDNF expression, and BDNF and synaptic history feeding back to plasticity thresholds and network excitability.' },
                { title: 'Validation dataset', desc: 'Community practice data will be used, in collaboration with clinical and basic‑science partners, to compare model predictions against real biomarker and behavioral measurements (e.g., cognitive tests, imaging) and to refine or reject specific model assumptions.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0 mt-1.5" />
                  <div>
                    <span className="text-sm text-slate-300 font-medium">{item.title} : </span>
                    <span className="text-sm text-slate-500">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-slate-500 text-sm mb-4">Explore the models yourself</p>
          <Link to="/lab" className="btn-primary inline-flex items-center gap-2">
            Open the Simulation Lab <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
