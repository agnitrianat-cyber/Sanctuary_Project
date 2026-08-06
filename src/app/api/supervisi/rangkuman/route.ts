import { GEMINI_MODEL, getAiClient } from "@/lib/ai";
import { listDailyReports, listFindings } from "@/lib/supervision";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Draws a weekly summary from the week's reports and findings (PRD section
// 5.3). The result is a draft: the client shows it in an editable box before
// it goes to management.
export async function POST(request: Request) {
  try {
    const { projectId } = (await request.json()) ?? {};
    if (!projectId) {
      return Response.json({ error: "Proyek belum dipilih." }, { status: 400 });
    }

    const since = new Date(Date.now() - WEEK_MS).toISOString().slice(0, 10);
    const [allReports, allFindings] = await Promise.all([listDailyReports(), listFindings()]);
    const reports = allReports.filter((r) => r.projectId === projectId && r.reportDate >= since);
    const findings = allFindings.filter((f) => f.projectId === projectId);

    if (reports.length === 0 && findings.length === 0) {
      return Response.json(
        { error: "Belum ada laporan atau temuan minggu ini untuk diringkas." },
        { status: 400 },
      );
    }

    const reportLines = reports.map(
      (r) =>
        `- ${r.reportDate} | cuaca: ${r.weather || "-"} | tenaga kerja: ${r.workers} | ` +
        `material: ${r.materials || "-"} | alat: ${r.equipment || "-"} | catatan: ${r.notes || "-"}`,
    );
    const findingLines = findings.map(
      (f) =>
        `- [${f.status}] ${f.title} (${f.location || "-"}, ${f.discipline || "-"}) ` +
        `prioritas ${f.priority}, PIC ${f.pic || "-"}, tenggat ${f.dueDate || "-"}`,
    );

    const prompt = [
      "Kamu menyusun rangkuman mingguan supervisi proyek konstruksi untuk manajemen.",
      "Tulis dalam Bahasa Indonesia yang ringkas dan faktual, maksimal 200 kata.",
      "Susun dengan bagian: Ringkasan, Progres & kendala, Temuan yang perlu keputusan, Rencana minggu depan.",
      "Hanya gunakan data di bawah ini. Jangan mengarang angka.",
      "",
      `Laporan harian sejak ${since}:`,
      reportLines.length > 0 ? reportLines.join("\n") : "- tidak ada laporan minggu ini",
      "",
      "Daftar temuan:",
      findingLines.length > 0 ? findingLines.join("\n") : "- tidak ada temuan",
    ].join("\n");

    const response = await getAiClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const summary = response.text?.trim();
    if (!summary) {
      return Response.json({ error: "AI tidak mengembalikan ringkasan." }, { status: 502 });
    }

    return Response.json({ ok: true, summary, reports: reports.length, findings: findings.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
