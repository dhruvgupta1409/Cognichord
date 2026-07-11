import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PATHWAYS, ANCHOR_REGION, pathwayCurve, groupIndex } from './anatomy';
import { TRACT_GROUPS } from '../../lib/learningModel';

const SAMPLES = 50;

const vert = `
  attribute float aT;        // 0..1 along this tract
  attribute float aPhase;    // per-tract offset
  attribute float aSpeed;    // per-tract flow speed
  attribute float aPulses;   // pulses along the tract
  attribute float aGroup;    // tract-group index (into uMyelin)
  attribute vec3  aColor;
  attribute vec2  aEnds;     // region ids of the two endpoints
  uniform float uTime;
  uniform float uSelected;
  uniform float uActivity;
  uniform float uSize;
  uniform float uIntensity;
  uniform float uMyelin[7];  // per-tract-group myelination 0..1 — the durable structural change
  varying vec3  vColor;
  varying float vBright;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float mye = uMyelin[int(aGroup + 0.5)];
    // A myelinated axon conducts faster: pulses race along a thick, bright tract; an
    // unmyelinated one is thin, dim, and sluggish. So the connectome visibly strengthens.
    float speed = aSpeed * (0.45 + 1.3 * mye);
    float phase = aT * aPulses - uTime * speed + aPhase;
    float pulse = pow(0.5 + 0.5 * sin(phase * 6.2831853), 16.0);
    float sel = (abs(aEnds.x - uSelected) < 0.5 || abs(aEnds.y - uSelected) < 0.5) ? 1.0 : 0.0;
    float base = 0.028 + 0.075 * mye + 0.04 * uActivity;   // faint always-on tract, brighter when myelinated
    float bright = (base + pulse * (0.4 + 0.7 * mye + 0.9 * uActivity)) * uIntensity;
    bright *= mix(1.0, 2.1, sel);              // selected structure's network surges
    bright *= mix(1.0, 0.55, step(0.0, uSelected) * (1.0 - sel)); // others recede a little
    vBright = clamp(bright, 0.0, 1.7);
    vColor = aColor;
    if (mv.z > -0.05) { gl_Position = vec4(2.0,2.0,2.0,1.0); gl_PointSize = 0.0; return; }
    // thicker with myelin, and a touch larger on a passing pulse
    gl_PointSize = clamp(uSize * (0.35 + 0.8 * mye + 1.4 * pulse * (0.5 + sel)) * (1.0 / -mv.z), 0.0, 32.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = `
  precision highp float;
  varying vec3  vColor;
  varying float vBright;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(vColor * vBright * 1.25, a);
  }
`;

const DEFAULT_MYELIN = new Array(TRACT_GROUPS.length).fill(0.62);

export default function NeuralPathways({ selectedId, activity = 0, intensity = 1, myelin }: {
  selectedId: number | null; activity?: number; intensity?: number; myelin?: number[];
}) {
  const activityRef = useRef(0);
  const intensityRef = useRef(intensity);
  const myelinRef = useRef<number[]>((myelin ?? DEFAULT_MYELIN).slice());

  const geo = useMemo(() => {
    const N = PATHWAYS.length * SAMPLES;
    const pos = new Float32Array(N * 3);
    const aT = new Float32Array(N);
    const aPhase = new Float32Array(N);
    const aSpeed = new Float32Array(N);
    const aPulses = new Float32Array(N);
    const aGroup = new Float32Array(N);
    const aColor = new Float32Array(N * 3);
    const aEnds = new Float32Array(N * 2);
    let k = 0;
    PATHWAYS.forEach((p, ei) => {
      const curve = pathwayCurve(p);
      const pts = curve.getSpacedPoints(SAMPLES - 1);
      const col = new THREE.Color(p.color);
      const phase = (ei * 0.618) % 1;
      const speed = 0.22 + (ei % 4) * 0.05;
      const pulses = 2 + (ei % 3);
      const gi = groupIndex(p.group);
      const rA = ANCHOR_REGION[p.a], rB = ANCHOR_REGION[p.b];
      for (let s = 0; s < SAMPLES; s++) {
        const v = pts[s];
        pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
        aT[k] = s / (SAMPLES - 1);
        aPhase[k] = phase; aSpeed[k] = speed; aPulses[k] = pulses; aGroup[k] = gi;
        aColor[k * 3] = col.r; aColor[k * 3 + 1] = col.g; aColor[k * 3 + 2] = col.b;
        aEnds[k * 2] = rA; aEnds[k * 2 + 1] = rB;
        k++;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
    g.setAttribute('aPulses', new THREE.BufferAttribute(aPulses, 1));
    g.setAttribute('aGroup', new THREE.BufferAttribute(aGroup, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
    g.setAttribute('aEnds', new THREE.BufferAttribute(aEnds, 2));
    return g;
  }, []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uSelected: { value: -1 },
      uActivity: { value: 0 },
      uSize: { value: 15 },
      uIntensity: { value: intensity },
      uMyelin: { value: (myelin ?? DEFAULT_MYELIN).slice() },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, dt) => {
    const u = mat.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uSelected.value = selectedId ?? -1;
    const k = 1 - Math.pow(0.02, dt);
    activityRef.current += (activity - activityRef.current) * k;
    intensityRef.current += (intensity - intensityRef.current) * k;
    u.uActivity.value = activityRef.current;
    u.uIntensity.value = intensityRef.current;
    const target = myelin ?? DEFAULT_MYELIN;
    const cur = myelinRef.current;
    const arr = u.uMyelin.value as number[];
    for (let i = 0; i < cur.length; i++) { cur[i] += ((target[i] ?? 0) - cur[i]) * k; arr[i] = cur[i]; }
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
