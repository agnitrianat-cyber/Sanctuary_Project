import { parseFeasibility } from "@/lib/feasibility";
import { analyse, paybackLevers } from "@/lib/feasibility-analysis";
import { buildPrompt, generateNarrative, resolveProvider } from "@/lib/feasibility-ai";
import { extractMetrics } from "@/lib/feasibility-metrics";

export const runtime = "nodejs";
// The model call dominates; the default 10s would cut it off.
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const targetYear = Number(form.get("targetYear") ?? 5);

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Tidak ada file yang dikirim." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ ok: false, error: `File melebihi batas ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 413 });
    }

    const parsed = await parseFeasibility(await file.arrayBuffer());
    if (!parsed.ok) {
      return Response.json({ ok: false, error: parsed.error, sheetNames: parsed.sheetNames }, { status: 422 });
    }

    const metrics = extractMetrics(parsed.sheet);
    const analysis = analyse(metrics);
    const levers = paybackLevers(metrics, Number.isFinite(targetYear) ? targetYear : 5);

    // The computed figures are the deliverable. If the model call fails the
    // analysis is still returned, rather than losing everything.
    let narrative: string | null = null;
    let narrativeError: string | null = null;
    let provider = resolveProvider();
    try {
      const out = await generateNarrative(buildPrompt(metrics, analysis, levers));
      narrative = out.text;
      provider = out.provider;
    } catch (err) {
      narrativeError = err instanceof Error ? err.message : String(err);
    }

    return Response.json({
      ok: true,
      filename: file.name,
      sheet: parsed.sheet,
      metrics,
      analysis,
      levers,
      targetYear,
      narrative,
      narrativeError,
      provider: provider ? { name: provider.provider, model: provider.model, keyVar: provider.keyVar } : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: `Gagal menganalisa: ${message}` }, { status: 500 });
  }
}
