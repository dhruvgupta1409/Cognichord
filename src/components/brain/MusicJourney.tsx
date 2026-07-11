import { forwardRef, useImperativeHandle, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Postprocessing from './Postprocessing';
import { useMorphologies } from '../../lib/assets';
import { branchesToTubes, type Morphology } from '../../lib/swc';
import type { SystemId } from '../../lib/learningModel';

export interface MusicJourneyHandle {
  note: (pitch: number, velocity: number) => void;
  drive: (engagement: Partial<Record<SystemId, number>>, activity: number) => void;
}
interface Refs { queue: { pitch: number; vel: number }[]; eng: Record<string, number>; activity: number; }

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const pitchNorm = (p: number) => clamp01((p - 24) / (96 - 24));
function pitchColor(pitch: number, out: THREE.Color) {
  const n = pitchNorm(pitch); const lo = new THREE.Color('#ff8a4c'), mid = new THREE.Color('#7CF5C6'), hi = new THREE.Color('#4fd0ff');
  if (n < 0.5) out.copy(lo).lerp(mid, n * 2); else out.copy(mid).lerp(hi, (n - 0.5) * 2); return out;
}

function membrane(tint: string, opacity = 0.6, glowCol = '#eafcff'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, extensions: { derivatives: true } as any,
    uniforms: {
      uTime: { value: 0 }, uTint: { value: new THREE.Color(tint) }, uDim: { value: 1 }, uGlow: { value: 0 },
      uGlowCol: { value: new THREE.Color(glowCol) }, uPulse: { value: new THREE.Vector3(999, 999, 999) }, uPulseAmt: { value: 0 }, uPulseW: { value: 0.7 },
    },
    vertexShader: `varying vec3 vW; varying vec3 vV; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz; vV=cameraPosition-wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `precision highp float; uniform float uTime,uDim,uGlow,uPulseAmt,uPulseW; uniform vec3 uTint,uGlowCol,uPulse; varying vec3 vW; varying vec3 vV;
      void main(){ vec3 N=normalize(cross(dFdx(vW),dFdy(vW))); vec3 V=normalize(vV); if(dot(N,V)<0.0)N=-N;
        float fres=pow(1.0-max(dot(N,V),0.0),2.3); float diff=clamp(dot(N,vec3(0.35,0.8,0.5))*0.5+0.5,0.0,1.0);
        vec3 col=uTint*(0.22+0.5*diff)+uTint*fres*1.1; col+=uGlowCol*uGlow*(0.5+0.9*fres);
        float d=distance(vW,uPulse); float w=uPulseAmt*exp(-(d*d)/(uPulseW*uPulseW)); col+=(uGlowCol*0.85+uTint*0.4)*w*(0.6+0.7*fres);
        gl_FragColor=vec4(col*uDim, clamp((${opacity.toFixed(3)}+fres*0.4+uGlow*0.3+w*0.4)*uDim,0.0,0.98)); }`,
  });
}

function Lab({ pos, text, col, df = 6 }: { pos: [number, number, number]; text: string; col: string; df?: number }) {
  return (
    <Html position={pos} center distanceFactor={df} style={{ pointerEvents: 'none' }}>
      <div style={{ whiteSpace: 'nowrap', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: '#e7edf6', textShadow: '0 1px 4px #000', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: 9, background: col, boxShadow: `0 0 6px ${col}` }} />{text}
      </div>
    </Html>
  );
}

const HIDE = new THREE.Vector3(0, -9999, 0);
function useTmp() { return useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), v: new THREE.Vector3(), v2: new THREE.Vector3(), c: new THREE.Color() }), []); }
const YA = new THREE.Vector3(0, 1, 0);

function CochleaChapter({ refs }: { refs: Refs }) {
  const tmp = useTmp();
  const N = 26;
  const xAt = (i: number) => -3.4 + (i / (N - 1)) * 6.8;
  const pitchToIndex = (p: number) => Math.round((1 - pitchNorm(p)) * (N - 1));
  const yBase = -0.6;
  const bodies = useRef<THREE.InstancedMesh>(null);
  const cilia = useRef<THREE.InstancedMesh>(null);
  const nt = useRef<THREE.InstancedMesh>(null);
  const defl = useRef<Float32Array>(new Float32Array(N));
  const lit = useRef<Float32Array>(new Float32Array(N));
  const wave = useRef<{ x: number; target: number; vel: number; life: number }[]>([]);
  const NT = 70; const parts = useMemo(() => Array.from({ length: NT }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, col: new THREE.Color() })), []);
  const membMat = useMemo(() => membrane('#6f96d0', 0.5), []);
  useEffect(() => () => membMat.dispose(), []);

  const membGeo = useMemo(() => {
    const pts = []; for (let i = 0; i <= 40; i++) { const x = -3.6 + (i / 40) * 7.2; pts.push(new THREE.Vector3(x, yBase - 0.15 - 0.25 * Math.sin((i / 40) * Math.PI), 0)); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.14, 8, false);
  }, []);
  useEffect(() => () => membGeo.dispose(), [membGeo]);

  useFrame((state, dt) => {
    dt = Math.min(0.05, dt); const t = state.clock.elapsedTime; membMat.uniforms.uTime.value = t;
    let drained = 0; while (refs.queue.length && drained < 4) { const n = refs.queue.shift()!; drained++; const idx = pitchToIndex(n.pitch); wave.current.push({ x: -3.6, target: xAt(idx), vel: 6 + n.vel * 3, life: 1 }); }
    for (let w = wave.current.length - 1; w >= 0; w--) { const wv = wave.current[w]; wv.x += wv.vel * dt; if (wv.x >= wv.target || wv.life <= 0) { const idx = Math.round((wv.target + 3.4) / 6.8 * (N - 1)); if (idx >= 0 && idx < N) { defl.current[idx] = 1; lit.current[idx] = 1; for (let k = 0; k < 4; k++) { const pp = parts.find(p => p.life <= 0); if (pp) { pp.p.set(xAt(idx), yBase + 0.05, 0); pp.v.set((Math.random() - 0.5) * 0.4, -0.8 - Math.random() * 0.6, (Math.random() - 0.5) * 0.4); pp.life = 1; pitchColor((1 - idx / (N - 1)) * 72 + 24, pp.col); } } } wave.current.splice(w, 1); } }
    for (let i = 0; i < N; i++) { defl.current[i] = Math.max(0, defl.current[i] - dt * 2.5); lit.current[i] = Math.max(0, lit.current[i] - dt * 1.6); }

    const bm = bodies.current, cm = cilia.current;
    if (bm && cm) {
      for (let i = 0; i < N; i++) {
        const x = xAt(i), l = lit.current[i];
        tmp.m.compose(tmp.v.set(x, yBase + 0.18, 0), tmp.q.identity(), tmp.s.set(0.1, 0.22, 0.1)); bm.setMatrixAt(i, tmp.m);
        bm.setColorAt(i, tmp.c.set('#8fd0ff').lerp(new THREE.Color('#ffffff'), l));
        const tilt = defl.current[i] * 0.6 * Math.sin(t * 20);
        for (let k = 0; k < 3; k++) {
          const idx = i * 3 + k;
          tmp.q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt + (k - 1) * 0.15);
          tmp.v.set(x + (k - 1) * 0.04, yBase + 0.38 + k * 0.02, 0);
          tmp.m.compose(tmp.v, tmp.q, tmp.s.set(0.02, 0.14 + k * 0.02, 0.02)); cm.setMatrixAt(idx, tmp.m);
          cm.setColorAt(idx, tmp.c.set('#bfe6ff').lerp(new THREE.Color('#ffffff'), l));
        }
      }
      bm.instanceMatrix.needsUpdate = true; cm.instanceMatrix.needsUpdate = true;
      if (bm.instanceColor) bm.instanceColor.needsUpdate = true; if (cm.instanceColor) cm.instanceColor.needsUpdate = true;
    }
    const nm = nt.current;
    if (nm) { for (let i = 0; i < NT; i++) { const p = parts[i]; if (p.life > 0) { p.p.addScaledVector(p.v, dt); p.life -= dt * 1.4; const s = 0.03 * clamp01(p.life); tmp.m.compose(p.p, tmp.q.identity(), tmp.s.set(s, s, s)); nm.setMatrixAt(i, tmp.m); nm.setColorAt(i, p.col); } else { tmp.m.compose(HIDE, tmp.q.identity(), tmp.s.set(0.0001, 0.0001, 0.0001)); nm.setMatrixAt(i, tmp.m); } } nm.instanceMatrix.needsUpdate = true; if (nm.instanceColor) nm.instanceColor.needsUpdate = true; }
  });

  return (
    <group>
      <ambientLight intensity={0.5} /><pointLight position={[4, 6, 8]} intensity={0.8} color="#cfe6ff" />
      <mesh geometry={membGeo} material={membMat} />
      <instancedMesh ref={bodies} args={[undefined as any, undefined as any, N]}><cylinderGeometry args={[0.6, 0.9, 1.6, 10]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.85} /></instancedMesh>
      <instancedMesh ref={cilia} args={[undefined as any, undefined as any, N * 3]}><cylinderGeometry args={[0.35, 0.7, 1, 6]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.95} /></instancedMesh>
      <instancedMesh ref={nt} args={[undefined as any, undefined as any, NT]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} /></instancedMesh>
      <Lab pos={[0, 1.0, 0]} text="Hair cells (organ of Corti)" col="#8fd0ff" />
      <Lab pos={[0.4, 0.55, 0]} text="Stereocilia: bend to open ion channels" col="#bfe6ff" />
      <Lab pos={[0, -1.35, 0]} text="Basilar membrane" col="#6f96d0" />
      <Lab pos={[0, -1.9, 0]} text="↓ glutamate → auditory nerve" col="#7CF5C6" />
      <Lab pos={[-3.4, 1.2, 0]} text="base · high freq" col="#ff8a4c" />
      <Lab pos={[3.4, 1.2, 0]} text="apex · low freq" col="#4fd0ff" />
    </group>
  );
}

function useNeuronField(morphs: Morphology[], placements: { pos: THREE.Vector3; scale: number; rotY: number }[], cellR: number) {
  return useMemo(() => {
    if (!morphs.length) return { geo: null as THREE.BufferGeometry | null, somas: placements.map(p => p.pos.clone()) };
    const parts: THREE.BufferGeometry[] = []; const somas: THREE.Vector3[] = [];
    placements.forEach((pl, i) => {
      const m = morphs[i % morphs.length];
      const g = branchesToTubes(m, m.branches.filter(b => b.type !== 'axon'), cellR, 4, 1.5);
      if (g) { const mtx = new THREE.Matrix4().compose(pl.pos, new THREE.Quaternion().setFromAxisAngle(YA, pl.rotY), new THREE.Vector3(pl.scale, pl.scale, pl.scale)); g.applyMatrix4(mtx); parts.push(g); }
      somas.push(pl.pos.clone());
    });
    if (!parts.length) return { geo: null, somas };
    let vt = 0; const ni = parts.map(g => g.index ? g.toNonIndexed() : g); ni.forEach(g => vt += (g.getAttribute('position') as THREE.BufferAttribute).count);
    const pos = new Float32Array(vt * 3), nor = new Float32Array(vt * 3); let o = 0;
    ni.forEach(g => { const pa = g.getAttribute('position') as THREE.BufferAttribute; const na = g.getAttribute('normal') as THREE.BufferAttribute; pos.set(pa.array as Float32Array, o * 3); if (na) nor.set(na.array as Float32Array, o * 3); o += pa.count; });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.computeBoundingSphere();
    parts.forEach(p => p.dispose());
    return { geo, somas };
  }, [morphs, placements, cellR]);
}

function TonotopyChapter({ refs, morphs }: { refs: Refs; morphs: Morphology[] }) {
  const K = 9;
  const placements = useMemo(() => Array.from({ length: K }, (_, i) => ({ pos: new THREE.Vector3(-4 + (i / (K - 1)) * 8, (i % 2 ? 0.4 : -0.4), (i % 3 - 1) * 0.6), scale: 0.9, rotY: i * 0.7 })), []);
  const { geo, somas } = useNeuronField(morphs, placements, 1.4);
  const mat = useMemo(() => membrane('#7CC5FF', 0.6), []);
  const somaMesh = useRef<THREE.InstancedMesh>(null);
  const tmp = useTmp(); const litIdx = useRef(-1); const litT = useRef(0);
  useEffect(() => () => { geo?.dispose(); mat.dispose(); }, [geo]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime; mat.uniforms.uTime.value = t; dt = Math.min(0.05, dt);
    let drained = 0; while (refs.queue.length && drained < 4) { const n = refs.queue.shift()!; drained++; const i = Math.round(pitchNorm(n.pitch) * (K - 1)); litIdx.current = i; litT.current = 1; mat.uniforms.uPulse.value.copy(somas[i]); mat.uniforms.uPulseAmt.value = 1.0; mat.uniforms.uPulseW.value = 1.6; }
    litT.current = Math.max(0, litT.current - dt * 1.4); mat.uniforms.uPulseAmt.value = litT.current;
    const sm = somaMesh.current; if (sm) { for (let i = 0; i < K; i++) { const l = i === litIdx.current ? litT.current : 0; const s = 0.16 * (0.9 + 0.4 * l); tmp.m.compose(somas[i], tmp.q.identity(), tmp.s.set(s, s, s)); sm.setMatrixAt(i, tmp.m); sm.setColorAt(i, tmp.c.set('#8fd0ff').lerp(new THREE.Color('#ffffff'), l)); } sm.instanceMatrix.needsUpdate = true; if (sm.instanceColor) sm.instanceColor.needsUpdate = true; }
  });
  return (
    <group>
      <ambientLight intensity={0.5} /><pointLight position={[4, 6, 8]} intensity={0.8} color="#bfe2ff" />
      {geo && <mesh geometry={geo} material={mat} />}
      <instancedMesh ref={somaMesh} args={[undefined as any, undefined as any, K]}><icosahedronGeometry args={[1, 3]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.9} /></instancedMesh>
      <Lab pos={[-4, 1.5, 0]} text="low-frequency neurons" col="#ff8a4c" df={8} />
      <Lab pos={[4, 1.5, 0]} text="high-frequency neurons" col="#4fd0ff" df={8} />
      <Lab pos={[0, -1.7, 0]} text="each column tuned to a pitch, so a melody walks the map" col="#7CC5FF" df={8} />
    </group>
  );
}

function RhythmChapter({ refs, morphs }: { refs: Refs; morphs: Morphology[] }) {
  const K = 10;
  const placements = useMemo(() => Array.from({ length: K }, (_, i) => { const a = (i / K) * Math.PI * 2; return { pos: new THREE.Vector3(Math.cos(a) * 2.6, Math.sin(a) * 1.8, (i % 2 - 0.5) * 1.2), scale: 0.7, rotY: a }; }), []);
  const { geo } = useNeuronField(morphs, placements, 1.1);
  const mat = useMemo(() => membrane('#A78BFA', 0.55, '#e6d8ff'), []);
  const beat = useRef(0); const lastOnset = useRef(0); const period = useRef(0.5); const phase = useRef(0);
  useEffect(() => () => { geo?.dispose(); mat.dispose(); }, [geo]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime; mat.uniforms.uTime.value = t; dt = Math.min(0.05, dt);
    let onsets = 0; while (refs.queue.length) { refs.queue.shift(); onsets++; }
    if (onsets > 0) { const iv = t - lastOnset.current; if (iv > 0.12 && iv < 1.6) period.current = period.current * 0.7 + iv * 0.3; lastOnset.current = t; }
    phase.current += dt / Math.max(0.2, period.current);
    const beatPhase = phase.current % 1; const pulse = Math.exp(-Math.pow((beatPhase) * 6, 2)) + Math.exp(-Math.pow((beatPhase - 1) * 6, 2));
    beat.current = beat.current * 0.85 + pulse * 0.6;
    mat.uniforms.uGlow.value = clamp01(beat.current + 0.1 * refs.activity);
  });
  return (
    <group>
      <ambientLight intensity={0.5} /><pointLight position={[4, 6, 8]} intensity={0.8} color="#d8c8ff" />
      {geo && <mesh geometry={geo} material={mat} />}
      <Lab pos={[0, 2.4, 0]} text="motor-timing network (SMA · basal ganglia · cerebellum)" col="#A78BFA" df={9} />
      <Lab pos={[0, -2.3, 0]} text="the network phase-locks to the beat and fires in synchrony" col="#e6d8ff" df={9} />
    </group>
  );
}

function RewardChapter({ refs }: { refs: Refs }) {
  const tmp = useTmp();
  const TERM = useMemo(() => new THREE.Vector3(-1.2, 0, 0), []);
  const POST = useMemo(() => new THREE.Vector3(1.1, 0, 0), []);
  const VES = 16; const DA = 70; const REC = 10;
  const ves = useMemo(() => { const rng = () => Math.random(); return Array.from({ length: VES }, () => ({ home: TERM.clone().add(new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).multiplyScalar(0.42)), pos: new THREE.Vector3(), fuse: 0, used: false })); }, [TERM]);
  const da = useRef<{ p: THREE.Vector3; v: THREE.Vector3; life: number; bound: number }[]>([]);
  const recLit = useRef<Float32Array>(new Float32Array(REC));
  const vesMesh = useRef<THREE.InstancedMesh>(null); const daMesh = useRef<THREE.InstancedMesh>(null); const recMesh = useRef<THREE.InstancedMesh>(null);
  const termMat = useMemo(() => membrane('#3a5f95', 0.4, '#ffe08a'), []); const postMat = useMemo(() => membrane('#7a5a30', 0.42, '#ffe08a'), []);
  const recQuat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(YA, new THREE.Vector3(1, 0, 0)), []);
  const recPos = (i: number, out: THREE.Vector3) => { const ang = i * 2.4, r = Math.sqrt(i / REC) * 0.42; out.set(POST.x - 0.4, POST.y + Math.sin(ang) * r, POST.z + Math.cos(ang) * r); };
  const burst = useRef(0);
  useEffect(() => { ves.forEach(v => v.pos.copy(v.home)); }, [ves]);
  useEffect(() => () => { termMat.dispose(); postMat.dispose(); }, []);
  useFrame((state, dt) => {
    dt = Math.min(0.05, dt); const t = state.clock.elapsedTime; termMat.uniforms.uTime.value = t; postMat.uniforms.uTime.value = t;
    let e = 0; while (refs.queue.length) { const n = refs.queue.shift()!; e += n.vel; }
    burst.current = Math.max(burst.current, Math.min(1.4, e * 0.5 + refs.activity * 0.4));
    burst.current = Math.max(0, burst.current - dt * 0.7);
    termMat.uniforms.uGlow.value = 0.15 + 0.7 * burst.current;
    if (burst.current > 0.4 && Math.random() < burst.current * 0.4) { const v = ves.find(v => !v.used && v.fuse === 0); if (v) v.used = true; }
    for (const v of ves) { if (v.used && v.fuse < 1) { v.pos.lerp(TERM.clone().add(new THREE.Vector3(0.4, 0, 0)), 0.2); v.fuse = Math.min(1, v.fuse + dt * 4); if (v.fuse >= 1) { for (let k = 0; k < 6 && da.current.length < DA; k++) da.current.push({ p: TERM.clone().add(new THREE.Vector3(0.4, 0, 0)), v: new THREE.Vector3(1, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7).normalize().multiplyScalar(0.8 + Math.random() * 0.5), life: 1, bound: -1 }); } } if (v.used && v.fuse >= 1 && Math.random() < 0.02) { v.used = false; v.fuse = 0; v.pos.copy(v.home); } }
    for (let i = da.current.length - 1; i >= 0; i--) { const p = da.current[i]; if (p.bound >= 0) { const rp = tmp.v; recPos(p.bound, rp); p.p.lerp(rp, 0.25); p.life -= dt * 0.4; } else { p.p.addScaledVector(p.v, dt); p.life -= dt * 0.6; if (p.p.x > POST.x - 0.55 && Math.random() < 0.1) { const ri = (Math.random() * REC) | 0; p.bound = ri; recLit.current[ri] = 1; } } if (p.life <= 0) da.current.splice(i, 1); }
    for (let i = 0; i < REC; i++) recLit.current[i] = Math.max(0, recLit.current[i] - dt * 1.0);
    postMat.uniforms.uGlow.value = 0.1 + 0.4 * recLit.current.reduce((a, b) => Math.max(a, b), 0);
    const vm = vesMesh.current; if (vm) { for (let i = 0; i < VES; i++) { const v = ves[i]; const s = (v.used ? 0.1 * (1 - v.fuse * 0.6) : 0.1); tmp.m.compose(v.pos, tmp.q.identity(), tmp.s.set(s, s, s)); vm.setMatrixAt(i, tmp.m); } vm.instanceMatrix.needsUpdate = true; }
    const dm = daMesh.current; if (dm) { for (let i = 0; i < DA; i++) { const p = da.current[i]; const s = p ? 0.05 * clamp01(p.life) : 0; tmp.m.compose(p ? p.p : HIDE, tmp.q.identity(), tmp.s.set(s, s, s)); dm.setMatrixAt(i, tmp.m); } dm.instanceMatrix.needsUpdate = true; }
    const rm = recMesh.current; if (rm) { for (let i = 0; i < REC; i++) { recPos(i, tmp.v); const s = 0.09 + 0.03 * recLit.current[i]; tmp.m.compose(tmp.v, recQuat, tmp.s.set(s * 0.7, s * 1.4, s * 0.7)); rm.setMatrixAt(i, tmp.m); rm.setColorAt(i, tmp.c.set('#ffb84d').lerp(new THREE.Color('#ffffff'), recLit.current[i])); } rm.instanceMatrix.needsUpdate = true; if (rm.instanceColor) rm.instanceColor.needsUpdate = true; }
  });
  return (
    <group>
      <ambientLight intensity={0.5} /><pointLight position={[4, 6, 8]} intensity={0.8} color="#ffe8c0" />
      <mesh position={TERM.toArray()} material={termMat}><icosahedronGeometry args={[0.5, 3]} /></mesh>
      <mesh position={POST.toArray()} material={postMat}><icosahedronGeometry args={[0.5, 3]} /></mesh>
      <instancedMesh ref={vesMesh} args={[undefined as any, undefined as any, VES]}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#ffd070" toneMapped={false} transparent opacity={0.9} /></instancedMesh>
      <instancedMesh ref={daMesh} args={[undefined as any, undefined as any, DA]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#ffcf5a" toneMapped={false} transparent opacity={0.97} blending={THREE.AdditiveBlending} depthWrite={false} /></instancedMesh>
      <instancedMesh ref={recMesh} args={[undefined as any, undefined as any, REC]}><cylinderGeometry args={[1, 0.7, 1, 8]} /><meshBasicMaterial toneMapped={false} transparent opacity={0.9} /></instancedMesh>
      <Lab pos={[-1.2, 0.85, 0]} text="Dopamine terminal (from VTA)" col="#8ab4ff" df={4} />
      <Lab pos={[0, -0.8, 0]} text="Dopamine released on the musical peak" col="#ffcf5a" df={4} />
      <Lab pos={[1.1, 0.85, 0]} text="D1/D2 receptors · striatal neuron" col="#ffb84d" df={4} />
    </group>
  );
}

function PredictionChapter({ refs, morphs }: { refs: Refs; morphs: Morphology[] }) {
  const K = 6;
  const placements = useMemo(() => Array.from({ length: K }, (_, i) => ({ pos: new THREE.Vector3((i - (K - 1) / 2) * 1.5, (i % 2 ? 0.5 : -0.5), (i % 3 - 1) * 0.5), scale: 0.85, rotY: i })), []);
  const { geo, somas } = useNeuronField(morphs, placements, 1.3);
  const mat = useMemo(() => membrane('#00D4FF', 0.6, '#ffffff'), []);
  const prevPitch = useRef(-1); const err = useRef(0);
  const flash = useRef<THREE.Mesh>(null);
  useEffect(() => () => { geo?.dispose(); mat.dispose(); }, [geo]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime; mat.uniforms.uTime.value = t; dt = Math.min(0.05, dt);
    let drained = 0; while (refs.queue.length && drained < 4) { const n = refs.queue.shift()!; drained++; const interval = prevPitch.current < 0 ? 0 : Math.abs(n.pitch - prevPitch.current); prevPitch.current = n.pitch; const surprise = clamp01((interval - 2) / 10); const i = (Math.abs(n.pitch) % K); mat.uniforms.uPulse.value.copy(somas[i]); mat.uniforms.uPulseAmt.value = 0.5 + surprise; mat.uniforms.uPulseW.value = 1.4; if (surprise > 0.35) err.current = Math.min(1.4, err.current + surprise); }
    mat.uniforms.uPulseAmt.value = Math.max(0, mat.uniforms.uPulseAmt.value - dt * 1.5);
    err.current = Math.max(0, err.current - dt * 1.4); mat.uniforms.uGlow.value = 0.05 + 0.5 * err.current;
    if (flash.current) { const s = 0.2 + 2.5 * err.current; flash.current.scale.setScalar(s); (flash.current.material as THREE.MeshBasicMaterial).opacity = 0.4 * err.current; }
  });
  return (
    <group>
      <ambientLight intensity={0.5} /><pointLight position={[4, 6, 8]} intensity={0.8} color="#bfe2ff" />
      {geo && <mesh geometry={geo} material={mat} />}
      <mesh ref={flash}><icosahedronGeometry args={[1, 3]} /><meshBasicMaterial color="#ff5fa2" toneMapped={false} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <Lab pos={[0, 1.9, 0]} text="predictive neurons forecasting the next note" col="#00D4FF" df={9} />
      <Lab pos={[0, -1.9, 0]} text="a surprising note fires a large prediction-error burst" col="#ff5fa2" df={9} />
    </group>
  );
}

const CAM: [number, number, number][] = [[0, 0.3, 7.5], [0, 0.2, 9], [0, 0.1, 8.5], [0, 0.2, 4.6], [0, 0.2, 7]];
function CameraSway({ chapter }: { chapter: number }) {
  useFrame((state) => {
    const c = CAM[chapter] ?? CAM[0]; const t = state.clock.elapsedTime;
    state.camera.position.lerp(new THREE.Vector3(c[0] + Math.sin(t * 0.15) * 0.35, c[1] + Math.cos(t * 0.12) * 0.2, c[2]), 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function Chapters({ chapter, refs, morphs }: { chapter: number; refs: Refs; morphs: Morphology[] }) {
  return (
    <>
      <color attach="background" args={['#04060e']} />
      {chapter === 0 && <CochleaChapter refs={refs} />}
      {chapter === 1 && <TonotopyChapter refs={refs} morphs={morphs} />}
      {chapter === 2 && <RhythmChapter refs={refs} morphs={morphs} />}
      {chapter === 3 && <RewardChapter refs={refs} />}
      {chapter === 4 && <PredictionChapter refs={refs} morphs={morphs} />}
      <CameraSway chapter={chapter} />
      <Postprocessing strength={0.4} threshold={0.78} radius={0.6} />
    </>
  );
}

const MusicJourney = forwardRef<MusicJourneyHandle, { paused?: boolean; chapter: number }>(function MusicJourney({ paused = false, chapter }, ref) {
  const refs = useMemo<Refs>(() => ({ queue: [], eng: {}, activity: 0.2 }), []);
  const { morphs } = useMorphologies();
  useImperativeHandle(ref, () => ({
    note: (pitch, vel) => { refs.queue.push({ pitch, vel }); if (refs.queue.length > 40) refs.queue.splice(0, refs.queue.length - 40); },
    drive: (eng, act) => { for (const k in eng) refs.eng[k] = (eng as any)[k] ?? 0; refs.activity = act; },
  }), [refs]);
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0.3, 8], fov: 44, near: 0.05, far: 200 }} dpr={[1, 1.8]} gl={{ antialias: false, powerPreference: 'high-performance' }} frameloop={paused ? 'never' : 'always'} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; }}>
        <Chapters chapter={chapter} refs={refs} morphs={morphs} />
      </Canvas>
    </div>
  );
});
export default MusicJourney;
