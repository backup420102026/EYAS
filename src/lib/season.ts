import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { seasonSettings } from "@/db/schema";

/** The season marked current; falls back to the oldest season if none is marked. */
export async function getCurrentSeason() {
  const rows = await db
    .select()
    .from(seasonSettings)
    .orderBy(desc(seasonSettings.isCurrent), asc(seasonSettings.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
