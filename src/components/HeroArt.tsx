import type { ReactNode } from "react";

/** A round badge with a small science drawing inside. Icons are drawn around (0,0). */
function Sticker({ x, y, r = 46, children }: { x: number; y: number; r?: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
      {children}
    </g>
  );
}

const INK = "var(--ink)";
const TEAL = "#0F9D8F";
const YELLOW = "#FBBF24";
const ORANGE = "#F97316";

function Flask() {
  return (
    <g>
      <path d="M-14 12 L-23 28 Q-26 36 -18 36 H18 Q26 36 23 28 L14 12 Z" fill={TEAL} transform="translate(0 -9)" />
      <path
        d="M-7 -28 V-14 L-23 16 Q-27 27 -17 27 H17 Q27 27 23 16 L7 -14 V-28"
        fill="none"
        stroke={INK}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M-11 -28 H11" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="-3" cy="9" r="3.2" fill="#fff" opacity=".85" />
      <circle cx="6" cy="14" r="2.2" fill="#fff" opacity=".85" />
    </g>
  );
}

function Bulb() {
  return (
    <g>
      <path
        d="M0 -30 C-17 -30 -25 -17 -22 -4 C-20 3 -14 8 -12 15 H12 C14 8 20 3 22 -4 C25 -17 17 -30 0 -30Z"
        fill={YELLOW}
        stroke={INK}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="-9" y="17" width="18" height="6" rx="3" fill={INK} />
      <rect x="-6" y="24" width="12" height="5" rx="2.5" fill={INK} />
      <path d="M-6 -2 L0 -12 L6 -2" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Atom() {
  return (
    <g fill="none" stroke={INK} strokeWidth="3.6">
      <ellipse rx="29" ry="11" />
      <ellipse rx="29" ry="11" transform="rotate(60)" />
      <ellipse rx="29" ry="11" transform="rotate(120)" />
      <circle r="6.5" fill={ORANGE} stroke="none" />
    </g>
  );
}

function Rocket() {
  return (
    <g transform="rotate(40)">
      <path d="M-6 20 Q0 38 6 20Z" fill={YELLOW} />
      <path d="M-9 8 L-20 22 L-9 20Z M9 8 L20 22 L9 20Z" fill={INK} />
      <path d="M0 -32 C14 -20 14 6 9 21 H-9 C-14 6 -14 -20 0 -32Z" fill={ORANGE} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <circle cy="-8" r="6" fill="#fff" stroke={INK} strokeWidth="3" />
    </g>
  );
}

function Gear() {
  return (
    <g>
      <circle r="22" fill="none" stroke={INK} strokeWidth="11" strokeDasharray="8.6 6.6" />
      <circle r="17" fill={INK} />
      <circle r="7" fill="var(--surface)" />
    </g>
  );
}

function Spark({ x, y, s = 1, color = YELLOW }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -14 Q3 -3 14 0 Q3 3 0 14 Q-3 3 -14 0 Q-3 -3 0 -14Z"
      fill={color}
    />
  );
}

/**
 * رسمة الهيرو: الشخصية (شعار EYAS) في الوسط وحولها أدوات العلم.
 * مرسومة بالكود، فتتبدل ألوانها مع الوضع الداكن. تعدَّل من هذا الملف فقط.
 */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 560"
      role="img"
      aria-label="شخصية EYAS تحيط بها أدوات العلم: دورق وأتوم ومصباح وصاروخ"
      className={className}
    >
      <circle cx="280" cy="286" r="236" fill="var(--blob)" />
      <circle cx="280" cy="286" r="236" fill="none" stroke="var(--accent)" strokeOpacity=".35" strokeWidth="2" strokeDasharray="2 12" strokeLinecap="round" />

      {/* the character: the logo with a face */}
      <svg x="120" y="118" width="320" height="320" viewBox="300 300 1330 1330">
        <path d="M483 553 965 1050M1448 553 965 1050" fill="none" stroke="var(--ink)" strokeWidth="250" strokeLinecap="round" />
        <path d="M823 1000H1108V1540A68 68 0 0 1 1040 1608H891A68 68 0 0 1 823 1540Z" fill="var(--ink)" />
        <circle cx="965" cy="503" r="181" fill="var(--accent)" />
        <circle cx="900" cy="490" r="24" fill="#1E293B" />
        <circle cx="1030" cy="490" r="24" fill="#1E293B" />
        <path d="M905 553 Q965 612 1025 553" fill="none" stroke="#1E293B" strokeWidth="22" strokeLinecap="round" />
        <circle cx="868" cy="548" r="26" fill="#fff" opacity=".35" />
        <circle cx="1062" cy="548" r="26" fill="#fff" opacity=".35" />
      </svg>

      <Sticker x={112} y={150}>
        <Flask />
      </Sticker>
      <Sticker x={452} y={116} r={42}>
        <Bulb />
      </Sticker>
      <Sticker x={486} y={340}>
        <Atom />
      </Sticker>
      <Sticker x={92} y={392} r={44}>
        <Rocket />
      </Sticker>
      <Sticker x={392} y={488} r={40}>
        <Gear />
      </Sticker>

      <Spark x={282} y={58} s={1.1} />
      <Spark x={36} y={270} s={0.8} color={ORANGE} />
      <Spark x={520} y={226} s={0.7} color={TEAL} />
      <Spark x={226} y={512} s={0.9} color={TEAL} />
      <circle cx="170" cy="60" r="7" fill={ORANGE} />
      <circle cx="540" cy="450" r="8" fill={YELLOW} />
      <circle cx="24" cy="470" r="6" fill={TEAL} />
    </svg>
  );
}
