export interface CorticalLayer {
  key: string;
  roman: string;
  name: string;
  top: number;
  bottom: number;
  color: string;
  cells: string;
  role: string;
}

export const CORTICAL_LAYERS: CorticalLayer[] = [
  { key: 'I',    roman: 'I',    name: 'Molecular layer',        top: 0.00, bottom: 0.09, color: '#334768',
    cells: 'few neurons: dendritic tufts, horizontal axons, Cajal–Retzius cells',
    role: 'The apical tufts of deeper pyramidal cells fan out here and receive feedback and associative input.' },
  { key: 'II/III', roman: 'II/III', name: 'External granular + pyramidal', top: 0.09, bottom: 0.40, color: '#2f4a6b',
    cells: 'small & medium pyramidal neurons',
    role: 'Cortico-cortical wiring: the layers that connect to other cortical areas (the "thinking" connections).' },
  { key: 'IV',   roman: 'IV',   name: 'Internal granular layer', top: 0.40, bottom: 0.54, color: '#35507250',
    cells: 'densely packed stellate (granule) cells',
    role: 'The main input layer: thalamic relay axons arrive here first, then spread up and down the column.' },
  { key: 'V',    roman: 'V',    name: 'Internal pyramidal layer', top: 0.54, bottom: 0.78, color: '#2c4666',
    cells: 'large pyramidal neurons (Betz cells in motor cortex)',
    role: 'The cortex\'s output layer: large pyramidal cells project to the spinal cord, striatum, and brainstem.' },
  { key: 'VI',   roman: 'VI',   name: 'Multiform layer',        top: 0.78, bottom: 1.00, color: '#28405e',
    cells: 'fusiform (spindle) and modified pyramidal cells',
    role: 'Cortico-thalamic feedback: sends signals back down to the thalamus, closing the loop.' },
];

export interface CellType {
  key: string;
  label: string;
  color: string;
  kind: 'excitatory' | 'inhibitory' | 'glia' | 'vascular';
  role: string;
}

export const CELL_TYPES: CellType[] = [
  { key: 'pyramidal',   label: 'Pyramidal neuron',      color: '#7CC5FF', kind: 'excitatory',
    role: 'The main excitatory cell: triangular soma, one long apical dendrite, glutamate output.' },
  { key: 'interneuron', label: 'Inhibitory interneuron', color: '#FF6DA6', kind: 'inhibitory',
    role: 'A local GABA cell (for example, a basket cell) that silences its neighbours, which sharpens and times firing.' },
  { key: 'stellate',    label: 'Stellate cell',          color: '#9AE6FF', kind: 'excitatory',
    role: 'Star-shaped granule cell of layer IV: receives the thalamic input and spreads it locally.' },
  { key: 'astrocyte',   label: 'Astrocyte',              color: '#5EEAD4', kind: 'glia',
    role: 'Star-shaped glia: feeds neurons, recycles neurotransmitter, and wraps the capillaries.' },
  { key: 'oligodendrocyte', label: 'Oligodendrocyte',    color: '#C4B5FD', kind: 'glia',
    role: 'Wraps axons in myelin. One oligodendrocyte myelinates many axons at once (Schwann cells do this in the peripheral nervous system).' },
  { key: 'microglia',   label: 'Microglia',              color: '#A3E635', kind: 'glia',
    role: 'The brain\'s immune cell: constantly patrols, prunes weak synapses, and clears debris.' },
  { key: 'capillary',   label: 'Capillary',              color: '#FB7185', kind: 'vascular',
    role: 'Blood vessel: astrocyte endfeet form the blood-brain barrier around it.' },
];

export const CELL_BY_KEY: Record<string, CellType> = Object.fromEntries(CELL_TYPES.map(c => [c.key, c]));

export interface Transmitter {
  key: string;
  label: string;
  color: string;
  sign: 'excitatory' | 'inhibitory' | 'modulatory';
  receptor: string;
  note: string;
}

