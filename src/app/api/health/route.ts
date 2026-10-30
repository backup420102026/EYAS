import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// Quick check that the app can reach the database.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (error) {
    console.error("[health]", error);
    return NextResponse.json({ ok: false, db: "unreachable" }, { status: 503 });
  }
}
