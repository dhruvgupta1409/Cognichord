import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface NeuronMesh {
  membrane: THREE.BufferGeometry;
  myelin: THREE.BufferGeometry;
  axonCurve: THREE.CatmullRomCurve3;
  terminal: THREE.Vector3;
  nodes: THREE.Vector3[];
  dendriteTips: THREE.Vector3[];
  anchors: Record<'soma' | 'apical' | 'basal' | 'axon' | 'myelin' | 'node' | 'terminal', THREE.Vector3>;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function prep(geo: THREE.BufferGeometry, regionId: number): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const src = g.getAttribute('position') as THREE.BufferAttribute;
  const n = src.count;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(new Float32Array(src.array as Float32Array), 3));
  let nrm = g.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (!nrm) { g.computeVertexNormals(); nrm = g.getAttribute('normal') as THREE.BufferAttribute; }
  out.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm.array as Float32Array), 3));
  const bary = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) bary[i * 3 + (i % 3)] = 1;
  out.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  out.setAttribute('aRegion', new THREE.BufferAttribute(new Float32Array(n).fill(regionId), 1));
  if (g !== geo) g.dispose();
  geo.dispose();
  return out;
}

function lumpySoma(radius: number, lumps: number, rng: () => number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(radius, 4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const dirs: THREE.Vector3[] = [];
  const amps: number[] = [];
  for (let i = 0; i < lumps; i++) { dirs.push(new THREE.Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize()); amps.push(0.12 + rng() * 0.16); }
  const nrm = new Float32Array(pos.count * 3);
  const nv = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const rd = v.clone().normalize();
    let d = 0;
    for (let k = 0; k < lumps; k++) d += amps[k] * Math.max(0, rd.dot(dirs[k])) ** 2;
    v.addScaledVector(rd, radius * d);
    v.y *= 1.18; v.y += radius * 0.12 * Math.max(0, rd.y);
    pos.setXYZ(i, v.x, v.y, v.z);
    nv.copy(v).normalize();
    nrm[i * 3] = nv.x; nrm[i * 3 + 1] = nv.y; nrm[i * 3 + 2] = nv.z;
  }
  pos.needsUpdate = true;
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

function branch(points: THREE.Vector3[], rad: number, seg = 24, radial = 12): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);
  return new THREE.TubeGeometry(curve, seg, rad, radial, false);
}

function mushroomSpine(base: THREE.Vector3, dir: THREE.Vector3, len: number, headR: number): THREE.BufferGeometry[] {
  const tip = base.clone().addScaledVector(dir, len);
  const neck = branch([base, base.clone().addScaledVector(dir, len * 0.6), tip], headR * 0.32, 6, 6);
  const head = new THREE.IcosahedronGeometry(headR, 2);
  head.translate(tip.x, tip.y, tip.z);
  return [neck, head];
}

