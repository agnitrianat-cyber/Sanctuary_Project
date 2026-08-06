import { isFindingStatus, setFindingStatus } from "@/lib/supervision";

// Moves a finding along its lifecycle (Terbuka → Perbaikan → Verifikasi → Selesai).
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      return Response.json({ error: "Id tidak valid." }, { status: 400 });
    }

    const { status } = (await request.json()) ?? {};
    if (!isFindingStatus(status)) {
      return Response.json({ error: `Status tidak dikenal: ${status}` }, { status: 400 });
    }

    const finding = await setFindingStatus(numericId, status);
    if (!finding) {
      return Response.json({ error: "Temuan tidak ditemukan." }, { status: 404 });
    }

    return Response.json({ ok: true, finding });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
