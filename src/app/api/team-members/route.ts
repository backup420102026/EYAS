import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray, notInArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { students, teamMembers, teams } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";
import { clearCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const MAX_MEMBERS = 3;

// Admin: every membership row.
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const rows = await db.select().from(teamMembers).orderBy(asc(teamMembers.createdAt));
  return NextResponse.json({ items: rows });
}

// Admin: set the exact member list of a team. body: { teamId, studentIds: string[] } (1 to 3 students)
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const teamId = String(body?.teamId ?? "");
    const studentIds: string[] = Array.isArray(body?.studentIds)
      ? Array.from(new Set<string>(body.studentIds.map(String)))
      : [];

    if (studentIds.length < 1 || studentIds.length > MAX_MEMBERS) {
      return NextResponse.json(
        { error: "validation", message: `عدد أعضاء الفريق من 1 إلى ${MAX_MEMBERS}.` },
        { status: 400 }
      );
    }

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!team) return NextResponse.json({ error: "validation", message: "الفريق غير موجود." }, { status: 400 });

    const found = await db.select().from(students).where(inArray(students.id, studentIds));
    if (found.length !== studentIds.length) {
      return NextResponse.json({ error: "validation", message: "أحد الطلاب غير موجود." }, { status: 400 });
    }
    for (const s of found) {
      if (s.seasonId && s.seasonId !== team.seasonId) {
        return NextResponse.json(
          { error: "validation", message: `${s.fullName} مسجّل في موسم آخر.` },
          { status: 400 }
        );
      }
      if (s.challenge !== team.challenge) {
        return NextResponse.json(
          { error: "validation", message: `${s.fullName} لم يختر تحدي هذا الفريق.` },
          { status: 400 }
        );
      }
    }

    // a student can only be in one team
    const elsewhere = await db
      .select({ studentId: teamMembers.studentId })
      .from(teamMembers)
      .where(and(inArray(teamMembers.studentId, studentIds), ne(teamMembers.teamId, teamId)));
    if (elsewhere.length > 0) {
      const name = found.find((s) => s.id === elsewhere[0].studentId)?.fullName ?? "أحد الطلاب";
      return NextResponse.json(
        { error: "conflict", message: `${name} موجود بالفعل في فريق آخر.` },
        { status: 409 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), notInArray(teamMembers.studentId, studentIds)));
      const current = await tx
        .select({ studentId: teamMembers.studentId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));
      const have = new Set(current.map((c) => c.studentId));
      const toAdd = studentIds.filter((id) => !have.has(id));
      if (toAdd.length > 0) {
        await tx.insert(teamMembers).values(toAdd.map((studentId) => ({ teamId, studentId })));
      }
    });

    clearCache();
    const rows = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId)).orderBy(asc(teamMembers.createdAt));
    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error(error);
    const code = (error as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "conflict", message: "أحد الطلاب أُضيف لفريق آخر للتو. أعد المحاولة." }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
