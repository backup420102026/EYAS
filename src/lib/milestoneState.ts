export type MilestoneState = "upcoming" | "open" | "closed";

/**
 * upcoming: not visible yet (opensAt is in the future)
 * closed:   the admin locked it, or the deadline passed
 * open:     teams can submit
 */
export function milestoneState(
  m: { opensAt: Date | null; dueAt: Date | null; isOpen: boolean },
  now = new Date()
): MilestoneState {
  if (m.opensAt && now < m.opensAt) return "upcoming";
  if (!m.isOpen) return "closed";
  if (m.dueAt && now > m.dueAt) return "closed";
  return "open";
}
