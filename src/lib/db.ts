import { neon } from "@neondatabase/serverless";

// Vercel's Neon integration provisions several connection variables. Prefer
// DATABASE_URL, but fall back to the others so the app works with whichever
// set the integration created.
export const DB_URL_VARS = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"] as const;

export function getDbUrl() {
  for (const name of DB_URL_VARS) {
    const value = process.env[name];
    if (value) return { name, value };
  }
  return null;
}

export function getDb() {
  const found = getDbUrl();
  if (!found) throw new Error(`No database URL set. Expected one of: ${DB_URL_VARS.join(", ")}`);
  return neon(found.value);
}
