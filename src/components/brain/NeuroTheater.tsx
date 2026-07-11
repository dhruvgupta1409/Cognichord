import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Info, FlaskConical } from 'lucide-react';
import CinematicJourney, { STAGES, type JourneyState, type StageId } from './CinematicJourney';
import { MECHANISMS } from '../../lib/learningModel';

const STAGE_INDEX: Record<StageId, number> = { brain: 0, region: 1, tissue: 2, neuron: 3, synapse: 4 };

interface Lesson { heading: string; paras: string[]; mechanism: string[]; source: string; }
const LEARN: Record<StageId, Lesson> = {
  brain: {
    heading: 'Practice reshapes the whole brain',
    paras: [
      'Learning a piece of music is not stored in one place. It is distributed across a network. Each time you practice, the same areas activate together in the same order: auditory cortex hears the note, prefrontal cortex holds the plan, motor cortex commands the fingers, and the cerebellum times it all. The activity you see moving across the surface is that coordinated activation.',
      'Repetition is the key. When a network is driven in the same coordinated pattern again and again, the brain rebuilds itself physically to make that pattern easier to produce. The area of cortex devoted to a trained skill grows measurably. A professional pianist has a larger and more finely organized hand area than a non-musician, and it grows with hours practiced.',
      'The whole-brain view shows the reason for this change: repeated, coordinated activity is the signal that tells the tissue below to change. Over weeks, that signal is built into structure, and the effortful network you started with hands the skill off to automatic circuits.',
    ],
    mechanism: [
      'Use-dependent map expansion: trained representations grow (Pascual-Leone 2001; Elbert 1995).',
      'Coordinated activity across many areas is the pattern that gets consolidated.',
      'Control moves from effortful cortex to automatic circuits as the skill consolidates (Doyon & Benali 2005).',
    ],
    source: 'Pascual-Leone (2001); Elbert et al. (1995), Science.',
  },
  region: {
    heading: 'Inside the active cortical area',
    paras: [
      'This patch is primary motor cortex. It is not uniform. It is built from vertical columns, each a small processing unit that spans all six layers of the cortex from the surface down to the white matter. A column is the basic building block of the cortex: the neurons within it are richly interconnected and tend to fire together.',
      'Learning here is a process of refinement. Early in practice, a movement recruits many columns broadly and imprecisely. With repetition, the columns that represent the practiced movement become more selective and more strongly driven, while the irrelevant ones drop out. The map sharpens, so the same intention now produces a cleaner, more specific motor command.',
      'This is why slow, accurate practice matters. The circuit strengthens whatever pattern you actually repeat, so you want the columns tuning to the correct movement rather than to a rushed approximation of it.',
    ],
    mechanism: [
      'Cortical columns are the repeating micro-circuit of the neocortex (Mountcastle 1997).',
      'Training sharpens and strengthens the columns tuned to the practiced movement.',
      'The representation becomes more selective and more reliable with repetition.',
    ],
    source: 'Mountcastle (1997), Brain; Kleim & Jones (2008).',
  },
  tissue: {
    heading: 'Circuits: neurons that fire together, wire together',
    paras: [
      'Zoomed into the tissue, the region is a dense three-dimensional forest of thousands of neurons, with branching dendritic trees, axons running long distances, and glia and blood vessels packed in between. Skill is stored in the wiring between these cells rather than in any single one.',
      'The rule that builds it is Hebbian: when one neuron reliably takes part in firing another, the connection between them strengthens, and connections that go unused weaken. Practicing a passage makes a specific chain of neurons active together, over and over, in the same sequence, and that chain strengthens preferentially.',
      'Do this across many sessions and a dedicated pathway is formed out of the mesh, a preferred route that carries the practiced skill faster and more reliably each time. The signals you see passing between cells are the co-activation that drives this selective wiring.',
    ],
    mechanism: [
      '"Cells that fire together, wire together": Hebbian plasticity (Hebb 1949).',
      'Co-active pathways strengthen; unused ones are pruned.',
      'Repetition selects one reliable route through the circuit.',
    ],
    source: 'Hebb (1949); Kleim & Jones (2008), J Speech Lang Hear Res.',
  },
  neuron: {
    heading: 'The single cell: a learning machine',
    paras: [
      'A neuron gathers thousands of inputs across its dendritic tree and integrates them at the cell body (soma). If the summed input crosses threshold, the neuron fires an electrical spike, called an action potential, that travels down the axon to signal the next cells. The wave of depolarization sweeping across the membrane is that integration and firing in action.',
      'The learning happens on the small knobs studding the dendrites, called dendritic spines. Each spine holds a single excitatory synapse, and each spine is plastic: it can enlarge, shrink, appear, or disappear with experience. Practicing a skill selectively strengthens and grows the spines that carry it, so the cell becomes physically more responsive to the practiced pattern of input.',
      'A single well-practiced pyramidal neuron can carry tens of thousands of these spines. Learning is, in physical terms, the reshaping of this branching structure: which spines grow, and by how much.',
    ],
    mechanism: [
      'Dendrites integrate inputs, the soma sums them, and the axon fires if threshold is crossed.',
      'Dendritic spines are the physical sites of synaptic learning.',
      'Spines grow and shrink with use, which is the structural basis of memory (Yang, Pan & Gan 2009).',
    ],
    source: 'Yuste (2010); Yang, Pan & Gan (2009), Nature.',
  },
  synapse: {
    heading: 'The synapse: where a memory is physically written',
    paras: [
      'Now at the finest scale: a single synapse onto a spine. This is where practice becomes a durable, physical change. A signal arriving here releases neurotransmitter across a 20-nanometre gap onto receptors that pass it on, but ordinary signaling does not, by itself, store anything.',
      'Learning requires coincidence. When the incoming signal arrives at the same time as strong activity in the receiving cell, a special coincidence-detecting receptor (NMDA) opens and lets calcium flow in. That calcium pulse is the trigger that switches on the machinery of change.',
      'The cascade shown below (dopamine-gated, NMDA-dependent long-term potentiation) is the mechanism itself: calcium activates CaMKII, new AMPA receptors are added so the same signal now produces a bigger response, and the spine physically enlarges and stabilizes. That is a memory, written into the structure of one connection, and it is what repeated practice accumulates, one synapse at a time.',
    ],
    mechanism: [
      'Coincident activity opens NMDA receptors, which lets Ca²⁺ flow in (the learning trigger).',
      'Ca²⁺ activates CaMKII, which adds new AMPA receptors, which produces a stronger response to the same input.',
      'The spine enlarges and stabilizes: long-term potentiation (LTP).',
    ],
    source: 'Bliss & Lømo (1973); Lisman et al. (2012); Matsuzaki et al. (2004).',
  },
};

