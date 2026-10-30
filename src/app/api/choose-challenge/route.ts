import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { challenges, students, teamMembers } from "@/db/schema";
import { clientIp, hit } from "@/lib/rateLimit";
import { getCurrentSeason } from "@/lib/season";
import { ensureDefaults } from "@/db/defaults";
import { phoneKey } from "@/lib/contact";
import { clearCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(160),
  phone: z.string().trim().min(6).max(30),
  challenge: z.string().trim().min(1).max(60),
});

// A student picks (or changes) their challenge while the admin keeps the form open.
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!hit(`choose:${ip}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "rate_limited", message: "محاولات كثيرة خلال وقت قصير، حاول لاحقًا." },
      { status: 429 }
    );
  }

  try {
    const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "validation", message: "اكتب البريد الإلكتروني ورقم الهاتف واختر التحدي." },
        { status: 400 }
      );
    }
    const { email, phone, challenge } = parsedBody.data;

    // limit guessing for one email, even when the guesses come from different addresses
    if (!hit(`choose-email:${email}`, 8, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "rate_limited", message: "محاولات كثيرة لهذا البريد، حاول بعد قليل." },
        { status: 429 }
      );
    }

    await ensureDefaults();
    const season = await getCurrentSeason();
    if (!season || !season.challengePickOpen) {
      return NextResponse.json(
        { error: "closed", message: "باب اختيار التحدي مغلق حاليًا." },
        { status: 403 }
      );
    }

    const [student] = await db
      .select()
      .from(students)
      .where(and(sql`lower(${students.email}) = ${email}`, eq(students.seasonId, season.id)))
      .limit(1);
    // same message for "no such email" and "wrong phone" so nobody can probe which emails exist
    if (!student || phoneKey(student.phone) !== phoneKey(phone)) {
      return NextResponse.json(
        { error: "not_found", message: "لم نجد تسجيلًا بهذه البيانات. تأكد من البريد ورقم الهاتف كما سجّلتهما." },
        { status: 404 }
      );
    }

    const [inTeam] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.studentId, student.id))
      .limit(1);
    if (inTeam) {
      return NextResponse.json(
        { error: "in_team", message: "أنت ضمن فريق بالفعل. تواصل مع المنظّمين إذا أردت تغيير التحدي." },
        { status: 409 }
      );
    }

    const [picked] = await db
      .select({ id: challenges.id, title: challenges.title })
      .from(challenges)
      .where(
        and(
          eq(challenges.slug, challenge),
          eq(challenges.seasonId, season.id),
          eq(challenges.published, true)
        )
      )
      .limit(1);
    if (!picked) {
      return NextResponse.json({ error: "validation", message: "التحدي المختار غير متاح." }, { status: 400 });
    }

    await db.update(students).set({ challenge }).where(eq(students.id, student.id));
    clearCache();
    return NextResponse.json({
      ok: true,
      firstName: student.fullName.trim().split(/\s+/)[0],
      challengeTitle: picked.title,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "server_error", message: "حدث خطأ في الخادم، حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
