import { addDrawing, isDiscipline, statusForType } from "@/lib/drawings";

// Records a drawing after the browser has uploaded the file straight to Blob.
// Only the address and metadata reach the database (PRD section 7).
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, discipline, level, filename, url, contentType } = body ?? {};

    if (!projectId || !discipline || !level || !filename || !url) {
      return Response.json({ error: "Data gambar tidak lengkap." }, { status: 400 });
    }
    if (!isDiscipline(discipline)) {
      return Response.json({ error: `Disiplin tidak dikenal: ${discipline}` }, { status: 400 });
    }

    const type = typeof contentType === "string" ? contentType : "application/octet-stream";
    const drawing = await addDrawing({
      projectId,
      discipline,
      level: String(level).trim(),
      filename,
      url,
      contentType: type,
      status: statusForType(type, filename),
    });

    return Response.json({ ok: true, drawing });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
