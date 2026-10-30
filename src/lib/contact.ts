const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^(\+?20|0)?1[0125]\d{8}$/;

export const isEmail = (v: string) => EMAIL_RE.test(v);
export const isPhone = (v: string) => PHONE_RE.test(normalizeDigits(v).replace(/[\s\-()]/g, ""));

export function contactHref(contact: string) {
  const c = contact.trim();
  if (isEmail(c)) return `mailto:${c}`;
  return `tel:${normalizeDigits(c).replace(/[\s\-()]/g, "")}`;
}

/** Last 10 digits of a phone number, so 01012345678 and +201012345678 compare equal. */
export function phoneKey(value: string) {
  return normalizeDigits(value).replace(/\D/g, "").slice(-10);
}
