"use client";

import { useState } from "react";
import { Printer, Sparkles, Loader2 } from "lucide-react";
import type { Certificate, Student } from "@/lib/types";
import { BADGE_LABELS, formatDateTime } from "@/lib/utils";
import { CertificatePreview } from "./CertificatePreview";

export function CertificatesTab({
  passcode,
  students,
  certificates,
  seasonName,
  onChange,
}: {
  passcode: string;
  students: Student[];
  certificates: Certificate[];
  seasonName?: string;
  onChange: (certificates: Certificate[]) => void;
}) {
  const [studentName, setStudentName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [badge, setBadge] = useState("gold");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<Certificate | null>(null);

  const handleSelectStudent = (name: string) => {
    setStudentName(name);
    const match = students.find((s) => s.fullName === name);
    if (match?.teamName) setTeamName(match.teamName);
  };

  const generate = async () => {
    if (!studentName || !teamName) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ studentName, teamName, badge }),
      });
      if (res.ok) {
        const data = await res.json();
        onChange([data.certificate, ...certificates]);
        setPreview(data.certificate);
      }
    } finally {
      setGenerating(false);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-white">مولّد الشهادات والأوسمة الرقمية</h3>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">اسم الطالب</label>
            <input
              list="student-names"
              value={studentName}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
              placeholder="اختر أو اكتب اسم الطالب"
            />
            <datalist id="student-names">
              {students.map((s) => (
                <option key={s.id} value={s.fullName} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">اسم الفريق</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
              placeholder="اسم الفريق"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">وسام التقدير</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BADGE_LABELS).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setBadge(key)}
                  className={`rounded-lg border-2 p-2.5 text-xs font-bold transition ${
                    badge === key ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-slate-700 text-slate-400"
                  }`}
                >
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating || !studentName || !teamName}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            توليد الشهادة
          </button>
        </div>

        <div className="space-y-4">
          <CertificatePreview
            studentName={preview?.studentName ?? studentName}
            teamName={preview?.teamName ?? teamName}
            badge={preview?.badge ?? badge}
            issuedAt={preview?.issuedAt ?? new Date().toISOString()}
            seasonName={seasonName}
          />
          <button
            onClick={printCertificate}
            className="mx-auto flex items-center justify-center gap-2 rounded-full border border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-300 print:hidden"
          >
            <Printer className="h-4 w-4" />
            طباعة / تصدير PDF
          </button>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-white">سجل الشهادات الصادرة</h4>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">الطالب</th>
                <th className="px-4 py-3">الفريق</th>
                <th className="px-4 py-3">الوسام</th>
                <th className="px-4 py-3">تاريخ الإصدار</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {certificates.map((c) => (
                <tr key={c.id} className="text-slate-300 hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-semibold text-white">{c.studentName}</td>
                  <td className="px-4 py-3">{c.teamName}</td>
                  <td className="px-4 py-3">{BADGE_LABELS[c.badge]?.label ?? c.badge}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(c.issuedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setPreview(c);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-cyan-400/50 hover:text-cyan-300"
                    >
                      عرض / إعادة طباعة
                    </button>
                  </td>
                </tr>
              ))}
              {certificates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    لم يتم إصدار شهادات بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
