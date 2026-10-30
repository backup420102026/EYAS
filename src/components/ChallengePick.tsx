"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Challenge } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";

/** "Choose your challenge" form. The admin opens/closes it from the season settings. */
export function ChallengePick({ challenges }: { challenges: Challenge[] }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ firstName: string; challengeTitle: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !phone.trim()) {
      setError("اكتب البريد الإلكتروني ورقم الهاتف اللذين سجّلت بهما.");
      return;
    }
    if (!challenge) {
      setError("اختر التحدي الذي تريده.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/choose-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, challenge }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "حدث خطأ، حاول مرة أخرى.");
        return;
      }
      setResult({ firstName: data.firstName, challengeTitle: data.challengeTitle });
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="choose" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        <Reveal className="lg:col-span-5">
          <SectionHeader
            className="mb-0"
            index="00"
            eyebrow="اختيار التحدي"
            title="اختر تحدّيك"
            description="اكتب البريد الإلكتروني ورقم الهاتف اللذين سجّلت بهما، ثم اختر التحدي الذي تريد العمل عليه. يمكنك تغيير اختيارك طالما الصفحة مفتوحة."
          />
        </Reveal>

        <Reveal className="lg:col-span-7" delay={80}>
          {result ? (
            <div className="rounded-2xl border border-ok/40 bg-ok/10 p-6 sm:p-8">
              <CheckCircle2 className="h-9 w-9 text-ok" />
              <h3 className="mt-4 font-display text-2xl font-extrabold text-ink">
                تم تسجيل اختيارك يا {result.firstName}
              </h3>
              <p className="mt-3 text-base leading-8 text-muted">
                اخترت: <span className="font-semibold text-ink">{result.challengeTitle}</span>. ستصلك
                تفاصيل فريقك قريبًا. يمكنك تغيير الاختيار بإعادة تعبئة النموذج.
              </p>
              <button onClick={() => setResult(null)} className="btn-outline mt-5">
                تغيير الاختيار
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pick-email" className="mb-2 block text-[15px] font-semibold text-ink">
                    البريد الإلكتروني المسجّل
                  </label>
                  <input
                    id="pick-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field"
                    placeholder="name@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="pick-phone" className="mb-2 block text-[15px] font-semibold text-ink">
                    رقم الهاتف المسجّل
                  </label>
                  <input
                    id="pick-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="field"
                    placeholder="01012345678"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-3 text-[15px] font-semibold text-ink">التحدي</legend>
                <div className="grid gap-3">
                  {challenges.map((c, i) => (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                        challenge === c.slug
                          ? "border-accent bg-accent/10"
                          : "border-line-strong bg-surface hover:bg-surface2"
                      }`}
                    >
                      <input
                        type="radio"
                        name="challenge"
                        value={c.slug}
                        checked={challenge === c.slug}
                        onChange={() => setChallenge(c.slug)}
                        className="h-5 w-5 shrink-0 accent-[var(--accent)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-extrabold text-ink">
                          {c.title}
                        </span>
                        <span className="mt-0.5 block text-[14px] text-muted">{c.category}</span>
                      </span>
                      <span className="font-mono text-[13px] text-muted">
                        CH-{String(i + 1).padStart(2, "0")}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {error && (
                <p role="alert" className="text-[15px] text-danger">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                تأكيد الاختيار
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
