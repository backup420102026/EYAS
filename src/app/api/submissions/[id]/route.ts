import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await request.json();
    const { score, feedback } = body ?? {};

    let scoreValue: number | null | undefined;
    if (score !== undefined) {
      if (score === null || score === "") {
        scoreValue = null;
      } else {
        const n = Number(score);
        if (!Number.isFinite(n) || n < 1 || n > 10) {
          return NextResponse.json({ error: "invalid_score" }, { status: 400 });
        }
        scoreValue = Math.round(n);
      }
    }

    const [updated] = await db
      .update(submissions)
      .set({
        ...(scoreValue !== undefined ? { score: scoreValue } : {}),
        ...(feedback !== undefined ? { feedback: String(feedback).slice(0, 1000) } : {}),
      })
      .where(eq(submissions.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  await db.delete(submissions).where(eq(submissions.id, id));
  return NextResponse.json({ ok: true });
}
