# CogniChord

CogniChord helps musicians understand how their brain learns while they practice.

Everything centers on one interactive 3D brain — built from an open template surface (a general
representation, **not** an anatomically exact model) you can rotate, click, and cut away. Stylized
signal pulses illustrate the circuits that turn practice into skill (hearing a note → moving, the
cerebellar timing loop, the basal-ganglia habit loop). Click any structure to learn what it does
when you play, then log a practice session to see which of those systems that kind of practice works.

## Three sections, one brain

- **Explore** — the interactive 3D brain. Rotate, zoom, and click any structure to learn its
  anatomy, its function, and its role in music. Toggle the cutaway to fade the cortex translucent
  and watch activity course through the deep structures.
- **Practice** — log a session in about ten seconds. It shows which brain systems that kind of
  practice leans on (each opens in the full brain) and a few research-backed ways to get more from
  the next one. Real counts of what you log (streak, hours, focus) — no simulated or invented
  "brain scores."
- **Learn** — the mechanism in plain language, the neurotransmitters involved, and the research
  behind why slow practice, sleep, spacing, and focus work — each with a confidence label and
  citations, one click away.

## The 3D brain

- A cortex surface derived from **FreeSurfer's fsaverage** template (a general representation, not an
  anatomically exact atlas), with the **cerebellum** (AAL atlas) and **brainstem** (Harvard-Oxford
  atlas) added, preprocessed into a compact binary with smooth normals and curvature-based crease
  shading. Full data sources, licenses, and citations are on the About page.
- Loaded and **oriented into a standard anatomical frame** (`brainModel.ts`). Each vertex's lobe is
  the real **Destrieux cortical parcellation** baked in offline (`tools/brain/bake_cortex.py`) — not
  a geometric guess from position — so clicking any gyrus selects the correct lobe.
- Rendered as a **modern holographic mesh** — the full-density smooth fsaverage mesh drawn
  with a custom GLSL shader: a cool deep-blue surface shaded from the real geometry and baked sulcal
  crease AO, overlaid with a crisp cyan wireframe traced on every triangle, and a distinct accent
  colour per structure so every lobe (and the cerebellum + brainstem) reads at a glance. Selection
  and engagement blaze brighter and feed the bloom; a travelling energy sweep + micro-shimmer keep it
  alive. You can **rotate, zoom, and pan** (two-finger / right-drag) to recentre.
- **Atlas-derived subcortical structures** (`deepStructures.ts`): the thalamus, basal ganglia,
  hippocampus, and amygdala are meshed from the Harvard-Oxford atlas (CC BY-SA 4.0; not procedural
  blobs), shaded in the same blue triangle-net and revealed by the cutaway.
- **Living functional pathways** (`anatomy.ts` + `NeuralPathways.tsx`): each music-learning tract is
  sampled into a GPU point run, and a shader sends light pulses flowing along it — selecting a
  structure surges its whole network. The brain also breathes at rest.
- **Cinematic post** (`Postprocessing.tsx`): HDR render → ground-truth ambient occlusion (GTAO) →
  bloom → a film grade (vignette, subtle grain, filmic split-tone, chromatic aberration) → ACES
  tone-map → SMAA. Kept to real-time screen-space effects, no volumetric raymarching, so it stays
  smooth at 60fps.

## Watch it learn, and play it

- **The learning simulation** (`learningModel.ts`, `NeuroTheater.tsx`): a mechanistic day-by-day simulation of
  encoding, consolidation, spacing, forgetting, myelination, and the migration of automaticity, live
  behind an embedded 3D brain. Open it for one continuous cinematic dive — whole brain → region →
  tissue → neuron → synapse — ending in a molecular LTP cascade with cited numbers. Every mechanism
  is cited and labelled established-vs-approximation.
- **Music → brain** (`midi.ts`, `musicAnalysis.ts`, `midiAudio.ts`, `MusicBrain.tsx`): drop in a MIDI
  file (or pick a built-in piece), **hear it** (a Web Audio synth plays the notes, synced to the
  visuals), and watch every note send activation through the brain — fast passages tax the cerebellum,
  syncopation the basal ganglia, dynamics the limbic system, sight-reading the visual/attention
  network. Loop it and the locus migrates toward automaticity. A "How it's calculated" panel shows
  exactly how each feature is measured (with formulas + citations) and labels the bars as model
  estimates, not fMRI.
- **Dive into the neurons** (`micro/`): click any structure → a cinematic zoom into a living
  microscopic scene where an action potential races a myelinated axon (saltatory conduction) to a
  synapse, releasing neurotransmitter vesicles across the cleft onto the next neuron; fire long-term
  potentiation to strengthen the synapse. Procedural neurons, GPU particles, custom membrane shader.

## Scientific honesty

Every claim is labeled: **research finding** (empirically supported), **model**, or **rule of thumb**
(a reasonable heuristic). The 3D brain is a general representation — an average template surface, not
an anatomically exact or per-subject model — and its lobe boundaries are grouped from the Destrieux
atlas. The pathway pulses illustrate which circuits are involved, not measured firing. The app runs
general learning models (illustrative, seeded by your session settings); it never scans, measures, or
invents a numeric "score" for your own brain.

## Data & credits

The 3D brain and neurons are derived from open neuroscience datasets — **FreeSurfer/fsaverage** +
**Destrieux** (cortex/lobes), **AAL** (cerebellum, GPL), **Harvard-Oxford** (brainstem + deep
structures, CC BY-SA 4.0), and **NeuroMorpho.org** neuron reconstructions (CC BY 4.0; monkey/cat/rat
cells shown as general examples) — each used under its license for this free, non-commercial,
educational project, with full attribution and citations on the in-app About page. CogniChord is not
affiliated with or endorsed by these projects and is not for clinical use.

## Running locally

```bash
npm install
npm run dev
```

## Tech

React, TypeScript, Vite, Tailwind CSS, Three.js (react-three-fiber) with custom GLSL shaders,
Recharts, Zustand. Practice guidance lives in `src/lib/practiceGuidance.ts` (mapping a logged
session to the brain systems that kind of practice works, with citations) — no fabricated
simulation or scores.

## Note

This is an education tool. The guidance is drawn from published research and clearly-labeled
heuristics, not medical or clinical measurement.
