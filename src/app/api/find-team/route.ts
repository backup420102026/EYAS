import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { challenges, teamMembers, teams } from "@/db/schema";
import { clientIp, hit } from "@/lib/rateLimit";
import { getCurrentSeason } from "@/lib/season";
import { ensureDefaults } from "@/db/defaults";
import { findStudentByContact } from "@/lib/studentLookup";
import { publicMemberNames } from "@/lib/teamMembers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(160),
  phone: z.string().trim().min(6).max(30),
});

// "Find your team": a student enters the email and phone they registered with.
export async function POST(request: NextRequest) {
  if (!hit(`find-team:${clientIp(request)}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "rate_limited", message: "محاولات كثيرة خلال وقت قصير، حاول لاحقًا." },
      { status: 429 }
    );
  }
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation", message: "اكتب البريد الإلكتروني ورقم الهاتف اللذين سجّلت بهما." },
        { status: 400 }
      );
    }
    const { email, phone } = parsed.data;

    if (!hit(`find-team-email:${email}`, 8, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "rate_limited", message: "محاولات كثيرة لهذا البريد، حاول بعد قليل." },
        { status: 429 }
      );
    }

    await ensureDefaults();
    const season = await getCurrentSeason();
    if (!season || !season.teamLookupOpen) {
      return NextResponse.json({ error: "closed", message: "هذه الصفحة غير متاحة حاليًا." }, { status: 403 });
    }

    const student = await findStudentByContact(email, phone, season.id);
    if (!student) {
      return NextResponse.json(
        { error: "not_found", message: "لم نجد تسجيلًا بهذه البيانات. تأكد من البريد ورقم الهاتف كما سجّلتهما." },
        { status: 404 }
      );
    }

    const firstName = student.fullName.trim().split(/\s+/)[0];
    const [membership] = await db.select().from(teamMembers).where(eq(teamMembers.studentId, student.id)).limit(1);
    if (!membership) return NextResponse.json({ firstName, team: null });

    const [team] = await db.select().from(teams).where(eq(teams.id, membership.teamId)).limit(1);
    if (!team) return NextResponse.json({ firstName, team: null });

    const [challenge] = await db
      .select({ title: challenges.title })
      .from(challenges)
      .where(eq(challenges.slug, team.challenge))
      .limit(1);
    const members = (await publicMemberNames([team.id])).get(team.id) ?? [];

    return NextResponse.json({
      firstName,
      team: {
        name: team.name,
        challengeTitle: challenge?.title ?? "",
        code: team.code,
        discordLink: team.discordLink,
        members,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error", message: "حدث خطأ في الخادم، حاول مرة أخرى." }, { status: 500 });
  }
}
