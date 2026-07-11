"""
Bake the cortical parcellation onto public/brain/brain.bin from the REAL fsaverage6 cortical
surface with its NATIVE Destrieux (aparc.a2009s) per-vertex labels.

Why this and not the previous version (in git history)
------------------------------------------------------
The prior bake registered the Destrieux atlas onto the app's artistic GLB brain mesh with a
7-DOF similarity transform (rotation + uniform scale + translation) and transferred labels by
3D nearest-neighbour. Two differently-shaped brains cannot be fold-aligned by rotation+scale,
so a smooth outer-shell vertex would grab a label off the wrong sulcal wall -> the lobes came
out scrambled (temporal splattered across the dorsal convexity, motor/somato broken into
confetti). No amount of smoothing recovers a per-vertex field that is already ~30% wrong
inside a region.

This version does ZERO registration. It renders the fsaverage6 pial surface itself, on which
the Destrieux label is DEFINED per vertex (1:1, exact). Lobe boundaries therefore follow the
true central sulcus / lateral (sylvian) fissure by construction. The only fitting is a rigid
recentre + uniform scale so the surface occupies the SAME scene box the old cortex did (keeps
the app's camera, subcortical placement and cinematic framing valid). Cerebellum + brainstem
are carried over unchanged from the previous brain.bin -- they were already correct (they are
separate inferior masses, trivial to label; fsaverage pial is cerebral cortex only).

Pipeline
--------
1. fsaverage6 pial L/R  + native Destrieux labels (resampled fs5->fs6 by nearest-neighbour on
   the registered sphere -- the same operation FreeSurfer's mri_surf2surf performs between
   icosahedron orders).
2. 75-way Destrieux parcels -> 4 lobes via LOBE_OF (textbook lobar convention); precentral /
   postcentral gyri carved out as MOTOR / SOMATO. Medial-wall / paracentral straddle vertices
   are inpainted to their nearest labelled lobe.
3. Recentre + uniform-scale into the old cortex's scene box; convert to the app's raw storage
   frame by inverting canonicalOrientation() so the app renders it in the intended pose.
4. Append cerebellum + brainstem verts/faces from the previous brain.bin unchanged.
5. Outward-orient faces per component, compute area-weighted normals and a curvature-based
   crease (gyral crowns bright, sulci dark), write CBR2.

Run (repo root): backend/.venv/bin/python tools/brain/bake_cortex.py
"""
import os, struct
import numpy as np
import nibabel as nib
from scipy.spatial import cKDTree
from scipy.sparse import coo_matrix
from scipy.ndimage import gaussian_filter
from skimage import measure
import trimesh
import trimesh.repair as _repair
import trimesh.smoothing as _smoothing
import fast_simplification as _fs
from nilearn import datasets

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
BRAIN_BIN = os.path.join(REPO, 'public/brain/brain.bin')
HARVARD_OXFORD = os.path.join(HERE, 'data/HarvardOxford-sub-maxprob-thr25-1mm.nii.gz')  # for the brainstem (label 8)
MESH = 'fsaverage6'          # 40962 verts/hemi; switch to 'fsaverage5' (10242) for a lighter asset
PITCH = 0.12                 # must match canonicalOrientation() in src/components/brain/brainModel.ts

FRONTAL, MOTOR, SOMATO, PARIETAL, TEMPORAL, OCCIPITAL, CEREBELLUM, BRAINSTEM = 1, 2, 3, 4, 5, 6, 7, 8

