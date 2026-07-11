import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { buildPyramidalNeuron, type NeuronMesh } from '../micro/neuronGeometry';
import { createMembraneMaterial, createMyelinMaterial } from '../micro/membraneMaterial';
import Postprocessing from './Postprocessing';
import { branchesToTubes, spineAnchors, type Morphology } from '../../lib/swc';
import { useCorticalMesh, useMorphologies } from '../../lib/assets';

export type StageId = 'brain' | 'region' | 'tissue' | 'neuron' | 'synapse';
export interface StageMeta { id: StageId; title: string; blurb: string }
export const STAGES: StageMeta[] = [
  { id: 'brain',   title: 'The whole brain',   blurb: 'One organ, about 86 billion neurons. We fly toward the region activated by practice.' },
  { id: 'region',  title: 'The active region', blurb: 'Motor cortex, the patch that fires when your fingers move. We move down into its surface.' },
  { id: 'tissue',  title: 'Neural tissue',     blurb: 'A living forest of cells wired into circuits. Signals move between them.' },
  { id: 'neuron',  title: 'A single neuron',   blurb: 'One cell. An electrical spike travels down its insulated axon toward the ending.' },
  { id: 'synapse', title: 'Where learning happens', blurb: 'A single synapse onto a dendritic spine, and the molecular cascade (LTP) that makes it permanently stronger when you practice.' },
];

export interface LearningDatum { label: string; value: string; cite: string }
export interface JourneyState { stage: StageId; progress: number; event: string; data: LearningDatum | null }

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { x = clamp01(x); return x * x * (3 - 2 * x); };
function band(j: number, a: number, b: number, c: number, d: number) {
  if (j <= a || j >= d) return 0;
  if (j < b) return smooth((j - a) / (b - a));
  if (j > c) return smooth(1 - (j - c) / (d - c));
  return 1;
}

const WIN: Record<StageId, [number, number, number, number]> = {
  brain:   [-0.1, 0.02, 0.15, 0.24],
  region:  [0.14, 0.24, 0.34, 0.43],
  tissue:  [0.33, 0.43, 0.54, 0.63],
  neuron:  [0.53, 0.63, 0.74, 0.83],
  synapse: [0.73, 0.83, 1.2, 1.3],
};

interface Pose { pos: THREE.Vector3; tgt: THREE.Vector3; fov: number }
const KEYS: { j: number; pos: [number, number, number]; tgt: [number, number, number]; fov: number }[] = [
  { j: 0.06, pos: [0, 0.4, 9.5], tgt: [0, 0, 0], fov: 42 },
  { j: 0.29, pos: [0.2, 0.3, 6.2], tgt: [0, 0, 0], fov: 40 },
  { j: 0.48, pos: [0, 0, 5.0], tgt: [0, 0, 0], fov: 44 },
  { j: 0.68, pos: [2.2, 0.5, 8.8], tgt: [0, 0, 0], fov: 42 },
  { j: 0.92, pos: [-0.05, 0.1, 5.3], tgt: [0.05, -0.05, 0], fov: 44 },
];
function poseAt(j: number, out: Pose) {
  let k0 = KEYS[0], k1 = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (j >= KEYS[i].j && j <= KEYS[i + 1].j) { k0 = KEYS[i]; k1 = KEYS[i + 1]; break; }
    if (j < KEYS[0].j) { k0 = k1 = KEYS[0]; break; }
    if (j > KEYS[KEYS.length - 1].j) { k0 = k1 = KEYS[KEYS.length - 1]; break; }
  }
  const s = k1.j === k0.j ? 0 : smooth((j - k0.j) / (k1.j - k0.j));
  out.pos.set(THREE.MathUtils.lerp(k0.pos[0], k1.pos[0], s), THREE.MathUtils.lerp(k0.pos[1], k1.pos[1], s), THREE.MathUtils.lerp(k0.pos[2], k1.pos[2], s));
  out.tgt.set(THREE.MathUtils.lerp(k0.tgt[0], k1.tgt[0], s), THREE.MathUtils.lerp(k0.tgt[1], k1.tgt[1], s), THREE.MathUtils.lerp(k0.tgt[2], k1.tgt[2], s));
  out.fov = THREE.MathUtils.lerp(k0.fov, k1.fov, s);
}

function rngFor(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

interface SceneProps {
  playing: boolean; replayToken: number;
  corticalGeo: THREE.BufferGeometry | null; heroMorph: Morphology | null; morphs: Morphology[];
  onProgress: (j: number, stage: StageId) => void;
  onEvent: (label: string) => void;
  onData: (d: LearningDatum | null) => void;
}
function Scene({ playing, replayToken, corticalGeo, heroMorph, morphs, onProgress, onEvent, onData }: SceneProps) {
  const jRef = useRef(0);
  const { camera } = useThree();
  const pose = useMemo<Pose>(() => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 42 }), []);
  const lastStage = useRef<StageId>('brain');
  const lastReport = useRef(0);
  useEffect(() => { jRef.current = 0; lastStage.current = 'brain'; }, [replayToken]);
  const JOURNEY = 34;

  useFrame((state, dt) => {
    dt = Math.min(0.05, dt);
    if (playing && jRef.current < 1) jRef.current = Math.min(1, jRef.current + dt / JOURNEY);
    const j = jRef.current;
    poseAt(j, pose);
    const t = state.clock.elapsedTime;
    const idle = 0.12 + 0.14 * smooth((j - 0.75) / 0.25);
    camera.position.lerp(pose.pos.clone().add(new THREE.Vector3(Math.sin(t * 0.11) * 0.18 * idle, Math.cos(t * 0.08) * 0.1 * idle, 0)), 0.05);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += (pose.fov - cam.fov) * 0.06; cam.updateProjectionMatrix();
    camera.lookAt(pose.tgt);

    let stage: StageId = 'brain';
    for (const s of STAGES) { const [a, , , d] = WIN[s.id]; if (j >= a && j < d) stage = s.id; }
    if (j >= 0.99) stage = 'synapse';
    if (stage !== lastStage.current || t - lastReport.current > 0.2) { lastStage.current = stage; lastReport.current = t; onProgress(j, stage); }
  });

  const jGet = () => jRef.current;
  return (
    <>
      <color attach="background" args={['#04060e']} />
      <ambientLight intensity={0.45} />
      <pointLight position={[6, 8, 10]} intensity={0.7} color="#bfe2ff" />
      <pointLight position={[-8, -4, 4]} intensity={0.35} color="#ff5fa2" />
      <BrainStageGroup jGet={jGet} geometry={corticalGeo} />
      <RegionStageGroup jGet={jGet} morphs={morphs} />
      <TissueStageGroup jGet={jGet} morphs={morphs} />
      <NeuronStageGroup jGet={jGet} morph={heroMorph} />
      <LearningSynapse jGet={jGet} onEvent={onEvent} onData={onData} />
      <Postprocessing strength={0.32} threshold={0.86} radius={0.6} />
    </>
  );
}

function useTmp() {
  return useMemo(() => ({ m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), c: new THREE.Color() }), []);
}
const HIDE = new THREE.Vector3(0, -9999, 0);
const XAXIS = new THREE.Vector3(1, 0, 0);
const YAXIS = new THREE.Vector3(0, 1, 0);

