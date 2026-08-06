"use client";

import { useEffect, useRef, useState } from "react";
import type { Drawing } from "@/lib/drawings";

// Renders one drawing as a layer. Images are drawn directly; PDFs are rendered
// to a canvas by pdf.js, since a browser cannot overlay a PDF element.
export default function DrawingLayer({ drawing, opacity }: { drawing: Drawing; opacity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const isPdf = drawing.contentType === "application/pdf";

  useEffect(() => {
    if (!isPdf) return;
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        // The worker ships with the package; resolving it through the bundler
        // keeps it self-hosted instead of relying on a CDN.
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const pdf = await pdfjs.getDocument({ url: drawing.url }).promise;
        const page = await pdf.getPage(1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
      } catch (err) {
        if (!cancelled) setFailed(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drawing.url, isPdf]);

  const common = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    opacity,
    pointerEvents: "none" as const,
  };

  if (failed) {
    return (
      <div style={{ ...common, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <span style={{ font: "12px var(--font-body)", color: "var(--color-accent-700)", textAlign: "center" }}>
          Gagal menampilkan {drawing.filename}
        </span>
      </div>
    );
  }

  if (isPdf) return <canvas ref={canvasRef} style={common} />;

  return <img src={drawing.url} alt={drawing.filename} style={common} />;
}
