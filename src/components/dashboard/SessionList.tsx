import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Music, Clock, Calendar, ChevronDown } from 'lucide-react';
import { usePracticeStore } from '../../store/practiceStore';
import type { PracticeSession } from '../../types';
import { useState } from 'react';

const SESSION_TYPE_LABELS: Record<PracticeSession['sessionType'], string> = {
  new_piece:     'New Piece',
  technique:     'Technique',
  improvisation: 'Improvisation',
  memory_recall: 'Memory Recall',
  performance:   'Performance',
};

const SESSION_TYPE_COLORS: Record<PracticeSession['sessionType'], string> = {
  new_piece:     'tag-cyan',
  technique:     'tag-purple',
  improvisation: 'tag-gold',
  memory_recall: 'tag-pink',
  performance:   'tag-emerald',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function estimateBDNF(session: PracticeSession): number {
  return Math.round(
    Math.log1p(session.durationMin / 25) * (0.5 + session.complexity / 5) * 50
  );
}

export default function SessionList() {
  const allSessions = usePracticeStore(s => s.sessions);
  const currentUserId = usePracticeStore(s => s.currentUserId);
  const removeSession = usePracticeStore(s => s.removeSession);

  const sessions = currentUserId
    ? allSessions.filter(s => s.userId === currentUserId)
    : [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? sessions : sessions.slice(0, 8);

  if (sessions.length === 0) {
    return (
      <div className="sim-panel text-center py-8">
        <Music className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
        <p className="text-slate-500 text-sm">No sessions yet.</p>
        <p className="text-slate-600 text-xs mt-1">Log your first practice session above.</p>
      </div>
    );
  }

  return (
    <div className="sim-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-slate-200 text-sm">
          Practice Log
        </h3>
        <span className="tag tag-cyan">{sessions.length} sessions</span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {displayed.map(session => {
            const bdnf = estimateBDNF(session);
            const isExpanded = expanded === session.id;

            return (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden"
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : session.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-medium text-slate-200 capitalize">{session.instrument}</span>
                        <span className={`tag ${SESSION_TYPE_COLORS[session.sessionType]}`}>
                          {SESSION_TYPE_LABELS[session.sessionType]}
                        </span>
                        <span className="tag tag-emerald">C{session.complexity}/5</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.durationMin} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.date)}
                        </span>
                        <span className="text-emerald-light font-mono">
                          +{bdnf} BDNF
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                      <button
                        onClick={e => { e.stopPropagation(); removeSession(session.id); }}
                        className="p-1 rounded text-slate-600 hover:text-pink hover:bg-pink/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/[0.06] px-3 py-3"
                    >
                      <div className="grid grid-cols-3 gap-3 mb-2.5">
                        <div>
                          <div className="text-xs text-slate-600 mb-0.5">Est. BDNF Release (model)</div>
                          <div className="font-mono text-sm text-emerald-light">+{bdnf} a.u.</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 mb-0.5">Dopamine Reward (model)</div>
                          <div className="font-mono text-sm text-cyan">
                            {(55 + session.complexity * 8).toFixed(0)}/100
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 mb-0.5">Syn. Potentiation (model)</div>
                          <div className="font-mono text-sm text-purple-light">
                            +{(session.complexity * 2.5 + session.durationMin / 20).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      {session.notes && (
                        <p className="text-xs text-slate-500 italic">{session.notes}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {sessions.length > 8 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
        >
          {showAll ? 'Show less' : `Show all ${sessions.length} sessions`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
