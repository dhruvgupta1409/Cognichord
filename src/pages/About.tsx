import { motion } from 'framer-motion';
import { Brain, PenLine, ShieldCheck, BookOpen, Code, ArrowRight, Check, Database, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const HONEST = [
  {
    title: 'The 3D brain is a general representation, not an exact atlas',
    body: 'The cortical surface is a real template brain (FreeSurfer\'s fsaverage, an average of many MRI scans), rendered with a custom tissue shader — but it is a simplified, general representation, not an anatomically precise model and not your brain. The lobe boundaries drawn on it are an approximation of a standard atlas. Full data credits are below.',
  },
  {
    title: 'Every fact is sourced, and uncertainty is labeled',
    body: 'The text on each region comes from published neuroscience, and each entry lists its sources. Where the science is an active or debated area rather than settled, the app labels it a "model," "heuristic," or "rule of thumb" rather than a finding.',
  },
  {
    title: 'CogniChord never measures, scans, or diagnoses your brain',
    body: 'It does run general models of how learning works — a day-by-day skill model and a spiking-network demonstration — and these produce illustrative numbers. But those models show the standard mechanism with parameters from the literature, seeded by your session settings; they are not readings taken from you. Nothing here scans, measures, or diagnoses your actual brain.',
  },
  {
    title: 'Your practice data is real, and it stays with you',
    body: 'Your streak, hours, and notes are simple counts of exactly what you logged — raw tallies, nothing modeled. They are stored only in your browser, are never sent anywhere, and you can clear them at any time.',
  },
];

const TECH = [
  { name: 'React + TypeScript', role: 'App framework' },
  { name: 'Three.js', role: 'The real-time 3D brain' },
  { name: 'Custom GLSL shader', role: 'The tissue look' },
  { name: 'Tailwind CSS', role: 'Design system' },
  { name: 'Zustand', role: 'Your local practice log' },
  { name: 'Vite', role: 'Build tooling' },
];

// Data provenance + attribution. Every anatomical asset in the app is derived from an open
// neuroscience dataset; each is used under its own license for this free, non-commercial,
// educational project, with the citations the source projects ask for.
const CREDITS: { source: string; used: string; license: string; cite: string[] }[] = [
  {
    source: 'FreeSurfer — fsaverage template surface',
    used: 'The 3D cortical surface (the Explore brain and the cinematic model) is derived from the fsaverage average-brain pial surface.',
    license: 'FreeSurfer Software License v1.0 — used non-commercially/educationally. Not affiliated with or endorsed by FreeSurfer/MGH.',
    cite: [
      'Dale, Fischl & Sereno (1999), NeuroImage 9:179–194.',
      'Fischl, Sereno, Tootell & Dale (1999), Human Brain Mapping 8:272–284.',
    ],
  },
  {
    source: 'Destrieux atlas (aparc.a2009s)',
    used: 'The cortical lobe boundaries (frontal, motor, somatosensory, parietal, temporal, occipital) are grouped from this per-vertex parcellation.',
    license: 'Distributed with FreeSurfer (same license).',
    cite: [
      'Destrieux, Fischl, Dale & Halgren (2010), NeuroImage 53:1–15.',
      'Fischl et al. (2004), Cerebral Cortex 14:11–22.',
    ],
  },
  {
    source: 'AAL atlas',
    used: 'The cerebellum mesh is built from the cerebellar + vermis labels of the AAL atlas.',
    license: 'GNU GPL freeware.',
    cite: ['Tzourio-Mazoyer et al. (2002), NeuroImage 15:273–289.'],
  },
  {
    source: 'Harvard-Oxford subcortical atlas',
    used: 'The brainstem and deep structures (thalamus, basal ganglia, hippocampus, amygdala) are built from this atlas (Center for Morphometric Analysis, MGH/Harvard).',
    license: 'CC BY-SA 4.0 — derived mesh assets shared under the same license.',
    cite: [
      'Makris et al. (2006), Schizophr Res 83:155–171.',
      'Frazier et al. (2005), Am J Psychiatry 162:1256–1265.',
      'Desikan et al. (2006), NeuroImage 31:968–980.',
      'Goldstein et al. (2007), Biol Psychiatry 61:935–945.',
    ],
  },
  {
    source: 'NeuroMorpho.Org — neuron reconstructions',
    used: 'The reconstructed neurons in the "dive into the neurons" views are real morphologies from animal studies (rhesus monkey, cat, and rat cortex) — shown as general examples, not human or your own cells.',
    license: 'CC BY 4.0 · NeuroMorpho.Org (RRID:SCR_002145).',
    cite: [
      'Duan, Wearne, Hof et al. (2002–2003) — macaque cortical pyramidal neurons.',
      'Budd, Kisvárday et al. (2010), PLoS Comput Biol 6:e1000711 — cat visual cortex.',
      'Staiger et al. (2004), Cerebral Cortex 14:690–701 — rat somatosensory cortex.',
      'Tecuatl, Ljungquist & Ascoli (2024), FASEB BioAdvances 6:207–221.',
    ],
  },
  {
    source: 'nilearn, fonts & libraries',
    used: 'Atlas data was accessed via nilearn (BSD-3). Type is Space Grotesk, Inter & JetBrains Mono (SIL Open Font License). Built with React, Three.js, Framer Motion, Recharts, Zustand, Tailwind & Vite.',
    license: 'BSD-3 / SIL OFL / MIT.',
    cite: [],
  },
];

export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
          <span className="section-label">About & method</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 mb-4">
            What CogniChord is and is not
          </h1>
          <p className="text-slate-400 text-base max-w-3xl leading-relaxed">
            CogniChord helps musicians understand how their brain learns while they practice. It does this in two ways: an interactive brain you can explore, built from real template anatomy and cited neurobiology; and a practice log that tells you which brain systems your practice engages, with research-based advice. It never scans, measures, or diagnoses your own brain — the models it runs are general illustrations of how learning works, not readings taken from you.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          <div className="sim-panel">
            <div className="w-11 h-11 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mb-4">
              <Brain className="w-5 h-5 text-cyan" />
            </div>
            <h3 className="font-display font-semibold text-slate-100 mb-2">Explore the brain</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Rotate a real, anatomically shaped template brain and click any part, including the lobes, the cerebellum, and the deep structures. Each part opens a plain-language page on what it is, what it does, the biology behind it, and why it matters when you play, with sources.
            </p>
          </div>
          <div className="sim-panel">
            <div className="w-11 h-11 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center mb-4">
              <PenLine className="w-5 h-5 text-emerald" />
            </div>
            <h3 className="font-display font-semibold text-slate-100 mb-2">Track your practice</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Log a session and see which brain systems that type of practice engages, along with a few research-based ways to practice more effectively. Your progress is a direct count of what you logged; any circuit animation is a general illustration, not a model of you.
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-5 h-5 text-emerald" />
            <h2 className="font-display font-bold text-2xl text-slate-100">How we keep it accurate</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HONEST.map((h, i) => (
              <div key={i} className="sim-panel">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">{h.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{h.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Prominent model disclaimer */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="sim-panel mb-14 border-amber-500/25 bg-amber-500/[0.04]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold text-slate-100 mb-1.5">A note on the brain model</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The 3D brain is <span className="text-slate-200">not anatomically accurate</span> — it is a general representation built from an average template brain, meant to make the ideas explorable, not to serve as a precise anatomical atlas. The highlighted lobe boundaries are approximate. This is an educational tool, not a medical one: nothing here diagnoses anything, it is not for clinical use, and it should not replace a teacher or a doctor. The research it draws on describes what tends to happen across many people; your own brain and experience will vary.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="sim-panel mb-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-purple/10 border border-purple/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-purple-light" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-100">Built by Dhruv Gupta</h2>
              <p className="text-cyan text-sm font-medium">A high-school student interested in music, neuroscience, and how the brain responds to both</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            I have always been interested in how playing an instrument changes the brain, including skill, attention, and memory. I built CogniChord to make that visible: a way to explore what happens inside your head when you practice, accurately and in plain language.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <div className="sim-panel">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-slate-400" />
              <h3 className="font-display font-semibold text-slate-200">How it is built</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {TECH.map((t, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5">
                  <div className="text-xs font-medium text-slate-300">{t.name}</div>
                  <div className="text-xs text-slate-600">{t.role}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="sim-panel">
            <h3 className="font-display font-semibold text-slate-200 mb-3">Honest about the models</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The "watch it learn" and spiking-network views run real general models (a skill-acquisition curve and a Brian2 spiking network) with parameters from the literature, seeded by your session settings. They illustrate the standard mechanism — they are not a measurement, scan, or simulation of your own brain, and their numbers are illustrative.
            </p>
          </div>
        </motion.div>

        {/* Data sources & credits */}
        <motion.div id="credits" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 scroll-mt-24">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-cyan" />
            <h2 className="font-display font-bold text-2xl text-slate-100">Data sources & credits</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6 max-w-3xl leading-relaxed">
            Every anatomical asset is derived from an open neuroscience dataset and used under its license for this free, non-commercial, educational project. CogniChord is not affiliated with or endorsed by any of these projects, and the data is not used for clinical or diagnostic purposes.
          </p>
          <div className="space-y-3">
            {CREDITS.map((c, i) => (
              <div key={i} className="sim-panel">
                <h4 className="text-sm font-semibold text-slate-200">{c.source}</h4>
                <p className="text-sm text-slate-400 leading-relaxed mt-1">{c.used}</p>
                <p className="text-xs text-cyan/80 mt-2">{c.license}</p>
                {c.cite.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {c.cite.map((ref, j) => (
                      <li key={j} className="text-xs text-slate-500 leading-relaxed">{ref}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <p className="text-slate-500 text-sm mb-4">Go see it for yourself.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Explore the brain <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
