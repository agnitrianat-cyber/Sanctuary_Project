import { list } from "@vercel/blob";
import { AI_KEY_VARS, getAiClient, getAiKey } from "@/lib/ai";
import { DB_URL_VARS, getDb, getDbUrl } from "@/lib/db";

// This route is publicly reachable, so error text must stay useful for
// debugging without echoing credentials back to the caller.
function safeError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  // Strip the "user:password@" portion of any connection URL in the message.
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, "$1<redacted>@");
}

type Check = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<unknown>): Promise<Check> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: safeError(err) };
  }
}

// Reports which of the expected variables exist, never their values, so the
// deployment can be diagnosed without exposing secrets.
function envPresence() {
  const names = [...DB_URL_VARS, "BLOB_READ_WRITE_TOKEN", ...AI_KEY_VARS];
  const present: Record<string, boolean> = {};
  for (const name of names) present[name] = Boolean(process.env[name]);
  return present;
}

export async function GET() {
  const [database, blob, ai] = await Promise.all([
    run(async () => {
      const sql = getDb();
      await sql`SELECT 1`;
    }),
    run(async () => {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not set");
      }
      await list({ limit: 1 });
    }),
    // Lists model metadata instead of generating content: this verifies the
    // key without spending tokens on every health check.
    run(async () => {
      await getAiClient().models.list();
    }),
  ]);

  const ok = database.ok && blob.ok && ai.ok;

  return Response.json(
    {
      ok,
      database: { ...database, usingVar: getDbUrl()?.name ?? null },
      blob,
      ai: { ...ai, usingVar: getAiKey()?.name ?? null },
      env: envPresence(),
    },
    { status: ok ? 200 : 500 },
  );
}
