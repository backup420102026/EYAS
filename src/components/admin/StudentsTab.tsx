"use client";

import { useMemo, useState } from "react";
import { Search, Trash2, Download, UserPlus, Loader2 } from "lucide-react";
import type { AdminTeam, Challenge, Person, SeasonSettings, Student, TeamMember } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useChallengeOptions } from "@/lib/challengeOptions";

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function StudentsTab({
  passcode,
  students,
  seasons,
  challenges,
  people,
  teams,
  members,
  onStudentsChange,
  onPeopleChange,
}: {
  passcode: string;
  students: Student[];
  seasons: SeasonSettings[];
  challenges: Challenge[];
  people: Person[];
  teams: AdminTeam[];
  members: TeamMember[];
  onStudentsChange: (students: Student[]) => void;
  onPeopleChange: (people: Person[]) => void;
}) {
  const { label } = useChallengeOptions();
  const current = seasons.find((s) => s.isCurrent) ?? seasons[0];
  const [seasonId, setSeasonId] = useState(current?.id ?? "");
  const [query, setQuery] = useState("");
  const [challengeFilter, setChallengeFilter] = useState(""); // "" = all, "__none__" = not chosen yet
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // students saved before seasons existed belong to the current season
  const seasonStudents = useMemo(
    () => students.filter((s) => (s.seasonId ?? current?.id) === seasonId),
    [students, seasonId, current?.id]
  );

  const seasonChallenges = useMemo(
    () => challenges.filter((c) => (c.seasonId ?? current?.id) === seasonId),
    [challenges, seasonId, current?.id]
  );

  const teamNameOf = useMemo(() => {
    const names = new Map(teams.map((t): [string, string] => [t.id, t.name]));
    const map = new Map<string, string>();
    for (const m of members) map.set(m.studentId, names.get(m.teamId) ?? "");
    return map;
  }, [teams, members]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    let none = 0;
    for (const s of seasonStudents) {
      if (s.challenge) map[s.challenge] = (map[s.challenge] ?? 0) + 1;
      else none += 1;
    }
    return { map, none };
  }, [seasonStudents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return seasonStudents.filter((s) => {
      if (challengeFilter === "__none__" && s.challenge) return false;
      if (challengeFilter === "__noteam__" && (!s.challenge || teamNameOf.has(s.id))) return false;
      if (challengeFilter && challengeFilter !== "__none__" && s.challenge !== challengeFilter) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.challenge ? label(s.challenge).toLowerCase().includes(q) : false)
      );
    });
  }, [seasonStudents, query, challengeFilter, label, teamNameOf]);

  const deleteStudent = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    const res = await fetch(`/api/students/${id}`, {
      method: "DELETE",
      headers: { "x-admin-passcode": passcode },
    });
    if (res.ok) onStudentsChange(students.filter((s) => s.id !== id));
  };

  const exportCsv = () => {
    const header = ["الاسم", "الصف", "الهاتف", "البريد الإلكتروني", "موافقة ولي الأمر", "التحدي", "الفريق", "تاريخ التسجيل"];
    const rows = filtered.map((s) => [
      s.fullName,
      s.grade,
      s.phone,
      s.email,
      s.guardianConsent ? "نعم" : "لا",
      s.challenge ? label(s.challenge) : "لم يختر بعد",
      teamNameOf.get(s.id) ?? "",
      formatDateTime(s.createdAt),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    // the BOM makes Excel open Arabic text correctly
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((s) => s.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = filtered.filter((s) => selected.has(s.id));
  const chosenWithChallenge = chosen.filter((s) => s.challenge);

  const addToPeople = async () => {
    setNotice("");
    if (chosenWithChallenge.length === 0) {
      setNotice("المحدّدون لم يختاروا تحديًا بعد، فلا يمكن إضافتهم.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({
          seasonId,
          challenge: chosenWithChallenge[0].challenge,
          published: false,
          items: chosenWithChallenge.map((s) => ({ name: s.fullName, gender, challenge: s.challenge })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice(data?.message ?? "تعذّرت الإضافة.");
        return;
      }
      onPeopleChange([...people, ...data.items]);
      const skipped = chosen.length - chosenWithChallenge.length;
      setNotice(
        `أُضيف ${data.items.length} إلى «الأفراد والفرق» كمسودة (النوع: ${gender === "boy" ? "ولد" : "بنت"}).` +
          (skipped > 0 ? ` تم تخطي ${skipped} لم يختاروا تحديًا.` : "") +
          " انشرهم من هناك."
      );
      setSelected(new Set());
    } catch {
      setNotice("تعذّر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-white">الطلاب المسجّلون ({seasonStudents.length})</p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">الموسم:</label>
          <select
            value={seasonId}
            onChange={(e) => {
              setSeasonId(e.target.value);
              setSelected(new Set());
              setChallengeFilter("");
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.seasonName}
                {s.isCurrent ? " (الحالي)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* counters per challenge */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {seasonChallenges.map((c) => (
          <button
            key={c.id}
            onClick={() => setChallengeFilter(challengeFilter === c.slug ? "" : c.slug)}
            className={`rounded-xl border p-4 text-right transition ${
              challengeFilter === c.slug ? "border-cyan-400 bg-cyan-500/10" : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
            }`}
          >
            <div className="text-2xl font-extrabold text-white">{counts.map[c.slug] ?? 0}</div>
            <div className="mt-1 truncate text-xs text-slate-400">{c.title}</div>
          </button>
        ))}
        <button
          onClick={() => setChallengeFilter(challengeFilter === "__none__" ? "" : "__none__")}
          className={`rounded-xl border p-4 text-right transition ${
            challengeFilter === "__none__" ? "border-amber-400 bg-amber-500/10" : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
          }`}
        >
          <div className="text-2xl font-extrabold text-amber-300">{counts.none}</div>
          <div className="mt-1 text-xs text-slate-400">لم يختاروا تحديًا بعد</div>
        </button>
        <button
          onClick={() => setChallengeFilter(challengeFilter === "__noteam__" ? "" : "__noteam__")}
          className={`rounded-xl border p-4 text-right transition ${
            challengeFilter === "__noteam__" ? "border-amber-400 bg-amber-500/10" : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
          }`}
        >
          <div className="text-2xl font-extrabold text-amber-300">
            {seasonStudents.filter((s) => s.challenge && !teamNameOf.has(s.id)).length}
          </div>
          <div className="mt-1 text-xs text-slate-400">اختاروا تحديًا وبلا فريق</div>
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 sm:w-80">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالاسم، البريد، الهاتف..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="flex items-center justify-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          تصدير Excel ({filtered.length})
        </button>
      </div>

      {chosen.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-xs">
          <span className="font-bold text-cyan-200">المحدد: {chosen.length}</span>
          <span className="text-slate-400">أضفهم إلى «الأفراد والفرق» كمسودة. النوع:</span>
          {(["boy", "girl"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-full border-2 px-3 py-1 font-semibold ${
                gender === g ? "border-cyan-400 text-white" : "border-slate-700 text-slate-400"
              }`}
            >
              {g === "boy" ? "ولد" : "بنت"}
            </button>
          ))}
          <button
            onClick={addToPeople}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1.5 font-bold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            إضافة للقائمة
          </button>
        </div>
      )}
      {notice && <p className="text-xs text-cyan-200">{notice}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[820px] text-right text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-cyan-500" aria-label="تحديد الكل" />
              </th>
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">الصف</th>
              <th className="px-4 py-3">التواصل</th>
              <th className="px-4 py-3">ولي الأمر</th>
              <th className="px-4 py-3">التحدي</th>
              <th className="px-4 py-3">الفريق</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((s) => (
              <tr key={s.id} className="text-slate-300 hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="h-4 w-4 accent-cyan-500" />
                </td>
                <td className="px-4 py-3 font-semibold text-white">{s.fullName}</td>
                <td className="px-4 py-3">{s.grade}</td>
                <td className="px-4 py-3">
                  <div>{s.email}</div>
                  <div className="text-xs text-slate-500">{s.phone}</div>
                </td>
                <td className="px-4 py-3 text-xs">{s.guardianConsent ? "موافق" : "—"}</td>
                <td className="px-4 py-3">{s.challenge ? label(s.challenge) : <span className="text-amber-300">لم يختر</span>}</td>
                <td className="px-4 py-3">{teamNameOf.get(s.id) ?? <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteStudent(s.id)}
                    className="rounded-lg border border-red-500/30 p-1.5 text-red-400 hover:bg-red-500/10"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  لا توجد نتائج.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
