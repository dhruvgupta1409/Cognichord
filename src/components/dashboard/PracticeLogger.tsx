import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Sun, Sunset, Moon, CloudSun, ChevronDown, Play, Pause, RotateCcw } from 'lucide-react';
import { usePracticeStore } from '../../store/practiceStore';
import InstrumentPicker from '../ui/InstrumentPicker';
import type {
  InstrumentType, PracticeSession, TimeOfDay, PracticeContext, GoalsMet,
} from '../../types';

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SESSION_TYPES: { id: PracticeSession['sessionType']; label: string }[] = [
  { id: 'new_piece',      label: 'New Piece'     },
  { id: 'technique',      label: 'Technique'     },
  { id: 'improvisation',  label: 'Improvisation' },
  { id: 'memory_recall',  label: 'Memory Recall' },
  { id: 'performance',    label: 'Performance'   },
];

const TIME_OPTIONS: { id: TimeOfDay; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'morning',   label: 'Morning',   Icon: Sun      },
  { id: 'afternoon', label: 'Afternoon', Icon: CloudSun },
  { id: 'evening',   label: 'Evening',   Icon: Sunset   },
  { id: 'night',     label: 'Night',     Icon: Moon     },
];

const CONTEXT_OPTIONS: { id: PracticeContext; label: string }[] = [
  { id: 'alone',   label: 'Alone'        },
  { id: 'teacher', label: 'With Teacher' },
  { id: 'group',   label: 'Group / Ensemble' },
];

const FLOW_OPTIONS = [
  { id: 1 as const, label: 'No flow',    desc: 'Distracted / just going through motions' },
  { id: 2 as const, label: 'Partial',    desc: 'Engaged at times, drifted occasionally'  },
  { id: 3 as const, label: 'Full flow',  desc: 'Fully absorbed, time flew by'             },
];

const GOALS_OPTIONS: { id: GoalsMet; label: string }[] = [
  { id: 'yes',     label: 'Met goals'     },
  { id: 'partial', label: 'Partially'     },
  { id: 'no',      label: 'Did not meet'  },
];

const FEEL_OPTIONS: { emoji: string; label: string; value: number }[] = [
  { emoji: '😞', label: 'Rough',   value: 1 },
  { emoji: '😕', label: 'Okay',    value: 3 },
  { emoji: '😐', label: 'Decent',  value: 4 },
  { emoji: '🙂', label: 'Good',    value: 5 },
  { emoji: '🤩', label: 'Amazing', value: 7 },
];

