import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { InstrumentType } from '../../types';

export interface InstrumentCategory {
  label: string;
  color: string;
  instruments: InstrumentType[];
}

export const INSTRUMENT_CATEGORIES: InstrumentCategory[] = [
  {
    label: 'Keyboard',
    color: '#00D4FF',
    instruments: ['piano', 'organ', 'harpsichord', 'synthesizer'],
  },
  {
    label: 'Bowed Strings',
    color: '#8B5CF6',
    instruments: ['violin', 'viola', 'cello', 'double bass'],
  },
  {
    label: 'Plucked & Fretted',
    color: '#F59E0B',
    instruments: ['guitar', 'classical guitar', 'bass', 'harp', 'ukulele', 'banjo', 'mandolin'],
  },
  {
    label: 'Woodwinds',
    color: '#10B981',
    instruments: ['flute', 'clarinet', 'oboe', 'bassoon', 'saxophone'],
  },
  {
    label: 'Brass',
    color: '#FF2D78',
    instruments: ['trumpet', 'trombone', 'french horn', 'tuba'],
  },
  {
    label: 'Percussion & Voice',
    color: '#94A3B8',
    instruments: ['drums', 'marimba', 'voice'],
  },
];

function capitalize(s: string) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

interface Props {
  value: InstrumentType;
  onChange: (v: InstrumentType) => void;
  accentColor?: string;
}

export default function InstrumentPicker({ value, onChange, accentColor = '#10B981' }: Props) {
  const [open, setOpen] = useState(false);

  const currentCategory = INSTRUMENT_CATEGORIES.find(cat =>
    cat.instruments.includes(value)
  );

  return (
    <div className="relative">
      <label className="control-label block mb-1.5">Instrument</label>

            <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                   bg-white/[0.04] border border-white/[0.08] text-sm
                   hover:border-white/[0.16] transition-all"
        style={{ borderColor: open ? `${accentColor}40` : undefined }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: currentCategory?.color ?? accentColor }}
          />
          <span className="text-slate-200 font-medium capitalize">{value}</span>
          <span className="text-xs text-slate-600">{currentCategory?.label}</span>
        </div>
        <ChevronDown
          className="w-4 h-4 text-slate-500 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

            <AnimatePresence>
        {open && (
          <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-white/[0.08]
                         overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              style={{ background: '#0A1628' }}
            >
              <div className="max-h-72 overflow-y-auto p-2">
                {INSTRUMENT_CATEGORIES.map(cat => (
                  <div key={cat.label} className="mb-2 last:mb-0">
                    <div className="px-2 py-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                      <span className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: `${cat.color}99` }}>
                        {cat.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {cat.instruments.map(inst => (
                        <button
                          key={inst}
                          type="button"
                          onClick={() => { onChange(inst); setOpen(false); }}
                          className="px-2.5 py-1.5 rounded-md text-xs text-left transition-all capitalize
                                     hover:text-slate-100"
                          style={{
                            background: value === inst ? `${cat.color}18` : 'transparent',
                            color: value === inst ? cat.color : '#64748B',
                            border: value === inst ? `1px solid ${cat.color}30` : '1px solid transparent',
                          }}
                        >
                          {capitalize(inst)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
