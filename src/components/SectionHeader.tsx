export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  tone = "default",
  className = "mb-10 sm:mb-12",
}: {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  /** "band" is for the dark full-bleed section. */
  tone?: "default" | "band";
  /** Replaces the default bottom margin (use "mb-0" when the header sits beside a form). */
  className?: string;
}) {
  const band = tone === "band";
  return (
    <div className={`max-w-3xl ${className}`}>
      <p
        className={`flex items-center gap-3 text-[15px] font-semibold ${
          band ? "text-band-ink/80" : "text-muted"
        }`}
      >
        <span className={`font-mono ${band ? "text-accent" : "text-accent-text"}`}>{index}</span>
        <span aria-hidden className={`h-px w-10 ${band ? "bg-band-ink/30" : "bg-line-strong"}`} />
        <span>{eyebrow}</span>
      </p>
      <h2
        className={`mt-4 font-display text-3xl font-extrabold leading-[1.4] sm:text-4xl lg:text-5xl lg:leading-[1.35] ${
          band ? "text-band-ink" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-8 sm:text-lg ${
            band ? "text-band-ink/75" : "text-muted"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