function Scale5({
  value, onChange, color = '#00D4FF',
}: { value: number; onChange: (v: number) => void; color?: string }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-full text-xs font-bold transition-all border ${
            value === n
              ? 'border-transparent text-white shadow-md'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:text-slate-300'
          }`}
          style={value === n ? { background: color } : {}}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1 border-t border-white/[0.05]">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{children}</span>
    </div>
  );
}

function autoDetectTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

export default function PracticeLogger({ onLogged }: { onLogged?: (session: PracticeSession) => void } = {}) {
  const addSession    = usePracticeStore(s => s.addSession);
  const [submitted, setSubmitted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [durationMode, setDurationMode] = useState<'timer' | 'manual'>('timer');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const [form, setForm] = useState({
    date:         new Date().toISOString().split('T')[0],
    instrument:   'piano' as InstrumentType,
    durationMin:  45,
    sessionType:  'technique' as PracticeSession['sessionType'],
    complexity:   3,
    notes:        '',
    timeOfDay:        autoDetectTimeOfDay(),
    practiceContext:  'alone' as PracticeContext,
    preMood:          4,
    preEnergy:        3,
    preAnxiety:       2,
    sleepQuality:     3,
    postMood:           4,
    sessionFocus:       3,
    flowState:          1 as 1 | 2 | 3,
    perceivedProgress:  3,
    hadFrustration:     false,
    goalsMet:           undefined as GoalsMet | undefined,
  });

  const setF = <K extends keyof typeof form>(key: K, val: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const timerDurationMin = Math.max(1, Math.round(elapsedSec / 60));
  const effectiveDurationMin = durationMode === 'timer' && elapsedSec > 0 ? timerDurationMin : form.durationMin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addSession({
      ...form,
      durationMin: effectiveDurationMin,
      date: new Date(form.date).toISOString(),
    });
    onLogged?.(created);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setTimerRunning(false);
    setElapsedSec(0);
    setForm(prev => ({
      ...prev,
      notes: '',
      durationMin: 45,
      sessionType: 'technique',
      complexity: 3,
      preMood: 4,
      preEnergy: 3,
      preAnxiety: 2,
      sleepQuality: 3,
      postMood: 4,
      sessionFocus: 3,
      flowState: 1,
      perceivedProgress: 3,
      hadFrustration: false,
      goalsMet: undefined,
      timeOfDay: autoDetectTimeOfDay(),
    }));
  };

  return (
    <div className="sim-panel">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center">
          <Plus className="w-4 h-4 text-emerald" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-slate-200 text-sm">Log a Practice Session</h3>
          <p className="text-xs text-slate-500">Takes about 10 seconds</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <InstrumentPicker
          value={form.instrument}
          onChange={v => setF('instrument', v as InstrumentType)}
          accentColor="#10B981"
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="control-label">Duration</label>
            <div className="flex gap-1 bg-white/[0.03] rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setDurationMode('timer')}
                className={`text-[10px] px-2 py-1 rounded transition-all ${durationMode === 'timer' ? 'bg-emerald/20 text-emerald' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Timer
              </button>
              <button
                type="button"
                onClick={() => { setDurationMode('manual'); setTimerRunning(false); }}
                className={`text-[10px] px-2 py-1 rounded transition-all ${durationMode === 'manual' ? 'bg-emerald/20 text-emerald' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Manual
              </button>
            </div>
          </div>

          {durationMode === 'timer' ? (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-3xl text-slate-100 tabular-nums">{formatClock(elapsedSec)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {elapsedSec > 0 ? `≈ ${timerDurationMin} min logged` : 'Start when you begin practicing'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {elapsedSec > 0 && !timerRunning && (
                  <button
                    type="button"
                    onClick={() => setElapsedSec(0)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 border border-white/[0.08]"
                    title="Reset"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTimerRunning(r => !r)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    timerRunning ? 'bg-pink/20 text-pink border border-pink/30' : 'bg-emerald/20 text-emerald border border-emerald/30'
                  }`}
                >
                  {timerRunning ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5 ml-0.5" />}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between mb-1.5">
                <span />
                <span className="control-value">{form.durationMin} min</span>
              </div>
              <input
                type="range" min={5} max={180} value={form.durationMin}
                onChange={e => setF('durationMin', +e.target.value)}
                className="slider-custom emerald"
              />
            </>
          )}
        </div>

        <div>
          <label className="control-label block mb-1.5">What did you work on?</label>
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
            <label className="control-label">Technical Difficulty</label>
            <span className="control-value">{form.complexity}/5</span>
          </div>
          <input
            type="range" min={1} max={5} step={1} value={form.complexity}
            onChange={e => setF('complexity', +e.target.value)}
            className="slider-custom emerald"
          />
        </div>

        <div>
          <label className="control-label block mb-2">How did it feel?</label>
          <div className="grid grid-cols-5 gap-1.5">
            {FEEL_OPTIONS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setF('postMood', f.value)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-center transition-all border ${
                  form.postMood === f.value
                    ? 'bg-emerald/15 border-emerald/30'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <span className="text-lg leading-none">{f.emoji}</span>
                <span className="text-[10px] text-slate-500">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(v => !v)}
          className="w-full flex items-center justify-between pt-2 pb-1 border-t border-white/[0.05] text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span>Add more detail (optional, for deeper research tracking)</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 overflow-hidden"
            >
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

              <SectionHeader>Before Practice</SectionHeader>

              <div>
                <label className="control-label block mb-1.5">Time of Day</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_OPTIONS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setF('timeOfDay', id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-md text-xs font-medium transition-all border ${
                        form.timeOfDay === id
                          ? 'bg-cyan/15 text-cyan border-cyan/30'
                          : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="control-label block mb-1.5">Practice Context</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CONTEXT_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setF('practiceContext', c.id)}
                      className={`py-1.5 px-1 rounded-md text-xs font-medium transition-all text-center border ${
                        form.practiceContext === c.id
                          ? 'bg-purple/20 text-purple-light border-purple/30'
                          : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:text-slate-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="control-label text-xs">Energy / Alertness</label>
                    <span className="control-value text-xs">{form.preEnergy}/5</span>
                  </div>
                  <Scale5 value={form.preEnergy} onChange={v => setF('preEnergy', v)} color="#8B5CF6" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="control-label text-xs">Practice Anxiety</label>
                    <span className="control-value text-xs">{form.preAnxiety}/5</span>
                  </div>
                  <Scale5 value={form.preAnxiety} onChange={v => setF('preAnxiety', v)} color="#FF2D78" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="control-label">Sleep Quality (last night)</label>
                  <span className="control-value">{form.sleepQuality}/5</span>
                </div>
                <Scale5 value={form.sleepQuality} onChange={v => setF('sleepQuality', v)} color="#00D4FF" />
              </div>

              <SectionHeader>After Practice</SectionHeader>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="control-label text-xs">Session Focus</label>
                    <span className="control-value text-xs">{form.sessionFocus}/5</span>
                  </div>
                  <Scale5 value={form.sessionFocus} onChange={v => setF('sessionFocus', v)} color="#00D4FF" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="control-label text-xs">Perceived Progress</label>
                    <span className="control-value text-xs">{form.perceivedProgress}/5</span>
                  </div>
                  <Scale5 value={form.perceivedProgress} onChange={v => setF('perceivedProgress', v)} color="#10B981" />
                </div>
              </div>

              <div>
                <label className="control-label block mb-1.5">Flow State</label>
                <div className="space-y-1.5">
                  {FLOW_OPTIONS.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setF('flowState', f.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        form.flowState === f.id
                          ? 'bg-gold/10 border-gold/30 text-slate-200'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: form.flowState === f.id ? '#F59E0B' : '#475569' }}
                      />
                      <div>
                        <div className="text-xs font-semibold">{f.label}</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{f.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="control-label block mb-2">Goals Met</label>
                <div className="flex gap-2">
                  {GOALS_OPTIONS.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setF('goalsMet', form.goalsMet === g.id ? undefined : g.id)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all border ${
                        form.goalsMet === g.id
                          ? 'bg-cyan/15 text-cyan border-cyan/30'
                          : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:text-slate-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="control-label">Frustrating moments?</label>
                  <button
                    type="button"
                    onClick={() => setF('hadFrustration', !form.hadFrustration)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      form.hadFrustration
                        ? 'bg-pink/15 text-pink border-pink/30'
                        : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'
                    }`}
                  >
                    {form.hadFrustration ? 'Yes' : 'No'}
                  </button>
                </div>
              </div>

              <div>
                <label className="control-label block mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setF('notes', e.target.value)}
                  placeholder="What specifically did you work on?"
                  rows={2}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300
                             placeholder:text-slate-600 focus:outline-none focus:border-emerald/40 transition-colors resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            submitted
              ? 'bg-emerald/20 text-emerald border border-emerald/30'
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
