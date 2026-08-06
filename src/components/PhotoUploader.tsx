"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import { PHOTO_CATEGORIES, type FieldPhoto, type PhotoCategory } from "@/lib/supervision";

type Props = {
  projectId: string;
  onAdded: (photo: FieldPhoto) => void;
  onError: (message: string) => void;
};

// Blob paths are URLs, and phone cameras produce names like "IMG_0021 (1).HEIC".
function safePath(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
  const clean = base.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${clean || "foto"}.${ext}`;
}

export default function PhotoUploader({ projectId, onAdded, onError }: Props) {
  const [category, setCategory] = useState<PhotoCategory>("Progres");
  const [location, setLocation] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setProgress(0);
    try {
      const path = `foto/${projectId}/${Date.now()}-${safePath(file.name)}`;
      const options = { access: "public" as const, handleUploadUrl: "/api/upload" };

      let blob;
      try {
        blob = await upload(path, file, {
          ...options,
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
      } catch {
        // Progress reporting streams the request body, which Chrome only allows
        // over HTTP/2 or QUIC — the same fallback the drawing uploader needs.
        setProgress(null);
        blob = await upload(path, file, options);
      }

      const res = await fetch("/api/supervisi/foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          category,
          location: location.trim(),
          url: blob.url,
          caption: caption.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan foto.");
      onAdded(data.photo);
      setCaption("");
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const labelStyle = {
    font: "700 10px var(--font-heading)",
    letterSpacing: ".04em",
    textTransform: "uppercase" as const,
    color: "var(--color-neutral-700)",
    display: "block",
    marginBottom: 5,
  };
  const fieldStyle = {
    width: "100%",
    height: 40,
    padding: "0 10px",
    border: "2px solid var(--color-divider)",
    background: "var(--color-bg)",
    font: "13px var(--font-body)",
    color: "var(--color-text)",
    boxSizing: "border-box" as const,
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="kategori-foto">Kategori</label>
          <select
            id="kategori-foto"
            value={category}
            onChange={(e) => setCategory(e.target.value as PhotoCategory)}
            style={fieldStyle}
            disabled={busy}
          >
            {PHOTO_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="lokasi-foto">Lokasi</label>
          <input
            id="lokasi-foto"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Blok C – Lt.2"
            style={fieldStyle}
            disabled={busy}
          />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <label style={labelStyle} htmlFor="ket-foto">Keterangan</label>
        <input
          id="ket-foto"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Contoh: pengecoran kolom K3"
          style={fieldStyle}
          disabled={busy}
        />
      </div>

      {/* capture lets a phone open the camera straight away. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", width: "100%", marginTop: 12 }}
      />

      {busy && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 6, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", overflow: "hidden" }}>
            <div
              className={progress === null ? "indeterminate" : undefined}
              style={{
                height: "100%",
                width: progress === null ? "40%" : `${progress}%`,
                background: "var(--color-accent)",
                transition: progress === null ? undefined : "width .2s",
              }}
            />
          </div>
          <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 4 }}>
            {progress === null ? "Mengunggah… (tanpa indikator di jaringan ini)" : `Mengunggah… ${progress}%`}
          </div>
        </div>
      )}

      <div style={{ font: "11px/1.5 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 10 }}>
        Foto otomatis dicap waktu saat tersimpan.
      </div>
    </div>
  );
}
