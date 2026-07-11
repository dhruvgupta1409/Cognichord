import { useMemo, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVignette: { value: 0.5 },
    uGrain: { value: 0.02 },
    uCA: { value: 0.018 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uVignette; uniform float uGrain; uniform float uCA;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      // a whisper of barrel so the frame feels lensed (much gentler than a CRT)
      vec2 uv = vUv + d * dot(d, d) * 0.012;
      // chromatic aberration — RGB split growing toward the far edges only
      float ca = uCA * dot(d, d);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + d * ca * 0.9).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - d * ca * 0.9).b;
      // vignette
      float v = smoothstep(0.95, 0.28, length(d) * 1.35);
      col *= mix(1.0, v, uVignette);
      // filmic split (cool shadows, warm highlights)
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(col * vec3(0.97,0.99,1.03), col * vec3(1.04,1.0,0.96), smoothstep(0.2,0.8,l));
      // faint animated grain (stops flat darks banding); no scanlines
      col += (hash(vUv * vec2(1920.0,1080.0) + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

interface DoF { focus?: number; aperture?: number; maxblur?: number; }

export default function Postprocessing({
  strength = 0.34, radius = 0.4, threshold = 0.8, vignette = 0.45, grain = 0.02,
  smaa = true, ao = false, dof,
}: {
  strength?: number; radius?: number; threshold?: number; vignette?: number; grain?: number;
  smaa?: boolean; ao?: boolean; dof?: DoF;
}) {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const camera = useThree(s => s.camera);
  const size = useThree(s => s.size);
  const dofRef = useRef(dof);
  dofRef.current = dof;

  const { composer, grade, bokeh } = useMemo(() => {
    const dpr = gl.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(size.width * dpr)),
      Math.max(1, Math.floor(size.height * dpr)),
      { type: THREE.HalfFloatType, samples: 4 },
    );
    const c = new EffectComposer(gl, rt);
    c.addPass(new RenderPass(scene, camera));

    if (ao) {
      const gtao = new GTAOPass(scene, camera, size.width, size.height);
      gtao.updateGtaoMaterial({ radius: 0.28, distanceExponent: 1.0, thickness: 1.0, scale: 1.0, samples: 16, distanceFallOff: 1.0, screenSpaceRadius: false });
      gtao.updatePdMaterial({ lumaPhi: 10.0, depthPhi: 2.0, normalPhi: 3.0, radius: 4.0, radiusExponent: 1.0, rings: 2.0, samples: 16 });
      gtao.blendIntensity = 0.9;
      c.addPass(gtao);
    }

    let bokehPass: BokehPass | null = null;
    if (dof) {
      bokehPass = new BokehPass(scene, camera, {
        focus: dof.focus ?? 8, aperture: dof.aperture ?? 0.0006, maxblur: dof.maxblur ?? 0.006,
      });
      c.addPass(bokehPass);
    }

    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, radius, threshold));
    const gradePass = new ShaderPass(GradeShader);
    gradePass.uniforms.uVignette.value = vignette;
    gradePass.uniforms.uGrain.value = grain;
    c.addPass(gradePass);
    c.addPass(new OutputPass());
    if (smaa) c.addPass(new SMAAPass());
    return { composer: c, grade: gradePass, bokeh: bokehPass };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, ao, !!dof, smaa]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((state) => {
    grade.uniforms.uTime.value = state.clock.elapsedTime;
    if (bokeh && dofRef.current) {
      const u = (bokeh as any).materialBokeh?.uniforms;
      if (u) {
        if (dofRef.current.focus != null) u.focus.value = dofRef.current.focus;
        if (dofRef.current.aperture != null) u.aperture.value = dofRef.current.aperture;
        if (dofRef.current.maxblur != null) u.maxblur.value = dofRef.current.maxblur;
      }
    }
    composer.render();
  }, 1);
  return null;
}
