import { NextRequest } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [file] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  if (!file) return new Response("Not found", { status: 404 });

  const bytes = Buffer.from(file.data, "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
