"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";

interface FoundTeam {
  name: string;
  challengeTitle: string;
  code: string;
  discordLink: string;
  members: string[];
}

/** "Find your team": the student enters the email and phone they registered with. */
export function FindTeam() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ firstName: string; team: FoundTeam | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !phone.trim()) {
      setError("اكتب البريد الإلكتروني ورقم الهاتف اللذين سجّلت بهما.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/find-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "حدث خطأ، حاول مرة أخرى.");
        return;
      }
      setResult(data);
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section id="my-team" className="border-y border-line bg-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
        <Reveal className="lg:col-span-5">
          <SectionHeader
            className="mb-0"
            index="00"
            eyebrow="اعرف فريقك"
            title="أين فريقك؟"
            description="اكتب البريد الإلكتروني ورقم الهاتف اللذين سجّلت بهما لتعرف فريقك وأعضاءه ورابط قناتك على ديسكورد وكود فريقك."
          />
        </Reveal>

        <Reveal className="lg:col-span-7" delay={80}>
          {result ? (
            <div className="space-y-4">
              {result.team ? (
                <div className="card p-6 sm:p-8">
                  <p className="text-[15px] text-muted">أهلًا {result.firstName}، فريقك هو:</p>
                  <h3 className="mt-2 font-display text-3xl font-extrabold text-ink">{result.team.name}</h3>
                  <p className="mt-1 text-base text-muted">{result.team.challengeTitle}</p>

                  {result.team.members.length > 0 && (
                    <p className="mt-5 text-base leading-8 text-ink">
                      <span className="font-semibold">الأعضاء: </span>
                      {result.team.members.join("، ")}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-surface2 px-4 py-2.5">
                      <span className="text-[14px] text-muted">كود الفريق</span>
                      <code dir="ltr" className="font-mono text-base font-semibold tracking-widest text-ink">
                        {result.team.code.length > 4
                          ? `${result.team.code.slice(0, 4)}-${result.team.code.slice(4)}`
                          : result.team.code}
                      </code>
                      <button
                        onClick={() => copy(result.team!.code)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
                        aria-label="نسخ الكود"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {copied && <span className="text-[14px] text-ok">تم النسخ</span>}
                    </div>
                    {result.team.discordLink && (
                      <a href={result.team.discordLink} target="_blank" rel="noreferrer" className="btn-primary">
                        افتح قناة فريقك على ديسكورد
                      </a>
                    )}
                  </div>
                  <p className="mt-5 text-[14px] leading-7 text-muted">
                    استخدم كود الفريق في «بوابة الفريق» لرؤية المراحل وتسليم مشروعكم. احتفظ به ولا تشاركه خارج
                    فريقك.
                  </p>
                </div>
              ) : (
                <div className="card p-6 sm:p-8">
                  <p className="text-base leading-8 text-ink">
                    أهلًا {result.firstName}. لم يُسنَد لك فريق بعد، وسنعلن في مجتمع واتساب عند نشر الفرق.
                  </p>
                </div>
              )}
              <button onClick={() => setResult(null)} className="btn-outline">
                بحث بحساب آخر
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="find-email" className="mb-2 block text-[15px] font-semibold text-ink">
                    البريد الإلكتروني المسجّل
                  </label>
                  <input
                    id="find-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field"
                    placeholder="name@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="find-phone" className="mb-2 block text-[15px] font-semibold text-ink">
                    رقم الهاتف المسجّل
                  </label>
                  <input
                    id="find-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="field"
                    placeholder="01012345678"
                  />
                </div>
              </div>
              {error && (
                <p role="alert" className="text-[15px] text-danger">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                اعرض فريقي
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
