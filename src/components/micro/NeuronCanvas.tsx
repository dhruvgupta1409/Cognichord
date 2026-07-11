import { useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { buildPyramidalNeuron, type NeuronMesh } from './neuronGeometry';
import { createMembraneMaterial, createMyelinMaterial } from './membraneMaterial';
import Postprocessing from '../brain/Postprocessing';
import { useMorphologies } from '../../lib/assets';
import { branchesToTubes } from '../../lib/swc';

export interface NeuronHandle { fire: (intensity: number) => void; }

type LabelMode = 'anatomy' | 'synapse' | 'none';

interface SceneProps {
  growth: number;
  ltp: number;
  activity: number;
  accent: string;
  zoom: number;
  labels: LabelMode;
  registerFire: (fn: (v: number) => void) => void;
}

const TRAVEL = 1.35;

function NeuronSceneContents({ growth, ltp, activity, accent, zoom, labels, registerFire }: SceneProps) {
  const growthStep = Math.round(growth * 6) / 6;
  const hero = useMemo<NeuronMesh>(() => buildPyramidalNeuron({ growth: growthStep, seed: 3, regionId: 2 }), [growthStep]);

  const { morphs } = useMorphologies();
  const neuropil = useMemo(() => {
    const placements = [
      { pos: [-5.4, 1.7, -5.2], rot: [0.1, 0.6, 0.2], r: 3.4, accent: '#8fb0d8', dim: 0.42 },
      { pos: [5.6, -1.4, -6.0], rot: [0.0, -0.7, -0.15], r: 3.8, accent: '#a98fce', dim: 0.40 },
      { pos: [-3.8, -3.2, -7.2], rot: [0.2, 1.4, 0.0], r: 3.0, accent: '#c98fa8', dim: 0.34 },
      { pos: [3.6, 3.4, -7.6], rot: [0.15, -1.2, 0.3], r: 2.8, accent: '#8fb0d8', dim: 0.32 },
      { pos: [0.4, -4.2, -8.5], rot: [0.0, 0.3, 0.1], r: 3.2, accent: '#9a8fd0', dim: 0.30 },
    ];
    const out: { geo: THREE.BufferGeometry; pos: number[]; rot: number[]; accent: string; dim: number }[] = [];
    if (!morphs.length) return out;
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const morph = morphs[i % morphs.length];
      const geo = branchesToTubes(morph, morph.branches, p.r, 8, 1.0);
      if (geo) out.push({ geo, pos: p.pos, rot: p.rot, accent: p.accent, dim: p.dim });
    }
    return out;
  }, [morphs]);
  const neuropilMats = useMemo(() => neuropil.map(n => createMembraneMaterial({ accent: n.accent, opacity: 0.5 })), [neuropil]);
  useEffect(() => { neuropilMats.forEach((m, i) => (m.uniforms.uDim.value = neuropil[i].dim)); }, [neuropilMats, neuropil]);
  useEffect(() => () => { neuropilMats.forEach(m => m.dispose()); neuropil.forEach(n => n.geo.dispose()); }, [neuropilMats]);

  const capillary = useMemo(() => {
    const pts = [
      new THREE.Vector3(-9, -5.5, -10), new THREE.Vector3(-4, -3.5, -9.2), new THREE.Vector3(0.5, -4.6, -9.6),
      new THREE.Vector3(5, -6.2, -9.0), new THREE.Vector3(9.5, -4.8, -10),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5), 140, 0.17, 16, false);
  }, []);
  const capillaryMat = useMemo(() => createMembraneMaterial({ accent: '#c25f68', opacity: 0.4 }), []);
  useEffect(() => { capillaryMat.uniforms.uDim.value = 0.7; }, [capillaryMat]);

  const membraneMat = useMemo(() => createMembraneMaterial({ accent, opacity: 0.9 }), []);
  const postMat = useMemo(() => createMembraneMaterial({ accent: '#8fb0d8', opacity: 0.6 }), []);
  const myelinMat = useMemo(() => createMyelinMaterial(), []);
  useEffect(() => () => { [membraneMat, postMat, myelinMat, capillaryMat].forEach(m => m.dispose()); capillary.dispose(); }, []);
  useEffect(() => () => { hero.membrane.dispose(); hero.myelin.dispose(); }, [hero]);
  useEffect(() => { membraneMat.uniforms.uAccent.value.set(accent); }, [accent]);

  const terminal = hero.terminal;
  const postPos = useMemo(() => terminal.clone().add(new THREE.Vector3(1.0, 0.0, 0)), [terminal]);
  const cleftDir = useMemo(() => postPos.clone().sub(terminal).normalize(), [postPos, terminal]);

  const aps = useRef<{ t: number; amt: number }[]>([{ t: 0.0, amt: 1 }]);
  const sinceAuto = useRef(0);
  const apMesh = useRef<THREE.Mesh>(null);
  const flashMesh = useRef<THREE.Mesh>(null);
  const flash = useRef(0);

  const VCOUNT = 40;
  const vesicles = useRef<{ p: THREE.Vector3; v: THREE.Vector3; life: number }[]>([]);
  const vesMesh = useRef<THREE.InstancedMesh>(null);

  const RCOUNT = 22;
  const recMesh = useRef<THREE.InstancedMesh>(null);
  const recBase = useMemo(() => {
    const dirs: THREE.Vector3[] = [];
    for (let i = 0; i < RCOUNT; i++) {
      const a = i * 2.399963;
      const y = 1 - (i / (RCOUNT - 1)) * 1.1;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const d = new THREE.Vector3(-1, y * 0.7, Math.cos(a) * r).normalize();
      dirs.push(d);
    }
    return dirs;
  }, []);

  const fire = (intensity: number) => {
    if (aps.current.length < 6) aps.current.push({ t: 0, amt: 0.6 + 0.5 * intensity });
  };
  useEffect(() => { registerFire(fire); }, []);

  const tmpM = useMemo(() => new THREE.Matrix4(), []);
  const tmpV = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpS = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const m = recMesh.current; if (!m) return;
    const shown = 4 + Math.round(RCOUNT * 0.8 * ltp);
    for (let i = 0; i < RCOUNT; i++) {
      const on = i < shown;
      tmpV.copy(recBase[i]).multiplyScalar(0.34).add(postPos);
      const s = on ? 0.055 + 0.02 * ltp : 0.0001;
      tmpM.compose(tmpV, tmpQ.identity(), tmpS.set(s, s, s));
      m.setMatrixAt(i, tmpM);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [ltp, postPos, recBase]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    dt = Math.min(0.05, dt);
    membraneMat.uniforms.uTime.value = t;
    membraneMat.uniforms.uGrowth.value = growth;
    membraneMat.uniforms.uActivity.value = activity;
    for (const m of neuropilMats) { m.uniforms.uTime.value = t; m.uniforms.uActivity.value = 0.22; }
    capillaryMat.uniforms.uTime.value = t;
    postMat.uniforms.uTime.value = t;
    myelinMat.uniforms.uTime.value = t; myelinMat.uniforms.uGrowth.value = growth;

    sinceAuto.current += dt;
    const period = 2.8 - 1.6 * activity;
    if (sinceAuto.current > period) { sinceAuto.current = 0; fire(0.4); }

    let bestPos: THREE.Vector3 | null = null, bestAmt = 0;
    for (let i = aps.current.length - 1; i >= 0; i--) {
      const ap = aps.current[i];
      const prev = ap.t;
      ap.t += dt / TRAVEL;
      if (prev < 1 && ap.t >= 1) {
        flash.current = 1;
        const n = 5 + Math.round(11 * ltp) + Math.round(6 * ap.amt);
        for (let k = 0; k < n && vesicles.current.length < VCOUNT; k++) {
          const jitter = new THREE.Vector3((Math.sin(k * 12.9 + t) ) * 0.12, (Math.cos(k * 7.7 + t)) * 0.12, (Math.sin(k * 4.1)) * 0.12);
          const dir = cleftDir.clone().add(jitter).normalize();
          vesicles.current.push({ p: terminal.clone().addScaledVector(cleftDir, 0.22), v: dir.multiplyScalar(0.9 + Math.random() * 0.5), life: 1 });
        }
      }
      if (ap.t >= 1.15) { if (aps.current.length > 1) aps.current.splice(i, 1); else ap.t = 0; continue; }
      if (ap.t <= 1) {
        const p = hero.axonCurve.getPointAt(Math.max(0, Math.min(1, ap.t)));
        const amt = ap.amt * (0.6 + 0.4 * Math.sin(Math.min(1, ap.t) * Math.PI));
        if (amt > bestAmt) { bestAmt = amt; bestPos = p; }
      }
    }
    if (apMesh.current) {
      if (bestPos) {
        apMesh.current.visible = true;
        apMesh.current.position.copy(bestPos);
        const s = 0.11 + 0.05 * Math.sin(t * 30);
        apMesh.current.scale.setScalar(s * (0.7 + bestAmt));
        membraneMat.uniforms.uPulseWorld.value.copy(bestPos);
        membraneMat.uniforms.uPulseAmt.value = 0.9 * bestAmt;
      } else {
        apMesh.current.visible = false;
        membraneMat.uniforms.uPulseAmt.value *= 0.9;
      }
    }

    flash.current = Math.max(0, flash.current - dt * 2.2);
    if (flashMesh.current) {
      flashMesh.current.position.copy(terminal).addScaledVector(cleftDir, 0.5);
      const f = flash.current;
      flashMesh.current.visible = f > 0.01;
      flashMesh.current.scale.setScalar(0.2 + 0.9 * f);
      (flashMesh.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * f;
    }

    const vm = vesMesh.current;
    if (vm) {
      for (let i = vesicles.current.length - 1; i >= 0; i--) {
        const ve = vesicles.current[i];
        ve.p.addScaledVector(ve.v, dt);
        ve.life -= dt * 1.4;
        if (ve.life <= 0 || ve.p.distanceTo(postPos) < 0.36) { vesicles.current.splice(i, 1); continue; }
      }
      for (let i = 0; i < VCOUNT; i++) {
        const ve = vesicles.current[i];
        if (ve) { const s = 0.06 * ve.life; tmpM.compose(ve.p, tmpQ.identity(), tmpS.set(s, s, s)); }
        else tmpM.compose(tmpV.set(0, -999, 0), tmpQ.identity(), tmpS.set(0.0001, 0.0001, 0.0001));
        vm.setMatrixAt(i, tmpM);
      }
      vm.instanceMatrix.needsUpdate = true;
    }

    if (recMesh.current) {
      const mat = recMesh.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + 0.4 * flash.current;
    }
  });

  const showAnatomy = labels === 'anatomy';
  const showSynapse = labels === 'synapse';
  const L = (pos: THREE.Vector3, text: string, col: string, factor = 11) => (
    <Html position={[pos.x, pos.y, pos.z]} center distanceFactor={factor} style={{ pointerEvents: 'none' }}>
      <div style={{
        whiteSpace: 'nowrap', transform: 'translateY(-50%)',
        fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
        color: col, background: 'rgba(6,10,20,0.82)', border: `1px solid ${col}55`,
        borderRadius: 7, padding: '3px 8px', backdropFilter: 'blur(4px)',
      }}>{text}</div>
    </Html>
  );

  return (
    <>
      <color attach="background" args={['#04060e']} />
      <ambientLight intensity={0.4} />

      {neuropil.map((n, i) => (
        <mesh key={i} geometry={n.geo} material={neuropilMats[i]} position={n.pos as [number, number, number]} rotation={n.rot as [number, number, number]} />
      ))}
      <mesh geometry={capillary} material={capillaryMat} />

      <mesh geometry={hero.membrane} material={membraneMat} />
      {hero.myelin.attributes.position && <mesh geometry={hero.myelin} material={myelinMat} />}

      <mesh position={[postPos.x, postPos.y, postPos.z]} material={postMat}>
        <icosahedronGeometry args={[0.34, 3]} />
      </mesh>

      {hero.nodes.map((nd, i) => (
        <mesh key={i} position={[nd.x, nd.y, nd.z]}>
          <icosahedronGeometry args={[0.05, 1]} />
          <meshBasicMaterial color="#cfe6ff" toneMapped={false} transparent opacity={0.85} />
        </mesh>
      ))}

      <mesh ref={apMesh}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#eafcff" toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh ref={flashMesh} visible={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <instancedMesh ref={vesMesh} args={[undefined as any, undefined as any, VCOUNT]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#7CF5C6" toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={recMesh} args={[undefined as any, undefined as any, RCOUNT]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#7CF5C6" toneMapped={false} transparent opacity={0.6} />
      </instancedMesh>

      {showAnatomy && <>
        {L(hero.anchors.soma, 'Soma', '#7CC5FF')}
        {L(hero.anchors.apical, 'Apical dendrite', '#7CC5FF')}
        {L(hero.anchors.basal, 'Basal dendrites', '#9AE6FF')}
        {L(hero.anchors.axon, 'Axon', '#9fb4d6')}
        {L(hero.anchors.myelin, 'Myelin sheath', '#C4B5FD')}
        {L(hero.anchors.node, 'Node of Ranvier', '#cfe6ff')}
        {L(hero.anchors.terminal, 'Synapse', '#7CF5C6')}
      </>}
      {showSynapse && <>
        {L(terminal.clone().add(new THREE.Vector3(0, 0.28, 0)), 'Axon terminal', '#9fb4d6', 4)}
        {L(terminal.clone().addScaledVector(cleftDir, 0.5), 'Neurotransmitter →', '#7CF5C6', 4)}
        {L(postPos.clone().add(new THREE.Vector3(0, -0.28, 0)), 'Receptors', '#7CF5C6', 4)}
      </>}

      <Rig zoom={zoom} center={new THREE.Vector3(0, 0.2, 0)} terminal={terminal} />
      <Postprocessing strength={0.34} threshold={0.82} radius={0.5} />
    </>
  );
}

