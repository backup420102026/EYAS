import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, resources } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";
import { clearCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

// Public: every resource (the site groups them by challenge).
export async function GET() {
  const rows = await db.select().from(resources).orderBy(asc(resources.createdAt));
  return NextResponse.json({ resources: rows });
}

// Admin: add a resource to a challenge.
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const challengeId = String(body?.challengeId ?? "");
    const title = String(body?.title ?? "").trim().slice(0, 150);
    const description = String(body?.description ?? "").trim().slice(0, 500);
    const url = String(body?.url ?? "").trim().slice(0, 500);

    if (!title) {
      return NextResponse.json({ error: "validation", message: "اكتب عنوان المصدر." }, { status: 400 });
    }
    if (!/^https?:\/\/[^\s]+$/i.test(url)) {
      return NextResponse.json(
        { error: "validation", message: "الرابط يجب أن يبدأ بـ https://" },
        { status: 400 }
      );
    }
    const [challenge] = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);
    if (!challenge) {
      return NextResponse.json({ error: "validation", message: "اختر تحديًا صحيحًا." }, { status: 400 });
    }

    const [created] = await db
      .insert(resources)
      .values({ challengeId, title, description, url })
      .returning();
    clearCache();
    return NextResponse.json({ resource: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// Admin: delete a resource.
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await db.delete(resources).where(eq(resources.id, id));
  clearCache();
  return NextResponse.json({ ok: true });
}
