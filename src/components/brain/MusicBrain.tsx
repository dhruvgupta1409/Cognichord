import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Upload, Music2, RotateCcw, Volume2, VolumeX, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import MusicJourney, { type MusicJourneyHandle } from './MusicJourney';
import { PIECES } from '../../data/pieces';
import { parseMidi, type MidiSong } from '../../lib/midi';
import { MidiSynth } from '../../lib/midiAudio';
import { analyzeSong, engagementAtTime, notesAt, MUSIC_FEATURES } from '../../lib/musicAnalysis';
import { SYSTEM_REGION, type SystemId } from '../../lib/learningModel';
import { REGION_BY_ID } from './regions';

const SYSTEM_LABEL: Record<SystemId, string> = {
  motor: 'Motor cortex', auditory: 'Auditory cortex', somatosensory: 'Somatosensory', thalamus: 'Thalamus',
  cerebellum: 'Cerebellum', basalGanglia: 'Basal ganglia', prefrontal: 'Prefrontal', hippocampus: 'Hippocampus',
  visual: 'Visual / reading', limbic: 'Limbic / reward',
};
const RECRUIT_STORY: Record<SystemId, string> = {
  motor: 'Fast finger sequencing', cerebellum: 'Fine sub-second timing', basalGanglia: 'Locking onto the beat',
  auditory: 'Parsing pitch & harmony', visual: 'Reading ahead', limbic: 'Feeling the expression',
  prefrontal: 'Tracking the structure', hippocampus: 'Recalling the notes', somatosensory: 'Feeling the keys',
  thalamus: 'Relaying the signal',
};

