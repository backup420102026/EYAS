import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { milestones, seasonSettings, submissions } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const date = (v: unknown) => {
  if (v === null || v === "" || v === undefined) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d; // undefined = invalid
};

// Admin: every milestone of every season.
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const rows = await db.select().from(milestones).orderBy(asc(milestones.number), asc(milestones.createdAt));
  return NextResponse.json({ items: rows });
}

// Admin: add a milestone to a season.
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const seasonId = String(body?.seasonId ?? "");
    const [season] = await db.select({ id: seasonSettings.id }).from(seasonSettings).where(eq(seasonSettings.id, seasonId)).limit(1);
    if (!season) {
      return NextResponse.json({ error: "validation", message: "اختر موسمًا صحيحًا." }, { status: 400 });
    }
    const existing = await db.select({ id: milestones.id }).from(milestones).where(eq(milestones.seasonId, seasonId));
    const number = existing.length + 1;
    const title = String(body?.title ?? "").trim().slice(0, 120) || `المرحلة ${number}`;

    const [created] = await db.insert(milestones).values({ seasonId, number, title }).returning();
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: edit a milestone.
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const id = String(body?.id ?? "");
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const opensAt = date(body?.opensAt);
    const dueAt = date(body?.dueAt);
    if (opensAt === undefined || dueAt === undefined) {
      return NextResponse.json({ error: "validation", message: "التاريخ غير صحيح." }, { status: 400 });
    }
    const title = String(body?.title ?? "").trim().slice(0, 120);
    if (!title) return NextResponse.json({ error: "validation", message: "اكتب عنوان المرحلة." }, { status: 400 });

    const [updated] = await db
      .update(milestones)
      .set({
        title,
        description: String(body?.description ?? "").trim().slice(0, 4000),
        opensAt,
        dueAt,
        isOpen: body?.isOpen !== false,
        resultsVisible: body?.resultsVisible === true,
        closedMessage: String(body?.closedMessage ?? "").trim().slice(0, 500),
        ...(Number.isFinite(Number(body?.number)) ? { number: Math.round(Number(body.number)) } : {}),
      })
      .where(eq(milestones.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: delete a milestone (blocked once teams have submitted to it).
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const [used] = await db.select({ id: submissions.id }).from(submissions).where(eq(submissions.milestoneId, id)).limit(1);
  if (used) {
    return NextResponse.json(
      { error: "in_use", message: "توجد تسليمات على هذه المرحلة فلا يمكن حذفها. أغلقها بدلًا من ذلك." },
      { status: 409 }
    );
  }
  await db.delete(milestones).where(eq(milestones.id, id));
  return NextResponse.json({ ok: true });
}
