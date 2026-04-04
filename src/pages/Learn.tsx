import { motion } from 'framer-motion';
import { BookOpen, Atom, Brain, ArrowRight } from 'lucide-react';
import NeurotransmitterCard, { NEUROTRANSMITTERS } from '../components/learn/NeurotransmitterCard';
import PathwayDiagram from '../components/learn/PathwayDiagram';
import { Link } from 'react-router-dom';

const RESEARCH_AREAS = [
  {
    title: 'Sharp-Wave Ripples & Musical Memory',
    desc: 'During sleep following practice, the hippocampus generates sharp‑wave ripple (SWR) events, brief high‑frequency (≈80–120 Hz) oscillations nested in slower sharp waves that replay patterns of neural activity associated with recent learning. These replay events help transfer labile hippocampal representations toward more stable cortico‑hippocampal networks, supporting long‑term consolidation of sequences, including those involved in musical performance.',
    tag: 'Memory',   tagColor: 'tag-cyan',
    refs: ['Buzsáki G. (2015). Hippocampal sharp wave‑ripple. Hippocampus.', 'Stickgold R. (2005). Sleep‑dependent memory consolidation. Nature.'],
  },
  {
    title: 'Hebbian Learning & Auditory Cortex Expansion',
    desc: 'Musicians show measurable differences in auditory cortex anatomy and physiology, including larger or more differentiated Heschl\'s gyrus in some groups and altered responses to tones. Longitudinal and cross‑sectional work suggests that earlier and more intensive training is associated with greater expansion and refinement of auditory representations, consistent with Hebbian plasticity ("neurons that fire together wire together") driven by years of synchronized auditory–motor activity.',
    tag: 'Plasticity', tagColor: 'tag-purple',
    refs: ['Schlaug G. (2001). The brain of musicians. Ann NY Acad Sci.', 'Bermudez P. et al. (2009). Neuroanatomical correlates of musicianship. Cereb Cortex.'],
  },
  {
    title: 'Dopamine & the Chills Response',
    desc: 'A substantial minority of listeners experience "music‑induced chills" (frisson) at emotionally intense moments. Neuroimaging studies using PET and fMRI have shown that such moments are associated with dopamine release and activity changes in striatal regions, particularly the nucleus accumbens, while the anticipation phase engages the caudate. These findings support the idea that the reward system treats musical structure as a source of predictions and prediction errors, though direct quantitative comparisons with primary rewards like food or sex are beyond the scope of these studies.',
    tag: 'Reward',    tagColor: 'tag-gold',
    refs: ['Salimpoor V.N. et al. (2011). Anatomically distinct dopamine release during anticipation and experience of peak emotion to music. Nat Neurosci.', 'Zatorre R.J. & Salimpoor V.N. (2013). From perception to pleasure: music and its neural substrates. PNAS.'],
  },
  {
    title: 'Motor Cortex Plasticity & Deliberate Practice',
    desc: 'Transcranial magnetic stimulation (TMS) and MRI studies show that the cortical representation of finger muscles in pianists is enlarged and more finely organized compared with non‑musicians. Short‑term training (on the order of days) on a specific piano exercise produces rapid expansion of the corresponding motor representation, and this can partially regress when training stops. With long‑term training, especially when started in childhood, both grey matter volume and white‑matter connectivity in motor and related areas show enduring changes.',
    tag: 'Motor',     tagColor: 'tag-pink',
    refs: ['Pascual‑Leone A. (2001). The brain that plays music and is changed by it. Ann NY Acad Sci.', 'Kleim J.A. & Jones T.A. (2008). Principles of experience‑dependent neural plasticity. J Speech Lang Hear Res.'],
  },
  {
    title: 'Theta–Gamma Coupling & Musical Phrasing',
    desc: 'Musical phrases often span a few seconds, overlapping with the time scale at which delta‑range (≈1 Hz) activity can track higher‑level temporal structure, while theta‑range (≈4–8 Hz) oscillations can align with beat‑level groupings. Oscillatory theories of attention and memory propose that slow rhythms provide a temporal scaffold in which faster gamma‑band bursts encode items or features in sequence. Applying this framework to music, the brain may use nested delta/theta–gamma coupling to represent notes within beats and beats within phrases, helping to organize musical information hierarchically.',
    tag: 'Oscillations', tagColor: 'tag-emerald',
    refs: ['Lisman J.E. & Jensen O. (2013). The theta–gamma neural code. Neuron.', 'Large E.W. & Jones M.R. (1999). The dynamics of attending. Psychol Rev.'],
  },
  {
    title: 'BDNF & the Runner\'s High in Music',
    desc: 'Aerobic exercise reliably elevates BDNF and improves certain aspects of cognition, with BDNF acting as a key molecular mediator of exercise‑induced plasticity. Whether music practice alone produces comparable BDNF changes is still under investigation. The hypothesis underlying Cognichord\'s models is that intensive auditory–motor engagement and attentional focus during instrumental practice recruit overlapping molecular pathways with exercise (including BDNF and related cascades), supporting structural and functional brain changes, even if the magnitude and time course differ.',
    tag: 'BDNF',      tagColor: 'tag-cyan',
    refs: ['Gomez‑Pinilla F. & Hillman C. (2013). The influence of exercise on cognitive abilities. Compr Physiol.', 'Tierney A. et al. (2014). Auditory‑motor entrainment and phonological skills. Front Hum Neurosci.'],
  },
];

