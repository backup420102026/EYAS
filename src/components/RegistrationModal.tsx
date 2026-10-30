"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { isEmail, isPhone } from "@/lib/contact";
import { useEscape } from "@/lib/useEscape";

const EMPTY = { fullName: "", grade: "", email: "", phone: "", guardianConsent: false };

export function RegistrationModal({
  onClose,
  seasonName,
}: {
  onClose: () => void;
  seasonName?: string;
}) {
  useEscape(onClose);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [error, setError] = useState("");

  const update = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.grade.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("فضلاً أكمل جميع الحقول.");
      return;
    }
    if (!isEmail(form.email.trim().toLowerCase())) {
      setError("البريد الإلكتروني غير صحيح.");
      return;
    }
    if (!isPhone(form.phone)) {
      setError("رقم الهاتف غير صحيح (مثال: 01012345678).");
      return;
    }
    if (!form.guardianConsent) {
      setError("يجب تأكيد موافقة ولي الأمر للتسجيل.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "حدث خطأ أثناء التسجيل، حاول مرة أخرى.");
        return;
      }
      setWhatsappLink(data?.whatsappLink ?? "");
      setDone(true);
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reg-title"
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">التسجيل</p>
            <h3 id="reg-title" className="mt-2 font-display text-2xl font-extrabold text-ink">
              التسجيل في {seasonName ?? "الموسم الأول"}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-ok" />
            <h4 className="mt-4 font-display text-xl font-extrabold text-ink">تم تسجيلك بنجاح</h4>
            <p className="mt-3 text-base leading-8 text-muted">
              شكرًا {form.fullName.trim().split(/\s+/)[0]}! بعد إغلاق باب التسجيل ستصلك التفاصيل، وستختار
              تحدّيك من صفحة الاختيار.
            </p>
            {whatsappLink ? (
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary mt-6 w-full">
                انضم إلى مجتمع المسابقة على واتساب
              </a>
            ) : (
              <p className="mt-6 text-[15px] text-muted">سيصلك رابط مجتمع المسابقة قريبًا.</p>
            )}
            <button onClick={onClose} className="btn-outline mt-3 w-full">
              إغلاق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="mb-2 block text-[15px] font-semibold text-ink">
                الاسم الكامل
              </label>
              <input
                id="reg-name"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="field"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="reg-grade" className="mb-2 block text-[15px] font-semibold text-ink">
                الصف الدراسي
              </label>
              <input
                id="reg-grade"
                value={form.grade}
                onChange={(e) => update("grade", e.target.value)}
                className="field"
                placeholder="مثال: الصف الثاني الثانوي"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-phone" className="mb-2 block text-[15px] font-semibold text-ink">
                  رقم الهاتف
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="field"
                  placeholder="01012345678"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="mb-2 block text-[15px] font-semibold text-ink">
                  البريد الإلكتروني
                </label>
                <input
                  id="reg-email"
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="field"
                  placeholder="name@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface2 p-4 text-[14px] leading-7 text-muted">
              <input
                type="checkbox"
                checked={form.guardianConsent}
                onChange={(e) => update("guardianConsent", e.target.checked)}
                className="mt-1.5 h-5 w-5 flex-shrink-0 accent-[var(--accent)]"
              />
              أؤكد أن ولي أمري على علم بمشاركتي في المسابقة وموافق عليها، وأوافق على استخدام بياناتي لأغراض
              تنظيم المسابقة والتواصل معي فقط.
            </label>

            {error && (
              <p role="alert" className="text-[15px] text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              تسجيل
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
