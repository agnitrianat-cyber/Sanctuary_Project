import { del } from "@vercel/blob";
import { requireBlobToken } from "@/lib/blob";
import { deleteDrawing } from "@/lib/drawings";

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      return Response.json({ error: "Id tidak valid." }, { status: 400 });
    }

    const url = new URL(request.url).searchParams.get("url");
    // Remove the stored file too, so deleting a layer does not leave the Blob
    // store filling up with orphans.
    if (url) {
      try {
        await del(url, { token: requireBlobToken() });
      } catch {
        // The row still needs to go even if the blob is already gone.
      }
    }

    await deleteDrawing(numericId);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
