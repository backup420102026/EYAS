"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Atom, Lock, Loader2, ShieldAlert } from "lucide-react";
import { ADMIN_STORAGE_KEY } from "@/lib/utils";

async function verify(passcode: string): Promise<"ok" | "wrong" | "locked" | "not_configured" | "error"> {
  try {
    const res = await fetch("/api/admin/verify", {
      headers: { "x-admin-passcode": passcode },
      cache: "no-store",
    });
    if (res.ok) return "ok";
    if (res.status === 401) return "wrong";
    if (res.status === 429) return "locked";
    if (res.status === 503) return "not_configured";
    return "error";
  } catch {
    return "error";
  }
}

export function AdminGate({ onAuthenticated }: { onAuthenticated: (passcode: string) => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Re-use a saved session only if the server still accepts it.
  useEffect(() => {
    const stored = window.sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!stored) {
      const t = setTimeout(() => setChecking(false), 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    verify(stored).then((result) => {
      if (cancelled) return;
      if (result === "ok") {
        onAuthenticated(stored);
      } else {
        window.sessionStorage.removeItem(ADMIN_STORAGE_KEY);
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passcode) return;
    setSubmitting(true);
    const result = await verify(passcode);
    setSubmitting(false);

    if (result === "ok") {
      window.sessionStorage.setItem(ADMIN_STORAGE_KEY, passcode);
      onAuthenticated(passcode);
    } else if (result === "wrong") {
      setError("كلمة المرور غير صحيحة. حاول مرة أخرى.");
    } else if (result === "locked") {
      setError("محاولات خاطئة كثيرة. انتظر 10 دقائق ثم حاول مرة أخرى.");
    } else if (result === "not_configured") {
      setError("لم يتم ضبط ADMIN_PASSCODE على الخادم بعد، فلوحة التحكم مقفلة.");
    } else {
      setError("تعذّر الاتصال بالخادم. حاول مرة أخرى.");
    }
  };

  if (checking) {
    return (
      <div dir="ltr" lang="en" className="flex min-h-screen items-center justify-center bg-[#0f172a]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" className="relative flex min-h-screen items-center justify-center bg-[#0f172a] px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-40 -left-20 h-80 w-80 rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass relative z-10 w-full max-w-sm rounded-3xl p-8 text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <Atom className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-xl font-extrabold text-white">لوحة تحكم EYAS</h1>
        <p className="mt-2 text-sm text-slate-400">
          أدخل كلمة مرور المشرفين للوصول إلى لوحة التحكم.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-400/50">
          <Lock className="h-4 w-4 text-slate-500" />
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="كلمة المرور"
            autoComplete="current-password"
            className="w-full bg-transparent text-sm text-white outline-none"
            dir="ltr"
          />
        </div>

        {error && (
          <div className="mt-3 flex items-start justify-center gap-1.5 text-sm text-red-400">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="glow-btn mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          دخول
        </button>

        <p className="mt-5 text-[11px] text-slate-600">
          مخصص للمرشدين وأعضاء لجنة التحكيم فقط — EYAS
        </p>
      </motion.form>
    </div>
  );
}