# Standard lobar grouping of the Destrieux atlas. Boundary sulci go to the lobe of the gyrus
# they border. Insula folds into temporal (its nearest lateral neighbour). G_precentral /
# G_postcentral carry their parent lobe here; step "carve" retags them MOTOR / SOMATO.
# G_and_S_paracentral straddles the central sulcus and is deliberately LEFT OUT -> it inpaints
# to its nearest frontal/parietal neighbour, splitting it the natural anatomical way.
LOBE_OF = {
    'G_and_S_frontomargin': FRONTAL, 'G_and_S_subcentral': FRONTAL, 'G_and_S_transv_frontopol': FRONTAL,
    'G_and_S_cingul-Ant': FRONTAL, 'G_and_S_cingul-Mid-Ant': FRONTAL,
    'G_front_inf-Opercular': FRONTAL, 'G_front_inf-Orbital': FRONTAL, 'G_front_inf-Triangul': FRONTAL,
    'G_front_middle': FRONTAL, 'G_front_sup': FRONTAL, 'G_orbital': FRONTAL, 'G_rectus': FRONTAL,
    'G_subcallosal': FRONTAL, 'G_precentral': FRONTAL,
    'Lat_Fis-ant-Horizont': FRONTAL, 'Lat_Fis-ant-Vertical': FRONTAL,
    'S_front_inf': FRONTAL, 'S_front_middle': FRONTAL, 'S_front_sup': FRONTAL,
    'S_orbital_lateral': FRONTAL, 'S_orbital_med-olfact': FRONTAL, 'S_orbital-H_Shaped': FRONTAL,
    'S_pericallosal': FRONTAL, 'S_suborbital': FRONTAL, 'S_precentral-inf-part': FRONTAL,
    'S_precentral-sup-part': FRONTAL, 'S_central': FRONTAL,

    'G_and_S_cingul-Mid-Post': PARIETAL, 'G_cingul-Post-dorsal': PARIETAL, 'G_cingul-Post-ventral': PARIETAL,
    'G_pariet_inf-Angular': PARIETAL, 'G_pariet_inf-Supramar': PARIETAL, 'G_parietal_sup': PARIETAL,
    'G_precuneus': PARIETAL, 'G_postcentral': PARIETAL,
    'Lat_Fis-post': PARIETAL,
    'S_cingul-Marginalis': PARIETAL, 'S_interm_prim-Jensen': PARIETAL,
    'S_intrapariet_and_P_trans': PARIETAL, 'S_subparietal': PARIETAL, 'S_postcentral': PARIETAL,

    'G_Ins_lg_and_S_cent_ins': TEMPORAL, 'G_insular_short': TEMPORAL,
    'G_oc-temp_lat-fusifor': TEMPORAL, 'G_oc-temp_med-Parahip': TEMPORAL,
    'G_temp_sup-G_T_transv': TEMPORAL, 'G_temp_sup-Lateral': TEMPORAL,
    'G_temp_sup-Plan_polar': TEMPORAL, 'G_temp_sup-Plan_tempo': TEMPORAL,
    'G_temporal_inf': TEMPORAL, 'G_temporal_middle': TEMPORAL, 'Pole_temporal': TEMPORAL,
    'S_circular_insula_ant': TEMPORAL, 'S_circular_insula_inf': TEMPORAL, 'S_circular_insula_sup': TEMPORAL,
    'S_collat_transv_ant': TEMPORAL, 'S_oc-temp_lat': TEMPORAL, 'S_temporal_inf': TEMPORAL,
    'S_temporal_sup': TEMPORAL, 'S_temporal_transverse': TEMPORAL,

    'G_and_S_occipital_inf': OCCIPITAL, 'G_cuneus': OCCIPITAL, 'G_occipital_middle': OCCIPITAL,
    'G_occipital_sup': OCCIPITAL, 'G_oc-temp_med-Lingual': OCCIPITAL, 'Pole_occipital': OCCIPITAL,
    'S_calcarine': OCCIPITAL, 'S_collat_transv_post': OCCIPITAL, 'S_oc_middle_and_Lunatus': OCCIPITAL,
    'S_oc_sup_and_transversal': OCCIPITAL, 'S_occipital_ant': OCCIPITAL,
    'S_oc-temp_med_and_Lingual': OCCIPITAL, 'S_parieto_occipital': OCCIPITAL,
}
CARVE = {'G_precentral': MOTOR, 'G_postcentral': SOMATO}


def log(*a): print(*a, flush=True)


def canonical_matrix():
    """The 3x3 of canonicalOrientation() = rotateX(PITCH) @ permute, matching brainModel.ts."""
    permute = np.array([[0, -1, 0], [0, 0, 1], [-1, 0, 0]], float)
    c, s = np.cos(PITCH), np.sin(PITCH)
    pitch = np.array([[1, 0, 0], [0, c, -s], [0, s, c]], float)
    return pitch @ permute


def vertex_normals(V, F):
    n = np.zeros_like(V)
    tri = V[F]
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])   # area-weighted
    for k in range(3):
        np.add.at(n, F[:, k], fn)
    ln = np.linalg.norm(n, axis=1, keepdims=True); ln[ln == 0] = 1
    return n / ln


