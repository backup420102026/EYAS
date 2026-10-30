/**
 * How a participant's name is shown on the PUBLIC site (the admin always sees the full name).
 *  - "full":          محمد أحمد علي
 *  - "first":         محمد
 *  - "first-initial": محمد أ.
 * Change NAME_DISPLAY to switch it everywhere.
 */
export type NameDisplay = "full" | "first" | "first-initial";
export const NAME_DISPLAY: NameDisplay = "first-initial";

export function displayName(fullName: string, mode: NameDisplay = NAME_DISPLAY) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (mode === "full" || parts.length < 2) return parts.join(" ");
  if (mode === "first") return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}
