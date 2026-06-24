export function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const W = 64, H = 18;
  const x = (i: number) => (i * W) / (points.length - 1);
  const y = (v: number) => H - 1 - v * (H - 2);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${W},${H} L0,${H} Z`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="shrink-0">
      <path d={area} fill={stroke} opacity={0.18} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={W} cy={y(last)} r={1.6} fill={stroke} />
    </svg>
  );
}

export function RetentionChart({ baseline, treatment }: { baseline: number[]; treatment: number[] }) {
  const W = 600, H = 200, P = 28;
  const max = 100, min = 60;
  const x = (i: number) => P + (i * (W - P * 2)) / (baseline.length - 1);
  const y = (v: number) => H - P - ((v - min) * (H - P * 2)) / (max - min);
  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const area = `${path(treatment)} L${x(treatment.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;
  return (
    <div className="mt-4 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
        <defs>
          <linearGradient id="treat" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.21 150)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.82 0.21 150)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[60, 70, 80, 90, 100].map((g) => (
          <g key={g}>
            <line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="currentColor" className="text-border" strokeWidth={1} />
            <text x={4} y={y(g) + 3} className="fill-muted-foreground text-[10px]">{g}%</text>
          </g>
        ))}
        <path d={area} fill="url(#treat)" />
        <path d={path(baseline)} fill="none" stroke="currentColor" className="text-muted-foreground/60" strokeWidth={1.5} strokeDasharray="3 4" />
        <path d={path(treatment)} fill="none" stroke="oklch(0.82 0.21 150)" strokeWidth={2.5} />
        {baseline.map((_, i) => i % 2 === 0 && (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">D{i * 7}</text>
        ))}
      </svg>
    </div>
  );
}

export function LegendDot({ className }: { className: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-sm ${className}`} />;
}