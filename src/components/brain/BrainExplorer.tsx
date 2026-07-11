import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Activity, Dna, Music, Sparkles, BookOpen, Layers, ChevronLeft, ChevronRight, Microscope } from 'lucide-react';
import BrainScene from './BrainScene';
import NeuronZoom from '../micro/NeuronZoom';
import { REGIONS, REGION_BY_ID } from './regions';
import { ATLAS } from '../../data/brainAtlas';

const GROUPS = [
  { label: 'Cerebral cortex', ids: [1, 2, 3, 4, 5, 6] },
  { label: 'Hindbrain',       ids: [7, 8] },
  { label: 'Deep structures', ids: [9, 10, 11, 12] },
];

function isDeep(id: number) { return REGION_BY_ID[id]?.group === 'deep'; }

function Section({ icon: Icon, title, color, children }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function BrainExplorer({
  open, initialRegionId, onClose,
}: { open: boolean; initialRegionId: number | null; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<number>(initialRegionId ?? 1);
  const [cutaway, setCutaway] = useState<boolean>(isDeep(initialRegionId ?? 1));
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const id = initialRegionId ?? 1;
      setSelectedId(id);
      setCutaway(isDeep(id));
    }
  }, [open, initialRegionId]);

  const select = (id: number) => {
    setSelectedId(id);
    setCutaway(isDeep(id));
  };

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const region = REGION_BY_ID[selectedId];
  const entry = region ? ATLAS[region.key] : undefined;
  const orderIndex = useMemo(() => REGIONS.findIndex(r => r.id === selectedId), [selectedId]);
  const goRel = (d: number) => {
    const next = REGIONS[(orderIndex + d + REGIONS.length) % REGIONS.length];
    select(next.id);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] bg-[#04060e]"
        >
          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [1.7, 0.7, 2.3], fov: 42 }}
              dpr={[1, 1.9]}
              gl={{ antialias: false, powerPreference: 'high-performance' }}
              onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; }}
            >
              <BrainScene
                selectedId={selectedId}
                onSelect={select}
                cutaway={cutaway}
                autoRotate={false}
                focusCamera
                bloom={0.3}
              />
            </Canvas>
          </div>

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 pointer-events-none">
            <div className="pointer-events-auto">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">CogniChord</div>
              <div className="font-display font-semibold text-slate-100">Brain Explorer</div>
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setCutaway(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  cutaway ? 'border-cyan/40 bg-cyan/[0.1] text-cyan' : 'border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {cutaway ? 'Cortex peeled' : 'Peel back the cortex'}
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg border border-white/10 bg-black/30 text-slate-300 hover:text-white hover:border-white/25 flex items-center justify-center transition-all"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-4 absolute left-5 top-24 bottom-6 w-52 overflow-y-auto pr-1">
            {GROUPS.map(g => (
              <div key={g.label}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">{g.label}</div>
                <div className="flex flex-col gap-0.5">
                  {g.ids.map(id => {
                    const r = REGION_BY_ID[id];
                    const active = id === selectedId;
                    return (
                      <button
                        key={id}
                        onClick={() => select(id)}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                          active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color, boxShadow: active ? `0 0 10px ${r.color}` : 'none' }} />
                        <span className={`text-xs leading-tight ${active ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>{r.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:hidden absolute top-[68px] left-0 right-0 px-4 overflow-x-auto">
            <div className="flex gap-2 pb-2 w-max">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => select(r.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs whitespace-nowrap transition-all ${
                    r.id === selectedId ? 'border-white/25 bg-white/[0.1] text-slate-100' : 'border-white/10 text-slate-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {entry && region && (
            <div className="absolute z-10 lg:top-0 lg:right-0 lg:bottom-0 lg:w-[430px] left-0 right-0 bottom-0 lg:left-auto max-h-[58%] lg:max-h-none">
              <div className="h-full bg-[#070b16]/85 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/[0.08] overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="p-6"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full" style={{ background: region.color, boxShadow: `0 0 12px ${region.color}` }} />
                      <span className="text-[11px] uppercase tracking-widest" style={{ color: region.color }}>{region.group === 'deep' ? 'Deep structure' : region.group === 'cortex' ? 'Cerebral cortex' : 'Structure'}</span>
                    </div>
                    <h2 className="font-display font-bold text-2xl text-slate-100 mb-2">{entry.name}</h2>
                    <p className="text-base text-slate-300 leading-relaxed mb-4">{entry.oneLiner}</p>

                    <button
                      onClick={() => setZoomOpen(true)}
                      className="w-full mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all hover:brightness-125 group"
                      style={{ borderColor: `${region.color}55`, background: `${region.color}12`, color: region.color }}
                    >
                      <Microscope className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-semibold flex-1 text-left">Dive into the neurons</span>
                      <span className="text-[11px] opacity-70">watch it fire →</span>
                    </button>

                    <Section icon={MapPin} title="Where it is" color={region.color}>
                      <p className="text-sm text-slate-400 leading-relaxed">{entry.location}</p>
                    </Section>
                    <Section icon={Activity} title="What it does" color={region.color}>
                      <p className="text-sm text-slate-400 leading-relaxed">{entry.whatItDoes}</p>
                    </Section>
                    <Section icon={Dna} title="The neurobiology" color={region.color}>
                      <p className="text-sm text-slate-400 leading-relaxed">{entry.neurobiology}</p>
                    </Section>
                    <Section icon={Music} title="Why it matters for you" color={region.color}>
                      <p className="text-sm text-slate-400 leading-relaxed">{entry.forMusic}</p>
                    </Section>
                    <Section icon={Sparkles} title="Fast facts" color={region.color}>
                      <ul className="space-y-1.5">
                        {entry.facts.map((f, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-400 leading-relaxed">
                            <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: region.color }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </Section>
                    <Section icon={BookOpen} title="Sources" color={region.color}>
                      {entry.sources.map((s, i) => (
                        <p key={i} className="text-xs text-slate-600 leading-relaxed">{s}</p>
                      ))}
                    </Section>

                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.06]">
                      <button onClick={() => goRel(-1)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <span className="text-[10px] text-slate-600">{orderIndex + 1} / {REGIONS.length}</span>
                      <button onClick={() => goRel(1)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="hidden lg:block absolute bottom-5 left-1/2 -translate-x-1/2 lg:left-[calc(50%-215px)] text-[11px] text-slate-600 pointer-events-none text-center">
            drag to rotate · scroll to zoom · click the brain or pick a region
            <span className="block text-slate-700">general representation — not anatomically exact</span>
          </div>

          <NeuronZoom open={zoomOpen} regionId={selectedId} onClose={() => setZoomOpen(false)} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
