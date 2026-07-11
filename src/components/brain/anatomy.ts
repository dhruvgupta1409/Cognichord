import * as THREE from 'three';
import type { TractGroup } from '../../lib/learningModel';
import { TRACT_GROUPS } from '../../lib/learningModel';

export const ANCHORS: Record<string, THREE.Vector3> = {
  prefrontal_R: new THREE.Vector3(0.30, 0.56, 0.72),
  prefrontal_L: new THREE.Vector3(-0.30, 0.56, 0.72),
  motor_R:      new THREE.Vector3(0.36, 0.84, 0.13),
  motor_L:      new THREE.Vector3(-0.36, 0.84, 0.13),
  somato_R:     new THREE.Vector3(0.36, 0.84, -0.10),
  somato_L:     new THREE.Vector3(-0.36, 0.84, -0.10),
  auditory_R:   new THREE.Vector3(0.72, 0.24, 0.08),
  auditory_L:   new THREE.Vector3(-0.72, 0.24, 0.08),
  visual:       new THREE.Vector3(0.0, 0.34, -0.80),
  thalamus:     new THREE.Vector3(0.06, 0.44, -0.05),
  basal_R:      new THREE.Vector3(0.22, 0.48, 0.09),
  basal_L:      new THREE.Vector3(-0.22, 0.48, 0.09),
  cerebellum_R: new THREE.Vector3(0.30, -0.40, -0.60),
  cerebellum_L: new THREE.Vector3(-0.30, -0.40, -0.60),
  hippocampus_R:new THREE.Vector3(0.30, 0.28, -0.04),
  hippocampus_L:new THREE.Vector3(-0.30, 0.28, -0.04),
};

export const ANCHOR_REGION: Record<string, number> = {
  prefrontal_R: 1, prefrontal_L: 1, motor_R: 2, motor_L: 2, somato_R: 3, somato_L: 3,
  auditory_R: 5, auditory_L: 5, visual: 6, thalamus: 12, basal_R: 9, basal_L: 9,
  cerebellum_R: 7, cerebellum_L: 7, hippocampus_R: 10, hippocampus_L: 10,
};

export interface Pathway { a: string; b: string; color: string; bow: number; group: TractGroup; }

export const groupIndex = (g: TractGroup): number => TRACT_GROUPS.indexOf(g);

export const PATHWAYS: Pathway[] = [
  { a: 'auditory_R', b: 'motor_R', color: '#00D4FF', bow: 0.28, group: 'audiomotor' },
  { a: 'auditory_L', b: 'motor_L', color: '#00D4FF', bow: 0.28, group: 'audiomotor' },
  { a: 'motor_R', b: 'cerebellum_L', color: '#A78BFA', bow: 0.42, group: 'cerebellar' },
  { a: 'motor_L', b: 'cerebellum_R', color: '#A78BFA', bow: 0.42, group: 'cerebellar' },
  { a: 'cerebellum_L', b: 'thalamus', color: '#A78BFA', bow: 0.30, group: 'cerebellar' },
  { a: 'cerebellum_R', b: 'thalamus', color: '#A78BFA', bow: 0.30, group: 'cerebellar' },
  { a: 'motor_R', b: 'basal_R', color: '#34D399', bow: 0.22, group: 'bg' },
  { a: 'motor_L', b: 'basal_L', color: '#34D399', bow: 0.22, group: 'bg' },
  { a: 'basal_R', b: 'thalamus', color: '#34D399', bow: 0.20, group: 'bg' },
  { a: 'basal_L', b: 'thalamus', color: '#34D399', bow: 0.20, group: 'bg' },
  { a: 'thalamus', b: 'motor_R', color: '#FCD34D', bow: 0.24, group: 'thalamocortical' },
  { a: 'thalamus', b: 'motor_L', color: '#FCD34D', bow: 0.24, group: 'thalamocortical' },
  { a: 'prefrontal_R', b: 'motor_R', color: '#8B5CF6', bow: 0.20, group: 'prefrontal' },
  { a: 'prefrontal_L', b: 'motor_L', color: '#8B5CF6', bow: 0.20, group: 'prefrontal' },
  { a: 'prefrontal_R', b: 'basal_R', color: '#8B5CF6', bow: 0.26, group: 'prefrontal' },
  { a: 'hippocampus_R', b: 'prefrontal_R', color: '#FBBF24', bow: 0.30, group: 'hippocampal' },
  { a: 'hippocampus_L', b: 'prefrontal_L', color: '#FBBF24', bow: 0.30, group: 'hippocampal' },
  { a: 'visual', b: 'prefrontal_R', color: '#F59E0B', bow: 0.34, group: 'visual' },
];

export function pathwayCurve(p: Pathway): THREE.CatmullRomCurve3 {
  const a = ANCHORS[p.a], b = ANCHORS[p.b];
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const core = new THREE.Vector3(0, 0.42, 0.0);
  const inward = core.clone().sub(mid).normalize().multiplyScalar(p.bow);
  const c1 = a.clone().lerp(mid, 0.5).add(inward.clone().multiplyScalar(0.7));
  const c2 = b.clone().lerp(mid, 0.5).add(inward.clone().multiplyScalar(0.7));
  return new THREE.CatmullRomCurve3([a, c1, mid.clone().add(inward), c2, b]);
}
