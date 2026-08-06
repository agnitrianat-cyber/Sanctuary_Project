import { addFieldPhoto, isPhotoCategory } from "@/lib/supervision";

// Records a site photo after the browser has uploaded it straight to Blob.
// Only the address and metadata reach the database (PRD section 7); the
// timestamp is set by the database so the stamp cannot be back-dated.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, category, location, url, caption } = body ?? {};

    if (!projectId || !url) {
      return Response.json({ error: "Proyek dan file foto wajib ada." }, { status: 400 });
    }
    if (!isPhotoCategory(category)) {
      return Response.json({ error: `Kategori tidak dikenal: ${category}` }, { status: 400 });
    }

    const photo = await addFieldPhoto({
      projectId: String(projectId),
      category,
      location: String(location ?? "").trim(),
      url: String(url),
      caption: String(caption ?? "").trim(),
    });

    return Response.json({ ok: true, photo });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