interface Lesson { heading: string; paras: string[]; mechanism: string[]; source: string; }
const LESSONS: Lesson[] = [
  {
    heading: 'The auditory pathway: sound becomes signal',
    paras: [
      'Every note you hear takes a long, fast journey before the brain registers it. Sound vibrates the eardrum, is amplified through three small bones, and enters the cochlea, a fluid-filled spiral where thousands of hair cells convert vibration into electrical spikes. The cochlea is arranged by frequency: high notes bend hair cells at one end, and low notes at the other.',
      'From there the signal travels up the auditory nerve, is refined through several brainstem relays (which compare the two ears to locate the sound in space), passes through the thalamus, and arrives at the primary auditory cortex in the temporal lobe, the region you see pulse with each note here.',
      'This whole relay takes only about 25 milliseconds. What arrives at the cortex is a structured code of frequency, timing, and intensity, which is the raw material the rest of the brain turns into melody.',
    ],
    mechanism: [
      'Cochlea, then auditory nerve, then brainstem, then thalamus (MGN), then primary auditory cortex (A1).',
      'The pathway preserves frequency, timing, and loudness as it ascends.',
    ],
    source: 'Kandel, Principles of Neural Science; Pickles (2012).',
  },
  {
    heading: 'Tonotopy: pitch is a place in the brain',
    paras: [
      'The auditory cortex keeps the cochlea\'s frequency map, a property called tonotopy. Low pitches activate one end of A1 and high pitches the other, arranged in an orderly gradient. This is what the note particles show here: each note lands on the auditory cortex at a position set by its pitch, so a melody traces a moving path across the cortical surface.',
      'This spatial map is part of why you can follow two instruments at once, and why a wrong note stands out: it lands in the wrong place relative to the pattern your cortex was predicting. In trained musicians this map is sharper and, for their instrument\'s timbre, physically enlarged.',
    ],
    mechanism: [
      'A1 is organized by frequency: pitch maps to cortical position (tonotopy).',
      'Musicians have expanded, more finely tuned auditory representations (Pantev 1998).',
    ],
    source: 'Pantev et al. (1998), Nature; Formisano et al. (2003).',
  },
  {
    heading: 'Rhythm: the motor system responds even when you sit still',
    paras: [
      'Rhythm is not processed by the ears alone. It recruits the brain\'s motor system even when you sit perfectly still. Tracking a beat activates the supplementary motor area, the basal ganglia, and the cerebellum, the same circuits that would move your body. This is why a strong groove makes you want to tap, and why the beat regions here pulse in time with the piece.',
      'The basal ganglia lock onto the periodic pulse and predict when the next beat should fall, while the cerebellum handles the fine sub-second timing between notes. Together they let you anticipate the beat rather than only react to it, which is the foundation of playing in time.',
    ],
    mechanism: [
      'Beat perception engages the SMA, basal ganglia, and cerebellum, which are motor circuits (Grahn & Brett 2007).',
      'The basal ganglia predict the pulse; the cerebellum times the intervals.',
    ],
    source: 'Grahn & Brett (2007), J Cogn Neurosci; Chen et al. (2008).',
  },
  {
    heading: 'Emotion & reward: the pleasure of a resolution',
    paras: [
      'Music engages the brain\'s reward system directly. As a phrase builds tension and then resolves, dopamine is released in the striatum, the same chemical that responds to food and money. The "chills" people feel at a musical peak occur together with a measurable dopamine surge, split between anticipation as the peak approaches and the peak itself.',
      'This is why music is rewarding to listen to and to practice: the reward circuitry responds to the structure of the sound itself, not only to praise. The limbic and reward region here brightens on the passages that build and release tension.',
    ],
    mechanism: [
      'Musical tension and resolution drives dopamine release in the striatum (Salimpoor 2011).',
      'Anticipation (caudate) and peak pleasure (nucleus accumbens) are distinct.',
    ],
    source: 'Salimpoor et al. (2011), Nat Neurosci; Zatorre & Salimpoor (2013).',
  },
  {
    heading: 'Prediction: the brain is always guessing the next note',
    paras: [
      'Listening is an active process. Your brain constantly predicts what comes next from the style and the notes so far, and it reacts to how well reality matches the prediction. A note that fits the prediction is processed cheaply, while a surprising note, such as an unexpected harmony or an early or late beat, produces a large error signal in auditory and prefrontal cortex.',
      'That prediction error is how you learn the piece. Each surprise sharpens the internal model, so the next time through you predict better and the music feels more familiar. Repeated listening and practice is, at bottom, the brain refining its predictions until the piece becomes effortless.',
    ],
    mechanism: [
      'Predictive coding: the cortex forecasts the next event, and a mismatch drives an error signal.',
      'Prediction error is the teaching signal that makes the piece feel learned.',
    ],
    source: 'Vuust et al. (2018), Nat Rev Neurosci; Koelsch (2019).',
  },
];

function PianoRoll({ song, t }: { song: MidiSong; t: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!; const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const span = 4; const playX = W * 0.28; const pxPerSec = W / span;
    const pitches = song.notes.map(n => n.pitch);
    const lo = Math.min(...pitches) - 2, hi = Math.max(...pitches) + 2;
    const yOf = (p: number) => H - ((p - lo) / (hi - lo)) * H;
    ctx.fillStyle = 'rgba(0,212,255,0.25)'; ctx.fillRect(playX - 1, 0, 2, H);
    for (const nn of song.notes) {
      const x = playX + (nn.time - t) * pxPerSec; const w = Math.max(2, nn.duration * pxPerSec);
      if (x + w < 0 || x > W) continue;
      const y = yOf(nn.pitch);
      const active = nn.time <= t && nn.time + nn.duration >= t;
      const dist = Math.abs(nn.time - t); const alpha = active ? 1 : Math.max(0.25, 1 - dist / span);
      ctx.fillStyle = active ? `rgba(0,232,255,${alpha})` : `rgba(120,150,200,${alpha * 0.7})`;
      ctx.fillRect(x, y - 2.5, w, 5);
      if (active) { ctx.shadowColor = '#00e8ff'; ctx.shadowBlur = 10; ctx.fillRect(x, y - 2.5, w, 5); ctx.shadowBlur = 0; }
    }
  }, [song, t]);
  return <canvas ref={ref} width={520} height={110} className="w-full h-[110px] rounded-lg bg-black/30 border border-white/[0.06]" />;
}

