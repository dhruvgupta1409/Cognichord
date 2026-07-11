# Credits, data sources & licenses

CogniChord is a **free, non-commercial, educational** project. Every anatomical asset in it is
*derived* from an open neuroscience dataset and used under that dataset's license. CogniChord is
**not affiliated with or endorsed by** any of the projects below, and none of this data is used for
clinical or diagnostic purposes. The on-screen 3D brain is a **general representation** (an average
template surface), **not** an anatomically exact or subject-specific model.

## Licensing summary

- **Application code** (this repository): MIT (see `LICENSE`).
- **Derived data assets** keep their source licenses, which differ from the code:
  - `public/brain/brain.bin`, `public/models/brain.glb` — cortical geometry derived from **FreeSurfer
    fsaverage**; lobe labels from the **Destrieux** atlas. Used under the FreeSurfer Software License
    v1.0 (non-commercial / educational use here; not for clinical use).
  - Cerebellum mesh (in `brain.bin`) — derived from the **AAL** atlas (**GNU GPL**).
  - Brainstem + subcortical meshes (`brain.bin`, `public/brain/subcortical.bin`) — derived from the
    **Harvard-Oxford** subcortical atlas (**CC BY-SA 4.0**; these derived mesh assets are likewise
    provided under CC BY-SA 4.0, with changes indicated: marching-cubes + smoothing + decimation).
  - `public/neurons/*.swc` — neuron reconstructions from **NeuroMorpho.Org** (**CC BY 4.0**).

If CogniChord is ever used commercially, re-check each of these (FreeSurfer has a second, stricter
non-commercial license text; AAL has a downstream non-commercial redistribution; ShareAlike/GPL
copyleft applies to the derived assets). This file is a technical summary, not legal advice.

## Attribution & citations

### FreeSurfer — fsaverage template surface (the 3D cortex)
Cortical surface geometry (Explore brain + cinematic model) derived from the fsaverage average-brain
pial surface, obtained via nilearn. License: FreeSurfer Software License v1.0.
- Dale AM, Fischl B, Sereno MI (1999). Cortical surface-based analysis I. *NeuroImage* 9:179–194.
- Fischl B, Sereno MI, Dale AM (1999). Cortical surface-based analysis II. *NeuroImage* 9:195–207.
- Fischl B, Sereno MI, Tootell RBH, Dale AM (1999). High-resolution intersubject averaging and a
  coordinate system for the cortical surface. *Human Brain Mapping* 8:272–284.

### Destrieux atlas — aparc.a2009s (cortical lobe boundaries)
- Destrieux C, Fischl B, Dale A, Halgren E (2010). Automatic parcellation of human cortical gyri and
  sulci using standard anatomical nomenclature. *NeuroImage* 53:1–15.
- Fischl B, van der Kouwe A, Destrieux C, et al. (2004). Automatically parcellating the human
  cerebral cortex. *Cerebral Cortex* 14:11–22.

### AAL atlas (cerebellum)
- Tzourio-Mazoyer N, Landeau B, Papathanassiou D, et al. (2002). Automated anatomical labeling of
  activations in SPM… *NeuroImage* 15:273–289.

### Harvard-Oxford subcortical atlas (brainstem + deep structures)
Center for Morphometric Analysis (CMA), MGH/Harvard; distributed with FSL. License: CC BY-SA 4.0.
- Makris N, et al. (2006). *Schizophrenia Research* 83:155–171.
- Frazier JA, et al. (2005). *American Journal of Psychiatry* 162:1256–1265.
- Desikan RS, et al. (2006). *NeuroImage* 31:968–980.
- Goldstein JM, et al. (2007). *Biological Psychiatry* 61:935–945.

### NeuroMorpho.Org — neuron reconstructions
NeuroMorpho.Org (RRID:SCR_002145). License: CC BY 4.0. The reconstructions are from animal studies
(rhesus monkey, cat, and rat cortex) and are shown as general examples, not human or user cells.
- Duan H, Wearne SL, Rocher AB, et al. (2003). *Cerebral Cortex* 13:950–961. (macaque cortical pyramidal)
- Duan H, Wearne SL, Morrison JH, Hof PR (2002). *Neuroscience* 114:349–359. (macaque cortical pyramidal)
- Budd JML, Kovács K, Ferecskó AS, Buzás P, Eysel UT, Kisvárday ZF (2010). *PLoS Comput Biol* 6:e1000711. (cat visual cortex)
- Staiger JF, Flagmeyer I, Schubert D, et al. (2004). *Cerebral Cortex* 14:690–701. (rat somatosensory cortex)
- Tecuatl C, Ljungquist B, Ascoli GA (2024). Accelerating the continuous community sharing of digital
  neuromorphology data. *FASEB BioAdvances* 6:207–221.

### Data access, fonts & libraries
- **nilearn** (BSD-3-Clause) — used to fetch the atlas/template data.
- Fonts: **Space Grotesk**, **Inter**, **JetBrains Mono** — SIL Open Font License, via Google Fonts.
- Libraries: React, Three.js (react-three-fiber / drei), Framer Motion, Recharts, Zustand, Tailwind
  CSS, Vite — MIT / permissive licenses.
