/**
 * شعار EYAS (الشخص الرافع ذراعيه). هذا هو المكان الوحيد الذي يُرسم فيه الشعار.
 * الجسم يأخذ لون النص (يتبدل مع الوضع الداكن) والرأس بالبرتقالي.
 */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="300 300 1330 1330"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 text-ink ${className}`}
    >
      <path
        d="M483 553 965 1050M1448 553 965 1050"
        fill="none"
        stroke="currentColor"
        strokeWidth="250"
        strokeLinecap="round"
      />
      <path
        d="M823 1000H1108V1540A68 68 0 0 1 1040 1608H891A68 68 0 0 1 823 1540Z"
        fill="currentColor"
      />
      <circle cx="965" cy="503" r="181" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({
  variant = "full",
  size = 40,
  className = "",
}: {
  variant?: "mark" | "full";
  size?: number;
  className?: string;
}) {
  if (variant === "mark") {
    return (
      <span className={`inline-flex ${className}`}>
        <LogoMark size={size} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-xl font-extrabold leading-none tracking-[0.12em] text-ink">
        EYAS
      </span>
      <span aria-hidden className="hidden h-6 w-px bg-line-strong sm:block" />
      <span className="hidden text-[13px] font-medium leading-snug text-muted sm:block">
        الأكاديمية المصرية
        <br />
        للعلوم
      </span>
    </span>
  );
}