def ensure_outward(V, F):
    """Flip winding so face normals point away from the component centroid (front-face render)."""
    tri = V[F]
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    fc = tri.mean(1)
    s = np.einsum('ij,ij->i', fn, fc - V.mean(0)).sum()
    if s < 0:
        F = F[:, [0, 2, 1]].copy()
    return F


def curvature_crease(V, F, normals):
    """Discrete mean-curvature proxy: protrusion of each vertex past its neighbour average,
    measured along the normal. Gyral crowns (convex) -> ~1 bright; sulcal fundi -> ~0 dark."""
    n = len(V)
    e0 = np.concatenate([F[:, 0], F[:, 1], F[:, 2], F[:, 1], F[:, 2], F[:, 0]])
    e1 = np.concatenate([F[:, 1], F[:, 2], F[:, 0], F[:, 0], F[:, 1], F[:, 2]])
    A = coo_matrix((np.ones(len(e0)), (e0, e1)), shape=(n, n)).tocsr()
    A.data[:] = 1.0
    deg = np.asarray(A.sum(1)).ravel(); deg[deg == 0] = 1
    mean_nb = np.asarray(A @ V) / deg[:, None]
    d = np.einsum('ij,ij->i', V - mean_nb, normals)
    lo, hi = np.percentile(d, [4, 96])
    cr = np.clip((d - lo) / (hi - lo + 1e-9), 0, 1)
    return (0.20 + 0.80 * cr).astype(np.float32)


def build_hindbrain(cortex_min, cortex_max, Minv):
    """Real cerebellum + brainstem, meshed from atlas volumes (the previous brain.bin only had a
    ~1.5k-vertex cerebellum blob + a disconnected stalk). Both are placed by ONE shared MNI->scene
    transform (fit the AAL cerebrum bbox onto the cortex scene box, map (-x,z,y), same convention
    as bake_subcortical.py), so the brainstem and cerebellum land in their true relative positions
    and MEET. Cerebellum = union of AAL cerebellar+vermis labels; brainstem = Harvard-Oxford
    Brain-Stem (label 8, a solid mid-brain/pons/medulla, not the old thin tube)."""
    aal = datasets.fetch_atlas_aal()
    img = nib.load(aal['maps']); vol = np.asarray(img.dataobj)
    vals, names = [int(i) for i in aal['indices']], list(aal['labels'])
    cb_vals = [v for v, nm in zip(vals, names) if 'Cerebel' in nm or 'Vermis' in nm]
    cerebrum_vals = [v for v, nm in zip(vals, names) if not ('Cerebel' in nm or 'Vermis' in nm)]
    map_lin = lambda P: np.c_[-P[:, 0], P[:, 2], P[:, 1]]        # MNI -> scene axes
    aff = img.affine
    atl = map_lin(np.argwhere(np.isin(vol, cerebrum_vals)) @ aff[:3, :3].T + aff[:3, 3])
    amin, amax = atl.min(0), atl.max(0)
    amid, cmid = (amin + amax) / 2, (cortex_min + cortex_max) / 2
    scale = (cortex_max - cortex_min) / (amax - amin)
    mm_to_scene = lambda P: (map_lin(P) - amid) * scale + cmid

    def mesh_mask(vol_, keep_vals, aff_, rid, taubin=14, cap=11000):
        mask = np.isin(vol_, keep_vals); idx = np.argwhere(mask)
        lo = np.maximum(idx.min(0) - 3, 0); hi = np.minimum(idx.max(0) + 4, vol_.shape)
        sub = mask[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]].astype(np.float32)
        sub = gaussian_filter(sub, sigma=0.7)
        v, f, _, _ = measure.marching_cubes(sub, level=0.5, step_size=1)
        mm = (v + lo) @ aff_[:3, :3].T + aff_[:3, 3]
        m = trimesh.Trimesh(vertices=mm_to_scene(mm), faces=f, process=True)
        _repair.fix_normals(m); _smoothing.filter_taubin(m, lamb=0.5, nu=0.53, iterations=taubin)
        tgt = min(len(m.faces), cap)
        if len(m.faces) > tgt:
            v2, f2 = _fs.simplify(np.asarray(m.vertices, np.float32),
                                  np.asarray(m.faces, np.int32), target_count=tgt)
            m = trimesh.Trimesh(vertices=v2, faces=f2, process=True)
            _repair.fix_normals(m); _smoothing.filter_taubin(m, lamb=0.5, nu=0.53, iterations=4)
        raw = np.asarray(m.vertices, np.float64) @ Minv.T       # scene -> raw storage frame
        return raw, ensure_outward(raw, np.asarray(m.faces, np.int64)), np.full(len(raw), rid, np.int32)

    cb = mesh_mask(vol, cb_vals, aff, CEREBELLUM)
    ho = nib.load(HARVARD_OXFORD)
    bs = mesh_mask(np.asarray(ho.dataobj), [8], ho.affine, BRAINSTEM, taubin=10, cap=4000)
    return cb, bs