export default function MusicBrain({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [songs, setSongs] = useState<MidiSong[]>(PIECES);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [liveEng, setLiveEng] = useState<Record<SystemId, number>>(() => engagementAtTime(PIECES[0], 0, 0));
  const [lesson, setLesson] = useState(0);
  const synthRef = useRef<MidiSynth | null>(null);
  if (!synthRef.current) synthRef.current = new MidiSynth();
  const journeyRef = useRef<MusicJourneyHandle>(null);

  const song = songs[idx];
  const features = useMemo(() => analyzeSong(song), [song]);

  const tRef = useRef(0);
  const actRef = useRef(0.15);
  const lastNoteScan = useRef(0);
  const raf = useRef<number>();
  const lastFrame = useRef(0);
  const uiAcc = useRef(0);

  useEffect(() => { tRef.current = 0; setT(0); lastNoteScan.current = 0; }, [idx, open]);
  useEffect(() => { if (!open || !playing) synthRef.current?.allNotesOff(); }, [open, playing]);
  useEffect(() => () => synthRef.current?.dispose(), []);
  useEffect(() => { synthRef.current?.setMuted(muted); }, [muted]);

  const navLesson = (d: number) => setLesson(l => (l + d + LESSONS.length) % LESSONS.length);

  useEffect(() => {
    if (!open || !playing) return;
    const synth = synthRef.current!; synth.unlock();
    lastFrame.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrame.current) / 1000); lastFrame.current = now;
      tRef.current += dt;
      if (tRef.current > song.durationSec + 0.5) { tRef.current = 0; lastNoteScan.current = 0; }
      const fresh = notesAt(song, tRef.current, tRef.current - lastNoteScan.current);
      lastNoteScan.current = tRef.current;
      for (const nte of fresh) {
        const v = nte.velocity / 127;
        synth.noteOn(nte.pitch, nte.velocity, nte.duration);
        actRef.current = Math.min(1, actRef.current + 0.3 * v);
        journeyRef.current?.note(nte.pitch, nte.velocity);
      }
      actRef.current = 0.2 + (actRef.current - 0.2) * Math.pow(0.05, dt);
      const eng = engagementAtTime(song, tRef.current, 0.3);
      journeyRef.current?.drive(eng, actRef.current);
      uiAcc.current += dt;
      if (uiAcc.current >= 1 / 30) { uiAcc.current = 0; setLiveEng(eng); setT(tRef.current); }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [open, playing, song]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navLesson(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); navLesson(-1); }
    };
    const unlock = () => synthRef.current?.unlock();
    window.addEventListener('keydown', onKey); window.addEventListener('pointerdown', unlock);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', unlock); };
  }, [open, onClose]);

  const onUpload = async (file: File) => {
    synthRef.current?.unlock();
    try {
      const buf = await file.arrayBuffer();
      const s = parseMidi(buf, file.name.replace(/\.midi?$/i, ''));
      if (!s.notes.length) { alert('That MIDI has no playable notes.'); return; }
      setSongs(prev => [...prev, s]); setIdx(songs.length); setPlaying(true);
    } catch (e) { console.error('MIDI parse failed', e); alert('Could not read that MIDI file.'); }
  };

  const topSystems = (Object.entries(liveEng) as [SystemId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] bg-[#04060e] flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">CogniChord · Music → brain</div>
              <div className="font-display font-semibold text-slate-100">Play a piece and watch your brain hear it</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowScience(s => !s)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${showScience ? 'border-cyan/40 bg-cyan/[0.08] text-cyan' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}>
                <BookOpen className="w-3.5 h-3.5" /> How it is calculated
              </button>
              <button onClick={onClose} className="w-9 h-9 rounded-lg border border-white/10 bg-black/30 text-slate-300 hover:text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex-1 relative min-h-0 max-lg:flex max-lg:flex-col max-lg:overflow-y-auto">
            <div className={`absolute inset-0 max-lg:static max-lg:h-[42vh] max-lg:flex-shrink-0 max-lg:order-1 ${showScience ? 'max-lg:hidden' : ''}`}>
              {open && <MusicJourney ref={journeyRef} paused={!open || !playing} chapter={lesson} />}
            </div>

            <button onClick={() => navLesson(-1)} title="Previous (←)" className="absolute left-[356px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/15 bg-black/50 text-slate-200 hover:bg-black/70 backdrop-blur flex items-center justify-center max-lg:hidden"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => navLesson(1)} title="Next (→)" className="absolute right-[290px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/15 bg-black/50 text-slate-200 hover:bg-black/70 backdrop-blur flex items-center justify-center max-lg:hidden"><ChevronRight className="w-5 h-5" /></button>

            <div className="absolute top-4 left-5 z-10 w-[340px] max-w-[38vw] max-h-[calc(100vh-260px)] overflow-y-auto pr-1 max-lg:static max-lg:top-auto max-lg:left-auto max-lg:w-full max-lg:max-w-none max-lg:max-h-none max-lg:overflow-visible max-lg:px-4 max-lg:pb-4 max-lg:order-3">
              <div className="mb-2">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Now playing</div>
                <div className="font-display font-bold text-xl text-slate-100">{song.name}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {features.dominant.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-300">{SYSTEM_LABEL[s]}</span>)}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={lesson} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}
                  className="rounded-2xl bg-[#070b16]/80 backdrop-blur-md border border-white/[0.08] p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] uppercase tracking-widest text-cyan">Chapter {lesson + 1} / {LESSONS.length} · use ← →</div>
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      <button onClick={() => navLesson(-1)} className="text-slate-400 hover:text-cyan"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <div className="flex gap-1">{LESSONS.map((_, i) => <span key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === lesson ? '#00d4ff' : '#33415588', transform: i === lesson ? 'scale(1.3)' : 'scale(1)' }} />)}</div>
                      <button onClick={() => navLesson(1)} className="text-slate-400 hover:text-cyan"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-slate-100 text-[15px] leading-snug mb-2">{LESSONS[lesson].heading}</h3>
                  <div className="space-y-2">
                    {LESSONS[lesson].paras.map((p, i) => <p key={i} className="text-[12px] text-slate-400 leading-relaxed">{p}</p>)}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">The mechanism</div>
                    {LESSONS[lesson].mechanism.map((m, i) => <p key={i} className="text-[11px] text-slate-400 leading-snug flex gap-1.5 mb-1"><span className="text-emerald mt-px">›</span><span>{m}</span></p>)}
                    <p className="text-[10px] text-slate-600 leading-snug mt-2">{LESSONS[lesson].source}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="absolute top-4 right-5 w-60 rounded-2xl bg-[#070b16]/75 backdrop-blur-md border border-white/[0.07] p-4 z-10 max-lg:static max-lg:top-auto max-lg:right-auto max-lg:w-auto max-lg:mx-4 max-lg:mt-3 max-lg:order-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Now processing</div>
                <button onClick={() => setShowScience(true)} className="text-[10px] text-slate-500 hover:text-cyan">how?</button>
              </div>
              {topSystems[0] && (
                <div className="mb-3">
                  <div className="font-display font-semibold text-slate-100 leading-snug">{RECRUIT_STORY[topSystems[0][0]]}</div>
                  <div className="text-[10px] text-slate-500">led by {SYSTEM_LABEL[topSystems[0][0]].toLowerCase()}</div>
                </div>
              )}
              <div className="space-y-1.5">
                {topSystems.slice(0, 5).map(([sys, v]) => {
                  const col = REGION_BY_ID[SYSTEM_REGION[sys]]?.color ?? '#8891a5';
                  return (
                    <div key={sys} className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300 w-24 flex-shrink-0 truncate">{SYSTEM_LABEL[sys]}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${v * 100}%`, background: col, boxShadow: `0 0 7px ${col}` }} /></div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 mt-3 leading-snug">Each note lands on the auditory cortex at a spot set by its pitch (tonotopy); rhythm drives the beat regions; tension and release drive reward.</p>
            </div>

            <AnimatePresence>
              {showScience && (
                <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
                  className="absolute top-0 right-0 bottom-0 w-[380px] bg-[#070b16]/95 backdrop-blur-xl border-l border-white/[0.08] overflow-y-auto p-5 z-20 max-lg:fixed max-lg:inset-0 max-lg:w-full max-lg:border-l-0 max-lg:z-[110]">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-semibold text-slate-100">How the recruitment is computed</h3>
                    <button onClick={() => setShowScience(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    The features below are measured directly from the MIDI notes, which is objective arithmetic. Mapping those features to
                    brain systems is a cited approximation, so the engagement bars and glows are <span className="text-slate-300">model estimates</span>, not fMRI measurements.
                  </p>
                  <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 mb-4 text-[11px] text-slate-400 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">This piece, measured</div>
                    <div className="flex justify-between"><span>Peak note density</span><span className="font-mono text-slate-300">{features.noteDensity.toFixed(1)} notes/s</span></div>
                    <div className="flex justify-between"><span>Rhythmic complexity</span><span className="font-mono text-slate-300">{features.rhythmicComplexity.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Dynamic range</span><span className="font-mono text-slate-300">{features.dynamicRange.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Pitch range</span><span className="font-mono text-slate-300">{features.pitchRange} semitones</span></div>
                    <div className="flex justify-between"><span>Avg polyphony</span><span className="font-mono text-slate-300">{features.polyphony.toFixed(1)} notes</span></div>
                    <div className="flex justify-between"><span>Overall difficulty</span><span className="font-mono text-slate-300">{Math.round(features.difficulty * 100)}/100</span></div>
                  </div>
                  {MUSIC_FEATURES.map(f => (
                    <div key={f.name} className="mb-3.5 pb-3.5 border-b border-white/[0.05] last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${f.evidence === 'established' ? 'text-emerald border-emerald/25 bg-emerald/[0.08]' : 'text-gold-light border-gold/25 bg-gold/[0.08]'}`}>{f.evidence === 'established' ? 'Established' : 'Approximation'}</span>
                        <h4 className="text-sm font-semibold text-slate-200">{f.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-1"><span className="text-slate-400">Measured as:</span> {f.formula}</p>
                      <p className="text-xs text-slate-400 leading-relaxed"><span className="text-slate-300">Drives {f.drives}.</span> {f.why}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{f.source}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-white/[0.06] bg-[#060912] px-5 py-4">
            <div className="mb-3"><PianoRoll song={song} t={t} /></div>
            <div className="flex items-center gap-4 flex-wrap">
              <button onClick={() => setPlaying(p => !p)} className="w-10 h-10 rounded-full bg-cyan/15 border border-cyan/30 text-cyan flex items-center justify-center hover:bg-cyan/25 flex-shrink-0">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button onClick={() => setMuted(m => !m)} title={muted ? 'Unmute' : 'Mute'} className="w-9 h-9 rounded-full border border-white/10 text-slate-400 hover:text-slate-200 flex items-center justify-center flex-shrink-0">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => { tRef.current = 0; setT(0); lastNoteScan.current = 0; synthRef.current?.allNotesOff(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-slate-200"><RotateCcw className="w-3.5 h-3.5" /> Restart</button>
              <div className="flex items-center gap-1.5 flex-wrap">
                {songs.map((s, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${i === idx ? 'border-cyan/40 bg-cyan/[0.1] text-cyan' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}>
                    <Music2 className="w-3 h-3" /> {s.name}
                  </button>
                ))}
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
                  <Upload className="w-3 h-3" /> Upload MIDI
                  <input type="file" accept=".mid,.midi" className="hidden" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
                </label>
              </div>
              <div className="ml-auto text-xs font-mono text-slate-500">{t.toFixed(1)}s / {song.durationSec.toFixed(1)}s</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
