"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import type { Challenge, Person, SeasonSettings } from "@/lib/types";
import { useChallengeOptions } from "@/lib/challengeOptions";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60";

const GIRL_WORDS = ["بنت", "أنثى", "انثى", "girl", "f", "female"];
const BOY_WORDS = ["ولد", "ذكر", "boy", "m", "male"];

/** Turns pasted lines into people. A line may end with "| ولد" or "| بنت". */
function parseLines(text: string, defaultGender: "boy" | "girl") {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[|،,\t]\s*/);
      const last = (parts.length > 1 ? parts[parts.length - 1] : "").toLowerCase();
      let gender = defaultGender;
      let name = parts[0];
      if (GIRL_WORDS.includes(last)) gender = "girl";
      else if (BOY_WORDS.includes(last)) gender = "boy";
      else name = parts.join(" ");
      return { name, gender };
    });
}

export function PeopleTab({
  passcode,
  seasons,
  challenges,
  people,
  onPeopleChange,
}: {
  passcode: string;
  seasons: SeasonSettings[];
  challenges: Challenge[];
  people: Person[];
  onPeopleChange: (items: Person[]) => void;
}) {
  const { label } = useChallengeOptions();
  const current = seasons.find((s) => s.isCurrent) ?? seasons[0];

  const [seasonId, setSeasonId] = useState(current?.id ?? "");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const seasonChallenges = useMemo(
    () => challenges.filter((c) => (c.seasonId ?? current?.id) === seasonId),
    [challenges, seasonId, current?.id]
  );
  const [challengeSlug, setChallengeSlug] = useState("");
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const effectiveChallenge = seasonChallenges.some((c) => c.slug === challengeSlug)
    ? challengeSlug
    : (seasonChallenges[0]?.slug ?? "");

  const items = people.filter((i) => i.seasonId === seasonId && (!filter || i.challenge === filter));
  const headers = { "Content-Type": "application/json", "x-admin-passcode": passcode };

  const add = async (publish: boolean) => {
    setError("");
    const parsed = parseLines(text, gender);
    if (parsed.length === 0) {
      setError("اكتب اسمًا واحدًا على الأقل (اسم في كل سطر).");
      return;
    }
    if (!effectiveChallenge) {
      setError("أضف تحديًا لهذا الموسم أولًا.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers,
        body: JSON.stringify({ seasonId, challenge: effectiveChallenge, published: publish, items: parsed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "تعذّر الإضافة.");
        return;
      }
      onPeopleChange([...people, ...data.items]);
      setText("");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (ids: string[], body: Record<string, unknown>) => {
    setError("");
    const res = await fetch("/api/people", { method: "PATCH", headers, body: JSON.stringify({ ids, ...body }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message ?? "تعذّر التعديل.");
      return false;
    }
    const byId = new Map<string, Person>((data.items as Person[]).map((i): [string, Person] => [i.id, i]));
    onPeopleChange(people.map((i) => byId.get(i.id) ?? i));
    return true;
  };

  const remove = async (ids: string[]) => {
    if (!window.confirm(`حذف ${ids.length} عنصر نهائيًا؟`)) return;
    setError("");
    const res = await fetch("/api/people", { method: "DELETE", headers, body: JSON.stringify({ ids }) });
    if (!res.ok) {
      setError("تعذّر الحذف.");
      return;
    }
    const gone = new Set(ids);
    onPeopleChange(people.filter((i) => !gone.has(i.id)));
    setSelected((prev) => new Set([...prev].filter((id) => !gone.has(id))));
  };

  const saveRename = async (item: Person) => {
    const next = editValue.trim();
    if (next && next !== item.name) {
      const ok = await patch([item.id], { name: next });
      if (!ok) return;
    }
    setEditingId(null);
  };

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedIds = items.filter((i) => selected.has(i.id)).map((i) => i.id);
  const drafts = items.filter((i) => !i.published);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-white">
          الأفراد المعروضون في الموقع ({people.filter((p) => p.seasonId === seasonId).length})
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">الموسم:</label>
          <select
            value={seasonId}
            onChange={(e) => {
              setSeasonId(e.target.value);
              setSelected(new Set());
              setFilter("");
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

      <p className="text-xs leading-relaxed text-slate-500">
        هذه قائمة «المشاركون» التي يراها الزوار (الاسم الأول وأول حرف فقط). الأسهل: من تبويب «الطلاب المسجّلون» حدّد
        طلابًا واضغط «إضافة للقائمة». ويمكنك أيضًا لصق أسماء هنا.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="mb-3 text-sm font-bold text-white">إضافة أسماء يدويًا</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">التحدي</label>
            <select value={effectiveChallenge} onChange={(e) => setChallengeSlug(e.target.value)} className={inputClass}>
              {seasonChallenges.length === 0 && <option value="">لا توجد تحديات في هذا الموسم</option>}
              {seasonChallenges.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">النوع (للأسطر التي لم تحدد نوعها)</label>
            <div className="flex gap-2">
              {(["boy", "girl"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold ${
                    gender === g ? "border-cyan-400 text-white" : "border-slate-700 text-slate-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/avatar-${g}.svg`} alt="" className="h-6 w-6 rounded-full" />
                  {g === "boy" ? "ولد" : "بنت"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-400">
            الأسماء (اسم في كل سطر، ويمكن كتابة النوع بعد | مثل: منى أحمد | بنت)
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder={"أحمد محمد\nمنى علي | بنت"}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => add(false)}
            disabled={busy}
            className="flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-200 hover:border-cyan-400/60 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إضافة كمسودة
          </button>
          <button
            onClick={() => add(true)}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            إضافة ونشر
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          منشور: {items.length - drafts.length} · مسودة: {drafts.length}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">كل التحديات</option>
            {seasonChallenges.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
          {drafts.length > 0 && (
            <button
              onClick={() => patch(drafts.map((d) => d.id), { published: true })}
              className="rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10"
            >
              نشر كل المسودات ({drafts.length})
            </button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-2.5 text-xs">
          <span className="font-bold text-cyan-200">المحدد: {selectedIds.length}</span>
          <button onClick={() => patch(selectedIds, { published: true })} className="rounded-full border border-slate-600 px-3 py-1.5 font-bold text-slate-200 hover:border-emerald-400/60">
            نشر
          </button>
          <button onClick={() => patch(selectedIds, { published: false })} className="rounded-full border border-slate-600 px-3 py-1.5 font-bold text-slate-200 hover:border-amber-400/60">
            إخفاء
          </button>
          <button onClick={() => remove(selectedIds)} className="rounded-full border border-red-500/40 px-3 py-1.5 font-bold text-red-300 hover:bg-red-500/10">
            حذف
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="bg-slate-900/80 text-xs text-slate-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-cyan-500" aria-label="تحديد الكل" />
              </th>
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">التحدي</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="text-slate-300 hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)} className="h-4 w-4 accent-cyan-500" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => patch([item.id], { gender: item.gender === "girl" ? "boy" : "girl" })}
                      title="اضغط لتغيير النوع (ولد/بنت)"
                      className="flex-shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/avatar-${item.gender === "girl" ? "girl" : "boy"}.svg`} alt="" className="h-8 w-8 rounded-full object-cover" />
                    </button>
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(item);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-48 rounded-lg border border-cyan-400/60 bg-slate-950 px-2.5 py-1.5 text-sm text-white outline-none"
                        />
                        <button onClick={() => saveRename(item)} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white">
                          حفظ
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300">
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-white">{item.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{label(item.challenge)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.published ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-700/40 text-slate-400"
                    }`}
                  >
                    {item.published ? "منشور" : "مسودة"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => patch([item.id], { published: !item.published })}
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-400/60"
                      aria-label={item.published ? "إخفاء" : "نشر"}
                      title={item.published ? "إخفاء" : "نشر"}
                    >
                      {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditValue(item.name);
                      }}
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-400/60"
                      aria-label="تعديل الاسم"
                      title="تعديل الاسم"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove([item.id])} className="rounded-lg border border-red-500/30 p-1.5 text-red-400 hover:bg-red-500/10" aria-label="حذف" title="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  لا توجد عناصر بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
