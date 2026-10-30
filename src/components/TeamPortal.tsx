"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Lock } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";
import { IconKey } from "./icons";

interface PortalSubmission {
  link: string;
  note: string;
  studentName: string;
  updatedAt: string;
  score: number | null;
  feedback: string | null;
  graded: boolean;
}

interface PortalMilestone {
  id: string;
  number: number;
  title: string;
  state: "upcoming" | "open" | "closed";
  opensAt: string | null;
  dueAt: string | null;
  description: string;
  closedMessage: string;
  submission: PortalSubmission | null;
}

interface PortalView {
  team: { name: string; challengeTitle: string; discordLink: string };
  milestones: PortalMilestone[];
}

const STORAGE_KEY = "eyas_team_code";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });

const STATE_LABEL: Record<PortalMilestone["state"], string> = {
  upcoming: "لم تبدأ بعد",
  open: "مفتوحة للتسليم",
  closed: "مغلقة",
};

const STATE_CLASS: Record<PortalMilestone["state"], string> = {
  upcoming: "border-line-strong bg-surface2 text-muted",
  open: "border-ok/50 bg-ok/10 text-ok",
  closed: "border-line-strong bg-surface2 text-muted",
};

function MilestoneCard({
  milestone,
  code,
  onUpdated,
}: {
  milestone: PortalMilestone;
  code: string;
  onUpdated: (view: PortalView) => void;
}) {
  const sub = milestone.submission;
  const [link, setLink] = useState(sub?.link ?? "");
  const [note, setNote] = useState(sub?.note ?? "");
  const [studentName, setStudentName] = useState(sub?.studentName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!link.trim() || !studentName.trim()) {
      setError("اكتب اسمك ورابط التسليم.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/team-portal/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, milestoneId: milestone.id, link, note, studentName }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "حدث خطأ، حاول مرة أخرى.");
        return;
      }
      onUpdated(data);
      setSaved(true);
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  const fieldId = (name: string) => `m${milestone.number}-${name}`;

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface2 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xl font-semibold text-accent-text">
            {String(milestone.number).padStart(2, "0")}
          </span>
          <h3 className="font-display text-xl font-extrabold text-ink">{milestone.title}</h3>
        </div>
        <span
          className={`rounded-full border px-3.5 py-1 text-[14px] font-semibold ${STATE_CLASS[milestone.state]}`}
        >
          {STATE_LABEL[milestone.state]}
        </span>
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-8">
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-muted">
          {milestone.opensAt && (
            <div className="flex gap-2">
              <dt className="font-semibold">تبدأ:</dt>
              <dd>{fmt(milestone.opensAt)}</dd>
            </div>
          )}
          {milestone.dueAt && (
            <div className="flex gap-2">
              <dt className="font-semibold">آخر موعد للتسليم:</dt>
              <dd>{fmt(milestone.dueAt)}</dd>
            </div>
          )}
        </dl>

        {milestone.state === "upcoming" ? (
          <p className="flex items-center gap-2 text-[15px] text-muted">
            <Lock className="h-4 w-4" />
            ستظهر تفاصيل هذه المرحلة عند بدايتها.
          </p>
        ) : (
          milestone.description && (
            <p className="whitespace-pre-line text-base leading-8 text-ink">{milestone.description}</p>
          )
        )}

        {sub && (
          <div className="rounded-xl border border-line bg-surface2 p-4 text-[15px]">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
              <CheckCircle2 className="h-5 w-5 text-ok" />
              تم التسليم بواسطة {sub.studentName}
              <span className="font-normal text-muted">({fmt(sub.updatedAt)})</span>
            </p>
            <a
              href={sub.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 font-medium text-accent-text hover:underline"
            >
              عرض الملف المسلَّم <ExternalLink className="h-4 w-4" />
            </a>
            {sub.note && <p className="mt-2 whitespace-pre-line text-muted">{sub.note}</p>}
          </div>
        )}

        {milestone.state === "closed" && sub && milestone.closedMessage && (
          <p className="text-[15px] text-muted">{milestone.closedMessage}</p>
        )}

        {sub?.graded && (
          <div className="rounded-xl border border-accent/50 bg-accent/10 p-4 text-[15px]">
            <p className="font-semibold text-ink">
              التقييم: <span className="font-mono text-xl">{sub.score}</span> / 10
            </p>
            {sub.feedback && <p className="mt-2 whitespace-pre-line text-muted">{sub.feedback}</p>}
          </div>
        )}

        {milestone.state === "open" && (
          <form onSubmit={submit} className="space-y-4 border-t border-line pt-6" noValidate>
            <p className="text-base font-semibold text-ink">{sub ? "تحديث التسليم" : "تسليم هذه المرحلة"}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={fieldId("name")} className="mb-2 block text-[14px] font-semibold text-ink">
                  اسمك
                </label>
                <input
                  id={fieldId("name")}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor={fieldId("link")} className="mb-2 block text-[14px] font-semibold text-ink">
                  رابط التسليم (Drive / فيديو / مستند)
                </label>
                <input
                  id={fieldId("link")}
                  dir="ltr"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="field"
                  placeholder="https://"
                />
              </div>
            </div>
            <div>
              <label htmlFor={fieldId("note")} className="mb-2 block text-[14px] font-semibold text-ink">
                ملاحظة (اختياري)
              </label>
              <textarea
                id={fieldId("note")}
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="field resize-none"
              />
            </div>
            <p className="text-[14px] leading-7 text-muted">
              تأكد أن الرابط متاح لأي شخص لديه الرابط، حتى يتمكن المرشدون من فتحه. يمكنك تحديث التسليم قبل
              الموعد النهائي. وعند التحديث يُحذف التقييم السابق.
            </p>
            {error && (
              <p role="alert" className="text-[15px] text-danger">
                {error}
              </p>
            )}
            {saved && !error && <p className="text-[15px] font-medium text-ok">تم حفظ التسليم.</p>}
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {sub ? "تحديث التسليم" : "تسليم"}
            </button>
          </form>
        )}

        {milestone.state === "closed" && !sub && (
          <p className="text-[15px] text-muted">
            {milestone.closedMessage || "أُغلق باب التسليم لهذه المرحلة ولم يُسجَّل تسليم لفريقك."}
          </p>
        )}
      </div>
    </article>
  );
}

/** Team portal: a team opens it with its secret code to see its stages and submit. */
export function TeamPortal() {
  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState("");
  const [view, setView] = useState<PortalView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = async (value: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/team-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "حدث خطأ، حاول مرة أخرى.");
        return false;
      }
      setView(data);
      setCode(value);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, value);
      } catch {
        // storage can be blocked
      }
      return true;
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // keep the team signed in while the tab stays open
  useEffect(() => {
    let saved = "";
    try {
      saved = window.sessionStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return;
    }
    if (!saved) return;
    fetch("/api/team-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: saved }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setView(data);
          setCode(saved);
        }
      })
      .catch(() => {});
  }, []);

  const logout = () => {
    setView(null);
    setCode("");
    setCodeInput("");
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <section id="submit" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!view ? (
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-5">
              <SectionHeader
                className="mb-0"
                index="05"
                eyebrow="بوابة الفريق"
                title="مراحل المسابقة وتسليم مشروعك"
                description="أدخل كود فريقك لعرض المراحل ومواعيدها وتسليم مشروعك. الكود وصلك من منظّمي المسابقة."
              />
            </Reveal>

            <Reveal className="lg:col-span-7" delay={80}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (codeInput.trim()) open(codeInput);
                }}
                className="card max-w-xl space-y-5 p-6 sm:p-8"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent-text">
                  <IconKey className="h-6 w-6" />
                </span>
                <div>
                  <label htmlFor="team-code" className="mb-2 block text-[15px] font-semibold text-ink">
                    كود الفريق
                  </label>
                  <input
                    id="team-code"
                    dir="ltr"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="field text-center font-mono text-lg tracking-[0.25em]"
                    placeholder="XXXX-XXXX"
                    autoComplete="off"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-[15px] text-danger">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || !codeInput.trim()}
                  className="btn-primary w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  دخول
                </button>
              </form>
            </Reveal>
          </div>
        ) : (
          <>
            <SectionHeader
              index="05"
              eyebrow="بوابة الفريق"
              title="مراحل المسابقة وتسليم مشروعك"
              description="أدخل كود فريقك لعرض المراحل ومواعيدها وتسليم مشروعك. الكود وصلك من منظّمي المسابقة."
            />
            <div className="space-y-6">
              <div className="card flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
                <div>
                  <p className="text-[15px] text-muted">فريقك</p>
                  <h3 className="mt-1 font-display text-3xl font-extrabold text-ink">{view.team.name}</h3>
                  {view.team.challengeTitle && (
                    <p className="mt-1 text-base text-muted">{view.team.challengeTitle}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {view.team.discordLink && (
                    <a href={view.team.discordLink} target="_blank" rel="noreferrer" className="btn-primary">
                      افتح قناة فريقك على ديسكورد
                    </a>
                  )}
                  <button onClick={logout} className="btn-outline">
                    خروج
                  </button>
                </div>
              </div>

              {view.milestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line-strong py-16 text-center">
                  <p className="text-muted">لم تُنشر مراحل المسابقة بعد.</p>
                </div>
              ) : (
                view.milestones.map((m) => (
                  <MilestoneCard key={m.id} milestone={m} code={code} onUpdated={setView} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
