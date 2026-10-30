import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, seasonSettings } from "@/db/schema";
import { isAdminRequest, requireAdmin } from "@/lib/adminAuth";
import { ensureDefaults } from "@/db/defaults";
import { clearCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

function isValidDate(value: unknown) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

// Public: the current season plus the list of all seasons.
// The WhatsApp community link is NOT public: it is only returned to the admin (passcode header)
// and, right after a successful registration, to the student who registered.
export async function GET(request: NextRequest) {
  await ensureDefaults();
  const seasons = await db.select().from(seasonSettings).orderBy(asc(seasonSettings.createdAt));
  const season = seasons.find((s) => s.isCurrent) ?? seasons[0] ?? null;
  if (isAdminRequest(request)) return NextResponse.json({ season, seasons });
  const hideLink = <T extends { whatsappLink: string }>(s: T): T => ({ ...s, whatsappLink: "" });
  return NextResponse.json({
    season: season ? hideLink(season) : null,
    seasons: seasons.map(hideLink),
  });
}

// Admin: create a new season (it starts as not current, with registration closed).
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const seasonName = String(body?.seasonName ?? "").trim();
    if (seasonName.length < 2 || seasonName.length > 80) {
      return NextResponse.json({ error: "invalid_name", message: "اكتب اسم الموسم (حرفان على الأقل)." }, { status: 400 });
    }
    const [created] = await db
      .insert(seasonSettings)
      .values({
        seasonName,
        applicationsOpen: false,
        isCurrent: false,
        countdownDate: isValidDate(body?.countdownDate)
          ? new Date(body.countdownDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();
    clearCache();
    return NextResponse.json({ season: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: edit a season (defaults to the current one). isCurrent: true switches the current season.
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { id, applicationsOpen, countdownDate, seasonName, isCurrent, whatsappLink, challengePickOpen, teamLookupOpen } = body ?? {};

    if (whatsappLink !== undefined && typeof whatsappLink === "string" && whatsappLink.trim() !== "" && !/^https:\/\/[^\s]+$/i.test(whatsappLink.trim())) {
      return NextResponse.json(
        { error: "validation", message: "رابط واتساب يجب أن يبدأ بـ https://" },
        { status: 400 }
      );
    }

    const all = await db.select().from(seasonSettings).orderBy(asc(seasonSettings.createdAt));
    const target = id
      ? all.find((s) => s.id === id)
      : (all.find((s) => s.isCurrent) ?? all[0]);
    if (!target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const updated = await db.transaction(async (tx) => {
      if (isCurrent === true) {
        await tx.update(seasonSettings).set({ isCurrent: false });
      }
      const [row] = await tx
        .update(seasonSettings)
        .set({
          ...(applicationsOpen !== undefined ? { applicationsOpen: Boolean(applicationsOpen) } : {}),
          ...(challengePickOpen !== undefined ? { challengePickOpen: Boolean(challengePickOpen) } : {}),
          ...(teamLookupOpen !== undefined ? { teamLookupOpen: Boolean(teamLookupOpen) } : {}),
          ...(typeof whatsappLink === "string" ? { whatsappLink: whatsappLink.trim().slice(0, 300) } : {}),
          ...(isValidDate(countdownDate) ? { countdownDate: new Date(countdownDate) } : {}),
          ...(typeof seasonName === "string" && seasonName.trim() ? { seasonName: seasonName.trim() } : {}),
          ...(isCurrent === true ? { isCurrent: true } : {}),
          updatedAt: new Date(),
        })
        .where(eq(seasonSettings.id, target.id))
        .returning();
      return row;
    });

    clearCache();
    return NextResponse.json({ season: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: delete a season. Not allowed for the current season or one that still has challenges.
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const [season] = await db.select().from(seasonSettings).where(eq(seasonSettings.id, id)).limit(1);
  if (!season) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (season.isCurrent) {
    return NextResponse.json(
      { error: "is_current", message: "لا يمكن حذف الموسم الحالي. اجعل موسمًا آخر هو الحالي أولًا." },
      { status: 409 }
    );
  }
  const attached = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.seasonId, id))
    .limit(1);
  if (attached.length > 0) {
    return NextResponse.json(
      { error: "has_challenges", message: "هذا الموسم يحتوي على تحديات. احذفها أولًا." },
      { status: 409 }
    );
  }
  await db.delete(seasonSettings).where(eq(seasonSettings.id, id));
  clearCache();
  return NextResponse.json({ ok: true });
}
