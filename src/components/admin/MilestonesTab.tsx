"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2, CheckCircle2 } from "lucide-react";
import type { Milestone, SeasonSettings } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60";

function toLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
      <span className="text-sm font-semibold text-white">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative h-7 w-14 flex-shrink-0 rounded-full transition ${
          checked ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-slate-700"
        }`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? "right-1" : "right-8"}`} />
      </button>
    </div>
  );
}

function MilestoneEditor({
  milestone,
  passcode,
  onSaved,
  onDeleted,
}: {
  milestone: Milestone;
  passcode: string;
  onSaved: (m: Milestone) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(milestone.title);
  const [description, setDescription] = useState(milestone.description);
  const [opensAt, setOpensAt] = useState(toLocal(milestone.opensAt));
  const [dueAt, setDueAt] = useState(toLocal(milestone.dueAt));
  const [isOpen, setIsOpen] = useState(milestone.isOpen);
  const [resultsVisible, setResultsVisible] = useState(milestone.resultsVisible);
  const [closedMessage, setClosedMessage] = useState(milestone.closedMessage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", "x-admin-passcode": passcode };

  const save = async () => {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: milestone.id,
          title,
          description,
          opensAt: opensAt ? new Date(opensAt).toISOString() : null,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          isOpen,
          resultsVisible,
          closedMessage,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "تعذّر الحفظ.");
        return;
      }
      onSaved(data.item);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`حذف «${milestone.title}»؟`)) return;
    const res = await fetch(`/api/milestones?id=${milestone.id}`, {
      method: "DELETE",
      headers: { "x-admin-passcode": passcode },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message ?? "تعذّر الحذف.");
      return;
    }
    onDeleted(milestone.id);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_200px]">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">عنوان المرحلة</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">تظهر تفاصيلها من</label>
          <input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">آخر موعد للتسليم</label>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-400">
          تفاصيل المرحلة (تظهر للفرق عند بدايتها)
        </label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="المطلوب في هذه المرحلة، شكل التسليم، المعايير..."
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-400">
          رسالة تظهر للفرق عند إغلاق المرحلة (اختياري)
        </label>
        <input
          value={closedMessage}
          onChange={(e) => setClosedMessage(e.target.value)}
          className={inputClass}
          placeholder="مثال: انتهى موعد التسليم، تواصلوا مع المنظمين لو عندكم ظرف خاص."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle checked={isOpen} onChange={setIsOpen} label="التسليم مفتوح (إيقافه يقفله يدويًا)" />
        <Toggle checked={resultsVisible} onChange={setResultsVisible} label="إظهار التقييمات للفرق" />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ
          {saved && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
        </button>
        <button
          onClick={remove}
          className="me-auto flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </button>
      </div>
    </div>
  );
}

export function MilestonesTab({
  passcode,
  seasons,
  milestones,
  onChange,
}: {
  passcode: string;
  seasons: SeasonSettings[];
  milestones: Milestone[];
  onChange: (items: Milestone[]) => void;
}) {
  const current = seasons.find((s) => s.isCurrent) ?? seasons[0];
  const [seasonId, setSeasonId] = useState(current?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const list = useMemo(
    () => milestones.filter((m) => m.seasonId === seasonId).sort((a, b) => a.number - b.number),
    [milestones, seasonId]
  );

  const add = async () => {
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ seasonId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "تعذّر إضافة المرحلة.");
        return;
      }
      onChange([...milestones, data.item]);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">الموسم:</label>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
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
        <button
          onClick={add}
          disabled={adding || !seasonId}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          إضافة مرحلة
        </button>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        المراحل نفسها لكل التحديات. تفاصيل المرحلة تبقى مخفية عن الفرق حتى موعد «تظهر تفاصيلها من». بعد آخر موعد
        للتسليم (أو إيقاف «التسليم مفتوح») يُقفل التسليم. لتمديد الموعد غيّر آخر موعد واحفظ. لا تفعّل «إظهار
        التقييمات» إلا بعد ما تنتهي من تقييم الجميع.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {list.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">
          لا توجد مراحل لهذا الموسم. اضغط «إضافة مرحلة» (أضف ثلاثًا).
        </p>
      )}

      {list.map((m) => (
        <MilestoneEditor
          key={m.id}
          milestone={m}
          passcode={passcode}
          onSaved={(updated) => onChange(milestones.map((x) => (x.id === updated.id ? updated : x)))}
          onDeleted={(id) => onChange(milestones.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  );
}
