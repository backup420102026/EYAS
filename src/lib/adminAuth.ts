import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, hit, isLimited } from "./rateLimit";

const sha = (value: string) => createHash("sha256").update(value).digest();

const MAX_FAILURES = 10;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Returns null when the request carries the right admin passcode,
 * otherwise a ready-to-return error response.
 * There is deliberately NO fallback passcode: without ADMIN_PASSCODE the panel stays locked.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const key = `admin-fail:${clientIp(request)}`;
  if (isLimited(key, MAX_FAILURES, WINDOW_MS)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const provided = request.headers.get("x-admin-passcode") ?? "";
  if (timingSafeEqual(sha(provided), sha(expected))) return null;

  hit(key, MAX_FAILURES, WINDOW_MS);
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/**
 * True only when the request carries the correct passcode. Unlike requireAdmin it never
 * counts failures, so public endpoints can use it to return extra data to the admin.
 */
export function isAdminRequest(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  const provided = request.headers.get("x-admin-passcode");
  if (!expected || !provided) return false;
  return timingSafeEqual(sha(provided), sha(expected));
}
