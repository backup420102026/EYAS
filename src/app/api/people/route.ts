import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { people, seasonSettings } from "@/db/schema";
import { isAdminRequest, requireAdmin } from "@/lib/adminAuth";
import { ensureDefaults } from "@/db/defaults";
import { getCurrentSeason } from "@/lib/season";
import { challengeSlugExists } from "@/lib/challengeCheck";
import { clearCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 300;
const cleanName = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, 80) : "");
const cleanGender = (v: unknown) => (v === "girl" ? "girl" : "boy");

// Public: published people of the current season. Admin (passcode header): everyone, every season.
export async function GET(request: NextRequest) {
  await ensureDefaults();
  if (isAdminRequest(request)) {
    const rows = await db.select().from(people).orderBy(asc(people.createdAt));
    return NextResponse.json({ items: rows });
  }
  const season = await getCurrentSeason();
  if (!season) return NextResponse.json({ items: [] });
  const rows = await db
    .select()
    .from(people)
    .where(and(eq(people.seasonId, season.id), eq(people.published, true)))
    .orderBy(asc(people.createdAt))
    .limit(600);
  return NextResponse.json({ items: rows });
}

// Admin: add one or many people. body: { seasonId, challenge, published, items: [{ name, gender }] }
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const seasonId = String(body?.seasonId ?? "");
    const challenge = String(body?.challenge ?? "");
    const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : [];

    const items = rawItems
      .map((it) => ({
        name: cleanName((it as { name?: unknown })?.name),
        gender: cleanGender((it as { gender?: unknown })?.gender),
        challenge: String((it as { challenge?: unknown })?.challenge || challenge),
      }))
      .filter((it) => it.name.length >= 2);

    if (items.length === 0) {
      return NextResponse.json({ error: "validation", message: "اكتب اسمًا واحدًا على الأقل." }, { status: 400 });
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: "validation", message: `الحد الأقصى ${MAX_ITEMS} اسم في المرة الواحدة.` },
        { status: 400 }
      );
    }
    const [season] = await db.select({ id: seasonSettings.id }).from(seasonSettings).where(eq(seasonSettings.id, seasonId)).limit(1);
    if (!season) {
      return NextResponse.json({ error: "validation", message: "اختر موسمًا صحيحًا." }, { status: 400 });
    }
    for (const slug of new Set(items.map((it) => it.challenge))) {
      if (!(await challengeSlugExists(slug, false))) {
        return NextResponse.json({ error: "validation", message: "اختر تحديًا صحيحًا." }, { status: 400 });
      }
    }

    const created = await db
      .insert(people)
      .values(items.map((it) => ({ seasonId, challenge: it.challenge, name: it.name, gender: it.gender, published: body?.published === true })))
      .returning();
    clearCache();
    return NextResponse.json({ items: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: change one or many people. body: { ids: string[], published?, name?, challenge?, gender? }
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String).slice(0, 1000) : [];
    if (ids.length === 0) return NextResponse.json({ error: "missing_ids" }, { status: 400 });

    const set: Partial<typeof people.$inferInsert> = {};
    if (typeof body.published === "boolean") set.published = body.published;
    if (body.gender !== undefined) set.gender = cleanGender(body.gender);
    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (name.length < 2) return NextResponse.json({ error: "validation", message: "الاسم قصير جدًا." }, { status: 400 });
      set.name = name;
    }
    if (body.challenge !== undefined) {
      if (!(await challengeSlugExists(String(body.challenge), false))) {
        return NextResponse.json({ error: "validation", message: "اختر تحديًا صحيحًا." }, { status: 400 });
      }
      set.challenge = String(body.challenge);
    }
    if (Object.keys(set).length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

    const updated = await db.update(people).set(set).where(inArray(people.id, ids)).returning();
    clearCache();
    return NextResponse.json({ items: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: delete one or many people. body: { ids: string[] }
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String).slice(0, 1000) : [];
  if (ids.length === 0) return NextResponse.json({ error: "missing_ids" }, { status: 400 });
  await db.delete(people).where(inArray(people.id, ids));
  clearCache();
  return NextResponse.json({ ok: true });
}
