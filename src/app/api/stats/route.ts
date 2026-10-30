import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { challenges, people, submissions, teams } from "@/db/schema";
import { cached } from "@/lib/cache";
import { ensureDefaults } from "@/db/defaults";
import { getCurrentSeason } from "@/lib/season";

export const dynamic = "force-dynamic";

async function loadStats() {
  await ensureDefaults();
  const season = await getCurrentSeason();
  const seasonId = season?.id ?? "";

  const [[participants], [teamCount], [challengeCount], [submissionCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(people).where(and(eq(people.seasonId, seasonId), eq(people.published, true))),
    db.select({ count: sql<number>`count(*)` }).from(teams).where(and(eq(teams.seasonId, seasonId), eq(teams.published, true))),
    db.select({ count: sql<number>`count(*)` }).from(challenges).where(and(eq(challenges.seasonId, seasonId), eq(challenges.published, true))),
    db.select({ count: sql<number>`count(*)` }).from(submissions),
  ]);

  return {
    participants: Number(participants?.count ?? 0),
    teams: Number(teamCount?.count ?? 0),
    challenges: Number(challengeCount?.count ?? 0),
    totalSubmissions: Number(submissionCount?.count ?? 0),
  };
}

export async function GET() {
  return NextResponse.json(await cached("stats", 30_000, loadStats));
}
