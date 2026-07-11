import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadMorphology, type Morphology } from './swc';

const BASE = ((import.meta as any).env?.BASE_URL as string) || '/';

async function fetchText(url: string): Promise<string | null> {
  try { const r = await fetch(url); return r.ok ? await r.text() : null; } catch { return null; }
}
async function fetchJSON<T = any>(url: string): Promise<T | null> {
  try { const r = await fetch(url); return r.ok ? (await r.json()) as T : null; } catch { return null; }
}

export function useCorticalMesh(targetRadius = 2.1): { geometry: THREE.BufferGeometry | null; ready: boolean; source: 'asset' | 'procedural' } {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState<'asset' | 'procedural'>('procedural');
  useEffect(() => {
    let alive = true;
    (async () => {
      const man = await fetchJSON<{ brain?: string }>(`${BASE}models/manifest.json`);
      const file = man?.brain ?? 'brain.glb';
      const head = await fetch(`${BASE}models/${file}`, { method: 'HEAD' }).catch(() => null);
      if (!head || !head.ok) { if (alive) setReady(true); return; }
      new GLTFLoader().load(`${BASE}models/${file}`, (gltf) => {
        if (!alive) return;
        let best: THREE.Mesh | null = null, bestCount = 0;
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if ((m as any).isMesh && m.geometry) {
            const c = (m.geometry.getAttribute('position') as THREE.BufferAttribute)?.count ?? 0;
            if (c > bestCount) { bestCount = c; best = m; }
          }
        });
        if (best) {
          const b = best as THREE.Mesh;
          const g = b.geometry.clone();
          g.applyMatrix4(b.matrixWorld);
          g.computeBoundingSphere();
          const bs = g.boundingSphere!;
          g.translate(-bs.center.x, -bs.center.y, -bs.center.z);
          g.scale(targetRadius / bs.radius, targetRadius / bs.radius, targetRadius / bs.radius);
          g.computeVertexNormals();
          g.computeBoundingSphere();
          setGeometry(g); setSource('asset');
        }
        setReady(true);
      }, undefined, () => { if (alive) setReady(true); });
    })();
    return () => { alive = false; };
  }, [targetRadius]);
  return { geometry, ready, source };
}

export function useMorphologies(): { morphs: Morphology[]; ready: boolean; source: 'asset' | 'procedural' } {
  const [morphs, setMorphs] = useState<Morphology[]>([]);
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState<'asset' | 'procedural'>('procedural');
  useEffect(() => {
    let alive = true;
    (async () => {
      const man = await fetchJSON<{ files?: string[] }>(`${BASE}neurons/manifest.json`);
      let files = man?.files ?? [];
      if (!files.length) {
        for (const name of ['hero.swc', 'pyramidal.swc', 'neuron.swc']) {
          const head = await fetch(`${BASE}neurons/${name}`, { method: 'HEAD' }).catch(() => null);
          if (head?.ok) files.push(name);
        }
      }
      const loaded: Morphology[] = [];
      for (const f of files) {
        const txt = await fetchText(`${BASE}neurons/${f}`);
        if (txt) { try { loaded.push(loadMorphology(txt)); } catch { } }
      }
      if (!alive) return;
      setMorphs(loaded); setSource(loaded.length ? 'asset' : 'procedural'); setReady(true);
    })();
    return () => { alive = false; };
  }, []);
  return { morphs, ready, source };
}
