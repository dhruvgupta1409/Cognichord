import { useEffect, useRef } from 'react';

interface Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  freq: number;
  color: [number, number, number];
  firing: boolean;
  fireTimer: number;
}

interface Signal {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: string;
  opacity: number;
}

const COLORS: [number, number, number][] = [
  [0, 212, 255],
  [139, 92, 246],
  [255, 45, 120],
  [16, 185, 129],
];

export default function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const stateRef  = useRef<{ neurons: Neuron[]; signals: Signal[]; tick: number }>({
    neurons: [],
    signals: [],
    tick: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    const N = 60;
    stateRef.current.neurons = Array.from({ length: N }, (_, i) => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x:         Math.random() * canvas.width,
        y:         Math.random() * canvas.height,
        vx:        (Math.random() - 0.5) * 0.18,
        vy:        (Math.random() - 0.5) * 0.18,
        r:         2 + Math.random() * 2.5,
        phase:     Math.random() * Math.PI * 2,
        freq:      0.4 + Math.random() * 0.8,
        color,
        firing:    false,
        fireTimer: 0,
      };
    });

    function spawnSignal() {
      const { neurons, signals } = stateRef.current;
      if (neurons.length < 2 || signals.length > 12) return;
      const ia = Math.floor(Math.random() * neurons.length);
      let ib   = Math.floor(Math.random() * neurons.length);
      while (ib === ia) ib = Math.floor(Math.random() * neurons.length);
      const a = neurons[ia];
      const b = neurons[ib];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 220) return;

      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      a.firing    = true;
      a.fireTimer = 18;

      signals.push({
        fromX:    a.x,
        fromY:    a.y,
        toX:      b.x,
        toY:      b.y,
        progress: 0,
        speed:    0.018 + Math.random() * 0.012,
        color:    `rgb(${color[0]},${color[1]},${color[2]})`,
        opacity:  0.7 + Math.random() * 0.3,
      });
    }

    function draw(ts: number) {
      if (!canvas || !ctx) return;
      const { neurons, signals } = stateRef.current;
      stateRef.current.tick++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = ts * 0.001;

      if (stateRef.current.tick % 28 === 0) spawnSignal();

      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const a = neurons[i];
          const b = neurons[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 160) continue;
          const alpha = (1 - dist / 160) * 0.08;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.progress += s.speed;
        if (s.progress >= 1) {
          signals.splice(i, 1);
          continue;
        }
        const px = s.fromX + (s.toX - s.fromX) * s.progress;
        const py = s.fromY + (s.toY - s.fromY) * s.progress;
        const fade = s.progress < 0.1
          ? s.progress / 0.1
          : s.progress > 0.85
            ? (1 - s.progress) / 0.15
            : 1;

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, 5);
        gradient.addColorStop(0, s.color.replace(')', `,${fade * s.opacity})`).replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const n of neurons) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        n.x = Math.max(0, Math.min(canvas.width,  n.x));
        n.y = Math.max(0, Math.min(canvas.height, n.y));

        if (n.fireTimer > 0) n.fireTimer--;
        else n.firing = false;

        const pulse = n.firing
          ? 1.6 + 0.6 * Math.sin(t * n.freq * 10)
          : 1 + 0.3 * Math.sin(t * n.freq + n.phase);

        const [r, g, b] = n.color;
        const alpha = n.firing ? 0.9 : 0.5 + 0.3 * Math.sin(t * n.freq + n.phase);

        if (n.firing || alpha > 0.65) {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
          glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.4})`);
          glow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.fillStyle = glow;
          ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-70"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
