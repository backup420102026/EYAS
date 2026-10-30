import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { challenges, seasonSettings } from "@/db/schema";

const DEFAULT_CHALLENGES = [
  {
    slug: "environment",
    title: "تحدي البيئة",
    category: "البيئة",
    description:
      "ابتكر حلًا علميًا لمشكلة بيئية حقيقية في مصر، مثل ترشيد المياه أو إعادة التدوير أو تقليل التلوث.",
    deliverables:
      "تحليل واضح للمشكلة\nنموذج أولي أو تصميم للحل\nتقرير فني مختصر\nفيديو عرض لا يتجاوز 3 دقائق",
    coverImage: "/images/challenge-environment.svg",
    teamImage: "1",
  },
  {
    slug: "energy",
    title: "تحدي الطاقة",
    category: "الطاقة",
    description:
      "صمّم فكرة أو جهازًا يرفع كفاءة استخدام الطاقة أو يستفيد من مصادر الطاقة المتجددة.",
    deliverables:
      "فكرة الحل ومبرراتها العلمية\nحسابات أو قياسات توضح الجدوى\nنموذج أولي يعمل\nفيديو عرض لا يتجاوز 3 دقائق",
    coverImage: "/images/challenge-energy.svg",
    teamImage: "2",
  },
  {
    slug: "ai",
    title: "تحدي الذكاء الاصطناعي والتقنية",
    category: "الذكاء الاصطناعي والتقنية",
    description:
      "ابنِ تطبيقًا أو نموذجًا ذكيًا يخدم المجتمع، مع شرح للبيانات والطريقة التي اعتمدت عليها.",
    deliverables:
      "وصف المشكلة والبيانات المستخدمة\nكود أو نموذج يعمل\nتقرير فني مختصر\nفيديو عرض لا يتجاوز 3 دقائق",
    coverImage: "/images/challenge-ai.svg",
    teamImage: "3",
  },
];

let ensured: Promise<void> | null = null;

/**
 * Keeps a fresh or older database consistent. Safe to call on every request
 * (runs once per server instance):
 *  1. first run: creates the first season and the three starter challenges
 *  2. makes sure exactly one season is marked current
 *  3. attaches old challenges (created before seasons existed) to the current season
 * Starter challenges are only created on the very first run, so deleting one is permanent.
 */
export function ensureDefaults() {
  if (!ensured) {
    ensured = (async () => {
      let seasons = await db.select().from(seasonSettings).orderBy(asc(seasonSettings.createdAt));

      if (seasons.length === 0) {
        const [created] = await db
          .insert(seasonSettings)
          .values({
            id: "default-season",
            seasonName: "الموسم الأول",
            applicationsOpen: true,
            isCurrent: true,
            countdownDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          })
          .onConflictDoNothing()
          .returning();
        seasons = created ? [created] : await db.select().from(seasonSettings);

        if (seasons[0]) {
          await db
            .insert(challenges)
            .values(
              DEFAULT_CHALLENGES.map((c, i) => ({
                ...c,
                pdfUrl: "",
                sortOrder: i,
                published: true,
                seasonId: seasons[0].id,
              }))
            )
            .onConflictDoNothing({ target: challenges.slug });
        }
      }

      let current = seasons.find((s) => s.isCurrent);
      if (!current && seasons[0]) {
        await db
          .update(seasonSettings)
          .set({ isCurrent: true })
          .where(eq(seasonSettings.id, seasons[0].id));
        current = seasons[0];
      }

      if (current) {
        await db
          .update(challenges)
          .set({ seasonId: current.id })
          .where(and(isNull(challenges.seasonId)));
      }
    })().catch((error) => {
      ensured = null; // retry on the next request
      throw error;
    });
  }
  return ensured;
}
