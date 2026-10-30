"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle2, Upload, Plus, Trash2 } from "lucide-react";
import type { Challenge, SeasonSettings } from "@/lib/types";

function UploadField({
  label,
  value,
  accept,
  passcode,
  onChange,
}: {
  label: string;
  value: string;
  accept: string;
  passcode: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "x-admin-passcode": passcode },
        body,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "تعذّر رفع الملف.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-400">{label}</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="الصق رابطًا أو ارفع ملفًا"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
          dir="ltr"
        />
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          رفع
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface FormState {
  title: string;
  category: string;
  description: string;
  deliverables: string;
  coverImage: string;
  pdfUrl: string;
  teamImage: string;
  published: boolean;
  sortOrder: string;
}

const EMPTY: FormState = {
  title: "",
  category: "",
  description: "",
  deliverables: "",
  coverImage: "",
  pdfUrl: "",
  teamImage: "1",
  published: true,
  sortOrder: "0",
};

function toForm(c: Challenge): FormState {
  return {
    title: c.title,
    category: c.category,
    description: c.description,
    deliverables: c.deliverables,
    coverImage: c.coverImage,
    pdfUrl: c.pdfUrl,
    teamImage: c.teamImage || "1",
    published: c.published,
    sortOrder: String(c.sortOrder),
  };
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60";

function ChallengeEditor({
  challenge,
  seasonId,
  passcode,
  onSaved,
  onDeleted,
  onCancel,
}: {
  challenge: Challenge | null; // null = creating a new one
  seasonId: string;
  passcode: string;
  onSaved: (c: Challenge) => void;
  onDeleted?: (id: string) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>(challenge ? toForm(challenge) : EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const headers = { "Content-Type": "application/json", "x-admin-passcode": passcode };

  const save = async () => {
    setError("");
    if (!form.title.trim() || !form.category.trim() || !form.description.trim() || !form.deliverables.trim()) {
      setError("اكتب العنوان والتصنيف والوصف والمخرجات.");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/challenges", {
        method: challenge ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(
          challenge
            ? { id: challenge.id, ...form, sortOrder: Number(form.sortOrder) || 0 }
            : { seasonId, ...form, sortOrder: Number(form.sortOrder) || 0 }
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "تعذّر الحفظ، حاول مرة أخرى.");
        return;
      }
      onSaved(data.challenge);
      if (challenge) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!challenge || !onDeleted) return;
    if (!window.confirm(`حذف «${challenge.title}» نهائيًا مع كل مصادره؟`)) return;
    const res = await fetch(`/api/challenges?id=${challenge.id}`, {
      method: "DELETE",
      headers: { "x-admin-passcode": passcode },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message ?? "تعذّر الحذف.");
      return;
    }
    onDeleted(challenge.id);
  };

  return (
    <div className="grid gap-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 lg:grid-cols-[220px_1fr]">
      <div className="space-y-3">
        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.coverImage || "/images/egas-logo.svg"}
            alt={form.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-400">صورة الفريق لهذا التحدي</p>
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3"].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("teamImage", n)}
                className={`overflow-hidden rounded-lg border-2 ${
                  form.teamImage === n ? "border-cyan-400" : "border-slate-800"
                }`}
                aria-label={`صورة الفريق ${n}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/team-${n}.svg`} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">العنوان</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">التصنيف (كلمة قصيرة)</label>
            <input value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">الوصف</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-400">
            المخرجات المطلوبة (كل مخرج في سطر)
          </label>
          <textarea
            rows={4}
            value={form.deliverables}
            onChange={(e) => update("deliverables", e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <UploadField
            label="صورة الغلاف (PNG / JPG / WEBP)"
            value={form.coverImage}
            accept="image/png,image/jpeg,image/webp,image/gif"
            passcode={passcode}
            onChange={(url) => update("coverImage", url)}
          />
          <UploadField
            label="ملف التحدي PDF"
            value={form.pdfUrl}
            accept="application/pdf"
            passcode={passcode}
            onChange={(url) => update("pdfUrl", url)}
          />
        </div>
        <p className="text-[11px] text-slate-500">
          الحد الأقصى للملف 4 ميجابايت. بعد الرفع اضغط «حفظ» لنشر التغيير على الموقع.
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-200">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
              className="h-4 w-4 accent-cyan-500"
            />
            منشور على الموقع
          </label>
          <div className="w-28">
            <label className="mb-1 block text-xs font-semibold text-slate-400">الترتيب</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => update("sortOrder", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {challenge ? "حفظ" : "إضافة التحدي"}
            {saved && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
          </button>
          {onCancel && (
            <button onClick={onCancel} className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300">
              إلغاء
            </button>
          )}
          {challenge && onDeleted && (
            <button
              onClick={remove}
              className="me-auto flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChallengesTab({
  passcode,
  challenges,
  seasons,
  onChange,
}: {
  passcode: string;
  challenges: Challenge[];
  seasons: SeasonSettings[];
  onChange: (challenges: Challenge[]) => void;
}) {
  const current = seasons.find((s) => s.isCurrent) ?? seasons[0];
  const [seasonId, setSeasonId] = useState(current?.id ?? "");
  const [adding, setAdding] = useState(false);

  const visible = challenges.filter((c) => (c.seasonId ?? current?.id) === seasonId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">الموسم:</label>
          <select
            value={seasonId}
            onChange={(e) => {
              setSeasonId(e.target.value);
              setAdding(false);
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
        <button
          onClick={() => setAdding(true)}
          disabled={adding || !seasonId}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          إضافة تحدي
        </button>
      </div>

      {adding && (
        <ChallengeEditor
          challenge={null}
          seasonId={seasonId}
          passcode={passcode}
          onSaved={(created) => {
            onChange([...challenges, created]);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {visible.length === 0 && !adding && (
        <p className="rounded-2xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">
          لا توجد تحديات في هذا الموسم بعد. اضغط «إضافة تحدي».
        </p>
      )}

      {visible.map((challenge) => (
        <div key={challenge.id}>
          {!challenge.published && (
            <p className="mb-1.5 text-xs font-bold text-amber-400">مخفي عن الزوار</p>
          )}
          <ChallengeEditor
            challenge={challenge}
            seasonId={seasonId}
            passcode={passcode}
            onSaved={(updated) => onChange(challenges.map((c) => (c.id === updated.id ? updated : c)))}
            onDeleted={(id) => onChange(challenges.filter((c) => c.id !== id))}
          />
        </div>
      ))}
    </div>
  );
}
