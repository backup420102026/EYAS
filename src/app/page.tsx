import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { challenges, people, resources, submissions, teams } from "@/db/schema";
import { HomeClient } from "@/components/HomeClient";
import { ensureDefaults } from "@/db/defaults";
import { cached } from "@/lib/cache";
import { getCurrentSeason } from "@/lib/season";
import { publicMemberNames } from "@/lib/teamMembers";

export const dynamic = "force-dynamic";

// How many names/teams the public list loads at once (the page has a "show more" button).
const MAX_PEOPLE = 600;
const MAX_TEAMS = 300;

async function loadHomeData() {
  await ensureDefaults();
  const season = await getCurrentSeason();
  const seasonId = season?.id ?? "";

  const challengeRows = season
    ? await db
        .select()
        .from(challenges)
        .where(and(eq(challenges.seasonId, season.id), eq(challenges.published, true)))
        .orderBy(asc(challenges.sortOrder), asc(challenges.slug))
    : [];

  const resourceRows = challengeRows.length
    ? await db
        .select()
        .from(resources)
        .where(
          inArray(
            resources.challengeId,
            challengeRows.map((c) => c.id)
          )
        )
        .orderBy(asc(resources.createdAt))
    : [];

  const [peopleRows, teamRows, [peopleCount], [teamCount], [submissionCount]] = await Promise.all([
    db
      .select()
      .from(people)
      .where(and(eq(people.seasonId, seasonId), eq(people.published, true)))
      .orderBy(asc(people.createdAt))
      .limit(MAX_PEOPLE),
    db
      .select()
      .from(teams)
      .where(and(eq(teams.seasonId, seasonId), eq(teams.published, true)))
      .orderBy(asc(teams.createdAt))
      .limit(MAX_TEAMS),
    db.select({ count: sql<number>`count(*)` }).from(people).where(and(eq(people.seasonId, seasonId), eq(people.published, true))),
    db.select({ count: sql<number>`count(*)` }).from(teams).where(and(eq(teams.seasonId, seasonId), eq(teams.published, true))),
    db.select({ count: sql<number>`count(*)` }).from(submissions),
  ]);

  const memberNames = await publicMemberNames(teamRows.map((t) => t.id));

  return {
    stats: {
      participants: Number(peopleCount?.count ?? 0),
      teams: Number(teamCount?.count ?? 0),
      challenges: challengeRows.length,
      totalSubmissions: Number(submissionCount?.count ?? 0),
    },
    season: season
      ? {
          ...season,
          whatsappLink: "", // only given to the student after registering
          countdownDate: season.countdownDate.toISOString(),
          createdAt: season.createdAt.toISOString(),
          updatedAt: season.updatedAt.toISOString(),
        }
      : null,
    challenges: challengeRows.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() })),
    resources: resourceRows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    people: peopleRows.map((p) => ({
      ...p,
      gender: (p.gender === "girl" ? "girl" : "boy") as "boy" | "girl",
      createdAt: p.createdAt.toISOString(),
    })),
    // never pass the secret code or the private Discord link to the public page
    teams: teamRows.map((t) => ({
      id: t.id,
      seasonId: t.seasonId,
      name: t.name,
      challenge: t.challenge,
      published: t.published,
      createdAt: t.createdAt.toISOString(),
      members: memberNames.get(t.id) ?? [],
    })),
  };
}

export default async function HomePage() {
  // 15s shared cache: a burst of visitors costs the database one round of queries, not thousands.
  const data = await cached("home", 15_000, loadHomeData);
  return (
    <HomeClient
      challenges={data.challenges}
      resources={data.resources}
      people={data.people}
      teams={data.teams}
      season={data.season}
      stats={data.stats}
    />
  );
}
