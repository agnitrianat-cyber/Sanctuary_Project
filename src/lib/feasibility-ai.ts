import OpenAI from "openai";
import { getAiClient as getGeminiClient, getAiKey as getGeminiKey, GEMINI_MODEL } from "./ai";
import type { Analysis } from "./feasibility-analysis";
import type { Metrics } from "./feasibility-metrics";

export const OPENAI_KEY_VARS = ["OPENAI_API_KEY"] as const;

export function getOpenAiKey() {
  const value = process.env.OPENAI_API_KEY;
  return value ? { name: "OPENAI_API_KEY", value } : null;
}

export type AiProvider = { provider: "openai" | "gemini"; keyVar: string; model: string };

// OpenAI is preferred because the PRD names it; Gemini stands in when only that
// key is configured, so whichever the deployment has will work.
export function resolveProvider(): AiProvider | null {
  const openai = getOpenAiKey();
  if (openai) {
    return { provider: "openai", keyVar: openai.name, model: process.env.OPENAI_MODEL || "gpt-4o" };
  }
  const gemini = getGeminiKey();
  if (gemini) return { provider: "gemini", keyVar: gemini.name, model: GEMINI_MODEL };
  return null;
}

const SYSTEM = `Kamu analis keuangan senior untuk tim proyek pengembang properti di Indonesia.
Kamu menerima angka studi kelayakan yang SUDAH dihitung dan diverifikasi oleh sistem.

Aturan keras:
- JANGAN menghitung ulang apa pun. Semua angka sudah final. Kutip apa adanya.
- JANGAN mengarang angka yang tidak ada di data. Kalau tidak ada, bilang tidak tersedia.
- Tulis dalam Bahasa Indonesia yang lugas, seperti memo ke direksi. Hindari jargon berlebihan.
- Bedakan dengan tegas antara temuan (fakta terhitung) dan pendapat kamu.
- Kalau ada temuan berseverity tinggi, angkat di awal. Jangan disembunyikan di tengah.

Format jawaban, pakai heading markdown persis ini:
## Ringkasan
Dua sampai empat kalimat: proyek ini layak atau tidak, dan kenapa.

## Yang perlu diperbaiki
Poin-poin dari daftar temuan. Jelaskan dampaknya ke keputusan, bukan hanya mengulang deskripsinya.
Kalau tidak ada temuan, tulis "Tidak ada temuan yang menghalangi keputusan."

## Risiko utama
Dua sampai empat risiko terbesar berdasarkan angka sensitivitas. Sebutkan angkanya.

## Rekomendasi
Langkah konkret yang bisa diambil tim proyek. Maksimal empat poin.`;

function fmtMoney(n: number | null): string {
  if (n === null) return "tidak tersedia";
  return `${(n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} miliar`;
}
function fmtPct(n: number | null): string {
  return n === null ? "tidak tersedia" : `${(n * 100).toFixed(2)}%`;
}

