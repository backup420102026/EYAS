import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { phoneKey } from "@/lib/contact";

/** Finds a registered student of a season by email AND phone (both must match). */
export async function findStudentByContact(email: string, phone: string, seasonId: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(and(sql`lower(${students.email}) = ${email.trim().toLowerCase()}`, eq(students.seasonId, seasonId)))
    .limit(1);
  if (!student || phoneKey(student.phone) !== phoneKey(phone)) return null;
  return student;
}
