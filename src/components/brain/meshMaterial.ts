import * as THREE from 'three';

const vertexShader = `
  attribute float aRegion;
  attribute float aCrease;
  attribute vec3 aBary;
  varying vec3 vNormalW;
  varying vec3 vViewDirW;
  varying vec3 vWorldPos;
  varying float vRegion;
  varying float vCrease;
  varying vec3 vBary;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDirW = cameraPosition - wp.xyz;
    vWorldPos = wp.xyz;
    vRegion = aRegion;
    vCrease = aCrease;
    vBary = aBary;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform vec3  uBase;      // deep body blue
  uniform vec3  uEdge;      // wireframe / rim cyan
  uniform vec3  uKeyDir;
  uniform vec3  uSelectedCol;
  uniform float uSelected;
  uniform float uHover;
  uniform float uOpacity;
  uniform float uReveal;
  uniform float uActivity;
  uniform float uPeel;
  uniform float uEngage[13];
  varying vec3 vNormalW;
  varying vec3 vViewDirW;
  varying vec3 vWorldPos;
  varying float vRegion;
  varying float vCrease;
  varying vec3 vBary;

  float halfLambert(vec3 N, vec3 L){ return clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0); }
  float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i+vec3(0,0,0)),hash3(i+vec3(1,0,0)),f.x), mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x), mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y), f.z);
  }

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDirW);
    vec3 K = normalize(uKeyDir);

    // ── cutaway dissolve (front shell first) ──
    if (uPeel > 0.001) {
      float dis = vnoise(vWorldPos * 3.2 + vec3(0.0, 0.0, uTime * 0.05));
      float facing = 1.0 - abs(dot(N, V));
      float peelField = dis * 0.72 + (1.0 - facing) * 0.28;
      if (peelField < uPeel * 1.15 - 0.02) discard;
    }

    float diff = halfLambert(N, K);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float crease = clamp(vCrease, 0.0, 1.0);

    // deep-blue body: brighter on the gyral crowns, dark in the sulci (crease AO)
    vec3 body = mix(uBase * 0.35, uBase, diff);
    body *= mix(0.30, 1.08, crease);
    vec3 col = body;
    // cool fresnel rim separates it from the void + feeds bloom
    col += uEdge * fres * 0.55;

    // ── fine triangle wireframe over every triangle ──
    float e = min(min(vBary.x, vBary.y), vBary.z);
    float w = fwidth(e) * 1.1;
    float edge = 1.0 - smoothstep(0.0, w, e);
    col += uEdge * edge * (0.85 + 0.4 * crease);

    // travelling energy sweep so the mesh always feels powered
    float band = sin(vWorldPos.y * 6.0 - uTime * 1.6);
    col += uEdge * smoothstep(0.93, 1.0, band) * (0.10 + 0.22 * fres);
    // faint micro-shimmer
    col += uEdge * (vnoise(vWorldPos * 22.0 + uTime * 0.2) - 0.5) * 0.05;

    int ri = int(clamp(vRegion, 0.0, 12.0) + 0.5);

    // engagement: the live locus glows brighter cyan-white and pulses
    float eng = uEngage[ri];
    col += mix(uEdge, vec3(0.85, 0.95, 1.0), 0.5) * eng * (0.22 + 0.5 * fres) * (0.7 + 0.3 * sin(uTime * 3.0 + vWorldPos.y * 4.0));

    // Region containment (ids match regions.ts): the frontal lobe (1) physically INCLUDES the
    // motor / precentral strip (2), and the parietal lobe (4) INCLUDES the somatosensory /
    // postcentral strip (3). So selecting a lobe lights its embedded gyrus too (no blank strip),
    // while selecting the gyrus itself lights only the gyrus.
    float isMotor  = step(abs(vRegion - 2.0), 0.5);
    float isSomato = step(abs(vRegion - 3.0), 0.5);
    float sel = step(abs(vRegion - uSelected), 0.5);
    sel = max(sel, step(abs(uSelected - 1.0), 0.5) * isMotor);    // frontal ⊃ motor
    sel = max(sel, step(abs(uSelected - 4.0), 0.5) * isSomato);   // parietal ⊃ somatosensory
    sel *= step(0.0, uSelected);

    // selection: the chosen lobe becomes a clean, near-flat field of its own colour across its
    // WHOLE surface. Uniform brightness (only a faint lambert sheen) means (a) no base-blue shows
    // through anywhere, and (b) the crown/sulcus light-dark contrast is flattened out, so it reads
    // as a painted region on the surface rather than colour poured into the depth of the folds.
    float pulse = 0.6 + 0.4 * sin(uTime * 2.6);
    vec3 lobeCol = uSelectedCol * (0.82 + 0.26 * diff);
    col = mix(col, lobeCol, sel * 0.94);               // solid fill -> no blue, flat look
    col += uSelectedCol * sel * edge * 0.55;           // keep the triangle wireframe legible on it
    col += uSelectedCol * sel * fres * 0.45 * pulse;   // rim pop for bloom
    // hover: gentle lift (same lobe⊃gyrus containment as selection)
    float hov = step(abs(vRegion - uHover), 0.5);
    hov = max(hov, step(abs(uHover - 1.0), 0.5) * isMotor);
    hov = max(hov, step(abs(uHover - 4.0), 0.5) * isSomato);
    hov *= step(0.0, uHover) * (1.0 - sel);
    col += uSelectedCol * hov * 0.22;

    // global arousal lifts the whole net slightly
    col += uEdge * uActivity * 0.05 * (0.5 + 0.5 * edge);

    // lobe-classification debug palette
    if (uReveal > 0.5) {
      vec3 rc = vec3(0.4);
      if      (vRegion < 1.5) rc = vec3(1.0, 0.10, 0.10);
      else if (vRegion < 2.5) rc = vec3(1.0, 0.55, 0.0);
      else if (vRegion < 3.5) rc = vec3(1.0, 0.95, 0.1);
      else if (vRegion < 4.5) rc = vec3(0.1, 0.9, 0.2);
      else if (vRegion < 5.5) rc = vec3(0.1, 0.85, 1.0);
      else if (vRegion < 6.5) rc = vec3(0.2, 0.3, 1.0);
      else if (vRegion < 7.5) rc = vec3(1.0, 0.2, 1.0);
      else                    rc = vec3(1.0, 1.0, 1.0);
      col = rc * (0.35 + 0.65 * diff) + rc * edge * 0.4;
    }

    // peel fringe
    float alpha = uOpacity;
    if (uPeel > 0.001) {
      float dis = vnoise(vWorldPos * 3.2 + vec3(0.0, 0.0, uTime * 0.05));
      float facing = 1.0 - abs(dot(N, V));
      float peelField = dis * 0.72 + (1.0 - facing) * 0.28;
      float dissolveEdge = smoothstep(uPeel * 1.15, uPeel * 1.15 - 0.14, peelField);
      col += vec3(0.5, 0.85, 1.0) * dissolveEdge * 1.1;
      alpha = clamp(alpha + dissolveEdge * 0.6, 0.0, 1.0);
    }
    alpha = clamp(alpha + edge * 0.35 + fres * 0.15, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

export function createMeshMaterial(opts?: { opacity?: number }): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: (opts?.opacity ?? 1) < 1,
    depthWrite: (opts?.opacity ?? 1) >= 1,
    extensions: { derivatives: true } as any,
    uniforms: {
      uTime:        { value: 0 },
      uBase:        { value: new THREE.Color(0.05, 0.16, 0.34) },
      uEdge:        { value: new THREE.Color(0.28, 0.72, 1.0) },
      uKeyDir:      { value: new THREE.Vector3(0.5, 0.65, 0.6).normalize() },
      uSelectedCol: { value: new THREE.Color('#8fe6ff') },
      uSelected:    { value: -1 },
      uHover:       { value: -1 },
      uOpacity:     { value: opts?.opacity ?? 1 },
      uReveal:      { value: 0 },
      uActivity:    { value: 0 },
      uPeel:        { value: 0 },
      uEngage:      { value: new Array(13).fill(0) },
    },
  });
}
