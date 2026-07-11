import { motion } from 'framer-motion';

export default function PathwayDiagram() {
  const nodes = [
    { id: 'auditory',    x: 80,  y: 60,  label: 'Auditory\nCortex',      color: '#00D4FF', r: 32 },
    { id: 'vta',         x: 240, y: 180, label: 'VTA',                    color: '#FF2D78', r: 28 },
    { id: 'nac',         x: 400, y: 100, label: 'Nucleus\nAccumbens',     color: '#F59E0B', r: 30 },
    { id: 'pfc',         x: 400, y: 260, label: 'Prefrontal\nCortex',     color: '#8B5CF6', r: 28 },
    { id: 'amygdala',    x: 240, y: 300, label: 'Amygdala',               color: '#10B981', r: 26 },
    { id: 'hippocampus', x: 100, y: 240, label: 'Hippocampus',            color: '#8B5CF6', r: 28 },
    { id: 'cerebellum',  x: 530, y: 200, label: 'Cerebellum\n(timing)',   color: '#00D4FF', r: 28 },
    { id: 'motor',       x: 530, y: 60,  label: 'Motor\nCortex',          color: '#FF2D78', r: 26 },
  ];

  const edges = [
    { from: 'auditory',    to: 'vta',         label: 'reward signal',  color: '#FF2D78' },
    { from: 'auditory',    to: 'hippocampus', label: 'memory encode',  color: '#8B5CF6' },
    { from: 'vta',         to: 'nac',         label: 'DA release',     color: '#F59E0B' },
    { from: 'vta',         to: 'pfc',         label: 'DA modulation',  color: '#8B5CF6' },
    { from: 'vta',         to: 'amygdala',    label: 'emotion',        color: '#10B981' },
    { from: 'nac',         to: 'pfc',         label: 'motivation',     color: '#F59E0B' },
    { from: 'nac',         to: 'motor',       label: 'motor drive',    color: '#FF2D78' },
    { from: 'amygdala',    to: 'hippocampus', label: 'emotion-memory', color: '#10B981' },
    { from: 'hippocampus', to: 'pfc',         label: 'recall',         color: '#8B5CF6' },
    { from: 'pfc',         to: 'cerebellum',  label: 'prediction',     color: '#00D4FF' },
    { from: 'cerebellum',  to: 'motor',       label: 'timing',         color: '#00D4FF' },
  ];

  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  return (
    <div className="sim-panel">
      <h3 className="font-display font-semibold text-slate-200 mb-1">Mesolimbic Pathway</h3>
      <p className="text-xs text-slate-500 mb-4">
        Neural circuits activated by music practice: dopaminergic reward, memory consolidation, and motor plasticity.
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 620 360"
          className="w-full min-w-0 lg:min-w-[400px]"
          style={{ minHeight: 280 }}
        >
                    <defs>
            {nodes.map(n => (
              <radialGradient key={n.id} id={`glow_${n.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={n.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0" />
              </radialGradient>
            ))}
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
            </marker>
          </defs>

                    {edges.map((edge, i) => {
            const a = getNode(edge.from);
            const b = getNode(edge.to);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / dist;
            const ny = dy / dist;
            const x1 = a.x + nx * a.r;
            const y1 = a.y + ny * a.r;
            const x2 = b.x - nx * b.r;
            const y2 = b.y - ny * b.r;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 12;

            return (
              <g key={i}>
                <motion.line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={edge.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                  markerEnd="url(#arrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                />
                <text x={mx} y={my} textAnchor="middle"
                  fontSize="7" fill={edge.color} opacity="0.55" fontFamily="JetBrains Mono">
                  {edge.label}
                </text>
              </g>
            );
          })}

                    {nodes.map((n, i) => (
            <motion.g
              key={n.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            >
                            <circle cx={n.x} cy={n.y} r={n.r + 12} fill={`url(#glow_${n.id})`} />
                            <circle
                cx={n.x} cy={n.y} r={n.r}
                fill="rgba(7,13,30,0.9)"
                stroke={n.color}
                strokeWidth={1.5}
                strokeOpacity={0.7}
              />
                            {n.label.split('\n').map((line, li) => (
                <text
                  key={li}
                  x={n.x}
                  y={n.y + (li - (n.label.split('\n').length - 1) / 2) * 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                  fill={n.color}
                >
                  {line}
                </text>
              ))}
            </motion.g>
          ))}
        </svg>
      </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
        {[
          { color: '#00D4FF', label: 'Auditory Processing' },
          { color: '#FF2D78', label: 'Dopamine (DA)' },
          { color: '#F59E0B', label: 'Reward Circuit' },
          { color: '#8B5CF6', label: 'Cognitive Control' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
