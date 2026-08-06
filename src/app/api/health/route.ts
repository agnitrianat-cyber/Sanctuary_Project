import { list } from "@vercel/blob";
import { getAiClient } from "@/lib/ai";
import { getDb } from "@/lib/db";

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

export async function GET() {
  const [database, blob, ai] = await Promise.all([
    run(async () => {
      const sql = getDb();
      await sql`SELECT 1`;
    }),
    run(async () => {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
      await list({ token, limit: 1 });
    }),
    // Lists model metadata instead of generating content: this verifies the
    // key without spending tokens on every health check.
    run(async () => {
      await getAiClient().models.list();
    }),
  ]);

  const ok = database.ok && blob.ok && ai.ok;
  return Response.json({ ok, database, blob, ai }, { status: ok ? 200 : 500 });
}
