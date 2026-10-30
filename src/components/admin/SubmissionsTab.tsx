"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Save, Loader2 } from "lucide-react";
import type { Milestone, Submission } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function SubmissionRow({
  submission,
  milestoneLabel,
  passcode,
  onUpdated,
}: {
  submission: Submission;
  milestoneLabel: string;
  passcode: string;
  onUpdated: (s: Submission) => void;
}) {
  const [score, setScore] = useState(submission.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ score: score === "" ? null : Number(score), feedback }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error === "invalid_score" ? "الدرجة من 1 إلى 10." : "تعذّر الحفظ.");
        return;
      }
      onUpdated(data.submission);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="align-top text-slate-300 hover:bg-slate-900/40">
      <td className="px-4 py-3 font-semibold text-white">{submission.teamName}</td>
      <td className="px-4 py-3">{submission.studentName}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
          {milestoneLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <a
          href={submission.link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-blue-300 hover:underline"
        >
          عرض الملف <ExternalLink className="h-3 w-3" />
        </a>
        {submission.note && <p className="mt-1.5 max-w-[220px] whitespace-pre-line text-xs text-slate-500">{submission.note}</p>}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={1}
          max={10}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-center text-sm text-white outline-none focus:border-cyan-400/60"
        />
      </td>
      <td className="px-4 py-3">
        <textarea
          rows={2}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="ملاحظات المرشد..."
          className="w-56 resize-none rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(submission.createdAt)}</td>
      <td className="px-4 py-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          حفظ
        </button>
      </td>
    </tr>
  );
}

export function SubmissionsTab({
  passcode,
  submissions,
  milestones,
  onChange,
}: {
  passcode: string;
  submissions: Submission[];
  milestones: Milestone[];
  onChange: (submissions: Submission[]) => void;
}) {
  const [milestoneFilter, setMilestoneFilter] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "graded">("all");

  const labelOf = (s: Submission) =>
    milestones.find((m) => m.id === s.milestoneId)?.title ?? `المرحلة ${s.milestone}`;

  const filtered = useMemo(
    () =>
      submissions.filter((s) => {
        if (milestoneFilter && s.milestoneId !== milestoneFilter) return false;
        if (status === "pending" && s.score !== null) return false;
        if (status === "graded" && s.score === null) return false;
        return true;
      }),
    [submissions, milestoneFilter, status]
  );

  const pending = submissions.filter((s) => s.score === null).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white">
          مراجعة التسليمات ({submissions.length}) · بانتظار التقييم: {pending}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">كل المراحل</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | "pending" | "graded")}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
          >
            <option value="all">الكل</option>
            <option value="pending">بانتظار التقييم</option>
            <option value="graded">تم تقييمها</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[980px] text-right text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">الفريق</th>
              <th className="px-4 py-3">سلّمه</th>
              <th className="px-4 py-3">المرحلة</th>
              <th className="px-4 py-3">الرابط</th>
              <th className="px-4 py-3">الدرجة (1-10)</th>
              <th className="px-4 py-3">ملاحظات</th>
              <th className="px-4 py-3">آخر تحديث</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((s) => (
              <SubmissionRow
                key={s.id}
                submission={s}
                milestoneLabel={labelOf(s)}
                passcode={passcode}
                onUpdated={(updated) => onChange(submissions.map((sub) => (sub.id === updated.id ? updated : sub)))}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  لا توجد تسليمات.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        الفرق لا ترى الدرجات والملاحظات إلا بعد تفعيل «إظهار التقييمات» للمرحلة من تبويب «المراحل».
      </p>
    </div>
  );
}
