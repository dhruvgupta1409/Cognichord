import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Sparkles } from 'lucide-react';
import NeuronCanvas, { type NeuronHandle } from './NeuronCanvas';
import { REGION_BY_ID } from '../brain/regions';
import { ATLAS } from '../../data/brainAtlas';

const STEPS = [
  { icon: Zap, title: 'Action potential', zoom: 0, labels: 'anatomy' as const, body: 'An electrical spike is generated at the axon hillock and travels down the axon at up to about 120 m/s. Watch it move from the cell body toward the terminal.' },
  { icon: Sparkles, title: 'Saltatory conduction', zoom: 0.25, labels: 'anatomy' as const, body: 'Myelin sheaths (violet, wrapped by glia) insulate long internodes, so the spike jumps from node to node instead of moving continuously. This is faster and uses less energy.' },
  { icon: Sparkles, title: 'The synapse', zoom: 1, labels: 'synapse' as const, body: 'At the terminal, the spike triggers vesicles to release neurotransmitter across a gap of about 20 nanometres onto the next neuron.' },
  { icon: Sparkles, title: 'The next cell fires', zoom: 1, labels: 'synapse' as const, body: 'Receptors on the receiving membrane open, the cell depolarizes, and the signal continues through the network.' },
  { icon: Zap, title: 'Long-term potentiation', zoom: 1, labels: 'synapse' as const, body: 'Use this pathway repeatedly and it strengthens physically, with more receptors and a bigger response. This molecular change is what practice builds.' },
];

export default function NeuronZoom({ open, regionId, onClose }: { open: boolean; regionId: number | null; onClose: () => void }) {
  const region = regionId != null ? REGION_BY_ID[regionId] : undefined;
  const entry = region ? ATLAS[region.key] : undefined;
  const color = region?.color ?? '#7CC5FF';
  const [step, setStep] = useState(0);
  const [ltp, setLtp] = useState(0.3);
  const canvasRef = useRef<NeuronHandle>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0); setLtp(0.3);
    const id = setInterval(() => setStep(s => (s + 1) % STEPS.length), 6000);
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { clearInterval(id); document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const strengthen = () => {
    setLtp(v => Math.min(1, v + 0.18));
    canvasRef.current?.fire(1);
  };

  const Step = STEPS[step];

  return createPortal(
    <AnimatePresence>
      {open && region && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[110] bg-[#04060e]"
        >
          <NeuronCanvas
            ref={canvasRef}
            growth={0.5 + 0.45 * ltp}
            ltp={ltp}
            activity={Step.zoom > 0.5 ? 0.7 : 0.45}
            accent={color}
            zoom={Step.zoom}
            labels={Step.labels}
            className="absolute inset-0"
          />

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color }}>Inside the {region.name.toLowerCase()}</div>
              <div className="font-display font-semibold text-slate-100">A single neuron, firing</div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg border border-white/10 bg-black/40 text-slate-300 hover:text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>

          <div className="absolute left-5 bottom-6 max-w-[380px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
                className="rounded-2xl bg-[#070b16]/80 backdrop-blur-md border border-white/[0.08] p-5"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Step.icon className="w-4 h-4" style={{ color }} />
                  <span className="text-[11px] uppercase tracking-widest" style={{ color }}>{Step.title}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{Step.body}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5 mt-3">
              {STEPS.map((_, i) => <button key={i} onClick={() => setStep(i)} className="h-1 rounded-full transition-all" style={{ width: i === step ? 22 : 8, background: i === step ? color : '#ffffff22' }} />)}
            </div>
          </div>

          {Step.labels === 'synapse' && (
            <div className="absolute right-5 bottom-6 w-56 rounded-2xl bg-[#070b16]/80 backdrop-blur-md border border-white/[0.08] p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Synapse strength (LTP)</div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${ltp * 100}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
              </div>
              <button onClick={strengthen} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:brightness-125" style={{ borderColor: `${color}55`, color, background: `${color}14` }}>
                <Zap className="w-3.5 h-3.5" /> Fire a repetition
              </button>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">Each repetition strengthens the synapse, with more receptors and a bigger response. This is practice in physical form.</p>
            </div>
          )}

          {entry && (
            <div className="absolute top-20 left-5 max-w-[300px] pointer-events-none hidden md:block">
              <p className="text-xs text-slate-500 leading-relaxed">{entry.oneLiner}</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