export default function NeuroTheater({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [showMechanisms, setShowMechanisms] = useState(false);
  const [state, setState] = useState<JourneyState>({ stage: 'brain', progress: 0, event: '', data: null });

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const raf = useRef(0);
  const pending = useRef<JourneyState | null>(null);
  const onJourney = (s: JourneyState) => {
    pending.current = s;
    if (!raf.current) raf.current = requestAnimationFrame(() => { raf.current = 0; if (pending.current) setState(pending.current); });
  };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const meta = STAGES[STAGE_INDEX[state.stage]];
  const atSynapse = state.stage === 'synapse';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] bg-[#04060e] flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">CogniChord · A journey inside</div>
              <div className="font-display font-semibold text-slate-100">Watch your brain learn</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMechanisms(s => !s)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${showMechanisms ? 'border-emerald/40 bg-emerald/[0.08] text-emerald' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}>
                <BookOpen className="w-3.5 h-3.5" /> The science
              </button>
              <button onClick={onClose} className="w-9 h-9 rounded-lg border border-white/10 bg-black/30 text-slate-300 hover:text-white flex items-center justify-center" title="Close (Esc)"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex-1 relative min-h-0">
            {open && <CinematicJourney paused={!open} onState={onJourney} />}

            <div className="absolute top-4 left-5 z-10 pointer-events-none">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">The dive</div>
              <div className="space-y-1.5">
                {STAGES.map((s, i) => {
                  const active = STAGE_INDEX[state.stage] === i;
                  const passed = STAGE_INDEX[state.stage] > i;
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full transition-all" style={{
                        background: active ? '#00d4ff' : passed ? '#34D399' : '#33415588',
                        boxShadow: active ? '0 0 10px #00d4ff' : 'none',
                        transform: active ? 'scale(1.4)' : 'scale(1)',
                      }} />
                      <span className={`text-[11px] transition-colors ${active ? 'text-slate-100 font-semibold' : passed ? 'text-slate-500' : 'text-slate-600'}`}>{s.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute top-[248px] left-5 z-10 w-[340px] max-w-[38vw] max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.stage}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}
                  className="rounded-2xl bg-[#070b16]/80 backdrop-blur-md border border-white/[0.08] p-4"
                >
                  <div className="text-[10px] uppercase tracking-widest text-cyan mb-1.5">How learning happens here</div>
                  <h3 className="font-display font-semibold text-slate-100 text-[15px] leading-snug mb-2">{LEARN[state.stage].heading}</h3>
                  <div className="space-y-2">
                    {LEARN[state.stage].paras.map((p, i) => (
                      <p key={i} className="text-[12px] text-slate-400 leading-relaxed">{p}</p>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">The mechanism</div>
                    {LEARN[state.stage].mechanism.map((m, i) => (
                      <p key={i} className="text-[11px] text-slate-400 leading-snug flex gap-1.5 mb-1"><span className="text-emerald mt-px">›</span><span>{m}</span></p>
                    ))}
                    <p className="text-[10px] text-slate-600 leading-snug mt-2">{LEARN[state.stage].source}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {atSynapse && state.data && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="absolute top-24 right-5 z-10 w-64 rounded-2xl bg-[#070b16]/85 backdrop-blur-md border border-gold/25 p-4 pointer-events-none"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <FlaskConical className="w-3.5 h-3.5 text-gold-light" />
                    <span className="text-[10px] uppercase tracking-widest text-gold-light">Measured in the lab</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">{state.data.label}</div>
                  <AnimatePresence mode="wait">
                    <motion.div key={state.data.value} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display font-bold text-xl text-slate-100 my-0.5 tabular-nums">
                      {state.data.value}
                    </motion.div>
                  </AnimatePresence>
                  <div className="text-[10px] text-slate-600 leading-snug mt-1">{state.data.cite}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[min(720px,92vw)] z-10 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={atSynapse && state.event ? state.event : meta.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <div className="text-[10px] uppercase tracking-[0.25em] text-cyan mb-1">
                    {atSynapse ? 'Long-term potentiation: how a memory forms' : `Stage ${STAGE_INDEX[state.stage] + 1} / 5`}
                  </div>
                  <h2 className="font-display font-bold text-2xl text-slate-100 mb-1">{atSynapse && state.event ? state.event : meta.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{meta.blurb}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showMechanisms && (
                <motion.div
                  initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
                  className="absolute top-0 right-0 bottom-0 w-[360px] bg-[#070b16]/95 backdrop-blur-xl border-l border-white/[0.08] overflow-y-auto p-5 z-20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-emerald" /><h3 className="font-display font-semibold text-slate-100">What is under the hood</h3></div>
                    <button onClick={() => setShowMechanisms(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Every process the dive shows, including vesicle fusion, receptor binding, ion flow, and long-term potentiation, is a cited mechanism. The animation is an illustration of the biology, not a recording of your own cells.</p>
                  {MECHANISMS.map(mech => (
                    <div key={mech.key} className="mb-3.5 pb-3.5 border-b border-white/[0.05] last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${mech.evidence === 'established' ? 'text-emerald border-emerald/25 bg-emerald/[0.08]' : 'text-gold-light border-gold/25 bg-gold/[0.08]'}`}>{mech.evidence === 'established' ? 'Established' : 'Approximation'}</span>
                        <h4 className="text-sm font-semibold text-slate-200">{mech.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{mech.detail}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{mech.source}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
