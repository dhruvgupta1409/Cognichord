import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, ChevronDown, ArrowRight, PenLine } from 'lucide-react';
import NeurotransmitterCard, { NEUROTRANSMITTERS } from '../components/learn/NeurotransmitterCard';
import PathwayDiagram from '../components/learn/PathwayDiagram';
import NeuralNetLab from '../components/learn/NeuralNetLab';
import DigitalTwinHero from '../components/learn/DigitalTwinHero';
import NeuroTheater from '../components/brain/NeuroTheater';

type Confidence = 'finding' | 'model' | 'heuristic';

const CONF_META: Record<Confidence, { label: string; className: string }> = {
  finding:   { label: 'Research finding', className: 'text-emerald border-emerald/25 bg-emerald/[0.08]' },
  model:     { label: 'Model estimate',   className: 'text-cyan border-cyan/25 bg-cyan/[0.08]' },
  heuristic: { label: 'Rule of thumb',    className: 'text-gold-light border-gold/25 bg-gold/[0.08]' },
};

interface Concept {
  title: string;
  color: string;
  summary: string;
  learnMore: string;
  confidence: Confidence;
  refs: string[];
}

const CONCEPTS: Concept[] = [
  {
    title: 'Why slow practice works',
    color: '#10B981',
    summary:
      'The striatum reinforces the movement that was actually performed, regardless of the movement you intended. If you play a passage quickly and incorrectly, you strengthen the incorrect version. If you slow it down until it is accurate, you give the cortico-striatal circuit a correct pattern to make automatic.',
    learnMore:
      'Reward-modulated plasticity in the striatum mainly strengthens the action that was actually executed and still active when dopamine arrives, rather than an action you only intended. For this reason, accuracy tends to come first: build the correct movement slowly, and then let the cerebellum tighten its timing. This is a mechanistic account of the teaching principle "practice slowly to play fast."',
    confidence: 'model',
    refs: [
      'Reynolds J.N. & Wickens J.R. (2002). Dopamine-dependent plasticity of corticostriatal synapses. Neural Networks.',
      'Ericsson K.A., Krampe R.T. & Tesch-Römer C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychol Rev.',
    ],
  },
  {
    title: 'Why mistakes help you learn',
    color: '#F59E0B',
    summary:
      'A mistake produces new information for the brain. When an outcome differs from what you expected, that difference is the signal the brain uses to adjust. Material that is too easy produces almost no such differences, so it changes the circuits very little.',
    learnMore:
      'When an attempt turns out better than expected, dopamine neurons increase their firing. When it turns out worse than expected, they briefly pause. This dopamine signal tells the brain which movements to keep. Practicing at the edge of your current ability, where the outcome is uncertain, produces frequent prediction errors and faster learning. Material you can already perform reliably produces little learning.',
    confidence: 'finding',
    refs: [
      'Schultz W. (1998). Predictive reward signal of dopamine neurons. J Neurophysiol.',
      'Ericsson K.A., Krampe R.T. & Tesch-Römer C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychol Rev.',
    ],
  },
  {
    title: 'Why sleep strengthens what you practiced',
    color: '#8B5CF6',
    summary:
      'Much of the process that turns effortful practice into automatic skill happens after you stop, during sleep. While you sleep, the hippocampus replays the sequences from the day and transfers them to the cortex.',
    learnMore:
      'During sleep after practice, the hippocampus produces sharp-wave ripples, which are brief high-frequency bursts that replay recent activity patterns and drive their consolidation into cortico-striatal networks. In behavioral studies, motor skills often improve overnight without any further practice. In the CogniChord model, consolidation is the variable that keeps rising during the rest between sessions rather than only during practice.',
    confidence: 'finding',
    refs: [
      'Walker M.P. et al. (2002). Practice with sleep makes perfect. Neuron.',
      'Buzsáki G. (2015). Hippocampal sharp wave-ripple. Hippocampus.',
      'Stickgold R. (2005). Sleep-dependent memory consolidation. Nature.',
    ],
  },
  {
    title: 'Why spacing works better than cramming',
    color: '#00D4FF',
    summary:
      'Three short sessions spread across a week usually consolidate better than one long session. Each night of rest secures the gains from the previous session before the next one builds on them.',
    learnMore:
      'Distributed practice produces more durable motor learning than massed practice. This happens partly because each rest interval allows consolidation, and partly because recalling the skill from a slightly decayed state is itself an effective form of practice. Cramming can appear productive because performance within a single session looks strong, but gains made within one session are the least durable.',
    confidence: 'finding',
    refs: [
      'Shea C.H., Lai Q., Black C. & Park J.-H. (2000). Spacing practice sessions across days benefits the learning of motor skills. Hum Mov Sci.',
      'Cepeda N.J. et al. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. Psychol Bull.',
    ],
  },
  {
    title: 'Why focus multiplies practice',
    color: '#FF2D78',
    summary:
      'Attention changes how much the brain learns from a given repetition. When you are fully engaged, neuromodulators raise the level of plasticity in the cortex, so a focused minute of practice changes the brain more than a distracted one.',
    learnMore:
      'Acetylcholine and noradrenaline are released more strongly during attentive, engaged states, and they increase plasticity in sensory and motor cortex. The same physical practice leaves a stronger trace when you are paying attention. This is why ten focused minutes can produce more learning than an hour of inattentive repetition, and why states of high focus are so productive.',
    confidence: 'finding',
    refs: [
      'Bakin J.S. & Weinberger N.M. (1996). Induction of a physiological memory in the cerebral cortex by stimulation of the nucleus basalis. PNAS.',
      'Roelfsema P.R., van Ooyen A. & Watanabe T. (2010). Perceptual learning rules based on reinforcers and attention. Trends Cogn Sci.',
    ],
  },
];

