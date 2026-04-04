import { motion } from 'framer-motion';
import PracticeLogger from '../components/dashboard/PracticeLogger';
import CumulativeStats from '../components/dashboard/CumulativeStats';
import SessionList from '../components/dashboard/SessionList';
import NeuralImpact from '../components/dashboard/NeuralImpact';
import { usePracticeStore } from '../store/practiceStore';
import { Brain, Trash2, User, Lock } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const allSessions = usePracticeStore(s => s.sessions);
  const currentUserId = usePracticeStore(s => s.currentUserId);
  const setUserId = usePracticeStore(s => s.setUserId);
  const clearSessions = usePracticeStore(s => s.clearSessions);

  const sessions = currentUserId
    ? allSessions.filter(s => s.userId === currentUserId)
    : [];

  const [confirmClear, setConfirmClear] = useState(false);
  const [editingId, setEditingId] = useState(false);
  const [idInput, setIdInput] = useState(currentUserId);

  const handleSetId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = idInput.trim();
    if (trimmed) {
      setUserId(trimmed);
      setEditingId(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
                <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <span className="section-label">Practice Dashboard</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-2">
              Your Neural{' '}
              <span className="gradient-text">Practice Lab</span>
            </h1>
            <p className="text-slate-500 text-base max-w-2xl">
              Log your practice sessions with self-reported mood, focus, flow state, and anxiety measures.
              Track how practice affects your affect over time and export clean data for research analysis.
            </p>
          </div>

          {sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="tag tag-emerald flex items-center gap-1">
                <Brain className="w-3 h-3" /> {sessions.length} sessions logged
              </span>
              {confirmClear ? (
                <>
                  <button
                    onClick={() => { clearSessions(); setConfirmClear(false); }}
                    className="btn-secondary text-xs py-1.5 px-3 text-pink border-pink/20 hover:bg-pink/10"
                  >
                    Confirm clear
                  </button>
                  <button onClick={() => setConfirmClear(false)} className="btn-ghost text-xs py-1.5 px-3">
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 text-slate-500"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          )}
        </motion.div>

                <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-xl border border-purple/20 bg-purple/[0.04] p-4 flex items-center gap-4 flex-wrap"
        >
          <User className="w-4 h-4 text-purple-light flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {editingId || !currentUserId ? (
              <form onSubmit={handleSetId} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Practitioner ID:</span>
                <input
                  value={idInput}
                  onChange={e => setIdInput(e.target.value)}
                  placeholder="e.g. alice, user-42 …"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-slate-300
                             focus:outline-none focus:border-purple/40 transition-colors min-w-[160px]"
                  autoFocus
                />
                <button type="submit" disabled={!idInput.trim()} className="btn-primary text-xs py-1.5 px-3">
                  {currentUserId ? 'Update' : 'Enter Lab'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(false); setIdInput(currentUserId); }}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                )}
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Practitioner ID:</span>
                <span className="font-mono text-sm text-purple-light">{currentUserId}</span>
                <button
                  onClick={() => { setEditingId(true); setIdInput(currentUserId); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  change
                </button>
              </div>
            )}
          </div>
          {!currentUserId && (
            <p className="text-xs text-slate-600 max-w-xs">
              Sessions are stored only in your browser. Your data never leaves this device.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6 rounded-xl border border-emerald/15 bg-emerald/[0.03] p-3.5 flex items-center gap-3"
        >
          <Lock className="w-4 h-4 text-emerald flex-shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-400">100% Local Storage. Data never leaves your device.</strong>{' '}
            All session data is stored only in your browser's local storage and is never transmitted to
            any server or third party. You can export it as CSV or JSON at any time.
            Visit the{' '}
            <a href="/research" className="text-emerald hover:text-emerald-light transition-colors underline underline-offset-2">
              Model Explorer
            </a>{' '}
            to see how practice parameters affect model predictions.
          </p>
        </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <PracticeLogger />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <SessionList />
            </motion.div>
          </div>

                    <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <CumulativeStats />
            </motion.div>
          </div>
        </div>

                {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <NeuralImpact sessions={sessions} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
