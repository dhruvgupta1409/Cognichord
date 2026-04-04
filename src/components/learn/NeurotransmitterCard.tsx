import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Neurotransmitter } from '../../types';

export const NEUROTRANSMITTERS: Neurotransmitter[] = [
  {
    id: 'dopamine',
    name: 'Dopamine',
    formula: 'C₈H₁₁NO₂',
    color: '#00D4FF',
    glow: 'rgba(0,212,255,0.2)',
    function: 'Reward signaling, motivation, motor control, learning',
    musicalRole: 'Dopamine release in mesolimbic regions contributes to the pleasure and motivation associated with music. Neuroimaging studies show striatal dopamine release and activity increases in response to emotionally intense musical moments and their anticipation, supporting reward‑prediction‑error–like responses to musical structure.',
    brainRegions: ['Ventral Tegmental Area (VTA)', 'Nucleus Accumbens', 'Prefrontal Cortex', 'Caudate Nucleus'],
    halfLife: 'On the order of 2 min in plasma; individual synaptic transients decay over milliseconds via diffusion and DAT‑mediated reuptake.',
    keyPathway: 'Mesolimbic & Mesocortical pathways',
    insight: 'Dopamine release during music appears temporally structured: anticipation of a peak musical moment preferentially engages the caudate nucleus, while the peak itself engages the nucleus accumbens in many listeners, suggesting that the reward system tracks both prediction and outcome in time.',
  },
  {
    id: 'bdnf',
    name: 'BDNF',
    formula: 'C₁₁₇₆H₁₈₅₀N₃₂₄O₃₄₁S₈',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.2)',
    function: 'Synaptic plasticity, neuron survival, LTP facilitation, neurogenesis',
    musicalRole: 'BDNF is a key molecular mediator of long‑term neuroplasticity. Intensive practice, particularly when it involves complex sensorimotor learning and attention, likely recruits many of the same activity‑dependent signaling cascades through which BDNF supports dendritic growth, spine stability, and synaptic strengthening. Direct measurements of BDNF before and after purely musical training in humans are limited; the Cognichord model treats BDNF as a plausible mechanism through which musical practice could support structural brain changes.',
    brainRegions: ['Hippocampus', 'Cerebral Cortex', 'Cerebellum', 'Basal Ganglia'],
    halfLife: 'Varies by compartment: free BDNF in plasma is cleared on the order of minutes; tissue levels change on much longer timescales and are influenced by transcription, translation, release, and uptake dynamics.',
    keyPathway: 'TrkB receptor → PI3K/Akt → MAPK/CREB/mTOR signaling',
    insight: 'BDNF has been called "Miracle‑Gro for the brain" in popular writing because of its central role in plasticity. Musicians often show advantages in verbal memory, auditory processing, and some executive functions; BDNF‑mediated plasticity is a leading mechanistic candidate, but direct comparisons of hippocampal BDNF levels between musicians and non‑musicians have not yet been firmly established in humans.',
  },
  {
    id: 'serotonin',
    name: 'Serotonin',
    formula: 'C₁₀H₁₂N₂O',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.2)',
    function: 'Mood regulation, emotional processing, sleep, social behavior',
    musicalRole: 'Serotonergic systems contribute to mood and affective regulation during music listening. Slower, harmonically rich or "soothing" music is associated with reduced autonomic arousal and can decrease activity in threat‑related circuits such as the amygdala; serotonin is one of several neuromodulators thought to participate in these effects, although direct human measurements during music are sparse.',
    brainRegions: ['Raphe Nuclei', 'Limbic System', 'Basal Ganglia', 'Cerebellum'],
    halfLife: 'Minutes in circulation; individual synaptic events are cleared on a sub‑second timescale via SERT and diffusion.',
    keyPathway: 'Dorsal Raphe → Forebrain via multiple 5‑HT receptor subtypes (e.g., 5‑HT₁A, 5‑HT₂A)',
    insight: 'Music in major vs. minor modes and "bittersweet" musical emotions can feel very different while still being pleasurable. At the circuit level, these differences likely reflect distinct patterns of activity across limbic and reward networks, with serotonergic tone interacting with dopamine, norepinephrine, and other systems; specific "serotonin vs. norepinephrine" fingerprints for particular musical emotions remain an active area of research rather than an established map.',
  },
  {
    id: 'norepinephrine',
    name: 'Norepinephrine',
    formula: 'C₈H₁₁NO₃',
    color: '#FF2D78',
    glow: 'rgba(255,45,120,0.2)',
    function: 'Arousal, attention, stress response, cognitive focus',
    musicalRole: 'Norepinephrine from the locus coeruleus modulates arousal, vigilance, and the gain of sensory and cognitive processing. Fast, rhythmically driving, high‑intensity music can increase subjective arousal and readiness to act, which aligns with the known role of noradrenergic systems in "fight‑or‑flight" and focused attention. Athletes and performers often use pre‑task music to shift into an optimal arousal state; NE‑mediated modulation of motor and prefrontal circuits is a likely part of that effect, even when it is not directly measured.',
    brainRegions: ['Locus Coeruleus', 'Prefrontal Cortex', 'Amygdala', 'Hippocampus'],
    halfLife: 'Minutes in circulation; synaptic NE transients are cleared over seconds or less via NET and enzymatic degradation.',
    keyPathway: 'Locus Coeruleus → α and β adrenergic receptors across cortex and subcortex',
    insight: 'The same molecule that mediates classic "stress" responses also helps tune attention and performance. In laboratory studies, fast‑tempo or motivational music can produce small but measurable improvements in certain anaerobic and reaction‑time tasks, consistent with an NE‑driven arousal boost layered on top of motivational and attentional factors.',
  },
  {
    id: 'acetylcholine',
    name: 'Acetylcholine',
    formula: 'C₇H₁₆NO₂⁺',
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.2)',
    function: 'Memory encoding, neuroplasticity, motor control, attention',
    musicalRole: 'Cholinergic projections from basal forebrain to cortex help gate plasticity and attention. During focused instrumental practice, elevated acetylcholine tone is thought to enhance the encoding of new sensorimotor and auditory associations, while mindless or distracted repetition likely occurs under lower cholinergic drive and thus produces weaker long‑term changes.',
    brainRegions: ['Basal Forebrain', 'Nucleus Basalis', 'Hippocampus', 'Motor Cortex'],
    halfLife: 'Extremely short in the synaptic cleft (milliseconds), due to rapid enzymatic hydrolysis by acetylcholinesterase; functionally, this allows precise, brief cholinergic signals that nonetheless can have long‑lasting effects via intracellular cascades.',
    keyPathway: 'Basal forebrain → widespread cortical and hippocampal targets via muscarinic (M1/M2) and nicotinic receptors',
    insight: 'Cholinergic tone helps explain why how you practice matters as much as how long you practice. High ACh during attentive, error‑correcting musical work opens windows for cortical reorganization, whereas low‑attention, background practice tends to have much smaller long‑term impact on cortical maps.',
  },
];

