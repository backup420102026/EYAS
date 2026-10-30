import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";
import { IconFlag } from "./icons";

interface Task {
  text: string;
  /** A submission deadline: highlighted and always listed last in its card. */
  deadline?: boolean;
}

const STAGES: { week: string; title: string; mark: string; tasks: Task[] }[] = [
  {
    week: "الأسبوع 0",
    title: "التسجيل وتشكيل الفرق",
    mark: "0",
    tasks: [
      { text: "التسجيل الفردي أو كفريق" },
      { text: "اختيار التحدي العلمي المناسب" },
      { text: "تكوين الفرق بواسطة المنظّمين وإعلانها" },
      { text: "جلسة توجيهية تعريفية بالمسابقة" },
    ],
  },
  {
    week: "الأسبوع 1",
    title: "البحث والتخطيط",
    mark: "1",
    tasks: [
      { text: "تحديد المشكلة بدقة وتحليلها" },
      { text: "بحث علمي حول الحلول الممكنة" },
      { text: "تصميم الفكرة الأولية للحل" },
      { text: "تسليم المرحلة 1: خطة المشروع", deadline: true },
    ],
  },
  {
    week: "الأسبوع 2",
    title: "البناء والتطوير",
    mark: "2",
    tasks: [
      { text: "بناء النموذج الأولي أو الكود" },
      { text: "جلسات إرشاد مع المرشدين العلميين" },
      { text: "اختبار الحل وتحسينه" },
      { text: "تسليم المرحلة 2: نموذج أولي يعمل", deadline: true },
    ],
  },
  {
    week: "الأسبوع 3",
    title: "التجهيز للعرض النهائي",
    mark: "3",
    tasks: [
      { text: "تسجيل فيديو العرض التقديمي" },
      { text: "إعداد التقرير الفني النهائي" },
      { text: "العرض النهائي أمام لجنة التحكيم" },
      { text: "تسليم المرحلة 3: المشروع الكامل", deadline: true },
    ],
  },
  {
    week: "الحفل الختامي",
    title: "التكريم والشهادات",
    mark: "★",
    tasks: [
      { text: "إعلان الفرق الفائزة بكل تحدٍّ" },
      { text: "توزيع شهادات الإنجاز الرقمية" },
      { text: "جوائز المبتكر الذهبي والفضي والبرونزي" },
      { text: "فعالية تواصل مع الرعاة والشركاء" },
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="border-y border-line bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            index="02"
            eyebrow="خطة الموسم"
            title="من التسجيل إلى التتويج في ثلاثة أسابيع"
            description="مهام أسبوعية واضحة وثلاث مراحل تسليم. المراحل المعلَّمة بعلامة العلم هي مواعيد التسليم."
          />
        </Reveal>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage, i) => (
            <li key={stage.week} className="flex">
              <Reveal delay={i * 70} className="card flex w-full flex-col p-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-base font-bold text-accent-ink"
                  >
                    {stage.mark}
                  </span>
                  <span className="text-[15px] font-bold text-accent-text">{stage.week}</span>
                </div>

                <h3 className="mt-4 font-display text-xl font-extrabold leading-snug text-ink">
                  {stage.title}
                </h3>

                <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-[15px] leading-7 text-muted">
                  {stage.tasks
                    .filter((t) => !t.deadline)
                    .map((task) => (
                      <li key={task.text} className="flex gap-2.5">
                        <span aria-hidden className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
                        <span>{task.text}</span>
                      </li>
                    ))}
                </ul>

                {stage.tasks
                  .filter((t) => t.deadline)
                  .map((task) => (
                    <p
                      key={task.text}
                      className="mt-5 flex gap-2.5 rounded-xl bg-accent/12 px-3.5 py-3 text-[15px] font-bold leading-7 text-ink"
                    >
                      <IconFlag className="mt-1 h-4 w-4 shrink-0 text-accent-text" />
                      <span>{task.text}</span>
                    </p>
                  ))}
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