function createSoftMembrane(tint: string, opacity = 0.5, glowCol = '#FFD86B'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, extensions: { derivatives: true } as any,
    uniforms: {
      uTime: { value: 0 }, uTint: { value: new THREE.Color(tint) }, uGlow: { value: 0 },
      uGlowCol: { value: new THREE.Color(glowCol) }, uOpacity: { value: opacity }, uDim: { value: 1 },
      uPulse: { value: new THREE.Vector3(999, 999, 999) }, uPulseAmt: { value: 0 }, uPulseW: { value: 0.6 },
      uPulseCol: { value: new THREE.Color('#eafcff') },
    },
    vertexShader: `varying vec3 vW; varying vec3 vV;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz; vV = cameraPosition - wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `precision highp float;
      uniform float uTime, uOpacity, uGlow, uDim, uPulseAmt, uPulseW; uniform vec3 uTint, uGlowCol, uPulse, uPulseCol; varying vec3 vW; varying vec3 vV;
      void main(){
        vec3 N = normalize(cross(dFdx(vW), dFdy(vW))); vec3 V = normalize(vV); if (dot(N,V) < 0.0) N = -N;
        float fres = pow(1.0 - max(dot(N,V), 0.0), 2.3);
        float diff = clamp(dot(N, vec3(0.35,0.8,0.5)) * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = uTint * (0.22 + 0.5 * diff) + uTint * fres * 1.1;
        col += uGlowCol * uGlow * (0.55 + 0.9 * fres);
        // travelling depolarisation wave (a moving band of membrane potential, not a sphere)
        float d = distance(vW, uPulse);
        float wave = uPulseAmt * exp(-(d*d)/(uPulseW*uPulseW));
        col += (uPulseCol*0.85 + uTint*0.4) * wave * (0.6 + 0.7*fres);
        float a = (uOpacity + fres * 0.4 + uGlow * 0.35 + wave*0.4) * uDim;
        gl_FragColor = vec4(col * uDim, clamp(a, 0.0, 0.98));
      }`,
  });
}

function createCortexMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, extensions: { derivatives: true } as any,
    uniforms: {
      uTime: { value: 0 }, uActivity: { value: 0 }, uDim: { value: 1 },
      uFlesh: { value: new THREE.Color('#b07176') }, uDeep: { value: new THREE.Color('#4a2531') },
      uWave: { value: new THREE.Color('#37e6ff') }, uWave2: { value: new THREE.Color('#8affc8') },
    },
    vertexShader: `varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vV = cameraPosition - wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `precision highp float;
      uniform float uTime, uActivity, uDim; uniform vec3 uFlesh, uDeep, uWave, uWave2; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      // cheap value-noise for wave irregularity
      float hash(vec3 p){ return fract(sin(dot(p, vec3(17.1,113.5,71.7)))*43758.5); }
      float noise(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        float n=mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); return n; }
      void main(){
        vec3 N = normalize(vN); vec3 gN = normalize(cross(dFdx(vW), dFdy(vW)));   // geometric normal for crease shading
        vec3 V = normalize(vV); if(dot(N,V)<0.0) N=-N;
        float diff = clamp(dot(N, normalize(vec3(0.4,0.85,0.5)))*0.5+0.5, 0.0, 1.0);
        float fres = pow(1.0-max(dot(N,V),0.0), 2.0);
        // sulci: darker where the geometric normal disagrees with the smooth normal (high curvature)
        float crease = clamp(1.0 - dot(gN, N), 0.0, 1.0);
        vec3 base = mix(uFlesh, uDeep, crease*0.85) * (0.28 + 0.6*diff);
        // subsurface bleed on thin/back-lit edges — warm, restrained (no blown-white rim)
        float thin = pow(1.0 - abs(dot(N, V)), 2.4);
        base += vec3(0.62, 0.26, 0.28) * uFlesh * (fres * 0.16 + thin * 0.14);   // waxy SSS, not a hot rim
        base += uFlesh * 0.06;                                                    // dark-side ambient floor
        // travelling activity waves across interconnected areas
        float t = uTime;
        float w = 0.0;
        w += smoothstep(0.55,0.95, 0.5+0.5*sin(dot(vW, vec3(1.6,0.4,0.9)) - t*1.7 + noise(vW*1.2)*2.0));
        w += smoothstep(0.6,0.98, 0.5+0.5*sin(dot(vW, vec3(-0.7,1.1,1.3)) - t*1.15 + noise(vW*0.8+3.0)*2.0));
        w += smoothstep(0.7,1.0,  0.5+0.5*sin(dot(vW, vec3(0.9,-0.8,-1.4)) - t*2.1));
        w *= uActivity;
        vec3 col = base + mix(uWave, uWave2, noise(vW*0.5+t*0.1)) * w * (0.7 + 0.8*fres);
        float a = clamp(0.9 + fres*0.1, 0.0, 1.0) * uDim;
        gl_FragColor = vec4(col*uDim, a);
      }`,
  });
}

function Callout({ jGet, from, to, text, col, stage = 'synapse' }: { jGet: () => number; from: [number, number, number]; to: [number, number, number]; text: string; col: string; stage?: StageId }) {
  const line = useRef<THREE.LineSegments>(null); const html = useRef<HTMLDivElement>(null); const dot = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...from, ...to], 3)); return g; }, [from, to]);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((state) => {
    const o = clamp01((band(jGet(), ...WIN[stage]) - 0.45) / 0.35);
    if (line.current) (line.current.material as THREE.LineBasicMaterial).opacity = o * 0.55;
    if (html.current) html.current.style.opacity = String(o);
    if (dot.current) { const p = 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 2.2); dot.current.scale.setScalar(0.02 * o * p); }
  });
  return (
    <>
      <lineSegments ref={line} geometry={geo}><lineBasicMaterial color={col} transparent opacity={0} depthWrite={false} /></lineSegments>
      <mesh ref={dot} position={from}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color={col} /></mesh>
      <Html position={to} center distanceFactor={5.5} style={{ pointerEvents: 'none' }}>
        <div ref={html} style={{ opacity: 0, whiteSpace: 'nowrap', transform: 'translateY(-50%)', fontSize: 11.5, fontWeight: 600, letterSpacing: 0.2, color: '#e7edf6', textShadow: '0 1px 4px rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: 9, background: col, boxShadow: `0 0 6px ${col}` }} />{text}
        </div>
      </Html>
    </>
  );
}

function proceduralCortex(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(2.1, 7);
  const pos = g.attributes.position as THREE.BufferAttribute; const v = new THREE.Vector3();
  const fbm = (n: THREE.Vector3) => {
    let s = 0, amp = 1, f = 2.2;
    for (let o = 0; o < 4; o++) { s += amp * Math.sin(n.x * f * 3 + n.y * f * 2.1) * Math.sin(n.z * f * 2.7 - n.y * f * 1.9); amp *= 0.5; f *= 2.0; }
    return s;
  };
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); const n = v.clone().normalize();
    const folds = 0.085 * fbm(n);
    const fissure = -0.2 * Math.exp(-(n.x * n.x) * 30);
    v.addScaledVector(n, folds + fissure); v.z *= 1.22; v.x *= 0.85; v.y *= 0.95;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true; g.computeVertexNormals(); return g;
}
function BrainStageGroup({ jGet, geometry }: { jGet: () => number; geometry: THREE.BufferGeometry | null }) {
  const grp = useRef<THREE.Group>(null);
  const hotspot = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const proc = useMemo(() => proceduralCortex(), []);
  const geo = geometry ?? proc;
  const mat = useMemo(() => createCortexMaterial(), []);
  useEffect(() => () => { proc.dispose(); mat.dispose(); }, []);
  const hotPos = useMemo(() => new THREE.Vector3(0.25, 1.55, 0.35), []);
  useFrame((state) => {
    const a = band(jGet(), ...WIN.brain); const g = grp.current; if (!g) return;
    g.visible = a > 0.001;
    const t = state.clock.elapsedTime;
    mat.uniforms.uTime.value = t; mat.uniforms.uDim.value = a;
    mat.uniforms.uActivity.value = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.5));
    if (!g.visible) return;
    g.rotation.y = t * 0.045;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    if (hotspot.current) { const s = 0.11 + 0.04 * pulse; hotspot.current.scale.setScalar(s); (hotspot.current.material as THREE.MeshBasicMaterial).opacity = a * (0.5 + 0.35 * pulse); }
    if (glow.current) { glow.current.scale.setScalar(0.22 + 0.1 * pulse); (glow.current.material as THREE.MeshBasicMaterial).opacity = a * 0.28 * pulse; }
  });
  return (
    <group ref={grp}>
      <mesh geometry={geo} material={mat} />
      <mesh ref={hotspot} position={hotPos}><icosahedronGeometry args={[1, 3]} /><meshBasicMaterial color="#37e6ff" toneMapped={false} transparent opacity={0} depthWrite={false} /></mesh>
      <mesh ref={glow} position={hotPos}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#00d4ff" toneMapped={false} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <StageLabel jGet={jGet} id="brain" pos={hotPos.clone().add(new THREE.Vector3(0, 0.4, 0))} text="Motor cortex" col="#7CF5C6" />
    </group>
  );
}