export default function Learn() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
                <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <span className="section-label">Education Hub</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-3">
            The Biochemistry of{' '}
            <span className="gradient-text">Music & the Brain</span>
          </h1>
          <p className="text-slate-500 text-base max-w-2xl">
            From synaptic signaling molecules to whole‑brain network dynamics, you can understand
            the molecular and circuit‑level mechanisms scientists study when they ask how music shapes the brain.
          </p>
        </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PathwayDiagram />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="sim-panel h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-cyan" />
                <h3 className="font-display font-semibold text-slate-200">Why Music is Neurologically Unique</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Music is among the most neurologically broad voluntary activities, simultaneously
                engaging auditory cortex (pitch/timbre), motor cortex (instrument technique),
                cerebellum (timing/coordination), limbic structures (emotion and reward), prefrontal
                regions (planning/working memory), and default mode–related areas during imagination
                and improvisation. Long‑term musical training is associated with measurable structural
                and functional changes across many of these systems in both children and adults.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                This whole‑brain engagement triggers a cascade of neurochemical events: dopamine
                supports motivation and reward‑based learning, BDNF and other growth factors support
                structural changes that persist, acetylcholine helps gate when plasticity can occur,
                and norepinephrine shapes arousal and focus during learning. The Cognichord models
                abstract these complex systems into a small set of interpretable variables so you can
                see how practice patterns might map onto them.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyan/[0.06] border border-cyan/15 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Brain regions activated</div>
                  <div className="font-mono text-xl text-cyan">20+</div>
                </div>
                <div className="bg-purple/[0.06] border border-purple/15 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Neurotransmitters involved</div>
                  <div className="font-mono text-xl text-purple-light">5+</div>
                </div>
                <div className="bg-emerald/[0.06] border border-emerald/15 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Structural changes</div>
                  <div className="font-mono text-xl text-emerald">Weeks–years</div>
                </div>
                <div className="bg-gold/[0.06] border border-gold/15 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">IQ, one childhood RCT (Schellenberg 2004)</div>
                  <div className="font-mono text-xl text-gold-light">≈2–3 pts</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

                <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="mb-5">
            <span className="section-label">Neurotransmitters</span>
            <h2 className="font-display font-bold text-2xl text-slate-100">
              The Chemical Players
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NEUROTRANSMITTERS.map((nt, i) => (
              <motion.div
                key={nt.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <NeurotransmitterCard nt={nt} />
              </motion.div>
            ))}
          </div>
        </motion.div>

                <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-5">
            <span className="section-label">Research Summaries</span>
            <h2 className="font-display font-bold text-2xl text-slate-100">
              Six Key Mechanisms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESEARCH_AREAS.map((area, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card-glass card-glass-hover rounded-xl p-5 border border-white/[0.06] flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`tag ${area.tagColor}`}>{area.tag}</span>
                </div>
                <h3 className="font-display font-semibold text-slate-200 text-sm leading-snug mb-3">
                  {area.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed flex-1 mb-4">
                  {area.desc}
                </p>
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="text-xs text-slate-600 font-medium uppercase tracking-widest mb-2">References</div>
                  {area.refs.map((ref, ri) => (
                    <p key={ri} className="text-xs text-slate-600 leading-relaxed">• {ref}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

                <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-slate-500 text-sm mb-4">
            Ready to run the models behind this science?
          </p>
          <Link to="/lab" className="btn-primary inline-flex items-center gap-2">
            <Atom className="w-4 h-4" />
            Open the Simulation Lab
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
