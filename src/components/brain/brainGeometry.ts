import * as THREE from 'three';

export function withRegionAttrs(geo: THREE.BufferGeometry, regionId: number, crease = 1): THREE.BufferGeometry {
  const n = geo.attributes.position.count;
  geo.setAttribute('aRegion', new THREE.BufferAttribute(new Float32Array(n).fill(regionId), 1));
  geo.setAttribute('aCrease', new THREE.BufferAttribute(new Float32Array(n).fill(crease), 1));
  return geo;
}

export function withCrystalAttrs(geo: THREE.BufferGeometry, regionId: number): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const n = g.attributes.position.count;
  const bary = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) bary[i * 3 + (i % 3)] = 1;
  g.setAttribute('aRegion', new THREE.BufferAttribute(new Float32Array(n).fill(regionId), 1));
  g.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  return g;
}

export function withBarycentric(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const n = g.attributes.position.count;
  const bary = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) bary[i * 3 + (i % 3)] = 1;
  g.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  return g;
}

export function withMeshAttrs(geo: THREE.BufferGeometry, regionId: number): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  const n = g.attributes.position.count;
  const bary = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) bary[i * 3 + (i % 3)] = 1;
  g.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
  g.setAttribute('aRegion', new THREE.BufferAttribute(new Float32Array(n).fill(regionId), 1));
  g.setAttribute('aCrease', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  return g;
}
