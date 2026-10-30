import { Reveal } from "./Reveal";
import { IconArrowForward } from "./icons";

/** Full-bleed orange closing call to action, right before the footer. */
export function CtaBand({
  registrationOpen,
  onRegisterClick,
}: {
  registrationOpen: boolean;
  onRegisterClick: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-accent text-accent-ink">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 400 300"
        fill="none"
        className="pointer-events-none absolute -start-10 top-1/2 h-[320px] w-[420px] -translate-y-1/2 opacity-15"
      >
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M20 ${260 - i * 46} L200 ${90 - i * 46} L380 ${260 - i * 46}`}
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Reveal className="max-w-3xl">
          <h2 className="font-display text-4xl font-extrabold leading-[1.3] sm:text-6xl">
            {registrationOpen ? "جاهز تبدأ؟" : "التسجيل مغلق حاليًا"}
          </h2>
          <p className="mt-5 text-lg leading-9 sm:text-xl">
            {registrationOpen
              ? "سجّل الآن، واختر تحدّيك، وابنِ حلًّا مع فريقك."
              : "تابع مجتمع المسابقة على واتساب لمعرفة موعد فتح باب التسجيل في الموسم القادم."}
          </p>
          <div className="mt-8">
            {registrationOpen ? (
              <button
                onClick={onRegisterClick}
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent-ink px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-black"
              >
                سجّل في المسابقة
                <IconArrowForward className="h-5 w-5" />
              </button>
            ) : (
              <a
                href="#challenges"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent-ink px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-black"
              >
                استعرض التحديات
                <IconArrowForward className="h-5 w-5" />
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
