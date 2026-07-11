# Neuron morphologies (drop real reconstructions here)

The journey renders **real reconstructed neurons** — actual dendritic trees with hundreds of branches
— if you provide SWC files here. Without them it falls back to procedurally-grown neurons.

## What to add

Put one or more **`.swc`** files in this folder. Easiest: name your main cell **`hero.swc`**:

```
public/neurons/hero.swc
```

For several neurons (recommended — the hero cell plus a few for the dense neuropil), add a manifest:

```
public/neurons/manifest.json
{ "files": ["hero.swc", "interneuron.swc", "pyramidal2.swc"] }
```

## Where to get them (free)

**[NeuroMorpho.org](https://neuromorpho.org)** — the standard archive of reconstructed neurons.
Search e.g. "pyramidal neuron, mouse, motor cortex", download the **Standardized SWC**. Good picks:

- a **layer-5 pyramidal cell** (big apical dendrite → the hero neuron)
- a **basket / interneuron** (adds variety to the neuropil)
- a couple more cortical cells for background density

## Format notes

Standard SWC — one sample per line: `id type x y z radius parent`, with
`type`: 1 = soma, 2 = axon, 3 = basal dendrite, 4 = apical dendrite. Comments start with `#`.
The loader handles coordinates in microns, auto-centres and scales each cell, tapers the tubes by the
real per-sample radius, and studs dendritic spines along the arbor. Units/orientation don't need fixing.

Reload the page after adding files — the neuropil and hero-neuron stages render your real cells.
