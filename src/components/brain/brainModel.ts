import * as THREE from 'three';
import { withBarycentric } from './brainGeometry';

// CBR1: magic|vCount|iCount|positions|normals|crease|index
// CBR2: magic|vCount|iCount|positions|normals|crease|region(i32, baked real FreeSurfer/
//       Destrieux cortical parcellation, see tools/brain/bake_cortex.py)|index
export function parseBrainBin(buf: ArrayBuffer): THREE.BufferGeometry {
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'CBR1' && magic !== 'CBR2') throw new Error('Unexpected brain asset header');
  const vCount = dv.getUint32(4, true);
  const iCount = dv.getUint32(8, true);
  let o = 12;
  const positions = new Float32Array(buf.slice(o, o + vCount * 3 * 4)); o += vCount * 3 * 4;
  const normals   = new Float32Array(buf.slice(o, o + vCount * 3 * 4)); o += vCount * 3 * 4;
  const crease    = new Float32Array(buf.slice(o, o + vCount * 4));     o += vCount * 4;
  let region: Float32Array | null = null;
  if (magic === 'CBR2') {
    const regionI32 = new Int32Array(buf.slice(o, o + vCount * 4)); o += vCount * 4;
    region = Float32Array.from(regionI32);
  }
  const index = new Uint32Array(buf.slice(o, o + iCount * 4)); o += iCount * 4;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('aCrease', new THREE.BufferAttribute(crease, 1));
  if (region) geo.setAttribute('aRegion', new THREE.BufferAttribute(region, 1));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

const PITCH = 0.12;
export function canonicalOrientation(): THREE.Matrix4 {
  const permute = new THREE.Matrix4().set(
    0, -1, 0, 0,
    0,  0, 1, 0,
   -1,  0, 0, 0,
    0,  0, 0, 1,
  );
  const pitch = new THREE.Matrix4().makeRotationX(PITCH);
  return pitch.multiply(permute);
}

export function orientCortex(geo: THREE.BufferGeometry): void {
  geo.applyMatrix4(canonicalOrientation());
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
}

export function parseBrainGeo(buf: ArrayBuffer): THREE.BufferGeometry {
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'CGEO') throw new Error('Unexpected brain-geo header');
  const vCount = dv.getUint32(4, true);
  let o = 8;
  const positions = new Float32Array(buf.slice(o, o + vCount * 3 * 4)); o += vCount * 3 * 4;
  const region    = new Float32Array(buf.slice(o, o + vCount * 4));     o += vCount * 4;
  const bary      = new Float32Array(buf.slice(o, o + vCount * 3 * 4)); o += vCount * 3 * 4;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aRegion', new THREE.BufferAttribute(region, 1));
  geo.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

export async function loadCortexGeometry(): Promise<THREE.BufferGeometry> {
  const url = `${import.meta.env.BASE_URL}brain/brain_geo.bin`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`brain asset ${res.status}`);
  const buf = await res.arrayBuffer();
  return parseBrainGeo(buf);
}

export interface SubStructure { id: number; decorative: boolean; geo: THREE.BufferGeometry; }

export function parseSubcortical(buf: ArrayBuffer): SubStructure[] {
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'SUB1') throw new Error('Unexpected subcortical asset header');
  const count = dv.getUint32(4, true);
  let o = 8;
  const parts: SubStructure[] = [];
  for (let k = 0; k < count; k++) {
    const id = dv.getInt32(o, true); o += 4;
    const decorative = dv.getUint32(o, true) !== 0; o += 4;
    const vCount = dv.getUint32(o, true); o += 4;
    const iCount = dv.getUint32(o, true); o += 4;
    const positions = new Float32Array(buf.slice(o, o + vCount * 3 * 4)); o += vCount * 3 * 4;
    const index = new Uint32Array(buf.slice(o, o + iCount * 4)); o += iCount * 4;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    parts.push({ id, decorative, geo });
  }
  return parts;
}

export async function loadSubcortical(): Promise<SubStructure[]> {
  const url = `${import.meta.env.BASE_URL}brain/subcortical.bin`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`subcortical asset ${res.status}`);
  return parseSubcortical(await res.arrayBuffer());
}

export async function loadCortexSmooth(): Promise<THREE.BufferGeometry> {
  const url = `${import.meta.env.BASE_URL}brain/brain.bin`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`brain asset ${res.status}`);
  const buf = await res.arrayBuffer();
  const geo = parseBrainBin(buf);
  orientCortex(geo);
  return withBarycentric(geo);
}
