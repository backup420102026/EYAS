import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Admin: every submission. Teams submit through /api/team-portal/submit.
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const rows = await db.select().from(submissions).orderBy(desc(submissions.createdAt));
  return NextResponse.json({ submissions: rows });
}
