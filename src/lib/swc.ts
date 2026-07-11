import * as THREE from 'three';

export type NeuriteType = 'soma' | 'axon' | 'basal' | 'apical' | 'dendrite' | 'other';

export interface SwcSample { id: number; type: number; pos: THREE.Vector3; r: number; parent: number; }

export interface Branch {
  type: NeuriteType;
  points: THREE.Vector3[];
  radii: number[];
  order: number;
}

export interface Morphology {
  branches: Branch[];
  soma: { pos: THREE.Vector3; r: number };
  somaSamples: SwcSample[];
  center: THREE.Vector3;
  radius: number;
  counts: { total: number; branches: number; dendrite: number; axon: number };
}

function typeOf(t: number): NeuriteType {
  switch (t) {
    case 1: return 'soma';
    case 2: return 'axon';
    case 3: return 'basal';
    case 4: return 'apical';
    default: return t === 0 ? 'other' : 'dendrite';
  }
}

export function parseSWC(text: string): SwcSample[] {
  const out: SwcSample[] = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line[0] === '#') continue;
    const p = line.split(/\s+/);
    if (p.length < 7) continue;
    const id = parseInt(p[0], 10);
    const type = parseInt(p[1], 10);
    const x = parseFloat(p[2]), y = parseFloat(p[3]), z = parseFloat(p[4]);
    const r = parseFloat(p[5]);
    const parent = parseInt(p[6], 10);
    if (!Number.isFinite(id) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    out.push({ id, type, pos: new THREE.Vector3(x, y, z), r: Number.isFinite(r) ? r : 0.5, parent });
  }
  return out;
}

export function buildMorphology(samples: SwcSample[]): Morphology {
  const byId = new Map<number, SwcSample>();
  for (const s of samples) byId.set(s.id, s);
  const children = new Map<number, number[]>();
  for (const s of samples) {
    if (s.parent >= 0) {
      const arr = children.get(s.parent);
      if (arr) arr.push(s.id); else children.set(s.parent, [s.id]);
    }
  }

  const somaSamples = samples.filter(s => s.type === 1);
  const somaCenter = new THREE.Vector3();
  let somaR = 5;
  if (somaSamples.length) {
    for (const s of somaSamples) somaCenter.add(s.pos);
    somaCenter.multiplyScalar(1 / somaSamples.length);
    somaR = somaSamples.reduce((m, s) => Math.max(m, s.r), 0) || 5;
  } else {
    const root = samples.find(s => s.parent < 0) ?? samples[0];
    if (root) { somaCenter.copy(root.pos); somaR = root.r || 5; }
  }

  const branchStarts: number[] = [];
  const isBranchStart = (id: number) => {
    const s = byId.get(id); if (!s) return false;
    if (s.parent < 0) return true;
    const parent = byId.get(s.parent);
    if (!parent) return true;
    if (parent.type === 1 && s.type !== 1) return true;
    const sib = children.get(s.parent) ?? [];
    return sib.length > 1;
  };
  for (const s of samples) if (s.type !== 1 && isBranchStart(s.id)) branchStarts.push(s.id);

  const order = new Map<number, number>();
  const branches: Branch[] = [];
  for (const startId of branchStarts) {
    const startSample = byId.get(startId)!;
    const parent = byId.get(startSample.parent);
    const points: THREE.Vector3[] = [];
    const radii: number[] = [];
    if (parent) { points.push(parent.pos.clone()); radii.push(parent.r); }
    let cur: SwcSample | undefined = startSample;
    while (cur) {
      points.push(cur.pos.clone()); radii.push(cur.r);
      const kids: SwcSample[] = (children.get(cur.id) ?? []).map(id => byId.get(id)).filter((s): s is SwcSample => !!s);
      if (kids.length === 1) { cur = kids[0]; continue; }
      break;
    }
    const ord = parent && order.has(parent.id) ? order.get(parent.id)! + 1 : 0;
    order.set(startId, ord);
    if (points.length >= 2) branches.push({ type: typeOf(startSample.type), points, radii, order: ord });
  }

  const center = somaCenter.clone();
  let radius = somaR;
  for (const b of branches) for (const p of b.points) radius = Math.max(radius, p.distanceTo(center));

  const dendrite = branches.filter(b => b.type === 'basal' || b.type === 'apical' || b.type === 'dendrite').length;
  const axon = branches.filter(b => b.type === 'axon').length;

  return {
    branches, soma: { pos: somaCenter, r: somaR }, somaSamples,
    center, radius: radius || 1,
    counts: { total: samples.length, branches: branches.length, dendrite, axon },
  };
}

export function loadMorphology(text: string): Morphology {
  return buildMorphology(parseSWC(text));
}

export function branchesToTubes(
  morph: Morphology, branches: Branch[], targetRadius: number, radialSegments = 6, radiusScale = 1,
): THREE.BufferGeometry | null {
  const scale = targetRadius / morph.radius;
  const parts: THREE.BufferGeometry[] = [];
  for (const b of branches) {
    const pts = b.points.map(p => p.clone().sub(morph.center).multiplyScalar(scale));
    if (pts.length < 2) continue;
    const meanR = (b.radii.reduce((a, r) => a + r, 0) / b.radii.length) * scale * radiusScale;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
    const tubular = Math.max(2, Math.min(64, pts.length * 2));
    parts.push(new THREE.TubeGeometry(curve, tubular, Math.max(0.004, meanR), radialSegments, false));
  }
  if (!parts.length) return null;
  const merged = mergeSimple(parts);
  parts.forEach(p => p.dispose());
  merged.computeBoundingSphere();
  return merged;
}

function mergeSimple(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let vtot = 0;
  const ni = geos.map(g => (g.index ? g.toNonIndexed() : g));
  for (const g of ni) vtot += (g.getAttribute('position') as THREE.BufferAttribute).count;
  const pos = new Float32Array(vtot * 3);
  const nor = new Float32Array(vtot * 3);
  let o = 0;
  for (const g of ni) {
    const pa = g.getAttribute('position') as THREE.BufferAttribute;
    const na = g.getAttribute('normal') as THREE.BufferAttribute | undefined;
    pos.set(pa.array as Float32Array, o * 3);
    if (na) nor.set(na.array as Float32Array, o * 3);
    o += pa.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

export function spineAnchors(morph: Morphology, targetRadius: number, max = 400): { pos: THREE.Vector3; normal: THREE.Vector3 }[] {
  const scale = targetRadius / morph.radius;
  const dend = morph.branches.filter(b => b.type !== 'axon' && b.type !== 'soma');
  const anchors: { pos: THREE.Vector3; normal: THREE.Vector3 }[] = [];
  for (const b of dend) {
    for (let i = 1; i < b.points.length; i++) {
      const p = b.points[i].clone().sub(morph.center).multiplyScalar(scale);
      const prev = b.points[i - 1].clone().sub(morph.center).multiplyScalar(scale);
      const along = p.clone().sub(prev).normalize();
      const normal = new THREE.Vector3().crossVectors(along, new THREE.Vector3(0, 1, 0.2)).normalize();
      if (normal.lengthSq() < 0.01) normal.set(1, 0, 0);
      anchors.push({ pos: p, normal });
    }
  }
  if (anchors.length <= max) return anchors;
  const step = anchors.length / max;
  const out: { pos: THREE.Vector3; normal: THREE.Vector3 }[] = [];
  for (let i = 0; i < max; i++) out.push(anchors[Math.floor(i * step)]);
  return out;
}
