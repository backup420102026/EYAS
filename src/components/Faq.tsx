import { FAQ_ITEMS } from "@/content/faq";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Faq() {
  // structured data so search engines can understand the questions
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section id="faq" className="bg-surface2 py-20 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        <Reveal className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeader
              className="mb-0"
              index="06"
              eyebrow="الأسئلة الشائعة"
              title="أسئلة قد تدور في بالك"
              description="إجابات سريعة عن أكثر الأسئلة التي تصلنا من الطلاب وأولياء الأمور."
            />
          </div>
        </Reveal>

        <Reveal className="lg:col-span-8" delay={80}>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <details key={item.q} open={i === 0} className="group card overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-base font-bold leading-8 text-ink sm:text-lg">
                    {item.q}
                  </span>
                  <Chevron />
                </summary>
                <p className="border-t border-line px-5 py-4 text-base leading-8 text-muted sm:px-6 sm:py-5">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
