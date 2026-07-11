import * as THREE from 'three';

export function createMembraneMaterial(opts?: {
  accent?: THREE.ColorRepresentation;
  opacity?: number;
  wire?: number;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: (opts?.opacity ?? 0.9) >= 0.99,
    uniforms: {
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(opts?.accent ?? '#e2a6b8') },
      uRimCol: { value: new THREE.Color(0.5, 0.72, 1.0) },
      uKeyDir: { value: new THREE.Vector3(0.4, 0.8, 0.55).normalize() },
      uFillDir: { value: new THREE.Vector3(-0.5, -0.1, -0.55).normalize() },
      uGrowth: { value: 0.5 },
      uActivity: { value: 0.3 },
      uOpacity: { value: opts?.opacity ?? 0.9 },
      uWire: { value: 0 },
      uPulseWorld: { value: new THREE.Vector3(999, 999, 999) },
      uPulseAmt: { value: 0 },
      uPulseCol: { value: new THREE.Color('#eafcff') },
      uDim: { value: 1.0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vView;
      varying vec3 vNormalW;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vView = cameraPosition - wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime, uGrowth, uActivity, uOpacity, uPulseAmt, uDim;
      uniform vec3 uAccent, uRimCol, uKeyDir, uFillDir, uPulseWorld, uPulseCol;
      varying vec3 vWorldPos, vView, vNormalW;

      float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vnoise(vec3 x){
        vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash3(i+vec3(0,0,0)),hash3(i+vec3(1,0,0)),f.x), mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x), mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y), f.z);
      }
      float hl(vec3 N, vec3 L){ return clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0); }

      void main(){
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(vView);
        // faint micro-surface wobble so the membrane isn't glassy
        float micro = vnoise(vWorldPos * 28.0);
        N = normalize(N + 0.05 * (vec3(micro, vnoise(vWorldPos*40.0+3.0), vnoise(vWorldPos*50.0+9.0)) - 0.5));
        vec3 K = normalize(uKeyDir);
        vec3 F = normalize(uFillDir);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        // desaturated living-tissue body, subtly tinted by the region accent + firmed by learning
        vec3 tissue = vec3(0.62, 0.34, 0.40);
        vec3 base = mix(tissue, uAccent, 0.34) * (0.85 + 0.22 * uGrowth) * (0.92 + 0.16 * micro);
        vec3 col = base * (0.16 + 0.72 * hl(N, K));
        col += base * 0.26 * hl(N, F);

        // subsurface scattering — warm bleed through thin / back-lit processes
        float wrap = clamp((dot(N, K) + 0.5) / 1.5, 0.0, 1.0);
        float back = pow(clamp(dot(V, -K) * 0.5 + 0.5, 0.0, 1.0), 3.0);
        float thin = pow(1.0 - abs(dot(N, V)), 2.2);
        vec3 sss = mix(vec3(0.90, 0.42, 0.44), vec3(0.96, 0.66, 0.66), thin);
        col += sss * base * (wrap * 0.10 + back * 0.22 + thin * 0.16);

        // tight wet specular (moist membrane, not glossy)
        vec3 H = normalize(K + V);
        col += pow(max(dot(N, H), 0.0), 66.0) * 0.16;

        // cool fresnel rim — separates from the dark, feeds a little bloom
        col += uRimCol * fres * (0.24 + 0.14 * uActivity);

        // subtle tonic firing shimmer travelling through the tissue
        float band = sin(vWorldPos.y * 3.0 - uTime * 2.2);
        col += uAccent * smoothstep(0.9, 1.0, band) * 0.10 * uActivity;

        // ── smooth depolarisation glow around the action potential (radial, never boxy) ──
        float d = distance(vWorldPos, uPulseWorld);
        float glow = uPulseAmt * exp(-d * d * 1.1);
        col += (uPulseCol * 0.8 + uAccent * 0.4) * glow * (0.6 + 0.6 * fres);

        col *= uDim;
        float alpha = clamp(uOpacity + fres * 0.22 + glow * 0.5, 0.0, 1.0) * uDim;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

export function createMyelinMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uCol: { value: new THREE.Color('#d8cbe6') },
      uGrowth: { value: 0.5 },
      uDim: { value: 1.0 },
    },
    vertexShader: `
      varying vec3 vWorldPos; varying vec3 vView; varying vec3 vNormalW;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz; vView = cameraPosition - wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime, uGrowth, uDim; uniform vec3 uCol;
      varying vec3 vWorldPos; varying vec3 vView; varying vec3 vNormalW;
      void main(){
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(vView);
        vec3 K = normalize(vec3(0.4, 0.8, 0.55));
        float diff = clamp(dot(N, K) * 0.5 + 0.5, 0.0, 1.0);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
        // waxy lipid highlight
        vec3 H = normalize(K + V);
        float spec = pow(max(dot(N, H), 0.0), 40.0) * 0.35;
        vec3 col = uCol * (0.30 + 0.55 * diff) + uCol * fres * 0.5 + vec3(spec);
        float alpha = (0.42 + 0.4 * uGrowth) + fres * 0.30;
        gl_FragColor = vec4(col * uDim, clamp(alpha, 0.0, 0.92) * uDim);
      }
    `,
  });
}
