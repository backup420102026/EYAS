import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { teams, seasonSettings } from "@/db/schema";
import { isAdminRequest, requireAdmin } from "@/lib/adminAuth";
import { ensureDefaults } from "@/db/defaults";
import { getCurrentSeason } from "@/lib/season";
import { challengeSlugExists } from "@/lib/challengeCheck";
import { clearCache } from "@/lib/cache";
import { fillMissingCodes, normalizeTeamCode, uniqueTeamCode } from "@/lib/teamCode";
import { publicMemberNames } from "@/lib/teamMembers";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 300;
const cleanName = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, 80) : "");

// Public: published teams of the current season (name + challenge only — NEVER the code or Discord link).
// Admin (passcode header): everything, every season.
export async function GET(request: NextRequest) {
  await ensureDefaults();
  if (isAdminRequest(request)) {
    await fillMissingCodes();
    const rows = await db.select().from(teams).orderBy(asc(teams.createdAt));
    return NextResponse.json({ items: rows });
  }
  const season = await getCurrentSeason();
  if (!season) return NextResponse.json({ items: [] });
  const rows = await db
    .select({
      id: teams.id,
      seasonId: teams.seasonId,
      name: teams.name,
      challenge: teams.challenge,
      published: teams.published,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(and(eq(teams.seasonId, season.id), eq(teams.published, true)))
    .orderBy(asc(teams.createdAt))
    .limit(600);
  const members = await publicMemberNames(rows.map((r) => r.id));
  return NextResponse.json({ items: rows.map((r) => ({ ...r, members: members.get(r.id) ?? [] })) });
}

// Admin: add one or many teams. body: { seasonId, challenge, published, items: [{ name }] }
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const seasonId = String(body?.seasonId ?? "");
    const challenge = String(body?.challenge ?? "");
    const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : [];

    const items = rawItems
      .map((it) => ({ name: cleanName((it as { name?: unknown })?.name) }))
      .filter((it) => it.name.length >= 2);

    if (items.length === 0) {
      return NextResponse.json({ error: "validation", message: "اكتب اسم فريق واحد على الأقل." }, { status: 400 });
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
    if (!(await challengeSlugExists(challenge, false))) {
      return NextResponse.json({ error: "validation", message: "اختر تحديًا صحيحًا." }, { status: 400 });
    }

    // one team can come with its own code / Discord link (the team builder); bulk adds always get generated codes
    let customCode = "";
    let discordLink = "";
    if (items.length === 1) {
      if (body?.code) {
        customCode = normalizeTeamCode(String(body.code));
        if (customCode.length < 6 || customCode.length > 12) {
          return NextResponse.json({ error: "validation", message: "الكود من 6 إلى 12 حرفًا أو رقمًا." }, { status: 400 });
        }
        const [clash] = await db.select({ id: teams.id }).from(teams).where(eq(teams.code, customCode)).limit(1);
        if (clash) return NextResponse.json({ error: "validation", message: "هذا الكود مستخدم لفريق آخر." }, { status: 400 });
      }
      if (body?.discordLink) {
        discordLink = String(body.discordLink).trim();
        if (!/^https:\/\/[^\s]+$/i.test(discordLink)) {
          return NextResponse.json({ error: "validation", message: "رابط ديسكورد يجب أن يبدأ بـ https://" }, { status: 400 });
        }
      }
    }

    const values = [];
    for (const it of items) {
      values.push({
        seasonId,
        challenge,
        name: it.name,
        code: customCode || (await uniqueTeamCode()),
        discordLink: discordLink.slice(0, 300),
        published: body?.published === true,
      });
    }
    const created = await db.insert(teams).values(values).returning();
    clearCache();
    return NextResponse.json({ items: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: change one or many teams.
// body: { ids: string[], published?, name?, challenge?, discordLink?, regenerateCode? }
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String).slice(0, 1000) : [];
    if (ids.length === 0) return NextResponse.json({ error: "missing_ids" }, { status: 400 });

    const set: Partial<typeof teams.$inferInsert> = {};
    if (typeof body.published === "boolean") set.published = body.published;
    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (name.length < 2) return NextResponse.json({ error: "validation", message: "اسم الفريق قصير جدًا." }, { status: 400 });
      set.name = name;
    }
    if (body.challenge !== undefined) {
      if (!(await challengeSlugExists(String(body.challenge), false))) {
        return NextResponse.json({ error: "validation", message: "اختر تحديًا صحيحًا." }, { status: 400 });
      }
      set.challenge = String(body.challenge);
    }
    if (body.discordLink !== undefined) {
      const link = String(body.discordLink).trim();
      if (link && !/^https:\/\/[^\s]+$/i.test(link)) {
        return NextResponse.json({ error: "validation", message: "رابط ديسكورد يجب أن يبدأ بـ https://" }, { status: 400 });
      }
      set.discordLink = link.slice(0, 300);
    }
    if (body.regenerateCode === true) {
      if (ids.length !== 1) return NextResponse.json({ error: "validation", message: "تغيير الكود لفريق واحد فقط." }, { status: 400 });
      set.code = await uniqueTeamCode();
    }
    if (Object.keys(set).length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

    const updated = await db.update(teams).set(set).where(inArray(teams.id, ids)).returning();
    clearCache();
    return NextResponse.json({ items: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: delete one or many teams. body: { ids: string[] }
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String).slice(0, 1000) : [];
  if (ids.length === 0) return NextResponse.json({ error: "missing_ids" }, { status: 400 });
  await db.delete(teams).where(inArray(teams.id, ids));
  clearCache();
  return NextResponse.json({ ok: true });
}