function internode(a: THREE.Vector3, b: THREE.Vector3, rad: number): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(rad, rad, len, 10, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

export function buildPyramidalNeuron(opts: { growth?: number; seed?: number; regionId?: number } = {}): NeuronMesh {
  const growth = Math.max(0, Math.min(1, opts.growth ?? 0.5));
  const rng = mulberry32(opts.seed ?? 1);
  const regionId = opts.regionId ?? 2;
  const parts: THREE.BufferGeometry[] = [];
  const somaR = 0.52;

  parts.push(prep(lumpySoma(somaR, 4, rng), regionId));

  const apicalTop = new THREE.Vector3((rng() - 0.5) * 0.5, 3.5, (rng() - 0.5) * 0.5);
  const apicalPts = [
    new THREE.Vector3(0, somaR * 0.6, 0),
    new THREE.Vector3((rng() - 0.5) * 0.3, 1.4, (rng() - 0.5) * 0.3),
    new THREE.Vector3((rng() - 0.5) * 0.4, 2.5, (rng() - 0.5) * 0.4),
    apicalTop,
  ];
  parts.push(prep(branch(apicalPts, 0.10, 30, 16), regionId));
  const dendriteTips: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const end = apicalTop.clone().add(new THREE.Vector3((rng() - 0.5) * 1.6, 0.4 + rng() * 0.9, (rng() - 0.5) * 1.6));
    parts.push(prep(branch([apicalTop, apicalTop.clone().lerp(end, 0.55), end], 0.05, 16, 10), regionId));
    dendriteTips.push(end);
    if (rng() > 0.4) {
      const twig = end.clone().add(new THREE.Vector3((rng() - 0.5) * 0.9, 0.3 + rng() * 0.5, (rng() - 0.5) * 0.9));
      parts.push(prep(branch([end, end.clone().lerp(twig, 0.5), twig], 0.03, 10, 8), regionId));
      dendriteTips.push(twig);
    }
  }
  for (const t of [0.32, 0.48, 0.62, 0.74, 0.86]) {
    const base = new THREE.Vector3().lerpVectors(apicalPts[1], apicalTop, t);
    const end = base.clone().add(new THREE.Vector3((rng() - 0.5) * 2.2, 0.2 + rng() * 0.7, (rng() - 0.5) * 2.2));
    parts.push(prep(branch([base, base.clone().lerp(end, 0.5), end], 0.045, 16, 9), regionId));
    dendriteTips.push(end);
    if (rng() > 0.45) {
      const twig = end.clone().add(new THREE.Vector3((rng() - 0.5) * 1.0, (rng() - 0.3) * 0.6, (rng() - 0.5) * 1.0));
      parts.push(prep(branch([end, end.clone().lerp(twig, 0.5), twig], 0.03, 12, 8), regionId));
      dendriteTips.push(twig);
    }
  }

  const nBasal = 8;
  for (let i = 0; i < nBasal; i++) {
    const ang = (i / nBasal) * Math.PI * 2 + rng() * 0.5;
    const reach = 1.5 + rng() * 0.9;
    const dir = new THREE.Vector3(Math.cos(ang), -0.35 - rng() * 0.3, Math.sin(ang)).normalize();
    const mid = dir.clone().multiplyScalar(reach * 0.55).add(new THREE.Vector3(0, -somaR * 0.4, 0));
    const end = dir.clone().multiplyScalar(reach).add(new THREE.Vector3(0, -somaR * 0.5, 0));
    end.add(new THREE.Vector3((rng() - 0.5) * 0.6, (rng() - 0.5) * 0.4, (rng() - 0.5) * 0.6));
    parts.push(prep(branch([new THREE.Vector3(0, -somaR * 0.5, 0), mid, end], 0.075, 18, 10), regionId));
    dendriteTips.push(end);
    if (rng() > 0.3) {
      const tip2 = end.clone().add(new THREE.Vector3((rng() - 0.5) * 1.2, -0.2 - rng() * 0.4, (rng() - 0.5) * 1.2));
      parts.push(prep(branch([end, end.clone().lerp(tip2, 0.5), tip2], 0.04, 14, 8), regionId));
      dendriteTips.push(tip2);
      if (rng() > 0.5) {
        const tip3 = tip2.clone().add(new THREE.Vector3((rng() - 0.5) * 0.9, -0.1 - rng() * 0.3, (rng() - 0.5) * 0.9));
        parts.push(prep(branch([tip2, tip2.clone().lerp(tip3, 0.5), tip3], 0.028, 10, 7), regionId));
        dendriteTips.push(tip3);
      }
    }
  }

  const spineCount = Math.round(70 * (0.35 + 0.65 * growth));
  for (let i = 0; i < spineCount; i++) {
    const tip = dendriteTips[(rng() * dendriteTips.length) | 0];
    const along = 0.2 + rng() * 0.75;
    const base = new THREE.Vector3(0, somaR * 0.2, 0).lerp(tip, along);
    base.add(new THREE.Vector3((rng() - 0.5) * 0.06, (rng() - 0.5) * 0.06, (rng() - 0.5) * 0.06));
    const dir = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
    const headR = 0.05 + rng() * 0.03;
    for (const sp of mushroomSpine(base, dir, 0.10 + rng() * 0.08, headR)) parts.push(prep(sp, regionId));
  }

  const hillock = new THREE.Vector3(0, -somaR * 0.95, 0);
  const terminal = new THREE.Vector3(4.6, -1.7, 0.2);
  const axonPts = [
    hillock,
    new THREE.Vector3(0.05, -1.5, 0.02),
    new THREE.Vector3(1.4, -1.9, 0.15),
    new THREE.Vector3(2.9, -1.6, 0.1),
    new THREE.Vector3(3.9, -1.75, 0.18),
    terminal,
  ];
  const axonCurve = new THREE.CatmullRomCurve3(axonPts, false, 'catmullrom', 0.4);
  parts.push(prep(new THREE.TubeGeometry(axonCurve, 90, 0.055, 12, false), regionId));
  const bouton = new THREE.IcosahedronGeometry(0.26, 3);
  bouton.translate(terminal.x, terminal.y, terminal.z);
  parts.push(prep(bouton, regionId));

  const myelinParts: THREE.BufferGeometry[] = [];
  const nodes: THREE.Vector3[] = [];
  const uStart = 0.16, uEnd = 0.16 + 0.74 * (0.4 + 0.6 * growth);
  const internodeLen = 0.026;
  const gap = 0.012;
  let u = uStart;
  while (u + internodeLen < uEnd) {
    const a = axonCurve.getPointAt(u);
    const b = axonCurve.getPointAt(u + internodeLen);
    myelinParts.push(internode(a, b, 0.12 + 0.03 * growth));
    nodes.push(axonCurve.getPointAt(u + internodeLen + gap / 2));
    u += internodeLen + gap;
  }
  if (nodes.length) nodes.pop();

  const membrane = mergeGeometries(parts, false)!;
  membrane.computeBoundingSphere();
  const myelin = myelinParts.length
    ? prepMerge(myelinParts)
    : new THREE.BufferGeometry();

  for (const p of parts) p.dispose();

  return {
    membrane,
    myelin,
    axonCurve,
    terminal,
    nodes,
    dendriteTips,
    anchors: {
      soma: new THREE.Vector3(0, somaR * 0.4, 0),
      apical: new THREE.Vector3().lerpVectors(apicalPts[1], apicalTop, 0.5),
      basal: new THREE.Vector3(-1.3, -1.0, 0.2),
      axon: axonCurve.getPointAt(0.12),
      myelin: axonCurve.getPointAt((uStart + uEnd) / 2),
      node: nodes.length ? nodes[Math.floor(nodes.length * 0.6)] : axonCurve.getPointAt(0.5),
      terminal: terminal.clone(),
    },
  };
}

function prepMerge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const prepped = geos.map(g => prep(g, 8));
  const merged = mergeGeometries(prepped, false)!;
  for (const p of prepped) p.dispose();
  merged.computeBoundingSphere();
  return merged;
}
