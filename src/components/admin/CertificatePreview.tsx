"use client";

import { Atom, Award } from "lucide-react";
import { BADGE_LABELS, formatDate } from "@/lib/utils";

export function CertificatePreview({
  studentName,
  teamName,
  badge,
  issuedAt,
  seasonName,
}: {
  studentName: string;
  teamName: string;
  badge: string;
  issuedAt: string;
  seasonName?: string;
}) {
  const badgeInfo = BADGE_LABELS[badge] ?? BADGE_LABELS.completion;

  return (
    <div
      id="certificate-print-area"
      className="relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden rounded-2xl border-8 bg-gradient-to-br from-[#0f172a] via-[#111e3d] to-[#0f172a] p-8 text-center shadow-2xl sm:p-14"
      style={{ borderColor: badgeInfo.color }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 400 300">
          <circle cx="40" cy="40" r="120" fill="none" stroke={badgeInfo.color} strokeWidth="1" />
          <circle cx="360" cy="260" r="140" fill="none" stroke={badgeInfo.color} strokeWidth="1" />
        </svg>
      </div>

      <div className="relative flex h-full flex-col items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/40 bg-navy">
            <Atom className="h-5 w-5 text-cyan-300" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-wide text-white">
            EYAS <span style={{ color: badgeInfo.color }}>{seasonName ?? "الموسم الأول"}</span>
          </span>
        </div>

        <div>
          <Award className="mx-auto mb-4 h-12 w-12" style={{ color: badgeInfo.color }} />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            شهادة تقدير
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
            {studentName || "اسم الطالب"}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            تقدم الأكاديمية المصرية للعلوم (EYAS) هذه الشهادة تقديرًا للمشاركة المتميزة ضمن فريق{" "}
            <span className="font-bold text-white">{teamName || "اسم الفريق"}</span> في مسابقة
            {seasonName ?? "الموسم الأول"} للعلوم والتقنية.
          </p>
          <div
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold"
            style={{ backgroundColor: `${badgeInfo.color}22`, color: badgeInfo.color }}
          >
            {badgeInfo.label}
          </div>
        </div>

        <div className="flex w-full items-end justify-between text-xs text-slate-400">
          <div className="text-right">
            <p className="font-bold text-white">تاريخ الإصدار</p>
            <p>{formatDate(issuedAt)}</p>
          </div>
          <div className="text-left">
            <p className="font-bold text-white">توقيع المدير الأكاديمي</p>
            <p className="font-display italic text-slate-300">EYAS Academy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
