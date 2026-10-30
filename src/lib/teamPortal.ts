import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges, milestones, submissions, teams } from "@/db/schema";
import { normalizeTeamCode } from "@/lib/teamCode";
import { milestoneState } from "@/lib/milestoneState";

export async function findTeamByCode(rawCode: unknown) {
  const code = normalizeTeamCode(String(rawCode ?? ""));
  if (code.length < 6) return null;
  const [team] = await db.select().from(teams).where(eq(teams.code, code)).limit(1);
  return team ?? null;
}

/** Everything the team portal shows for one team. Scores/feedback only where the admin released them. */
export async function buildPortalView(team: typeof teams.$inferSelect) {
  const [challenge] = await db
    .select({ title: challenges.title })
    .from(challenges)
    .where(eq(challenges.slug, team.challenge))
    .limit(1);

  const stages = await db
    .select()
    .from(milestones)
    .where(eq(milestones.seasonId, team.seasonId))
    .orderBy(asc(milestones.number), asc(milestones.createdAt));

  const subs = await db.select().from(submissions).where(eq(submissions.teamId, team.id));
  const now = new Date();

  return {
    team: {
      name: team.name,
      challengeTitle: challenge?.title ?? "",
      discordLink: team.discordLink,
    },
    milestones: stages.map((m) => {
      const state = milestoneState(m, now);
      const sub = subs.find((s) => s.milestoneId === m.id);
      return {
        id: m.id,
        number: m.number,
        title: m.title,
        state,
        opensAt: m.opensAt ? m.opensAt.toISOString() : null,
        dueAt: m.dueAt ? m.dueAt.toISOString() : null,
        // details stay hidden until the stage opens
        description: state === "upcoming" ? "" : m.description,
        closedMessage: m.closedMessage,
        submission: sub
          ? {
              link: sub.link,
              note: sub.note,
              studentName: sub.studentName,
              updatedAt: sub.createdAt.toISOString(),
              score: m.resultsVisible ? sub.score : null,
              feedback: m.resultsVisible ? sub.feedback : null,
              graded: m.resultsVisible && sub.score !== null,
            }
          : null,
      };
    }),
  };
}

