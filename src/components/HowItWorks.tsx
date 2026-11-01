import { Reveal } from "./Reveal";
import { teamSizeText } from "@/content/hero";

const steps = (teamMax?: number) => [
  { title: "سجّل", text: "املأ نموذج التسجيل وانضم إلى مجتمع المسابقة على واتساب." },
  { title: "اختر تحدّيك", text: "بعد إغلاق التسجيل نفتح صفحة الاختيار لتحدد المجال الذي تريده." },
  {
    title: "ابنِ مع فريقك",
    text: `نكوّن الفرق (${teamSizeText(teamMax)})، ثم تسلّمون مشروعكم على ثلاث مراحل.`,
  },
];

export function HowItWorks({ teamMax }: { teamMax?: number }) {
  return (
    <section aria-labelledby="how-title" className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-[15px] font-semibold text-muted">كيف تشارك</p>
          <h2
            id="how-title"
            className="mt-3 font-display text-3xl font-extrabold leading-[1.4] text-ink sm:text-4xl"
          >
            ثلاث خطوات للبداية
          </h2>
        </Reveal>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps(teamMax).map((step, i) => (
            <li key={step.title}>
              <Reveal delay={i * 90} className="card h-full p-6 sm:p-8">
                <span
                  aria-hidden
                  className="block font-display text-7xl font-extrabold leading-none text-accent-display sm:text-8xl"
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-xl font-extrabold text-ink">{step.title}</h3>
                <p className="mt-2 text-base leading-8 text-muted">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
