import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { challenges, seasonSettings, students, submissions } from "@/db/schema";
import { isAdminRequest, requireAdmin } from "@/lib/adminAuth";
import { ensureDefaults } from "@/db/defaults";
import { getCurrentSeason } from "@/lib/season";
import { clearCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const TEAM_IMAGES = ["1", "2", "3"];

function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// Public: published challenges of the current season.
// Admin (with the passcode header): every challenge of every season, including hidden ones.
export async function GET(request: NextRequest) {
  await ensureDefaults();

  if (isAdminRequest(request)) {
    const rows = await db
      .select()
      .from(challenges)
      .orderBy(asc(challenges.sortOrder), asc(challenges.slug));
    return NextResponse.json({ challenges: rows });
  }

  const season = await getCurrentSeason();
  if (!season) return NextResponse.json({ challenges: [] });
  const rows = await db
    .select()
    .from(challenges)
    .where(and(eq(challenges.seasonId, season.id), eq(challenges.published, true)))
    .orderBy(asc(challenges.sortOrder), asc(challenges.slug));
  return NextResponse.json({ challenges: rows });
}

// Admin: create a challenge.
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const title = str(body?.title, 120);
    const category = str(body?.category, 80);
    const description = str(body?.description, 2000);
    const deliverables = str(body?.deliverables, 2000);
    const seasonId = str(body?.seasonId, 21);

    if (!title || !category || !description || !deliverables) {
      return NextResponse.json(
        { error: "validation", message: "اكتب العنوان والتصنيف والوصف والمخرجات." },
        { status: 400 }
      );
    }
    const [season] = await db.select({ id: seasonSettings.id }).from(seasonSettings).where(eq(seasonSettings.id, seasonId)).limit(1);
    if (!season) {
      return NextResponse.json({ error: "validation", message: "اختر موسمًا صحيحًا." }, { status: 400 });
    }

    const [created] = await db
      .insert(challenges)
      .values({
        slug: `c-${nanoid(8).toLowerCase().replace(/[^a-z0-9]/g, "x")}`,
        title,
        category,
        description,
        deliverables,
        coverImage: str(body?.coverImage, 500),
        pdfUrl: str(body?.pdfUrl, 500),
        seasonId,
        published: body?.published === false ? false : true,
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Math.round(Number(body.sortOrder)) : 0,
        teamImage: TEAM_IMAGES.includes(String(body?.teamImage)) ? String(body.teamImage) : "1",
      })
      .returning();

    clearCache();
    return NextResponse.json({ challenge: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: edit a challenge.
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { id, title, category, description, deliverables, coverImage, pdfUrl } = body ?? {};
    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const [updated] = await db
      .update(challenges)
      .set({
        ...(title ? { title: String(title).trim().slice(0, 120) } : {}),
        ...(category ? { category: String(category).trim().slice(0, 80) } : {}),
        ...(description ? { description: String(description).trim().slice(0, 2000) } : {}),
        ...(deliverables ? { deliverables: String(deliverables).trim().slice(0, 2000) } : {}),
        // empty string is allowed here: it clears the PDF / falls back to the default cover
        ...(typeof coverImage === "string" ? { coverImage: coverImage.trim() } : {}),
        ...(typeof pdfUrl === "string" ? { pdfUrl: pdfUrl.trim() } : {}),
        ...(typeof body.published === "boolean" ? { published: body.published } : {}),
        ...(Number.isFinite(Number(body.sortOrder)) && body.sortOrder !== "" && body.sortOrder !== null
          ? { sortOrder: Math.round(Number(body.sortOrder)) }
          : {}),
        ...(TEAM_IMAGES.includes(String(body.teamImage)) ? { teamImage: String(body.teamImage) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(challenges.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    clearCache();
    return NextResponse.json({ challenge: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: delete a challenge (its resources go with it). Blocked if students or submissions use it.
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [usedByStudent] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.challenge, challenge.slug))
    .limit(1);
  const [usedBySubmission] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.challenge, challenge.slug))
    .limit(1);
  if (usedByStudent || usedBySubmission) {
    return NextResponse.json(
      {
        error: "in_use",
        message: "يوجد طلاب أو تسليمات مرتبطة بهذا التحدي، فلا يمكن حذفه. أخفِه بدلًا من ذلك (إلغاء النشر).",
      },
      { status: 409 }
    );
  }

  await db.delete(challenges).where(eq(challenges.id, id));
  clearCache();
  return NextResponse.json({ ok: true });
}