const EVIDENCE: Concept[] = [
  {
    title: 'Motor cortex physically reshapes with practice',
    color: '#FF2D78',
    summary:
      'The area of cortex that represents a pianist\'s fingers is larger and more finely organized than the same area in a non-musician, and it can grow measurably after only a few days of focused training.',
    learnMore:
      'TMS and MRI studies show expanded and more differentiated finger representations in trained musicians. Short-term training on a specific exercise produces rapid expansion of the matching motor map, and this expansion partly reverses if training stops. Long-term training, especially when it begins in childhood, is associated with lasting differences in grey matter and white matter in motor and auditory systems.',
    confidence: 'finding',
    refs: [
      'Pascual-Leone A. (2001). The brain that plays music and is changed by it. Ann NY Acad Sci.',
      'Elbert T. et al. (1995). Increased cortical representation of the fingers of the left hand in string players. Science.',
      'Kleim J.A. & Jones T.A. (2008). Principles of experience-dependent neural plasticity. J Speech Lang Hear Res.',
    ],
  },
  {
    title: 'Music engages the brain\'s reward system directly',
    color: '#F59E0B',
    summary:
      'The pleasurable "chills" people feel at a musical high point occur together with dopamine release in the striatum. The reward system treats musical structure as a series of predictions and outcomes.',
    learnMore:
      'PET and fMRI studies show dopamine release in striatal regions during peak emotional moments in music, with the caudate active during anticipation and the nucleus accumbens active during the peak itself. This is part of why practice can be rewarding on its own: the reward circuitry responds to the music, not only to outside praise.',
    confidence: 'finding',
    refs: [
      'Salimpoor V.N. et al. (2011). Anatomically distinct dopamine release during anticipation and experience of peak emotion to music. Nat Neurosci.',
      'Zatorre R.J. & Salimpoor V.N. (2013). From perception to pleasure: music and its neural substrates. PNAS.',
    ],
  },
  {
    title: 'The brain tracks musical time with oscillations',
    color: '#10B981',
    summary:
      'Slow neural rhythms appear to track beats and phrases, while faster gamma bursts appear to encode individual notes. Together they form a nested timing structure for musical events.',
    learnMore:
      'Oscillatory theories propose that slow delta and theta rhythms provide a temporal frame within which faster gamma-band activity encodes items in sequence. Applied to music, nested delta and theta to gamma coupling could represent notes within beats and beats within phrases, which would help organize musical information into a hierarchy. This is an active and still-developing area of research, and it is best described as a promising framework rather than a settled result.',
    confidence: 'heuristic',
    refs: [
      'Lisman J.E. & Jensen O. (2013). The theta–gamma neural code. Neuron.',
      'Large E.W. & Jones M.R. (1999). The dynamics of attending: how people track time-varying events. Psychol Rev.',
    ],
  },
  {
    title: 'BDNF opens a window for plasticity',
    color: '#00D4FF',
    summary:
      'Sustained, engaged activity raises BDNF, a molecule that makes synapses more able to change. Higher BDNF prepares the circuit to learn rather than simply fatiguing it.',
    learnMore:
      'BDNF strengthens long-term potentiation through TrkB signaling and is a key mediator of exercise-induced plasticity. Whether music practice on its own produces BDNF changes comparable to exercise is still under investigation. CogniChord treats BDNF as a modeled learning-rate modulator, which is a plausible mechanism the app makes visible, and it is labeled clearly as a model signal rather than a measured blood level.',
    confidence: 'model',
    refs: [
      'Figurov A. et al. (1996). Regulation of synaptic responses to high-frequency stimulation and LTP by neurotrophins in the hippocampus. Nature.',
      'Gómez-Pinilla F. & Hillman C. (2013). The influence of exercise on cognitive abilities. Compr Physiol.',
    ],
  },
];

