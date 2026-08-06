"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MOBILE_MAX_WIDTH } from "./MobileOverlay";
import PhotoUploader from "./PhotoUploader";
import type { Project } from "@/lib/dashboard-data";
import {
  FINDING_STATUSES,
  PHOTO_CATEGORIES,
  STATUS_STYLES,
  nextStatus,
  weightedProgress,
  type DailyReport,
  type FieldPhoto,
  type Finding,
  type FindingStatus,
  type PhotoCategory,
  type ProgressItem,
} from "@/lib/supervision";

type Props = {
  projects: Project[];
  reports: DailyReport[];
  progress: ProgressItem[];
  findings: Finding[];
  photos: FieldPhoto[];
};

const TABS = ["Laporan", "Progres", "Temuan", "Foto"] as const;
type Tab = (typeof TABS)[number];

const sectionLabel = {
  font: "700 11px var(--font-heading)",
  letterSpacing: ".04em",
  textTransform: "uppercase" as const,
  color: "var(--color-neutral-700)",
  marginBottom: 10,
};

const fieldLabel = {
  font: "700 10px var(--font-heading)",
  letterSpacing: ".04em",
  textTransform: "uppercase" as const,
  color: "var(--color-neutral-700)",
  display: "block",
  marginBottom: 5,
};

// 44px keeps every control inside the thumb-friendly target size the PRD asks
// for — this is the one screen used standing on site.
const field = {
  width: "100%",
  height: 44,
  padding: "0 10px",
  border: "2px solid var(--color-divider)",
  background: "var(--color-bg)",
  font: "13px var(--font-body)",
  color: "var(--color-text)",
  boxSizing: "border-box" as const,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso.length > 10 ? iso : iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

function daysLate(dueDate: string) {
  if (!dueDate) return 0;
  const due = new Date(dueDate + "T00:00:00").getTime();
  if (Number.isNaN(due)) return 0;
  const now = new Date(today() + "T00:00:00").getTime();
  return Math.round((now - due) / 86400000);
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="card"
      style={{ padding: 22, alignItems: "center", textAlign: "center", border: "2px dashed var(--color-divider)", background: "transparent" }}
    >
      <div style={{ font: "13px/1.5 var(--font-body)", color: "var(--color-neutral-700)" }}>{text}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: FindingStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className="tag" style={{ background: s.bg, color: s.fg, font: "600 11px var(--font-body)" }}>
      {status}
    </span>
  );
}

