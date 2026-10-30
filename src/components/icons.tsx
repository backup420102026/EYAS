import type { ReactNode, SVGProps } from "react";

function Svg({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export function IconCheck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5 9.5 17 19 7" />
    </Svg>
  );
}

export function IconBadgeCheck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.3 2.5 2.5 4.5-5" />
    </Svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17.5" cy="9" r="2.4" />
      <path d="M17 14c2.4.2 4 1.9 4 4.5" />
    </Svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  );
}

export function IconVideo({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="6" width="13" height="12" rx="3" />
      <path d="m16 10.5 5-3v9l-5-3z" />
    </Svg>
  );
}

export function IconFlag({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 21V4M6 5h11l-2 4 2 4H6" />
    </Svg>
  );
}

export function IconKey({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M16 7l3 3" />
    </Svg>
  );
}

/** Arrow pointing "forward" in a right-to-left page (to the left). */
export function IconArrowForward({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}
