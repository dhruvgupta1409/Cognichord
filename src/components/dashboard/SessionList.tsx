import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Music, Clock, Calendar, ChevronDown } from 'lucide-react';
import { usePracticeStore } from '../../store/practiceStore';
import type { PracticeSession } from '../../types';
import { useState } from 'react';

const FLOW_LABELS: Record<number, string> = { 1: 'No flow', 2: 'Partial', 3: 'Full flow' };
const FLOW_COLORS: Record<number, string> = { 1: '#475569', 2: '#F59E0B', 3: '#10B981' };

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
            const isExpanded = expanded === session.id;
            const hasSelf = session.preMood != null || session.sessionFocus != null;
            const affectChange = session.preMood != null && session.postMood != null
              ? session.postMood - session.preMood : null;

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
                        <span className="tag tag-emerald">D{session.complexity}/5</span>
                        {affectChange != null && (
                          <span
                            className="tag font-mono"
                            style={{ color: affectChange >= 0 ? '#10b981' : '#ef4444',
                                     borderColor: affectChange >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                                     background: affectChange >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}
                          >
                            {affectChange >= 0 ? '+' : ''}{affectChange} mood
                          </span>
                        )}
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
                        {session.timeOfDay && (
                          <span className="capitalize">{session.timeOfDay}</span>
                        )}
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
                      {hasSelf ? (
                        <div className="grid grid-cols-3 gap-3 mb-2.5">
                          {session.preMood != null && session.postMood != null && (
                            <div>
                              <div className="text-xs text-slate-600 mb-0.5">Mood (pre → post)</div>
                              <div className="font-mono text-sm text-slate-300">
                                {session.preMood} → {session.postMood}
                                <span className="ml-1 text-xs"
                                  style={{ color: affectChange! >= 0 ? '#10b981' : '#ef4444' }}>
                                  ({affectChange! >= 0 ? '+' : ''}{affectChange})
                                </span>
                              </div>
                            </div>
                          )}
                          {session.sessionFocus != null && (
                            <div>
                              <div className="text-xs text-slate-600 mb-0.5">Focus</div>
                              <div className="font-mono text-sm text-cyan">{session.sessionFocus}/5</div>
                            </div>
                          )}
                          {session.perceivedProgress != null && (
                            <div>
                              <div className="text-xs text-slate-600 mb-0.5">Progress</div>
                              <div className="font-mono text-sm text-emerald-light">{session.perceivedProgress}/5</div>
                            </div>
                          )}
                          {session.flowState != null && (
                            <div>
                              <div className="text-xs text-slate-600 mb-0.5">Flow State</div>
                              <div className="font-mono text-sm" style={{ color: FLOW_COLORS[session.flowState] }}>
                                {FLOW_LABELS[session.flowState]}
                              </div>
                            </div>
                          )}
                          {session.preAnxiety != null && (
                            <div>
                              <div className="text-xs text-slate-600 mb-0.5">Anxiety (pre)</div>
                              <div className="font-mono text-sm text-pink">{session.preAnxiety}/5</div>
                            </div>
                          )}
                          {session.practiceContext != null && (
                            <div>
                              <div className="text-xs text-slate-600 mb-0.5">Context</div>
                              <div className="font-mono text-sm text-slate-300 capitalize">{session.practiceContext}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 mb-2.5 italic">No self-report data for this session.</p>
                      )}
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
