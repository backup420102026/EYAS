import { asc, inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { students, teamMembers } from "@/db/schema";
import { displayName } from "@/lib/displayName";

/** teamId -> member names, already shortened for the public site. Never returns contact details. */
export async function publicMemberNames(teamIds: string[]) {
  const map = new Map<string, string[]>();
  if (teamIds.length === 0) return map;
  const rows = await db
    .select({ teamId: teamMembers.teamId, fullName: students.fullName })
    .from(teamMembers)
    .innerJoin(students, eq(students.id, teamMembers.studentId))
    .where(inArray(teamMembers.teamId, teamIds))
    .orderBy(asc(teamMembers.createdAt));
  for (const r of rows) {
    const list = map.get(r.teamId) ?? [];
    list.push(displayName(r.fullName));
    map.set(r.teamId, list);
  }
  return map;
}
