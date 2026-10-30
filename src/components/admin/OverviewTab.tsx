"use client";

import { Users, Rocket, FileClock, UserCheck, Award, Mailbox } from "lucide-react";
import type { Student, Person, Team, Submission, Certificate } from "@/lib/types";
import { useChallengeOptions } from "@/lib/challengeOptions";

export function OverviewTab({
  students,
  people,
  teams,
  submissions,
  certificates,
}: {
  students: Student[];
  people: Person[];
  teams: Team[];
  submissions: Submission[];
  certificates: Certificate[];
}) {
  const { label } = useChallengeOptions();
  const pending = submissions.filter((s) => s.score === null).length;

  const metrics = [
    { icon: Users, label: "إجمالي الطلاب المسجّلين", value: students.length, color: "from-cyan-500 to-blue-600" },
    { icon: UserCheck, label: "أفراد منشورون على الموقع", value: people.filter((p) => p.published).length, color: "from-blue-500 to-indigo-600" },
    { icon: Rocket, label: "فرق منشورة على الموقع", value: teams.filter((t) => t.published).length, color: "from-emerald-500 to-cyan-500" },
    { icon: FileClock, label: "تسليمات بانتظار التقييم", value: pending, color: "from-amber-500 to-orange-600" },
    { icon: Mailbox, label: "إجمالي التسليمات", value: submissions.length, color: "from-fuchsia-500 to-pink-600" },
    { icon: Award, label: "الشهادات الصادرة", value: certificates.length, color: "from-yellow-400 to-amber-600" },
  ];

  const byChallenge = students.reduce<Record<string, number>>((acc, s) => {
    if (s.challenge) acc[s.challenge] = (acc[s.challenge] ?? 0) + 1;
    return acc;
  }, {});
  const notChosen = students.filter((s) => !s.challenge).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.color}`}>
              <m.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-extrabold text-white">{m.value}</div>
            <div className="mt-1 text-xs text-slate-400">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="mb-4 text-sm font-bold text-white">توزيع الطلاب حسب التحدي</h3>
        <div className="space-y-3">
          {notChosen > 0 && (
            <p className="text-xs text-amber-300">لم يختاروا تحديًا بعد: {notChosen} طالب</p>
          )}
          {Object.entries(byChallenge).length === 0 && (
            <p className="text-sm text-slate-500">لا توجد بيانات بعد.</p>
          )}
          {Object.entries(byChallenge).map(([challenge, count]) => (
            <div key={challenge}>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{label(challenge)}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{ width: `${(count / Math.max(students.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
