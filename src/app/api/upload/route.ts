import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireBlobToken } from "@/lib/blob";

// Generates client tokens so browsers can upload files (site photos, drawings)
// directly to Vercel Blob without routing the file bytes through this function.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // Passed explicitly: the SDK only auto-reads BLOB_READ_WRITE_TOKEN.
      token: requireBlobToken(),
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
          // DWG/DXF have no registered MIME type; browsers send one of these.
          "application/octet-stream",
          "application/acad",
          "image/vnd.dwg",
        ],
        maximumSizeInBytes: 100 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
