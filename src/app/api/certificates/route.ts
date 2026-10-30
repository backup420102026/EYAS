import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const rows = await db.select().from(certificates).orderBy(desc(certificates.issuedAt));
  return NextResponse.json({ certificates: rows });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { studentName, teamName, badge } = body ?? {};

    if (!studentName || !teamName || !badge) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    if (!["gold", "silver", "bronze", "completion"].includes(String(badge))) {
      return NextResponse.json({ error: "invalid_badge" }, { status: 400 });
    }

    const [created] = await db
      .insert(certificates)
      .values({
        studentName: String(studentName).trim(),
        teamName: String(teamName).trim(),
        badge: String(badge),
      })
      .returning();

    return NextResponse.json({ certificate: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
