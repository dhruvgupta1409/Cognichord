import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { withMeshAttrs } from './brainGeometry';
import { buildWhiteMatter } from './deepStructures';
import { loadCortexSmooth, loadSubcortical } from './brainModel';
import { createMeshMaterial } from './meshMaterial';
import { REGION_BY_ID } from './regions';
import NeuralPathways from './NeuralPathways';

interface Props {
  selectedId: number | null;
  hoveredId: number | null;
  onSelect: (id: number) => void;
  onHover?: (id: number | null) => void;
  cutaway: boolean;
  activity?: number;
  breathe?: boolean;
  engagement?: number[];
  myelin?: number[];
}

interface DeepPart { id: number; geo: THREE.BufferGeometry; pos: [number, number, number]; scale: [number, number, number]; rot?: [number, number, number]; decorative?: boolean; }

const CENTER: [number, number, number] = [0, 0.42, -0.02];

const asDeepPart = (id: number, geo: THREE.BufferGeometry, decorative?: boolean): DeepPart => ({
  id,
  geo: withMeshAttrs(geo, id),
  pos: [0, 0, 0],
  scale: [1, 1, 1],
  decorative,
});

export default function BrainMeshes({ selectedId, hoveredId, onSelect, onHover, cutaway, activity = 0.14, breathe = true, engagement, myelin }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const engEased = useRef<number[]>(new Array(13).fill(0));
  const [cortexGeo, setCortexGeo] = useState<THREE.BufferGeometry | null>(null);
  const [deepParts, setDeepParts] = useState<DeepPart[]>([]);
  useEffect(() => {
    let alive = true;
    loadCortexSmooth().then(g => { if (alive) setCortexGeo(g); }).catch(err => console.error('brain load failed', err));
    const wm = buildWhiteMatter(CENTER).map(p => asDeepPart(p.id, p.geo, p.decorative));
    setDeepParts(wm);
    loadSubcortical()
      .then(list => {
        if (!alive) return;
        const real = list.map(s => asDeepPart(s.id, s.geo, s.decorative));
        setDeepParts([...real, ...wm]);
      })
      .catch(err => console.error('subcortical load failed', err));
    return () => { alive = false; };
  }, []);

  const cortexMat = useMemo(() => createMeshMaterial(), []);
  const deepMat = useMemo(() => createMeshMaterial(), []);
  const mats = useMemo(() => [cortexMat, deepMat], [cortexMat, deepMat]);

  useEffect(() => {
    const hex = selectedId != null ? REGION_BY_ID[selectedId]?.color : undefined;
    const c = new THREE.Color(hex ?? '#8fe6ff');
    for (const m of mats) (m.uniforms.uSelectedCol.value as THREE.Color).copy(c);
  }, [selectedId, mats]);

  const peel = useRef(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const sel = selectedId ?? -1;
    const eng = engEased.current;
    const kE = 1 - Math.pow(0.015, dt);
    for (let i = 0; i < 13; i++) eng[i] += ((engagement?.[i] ?? 0) - eng[i]) * kE;
    for (const m of mats) {
      m.uniforms.uTime.value = t;
      m.uniforms.uSelected.value = sel;
      m.uniforms.uHover.value = hoveredId ?? -1;
      (m.uniforms.uEngage.value as number[]).splice(0, 13, ...eng);
    }
    cortexMat.uniforms.uActivity.value = activity;
    if (breathe && rootRef.current) {
      const s = 1 + 0.010 * Math.sin(t * 0.85) + 0.004 * Math.sin(t * 1.9 + 1.3);
      rootRef.current.scale.setScalar(s);
    }
    const target = cutaway ? 0.6 : 0;
    peel.current += (target - peel.current) * (1 - Math.pow(0.004, dt));
    cortexMat.uniforms.uPeel.value = peel.current;
    cortexMat.uniforms.uOpacity.value = 1 - 0.45 * (peel.current / 0.6);
    const wantTransparent = peel.current > 0.01;
    if (cortexMat.transparent !== wantTransparent) {
      cortexMat.transparent = wantTransparent;
      cortexMat.depthWrite = !wantTransparent;
      cortexMat.needsUpdate = true;
    }
  });

  const regionAtHit = (e: ThreeEvent<MouseEvent> | ThreeEvent<PointerEvent>): number | null => {
    const geo = (e.object as THREE.Mesh).geometry;
    const aRegion = geo.getAttribute('aRegion');
    if (!aRegion || !e.face) return null;
    return aRegion.getX(e.face.a);
  };
  const handleCortex = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const region = regionAtHit(e);
    if (region != null) onSelect(region);
  };
  const cortexHover = (e: ThreeEvent<PointerEvent>) => {
    onHover?.(regionAtHit(e));
    document.body.style.cursor = 'pointer';
  };
  const clearHover = () => { onHover?.(null); document.body.style.cursor = 'auto'; };
  const pick = (id: number) => (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(id); };

  return (
    <group ref={rootRef}>
      {cortexGeo && (
        <mesh
          geometry={cortexGeo}
          material={cortexMat}
          onClick={handleCortex}
          onPointerMove={cortexHover}
          onPointerOut={clearHover}
        />
      )}

      <NeuralPathways selectedId={selectedId} activity={activity} intensity={cutaway ? 1.4 : 0.75} myelin={myelin} />

      <group visible={cutaway}>
        {deepParts.map((p, i) => {
          const interactive = cutaway && !p.decorative;
          return (
            <mesh
              key={i}
              geometry={p.geo}
              material={deepMat}
              position={p.pos}
              scale={p.scale}
              rotation={p.rot ?? [0, 0, 0]}
              onClick={interactive ? pick(p.id) : undefined}
              onPointerOver={interactive ? () => { onHover?.(p.id); document.body.style.cursor = 'pointer'; } : undefined}
              onPointerOut={interactive ? clearHover : undefined}
            />
          );
        })}
      </group>
    </group>
  );
}
