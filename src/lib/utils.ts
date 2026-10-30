export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const ADMIN_STORAGE_KEY = "egas_admin_session";

export const BADGE_LABELS: Record<string, { label: string; color: string }> = {
  gold: { label: "المبتكر الذهبي", color: "#fbbf24" },
  silver: { label: "الفضي المتميز", color: "#cbd5e1" },
  bronze: { label: "البرونزي الواعد", color: "#d97706" },
  completion: { label: "شهادة إتمام رسمية", color: "#06b6d4" },
};

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
