import { z } from "zod";
import { PHONE_RE, isEmail, normalizeDigits } from "./contact";

const str = (min: number, max: number, msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z.string().min(min, msg).max(max, msg)
  );

const email = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : ""),
  z.string().max(160, "البريد الإلكتروني طويل جدًا").refine(isEmail, "البريد الإلكتروني غير صحيح")
);

const phone = z.preprocess(
  (v) => (typeof v === "string" ? normalizeDigits(v).replace(/[\s\-()]/g, "") : ""),
  z.string().refine((v) => PHONE_RE.test(v), "رقم الهاتف غير صحيح (مثال: 01012345678)")
);

export const studentSchema = z.object({
  fullName: str(3, 100, "اكتب الاسم بالكامل (3 أحرف على الأقل)"),
  grade: str(2, 60, "اكتب الصف الدراسي"),
  email,
  phone,
  guardianConsent: z.preprocess(
    (v) => v === true,
    z.boolean().refine((v) => v === true, "يجب تأكيد موافقة ولي الأمر للتسجيل")
  ),
});

export function parse<S extends z.ZodType>(
  schema: S,
  body: unknown
): { ok: true; data: z.output<S> } | { ok: false; message: string } {
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, message: result.error.issues[0]?.message ?? "بيانات غير صحيحة" };
}

/** Normalises a free-text team/person name for comparison. */
export const norm = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