# --------------------------------------------------------------------------- previous mesh
buf = open(BRAIN_BIN, 'rb').read()
assert buf[:4] == b'CBR2', buf[:4]
vC, iC = struct.unpack_from('<II', buf, 4); o = 12
old_pos = np.frombuffer(buf, '<f4', vC * 3, o).reshape(-1, 3).astype(np.float64); o += vC * 3 * 4
o += vC * 3 * 4            # normals (discarded)
o += vC * 4               # crease (discarded)
old_reg = np.frombuffer(buf, '<i4', vC, o).copy(); o += vC * 4
old_idx = np.frombuffer(buf, '<u4', iC, o).reshape(-1, 3)
log(f'Previous brain.bin: {vC} verts, {len(old_idx)} tris')

# --------------------------------------------------------------------------- fsaverage + atlas
log(f'\nLoading {MESH} pial + native Destrieux labels (offline cache if present)...')
fs = datasets.fetch_surf_fsaverage(mesh=MESH)
fs5 = datasets.fetch_surf_fsaverage(mesh='fsaverage5')
des = datasets.fetch_atlas_surf_destrieux()
lut = [n.decode() if isinstance(n, bytes) else n for n in des['labels']]
dmap5 = {'left': np.asarray(des['map_left']), 'right': np.asarray(des['map_right'])}

verts, faces, names = [], [], []
voff = 0
for h in ('left', 'right'):
    g = nib.load(fs[f'pial_{h}'])
    v = g.darrays[0].data.astype(np.float64)
    f = g.darrays[1].data.astype(np.int64) + voff
    sph_hi = nib.load(fs[f'sphere_{h}']).darrays[0].data.astype(np.float64)
    sph_lo = nib.load(fs5[f'sphere_{h}']).darrays[0].data.astype(np.float64)
    _, nn = cKDTree(sph_lo).query(sph_hi)                 # resample fs5 labels -> this mesh
    nm = np.array([lut[i] for i in dmap5[h][nn]])
    verts.append(v); faces.append(f); names.append(nm); voff += len(v)
V_fs = np.vstack(verts); F_fs = np.vstack(faces).astype(np.int64); names = np.concatenate(names)
log(f'  {len(V_fs)} cortex verts, {len(F_fs)} tris; {len(set(names))} distinct Destrieux parcels')

# parcels -> lobes, carve motor/somato, inpaint the rest (medial wall / paracentral straddle)
lobe = np.zeros(len(V_fs), np.int32)
for i, nm in enumerate(names):
    lobe[i] = LOBE_OF.get(nm, 0)
for nm, lid in CARVE.items():
    lobe[names == nm] = lid
n_unres0 = int((lobe == 0).sum())
if n_unres0:
    # GEODESIC inpaint: flood each lobe outward along the SURFACE (multi-source BFS over mesh
    # edges) into the medial wall. Euclidean-nearest was wrong here -- it jumped the corpus-
    # callosum gap and stretched frontal posteriorly along the medial wall ("frontal too long").
    from collections import deque
    adjw = [[] for _ in range(len(V_fs))]
    for a, b, c in F_fs:
        adjw[a] += [b, c]; adjw[b] += [a, c]; adjw[c] += [a, b]
    q = deque(int(v) for v in np.where(lobe != 0)[0])
    while q:
        v = q.popleft()
        for nb in adjw[v]:
            if lobe[nb] == 0:
                lobe[nb] = lobe[v]; q.append(nb)
    still = lobe == 0                       # any island with no labelled neighbour at all
    if still.any():
        lab = np.where(~still)[0]
        _, nn = cKDTree(V_fs[lab]).query(V_fs[still])
        lobe[still] = lobe[lab[nn]]
    log(f'  geodesic-inpainted {n_unres0} medial-wall/straddle verts along the surface')

