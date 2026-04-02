import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { usePracticeStore } from '../../store/practiceStore';
import InstrumentPicker from '../ui/InstrumentPicker';
import type { InstrumentType, PracticeSession } from '../../types';

const SESSION_TYPES: { id: PracticeSession['sessionType']; label: string }[] = [
  { id: 'new_piece',     label: 'New Piece'      },
  { id: 'technique',    label: 'Technique'      },
  { id: 'improvisation',label: 'Improvisation'  },
  { id: 'memory_recall',label: 'Memory Recall'  },
  { id: 'performance',  label: 'Performance'    },
];

export default function PracticeLogger() {
  const addSession = usePracticeStore(s => s.addSession);
  const currentUserId = usePracticeStore(s => s.currentUserId);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    instrument: 'piano' as InstrumentType,
    durationMin: 45,
    sessionType: 'technique' as PracticeSession['sessionType'],
    complexity: 3,
    notes: '',
  });

  const setF = (key: string, val: string | number) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSession({
      ...form,
      date: new Date(form.date).toISOString(),
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setForm(prev => ({
      ...prev,
      notes: '',
      durationMin: 45,
      sessionType: 'technique',
      complexity: 3,
    }));
  };

  return (
    <div className="sim-panel">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center">
          <Plus className="w-4 h-4 text-emerald" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-slate-200 text-sm">Log Practice Session</h3>
          <p className="text-xs text-slate-500">Your data drives biochemical predictions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="control-label block mb-1.5">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setF('date', e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-300
                       focus:outline-none focus:border-emerald/40 transition-colors"
          />
        </div>

        <InstrumentPicker
          value={form.instrument}
          onChange={v => setF('instrument', v)}
          accentColor="#10B981"
        />

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="control-label">Duration</label>
            <span className="control-value">{form.durationMin} min</span>
          </div>
          <input
            type="range" min={5} max={180} value={form.durationMin}
            onChange={e => setF('durationMin', +e.target.value)}
            className="slider-custom emerald"
          />
        </div>

        <div>
          <label className="control-label block mb-1.5">Session Type</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {SESSION_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setF('sessionType', t.id)}
                className={`py-1.5 px-1 rounded-md text-xs font-medium transition-all text-center ${
                  form.sessionType === t.id
                    ? 'bg-emerald/20 text-emerald border border-emerald/30'
                    : 'bg-white/4 text-slate-500 border border-white/[0.06] hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="control-label">Piece Complexity</label>
            <span className="control-value">{form.complexity}/5</span>
          </div>
          <input
            type="range" min={1} max={5} step={1} value={form.complexity}
            onChange={e => setF('complexity', +e.target.value)}
            className="slider-custom emerald"
          />
        </div>

        <div>
          <label className="control-label block mb-1.5">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => setF('notes', e.target.value)}
            placeholder="What did you practice? How did it feel?"
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300
                       placeholder:text-slate-600 focus:outline-none focus:border-emerald/40 transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!currentUserId}
          title={!currentUserId ? 'Set your Practitioner ID first' : undefined}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            submitted
              ? 'bg-emerald/20 text-emerald border border-emerald/30'
              : !currentUserId
              ? 'opacity-40 cursor-not-allowed btn-primary'
              : 'btn-primary'
          }`}
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.span
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Session Logged!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Log Session
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </form>
    </div>
  );
}
