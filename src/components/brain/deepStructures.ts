import * as THREE from 'three';

export interface RawPart {
  id: number;
  geo: THREE.BufferGeometry;
  decorative?: boolean;
}

type V3 = [number, number, number];

function ringsToGeometry(rings: THREE.Vector3[][], tub: number, rad: number): THREE.BufferGeometry {
  const verts: number[] = [];
  const push = (v: THREE.Vector3) => { verts.push(v.x, v.y, v.z); };
  for (let i = 0; i < tub; i++) {
    for (let j = 0; j < rad; j++) {
      const a = rings[i][j], b = rings[i + 1][j], c = rings[i + 1][j + 1], d = rings[i][j + 1];
      push(a); push(b); push(d);
      push(b); push(c); push(d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return g;
}

function variableTube(curve: THREE.Curve<THREE.Vector3>, tub: number, rad: number, radius: (u: number) => number): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tub, false);
  const rings: THREE.Vector3[][] = [];
  for (let i = 0; i <= tub; i++) {
    const u = i / tub;
    const P = curve.getPointAt(u);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = radius(u);
    const ring: THREE.Vector3[] = [];
    for (let j = 0; j <= rad; j++) {
      const v = (j / rad) * Math.PI * 2;
      const cn = -Math.cos(v) * r, cb = Math.sin(v) * r;
      ring.push(new THREE.Vector3(
        P.x + N.x * cn + B.x * cb,
        P.y + N.y * cn + B.y * cb,
        P.z + N.z * cn + B.z * cb,
      ));
    }
    rings.push(ring);
  }
  return ringsToGeometry(rings, tub, rad);
}

function sagittalBand(curve: THREE.Curve<THREE.Vector3>, tub: number, rad: number, halfWidth: (u: number) => number, halfThick: (u: number) => number): THREE.BufferGeometry {
  const rings: THREE.Vector3[][] = [];
  const T = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= tub; i++) {
    const u = i / tub;
    P.copy(curve.getPointAt(u));
    T.copy(curve.getTangentAt(u)).normalize();
    const B = new THREE.Vector3(1, 0, 0).addScaledVector(T, -T.x).normalize();
    const N = new THREE.Vector3().crossVectors(B, T).normalize();
    const w = halfWidth(u), th = halfThick(u);
    const ring: THREE.Vector3[] = [];
    for (let j = 0; j <= rad; j++) {
      const v = (j / rad) * Math.PI * 2;
      const cw = Math.cos(v) * w, cn = Math.sin(v) * th;
      ring.push(new THREE.Vector3(
        P.x + B.x * cw + N.x * cn,
        P.y + B.y * cw + N.y * cn,
        P.z + B.z * cw + N.z * cn,
      ));
    }
    rings.push(ring);
  }
  return ringsToGeometry(rings, tub, rad);
}

export function buildWhiteMatter(c: V3): RawPart[] {
  const parts: RawPart[] = [];
  const p = (dx: number, dy: number, dz: number) => new THREE.Vector3(c[0] + dx, c[1] + dy, c[2] + dz);

  const callosum = new THREE.CatmullRomCurve3([
    p(0, 0.08, 0.20),
    p(0, 0.18, 0.24),
    p(0, 0.25, 0.12),
    p(0, 0.27, -0.04),
    p(0, 0.24, -0.18),
    p(0, 0.16, -0.26),
    p(0, 0.08, -0.22),
  ]);
  parts.push({
    id: 0, decorative: true,
    geo: sagittalBand(callosum, 26, 10,
      u => 0.10 * (0.75 + 0.5 * Math.sin(Math.PI * u)),
      () => 0.02),
  });

  for (const s of [-1, 1]) {
    const fornix = new THREE.CatmullRomCurve3([
      p(s * 0.15, 0.02, -0.24),
      p(s * 0.10, 0.14, -0.10),
      p(s * 0.05, 0.19, 0.06),
      p(s * 0.04, 0.13, 0.18),
      p(s * 0.035, 0.02, 0.16),
    ]);
    parts.push({ id: 0, decorative: true, geo: variableTube(fornix, 26, 9, () => 0.012) });
  }

  return parts;
}
