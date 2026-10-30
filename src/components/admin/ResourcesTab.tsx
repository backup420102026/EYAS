"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import type { Challenge, Resource, SeasonSettings } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60";

export function ResourcesTab({
  passcode,
  challenges,
  seasons,
  resources,
  onChange,
}: {
  passcode: string;
  challenges: Challenge[];
  seasons: SeasonSettings[];
  resources: Resource[];
  onChange: (resources: Resource[]) => void;
}) {
  const [challengeId, setChallengeId] = useState(challenges[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const list = resources.filter((r) => r.challengeId === challengeId);

  const add = async () => {
    setError("");
    if (!challengeId) {
      setError("أضف تحديًا أولًا.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ challengeId, title, description, url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "تعذّر إضافة المصدر.");
        return;
      }
      onChange([...resources, data.resource]);
      setTitle("");
      setDescription("");
      setUrl("");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("حذف هذا المصدر؟")) return;
    const res = await fetch(`/api/resources?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-passcode": passcode },
    });
    if (res.ok) onChange(resources.filter((r) => r.id !== id));
    else alert("تعذّر الحذف.");
  };

  if (challenges.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">
        أضف تحديًا أولًا من تبويب «التحديات» ثم ارجع هنا لإضافة مصادره.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">التحدي</label>
        <select value={challengeId} onChange={(e) => setChallengeId(e.target.value)} className={inputClass}>
          {seasons.map((season) => {
            const inSeason = challenges.filter((c) => (c.seasonId ?? seasons.find((s) => s.isCurrent)?.id) === season.id);
            if (inSeason.length === 0) return null;
            return (
              <optgroup key={season.id} label={season.seasonName}>
                {inSeason.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="mb-3 text-sm font-bold text-white">إضافة مصدر</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">العنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">الرابط</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              dir="ltr"
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-400">وصف قصير (اختياري)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          onClick={add}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          إضافة
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
        <p className="border-b border-slate-800 px-5 py-3 text-sm font-bold text-white">
          مصادر هذا التحدي ({list.length})
        </p>
        {list.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">لا توجد مصادر بعد.</p>}
        <ul>
          {list.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 border-b border-slate-800/70 px-5 py-3 last:border-0">
              <div className="min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:underline"
                >
                  {r.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {r.description && <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>}
              </div>
              <button
                onClick={() => remove(r.id)}
                aria-label="حذف المصدر"
                className="flex-shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