export default function SupervisiClient({ projects, reports, progress, findings, photos }: Props) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Laporan");
  const [allReports, setAllReports] = useState(reports);
  const [allFindings, setAllFindings] = useState(findings);
  const [allPhotos, setAllPhotos] = useState(photos);
  const [toast, setToast] = useState<string | null>(null);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  const project = projects.find((p) => p.id === projectId) ?? null;

  const byProject = useMemo(() => {
    return {
      reports: allReports.filter((r) => r.projectId === projectId),
      progress: progress.filter((p) => p.projectId === projectId),
      findings: allFindings.filter((f) => f.projectId === projectId),
      photos: allPhotos.filter((p) => p.projectId === projectId),
    };
  }, [allReports, progress, allFindings, allPhotos, projectId]);

  return (
    <div style={{ maxWidth: MOBILE_MAX_WIDTH, margin: "0 auto", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "2px solid var(--color-divider)", position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 5 }}>
        {project ? (
          <button
            onClick={() => setProjectId(null)}
            style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", font: "600 13px var(--font-heading)", color: "var(--color-text)" }}
          >
            ← Daftar proyek
          </button>
        ) : (
          <Link href="/" style={{ font: "600 13px var(--font-heading)", color: "var(--color-text)", textDecoration: "none" }}>
            ← Kembali
          </Link>
        )}
        <div style={{ font: "700 14px var(--font-heading)", color: "var(--color-text)", marginLeft: "auto" }}>
          Supervisi Lapangan
        </div>
      </div>

      {!project ? (
        <ProjectList
          projects={projects}
          progress={progress}
          findings={allFindings}
          onOpen={(id) => { setProjectId(id); setTab("Laporan"); }}
        />
      ) : (
        <>
          <div style={{ padding: "16px 16px 10px" }}>
            <div style={{ font: "700 18px/1.25 var(--font-heading)", color: "var(--color-text)" }}>{project.name}</div>
            <div style={{ font: "12.5px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 3 }}>{project.location}</div>
          </div>

          {/* Tabs */}
          <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 16px", borderBottom: "2px solid var(--color-divider)", position: "sticky", top: 58, background: "var(--color-bg)", zIndex: 4 }}>
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: "1 0 auto",
                    minHeight: 44,
                    padding: "0 14px",
                    border: "none",
                    background: "transparent",
                    borderBottom: active ? "3px solid var(--color-accent)" : "3px solid transparent",
                    color: active ? "var(--color-accent-700)" : "var(--color-neutral-700)",
                    font: "700 13px var(--font-heading)",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {tab === "Laporan" && (
            <ReportsTab
              projectId={project.id}
              reports={byProject.reports}
              onAdded={(r) => setAllReports((prev) => [r, ...prev])}
              notify={notify}
            />
          )}
          {tab === "Progres" && <ProgressTab items={byProject.progress} />}
          {tab === "Temuan" && (
            <FindingsTab
              findings={byProject.findings}
              onChanged={(f) => setAllFindings((prev) => prev.map((x) => (x.id === f.id ? f : x)))}
              notify={notify}
            />
          )}
          {tab === "Foto" && (
            <PhotosTab
              projectId={project.id}
              photos={byProject.photos}
              onAdded={(p) => setAllPhotos((prev) => [p, ...prev])}
              notify={notify}
            />
          )}
        </>
      )}

      {toast && (
        <div
          className="fadein"
          style={{ position: "fixed", left: 16, right: 16, bottom: 26, maxWidth: MOBILE_MAX_WIDTH - 32, margin: "0 auto", background: "var(--color-text)", color: "var(--color-bg)", padding: "12px 16px", font: "600 13px var(--font-body)", boxShadow: "var(--shadow-md)", zIndex: 20 }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* — Daftar proyek — */

function ProjectList({
  projects, progress, findings, onOpen,
}: {
  projects: Project[];
  progress: ProgressItem[];
  findings: Finding[];
  onOpen: (id: string) => void;
}) {
  return (
    <div style={{ padding: "18px 16px 28px" }}>
      <div style={sectionLabel}>Pilih Proyek</div>
      <div style={{ display: "grid", gap: 12 }}>
        {projects.map((p) => {
          const items = progress.filter((i) => i.projectId === p.id);
          const actual = weightedProgress(items, "actualPct");
          const planned = weightedProgress(items, "plannedPct");
          const open = findings.filter((f) => f.projectId === p.id && f.status !== "Selesai").length;
          const behind = actual < planned;
          return (
            <div key={p.id} className="card" style={{ padding: 16, gap: 12 }}>
              <div>
                <div style={{ font: "700 15px var(--font-heading)", color: "var(--color-text)" }}>{p.name}</div>
                <div style={{ font: "12.5px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 3 }}>{p.location}</div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", font: "12px var(--font-body)", color: "var(--color-neutral-700)", marginBottom: 5 }}>
                  <span>Realisasi {actual.toFixed(0)}%</span>
                  <span>Rencana {planned.toFixed(0)}%</span>
                </div>
                <div style={{ height: 8, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", position: "relative" }}>
                  <div style={{ height: "100%", width: `${Math.min(actual, 100)}%`, background: behind ? "var(--color-accent)" : "#16a34a" }} />
                  <div style={{ position: "absolute", top: -3, bottom: -3, left: `${Math.min(planned, 100)}%`, width: 2, background: "var(--color-text)" }} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="tag" style={{ background: open > 0 ? "#fee2e2" : "#dcfce7", color: open > 0 ? "#991b1b" : "#166534", font: "600 11px var(--font-body)" }}>
                  {open} temuan terbuka
                </span>
              </div>

              <button className="btn btn-primary" style={{ minHeight: 44, justifyContent: "center" }} onClick={() => onOpen(p.id)}>
                Buka Supervisi
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* — Tab Laporan — */

function ReportsTab({
  projectId, reports, onAdded, notify,
}: {
  projectId: string;
  reports: DailyReport[];
  onAdded: (r: DailyReport) => void;
  notify: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarising, setSummarising] = useState(false);
  const [form, setForm] = useState({
    reportDate: today(),
    weather: "Cerah",
    workers: "",
    materials: "",
    equipment: "",
    notes: "",
    author: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/supervisi/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId, workers: Number(form.workers || 0) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan laporan.");
      onAdded(data.report);
      // The typed input is only cleared once it is safely stored.
      setForm({ reportDate: today(), weather: "Cerah", workers: "", materials: "", equipment: "", notes: "", author: form.author });
      setOpen(false);
      notify("Laporan harian tersimpan.");
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function makeSummary() {
    setSummarising(true);
    try {
      const res = await fetch("/api/supervisi/rangkuman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat ringkasan.");
      setSummary(data.summary);
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err));
    } finally {
      setSummarising(false);
    }
  }

  return (
    <div style={{ padding: "16px 16px 28px", display: "grid", gap: 14 }}>
      {!open && (
        <button className="btn btn-primary" style={{ minHeight: 46, justifyContent: "center" }} onClick={() => setOpen(true)}>
          + Tulis Laporan Harian
        </button>
      )}

      {open && (
        <div className="card fadein" style={{ padding: 14, gap: 12 }}>
          <div style={sectionLabel}>Laporan Harian</div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel} htmlFor="tanggal">Tanggal</label>
              <input id="tanggal" type="date" value={form.reportDate} onChange={(e) => set("reportDate", e.target.value)} style={field} disabled={saving} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel} htmlFor="cuaca">Cuaca</label>
              <select id="cuaca" value={form.weather} onChange={(e) => set("weather", e.target.value)} style={field} disabled={saving}>
                <option>Cerah</option>
                <option>Berawan</option>
                <option>Hujan ringan</option>
                <option>Hujan deras</option>
              </select>
            </div>
          </div>

          <div>
            <label style={fieldLabel} htmlFor="tenaga">Jumlah tenaga kerja</label>
            <input id="tenaga" type="number" inputMode="numeric" min={0} value={form.workers} onChange={(e) => set("workers", e.target.value)} placeholder="mis. 24" style={field} disabled={saving} />
          </div>

          <div>
            <label style={fieldLabel} htmlFor="material">Material masuk</label>
            <input id="material" value={form.materials} onChange={(e) => set("materials", e.target.value)} placeholder="Besi D13 2 ton, semen 120 sak" style={field} disabled={saving} />
          </div>

          <div>
            <label style={fieldLabel} htmlFor="alat">Alat</label>
            <input id="alat" value={form.equipment} onChange={(e) => set("equipment", e.target.value)} placeholder="Molen 1, vibrator 2" style={field} disabled={saving} />
          </div>

          <div>
            <label style={fieldLabel} htmlFor="catatan">Catatan / kendala &amp; progres pekerjaan</label>
            <textarea
              id="catatan"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              placeholder="Pengecoran kolom lantai 2 Blok C selesai 80%."
              style={{ ...field, height: "auto", padding: 10, resize: "vertical", font: "13px/1.5 var(--font-body)" }}
              disabled={saving}
            />
          </div>

          <div>
            <label style={fieldLabel} htmlFor="pelapor">Pelapor</label>
            <input id="pelapor" value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Pengawas Rudi" style={field} disabled={saving} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setOpen(false)}
              disabled={saving}
              className="btn"
              style={{ flex: "0 0 auto", minHeight: 46, border: "2px solid var(--color-divider)" }}
            >
              Batal
            </button>
            <button className="btn btn-primary" style={{ flex: 1, minHeight: 46, justifyContent: "center" }} onClick={save} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan Laporan"}
            </button>
          </div>
        </div>
      )}

      <div>
        <div style={sectionLabel}>Riwayat Laporan</div>
        {reports.length === 0 ? (
          <EmptyState text="Belum ada laporan harian untuk proyek ini. Mulai dari tombol di atas." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {reports.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14, gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ font: "700 14px var(--font-heading)", color: "var(--color-text)" }}>{formatDate(r.reportDate)}</div>
                  <span className="tag tag-accent">{r.weather || "-"}</span>
                </div>
                <div style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)" }}>
                  {r.workers} tenaga kerja · {r.author || "Pengawas"}
                </div>
                {r.notes && (
                  <div style={{ font: "13px/1.5 var(--font-body)", color: "var(--color-text)", marginTop: 2 }}>{r.notes}</div>
                )}
                {(r.materials || r.equipment) && (
                  <div style={{ font: "12px/1.5 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 2 }}>
                    {r.materials && <div>Material: {r.materials}</div>}
                    {r.equipment && <div>Alat: {r.equipment}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={sectionLabel}>Rangkuman AI</div>
        <div className="card" style={{ padding: 14, gap: 10 }}>
          <div style={{ font: "12.5px/1.5 var(--font-body)", color: "var(--color-neutral-700)" }}>
            Menyusun ringkasan mingguan dari laporan &amp; temuan proyek ini. Hasilnya draf —
            periksa dan edit sebelum dikirim ke manajemen.
          </div>
          <button
            className="btn"
            style={{ minHeight: 44, justifyContent: "center", border: "2px solid var(--color-text)" }}
            onClick={makeSummary}
            disabled={summarising}
          >
            {summarising ? "Menyusun…" : "Buat Ringkasan Mingguan"}
          </button>
          {summary !== null && (
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={10}
              style={{ ...field, height: "auto", padding: 10, resize: "vertical", font: "13px/1.6 var(--font-body)" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* — Tab Progres — */

function ProgressTab({ items }: { items: ProgressItem[] }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "16px 16px 28px" }}>
        <EmptyState text="Belum ada bobot pekerjaan untuk proyek ini." />
      </div>
    );
  }

  const actual = weightedProgress(items, "actualPct");
  const planned = weightedProgress(items, "plannedPct");
  const deviation = actual - planned;
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);

  return (
    <div style={{ padding: "16px 16px 28px", display: "grid", gap: 14 }}>
      <div className="card" style={{ padding: 16, gap: 10 }}>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)" }}>Realisasi</div>
            <div style={{ font: "700 26px var(--font-heading)", color: "var(--color-text)" }}>{actual.toFixed(1)}%</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)" }}>Rencana</div>
            <div style={{ font: "700 26px var(--font-heading)", color: "var(--color-text)" }}>{planned.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ font: "600 13px var(--font-body)", color: deviation < 0 ? "var(--color-accent-700)" : "#166534" }}>
          {deviation < 0 ? "▼" : "▲"} Deviasi {Math.abs(deviation).toFixed(1)}% {deviation < 0 ? "di bawah rencana" : "di atas rencana"}
        </div>
        <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)" }}>
          Total bobot pekerjaan {totalWeight.toFixed(0)}%
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Bobot Pekerjaan</div>
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((i) => {
            const dev = i.actualPct - i.plannedPct;
            const behind = dev < 0;
            return (
              <div key={i.id} className="card" style={{ padding: 14, gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ font: "600 13.5px var(--font-heading)", color: "var(--color-text)" }}>{i.workItem}</div>
                  <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", flexShrink: 0 }}>bobot {i.weight}%</div>
                </div>

                {/* Realisation bar with the plan marked as a tick, so a lagging
                    item reads at a glance without a chart library. */}
                <div style={{ height: 10, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", position: "relative" }}>
                  <div style={{ height: "100%", width: `${Math.min(i.actualPct, 100)}%`, background: behind ? "var(--color-accent)" : "#16a34a" }} />
                  <div style={{ position: "absolute", top: -3, bottom: -3, left: `${Math.min(i.plannedPct, 100)}%`, width: 2, background: "var(--color-text)" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", font: "12px var(--font-body)" }}>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Realisasi {i.actualPct}% · Rencana {i.plannedPct}%
                  </span>
                  <span style={{ color: behind ? "var(--color-accent-700)" : "#166534", fontWeight: 600 }}>
                    {dev >= 0 ? "+" : ""}{dev.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* — Tab Temuan — */

function FindingsTab({
  findings, onChanged, notify,
}: {
  findings: Finding[];
  onChanged: (f: Finding) => void;
  notify: (m: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<FindingStatus | "Semua">("Semua");
  const [busyId, setBusyId] = useState<number | null>(null);

  const shown = findings.filter((f) => statusFilter === "Semua" || f.status === statusFilter);

  async function advance(f: Finding) {
    const next = nextStatus(f.status);
    if (!next) return;
    setBusyId(f.id);
    try {
      const res = await fetch(`/api/supervisi/temuan/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengubah status.");
      onChanged(data.finding);
      notify(`Temuan dipindah ke ${next}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ padding: "16px 16px 28px", display: "grid", gap: 14 }}>
      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {(["Semua", ...FINDING_STATUSES] as const).map((s) => {
          const active = s === statusFilter;
          const count = s === "Semua" ? findings.length : findings.filter((f) => f.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                flexShrink: 0,
                minHeight: 38,
                padding: "0 12px",
                border: active ? "2px solid var(--color-text)" : "2px solid var(--color-divider)",
                background: active ? "var(--color-text)" : "transparent",
                color: active ? "var(--color-bg)" : "var(--color-text)",
                font: "600 12px var(--font-heading)",
                cursor: "pointer",
              }}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState text={findings.length === 0 ? "Belum ada temuan untuk proyek ini." : "Tidak ada temuan pada filter ini."} />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {shown.map((f) => {
            const late = f.status !== "Selesai" ? daysLate(f.dueDate) : 0;
            const next = nextStatus(f.status);
            return (
              <div key={f.id} className="card" style={{ padding: 14, gap: 8, borderLeft: `4px solid ${STATUS_STYLES[f.status].fg}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <StatusBadge status={f.status} />
                  <span className="tag" style={{ background: "var(--color-neutral-100)", color: "var(--color-neutral-700)", font: "600 11px var(--font-body)" }}>
                    Prioritas {f.priority}
                  </span>
                  {late > 0 && (
                    <span style={{ font: "12px var(--font-body)", color: "var(--color-accent-700)" }}>
                      Lewat tenggat {late} hari
                    </span>
                  )}
                </div>

                <div style={{ font: "600 14px var(--font-heading)", color: "var(--color-text)" }}>{f.title}</div>
                <div style={{ font: "12px/1.5 var(--font-body)", color: "var(--color-neutral-700)" }}>
                  {[f.location, f.discipline].filter(Boolean).join(" · ")}
                  <br />
                  PIC {f.pic || "-"} · tenggat {formatDate(f.dueDate)}
                </div>

                {next && (
                  <button
                    className="btn"
                    style={{ minHeight: 42, justifyContent: "center", border: "2px solid var(--color-text)" }}
                    onClick={() => advance(f)}
                    disabled={busyId === f.id}
                  >
                    {busyId === f.id ? "Menyimpan…" : `Tandai ${next}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* — Tab Foto — */

function PhotosTab({
  projectId, photos, onAdded, notify,
}: {
  projectId: string;
  photos: FieldPhoto[];
  onAdded: (p: FieldPhoto) => void;
  notify: (m: string) => void;
}) {
  const [filter, setFilter] = useState<PhotoCategory | "Semua">("Semua");
  const shown = photos.filter((p) => filter === "Semua" || p.category === filter);

  return (
    <div style={{ padding: "16px 16px 28px", display: "grid", gap: 14 }}>
      <PhotoUploader projectId={projectId} onAdded={(p) => { onAdded(p); notify("Foto tersimpan."); }} onError={notify} />

      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {(["Semua", ...PHOTO_CATEGORIES] as const).map((c) => {
          const active = c === filter;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                flexShrink: 0,
                minHeight: 38,
                padding: "0 12px",
                border: active ? "2px solid var(--color-text)" : "2px solid var(--color-divider)",
                background: active ? "var(--color-text)" : "transparent",
                color: active ? "var(--color-bg)" : "var(--color-text)",
                font: "600 12px var(--font-heading)",
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState text={photos.length === 0 ? "Belum ada foto lapangan. Ambil foto lewat tombol di atas." : "Tidak ada foto pada kategori ini."} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {shown.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none", color: "inherit", border: "2px solid var(--color-divider)", background: "var(--color-surface)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || `Foto ${p.category}`}
                style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "8px 9px" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="tag tag-accent" style={{ font: "600 10px var(--font-body)" }}>{p.category}</span>
                </div>
                <div style={{ font: "11.5px/1.4 var(--font-body)", color: "var(--color-text)", marginTop: 5 }}>
                  {p.caption || "(tanpa keterangan)"}
                </div>
                <div style={{ font: "10.5px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 3 }}>
                  {p.location || "-"} · {formatDateTime(p.takenAt)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
