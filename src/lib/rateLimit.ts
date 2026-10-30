import type { NextRequest } from "next/server";

// Simple in-memory sliding-window limiter. It is per server instance, which is
// fine for a single Node server; use Redis/Upstash if you scale to many instances.
const buckets = new Map<string, number[]>();

function prune(key: string, windowMs: number) {
  const now = Date.now();
  const list = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length === 0) buckets.delete(key);
  else buckets.set(key, list);
  return list;
}

/** Records one hit. Returns false when the limit is exceeded. */
export function hit(key: string, max: number, windowMs: number) {
  const list = prune(key, windowMs);
  if (list.length >= max) return false;
  list.push(Date.now());
  buckets.set(key, list);
  if (buckets.size > 5000) {
    for (const k of buckets.keys()) prune(k, windowMs);
  }
  return true;
}

/** Checks the limit without recording a hit. */
export function isLimited(key: string, max: number, windowMs: number) {
  return prune(key, windowMs).length >= max;
}

export function clientIp(request: NextRequest) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
