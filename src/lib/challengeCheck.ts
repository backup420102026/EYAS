import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges } from "@/db/schema";

/** True when a challenge with this slug exists (and, if requested, is published). */
export async function challengeSlugExists(slug: string, onlyPublished = true) {
  const [row] = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(
      onlyPublished
        ? and(eq(challenges.slug, slug), eq(challenges.published, true))
        : eq(challenges.slug, slug)
    )
    .limit(1);
  return Boolean(row);
}
