import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export const REGION_DIR: Record<number, THREE.Vector3> = {
  1:  new THREE.Vector3(0.15, 0.35, 1.0),
  2:  new THREE.Vector3(0.35, 0.9, 0.15),
  3:  new THREE.Vector3(0.35, 0.9, -0.12),
  4:  new THREE.Vector3(0.2, 0.6, -0.85),
  5:  new THREE.Vector3(1.0, -0.2, 0.1),
  6:  new THREE.Vector3(0.0, 0.2, -1.1),
  7:  new THREE.Vector3(0.0, -0.5, -1.0),
  8:  new THREE.Vector3(0.0, -0.55, -0.55),
  9:  new THREE.Vector3(0.6, 0.0, 0.25),
  10: new THREE.Vector3(0.7, -0.25, -0.2),
  11: new THREE.Vector3(0.7, -0.3, 0.2),
  12: new THREE.Vector3(0.35, 0.1, -0.1),
};

const HOME_POS = new THREE.Vector3(1.7, 0.7, 2.3);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

export default function CameraRig({
  focusId, enabled = true, autoRotate = false,
}: { focusId: number | null; enabled?: boolean; autoRotate?: boolean }) {
  const camera = useThree(s => s.camera);
  const controls = useRef<any>(null);
  const desiredPos = useRef(HOME_POS.clone());
  const desiredTarget = useRef(HOME_TARGET.clone());
  const animating = useRef(false);

  useEffect(() => {
    if (focusId != null && REGION_DIR[focusId]) {
      const dir = REGION_DIR[focusId].clone().normalize();
      desiredPos.current = dir.clone().multiplyScalar(2.9).add(new THREE.Vector3(0, 0.2, 0));
      desiredTarget.current = dir.clone().multiplyScalar(0.85);
    } else {
      desiredPos.current = HOME_POS.clone();
      desiredTarget.current = HOME_TARGET.clone();
    }
    animating.current = true;
  }, [focusId]);

  useFrame((_, dt) => {
    if (!controls.current) return;
    if (animating.current) {
      const k = 1 - Math.pow(0.0025, dt);
      camera.position.lerp(desiredPos.current, k);
      controls.current.target.lerp(desiredTarget.current, k);
      controls.current.update();
      if (camera.position.distanceTo(desiredPos.current) < 0.01) animating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={enabled}
      screenSpacePanning
      enableZoom={enabled}
      enableRotate={enabled}
      minDistance={1.2}
      maxDistance={6}
      autoRotate={autoRotate && focusId == null}
      autoRotateSpeed={0.45}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
