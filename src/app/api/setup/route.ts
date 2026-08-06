import { setupDatabase } from "@/lib/setup";

// Creates the tables and sample data from the deployed app, so the database can
// be initialised without local access. Idempotent and non-destructive: existing
// rows are left alone, so opening this more than once is harmless.
export async function GET() {
  try {
    const result = await setupDatabase();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, error: message.replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, "$1<redacted>@") },
      { status: 500 },
    );
  }
}