export function buildPrompt(m: Metrics, a: Analysis, levers: ReturnType<typeof import("./feasibility-analysis").paybackLevers>): string {
  const lines: string[] = [];
  lines.push(`PROYEK: ${m.project ?? "-"} | ${m.entity ?? "-"} | ${m.country ?? "-"}`);
  lines.push(`Horizon proyeksi: ${m.years} tahun`);
  lines.push(`Investasi awal: ${fmtMoney(m.investment)}`);
  lines.push(`Tingkat diskonto yang dipakai: ${fmtPct(m.discountRate)}`);
  lines.push(`Tarif pajak di model: ${fmtPct(m.taxRate)}`);
  lines.push("");
  lines.push("ANGKA HASIL PERHITUNGAN SISTEM (sudah diverifikasi, jangan diubah):");
  lines.push(`- NPV tertulis di file: ${fmtMoney(a.npvReported)}`);
  lines.push(`- NPV hasil hitung ulang: ${fmtMoney(a.npvCorrected)}`);
  if (a.npvGap !== null) lines.push(`- Selisih NPV: ${fmtMoney(a.npvGap)}`);
  lines.push(`- IRR: ${fmtPct(a.irrComputed)}`);
  lines.push(`- Payback: ${a.paybackComputed !== null ? a.paybackComputed.toFixed(2) + " tahun" : "tidak tersedia"}`);
  if (a.terminalValueShare !== null) {
    lines.push(`- Terminal value menyumbang ${(a.terminalValueShare * 100).toFixed(0)}% dari NPV (nilai kini ${fmtMoney(a.terminalValuePv)})`);
    lines.push(`- NPV tanpa terminal value: ${fmtMoney(a.npvWithoutTerminal)}, IRR tanpa terminal value: ${fmtPct(a.irrWithoutTerminal)}`);
  }
  if (a.revenueHeadroom !== null) lines.push(`- Omzet boleh turun ${fmtPct(a.revenueHeadroom)} sebelum NPV nol`);
  if (a.discountLadder.length) {
    lines.push(`- NPV pada berbagai diskonto: ${a.discountLadder.map((d) => `${(d.rate * 100).toFixed(1)}% -> ${fmtMoney(d.npv)}`).join("; ")}`);
  }
  lines.push(`- Verdict sistem: ${a.verdict}. Alasan: ${a.verdictReason}`);

  if (levers && !levers.alreadyMet) {
    lines.push("");
    lines.push("ANALISA PERCEPATAN BALIK MODAL:");
    lines.push(`- Kekurangan arus kas: ${fmtMoney(levers.gap)}`);
    if (levers.tariffUplift !== null) lines.push(`- Perlu kenaikan tarif ${fmtPct(levers.tariffUplift)} (biaya tetap)`);
    if (levers.volumeUplift !== null) lines.push(`- Atau kenaikan volume ${fmtPct(levers.volumeUplift)}`);
    lines.push(`- Atau pemangkasan investasi ${fmtPct(levers.capexCut)}`);
    lines.push(`- Pemangkasan biaya operasi ${levers.costCutEnough ? "bisa" : "TIDAK BISA"} menutup kekurangan (total biaya periode itu ${fmtMoney(levers.costWithin)})`);
  }

  lines.push("");
  lines.push("TEMUAN SISTEM:");
  if (!a.findings.length) lines.push("- (tidak ada)");
  for (const f of a.findings) lines.push(`- [${f.severity}] ${f.title}: ${f.detail}`);

  return lines.join("\n");
}

/**
 * Confirms the configured key is accepted, listing model metadata rather than
 * generating anything so a health check costs no tokens.
 */
export async function verifyAiKey(): Promise<AiProvider> {
  const provider = resolveProvider();
  if (!provider) {
    throw new Error(`No AI key set. Expected one of: ${OPENAI_KEY_VARS.join(", ")}, GOOGLE_AI`);
  }
  if (provider.provider === "openai") {
    await new OpenAI({ apiKey: getOpenAiKey()!.value }).models.list();
  } else {
    await getGeminiClient().models.list();
  }
  return provider;
}

export async function generateNarrative(prompt: string): Promise<{ text: string; provider: AiProvider }> {
  const provider = resolveProvider();
  if (!provider) {
    throw new Error(`Tidak ada API key AI. Set OPENAI_API_KEY atau GOOGLE_AI di environment.`);
  }

  if (provider.provider === "openai") {
    const client = new OpenAI({ apiKey: getOpenAiKey()!.value });
    const res = await client.chat.completions.create({
      model: provider.model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });
    return { text: res.choices[0]?.message?.content ?? "", provider };
  }

  const res = await getGeminiClient().models.generateContent({
    model: provider.model,
    contents: `${SYSTEM}\n\n---\n\n${prompt}`,
  });
  return { text: res.text ?? "", provider };
}
