import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB (also stays under common serverless body limits)
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing_file", message: "لم يتم اختيار ملف." }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "bad_type", message: "الأنواع المسموحة: PNG, JPG, WEBP, GIF, PDF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "too_large", message: "الحد الأقصى لحجم الملف 4 ميجابايت." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const [created] = await db
      .insert(uploads)
      .values({
        fileName: file.name.slice(0, 200),
        mimeType: file.type,
        size: file.size,
        data: buffer.toString("base64"),
      })
      .returning({ id: uploads.id });

    return NextResponse.json({ url: `/api/uploads/${created.id}` }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error", message: "تعذّر رفع الملف." }, { status: 500 });
  }
}