function Rig({ zoom, center, terminal }: { zoom: number; center: THREE.Vector3; terminal: THREE.Vector3 }) {
  const controls = useRef<any>(null);
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredTgt = useMemo(() => new THREE.Vector3(), []);
  const fromPos = useMemo(() => new THREE.Vector3(6, 4, 20), []);
  const fromTgt = useMemo(() => new THREE.Vector3(0, 0.2, 0), []);
  const startT = useRef<number | null>(0);
  const prevZoom = useRef(-1);
  const { camera } = useThree();
  const DURATION = 1.2;

  useEffect(() => { camera.position.set(6, 4, 20); }, []);

  useFrame((state) => {
    const z = Math.max(0, Math.min(1, zoom));
    if (Math.abs(z - prevZoom.current) > 0.001) {
      fromPos.copy(camera.position);
      fromTgt.copy(controls.current ? controls.current.target : center);
      startT.current = state.clock.elapsedTime;
      prevZoom.current = z;
    }
    if (controls.current) controls.current.autoRotate = startT.current === null;
    if (startT.current === null) return;

    desiredTgt.lerpVectors(center, terminal, z);
    const wide = new THREE.Vector3(3.4, 1.6, 9.5);
    const close = terminal.clone().add(new THREE.Vector3(0.4, 0.9, 3.6));
    desiredPos.copy(center).add(wide).lerp(close, z);

    const u = Math.min(1, (state.clock.elapsedTime - startT.current) / DURATION);
    const s = u * u * (3 - 2 * u);
    camera.position.lerpVectors(fromPos, desiredPos, s);
    if (controls.current) controls.current.target.lerpVectors(fromTgt, desiredTgt, s);
    if (u >= 1) startT.current = null;
  }, 0.5);

  return <OrbitControls ref={controls} enablePan enableZoom enableDamping dampingFactor={0.09} autoRotate autoRotateSpeed={0.3} minDistance={1.2} maxDistance={26} makeDefault />;
}

const NeuronCanvas = forwardRef<NeuronHandle, {
  growth?: number; ltp?: number; activity?: number; accent?: string; zoom?: number; labels?: LabelMode;
  className?: string; paused?: boolean;
}>(function NeuronCanvas(
  { growth = 0.5, ltp = 0.4, activity = 0.35, accent = '#7CC5FF', zoom = 0, labels = 'anatomy', className, paused = false },
  ref,
) {
  const impl = useRef<{ fire?: (v: number) => void }>({});
  useImperativeHandle(ref, () => ({ fire: (v: number) => impl.current.fire?.(v) }), []);

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [6, 4, 20], fov: 36, near: 0.1, far: 120 }}
        dpr={[1, 1.8]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        frameloop={paused ? 'never' : 'always'}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; }}
      >
        <NeuronSceneContents
          growth={growth} ltp={ltp} activity={activity} accent={accent} zoom={zoom} labels={labels}
          registerFire={fn => (impl.current.fire = fn)}
        />
      </Canvas>
    </div>
  );
});

export default NeuronCanvas;
