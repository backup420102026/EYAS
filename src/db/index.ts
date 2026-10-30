import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("[db] DATABASE_URL is not set");
}

/**
 * Hosted databases (Supabase, Neon, ...) need SSL. Their certificate chain is often not in
 * Node's trust store ("self-signed certificate in certificate chain"), so we keep the
 * connection encrypted but skip certificate verification.
 * The `sslmode` query param is removed because pg would let it override our ssl setting.
 */
function buildPoolConfig(url?: string): PoolConfig {
  if (!url) return {};
  try {
    const parsed = new URL(url);
    const mode = parsed.searchParams.get("sslmode");
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    const useSsl = !isLocal && mode !== "disable";
    parsed.searchParams.delete("sslmode");
    return {
      connectionString: parsed.toString(),
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    };
  } catch {
    return { connectionString: url };
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __egasPgPool?: Pool;
};

export const pool =
  globalForDb.__egasPgPool ??
  new Pool({
    ...buildPoolConfig(databaseUrl),
    max: Number(process.env.DB_POOL_MAX ?? 3),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__egasPgPool = pool;
}

export const db = drizzle(pool);