function TissueOrRegionField({ jGet, win, count, spread, palette, columns }: {
  jGet: () => number; win: [number, number, number, number]; count: number; spread: number; palette: string[]; columns: boolean;
}) {
  const grp = useRef<THREE.Group>(null);
  const cells = useRef<THREE.InstancedMesh>(null);
  const links = useRef<THREE.LineSegments>(null);
  const tmp = useTmp();
  const nodes = useMemo(() => {
    const rng = rngFor(columns ? 11 : 27); const arr: { p: THREE.Vector3; r: number; ph: number; c: THREE.Color }[] = [];
    for (let i = 0; i < count; i++) {
      let x = (rng() - 0.5) * spread, y = (rng() - 0.5) * spread * 0.9, z = (rng() - 0.5) * spread;
      if (columns) { x = Math.round(x / 0.7) * 0.7 + (rng() - 0.5) * 0.12; z = Math.round(z / 0.7) * 0.7 + (rng() - 0.5) * 0.12; }
      arr.push({ p: new THREE.Vector3(x, y, z), r: 0.10 + rng() * 0.12, ph: rng() * 6.28, c: new THREE.Color(palette[(rng() * palette.length) | 0]) });
    }
    return arr;
  }, [count, spread, columns, palette]);
  const linkGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < nodes.length; i++) for (let k = i + 1; k < nodes.length; k++) {
      if (nodes[i].p.distanceTo(nodes[k].p) < spread * 0.28 && Math.random() < 0.5) pts.push(nodes[i].p.x, nodes[i].p.y, nodes[i].p.z, nodes[k].p.x, nodes[k].p.y, nodes[k].p.z);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
  }, [nodes, spread]);
  useEffect(() => () => linkGeo.dispose(), [linkGeo]);
  useEffect(() => { const m = cells.current; if (!m) return; for (let i = 0; i < nodes.length; i++) m.setColorAt(i, nodes[i].c); if (m.instanceColor) m.instanceColor.needsUpdate = true; }, [nodes]);
  useFrame((state) => {
    const a = band(jGet(), ...win); const g = grp.current; if (!g) return;
    g.visible = a > 0.001; if (!g.visible) return;
    const t = state.clock.elapsedTime; g.rotation.y = t * 0.03; const m = cells.current;
    if (m) {
      for (let i = 0; i < nodes.length; i++) { const nd = nodes[i]; const s = nd.r * (0.85 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.2 + nd.ph))) * a; tmp.m.compose(nd.p, tmp.q.identity(), tmp.s.set(s, s, s)); m.setMatrixAt(i, tmp.m); }
      m.instanceMatrix.needsUpdate = true;
    }
    if (links.current) (links.current.material as THREE.LineBasicMaterial).opacity = a * (0.10 + 0.06 * Math.sin(t * 1.3));
  });
  return (
    <group ref={grp}>
      <instancedMesh ref={cells} args={[undefined as any, undefined as any, count]}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.92} blending={THREE.AdditiveBlending} depthWrite={false} /></instancedMesh>
      <lineSegments ref={links} geometry={linkGeo}><lineBasicMaterial color={palette[0]} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></lineSegments>
    </group>
  );
}
interface FieldCfg { win: [number, number, number, number]; count: number; spread: number; cellR: number; vertical: boolean; tint: string; seed: number; scaleMin: number; scaleMax: number; }
function NeuropilField({ jGet, morphs, cfg }: { jGet: () => number; morphs: Morphology[]; cfg: FieldCfg }) {
  const grp = useRef<THREE.Group>(null);
  const geos = useMemo(() => morphs.map(m => branchesToTubes(m, m.branches.filter(b => b.type !== 'axon'), cfg.cellR, 4, 1.5)).filter((g): g is THREE.BufferGeometry => !!g), [morphs, cfg.cellR]);
  const mat = useMemo(() => createSoftMembrane(cfg.tint, 0.34, '#7CF5C6'), [cfg.tint]);
  useEffect(() => () => { geos.forEach(g => g.dispose()); mat.dispose(); }, [geos]);
  const places = useMemo(() => {
    if (!geos.length) return [] as { gi: number; pos: [number, number, number]; rot: [number, number, number]; s: number }[];
    const rng = rngFor(cfg.seed); const arr: { gi: number; pos: [number, number, number]; rot: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < cfg.count; i++) {
      const gi = i % geos.length;
      const x = cfg.vertical ? (Math.round((rng() - 0.5) * 4) * (cfg.spread / 5)) + (rng() - 0.5) * 0.4 : (rng() - 0.5) * cfg.spread;
      const y = (rng() - 0.5) * cfg.spread * (cfg.vertical ? 1.5 : 1.0);
      const z = cfg.vertical ? (Math.round((rng() - 0.5) * 4) * (cfg.spread / 5)) + (rng() - 0.5) * 0.4 : (rng() - 0.5) * cfg.spread;
      const rot: [number, number, number] = cfg.vertical ? [(rng() - 0.5) * 0.4, rng() * 6.28, (rng() - 0.5) * 0.3] : [rng() * 6.28, rng() * 6.28, rng() * 6.28];
      arr.push({ gi, pos: [x, y, z], rot, s: cfg.scaleMin + rng() * (cfg.scaleMax - cfg.scaleMin) });
    }
    return arr;
  }, [geos, cfg]);

  useFrame((state) => {
    const a = band(jGet(), ...cfg.win); const g = grp.current; if (!g) return;
    g.visible = a > 0.001;
    const t = state.clock.elapsedTime;
    mat.uniforms.uTime.value = t; mat.uniforms.uDim.value = a;
    mat.uniforms.uPulse.value.set(Math.sin(t * 0.6) * cfg.spread * 0.45, Math.cos(t * 0.45) * cfg.spread * 0.35, Math.sin(t * 0.8) * cfg.spread * 0.45);
    mat.uniforms.uPulseAmt.value = 0.7 * a; mat.uniforms.uPulseW.value = cfg.spread * 0.35;
    if (!g.visible) return;
    g.rotation.y = t * 0.02;
  });
  return (
    <group ref={grp}>
      {places.map((p, i) => <mesh key={i} geometry={geos[p.gi]} material={mat} position={p.pos} rotation={p.rot} scale={p.s} />)}
    </group>
  );
}
const REGION_CFG: FieldCfg = { win: WIN.region, count: 14, spread: 5.5, cellR: 1.5, vertical: true, tint: '#5fb0ff', seed: 11, scaleMin: 0.8, scaleMax: 1.2 };
const TISSUE_CFG: FieldCfg = { win: WIN.tissue, count: 30, spread: 4.6, cellR: 1.1, vertical: false, tint: '#8fd0e6', seed: 27, scaleMin: 0.55, scaleMax: 1.05 };
function RegionStageGroup({ jGet, morphs }: { jGet: () => number; morphs: Morphology[] }) {
  return morphs.length ? <NeuropilField jGet={jGet} morphs={morphs} cfg={REGION_CFG} />
    : <TissueOrRegionField jGet={jGet} win={WIN.region} count={90} spread={7} columns palette={['#00d4ff', '#39a0ff', '#7CC5FF']} />;
}
function TissueStageGroup({ jGet, morphs }: { jGet: () => number; morphs: Morphology[] }) {
  return morphs.length ? <NeuropilField jGet={jGet} morphs={morphs} cfg={TISSUE_CFG} />
    : <TissueOrRegionField jGet={jGet} win={WIN.tissue} count={70} spread={5.2} columns={false} palette={['#7CF5C6', '#00d4ff', '#C084FC', '#7CC5FF']} />;
}

