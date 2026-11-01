"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import type { AdminTeam, Challenge, SeasonSettings, Student, TeamMember } from "@/lib/types";
import { useChallengeOptions } from "@/lib/challengeOptions";


const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60";

const fmtCode = (code: string) => (code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

type Builder = { mode: "create" } | { mode: "edit"; teamId: string };

export function TeamsTab({
  passcode,
  seasons,
  challenges,
  students,
  teams,
  members,
  onTeamsChange,
  onMembersChange,
}: {
  passcode: string;
  seasons: SeasonSettings[];
  challenges: Challenge[];
  students: Student[];
  teams: AdminTeam[];
  members: TeamMember[];
  onTeamsChange: (items: AdminTeam[]) => void;
  onMembersChange: (items: TeamMember[]) => void;
}) {
  const { label } = useChallengeOptions();
  const current = seasons.find((s) => s.isCurrent) ?? seasons[0];

  const [seasonId, setSeasonId] = useState(current?.id ?? "");
  // team size limits come from the season settings
  const seasonRow = seasons.find((s) => s.id === seasonId) ?? current;
  const maxMembers = seasonRow?.teamMaxSize ?? 4;
  const minMembers = seasonRow?.teamMinSize ?? 1;
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  // ----- builder state -----
  const [builder, setBuilder] = useState<Builder | null>(null);
  const [name, setName] = useState("");
  const [challengeSlug, setChallengeSlug] = useState("");
  const [code, setCode] = useState("");
  const [discord, setDiscord] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", "x-admin-passcode": passcode };

  const seasonChallenges = useMemo(
    () => challenges.filter((c) => (c.seasonId ?? current?.id) === seasonId),
    [challenges, seasonId, current?.id]
  );
  const seasonStudents = useMemo(
    () => students.filter((s) => (s.seasonId ?? current?.id) === seasonId),
    [students, seasonId, current?.id]
  );

  const teamOfStudent = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.studentId, m.teamId);
    return map;
  }, [members]);

  const membersOfTeam = (teamId: string) =>
    members
      .filter((m) => m.teamId === teamId)
      .map((m) => students.find((s) => s.id === m.studentId))
      .filter((s): s is Student => Boolean(s));

  const editingTeamId = builder?.mode === "edit" ? builder.teamId : null;
  const builderChallenge = challengeSlug || seasonChallenges[0]?.slug || "";

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return seasonStudents.filter((s) => {
      if (s.challenge !== builderChallenge) return false;
      const t = teamOfStudent.get(s.id);
      if (t && t !== editingTeamId) return false; // already in another team
      if (!q) return true;
      return s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone.includes(q);
    });
  }, [seasonStudents, builderChallenge, teamOfStudent, editingTeamId, search]);

  const waitingForTeam = seasonStudents.filter((s) => s.challenge && !teamOfStudent.has(s.id)).length;

  const openCreate = () => {
    setBuilder({ mode: "create" });
    setName("");
    setChallengeSlug(seasonChallenges[0]?.slug ?? "");
    setCode("");
    setDiscord("");
    setPicked([]);
    setSearch("");
    setError("");
  };

  const openEdit = (team: AdminTeam) => {
    setBuilder({ mode: "edit", teamId: team.id });
    setName(team.name);
    setChallengeSlug(team.challenge);
    setCode(team.code);
    setDiscord(team.discordLink);
    setPicked(members.filter((m) => m.teamId === team.id).map((m) => m.studentId));
    setSearch("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePick = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= maxMembers ? prev : [...prev, id]));

  const saveMembers = async (teamId: string) => {
    const res = await fetch("/api/team-members", {
      method: "POST",
      headers,
      body: JSON.stringify({ teamId, studentIds: picked }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false as const, message: data?.message ?? "تعذّر حفظ الأعضاء." };
    onMembersChange([...members.filter((m) => m.teamId !== teamId), ...data.items]);
    return { ok: true as const };
  };

  const submit = async () => {
    setError("");
    if (name.trim().length < 2) return setError("اكتب اسم الفريق.");
    if (!builderChallenge) return setError("اختر التحدي.");
    if (picked.length < 1) return setError("اختر عضوًا واحدًا على الأقل.");

    setBusy(true);
    try {
      if (builder?.mode === "edit") {
        const res = await fetch("/api/teams", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ ids: [builder.teamId], name, discordLink: discord }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) return setError(data?.message ?? "تعذّر حفظ بيانات الفريق.");
        const updated = (data.items as AdminTeam[])[0];
        onTeamsChange(teams.map((t) => (t.id === updated.id ? updated : t)));
        const r = await saveMembers(builder.teamId);
        if (!r.ok) return setError(r.message);
        setBuilder(null);
        setNotice("تم حفظ التعديلات.");
      } else {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers,
          body: JSON.stringify({
            seasonId,
            challenge: builderChallenge,
            published: false,
            code: code.trim() || undefined,
            discordLink: discord.trim() || undefined,
            items: [{ name }],
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) return setError(data?.message ?? "تعذّر إنشاء الفريق.");
        const created = (data.items as AdminTeam[])[0];
        onTeamsChange([...teams, created]);
        const r = await saveMembers(created.id);
        if (!r.ok) {
          // the team exists now; keep the panel open in edit mode so the admin can fix the members
          setBuilder({ mode: "edit", teamId: created.id });
          setCode(created.code);
          return setError(`${r.message} (الفريق أُنشئ، عدّل الأعضاء وأعد الحفظ).`);
        }
        setBuilder(null);
        setNotice(`تم إنشاء الفريق «${created.name}». كوده: ${fmtCode(created.code)}. هو الآن مسودة، انشره من القائمة.`);
      }
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  };

  const patchTeams = async (ids: string[], body: Record<string, unknown>) => {
    setNotice("");
    const res = await fetch("/api/teams", { method: "PATCH", headers, body: JSON.stringify({ ids, ...body }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setNotice(data?.message ?? "تعذّر التعديل.");
      return false;
    }
    const byId = new Map<string, AdminTeam>((data.items as AdminTeam[]).map((t): [string, AdminTeam] => [t.id, t]));
    onTeamsChange(teams.map((t) => byId.get(t.id) ?? t));
    return true;
  };

  const removeTeams = async (ids: string[]) => {
    if (!window.confirm(`حذف ${ids.length} فريق نهائيًا؟ (الطلاب يرجعون بلا فريق)`)) return;
    const res = await fetch("/api/teams", { method: "DELETE", headers, body: JSON.stringify({ ids }) });
    if (!res.ok) {
      setNotice("تعذّر الحذف.");
      return;
    }
    const gone = new Set(ids);
    onTeamsChange(teams.filter((t) => !gone.has(t.id)));
    onMembersChange(members.filter((m) => !gone.has(m.teamId)));
    setSelected((prev) => new Set([...prev].filter((id) => !gone.has(id))));
  };

  const copyCode = async (team: AdminTeam) => {
    try {
      await navigator.clipboard.writeText(team.code);
      setCopiedId(team.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setNotice("تعذّر النسخ. انسخ الكود يدويًا.");
    }
  };

  const regenerate = async (team: AdminTeam) => {
    if (!window.confirm(`تغيير كود «${team.name}»؟ الكود القديم سيتوقف عن العمل.`)) return;
    await patchTeams([team.id], { regenerateCode: true });
  };

  const items = teams.filter((t) => t.seasonId === seasonId && (!filter || t.challenge === filter));
  const allSelected = items.length > 0 && items.every((t) => selected.has(t.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((t) => t.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectedIds = items.filter((t) => selected.has(t.id)).map((t) => t.id);
  const drafts = items.filter((t) => !t.published);
  const oversized = items.filter((t) => members.filter((m) => m.teamId === t.id).length > maxMembers).length;

  return (
    <div className="space-y-5">
      {oversized > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-200">
          تنبيه: {oversized} فريق أكبر من الحد الأقصى الحالي ({maxMembers}). لم يتغيّر شيء فيها، لكن لا يمكن إضافة أعضاء
          جدد لها، ويمكنك تقليصها أو رفع الحد من إعدادات الموسم.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">
            الفرق ({teams.filter((t) => t.seasonId === seasonId).length})
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            طلاب اختاروا تحديًا وينتظرون فريقًا: <span className="font-bold text-amber-300">{waitingForTeam}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={seasonId}
            onChange={(e) => {
              setSeasonId(e.target.value);
              setSelected(new Set());
              setFilter("");
              setBuilder(null);
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
          <button
            onClick={openCreate}
            disabled={seasonChallenges.length === 0}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            تكوين فريق
          </button>
        </div>
      </div>

      {notice && <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-2.5 text-sm text-cyan-100">{notice}</p>}

      {/* ---------------- builder ---------------- */}
      {builder && (
        <div className="space-y-4 rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">{builder.mode === "edit" ? "تعديل الفريق" : "تكوين فريق جديد"}</p>
            <button onClick={() => setBuilder(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800" aria-label="إغلاق">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">اسم الفريق</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">التحدي</label>
              <select
                value={builderChallenge}
                onChange={(e) => {
                  setChallengeSlug(e.target.value);
                  setPicked([]);
                }}
                disabled={builder.mode === "edit"}
                className={`${inputClass} disabled:opacity-60`}
              >
                {seasonChallenges.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
              {builder.mode === "edit" && <p className="mt-1 text-[11px] text-slate-500">لتغيير التحدي احذف الفريق وكوّنه من جديد.</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">
                كود الفريق {builder.mode === "create" ? "(اتركه فارغًا لتوليده تلقائيًا)" : ""}
              </label>
              <input
                dir="ltr"
                value={builder.mode === "edit" ? fmtCode(code) : code}
                onChange={(e) => setCode(e.target.value)}
                readOnly={builder.mode === "edit"}
                placeholder="مثال: NILE2026"
                className={`${inputClass} font-mono ${builder.mode === "edit" ? "opacity-70" : ""}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">رابط ديسكورد الخاص بالفريق</label>
              <input dir="ltr" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="https://discord.gg/..." className={inputClass} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400">
                  اختر الأعضاء ({picked.length}/{maxMembers}) من المسجّلين في هذا التحدي
                  {picked.length > maxMembers && <span className="ms-2 text-amber-300">فوق الحد الأقصى</span>}
                </label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف أو الإيميل..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
              <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-800">
                {candidates.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-slate-500">
                    لا يوجد طلاب متاحون: إما لم يختر أحد هذا التحدي بعد، أو الجميع في فرق.
                  </li>
                )}
                {candidates.map((s) => {
                  const checked = picked.includes(s.id);
                  const disabled = !checked && picked.length >= maxMembers;
                  return (
                    <li key={s.id} className="border-b border-slate-800/70 last:border-0">
                      <label className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm ${disabled ? "opacity-40" : "hover:bg-slate-900"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => togglePick(s.id)}
                          className="h-4 w-4 accent-cyan-500"
                        />
                        <span className="font-semibold text-white">{s.fullName}</span>
                        <span className="text-xs text-slate-500" dir="ltr">
                          {s.phone}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400">أعضاء الفريق</label>
              <div className="min-h-[96px] space-y-2 rounded-lg border border-slate-800 p-3">
                {picked.length === 0 && <p className="text-xs text-slate-500">لم تختر أعضاء بعد.</p>}
                {picked.map((id) => {
                  const s = students.find((x) => x.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-sm">
                      <span className="font-semibold text-white">{s?.fullName ?? id}</span>
                      <button onClick={() => togglePick(id)} className="text-slate-400 hover:text-red-400" aria-label="إزالة">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {builder.mode === "edit" ? "حفظ التعديلات" : "إنشاء الفريق"}
            </button>
            <button onClick={() => setBuilder(null)} className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ---------------- list ---------------- */}
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
              onClick={() => patchTeams(drafts.map((d) => d.id), { published: true })}
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
          <button onClick={() => patchTeams(selectedIds, { published: true })} className="rounded-full border border-slate-600 px-3 py-1.5 font-bold text-slate-200 hover:border-emerald-400/60">
            نشر
          </button>
          <button onClick={() => patchTeams(selectedIds, { published: false })} className="rounded-full border border-slate-600 px-3 py-1.5 font-bold text-slate-200 hover:border-amber-400/60">
            إخفاء
          </button>
          <button onClick={() => removeTeams(selectedIds)} className="rounded-full border border-red-500/40 px-3 py-1.5 font-bold text-red-300 hover:bg-red-500/10">
            حذف
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[900px] text-right text-sm">
          <thead className="bg-slate-900/80 text-xs text-slate-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-cyan-500" aria-label="تحديد الكل" />
              </th>
              <th className="px-4 py-3">الفريق</th>
              <th className="px-4 py-3">الأعضاء</th>
              <th className="px-4 py-3">التحدي</th>
              <th className="px-4 py-3">الكود</th>
              <th className="px-4 py-3">ديسكورد</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((team) => {
              const ms = membersOfTeam(team.id);
              return (
                <tr key={team.id} className="align-top text-slate-300 hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(team.id)} onChange={() => toggleOne(team.id)} className="h-4 w-4 accent-cyan-500" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{team.name}</td>
                  <td className="px-4 py-3">
                    {ms.length === 0 ? (
                      <span className="text-xs text-amber-300">لا أعضاء بعد</span>
                    ) : (
                      <ul className="space-y-0.5 text-xs">
                        {ms.map((s) => (
                          <li key={s.id}>{s.fullName}</li>
                        ))}
                        <li className={ms.length > maxMembers || ms.length < minMembers ? "text-amber-300" : "text-slate-500"}>
                          {ms.length}/{maxMembers}
                          {ms.length > maxMembers && " (فوق الحد الأقصى)"}
                          {ms.length < minMembers && " (أقل من الحد الأدنى)"}
                        </li>
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3">{label(team.challenge)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <code dir="ltr" className="rounded bg-slate-950 px-2 py-1 font-mono text-xs text-cyan-200">
                        {team.code ? fmtCode(team.code) : "..."}
                      </code>
                      <button onClick={() => copyCode(team)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-400/60" aria-label="نسخ الكود" title="نسخ الكود">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => regenerate(team)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-amber-400/60" aria-label="كود جديد" title="كود جديد">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      {copiedId === team.id && <span className="text-xs text-emerald-300">تم النسخ</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {team.discordLink ? <span className="text-emerald-300">مضبوط ✓</span> : <span className="text-slate-500">غير مضبوط</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        team.published ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {team.published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => patchTeams([team.id], { published: !team.published })}
                        className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-400/60"
                        aria-label={team.published ? "إخفاء" : "نشر"}
                        title={team.published ? "إخفاء" : "نشر"}
                      >
                        {team.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => openEdit(team)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:border-cyan-400/60" aria-label="تعديل" title="تعديل الفريق والأعضاء">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeTeams([team.id])} className="rounded-lg border border-red-500/30 p-1.5 text-red-400 hover:bg-red-500/10" aria-label="حذف" title="حذف">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  لا توجد فرق بعد. اضغط «تكوين فريق».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
