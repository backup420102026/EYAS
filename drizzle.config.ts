import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

// Supabase's certificate chain is not in Node's trust store.
// Relax verification for this CLI process only.
if (!/(localhost|127\.0\.0\.1)/.test(url)) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});