import { addDailyReport } from "@/lib/supervision";

// Saves one daily report. The form is filled in on site, so anything optional
// falls back to an empty value instead of rejecting the whole submission.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, reportDate, weather, workers, materials, equipment, notes, author } = body ?? {};

    if (!projectId || !reportDate) {
      return Response.json({ error: "Proyek dan tanggal wajib diisi." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(reportDate))) {
      return Response.json({ error: "Format tanggal harus YYYY-MM-DD." }, { status: 400 });
    }

    const workerCount = Number(workers);
    if (!Number.isFinite(workerCount) || workerCount < 0) {
      return Response.json({ error: "Jumlah tenaga kerja tidak valid." }, { status: 400 });
    }

    const report = await addDailyReport({
      projectId: String(projectId),
      reportDate: String(reportDate),
      weather: String(weather ?? "").trim(),
      workers: Math.round(workerCount),
      materials: String(materials ?? "").trim(),
      equipment: String(equipment ?? "").trim(),
      notes: String(notes ?? "").trim(),
      author: String(author ?? "").trim() || "Pengawas",
    });

    return Response.json({ ok: true, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
