import type { ReactNode } from "react";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";

function Medal({ n, color, ribbon }: { n: string; color: string; ribbon: string }) {
  return (
    <svg viewBox="0 0 64 84" className="h-24 w-[72px]" aria-hidden="true" focusable="false">
      <path d="M17 2h13l7 24H24z" fill={ribbon} />
      <path d="M47 2H34l-7 24h13z" fill={ribbon} opacity=".75" />
      <circle cx="32" cy="54" r="26" fill={color} />
      <circle cx="32" cy="54" r="19" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
      <text
        x="32"
        y="62"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="#1e293b"
        fontFamily="IBM Plex Mono, monospace"
      >
        {n}
      </text>
    </svg>
  );
}

function Certificate() {
  return (
    <svg viewBox="0 0 64 84" className="h-24 w-[72px]" aria-hidden="true" focusable="false">
      <rect x="6" y="10" width="52" height="58" rx="7" fill="var(--surface)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M16 24h32M16 34h32M16 44h18" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="58" r="12" fill="var(--accent)" />
      <path d="m38.5 58.2 4 4 7-8" fill="none" stroke="var(--accent-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const AWARDS: { name: string; note: string; bar: string; art: ReactNode }[] = [
  {
    name: "المبتكر الذهبي",
    note: "التقدير الأعلى للفريق الفائز بكل تحدٍّ.",
    bar: "#e0a526",
    art: <Medal n="1" color="#f0b83a" ribbon="#f97316" />,
  },
  {
    name: "الفضي المتميز",
    note: "تقدير للمشاريع المتميزة.",
    bar: "#9aa6b8",
    art: <Medal n="2" color="#c3ccd9" ribbon="#64748b" />,
  },
  {
    name: "البرونزي الواعد",
    note: "تقدير للمشاريع الواعدة.",
    bar: "#b8743a",
    art: <Medal n="3" color="#d39560" ribbon="#92400e" />,
  },
  {
    name: "شهادة إتمام رسمية",
    note: "شهادة رقمية من الأكاديمية لمن أتمّ مشروعه.",
    bar: "var(--accent)",
    art: <Certificate />,
  },
];

export function Awards() {
  return (
    <section id="awards" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            index="03"
            eyebrow="الأوسمة والشهادات"
            title="تقدير يليق بما تبنيه"
            description="تصدر الأكاديمية شهادات رقمية رسمية لكل المشاركين، وأوسمة خاصة للفرق المتميزة."
          />
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AWARDS.map((award, i) => (
            <li key={award.name}>
              <Reveal delay={i * 80} className="card h-full overflow-hidden">
                <span aria-hidden className="block h-1.5 w-full" style={{ background: award.bar }} />
                <div className="p-6 sm:p-8">
                  {award.art}
                  <h3 className="mt-6 font-display text-xl font-extrabold text-ink">{award.name}</h3>
                  <p className="mt-2 text-base leading-8 text-muted">{award.note}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
