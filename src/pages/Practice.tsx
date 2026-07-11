import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Trash2, Sparkles, Compass, ArrowRight, Info, Activity, Music2, Dna } from 'lucide-react';
import PracticeLogger from '../components/dashboard/PracticeLogger';
import CumulativeStats from '../components/dashboard/CumulativeStats';
import SessionList from '../components/dashboard/SessionList';
import BrainExplorer from '../components/brain/BrainExplorer';
import NeuroTheater from '../components/brain/NeuroTheater';
import MusicBrain from '../components/brain/MusicBrain';
import Metronome from '../components/dashboard/Metronome';
import PracticeGoal from '../components/dashboard/PracticeGoal';
import SessionAnalysis from '../components/session/SessionAnalysis';
import { usePracticeStore, selectMySessions } from '../store/practiceStore';
import { systemsForSession, tipsForSession, deepInsights, type Confidence } from '../lib/practiceGuidance';

const CONF: Record<Confidence, { label: string; className: string }> = {
  finding:   { label: 'Research finding', className: 'text-emerald border-emerald/25 bg-emerald/[0.08]' },
  heuristic: { label: 'Rule of thumb',    className: 'text-gold-light border-gold/25 bg-gold/[0.08]' },
};

export default function Practice() {
  const allSessions   = usePracticeStore(s => s.sessions);
  const currentUserId = usePracticeStore(s => s.currentUserId);
  const clearSessions = usePracticeStore(s => s.clearSessions);
  const getMetrics    = usePracticeStore(s => s.getMetrics);
  const lastLoggedAt  = usePracticeStore(s => s.lastLoggedAt);

  const [confirmClear, setConfirmClear] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerRegion, setExplorerRegion] = useState<number | null>(null);
  const [theaterOpen, setTheaterOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const payoffRef = useRef<HTMLDivElement>(null);

  const sessions = useMemo(() => selectMySessions(allSessions, currentUserId), [allSessions, currentUserId]);
  const hasData = sessions.length > 0;
  const latest = sessions[0];
  const metrics = getMetrics();

  const systems = useMemo(() => (latest ? systemsForSession(latest) : []), [latest]);
  const tips = useMemo(() => (latest ? tipsForSession(latest, metrics, sessions) : []), [latest, metrics, sessions]);
  const insights = useMemo(() => (latest ? deepInsights(latest, metrics, sessions) : []), [latest, metrics, sessions]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (lastLoggedAt > 0 && payoffRef.current) {
      payoffRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [lastLoggedAt]);

  const openRegion = (id: number) => { setExplorerRegion(id); setExplorerOpen(true); };

  const typeLabel = latest ? latest.sessionType.replace('_', ' ') : '';

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={false} className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <span className="section-label">Practice</span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-2">
              Log a session to see which systems you worked
            </h1>
            <p className="text-slate-500 text-base max-w-2xl">
              Each session you log shows which brain systems that type of practice engages, along with research-based ways to improve your next session.
            </p>
          </div>
          {hasData && (
            <div className="flex items-center gap-2">
              <span className="tag tag-emerald flex items-center gap-1"><Brain className="w-3 h-3" /> {sessions.length} logged</span>
              {confirmClear ? (
                <>
                  <button onClick={() => { clearSessions(); setConfirmClear(false); }} className="btn-secondary text-xs py-1.5 px-3 text-pink border-pink/20 hover:bg-pink/10">Confirm clear</button>
                  <button onClick={() => setConfirmClear(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirmClear(true)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 text-slate-500">
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.button
            initial={false}
            onClick={() => setTheaterOpen(true)}
            className="text-left rounded-2xl border border-cyan/25 hover:border-cyan/50 bg-gradient-to-r from-cyan/[0.08] via-cyan/[0.03] to-transparent p-5 flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan/15 border border-cyan/30 flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-cyan" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2">
                Watch your brain learn
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mt-0.5">
                A guided tour of learning, from the whole brain down to a single synapse. Watch how repeated practice physically strengthens that connection.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </motion.button>

          <motion.button
            initial={false}
            onClick={() => setMusicOpen(true)}
            className="text-left rounded-2xl border border-pink/25 hover:border-pink/50 bg-gradient-to-r from-pink/[0.08] via-pink/[0.04] to-transparent p-5 flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-pink/15 border border-pink/30 flex items-center justify-center flex-shrink-0">
              <Music2 className="w-6 h-6 text-pink" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2">
                Play a piece <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border text-pink border-pink/25 bg-pink/[0.08]">Music → brain</span>
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mt-0.5">
                Load a MIDI piece and watch each note activate parts of the brain. As you repeat the piece, control shifts toward the automatic systems.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-pink opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Metronome />
          <PracticeGoal sessions={sessions} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div initial={false} className="lg:col-span-2">
            <PracticeLogger />
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-500 leading-relaxed">
                Your streak, hours, and focus are direct counts of what you log, and they are stored only in your browser.
              </span>
            </div>
          </motion.div>

          <motion.div initial={false} className="lg:col-span-3" ref={payoffRef}>
            {latest ? (
              <div className="sim-panel h-full">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-cyan" />
                  <h3 className="text-sm font-semibold text-slate-200">What your last session worked</h3>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Your {latest.durationMin}-minute {typeLabel} session on {latest.instrument}. This type of practice relies on these systems. Click any of them to explore it in the brain model.
                </p>
                <div className="space-y-2.5">
                  {systems.map((sys, i) => (
                    <motion.button
                      key={sys.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => openRegion(sys.regionId)}
                      className="w-full text-left flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] p-3 transition-all group"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: sys.color, boxShadow: `0 0 8px ${sys.color}` }} />
                      <span className="flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-200">{sys.name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="block text-xs text-slate-500 leading-relaxed mt-0.5">{sys.why}</span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sim-panel h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-cyan" />
                </div>
                <h3 className="font-display font-semibold text-slate-200 mb-1">Log your first session</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  After you log a session, you will see which brain systems that practice engages, and how to get more from your next session.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {latest && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 pt-8 border-t border-white/[0.06]">
            <SessionAnalysis key={latest.id} session={latest} />
          </motion.div>
        )}

        {insights.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
            <div className="flex items-center gap-2 mb-1">
              <Dna className="w-4 h-4 text-cyan" />
              <h2 className="font-display font-bold text-xl text-slate-100">What is happening in the brain during this practice</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 max-w-2xl">The underlying processes that explain why this practice will or will not last.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((ins, i) => (
                <div key={i} className="sim-panel border-l-2" style={{ borderLeftColor: ins.color }}>
                  <h4 className="text-sm font-semibold text-slate-100 mb-1.5 leading-snug">{ins.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed mb-2.5">{ins.body}</p>
                  <p className="text-[10px] text-slate-600">{ins.source}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tips.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-4 h-4 text-emerald" />
              <h2 className="font-display font-bold text-xl text-slate-100">Try this next</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="sim-panel">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-semibold text-slate-200 leading-snug">{tip.title}</h4>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${CONF[tip.confidence].className}`}>
                      {CONF[tip.confidence].label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{tip.body}</p>
                  <p className="text-[10px] text-slate-600 mt-2">{tip.source}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {hasData && (
          <div className="mt-10 pt-8 border-t border-white/[0.06] grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CumulativeStats />
            <SessionList />
          </div>
        )}
      </div>

      <BrainExplorer open={explorerOpen} initialRegionId={explorerRegion} onClose={() => setExplorerOpen(false)} />
      <NeuroTheater open={theaterOpen} onClose={() => setTheaterOpen(false)} />
      <MusicBrain open={musicOpen} onClose={() => setMusicOpen(false)} />
    </div>
  );
}
