import { hashString } from "@/lib/hash";

const PALETTES = [
  { bg: "#FFEDD5", a: "#F97316", b: "#1E293B" },
  { bg: "#CCFBF1", a: "#0F9D8F", b: "#1E293B" },
  { bg: "#DBEAFE", a: "#3B82F6", b: "#F97316" },
  { bg: "#FEF3C7", a: "#F59E0B", b: "#0F9D8F" },
  { bg: "#FCE7F3", a: "#EC4899", b: "#1E293B" },
  { bg: "#E0E7FF", a: "#6366F1", b: "#F97316" },
];

const PATTERN_COUNT = 6;

/** A banner picture generated from the team id: same team = same picture, teams look different. */
export function TeamEmblem({ seed, className = "" }: { seed: string; className?: string }) {
  const h = hashString(seed);
  const p = PALETTES[h % PALETTES.length];
  const pattern = (h >>> 4) % PATTERN_COUNT;
  const shift = (h >>> 8) % 40; // small variation inside a pattern
  const cells = Array.from({ length: 6 }, (_, i) => i);

  let art;
  switch (pattern) {
    case 0: // overlapping circles
      art = (
        <>
          <circle cx={50 + shift} cy="52" r="46" fill={p.a} />
          <circle cx={120 + shift} cy="30" r="30" fill={p.b} />
          <circle cx={190 + shift / 2} cy="62" r="40" fill={p.a} opacity=".55" />
        </>
      );
      break;
    case 1: // diagonal stripes
      art = (
        <g transform={`translate(${-shift} 0)`}>
          {cells.map((i) => (
            <path key={i} d={`M${i * 48} 96 L${i * 48 + 48} 0 H${i * 48 + 72} L${i * 48 + 24} 96Z`} fill={i % 2 ? p.b : p.a} opacity={i % 2 ? 0.9 : 1} />
          ))}
        </g>
      );
      break;
    case 2: // triangles
      art = (
        <g transform={`translate(${-shift / 2} 0)`}>
          {cells.map((i) => (
            <path key={i} d={`M${i * 44} 96 L${i * 44 + 22} ${i % 2 ? 30 : 50} L${i * 44 + 44} 96Z`} fill={i % 2 ? p.b : p.a} />
          ))}
        </g>
      );
      break;
    case 3: // dot grid
      art = (
        <>
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 11 }, (_, c) => (
              <circle
                key={`${r}-${c}`}
                cx={14 + c * 24 + (r % 2) * 12 - shift / 2}
                cy={20 + r * 28}
                r={(c + r) % 3 === 0 ? 8 : 5}
                fill={(c + r) % 3 === 0 ? p.b : p.a}
              />
            ))
          )}
        </>
      );
      break;
    case 4: // waves
      art = (
        <g fill="none" strokeWidth="9" strokeLinecap="round">
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M-10 ${24 + i * 26} q 30 -26 60 0 t 60 0 t 60 0 t 60 0 t 60 0`}
              stroke={i === 1 ? p.b : p.a}
              transform={`translate(${-shift} 0)`}
            />
          ))}
        </g>
      );
      break;
    default: // rounded blocks
      art = (
        <>
          {cells.map((i) => (
            <rect
              key={i}
              x={i * 42 - shift / 2}
              y={i % 2 ? 44 : 12}
              width="34"
              height="34"
              rx="10"
              fill={i % 3 === 0 ? p.b : p.a}
              opacity={i % 3 === 1 ? 0.6 : 1}
            />
          ))}
        </>
      );
  }

  return (
    <svg
      viewBox="0 0 240 96"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="240" height="96" fill={p.bg} />
      {art}
    </svg>
  );
}

/** Colors for the team letter badge, matching the banner (dark text on the yellow one). */
export function teamBadge(seed: string): { background: string; color: string } {
  const a = PALETTES[hashString(seed) % PALETTES.length].a;
  return { background: a, color: a === "#F59E0B" ? "#1E293B" : "#FFFFFF" };
}