export const TRANSMITTERS: Transmitter[] = [
  { key: 'glutamate', label: 'Glutamate', color: '#7CF5C6', sign: 'excitatory', receptor: 'AMPA / NMDA',
    note: 'The brain\'s main excitatory ("go") signal. NMDA receptors are the coincidence detectors that trigger long-term potentiation, which is the molecular basis of practice.' },
  { key: 'gaba',      label: 'GABA',      color: '#FBBF24', sign: 'inhibitory', receptor: 'GABA-A / GABA-B',
    note: 'The main inhibitory ("stop") signal, released by interneurons to suppress and time neighbouring cells.' },
  { key: 'dopamine',  label: 'Dopamine',  color: '#00D4FF', sign: 'modulatory', receptor: 'D1 / D2',
    note: 'A reward-prediction signal from the midbrain that gates which synapses get strengthened when you do something correctly.' },
  { key: 'acetylcholine', label: 'Acetylcholine', color: '#C084FC', sign: 'modulatory', receptor: 'nicotinic / muscarinic',
    note: 'Raised during focused attention. It increases the level of plasticity, so attentive practice changes the brain more.' },
];

export const TRANSMITTER_BY_KEY: Record<string, Transmitter> = Object.fromEntries(TRANSMITTERS.map(t => [t.key, t]));

export interface NeuronPart {
  key: string;
  label: string;
  group: 'dendrite' | 'soma' | 'organelle' | 'axon' | 'synapse';
  note: string;
}

export const NEURON_PARTS: NeuronPart[] = [
  { key: 'apical',   label: 'Apical dendrite',   group: 'dendrite', note: 'The single long dendrite reaching toward the surface, collecting distant and associative input.' },
  { key: 'basal',    label: 'Basal dendrites',   group: 'dendrite', note: 'The spray of shorter dendrites around the soma, gathering local input.' },
  { key: 'spines',   label: 'Dendritic spines',  group: 'dendrite', note: 'Tiny mushroom-shaped bumps where excitatory synapses land. They grow and stabilize with learning.' },
  { key: 'soma',     label: 'Soma (cell body)',  group: 'soma',     note: 'Integrates all incoming signals. If they sum past threshold, an action potential fires.' },
  { key: 'nucleus',  label: 'Nucleus',           group: 'organelle', note: 'Holds the DNA. Transcription here builds the proteins that plasticity depends on.' },
  { key: 'nucleolus',label: 'Nucleolus',         group: 'organelle', note: 'Dense sub-nuclear body that manufactures ribosomes.' },
  { key: 'nissl',    label: 'Rough ER (Nissl bodies)', group: 'organelle', note: 'Ribosome-studded endoplasmic reticulum: the protein factories that stain as Nissl substance.' },
  { key: 'golgi',    label: 'Golgi apparatus',   group: 'organelle', note: 'Packages proteins into vesicles and ships them out to the dendrites and axon.' },
  { key: 'mito',     label: 'Mitochondria',      group: 'organelle', note: 'Make the ATP that powers the ion pumps. They are dense at the terminals, which use the most energy.' },
  { key: 'hillock',  label: 'Axon hillock',      group: 'axon',     note: 'The trigger zone, where summed input is compared to threshold and the spike is generated.' },
  { key: 'initial',  label: 'Initial segment',   group: 'axon',     note: 'The first stretch of axon, packed with voltage-gated Na⁺ channels. This is the point at which a spike becomes committed.' },
  { key: 'axon',     label: 'Axon',              group: 'axon',     note: 'The output cable that carries the action potential to the terminals. It can be up to a metre long.' },
  { key: 'myelin',   label: 'Myelin sheath',     group: 'axon',     note: 'Fatty insulation wrapped by glia. It makes conduction much faster and more energy-efficient.' },
  { key: 'node',     label: 'Nodes of Ranvier',  group: 'axon',     note: 'Bare gaps between myelin where the spike regenerates. It jumps gap to gap (saltatory conduction).' },
  { key: 'glia',     label: 'Oligodendrocyte',   group: 'axon',     note: 'The glial cell that wraps the myelin (a Schwann cell does the same job outside the brain).' },
  { key: 'terminal', label: 'Axon terminals',    group: 'synapse',  note: 'The boutons where the spike triggers neurotransmitter release onto the next cell.' },
];
