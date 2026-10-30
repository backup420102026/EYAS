import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";

// no 0/O/1/I/L so a code is easy to read out loud or type from a screenshot
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateTeamCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** Accepts "abcd-efgh", " ABCD EFGH " ... and returns "ABCDEFGH". */
export function normalizeTeamCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function uniqueTeamCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateTeamCode();
    const [clash] = await db.select({ id: teams.id }).from(teams).where(eq(teams.code, code)).limit(1);
    if (!clash) return code;
  }
  throw new Error("could not generate a unique team code");
}

/** Teams created before codes existed get one the first time the admin opens the list. */
export async function fillMissingCodes() {
  const missing = await db.select({ id: teams.id }).from(teams).where(eq(teams.code, ""));
  for (const row of missing) {
    await db.update(teams).set({ code: await uniqueTeamCode() }).where(eq(teams.id, row.id));
  }
}
