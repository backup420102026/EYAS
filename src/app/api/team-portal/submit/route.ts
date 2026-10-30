import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { milestones, submissions } from "@/db/schema";
import { clientIp, hit } from "@/lib/rateLimit";
import { buildPortalView, findTeamByCode } from "@/lib/teamPortal";
import { milestoneState } from "@/lib/milestoneState";

export const dynamic = "force-dynamic";

// A team submits (or re-submits before the deadline) the link for one milestone.
export async function POST(request: NextRequest) {
  if (!hit(`team-submit:${clientIp(request)}`, 60, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "rate_limited", message: "محاولات كثيرة خلال وقت قصير، حاول لاحقًا." },
      { status: 429 }
    );
  }
  try {
    const body = await request.json().catch(() => null);
    const team = await findTeamByCode(body?.code);
    if (!team) {
      return NextResponse.json({ error: "not_found", message: "الكود غير صحيح." }, { status: 404 });
    }

    const link = String(body?.link ?? "").trim();
    const note = String(body?.note ?? "").trim().slice(0, 1000);
    const studentName = String(body?.studentName ?? "").trim().replace(/\s+/g, " ");
    if (!/^https?:\/\/[^\s]{4,480}$/i.test(link)) {
      return NextResponse.json({ error: "validation", message: "الرابط يجب أن يبدأ بـ https://" }, { status: 400 });
    }
    if (studentName.length < 2 || studentName.length > 100) {
      return NextResponse.json({ error: "validation", message: "اكتب اسمك (حرفان على الأقل)." }, { status: 400 });
    }

    const [milestone] = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, String(body?.milestoneId ?? "")), eq(milestones.seasonId, team.seasonId)))
      .limit(1);
    if (!milestone) {
      return NextResponse.json({ error: "validation", message: "المرحلة غير موجودة." }, { status: 400 });
    }
    const state = milestoneState(milestone);
    if (state !== "open") {
      return NextResponse.json(
        {
          error: "closed",
          message:
            state === "upcoming"
              ? "هذه المرحلة لم تبدأ بعد."
              : milestone.closedMessage || "التسليم لهذه المرحلة مغلق.",
        },
        { status: 403 }
      );
    }

    const [existing] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.teamId, team.id), eq(submissions.milestoneId, milestone.id)))
      .limit(1);

    if (existing) {
      // a re-submission replaces the old one and clears the grade (it no longer applies)
      await db
        .update(submissions)
        .set({ link, note, studentName, score: null, feedback: null, createdAt: new Date() })
        .where(eq(submissions.id, existing.id));
    } else {
      await db.insert(submissions).values({
        teamId: team.id,
        teamName: team.name,
        studentName,
        challenge: team.challenge,
        milestone: milestone.number,
        milestoneId: milestone.id,
        link,
        note,
      });
    }

    return NextResponse.json(await buildPortalView(team));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error", message: "حدث خطأ في الخادم، حاول مرة أخرى." }, { status: 500 });
  }
}