function SwcNeuron({ jGet, morph }: { jGet: () => number; morph: Morphology }) {
  const grp = useRef<THREE.Group>(null);
  const apMesh = useRef<THREE.Mesh>(null);
  const spineMesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useTmp();
  const R = 2.6;

  const dendGeo = useMemo(() => branchesToTubes(morph, morph.branches.filter(b => b.type !== 'axon'), R, 6, 1.6), [morph]);
  const axonGeo = useMemo(() => branchesToTubes(morph, morph.branches.filter(b => b.type === 'axon'), R, 5, 1.3), [morph]);
  const somaR = useMemo(() => Math.max(0.14, (morph.soma.r / morph.radius) * R * 1.4), [morph]);
  const spines = useMemo(() => spineAnchors(morph, R, 500), [morph]);
  const anchors = useMemo(() => {
    const scale = R / morph.radius;
    const sc = (v: THREE.Vector3) => v.clone().sub(morph.center).multiplyScalar(scale);
    const dend = morph.branches.filter(b => b.type !== 'axon' && b.type !== 'soma');
    const axon = morph.branches.filter(b => b.type === 'axon');
    let apical = new THREE.Vector3(0, R * 0.7, 0), basal = new THREE.Vector3(-R * 0.35, -R * 0.15, 0), axonTip = new THREE.Vector3(0, -R * 0.7, 0);
    let maxD = -1, bestBasal = 1e9, maxA = -1;
    for (const b of dend) { const tip = sc(b.points[b.points.length - 1]); const d = tip.length(); if (d > maxD) { maxD = d; apical = tip; } if (tip.y < 0.2 && tip.length() < bestBasal) { bestBasal = tip.length(); basal = tip; } }
    for (const b of axon) { const tip = sc(b.points[b.points.length - 1]); const d = tip.length(); if (d > maxA) { maxA = d; axonTip = tip; } }
    const spine = spines.length ? spines[(spines.length * 0.5) | 0].pos.clone() : new THREE.Vector3(R * 0.4, R * 0.3, 0);
    const out = (v: THREE.Vector3, k: number) => v.clone().add(v.clone().setLength(1).multiplyScalar(k));
    return { apical, basal, axonTip, spine, out };
  }, [morph, spines]);
  const dendMat = useMemo(() => createSoftMembrane('#7CC5FF', 0.55, '#eafcff'), []);
  const axonMat = useMemo(() => createSoftMembrane('#9fb4d6', 0.4, '#eafcff'), []);
  const somaMat = useMemo(() => createSoftMembrane('#8fd0ff', 0.7, '#eafcff'), []);
  const apPath = useMemo(() => {
    const scale = R / morph.radius;
    const pick = (types: string[]) => morph.branches.filter(b => types.includes(b.type)).sort((a, b) => b.points.length - a.points.length)[0];
    const dend = pick(['apical', 'basal', 'dendrite']); const axon = pick(['axon']);
    const pts: THREE.Vector3[] = [];
    if (dend) for (let i = dend.points.length - 1; i >= 0; i--) pts.push(dend.points[i].clone().sub(morph.center).multiplyScalar(scale));
    pts.push(new THREE.Vector3(0, 0, 0));
    if (axon) for (const p of axon.points) pts.push(p.clone().sub(morph.center).multiplyScalar(scale));
    return pts.length >= 2 ? new THREE.CatmullRomCurve3(pts) : null;
  }, [morph]);
  const apT = useRef(0);

  useEffect(() => () => {
    dendGeo?.dispose(); axonGeo?.dispose(); dendMat.dispose(); axonMat.dispose(); somaMat.dispose();
  }, []);
  useEffect(() => {
    const m = spineMesh.current; if (!m) return;
    for (let i = 0; i < spines.length; i++) {
      const s = spines[i]; const p = s.pos.clone().addScaledVector(s.normal, 0.02);
      const sc = 0.018 + 0.012 * ((i * 9301 % 100) / 100);
      tmp.m.compose(p, tmp.q.identity(), tmp.s.set(sc, sc, sc)); m.setMatrixAt(i, tmp.m);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [spines]);

  useFrame((state, dt) => {
    dt = Math.min(0.05, dt); const a = band(jGet(), ...WIN.neuron); const g = grp.current; if (!g) return;
    g.visible = a > 0.001;
    const t = state.clock.elapsedTime;
    [dendMat, axonMat, somaMat].forEach(m => { m.uniforms.uTime.value = t; m.uniforms.uDim.value = a; });
    if (!g.visible) return;
    g.rotation.y = 0.5 + Math.sin(t * 0.06) * 0.5;
    g.updateMatrixWorld();
    apT.current += dt / 2.6; if (apT.current > 1.15) apT.current = 0;
    if (apPath) {
      const u = clamp01(apT.current); const p = apPath.getPointAt(u);
      const wp = p.clone().applyMatrix4(g.matrixWorld);
      const amt = apT.current <= 1 ? 0.95 * a : 0;
      dendMat.uniforms.uPulse.value.copy(wp); dendMat.uniforms.uPulseAmt.value = amt; dendMat.uniforms.uPulseW.value = 0.6;
      axonMat.uniforms.uPulse.value.copy(wp); axonMat.uniforms.uPulseAmt.value = amt; axonMat.uniforms.uPulseW.value = 0.6;
      somaMat.uniforms.uPulse.value.copy(wp); somaMat.uniforms.uPulseAmt.value = amt;
      if (apMesh.current) { apMesh.current.visible = apT.current <= 1 && a > 0.2; apMesh.current.position.copy(p); apMesh.current.scale.setScalar((0.05 + 0.02 * Math.sin(t * 24)) * a); }
    }
  });

  return (
    <group ref={grp} position={[0, 0, 0]}>
      {dendGeo && <mesh geometry={dendGeo} material={dendMat} />}
      {axonGeo && <mesh geometry={axonGeo} material={axonMat} />}
      <mesh material={somaMat}><icosahedronGeometry args={[somaR, 3]} /></mesh>
      <instancedMesh ref={spineMesh} args={[undefined as any, undefined as any, Math.max(1, spines.length)]}>
        <icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#9fe0ff" toneMapped={false} transparent opacity={0.75} />
      </instancedMesh>
      <mesh ref={apMesh}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#eafcff" toneMapped={false} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <Callout jGet={jGet} stage="neuron" from={[0, somaR * 0.6, 0]} to={[-1.6, 0.4, 0]} text="Soma (cell body)" col="#8fd0ff" />
      <Callout jGet={jGet} stage="neuron" from={anchors.apical.toArray()} to={anchors.out(anchors.apical, 1.4).toArray()} text="Apical dendrite" col="#7CC5FF" />
      <Callout jGet={jGet} stage="neuron" from={anchors.basal.toArray()} to={anchors.out(anchors.basal, 1.3).toArray()} text="Basal dendrites" col="#9AE6FF" />
      <Callout jGet={jGet} stage="neuron" from={anchors.axonTip.toArray()} to={anchors.out(anchors.axonTip, 1.2).toArray()} text="Axon → (to next cells)" col="#9fb4d6" />
      <Callout jGet={jGet} stage="neuron" from={anchors.spine.toArray()} to={anchors.out(anchors.spine, 1.3).toArray()} text="Dendritic spines: learning sites" col="#7CF5C6" />
    </group>
  );
}
function ProceduralNeuron({ jGet }: { jGet: () => number }) {
  const grp = useRef<THREE.Group>(null);
  const hero = useMemo<NeuronMesh>(() => buildPyramidalNeuron({ growth: 0.7, seed: 3, regionId: 2 }), []);
  const mat = useMemo(() => createMembraneMaterial({ accent: '#7CC5FF', opacity: 0.9 }), []);
  const myMat = useMemo(() => createMyelinMaterial(), []);
  const apMesh = useRef<THREE.Mesh>(null); const apT = useRef(0);
  useEffect(() => () => { hero.membrane.dispose(); hero.myelin.dispose(); mat.dispose(); myMat.dispose(); }, []);
  useFrame((state, dt) => {
    dt = Math.min(0.05, dt); const a = band(jGet(), ...WIN.neuron); const g = grp.current; if (!g) return;
    g.visible = a > 0.001; mat.uniforms.uDim.value = a; myMat.uniforms.uDim.value = a; if (!g.visible) return;
    const t = state.clock.elapsedTime; mat.uniforms.uTime.value = t; mat.uniforms.uActivity.value = 0.5; myMat.uniforms.uTime.value = t;
    g.rotation.y = -0.25 + Math.sin(t * 0.1) * 0.12;
    apT.current += dt / 1.6; if (apT.current > 1.25) apT.current = 0;
    const p = hero.axonCurve.getPointAt(Math.min(1, apT.current));
    if (apMesh.current) {
      apMesh.current.visible = apT.current <= 1; apMesh.current.position.copy(p); apMesh.current.scale.setScalar((0.12 + 0.04 * Math.sin(t * 30)) * a);
      mat.uniforms.uPulseWorld.value.copy(p); mat.uniforms.uPulseAmt.value = apT.current <= 1 ? 0.9 * a : mat.uniforms.uPulseAmt.value * 0.9;
    }
  });
  return (
    <group ref={grp} position={[-1.4, 0.3, 0]}>
      <mesh geometry={hero.membrane} material={mat} />
      {hero.myelin.attributes.position && <mesh geometry={hero.myelin} material={myMat} />}
      <mesh ref={apMesh}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#eafcff" toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <StageLabel jGet={jGet} id="neuron" pos={new THREE.Vector3(0, 0.7, 0)} text="Soma" col="#7CC5FF" />
      <StageLabel jGet={jGet} id="neuron" pos={hero.terminal.clone().add(new THREE.Vector3(0.2, 0.4, 0))} text="Axon terminal →" col="#7CF5C6" />
    </group>
  );
}
function NeuronStageGroup({ jGet, morph }: { jGet: () => number; morph: Morphology | null }) {
  return morph ? <SwcNeuron jGet={jGet} morph={morph} /> : <ProceduralNeuron jGet={jGet} />;
}

type PhaseId = 'baseline' | 'tetanus' | 'unblock' | 'ca' | 'camkii' | 'ampa' | 'grow' | 'potentiated';
interface Phase { id: PhaseId; dur: number; title: string; datum: LearningDatum | null }
const PHASES: Phase[] = [
  { id: 'baseline', dur: 5.5, title: 'A normal signal', datum: { label: 'Baseline release probability', value: '≈ 0.1–0.4 per spike', cite: 'Branco & Staras 2009, Nat Rev Neurosci' } },
  { id: 'tetanus', dur: 4.5, title: 'Fire together, repeatedly: the Hebbian rule', datum: { label: 'Coincidence window (pre→post)', value: '≈ 20 ms → strengthen', cite: 'Bi & Poo 1998, J Neurosci' } },
  { id: 'unblock', dur: 3.6, title: 'The coincidence detector unlocks', datum: { label: 'NMDA Mg²⁺ block relieved at', value: '≈ −40 mV depolarization', cite: 'Nowak et al. 1984, Nature' } },
  { id: 'ca', dur: 4.2, title: 'Calcium: the learning trigger', datum: { label: 'Spine Ca²⁺ transient', value: '≈ 1 µM (from ~70 nM rest)', cite: 'Sabatini et al. 2002, Nature' } },
  { id: 'camkii', dur: 3.6, title: 'CaMKII flips the memory switch', datum: { label: 'CaMKII holoenzyme', value: '12 subunits, self-locks ON', cite: 'Lisman et al. 2012, Nat Rev Neurosci' } },
  { id: 'ampa', dur: 5.5, title: 'New AMPA receptors are installed', datum: { label: 'AMPA receptors in this spine', value: 'increasing', cite: 'Malinow & Malenka 2002, Annu Rev Neurosci' } },
  { id: 'grow', dur: 4.4, title: 'The dendritic spine grows', datum: { label: 'Spine head volume', value: '≈ +80% (can reach ~2×)', cite: 'Matsuzaki et al. 2004, Nature' } },
  { id: 'potentiated', dur: 5.5, title: 'Learned: the response is now about 2× larger', datum: { label: 'LTP magnitude', value: 'EPSP ≈ +100%, lasts hours to days', cite: 'Bliss & Lømo 1973, J Physiol' } },
];

function tubeBetween(top: THREE.Vector3, bottom: THREE.Vector3, rTop: number, rBot: number): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(top, bottom); const len = dir.length();
  const g = new THREE.CylinderGeometry(rTop, rBot, len, 14, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(YAXIS, dir.clone().normalize()));
  g.translate((top.x + bottom.x) / 2, (top.y + bottom.y) / 2, (top.z + bottom.z) / 2);
  return g;
}

function LearningSynapse({ jGet, onEvent, onData }: { jGet: () => number; onEvent: (l: string) => void; onData: (d: LearningDatum | null) => void }) {
  const grp = useRef<THREE.Group>(null);
  const tmp = useTmp();

  const TERM = useMemo(() => new THREE.Vector3(-1.05, 0, 0), []);
  const SH = useMemo(() => new THREE.Vector3(0.9, 0, 0), []);
  const termR = 0.45, headR0 = 0.5;
  const AZ = useMemo(() => new THREE.Vector3(TERM.x + termR - 0.02, 0, 0), [TERM]);
  const cleftDir = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const neckGeo = useMemo(() => tubeBetween(new THREE.Vector3(SH.x, SH.y - headR0 * 0.7, SH.z), new THREE.Vector3(1.4, -1.05, 0), 0.14, 0.2), [SH]);
  useEffect(() => () => neckGeo.dispose(), [neckGeo]);

  const termMat = useMemo(() => createSoftMembrane('#3a5f95', 0.4, '#e6f5ff'), []);
  const spineMat = useMemo(() => createSoftMembrane('#6a4bb0', 0.42, '#FFD470'), []);
  const neckMat = useMemo(() => createSoftMembrane('#473672', 0.42, '#FFD470'), []);
  const dendMat = useMemo(() => createSoftMembrane('#3c2f5c', 0.4, '#FFD470'), []);
  const azMat = useMemo(() => createSoftMembrane('#6f96d0', 0.75, '#eaf4ff'), []);
  useEffect(() => () => [termMat, spineMat, neckMat, dendMat, azMat].forEach(m => m.dispose()), []);
  const termGlow = useRef(0);

  const N_NMDA = 6, REC_MAX = 24;
  const recDirs = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < REC_MAX; i++) { const ang = i * 2.399963, rr = Math.sqrt(i / REC_MAX); arr.push(new THREE.Vector3(Math.cos(ang) * rr, Math.sin(ang) * rr, 0)); }
    return arr;
  }, []);
  const headScale = useRef(1);
  const recSpread = useRef(0.3);
  const recFaceX = () => SH.x - headR0 * headScale.current * 0.82;
  const recPos = (i: number, out: THREE.Vector3) => out.set(recFaceX(), SH.y + recDirs[i].y * recSpread.current, SH.z + recDirs[i].x * recSpread.current);

  const ampaCount = useRef(6);
  const recLit = useRef<Float32Array>(new Float32Array(REC_MAX));
  const recScale = useRef<Float32Array>(new Float32Array(REC_MAX).fill(1));
  const mgIn = useRef<boolean[]>(new Array(N_NMDA).fill(true));
  const spineCa = useRef(0);
  const camkii = useRef(0);
  const postVolt = useRef(0);
  const cycle = useRef(0);

  const GLU = 80, CA = 60, NA = 60, VES = 16;
  type P = { p: THREE.Vector3; v: THREE.Vector3; life: number; age: number; vis: number; bound: number };
  const glu = useRef<P[]>([]);
  const ca = useRef<P[]>([]);
  const na = useRef<P[]>([]);
  const mg = useRef<{ p: THREE.Vector3; v: THREE.Vector3; out: boolean; life: number }[]>(Array.from({ length: N_NMDA }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), out: false, life: 0 })));
  const vesicles = useMemo(() => { const rng = rngFor(5); return Array.from({ length: VES }, () => { const d = new THREE.Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).multiplyScalar(0.26); return { home: TERM.clone().add(d), pos: TERM.clone().add(d), docked: false, fuse: 0, used: false }; }); }, [TERM]);

  const gluMesh = useRef<THREE.InstancedMesh>(null);
  const caMesh = useRef<THREE.InstancedMesh>(null);
  const naMesh = useRef<THREE.InstancedMesh>(null);
  const mgMesh = useRef<THREE.InstancedMesh>(null);
  const vesMesh = useRef<THREE.InstancedMesh>(null);
  const recChan = useRef<THREE.InstancedMesh>(null);
  const recKnob = useRef<THREE.InstancedMesh>(null);
  const spineMesh = useRef<THREE.Mesh>(null);
  const psdMesh = useRef<THREE.Mesh>(null);
  const apMesh = useRef<THREE.Mesh>(null);
  const camkiiMesh = useRef<THREE.InstancedMesh>(null);
  const CAMKII_N = 5;
  const AMPA_COL = useMemo(() => new THREE.Color('#38E0FF'), []);
  const NMDA_COL = useMemo(() => new THREE.Color('#B57BFF'), []);
  const recQuat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(YAXIS, XAXIS), []);

  const phaseIdx = useRef(0);
  const phaseT = useRef(0);
  const apProg = useRef(2);
  const started = useRef(false);

  const spawn = (arr: P[], cap: number, from: THREE.Vector3, dir: THREE.Vector3, n: number, spd: number, rng: () => number) => {
    for (let k = 0; k < n && arr.length < cap; k++) {
      const jit = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).multiplyScalar(0.5);
      arr.push({ p: from.clone(), v: dir.clone().add(jit).normalize().multiplyScalar(spd * (0.7 + rng() * 0.6)), life: 1, age: 0, vis: 0, bound: -1 });
    }
  };
  const stepVis = (p: P, dt: number) => { p.age += dt; p.vis = clamp01(p.age * 7) * clamp01(p.life); };

  const enterPhase = (idx: number) => {
    phaseIdx.current = idx; phaseT.current = 0;
    const ph = PHASES[idx];
    onEvent(ph.title);
    if (ph.id === 'ampa') onData({ ...ph.datum!, value: `${ampaCount.current} → growing...` });
    else onData(ph.datum);
    if (ph.id === 'baseline') {
      spineCa.current = 0; camkii.current = 0; postVolt.current = 0;
      for (let i = 0; i < N_NMDA; i++) { mgIn.current[i] = true; mg.current[i].out = false; }
    }
  };

  useFrame((state, dt) => {
    dt = Math.min(0.05, dt);
    const a = band(jGet(), ...WIN.synapse); const g = grp.current; if (!g) return;
    g.visible = a > 0.001; if (!g.visible) return;
    const rng = Math.random;

    if (jGet() > 0.9 && !started.current) { started.current = true; enterPhase(0); }
    if (started.current) {
      phaseT.current += dt;
      const ph = PHASES[phaseIdx.current];
      const u = clamp01(phaseT.current / ph.dur);
      const id = ph.id;

      const wantAP = (id === 'baseline' && u < 0.05) || (id === 'tetanus' && Math.floor(phaseT.current / 0.7) !== Math.floor((phaseT.current - dt) / 0.7)) || (id === 'potentiated' && u < 0.05);
      if (wantAP) apProg.current = 0;

      apProg.current += dt / 0.35;
      if (apProg.current <= 1 && apMesh.current) {
        apMesh.current.visible = a > 0.2; apMesh.current.position.copy(new THREE.Vector3(-2.4, 0, 0).lerp(TERM, apProg.current));
        const fade = Math.sin(clamp01(apProg.current) * Math.PI);
        apMesh.current.scale.setScalar((0.06 + 0.05 * fade) * a);
        (apMesh.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * fade * a;
      } else if (apMesh.current) apMesh.current.visible = false;

      if (apProg.current >= 1 && apProg.current - dt / 0.35 < 1) {
        const v = vesicles.find(vv => !vv.docked && vv.fuse === 0);
        if (v) v.docked = true;
      }
      for (const v of vesicles) {
        if (v.docked && v.fuse < 1) {
          v.pos.lerp(AZ, 0.18);
          if (v.pos.distanceTo(AZ) < 0.09) v.fuse = Math.min(1, v.fuse + dt * 4);
          if (v.fuse >= 1 && !v.used) { v.used = true; termGlow.current = 1; const nGlu = id === 'tetanus' ? 16 : id === 'potentiated' ? 12 : 10; spawn(glu.current, GLU, AZ, cleftDir, nGlu, 0.9, rng); }
        }
      }
      for (const v of vesicles) if (v.used && rng() < 0.01) { v.used = false; v.docked = false; v.fuse = 0; v.pos.copy(v.home); }

      if (id === 'tetanus') postVolt.current = Math.min(1, postVolt.current + dt * 0.32);
      else if (id !== 'unblock' && id !== 'ca') postVolt.current = Math.max(id === 'potentiated' ? postVolt.current : 0, postVolt.current - dt * 0.25);

      if (id === 'unblock') {
        for (let i = 0; i < N_NMDA; i++) {
          if (mgIn.current[i] && u > (i / N_NMDA) * 0.7 && postVolt.current > 0.5) {
            mgIn.current[i] = false; mg.current[i].out = true; mg.current[i].life = 1;
            const rp = new THREE.Vector3(); recPos(i, rp);
            mg.current[i].p.copy(rp).addScaledVector(cleftDir, -0.05);
            mg.current[i].v.set(-0.5 - rng() * 0.3, (rng() - 0.5) * 0.6, (rng() - 0.5) * 0.6);
          }
        }
      }
      if (id === 'ca') {
        spineCa.current = Math.min(1, spineCa.current + dt * 0.4);
        if (rng() < 0.6) { const i = (rng() * N_NMDA) | 0; if (!mgIn.current[i]) { const rp = new THREE.Vector3(); recPos(i, rp); recLit.current[i] = 1; spawn(ca.current as any, CA, rp, new THREE.Vector3(1, (rng() - 0.5) * 0.4, (rng() - 0.5) * 0.4), 1, 1.1, rng); } }
      }
      if (id === 'camkii') camkii.current = Math.min(1, camkii.current + dt * 0.4);
      if (id === 'ampa') {
        const target = Math.min(REC_MAX - N_NMDA, 6 + 3 * Math.min(3, cycle.current + 1));
        if (ampaCount.current < target && rng() < 0.05) {
          const slot = N_NMDA + ampaCount.current;
          ampaCount.current++;
          if (slot < REC_MAX) { recScale.current[slot] = 0.01; recLit.current[slot] = 1; }
          onData({ ...ph.datum!, value: `${ampaCount.current} (was 6): stronger` });
        }
      }
      if (id === 'grow') {
        const target = Math.min(2.15, 1.25 + 0.22 * Math.min(4, cycle.current + 1));
        headScale.current += (target - headScale.current) * dt * 1.6;
        recSpread.current += (Math.min(0.5, 0.34 + 0.04 * cycle.current) - recSpread.current) * dt * 1.6;
      }
      if (id === 'potentiated') {
        postVolt.current = Math.min(1, postVolt.current + dt * 0.5 * u);
      }

      if (phaseT.current >= ph.dur) {
        const next = phaseIdx.current + 1;
        if (next >= PHASES.length) { cycle.current++; enterPhase(0); }
        else enterPhase(next);
      }
    }

    for (let i = glu.current.length - 1; i >= 0; i--) {
      const p = glu.current[i];
      if (p.bound >= 0) { const rp = new THREE.Vector3(); recPos(p.bound, rp); p.p.lerp(rp, 0.25); p.life -= dt * 0.3; }
      else {
        p.p.addScaledVector(p.v, dt); p.life -= dt * 0.6;
        if (p.p.x > recFaceX() - 0.15 && rng() < 0.08) {
          const ri = N_NMDA + ((rng() * ampaCount.current) | 0);
          p.bound = ri; recLit.current[ri] = 1;
          if (rng() < 0.7) { const rp = new THREE.Vector3(); recPos(ri, rp); spawn(na.current, NA, rp, new THREE.Vector3(1, (rng() - 0.5) * 0.5, (rng() - 0.5) * 0.5), 1, 1.0, rng); }
        }
      }
      stepVis(p, dt);
      if (p.life <= 0) glu.current.splice(i, 1);
    }
    for (let i = ca.current.length - 1; i >= 0; i--) { const p = ca.current[i]; p.p.addScaledVector(p.v, dt); p.life -= dt * 1.0; stepVis(p, dt); if (p.life <= 0) ca.current.splice(i, 1); }
    for (let i = na.current.length - 1; i >= 0; i--) { const p = na.current[i]; p.p.addScaledVector(p.v, dt); p.life -= dt * 1.1; stepVis(p, dt); if (p.life <= 0) na.current.splice(i, 1); }
    for (const m of mg.current) if (m.out) { m.p.addScaledVector(m.v, dt); m.life = Math.max(0, m.life - dt * 1.1); }
    for (let i = 0; i < REC_MAX; i++) { recLit.current[i] = Math.max(0, recLit.current[i] - dt * 1.0); recScale.current[i] = Math.min(1, recScale.current[i] + dt * 2.5); }
    termGlow.current = Math.max(0, termGlow.current - dt * 3.0);

    const rp = tmp.v;
    writePool(gluMesh.current, glu.current, GLU, 0.06, a, tmp);
    writePool(caMesh.current, ca.current, CA, 0.06, a, tmp);
    writePool(naMesh.current, na.current, NA, 0.05, a, tmp);
    if (vesMesh.current) { for (let i = 0; i < VES; i++) { const v = vesicles[i]; const s = (v.used ? 0 : 0.1 * (1 - v.fuse * 0.6)) * a; tmp.m.compose(s > 0.001 ? v.pos : HIDE, tmp.q.identity(), tmp.s.set(s, s, s)); vesMesh.current.setMatrixAt(i, tmp.m); } vesMesh.current.instanceMatrix.needsUpdate = true; }
    if (mgMesh.current) {
      for (let i = 0; i < N_NMDA; i++) {
        const m = mg.current[i]; let sf = 0; let pos = HIDE;
        if (mgIn.current[i]) { recPos(i, rp); pos = rp.clone().addScaledVector(cleftDir, -0.02); sf = 1; }
        else if (m.out && m.life > 0) { pos = m.p; sf = clamp01(m.life); }
        const s = 0.045 * sf * a; tmp.m.compose(pos, tmp.q.identity(), tmp.s.set(s, s, s)); mgMesh.current.setMatrixAt(i, tmp.m);
      }
      mgMesh.current.instanceMatrix.needsUpdate = true;
    }
    if (recChan.current && recKnob.current) {
      for (let i = 0; i < REC_MAX; i++) {
        const isNMDA = i < N_NMDA;
        const on = isNMDA ? true : (i - N_NMDA) < ampaCount.current;
        const lit = recLit.current[i]; const sc = recScale.current[i];
        recPos(i, rp);
        const chanS = (on ? (0.09 + 0.03 * lit) * sc : 0) * a;
        tmp.s.set(chanS * 0.55, chanS * 1.4, chanS * 0.55);
        tmp.m.compose(on ? rp : HIDE, recQuat, tmp.s); recChan.current.setMatrixAt(i, tmp.m);
        const knobPos = rp.clone().addScaledVector(cleftDir, -0.07 * sc);
        const knobS = (on ? (0.06 + 0.02 * lit) * sc : 0) * a; tmp.m.compose(on ? knobPos : HIDE, tmp.q.identity(), tmp.s.set(knobS, knobS, knobS)); recKnob.current.setMatrixAt(i, tmp.m);
        const col = tmp.c.copy(isNMDA ? NMDA_COL : AMPA_COL).lerp(new THREE.Color('#ffffff'), 0.5 * lit);
        recChan.current.setColorAt(i, col); recKnob.current.setColorAt(i, col);
      }
      recChan.current.instanceMatrix.needsUpdate = true; recKnob.current.instanceMatrix.needsUpdate = true;
      if (recChan.current.instanceColor) recChan.current.instanceColor.needsUpdate = true;
      if (recKnob.current.instanceColor) recKnob.current.instanceColor.needsUpdate = true;
    }
    if (camkiiMesh.current) {
      for (let i = 0; i < CAMKII_N; i++) {
        const ang = (i / CAMKII_N) * 6.28; const cpos = SH.clone().add(new THREE.Vector3(-headR0 * headScale.current * 0.35, Math.cos(ang) * 0.22, Math.sin(ang) * 0.22));
        const s = (0.06 + 0.03 * camkii.current) * a; tmp.m.compose(cpos, tmp.q.identity(), tmp.s.set(s, s, s)); camkiiMesh.current.setMatrixAt(i, tmp.m);
        camkiiMesh.current.setColorAt(i, tmp.c.set('#FFB020').lerp(new THREE.Color('#FFF0B0'), camkii.current));
      }
      camkiiMesh.current.instanceMatrix.needsUpdate = true; if (camkiiMesh.current.instanceColor) camkiiMesh.current.instanceColor.needsUpdate = true;
      (camkiiMesh.current.material as THREE.MeshBasicMaterial).opacity = a * (0.25 + 0.7 * camkii.current);
    }

    const t = state.clock.elapsedTime;
    termMat.uniforms.uTime.value = t; termMat.uniforms.uDim.value = a; termMat.uniforms.uGlow.value = 0.08 + 0.7 * termGlow.current;
    const spineGlow = clamp01(0.9 * spineCa.current + 0.55 * postVolt.current);
    spineMat.uniforms.uTime.value = t; spineMat.uniforms.uDim.value = a; spineMat.uniforms.uGlow.value = spineGlow;
    neckMat.uniforms.uDim.value = a; neckMat.uniforms.uGlow.value = 0.4 * spineCa.current;
    dendMat.uniforms.uDim.value = a; dendMat.uniforms.uGlow.value = 0.25 * spineCa.current;
    azMat.uniforms.uDim.value = a; azMat.uniforms.uGlow.value = 0.2 + 0.7 * termGlow.current;

    if (spineMesh.current) spineMesh.current.scale.lerp(tmp.s.set(headScale.current, headScale.current, headScale.current), 0.12);
    if (psdMesh.current) { psdMesh.current.position.x = recFaceX() + 0.02; psdMesh.current.scale.setScalar(headScale.current); (psdMesh.current.material as THREE.MeshBasicMaterial).opacity = a * (0.55 + 0.35 * spineGlow); }
  });

  return (
    <group ref={grp}>
      <mesh position={TERM.toArray()} material={termMat}><icosahedronGeometry args={[termR, 3]} /></mesh>
      <mesh position={AZ.toArray()} rotation={[0, 0, Math.PI / 2]} material={azMat}><cylinderGeometry args={[0.24, 0.24, 0.06, 24]} /></mesh>

      <mesh ref={spineMesh} position={SH.toArray()} material={spineMat}><icosahedronGeometry args={[headR0, 4]} /></mesh>
      <mesh geometry={neckGeo} material={neckMat} />
      <mesh position={[1.45, -1.6, 0]} rotation={[0, 0, 0.06]} material={dendMat}><cylinderGeometry args={[0.34, 0.4, 1.3, 20]} /></mesh>
      <mesh ref={psdMesh} position={[recFaceX() + 0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.34, 0.34, 0.05, 28]} /><meshBasicMaterial color="#9a6fe0" toneMapped={false} transparent opacity={0.6} /></mesh>

      <mesh ref={apMesh}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#a9dcff" toneMapped={false} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>

      <instancedMesh ref={vesMesh} args={[undefined as any, undefined as any, VES]}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#8ab4ff" toneMapped={false} transparent opacity={0.9} /></instancedMesh>
      <instancedMesh ref={gluMesh} args={[undefined as any, undefined as any, GLU]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#7CF5C6" toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} /></instancedMesh>
      <instancedMesh ref={caMesh} args={[undefined as any, undefined as any, CA]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#FFD86B" toneMapped={false} transparent opacity={0.98} blending={THREE.AdditiveBlending} depthWrite={false} /></instancedMesh>
      <instancedMesh ref={naMesh} args={[undefined as any, undefined as any, NA]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#8ecbff" toneMapped={false} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} /></instancedMesh>
      <instancedMesh ref={mgMesh} args={[undefined as any, undefined as any, N_NMDA]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#E6C2FF" toneMapped={false} transparent opacity={0.95} /></instancedMesh>
      <instancedMesh ref={recChan} args={[undefined as any, undefined as any, REC_MAX]}><cylinderGeometry args={[1, 0.7, 1, 8]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.95} /></instancedMesh>
      <instancedMesh ref={recKnob} args={[undefined as any, undefined as any, REC_MAX]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.9} /></instancedMesh>
      <instancedMesh ref={camkiiMesh} args={[undefined as any, undefined as any, CAMKII_N]}><dodecahedronGeometry args={[1, 0]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.4} /></instancedMesh>

      <Callout jGet={jGet} from={[-1.15, 0.3, 0.2]} to={[-2.15, 1.35, 0]} text="Axon terminal" col="#8ab4ff" />
      <Callout jGet={jGet} from={[-1.25, -0.25, 0.1]} to={[-2.35, -0.55, 0]} text="Synaptic vesicles" col="#8ab4ff" />
      <Callout jGet={jGet} from={[-0.58, 0, 0.12]} to={[-1.55, 0.95, 0]} text="Active zone" col="#bfe0ff" />
      <Callout jGet={jGet} from={[0.05, -0.05, 0.1]} to={[-1.5, -1.35, 0]} text="Synaptic cleft (~20 nm)" col="#7CF5C6" />
      <Callout jGet={jGet} from={[0.44, 0.3, 0.18]} to={[0.15, 1.6, 0]} text="NMDA receptor: coincidence detector" col="#B57BFF" />
      <Callout jGet={jGet} from={[0.46, -0.26, 0.18]} to={[2.0, -1.35, 0]} text="AMPA receptor: carries the signal" col="#38E0FF" />
      <Callout jGet={jGet} from={[0.95, 0.45, 0]} to={[2.4, -0.55, 0]} text="Dendritic spine: grows with LTP" col="#C79BFF" />
    </group>
  );
}

function writePool(mesh: THREE.InstancedMesh | null, arr: { p: THREE.Vector3; vis: number }[], cap: number, size: number, a: number, tmp: ReturnType<typeof useTmp>) {
  if (!mesh) return;
  for (let i = 0; i < cap; i++) {
    const p = arr[i]; const s = p ? size * clamp01(p.vis) * a : 0;
    tmp.m.compose(p ? p.p : HIDE, tmp.q.identity(), tmp.s.set(s, s, s)); mesh.setMatrixAt(i, tmp.m);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function StageLabel({ jGet, id, pos, text, col, df = 9 }: { jGet: () => number; id: StageId; pos: THREE.Vector3; text: string; col: string; df?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => { const a = band(jGet(), ...WIN[id]); if (ref.current) ref.current.style.opacity = String(clamp01((a - 0.35) / 0.4)); });
  return (
    <Html position={[pos.x, pos.y, pos.z]} center distanceFactor={df} style={{ pointerEvents: 'none' }}>
      <div ref={ref} style={{ whiteSpace: 'nowrap', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 0.2s', fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: col, background: 'rgba(6,10,20,0.82)', border: `1px solid ${col}55`, borderRadius: 7, padding: '3px 8px', backdropFilter: 'blur(4px)' }}>{text}</div>
    </Html>
  );
}

export default function CinematicJourney({ paused = false, onState }: { paused?: boolean; onState?: (s: JourneyState) => void }) {
  const [playing, setPlaying] = useState(true);
  const [replayToken, setReplayToken] = useState(0);
  const stateRef = useRef<JourneyState>({ stage: 'brain', progress: 0, event: '', data: null });
  const emit = (patch: Partial<JourneyState>) => { stateRef.current = { ...stateRef.current, ...patch }; onState?.(stateRef.current); };

  const { geometry: corticalGeo, source: cortexSrc } = useCorticalMesh(2.1);
  const { morphs, source: neuronSrc } = useMorphologies();
  const heroMorph = morphs[0] ?? null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0.4, 9.5], fov: 42, near: 0.05, far: 200 }} dpr={[1, 1.8]} gl={{ antialias: false, powerPreference: 'high-performance' }} frameloop={paused ? 'never' : 'always'} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; }}>
        <Scene playing={playing && !paused} replayToken={replayToken} corticalGeo={corticalGeo} heroMorph={heroMorph} morphs={morphs}
          onProgress={(progress, stage) => emit({ progress, stage })} onEvent={(event) => emit({ event })} onData={(data) => emit({ data })} />
      </Canvas>
      <JourneyControls playing={playing} onToggle={() => setPlaying(p => !p)} onReplay={() => { setReplayToken(x => x + 1); setPlaying(true); }} />
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, fontSize: 10, color: '#64748b', textAlign: 'right', lineHeight: 1.5, pointerEvents: 'none' }}>
        <div>cortex: {cortexSrc === 'asset' ? 'real mesh ✓' : 'procedural'}</div>
        <div>neurons: {neuronSrc === 'asset' ? `${morphs.length} reconstruction${morphs.length > 1 ? 's' : ''} ✓` : 'procedural'}</div>
      </div>
    </div>
  );
}
function JourneyControls({ playing, onToggle, onReplay }: { playing: boolean; onToggle: () => void; onReplay: () => void }) {
  return (
    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 5 }}>
      <button onClick={onToggle} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/15 bg-black/50 text-slate-200 backdrop-blur hover:bg-black/70">{playing ? 'Pause' : 'Play'}</button>
      <button onClick={onReplay} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/15 bg-black/50 text-slate-200 backdrop-blur hover:bg-black/70">Replay from brain</button>
    </div>
  );
}
