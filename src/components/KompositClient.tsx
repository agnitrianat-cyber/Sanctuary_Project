"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DrawingLayer from "./DrawingLayer";
import DrawingUploader from "./DrawingUploader";
import { MOBILE_MAX_WIDTH } from "./MobileOverlay";
import { DISCIPLINES, type Drawing } from "@/lib/drawings";
import type { Project } from "@/lib/dashboard-data";

type Props = { projects: Project[]; initialDrawings: Drawing[] };

export default function KompositClient({ projects, initialDrawings }: Props) {
  const [projectId, setProjectId] = useState(projects[0].id);
  const [drawings, setDrawings] = useState(initialDrawings);
  const [hidden, setHidden] = useState<Record<number, boolean>>({});
  const [opacity, setOpacity] = useState<Record<number, number>>({});
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  const forProject = useMemo(
    () => drawings.filter((d) => d.projectId === projectId),
    [drawings, projectId],
  );

  // Only drawings on the same floor/zone may be stacked (PRD section 5.5).
  const levels = useMemo(
    () => [...new Set(forProject.map((d) => d.level))].sort(),
    [forProject],
  );
  const level = activeLevel && levels.includes(activeLevel) ? activeLevel : levels[0];
  const onLevel = forProject.filter((d) => d.level === level);
  const renderable = onLevel.filter((d) => d.status === "siap" && !hidden[d.id]);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  async function remove(d: Drawing) {
    if (!confirm(`Hapus ${d.filename}?`)) return;
    const res = await fetch(`/api/drawings/${d.id}?url=${encodeURIComponent(d.url)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDrawings((prev) => prev.filter((x) => x.id !== d.id));
      notify("Gambar dihapus.");
    } else {
      notify("Gagal menghapus gambar.");
    }
  }

  const sectionLabel = {
    font: "700 11px var(--font-heading)",
    letterSpacing: ".04em",
    textTransform: "uppercase" as const,
    color: "var(--color-neutral-700)",
    marginBottom: 10,
  };

  return (
    <div style={{ maxWidth: MOBILE_MAX_WIDTH, margin: "0 auto", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "2px solid var(--color-divider)", position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 5 }}>
        <Link href="/" style={{ font: "600 13px var(--font-heading)", color: "var(--color-text)", textDecoration: "none" }}>
          ← Kembali
        </Link>
        <div style={{ font: "700 14px var(--font-heading)", color: "var(--color-text)", marginLeft: "auto" }}>
          Komposit Gambar
        </div>
      </div>

      <div style={{ padding: "16px 16px 8px" }}>
        <label style={{ ...sectionLabel, display: "block" }} htmlFor="proyek">Proyek</label>
        <select
          id="proyek"
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value); setActiveLevel(null); }}
          style={{ width: "100%", height: 38, padding: "0 10px", border: "2px solid var(--color-divider)", background: "var(--color-bg)", font: "13px var(--font-body)", color: "var(--color-text)", boxSizing: "border-box" }}
        >
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div style={{ padding: "10px 16px 0" }}>
        <div style={sectionLabel}>Upload Gambar</div>
        <DrawingUploader
          projectId={projectId}
          onAdded={(d) => { setDrawings((prev) => [...prev, d]); setActiveLevel(d.level); notify(`${d.filename} tersimpan.`); }}
          onError={notify}
        />
      </div>

      {levels.length > 1 && (
        <div style={{ padding: "18px 16px 0" }}>
          <div style={sectionLabel}>Lantai / Zona</div>
          <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setActiveLevel(l)}
                style={{ flexShrink: 0, padding: "7px 12px", border: `2px solid ${l === level ? "var(--color-accent)" : "var(--color-divider)"}`, background: l === level ? "var(--color-accent-100)" : "var(--color-bg)", font: "600 12px var(--font-heading)", color: l === level ? "var(--color-accent-800)" : "var(--color-text)", cursor: "pointer" }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Viewer */}
      <div style={{ padding: "18px 16px 0" }}>
        <div style={sectionLabel}>Komposit</div>
        {renderable.length === 0 ? (
          <div className="card" style={{ padding: 22, textAlign: "center" }}>
            <div style={{ font: "13px/1.6 var(--font-body)", color: "var(--color-neutral-700)" }}>
              {onLevel.length === 0
                ? "Upload minimal 2 disiplin pada lantai yang sama untuk mulai menumpuk gambar."
                : "Belum ada lapisan yang bisa ditampilkan. Aktifkan lapisan di bawah, atau ekspor DWG ke PDF dulu."}
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "var(--color-neutral-100)", border: "2px solid var(--color-divider)", overflow: "auto" }}>
              <div style={{ position: "relative", width: `${zoom * 100}%`, height: `${zoom * 100}%`, minWidth: "100%", minHeight: "100%" }}>
                {renderable.map((d) => (
                  <DrawingLayer key={d.id} drawing={d} opacity={opacity[d.id] ?? 1} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <span style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)" }}>Zoom</span>
              <input type="range" min={1} max={4} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", minWidth: 34 }}>{zoom.toFixed(1)}×</span>
            </div>
          </>
        )}
      </div>

      {/* Layer panel */}
      <div style={{ padding: "22px 16px 30px" }}>
        <div style={sectionLabel}>Lapisan {level ? `– ${level}` : ""}</div>
        {onLevel.length === 0 ? (
          <div className="card" style={{ padding: 16, font: "12.5px var(--font-body)", color: "var(--color-neutral-700)" }}>
            Belum ada gambar untuk proyek ini.
          </div>
        ) : (
          <div className="card" style={{ padding: "4px 14px" }}>
            {onLevel.map((d) => {
              const meta = DISCIPLINES[d.discipline];
              const needsConvert = d.status === "perlu-konversi";
              return (
                <div key={d.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 12, height: 12, background: meta.color, flexShrink: 0 }} />
                    <span style={{ font: "600 12px var(--font-heading)", color: "var(--color-text)" }}>{d.discipline}</span>
                    <span style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {d.filename}
                    </span>
                    <button onClick={() => remove(d)} aria-label={`Hapus ${d.filename}`} style={{ border: "none", background: "transparent", color: "var(--color-accent-700)", font: "600 11px var(--font-body)", cursor: "pointer", padding: 4 }}>
                      Hapus
                    </button>
                  </div>

                  {needsConvert ? (
                    <div style={{ font: "11px/1.5 var(--font-body)", color: "var(--color-accent-700)", marginTop: 6 }}>
                      Tersimpan, tapi belum bisa ditampilkan — ekspor ke PDF dulu dari AutoCAD.
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <label style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", display: "flex", alignItems: "center", gap: 5 }}>
                        <input type="checkbox" checked={!hidden[d.id]} onChange={(e) => setHidden((p) => ({ ...p, [d.id]: !e.target.checked }))} />
                        Tampil
                      </label>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={opacity[d.id] ?? 1}
                        onChange={(e) => setOpacity((p) => ({ ...p, [d.id]: Number(e.target.value) }))}
                        style={{ flex: 1 }}
                        aria-label={`Transparansi ${d.filename}`}
                      />
                      <span style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", minWidth: 32 }}>
                        {Math.round((opacity[d.id] ?? 1) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: 24, maxWidth: MOBILE_MAX_WIDTH - 32, margin: "0 auto", background: "var(--color-text)", color: "var(--color-bg)", padding: "12px 16px", font: "600 13px var(--font-body)", boxShadow: "var(--shadow-md)", zIndex: 30 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
