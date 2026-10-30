import type { Challenge } from "@/lib/types";

type Kind = "environment" | "energy" | "ai" | "health" | "generic";

function kindOf(c: Pick<Challenge, "slug" | "category" | "title">): Kind {
  const t = `${c.slug} ${c.category} ${c.title}`.toLowerCase();
  if (/water|environment|مياه|بيئ|زراع/.test(t)) return "environment";
  if (/energy|طاقة|كهرب|شمس/.test(t)) return "energy";
  if (/\bai\b|ذكاء|تقنية|برمج|بيانات/.test(t)) return "ai";
  if (/health|صحة|طب|أنيميا|anemia|medic/.test(t)) return "health";
  return "generic";
}

/** The old starter images (blue squares) are replaced by the drawings below. */
const isLegacyPlaceholder = (src: string) => !src || /^\/images\/challenge-/.test(src);

function Art({ kind }: { kind: Kind }) {
  const ink = "var(--band-ink)";
  switch (kind) {
    case "environment":
      return (
        <>
          <g stroke={ink} strokeOpacity=".28" strokeWidth="2.5" fill="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M0 ${330 + i * 48} C 100 ${290 + i * 48}, 200 ${370 + i * 48}, 300 ${330 + i * 48} S 500 ${290 + i * 48}, 600 ${330 + i * 48} S 760 ${370 + i * 48}, 800 ${330 + i * 48}`}
              />
            ))}
          </g>
          <circle cx="580" cy="165" r="72" fill="var(--accent)" />
          <path
            d="M240 100 C 240 100 176 184 176 232 a64 64 0 0 0 128 0 C 304 184 240 100 240 100 Z"
            fill={ink}
            fillOpacity=".92"
          />
        </>
      );
    case "energy":
      return (
        <>
          <circle cx="400" cy="330" r="118" fill="var(--accent)" />
          <g stroke={ink} strokeOpacity=".55" strokeWidth="7" strokeLinecap="round">
            {Array.from({ length: 11 }, (_, i) => {
              const a = Math.PI + (i / 10) * Math.PI;
              // rounded: the server and the browser compute sin/cos with different last digits,
              // and unrounded values caused a hydration mismatch
              const at = (r: number, f: (x: number) => number, c: number) => Math.round((c + f(a) * r) * 10) / 10;
              return (
                <line
                  key={i}
                  x1={at(158, Math.cos, 400)}
                  y1={at(158, Math.sin, 330)}
                  x2={at(214, Math.cos, 400)}
                  y2={at(214, Math.sin, 330)}
                />
              );
            })}
          </g>
          <rect x="0" y="330" width="800" height="270" fill="var(--band)" />
          <g stroke={ink} strokeOpacity=".25" strokeWidth="2.5">
            <path d="M0 330H800M0 390H800M0 460H800M0 540H800" />
            <path d="M400 330V600M260 330L120 600M540 330L680 600M110 330L-60 600M690 330L860 600" />
          </g>
        </>
      );
    case "ai": {
      const layers = [
        [150, 300, 450],
        [110, 230, 370, 490],
        [190, 410],
      ];
      const xs = [170, 400, 630];
      return (
        <>
          <g stroke={ink} strokeOpacity=".3" strokeWidth="2">
            {layers.slice(0, -1).flatMap((layer, li) =>
              layer.flatMap((y1) =>
                layers[li + 1].map((y2) => (
                  <line key={`${li}-${y1}-${y2}`} x1={xs[li]} y1={y1} x2={xs[li + 1]} y2={y2} />
                ))
              )
            )}
          </g>
          {layers.flatMap((layer, li) =>
            layer.map((y) => (
              <circle
                key={`${li}-${y}`}
                cx={xs[li]}
                cy={y}
                r="20"
                fill={li === 2 && y === 190 ? "var(--accent)" : "var(--band)"}
                stroke={ink}
                strokeOpacity={li === 2 && y === 190 ? 0 : 0.85}
                strokeWidth="4"
              />
            ))
          )}
        </>
      );
    }
    case "health":
      return (
        <>
          <circle cx="400" cy="300" r="128" fill="var(--accent)" />
          <ellipse cx="400" cy="300" rx="50" ry="50" fill="var(--band)" fillOpacity=".55" />
          <circle cx="190" cy="170" r="46" fill={ink} fillOpacity=".18" />
          <circle cx="640" cy="440" r="62" fill={ink} fillOpacity=".18" />
          <circle cx="620" cy="140" r="30" fill={ink} fillOpacity=".18" />
          <path d="M120 470h64M152 438v64" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round" />
        </>
      );
    default:
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M120 ${470 - i * 62} L400 ${200 - i * 62} L680 ${470 - i * 62}`}
              fill="none"
              stroke={i === 0 ? "var(--accent)" : ink}
              strokeOpacity={i === 0 ? 1 : 0.32 - i * 0.04}
              strokeWidth={i === 0 ? 26 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </>
      );
  }
}

/** Fills its parent (the parent must be `relative` with a size). */
export function ChallengeCover({
  challenge,
}: {
  challenge: Pick<Challenge, "slug" | "category" | "title" | "coverImage">;
}) {
  if (!isLegacyPlaceholder(challenge.coverImage)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={challenge.coverImage}
        alt={challenge.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <svg
      role="img"
      aria-label={challenge.title}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <rect width="800" height="600" fill="var(--band)" />
      <Art kind={kindOf(challenge)} />
    </svg>
  );
}
