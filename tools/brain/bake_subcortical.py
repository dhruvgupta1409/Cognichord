import numpy as np, nibabel as nib, struct, math, os
from scipy.ndimage import gaussian_filter
from skimage import measure
import trimesh, trimesh.smoothing as smoothing, trimesh.repair as repair
import fast_simplification as fs

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
ATLAS = os.path.join(HERE, 'data/HarvardOxford-sub-maxprob-thr25-1mm.nii.gz')
BRAIN = os.path.join(REPO, 'public/brain/brain.bin')
OUT   = os.path.join(REPO, 'public/brain/subcortical.bin')

TARGET_EDGE = 0.021
TRI_AREA    = 0.4330127 * TARGET_EDGE**2
MIN_F, MAX_F = 500, 4200

STRUCTS = [
    (4,  12, False, 'thalamus-L'),   (15, 12, False, 'thalamus-R'),
    (5,  9,  False, 'caudate-L'),    (16, 9,  False, 'caudate-R'),
    (6,  9,  False, 'putamen-L'),    (17, 9,  False, 'putamen-R'),
    (7,  9,  False, 'pallidum-L'),   (18, 9,  False, 'pallidum-R'),
    (11, 9,  False, 'accumbens-L'),  (21, 9,  False, 'accumbens-R'),
    (9,  10, False, 'hippocampus-L'),(19, 10, False, 'hippocampus-R'),
    (10, 11, False, 'amygdala-L'),   (20, 11, False, 'amygdala-R'),
    (3,  0,  True,  'latvent-L'),    (14, 0,  True,  'latvent-R'),
]

img = nib.load(ATLAS); vol = np.asarray(img.dataobj); aff = img.affine
A = aff[:3, :3]; b = aff[:3, 3]

def vox2mm(ijk):
    return ijk @ A.T + b
def map_lin(P):
    return np.c_[-P[:, 0], P[:, 2], P[:, 1]]

cvals = [v for v in np.unique(vol) if v not in (0, 8)]
cijk = np.argwhere(np.isin(vol, cvals))
atl0 = map_lin(vox2mm(cijk))
amin, amax = atl0.min(0), atl0.max(0); amid = (amin + amax) / 2

buf = open(BRAIN, 'rb').read()
vC = struct.unpack_from('<I', buf, 4)[0]
pos = np.frombuffer(buf, dtype='<f4', count=vC*3, offset=12).reshape(-1, 3).astype(np.float64)
permuted = np.c_[-pos[:, 1], pos[:, 2], -pos[:, 0]]
cph, sph = math.cos(0.12), math.sin(0.12)
Rx = np.array([[1, 0, 0], [0, cph, -sph], [0, sph, cph]])
scene = permuted @ Rx.T
def classify(x, y, z):
    lat = abs(x)
    if y < -0.34 and lat < 0.24: return 8
    if z < -0.08 and y < 0.02:   return 7
    if y < -0.20 and z < 0.15:   return 7
    return 1
reg = np.array([classify(*p) for p in scene])
cer = scene[reg == 1]
cmin, cmax = cer.min(0), cer.max(0); cmid = (cmin + cmax) / 2
scale = (cmax - cmin) / (amax - amin)
print('fit: scale', np.round(scale, 5), 'atlas-mid', np.round(amid, 1), 'cortex-mid', np.round(cmid, 3))

def mm_to_scene(P):
    return (map_lin(P) - amid) * scale + cmid

def build_mesh(value):
    mask = (vol == value)
    if mask.sum() == 0: return None
    idx = np.argwhere(mask)
    lo = idx.min(0) - 3; hi = idx.max(0) + 4
    lo = np.maximum(lo, 0); hi = np.minimum(hi, np.array(vol.shape))
    sub = mask[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]].astype(np.float32)
    sub = gaussian_filter(sub, sigma=0.65)
    verts, faces, _, _ = measure.marching_cubes(sub, level=0.5, step_size=1)
    verts = verts + lo
    v_scene = mm_to_scene(vox2mm(verts))
    m = trimesh.Trimesh(vertices=v_scene, faces=faces, process=True)
    repair.fix_normals(m)
    smoothing.filter_taubin(m, lamb=0.5, nu=0.53, iterations=12)
    tgt = int(np.clip(round(m.area / TRI_AREA), MIN_F, MAX_F))
    if len(m.faces) > tgt:
        v2, f2 = fs.simplify(np.asarray(m.vertices, np.float32),
                             np.asarray(m.faces, np.int32), target_count=tgt)
        m = trimesh.Trimesh(vertices=v2, faces=f2, process=True)
        repair.fix_normals(m)
        smoothing.filter_taubin(m, lamb=0.5, nu=0.53, iterations=4)
    return m

parts = []
for value, rid, deco, name in STRUCTS:
    m = build_mesh(value)
    if m is None:
        print(f'  !! {name}: empty'); continue
    v = np.asarray(m.vertices, np.float32); f = np.asarray(m.faces, np.uint32)
    e = np.concatenate([np.linalg.norm(v[f[:,0]]-v[f[:,1]],axis=1),
                        np.linalg.norm(v[f[:,1]]-v[f[:,2]],axis=1),
                        np.linalg.norm(v[f[:,2]]-v[f[:,0]],axis=1)])
    c = (v.min(0)+v.max(0))/2
    parts.append((rid, deco, v, f))
    print(f'  {name:15s} id{rid:2d} deco{int(deco)} tris={len(f):5d} verts={len(v):5d} '
          f'edge={e.mean():.4f} center=({c[0]:6.3f},{c[1]:6.3f},{c[2]:6.3f})')

with open(OUT, 'wb') as fh:
    fh.write(b'SUB1'); fh.write(struct.pack('<I', len(parts)))
    for rid, deco, v, f in parts:
        fh.write(struct.pack('<iIII', rid, 1 if deco else 0, len(v), f.size))
        fh.write(v.tobytes()); fh.write(f.astype('<u4').tobytes())
tot_t = sum(len(f) for _,_,_,f in parts)
print(f'\nWROTE {OUT}  parts={len(parts)} totalTris={tot_t} bytes={os.path.getsize(OUT)}')
