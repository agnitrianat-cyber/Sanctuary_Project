import { list } from "@vercel/blob";
import { AI_KEY_VARS, getAiKey } from "@/lib/ai";
import { OPENAI_KEY_VARS, resolveProvider, verifyAiKey } from "@/lib/feasibility-ai";
import { BLOB_TOKEN_VARS, getBlobToken, requireBlobToken } from "@/lib/blob";
import { DB_URL_VARS, getDb, getDbUrl } from "@/lib/db";

// This route is publicly reachable, so error text must stay useful for
// debugging without echoing credentials back to the caller.
function safeError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  // Strip the "user:password@" portion of any connection URL in the message.
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, "$1<redacted>@");
}

type Check = { ok: true } | { ok: false; error: string };

// A misconfigured service can leave its request hanging. Without a cap the
// whole route would stall until the platform kills it, returning nothing —
// exactly when the diagnosis is needed most.
const CHECK_TIMEOUT_MS = 8000;

async function run(fn: () => Promise<unknown>): Promise<Check> {
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out after ${CHECK_TIMEOUT_MS}ms`)), CHECK_TIMEOUT_MS),
      ),
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: safeError(err) };
  }
}

// Reports which of the expected variables exist, never their values, so the
// deployment can be diagnosed without exposing secrets.
function envPresence() {
  const names = [...DB_URL_VARS, ...BLOB_TOKEN_VARS, ...OPENAI_KEY_VARS, ...AI_KEY_VARS];
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
      await list({ token: requireBlobToken(), limit: 1 });
    }),
    // Checks whichever provider is configured, not Gemini specifically, so a
    // deployment holding only an OpenAI key is not reported as broken.
    run(async () => {
      await verifyAiKey();
    }),
  ]);

  const ok = database.ok && blob.ok && ai.ok;

  return Response.json(
    {
      ok,
      database: { ...database, usingVar: getDbUrl()?.name ?? null },
      blob: { ...blob, usingVar: getBlobToken()?.name ?? null },
      ai: { ...ai, usingVar: resolveProvider()?.keyVar ?? getAiKey()?.name ?? null, provider: resolveProvider() },
      env: envPresence(),
    },
    { status: ok ? 200 : 500 },
  );
}
