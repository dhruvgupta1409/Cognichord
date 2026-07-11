import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import BrainScene from './BrainScene';

export default function BrainStage({
  onOpen, autoRotate = true, paused = false, bloom = 0.34, className = '', activity, engagement, myelin,
}: {
  onOpen: (id: number) => void;
  autoRotate?: boolean;
  paused?: boolean;
  bloom?: number;
  className?: string;
  activity?: number;
  engagement?: number[];
  myelin?: number[];
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [1.7, 0.7, 2.3], fov: 42 }}
        dpr={[1, 1.8]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        frameloop={paused ? 'never' : 'always'}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; }}
      >
        <BrainScene
          selectedId={null}
          onSelect={onOpen}
          autoRotate={autoRotate}
          focusCamera={false}
          bloom={bloom}
          activity={activity}
          engagement={engagement}
          myelin={myelin}
        />
      </Canvas>
    </div>
  );
}