interface Props {
  nt: Neurotransmitter;
}

export default function NeurotransmitterCard({ nt }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="card-glass rounded-xl overflow-hidden border"
      style={{ borderColor: `${nt.color}22` }}
    >
            <div
        className="p-5 cursor-pointer flex items-start justify-between gap-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
                        <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
              style={{ background: nt.glow, color: nt.color, border: `1px solid ${nt.color}33` }}
            >
              NH₂
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-100">{nt.name}</h3>
              <span className="font-mono text-xs" style={{ color: nt.color }}>{nt.formula}</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{nt.function}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform mt-1 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

            <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                            <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: nt.color }}>
                  Role in Music Cognition
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">{nt.musicalRole}</p>
              </div>

                            <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Key Brain Regions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {nt.brainRegions.map(r => (
                    <span key={r} className="tag" style={{
                      background: `${nt.color}14`,
                      color: nt.color,
                      border: `1px solid ${nt.color}33`,
                    }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>

                            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                  <div className="text-xs text-slate-600 mb-1">Signaling Pathway</div>
                  <div className="text-xs text-slate-400">{nt.keyPathway}</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                  <div className="text-xs text-slate-600 mb-1">Half-life</div>
                  <div className="text-xs font-mono" style={{ color: nt.color }}>{nt.halfLife}</div>
                </div>
              </div>

                            <div
                className="rounded-lg p-4"
                style={{ background: `${nt.color}0A`, border: `1px solid ${nt.color}1A` }}
              >
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: nt.color }}>
                  Key Insight
                </div>
                <p className="text-sm text-slate-400 leading-relaxed italic">{nt.insight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
