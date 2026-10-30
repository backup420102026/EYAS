"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle2, CalendarClock, Plus, Trash2, Star } from "lucide-react";
import type { SeasonSettings } from "@/lib/types";

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60";

function SeasonCard({
  season,
  passcode,
  onUpdated,
  onMadeCurrent,
  onDeleted,
}: {
  season: SeasonSettings;
  passcode: string;
  onUpdated: (s: SeasonSettings) => void;
  onMadeCurrent: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [seasonName, setSeasonName] = useState(season.seasonName);
  const [applicationsOpen, setApplicationsOpen] = useState(season.applicationsOpen);
  const [countdownDate, setCountdownDate] = useState(toLocalInputValue(season.countdownDate));
  const [challengePickOpen, setChallengePickOpen] = useState(season.challengePickOpen);
  const [teamLookupOpen, setTeamLookupOpen] = useState(season.teamLookupOpen);
  const [whatsappLink, setWhatsappLink] = useState(season.whatsappLink);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", "x-admin-passcode": passcode };

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/season", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: season.id, ...body }),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data };
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const { ok, data } = await patch({
        seasonName,
        applicationsOpen,
        challengePickOpen,
        teamLookupOpen,
        whatsappLink,
        countdownDate: new Date(countdownDate).toISOString(),
      });
      if (!ok) {
        setError(data?.message ?? "تعذّر الحفظ.");
        return;
      }
      onUpdated(data.season);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setSaving(false);
    }
  };

  const makeCurrent = async () => {
    setError("");
    const { ok, data } = await patch({ isCurrent: true });
    if (!ok) {
      setError(data?.message ?? "تعذّر التغيير.");
      return;
    }
    onMadeCurrent(season.id);
  };

  const remove = async () => {
    if (!window.confirm(`حذف الموسم «${season.seasonName}»؟`)) return;
    const res = await fetch(`/api/season?id=${season.id}`, {
      method: "DELETE",
      headers: { "x-admin-passcode": passcode },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message ?? "تعذّر الحذف.");
      return;
    }
    onDeleted(season.id);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">{season.seasonName}</h4>
        {season.isCurrent ? (
          <span className="flex items-center gap-1 rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
            <Star className="h-3 w-3" />
            الموسم الحالي (يظهر للزوار)
          </span>
        ) : (
          <button
            onClick={makeCurrent}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300"
          >
            اجعله الموسم الحالي
          </button>
        )}
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div>
          <p className="text-sm font-bold text-white">حالة التسجيل</p>
          <p className="text-xs text-slate-500">
            {applicationsOpen ? "التسجيل مفتوح للطلاب حاليًا" : "التسجيل مغلق حاليًا"}
          </p>
        </div>
        <button
          onClick={() => setApplicationsOpen((v) => !v)}
          aria-label="فتح أو إغلاق التسجيل"
          className={`relative h-7 w-14 rounded-full transition ${
            applicationsOpen ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-slate-700"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
              applicationsOpen ? "right-1" : "right-8"
            }`}
          />
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div>
          <p className="text-sm font-bold text-white">صفحة اختيار التحدي</p>
          <p className="text-xs text-slate-500">
            {challengePickOpen ? "ظاهرة للطلاب في الموقع الآن" : "مخفية عن الطلاب"}
          </p>
        </div>
        <button
          onClick={() => setChallengePickOpen((v) => !v)}
          aria-label="فتح أو إغلاق اختيار التحدي"
          className={`relative h-7 w-14 rounded-full transition ${
            challengePickOpen ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-slate-700"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
              challengePickOpen ? "right-1" : "right-8"
            }`}
          />
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div>
          <p className="text-sm font-bold text-white">صفحة «اعرف فريقك»</p>
          <p className="text-xs text-slate-500">
            {teamLookupOpen ? "ظاهرة للطلاب في الموقع الآن" : "مخفية عن الطلاب (افتحها بعد تكوين الفرق)"}
          </p>
        </div>
        <button
          onClick={() => setTeamLookupOpen((v) => !v)}
          aria-label="فتح أو إغلاق صفحة اعرف فريقك"
          className={`relative h-7 w-14 rounded-full transition ${
            teamLookupOpen ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-slate-700"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
              teamLookupOpen ? "right-1" : "right-8"
            }`}
          />
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">
          رابط مجتمع واتساب (يظهر للطالب بعد التسجيل)
        </label>
        <input
          value={whatsappLink}
          onChange={(e) => setWhatsappLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          dir="ltr"
          className={inputClass}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">اسم الموسم</label>
        <input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} className={inputClass} />
      </div>

      <div className="mb-5">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <CalendarClock className="h-3.5 w-3.5" />
          موعد العد التنازلي المستهدف
        </label>
        <input
          type="datetime-local"
          value={countdownDate}
          onChange={(e) => setCountdownDate(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

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
        {!season.isCurrent && (
          <button
            onClick={remove}
            className="me-auto flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            حذف الموسم
          </button>
        )}
      </div>
    </div>
  );
}

export function SeasonTab({
  passcode,
  seasons,
  onChange,
}: {
  passcode: string;
  seasons: SeasonSettings[];
  onChange: (seasons: SeasonSettings[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    setError("");
    if (newName.trim().length < 2) {
      setError("اكتب اسم الموسم الجديد.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/season", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ seasonName: newName }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "تعذّر إنشاء الموسم.");
        return;
      }
      onChange([...seasons, data.season]);
      setNewName("");
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <p className="text-xs leading-relaxed text-slate-500">
        الموسم «الحالي» هو الذي يراه الزوار (تحدياته وموعده وحالة تسجيله). المواسم الأخرى محفوظة كأرشيف.
      </p>

      {seasons.map((season) => (
        <SeasonCard
          key={season.id}
          season={season}
          passcode={passcode}
          onUpdated={(updated) => onChange(seasons.map((s) => (s.id === updated.id ? updated : s)))}
          onMadeCurrent={(id) => onChange(seasons.map((s) => ({ ...s, isCurrent: s.id === id })))}
          onDeleted={(id) => onChange(seasons.filter((s) => s.id !== id))}
        />
      ))}

      <div className="rounded-2xl border border-dashed border-slate-700 p-5">
        <p className="mb-3 text-sm font-bold text-white">موسم جديد</p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="مثال: الموسم الثاني"
            className={inputClass}
          />
          <button
            onClick={create}
            disabled={creating}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-4 text-sm font-bold text-slate-200 hover:border-cyan-400/60 hover:text-cyan-300 disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إضافة
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <p className="mt-2 text-[11px] text-slate-500">
          يبدأ الموسم الجديد بتسجيل مغلق وبدون تحديات. أضف تحدياته ثم اجعله الموسم الحالي.
        </p>
      </div>
    </div>
  );
}
