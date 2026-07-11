import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import BrainMeshes from './BrainMeshes';
import CameraRig from './CameraRig';
import Postprocessing from './Postprocessing';

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  const { geo, mat } = useMemo(() => {
    const N = 480;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N);
    const palette = [new THREE.Color('#67e8f9'), new THREE.Color('#a78bfa'), new THREE.Color('#cbd5e1'), new THREE.Color('#bae6fd'), new THREE.Color('#ffffff')];
    for (let i = 0; i < N; i++) {
      const r = 3.0 + Math.random() * 6.0;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.8;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      const c = palette[(Math.random() * palette.length) | 0];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      siz[i] = 1.4 + Math.random() * 3.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `attribute vec3 aColor; attribute float aSize; uniform float uTime; varying vec3 vC; varying float vTw;
        void main(){ vC=aColor; vTw = 0.6 + 0.4*sin(uTime*1.5 + position.x*8.0 + position.y*5.0);
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          if(mv.z > -0.05){ gl_Position = vec4(2.0,2.0,2.0,1.0); gl_PointSize = 0.0; return; }
          gl_PointSize = clamp(aSize * vTw * (1.0/-mv.z), 0.0, 24.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; varying float vTw; void main(){ vec2 uv=gl_PointCoord-0.5; float d=length(uv); float a=smoothstep(0.5,0.0,d); if(a<=0.0) discard; gl_FragColor=vec4(vC*(0.5+vTw), a*a*0.5); }`,
    });
    return { geo: g, mat: m };
  }, []);
  useFrame((state, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.01; mat.uniforms.uTime.value = state.clock.elapsedTime; });
  return <points ref={ref} geometry={geo} material={mat} />;
}

function Nebula() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vDir; uniform float uTime;
      float hash(vec3 p){ p=fract(p*0.3183+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float vn(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=0.5; } return s; }
      void main(){
        vec3 d = normalize(vDir);
        float n = fbm(d * 2.2 + vec3(0.0, uTime * 0.01, 0.0));
        vec3 col = mix(vec3(0.012,0.016,0.035), vec3(0.045,0.028,0.085), smoothstep(0.4,0.8,n));  // faint indigo clouds
        col = mix(col, vec3(0.012,0.045,0.06), smoothstep(0.6,0.92,fbm(d*3.5+11.0)) * 0.5);        // faint teal wisps
        col *= 0.55 + 0.45 * smoothstep(0.6, -0.2, d.y);                                           // darker toward top
        float star = smoothstep(0.99, 1.0, hash(floor(d * 320.0)));
        col += star * vec3(0.6,0.7,0.95) * 0.35;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }), []);
  useFrame((state) => { mat.uniforms.uTime.value = state.clock.elapsedTime; });
  return <mesh material={mat}><sphereGeometry args={[40, 32, 24]} /></mesh>;
}

interface Props {
  selectedId: number | null;
  onSelect: (id: number) => void;
  cutaway?: boolean;
  autoRotate?: boolean;
  focusCamera?: boolean;
  enableControls?: boolean;
  bloom?: number;
  activity?: number;
  breathe?: boolean;
  engagement?: number[];
  myelin?: number[];
}

export default function BrainScene({
  selectedId, onSelect, cutaway = false, autoRotate = true, focusCamera = false, enableControls = true, bloom = 0.62,
  activity = 0.14, breathe = true, engagement, myelin,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <>
      <color attach="background" args={['#03040a']} />
      <Nebula />
      <Starfield />
      <BrainMeshes
        selectedId={selectedId}
        hoveredId={hovered}
        onSelect={onSelect}
        onHover={setHovered}
        cutaway={cutaway}
        activity={activity}
        breathe={breathe}
        engagement={engagement}
        myelin={myelin}
      />
      <CameraRig focusId={focusCamera ? selectedId : null} enabled={enableControls} autoRotate={autoRotate} />
      <Postprocessing strength={bloom} ao />
    </>
  );
}
