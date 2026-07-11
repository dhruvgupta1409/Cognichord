export interface RegionDef {
  id: number;
  key: string;
  name: string;
  color: string;
  group: 'cortex' | 'cerebellum' | 'brainstem' | 'deep';
}

export const REGIONS: RegionDef[] = [
  { id: 1,  key: 'frontal',       name: 'Frontal Lobe',            color: '#8B5CF6', group: 'cortex' },
  { id: 2,  key: 'motor',         name: 'Motor Cortex',            color: '#FF2D78', group: 'cortex' },
  { id: 3,  key: 'somatosensory', name: 'Somatosensory Cortex',    color: '#22D3EE', group: 'cortex' },
  { id: 4,  key: 'parietal',      name: 'Parietal Lobe',           color: '#10B981', group: 'cortex' },
  { id: 5,  key: 'temporal',      name: 'Temporal Lobe (Auditory)',color: '#00D4FF', group: 'cortex' },
  { id: 6,  key: 'occipital',     name: 'Occipital Lobe',          color: '#F59E0B', group: 'cortex' },
  { id: 7,  key: 'cerebellum',    name: 'Cerebellum',              color: '#A78BFA', group: 'cerebellum' },
  { id: 8,  key: 'brainstem',     name: 'Brainstem',               color: '#FBBF24', group: 'brainstem' },
  { id: 9,  key: 'basal-ganglia', name: 'Basal Ganglia',           color: '#34D399', group: 'deep' },
  { id: 10, key: 'hippocampus',   name: 'Hippocampus',             color: '#FCD34D', group: 'deep' },
  { id: 11, key: 'amygdala',      name: 'Amygdala',                color: '#FB7185', group: 'deep' },
  { id: 12, key: 'thalamus',      name: 'Thalamus',                color: '#C4B5FD', group: 'deep' },
];

export const REGION_BY_ID: Record<number, RegionDef> = Object.fromEntries(REGIONS.map(r => [r.id, r]));
export const REGION_BY_KEY: Record<string, RegionDef> = Object.fromEntries(REGIONS.map(r => [r.key, r]));

export function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}
