import { NextRequest, NextResponse } from "next/server";
import { clientIp, hit } from "@/lib/rateLimit";
import { buildPortalView, findTeamByCode } from "@/lib/teamPortal";

export const dynamic = "force-dynamic";

// A team opens its portal with its secret code. POST so the code never appears in URLs or logs.
export async function POST(request: NextRequest) {
  if (!hit(`team-code:${clientIp(request)}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "rate_limited", message: "محاولات كثيرة خلال وقت قصير، حاول لاحقًا." },
      { status: 429 }
    );
  }
  try {
    const body = await request.json().catch(() => null);
    const team = await findTeamByCode(body?.code);
    if (!team) {
      return NextResponse.json({ error: "not_found", message: "الكود غير صحيح. تأكد منه كما وصلك." }, { status: 404 });
    }
    return NextResponse.json(await buildPortalView(team));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error", message: "حدث خطأ في الخادم، حاول مرة أخرى." }, { status: 500 });
  }
}
