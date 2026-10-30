import { hashString } from "@/lib/hash";

const BACKS = ["#FFE3CC", "#D5F2EE", "#E1E9FF", "#FFF1BF", "#FBD9E6"];
const SHIRTS = ["#1E293B", "#F97316", "#0F9D8F", "#6366F1", "#EC4899"];
const SKINS = ["#F6CFAE", "#E9B68F", "#CF9770"];
const HAIRS = ["#2B2118", "#4A2F1B", "#1E1B2E"];

/** A friendly flat avatar. Look is picked from the seed, so it is stable. */
export function PersonAvatar({
  gender,
  seed,
  size = 48,
}: {
  gender: "boy" | "girl";
  seed: string;
  size?: number;
}) {
  const h = hashString(seed);
  const back = BACKS[h % BACKS.length];
  const shirt = SHIRTS[(h >>> 3) % SHIRTS.length];
  const skin = SKINS[(h >>> 6) % SKINS.length];
  const hair = HAIRS[(h >>> 9) % HAIRS.length];
  const girl = gender === "girl";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <defs>
        <clipPath id={`av-${h}`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#av-${h})`}>
        <rect width="64" height="64" fill={back} />
        {girl && (
          <path
            d="M15 31c0-12 7-19 17-19s17 7 17 19v15c0 3-2 5-5 5H20c-3 0-5-2-5-5z"
            fill={hair}
          />
        )}
        <path d="M10 66c0-12 9-18 22-18s22 6 22 18z" fill={shirt} />
        <rect x="27" y="40" width="10" height="11" rx="4" fill={skin} />
        <circle cx="32" cy="29" r="13" fill={skin} />
        {girl ? (
          <>
            <path d="M18.5 28c1-8 6.5-12.5 13.5-12.5S44.5 20 45.5 28c-4-3-8-5-13.5-5s-9.5 2-13.5 5z" fill={hair} />
            <circle cx="46" cy="22" r="4" fill="#F97316" />
            <circle cx="46" cy="22" r="1.6" fill="#FFE3CC" />
          </>
        ) : (
          <path d="M18.5 27c.5-9 6.5-13.5 13.5-13.5S45 18 45.5 27c-3.5-3-8-4.5-13.5-4.5S22 24 18.5 27z" fill={hair} />
        )}
        <circle cx="27.3" cy="30" r="1.6" fill="#1E293B" />
        <circle cx="36.7" cy="30" r="1.6" fill="#1E293B" />
        <circle cx="24.5" cy="34.5" r="2.2" fill="#F97316" opacity=".25" />
        <circle cx="39.5" cy="34.5" r="2.2" fill="#F97316" opacity=".25" />
        <path d="M28.5 35c2 2.3 5 2.3 7 0" fill="none" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
