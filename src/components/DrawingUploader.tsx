"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import { DISCIPLINES, DISCIPLINE_KEYS, type Discipline, type Drawing } from "@/lib/drawings";

type Props = {
  projectId: string;
  onAdded: (drawing: Drawing) => void;
  onError: (message: string) => void;
};

export default function DrawingUploader({ projectId, onAdded, onError }: Props) {
  const [discipline, setDiscipline] = useState<Discipline>("STR");
  const [level, setLevel] = useState("Lantai 1");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!level.trim()) {
      onError("Isi dulu lantai/zona-nya.");
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      // The file goes straight from the browser to Blob, so large drawings
      // never pass through a serverless function (PRD section 8).
      const blob = await upload(`gambar/${projectId}/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          discipline,
          level: level.trim(),
          filename: file.name,
          url: blob.url,
          contentType: file.type || "application/octet-stream",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan data gambar.");
      onAdded(data.drawing);
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
    height: 36,
    padding: "0 10px",
    border: "2px solid var(--color-divider)",
    background: "var(--color-bg)",
    font: "13px var(--font-body)",
    color: "var(--color-text)",
    boxSizing: "border-box" as const,
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="disiplin">Disiplin</label>
          <select
            id="disiplin"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value as Discipline)}
            style={fieldStyle}
            disabled={busy}
          >
            {DISCIPLINE_KEYS.map((k) => (
              <option key={k} value={k}>{k} – {DISCIPLINES[k].label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="lantai">Lantai / Zona</label>
          <input
            id="lantai"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Lantai 1"
            style={fieldStyle}
            disabled={busy}
          />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", width: "100%" }}
      />

      {busy && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 6, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-accent)", transition: "width .2s" }} />
          </div>
          <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 4 }}>
            Mengunggah… {progress}%
          </div>
        </div>
      )}

      <div style={{ font: "11px/1.5 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 10 }}>
        PDF, JPG, PNG bisa langsung ditumpuk. File DWG tetap tersimpan, tapi belum
        bisa ditampilkan — perlu diekspor ke PDF dulu dari AutoCAD.
      </div>
    </div>
  );
}
