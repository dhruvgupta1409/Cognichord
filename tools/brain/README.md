# Cortical lobe parcellation (baked into `public/brain/brain.bin`)

The cerebral-cortex lobe/region labels (frontal, motor, somatosensory, parietal, temporal,
occipital) are **not** computed from XYZ position at runtime and are **not** transferred onto a
foreign mesh. The rendered cortex mesh **is** the real fsaverage6 pial surface, and every vertex
carries the Destrieux (`aparc.a2009s`) label that is *natively defined on that vertex*. Because
there is no registration onto a differently-shaped brain, the lobe boundaries follow the true
central sulcus and lateral (sylvian) fissure exactly. Baked offline by `bake_cortex.py` into
`brain.bin` (format `CBR2`: adds a per-vertex region id over `CBR1`).

The bake pipeline (see the module docstring in `bake_cortex.py` for detail):
1. Loads the fsaverage6 pial surface (40,962 verts/hemi) and the native Destrieux labels
   (fsaverage5), via `nilearn`. The labels are resampled fs5 -> fs6 by nearest-neighbor on the
   registered sphere -- the same operation FreeSurfer's `mri_surf2surf` performs between
   icosahedron orders. This is the only "resampling" and it is exact per-vertex, not spatial.
2. Groups the 75 Destrieux parcels into this app's cortical ids via `LOBE_OF`, with
   `G_precentral`/`G_postcentral` carved out as MOTOR/SOMATO (the precise gyri, so those render
   as the correct central-sulcus strip). Medial-wall / paracentral-straddle vertices inpaint to
   their nearest labeled lobe.
3. Recentres + uniform-scales the surface into the exact scene box the previous cortex occupied
   (so the app camera, subcortical placement and cinematic framing stay valid) and converts to
   the raw storage frame by inverting `canonicalOrientation()`. The RAS->scene map `(-x, z, y)`
   matches the subcortical bake's whole-brain L/R swap so both share one handedness.
4. **Cerebellum + brainstem** (the fsaverage pial is cerebral cortex only) are meshed from atlas
   volumes by `build_hindbrain()` -- marching-cubes -> Taubin smooth -> decimate, same pipeline as
   `bake_subcortical.py`. Both use ONE shared MNI->scene transform (AAL cerebrum bbox -> cortex
   scene box, map (-x,z,y)), so they land in true relative position and MEET (no gap between them).
   Cerebellum = union of the AAL cerebellar + vermis labels; brainstem = Harvard-Oxford Brain-Stem
   (label 8, a solid mid-brain/pons/medulla). The previous mesh only had a ~1.5k-vertex cerebellum
   blob and a separate stalk that did not connect.

Note: the *legibility* of a selected region (so a thin gyrus like motor/somato reads as a solid
colour field instead of dark-blue patches wherever the pial folds inward) is a shader concern,
handled by the selection tint in `src/components/brain/meshMaterial.ts`, not by this bake.
5. Faces are outward-oriented per component (verified: cortex signed volume > 0 => front-facing
   for three.js `FrontSide`), then area-weighted normals and a curvature-based crease (gyral
   crowns bright, sulci dark) are computed and written.

> **Why the rewrite:** the previous bake registered the atlas onto the artistic GLB mesh with a
> 7-DOF similarity fit + nearest-neighbor label transfer. Two differently-shaped brains cannot be
> fold-aligned by rotation+scale, so vertices grabbed labels off the wrong sulcal wall and the
> lobes came out scrambled (temporal splattered across the dorsal convexity, motor/somato broken
> into fragments). That approach is in git history. No lobe boundary here is an invented XYZ
> threshold, a planar cut, or a cross-mesh guess.

## Regenerating the asset

```bash
pip install nibabel nilearn scipy    # already present in backend/.venv
backend/.venv/bin/python tools/brain/bake_cortex.py   # rewrites public/brain/brain.bin (CBR2)
```

The fsaverage6/Destrieux data is fetched once into `~/nilearn_data` (from OSF/nitrc, the official
FreeSurfer distribution source) and cached for offline re-bakes. Switch `MESH = 'fsaverage6'` to
`'fsaverage5'` at the top of `bake_cortex.py` for a lighter (~1.2 MB vs ~4.7 MB) coarser asset.

# Interior brain bake (`public/brain/subcortical.bin`)

The deep-brain structures shown in the Explorer cutaway (thalamus, basal ganglia, hippocampus,
amygdala, lateral ventricles) are **real, MRI-derived surfaces**, not procedural blobs. They are
segmented from the **FSL Harvard-Oxford subcortical atlas** (maxprob, thr25, 1mm, MNI152 — a real
population MRI segmentation) and baked offline by `bake_subcortical.py` into a compact binary the
app streams at runtime (`loadSubcortical()` in `src/components/brain/brainModel.ts`).

The two great commissural white-matter landmarks (corpus callosum + fornix) are still built
procedurally in `src/components/brain/deepStructures.ts` as smooth anatomical sweeps, because
Harvard-Oxford has no white-matter tract labels.

## Regenerating the asset

```bash
# 1. tooling
pip install nibabel scikit-image trimesh scipy fast-simplification
#    (fast-simplification needs Python >= 3.10; on 3.9 add `from __future__ import annotations`
#     to its installed simplify.py)

# 2. atlas — download the FSL Harvard-Oxford bundle and drop the subcortical maxprob volume here
curl -L -o /tmp/HarvardOxford.tgz https://www.nitrc.org/frs/download.php/9902/HarvardOxford.tgz
mkdir -p tools/brain/data
tar xzf /tmp/HarvardOxford.tgz -C tools/brain/data --strip-components=3 \
    data/atlases/HarvardOxford/HarvardOxford-sub-maxprob-thr25-1mm.nii.gz

# 3. bake (from repo root) -> writes public/brain/subcortical.bin
python tools/brain/bake_subcortical.py
```

## How it works

1. **Segment** each label into a binary mask; Gaussian-soften the voxel staircase.
2. **Mesh** with marching cubes at 1 mm, `fix_normals` (outward winding), volume-preserving
   Taubin smoothing, then quadric-decimate to match the cortex's triangle density (~0.021 edge).
3. **Register** MNI mm → the app's oriented scene frame by fitting the atlas *cerebrum* bounding
   box onto the cortex mesh's cerebrum bounding box. The linear map `(-x, z, y)` is a proper
   rotation (det +1) so every structure keeps its true chirality (the C-shaped caudate, the
   seahorse hippocampus). Left/right are swapped as a whole, which is anatomically harmless.
4. **Write** `SUB1`: `'SUB1' | u32 partCount | per part { i32 id, u32 decorative, u32 vCount,
   u32 iCount, f32[vCount*3] positions, u32[iCount] indices }`.

## `SUB1` region ids (match `src/components/brain/regions.ts`)

| id | structure     | source labels (L/R)                         |
|----|---------------|---------------------------------------------|
| 12 | thalamus      | Thalamus                                    |
| 9  | basal ganglia | Caudate, Putamen, Pallidum, Accumbens       |
| 10 | hippocampus   | Hippocampus                                 |
| 11 | amygdala      | Amygdala                                    |
| 0  | decorative    | Lateral Ventricle (non-clickable)           |
