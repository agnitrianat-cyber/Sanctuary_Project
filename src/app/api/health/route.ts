import { list } from "@vercel/blob";
import { getAiClient, GEMINI_MODEL } from "@/lib/ai";
import { getDb } from "@/lib/db";

async function checkDatabase() {
  try {
    const sql = getDb();
    await sql`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function checkBlob() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
    await list({ token, limit: 1 });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function checkAi() {
  try {
    const ai = getAiClient();
    await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "Reply with the single word: ok",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function GET() {
  const [database, blob, ai] = await Promise.all([checkDatabase(), checkBlob(), checkAi()]);
  const ok = database.ok && blob.ok && ai.ok;

  return Response.json({ ok, database, blob, ai }, { status: ok ? 200 : 500 });
}