function ExpandableConcept({ concept }: { concept: Concept }) {
  const [open, setOpen] = useState(false);
  const conf = CONF_META[concept.confidence];
  return (
    <div className="sim-panel !p-0 overflow-hidden">
      <div className="p-5" style={{ borderLeft: `3px solid ${concept.color}` }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-display font-semibold text-slate-100 text-base leading-snug">{concept.title}</h3>
          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${conf.className}`}>
            {conf.label}
          </span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{concept.summary}</p>

        <button
          onClick={() => setOpen(v => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: concept.color }}
        >
          Learn more
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{concept.learnMore}</p>
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-2">References</div>
                  {concept.refs.map((r, i) => (
                    <p key={i} className="text-xs text-slate-600 leading-relaxed">• {r}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Learn() {
  const [twinOpen, setTwinOpen] = useState(false);
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="section-label">Learn</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-3">
            How practice becomes skill
          </h1>
          <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
            CogniChord both describes learning and <span className="text-slate-300">simulates</span> it. Below is
            the mechanistic model that runs underneath the app. It is a day-by-day dynamical system in which a fast,
            unstable memory trace consolidates overnight into durable procedural skill, tracts gain myelin on the pathways
            you use, and control shifts from effortful cortex to automatic circuits. You can watch it run,
            then open the full simulation to control it yourself.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <DigitalTwinHero onLaunch={() => setTwinOpen(true)} paused={twinOpen} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="mb-5">
            <span className="section-label">Real computation</span>
            <h2 className="font-display font-bold text-2xl text-slate-100">A neural network that actually learns</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              This is a working neural network with real weights, performing gradient descent in your browser. It trains to turn a fixed stimulus into a target response. Press Train and watch the synapses adjust, the weak ones drop out, the busy pathways gain myelin, and the error curve fall. This is a demonstration of what practice does physically.
            </p>
          </div>
          <NeuralNetLab />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <PathwayDiagram />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="sim-panel h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-cyan" />
                <h3 className="font-display font-semibold text-slate-200">Why music is unusual in how broadly it engages the brain</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Music is one of the most neurologically broad voluntary activities. At the same time, it engages auditory cortex for pitch and timbre, motor cortex for technique, cerebellum for timing, limbic structures for emotion and reward, and prefrontal regions for planning and working memory. These are the same structures you can click on the 3D brain. Long-term training is associated with measurable structural and functional change across many of these systems.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                CogniChord focuses on one path through this system: dopamine controls whether the corticostriatal synapses between motor cortex and striatum strengthen after each attempt, and BDNF sets how fast that consolidation happens. Everything below is detail behind that one mechanism.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
          <div className="mb-5">
            <span className="section-label">Practical neuroscience</span>
            <h2 className="font-display font-bold text-2xl text-slate-100">Five ideas that change how you practice</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Each idea is a practice habit with a mechanism behind it. Expand any one to see the research.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONCEPTS.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <ExpandableConcept concept={c} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
          <div className="mb-5">
            <span className="section-label">The chemical players</span>
            <h2 className="font-display font-bold text-2xl text-slate-100">The molecules doing the work</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NEUROTRANSMITTERS.map((nt, i) => (
              <motion.div key={nt.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <NeurotransmitterCard nt={nt} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
          <div className="mb-5">
            <span className="section-label">The evidence</span>
            <h2 className="font-display font-bold text-2xl text-slate-100">What the research shows</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              The wider science CogniChord draws on, offered as reading when you want it, with each claim labeled for how strongly it is established.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EVIDENCE.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <ExpandableConcept concept={c} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-slate-500 text-sm mb-4">See how it works, mapped to your practice.</p>
          <Link to="/practice" className="btn-primary inline-flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Log a practice session
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      <NeuroTheater open={twinOpen} onClose={() => setTwinOpen(false)} />
    </div>
  );
}
