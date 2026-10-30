import { Download, ExternalLink } from "lucide-react";
import type { Challenge, Resource } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";
import { ChallengeCover } from "./ChallengeCover";

const COUNT_WORD: Record<number, string> = {
  1: "مجال واحد",
  2: "مجالان",
  3: "ثلاثة مجالات",
  4: "أربعة مجالات",
  5: "خمسة مجالات",
  6: "ستة مجالات",
};

export function ChallengeHub({
  challenges,
  resources,
}: {
  challenges: Challenge[];
  resources: Resource[];
}) {
  const countWord = COUNT_WORD[challenges.length] ?? "عدة مجالات";

  return (
    <section id="challenges" className="bg-surface2 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            index="01"
            eyebrow="التحديات العلمية"
            title={`${countWord}، مشكلات حقيقية`}
            description="اختر المجال الذي يشغلك، وابنِ حلًّا علميًا لمشكلة تواجه مصر والعالم. لكل تحدٍّ مخرجات واضحة تُسلَّم على ثلاث مراحل."
          />
        </Reveal>

        {challenges.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line-strong py-16 text-center">
            <p className="text-muted">لم تُنشر التحديات بعد.</p>
          </div>
        )}

        <div className="space-y-8 sm:space-y-10">
          {challenges.map((challenge, i) => {
            const items = challenge.deliverables.split("\n").filter(Boolean);
            const number = String(i + 1).padStart(2, "0");
            const challengeResources = resources.filter((r) => r.challengeId === challenge.id);
            return (
              <Reveal key={challenge.id}>
                <article className="card grid overflow-hidden lg:grid-cols-12">
                  <div
                    className={`relative aspect-[4/3] bg-band lg:col-span-5 lg:aspect-auto lg:min-h-[30rem] ${
                      i % 2 === 1 ? "lg:order-last" : ""
                    }`}
                  >
                    <ChallengeCover challenge={challenge} />
                    <span className="absolute start-4 top-4 rounded-lg bg-surface px-3 py-1.5 font-mono text-[13px] font-semibold text-ink shadow-sm">
                      CH-{number}
                    </span>
                  </div>

                  <div className="p-6 sm:p-10 lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[15px] font-semibold text-accent-text">{number}</span>
                      <span className="pill">{challenge.category}</span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-extrabold leading-[1.45] text-ink sm:text-4xl">
                      {challenge.title}
                    </h3>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-muted sm:text-lg">
                      {challenge.description}
                    </p>

                    <div className="mt-8">
                      <p className="text-base font-semibold text-ink">المخرجات المطلوبة</p>
                      <ol className="mt-3 space-y-2">
                        {items.map((item, idx) => (
                          <li
                            key={item}
                            className="flex gap-4 rounded-xl bg-surface2 px-4 py-3 text-[15px] leading-7"
                          >
                            <span className="font-mono font-semibold text-accent-text">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-ink">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {challengeResources.length > 0 && (
                      <div className="mt-8">
                        <p className="text-base font-semibold text-ink">مصادر مساعدة</p>
                        <ul className="mt-3 overflow-hidden rounded-xl border border-line">
                          {challengeResources.map((resource) => (
                            <li key={resource.id} className="border-b border-line last:border-b-0">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface2"
                              >
                                <span>
                                  <span className="block text-[15px] font-semibold text-ink">
                                    {resource.title}
                                  </span>
                                  {resource.description && (
                                    <span className="mt-0.5 block text-[14px] leading-7 text-muted">
                                      {resource.description}
                                    </span>
                                  )}
                                </span>
                                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-8">
                      {challenge.pdfUrl ? (
                        <a href={challenge.pdfUrl} target="_blank" rel="noreferrer" className="btn-outline">
                          <Download className="h-4 w-4" />
                          تحميل ملف التحدي (PDF)
                        </a>
                      ) : (
                        <p className="text-[15px] text-muted">ملف التحدي سيُنشر قريبًا.</p>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
