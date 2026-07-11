# Cortical surface asset (drop your brain here)

The "Watch your brain learn" journey will use a **real cortical surface mesh** if you provide one here.
Without it, the journey falls back to a procedurally-generated gyrified brain.

## What to add

Put a single file named **`brain.glb`** (glTF binary) in this folder:

```
public/models/brain.glb
```

That's it — no config needed. (If you want a different filename, add
`public/models/manifest.json` → `{ "brain": "your-file.glb" }`.)

## Requirements / tips

- **Format:** `.glb` (binary glTF). Export from Blender, or convert an `.obj`/`.stl`/FreeSurfer
  surface (`lh.pial` / `rh.pial`) with Blender or `obj2gltf`.
- **Content:** the journey uses the **largest mesh** in the file as the cortex, so a single merged
  pial-surface mesh is ideal. Gyri/sulci detail comes from the mesh itself — the higher the poly
  count, the more realistic the folds (100k–1M triangles is fine for desktop).
- **Orientation/scale don't matter** — the loader auto-centres the mesh and scales it to fit. It also
  recomputes normals, so an un-normalised export still shades correctly.
- **Where to get one (free / open):**
  - A FreeSurfer `pial` surface from any subject (convert to glB).
  - The BrainWeb / Allen / open MRI-derived cortical surfaces.
  - Any anatomically-correct brain GLB from a model library you have rights to use.

Once `brain.glb` is present, reload the page — the opening of the journey renders your real cortex.
