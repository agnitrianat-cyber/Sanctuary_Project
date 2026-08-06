import { parseFeasibility } from "@/lib/feasibility";

// exceljs needs Node APIs, and the library is large — keeping the parse on the
// server also keeps it out of the browser bundle entirely.
export const runtime = "nodejs";

// Vercel rejects a serverless request body larger than this before the handler
// even runs, so it is checked here to give a clear reason instead.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Tidak ada file yang dikirim." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        {
          ok: false,
          error: `File ${(file.size / 1024 / 1024).toFixed(1)} MB melebihi batas ${MAX_BYTES / 1024 / 1024} MB.`,
        },
        { status: 413 },
      );
    }
    if (!/\.(xlsx|xlsm)$/i.test(file.name)) {
      return Response.json(
        { ok: false, error: "Format harus .xlsx atau .xlsm. File .xls lama perlu disimpan ulang." },
        { status: 400 },
      );
    }

    const result = await parseFeasibility(await file.arrayBuffer());
    return Response.json({ ...result, filename: file.name }, { status: result.ok ? 200 : 422 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: `Gagal membaca file: ${message}` }, { status: 500 });
  }
}