# --------------------------------------------------------------------------- fit into old scene box
M = canonical_matrix(); Minv = M.T
old_cortex = old_pos[np.isin(old_reg, [FRONTAL, MOTOR, SOMATO, PARIETAL, TEMPORAL, OCCIPITAL])]
old_scene = old_cortex @ M.T                               # old cortex in scene space
Cold, Hold = old_scene.mean(0), (old_scene.max(0) - old_scene.min(0)) / 2
# fsaverage RAS -> scene: (x,y,z)_RAS -> (-x, z, y) == (lat, sup, ant). The -x matches the
# subcortical bake's identical whole-brain L/R swap (tools/brain/bake_subcortical.py) so cortex
# and the deep structures share one handedness in the cutaway view.
scene_fs = V_fs[:, [0, 2, 1]] * np.array([-1.0, 1.0, 1.0])
Cfs, Hfs = scene_fs.mean(0), (scene_fs.max(0) - scene_fs.min(0)) / 2
s_fit = float(np.mean(Hold / Hfs))                         # uniform scale, no distortion
scene_target = (scene_fs - Cfs) * s_fit + Cold
raw_cortex = scene_target @ Minv.T                         # back into app raw storage frame
F_fs = ensure_outward(raw_cortex, F_fs)
log(f'  fit cortex into old scene box: scale={s_fit:.4f}, center={Cold.round(3).tolist()}')

# --------------------------------------------------------------------------- hindbrain (cerebellum + brainstem, real)
(V_cb, F_cb, R_cb), (V_bs, F_bs, R_bs) = build_hindbrain(Cold - Hold, Cold + Hold, Minv)
log(f'  built real cerebellum ({len(V_cb)}v/{len(F_cb)}t) + brainstem ({len(V_bs)}v/{len(F_bs)}t), '
    f'shared MNI->scene fit so they connect')

# --------------------------------------------------------------------------- assemble + attributes
V = np.vstack([raw_cortex, V_bs, V_cb])
F = np.vstack([F_fs,
               F_bs + len(raw_cortex),
               F_cb + len(raw_cortex) + len(V_bs)]).astype(np.uint32)
region = np.concatenate([lobe, R_bs, R_cb]).astype(np.int32)
normals = vertex_normals(V, F)
crease = curvature_crease(V, F, normals)

log('\nFinal region counts:')
for rid, nm in [(FRONTAL, 'frontal'), (MOTOR, 'motor'), (SOMATO, 'somato'), (PARIETAL, 'parietal'),
                (TEMPORAL, 'temporal'), (OCCIPITAL, 'occipital'), (CEREBELLUM, 'cerebellum'),
                (BRAINSTEM, 'brainstem')]:
    log(f'  {nm:11s} {int((region == rid).sum())}')

# anatomy self-check in scene space (anterior=+z, superior=+y, from canonical transform)
scene = V @ M.T
def cz(r): return scene[region == r][:, 2].mean()
def cy(r): return scene[region == r][:, 1].mean()
log('\nAnatomy self-check:')
log(f"  frontal anterior > occipital : {cz(FRONTAL):+.3f} > {cz(OCCIPITAL):+.3f}  "
    f"{'OK' if cz(FRONTAL) > cz(OCCIPITAL) else 'FAIL'}")
log(f"  temporal inferior to parietal: {cy(TEMPORAL):+.3f} < {cy(PARIETAL):+.3f}  "
    f"{'OK' if cy(TEMPORAL) < cy(PARIETAL) else 'FAIL'}")
log(f"  motor anterior to somato     : {cz(MOTOR):+.3f} > {cz(SOMATO):+.3f}  "
    f"{'OK' if cz(MOTOR) > cz(SOMATO) else 'FAIL'}")

# --------------------------------------------------------------------------- write CBR2
vCount, iCount = len(V), F.size
with open(BRAIN_BIN, 'wb') as fp:
    fp.write(b'CBR2')
    fp.write(struct.pack('<II', vCount, iCount))
    fp.write(V.astype('<f4').tobytes())
    fp.write(normals.astype('<f4').tobytes())
    fp.write(crease.astype('<f4').tobytes())
    fp.write(region.astype('<i4').tobytes())
    fp.write(F.reshape(-1).astype('<u4').tobytes())
log(f'\nWROTE {BRAIN_BIN}: {vCount} verts, {iCount // 3} tris, {os.path.getsize(BRAIN_BIN)} bytes')
