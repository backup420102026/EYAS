import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";
import { clientIp, hit } from "@/lib/rateLimit";
import { parse, studentSchema } from "@/lib/validation";
import { getCurrentSeason } from "@/lib/season";
import { ensureDefaults } from "@/db/defaults";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const rows = await db.select().from(students).orderBy(desc(students.createdAt));
  return NextResponse.json({ students: rows });
}

export async function POST(request: NextRequest) {
  if (!hit(`students:${clientIp(request)}`, 60, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "rate_limited", message: "محاولات كثيرة خلال وقت قصير، حاول لاحقًا." },
      { status: 429 }
    );
  }

  try {
    await ensureDefaults();
    const season = await getCurrentSeason();
    if (!season || !season.applicationsOpen) {
      return NextResponse.json(
        { error: "registration_closed", message: "التسجيل مغلق حاليًا." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = parse(studentSchema, body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "validation", message: parsed.message },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // one registration per email in each season
    const existing = await db
      .select({ id: students.id })
      .from(students)
      .where(and(sql`lower(${students.email}) = ${data.email}`, eq(students.seasonId, season.id)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "duplicate", message: "هذا البريد الإلكتروني مسجّل بالفعل." },
        { status: 409 }
      );
    }

    await db.insert(students).values({
      fullName: data.fullName,
      grade: data.grade,
      email: data.email,
      phone: data.phone,
      guardianConsent: true,
      seasonId: season.id,
    });

    // only what the success screen needs (never echo the stored record back)
    return NextResponse.json({ ok: true, whatsappLink: season.whatsappLink }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "server_error", message: "حدث خطأ في الخادم، حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
