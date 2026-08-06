"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Markdown from "./Markdown";
import { MOBILE_MAX_WIDTH } from "./MobileOverlay";
import type { Analysis, Finding } from "@/lib/feasibility-analysis";
import type { Metrics } from "@/lib/feasibility-metrics";
import type { ParsedCell, ParsedSheet } from "@/lib/feasibility";

type Levers = {
  alreadyMet: boolean;
  gap: number;
  within: number;
  tariffUplift?: number | null;
  volumeUplift?: number | null;
  capexCut?: number;
  costCutEnough?: boolean;
  costWithin?: number;
} | null;

type Result = {
  ok: boolean;
  error?: string;
  sheetNames?: string[];
  filename?: string;
  sheet?: ParsedSheet;
  metrics?: Metrics;
  analysis?: Analysis;
  levers?: Levers;
  targetYear?: number;
  narrative?: string | null;
  narrativeError?: string | null;
  provider?: { name: string; model: string; keyVar: string } | null;
};

const M = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : Math.abs(n) >= 1e9
      ? `${(n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`
      : n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
const P = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `${(n * 100).toFixed(2)}%`;

const label = {
  font: "700 11px var(--font-heading)",
  letterSpacing: ".04em",
  textTransform: "uppercase" as const,
  color: "var(--color-neutral-700)",
  marginBottom: 10,
};

const SEVERITY: Record<Finding["severity"], { bg: string; fg: string; text: string }> = {
  tinggi: { bg: "var(--color-accent-100)", fg: "var(--color-accent-800)", text: "Perlu diperbaiki" },
  sedang: { bg: "var(--color-neutral-100)", fg: "var(--color-text)", text: "Perlu dicek" },
  info: { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-700)", text: "Info" },
};

function columnLetter(col: number) {
  let s = "";
  let n = col;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export default function KelayakanClient() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [targetYear, setTargetYear] = useState(5);
  const [showSheet, setShowSheet] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFile = useRef<File | null>(null);

  async function run(file: File, year: number) {
    setBusy(true);
    setRes(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("targetYear", String(year));
      const r = await fetch("/api/kelayakan/analisa", { method: "POST", body });
      setRes(await r.json());
    } catch (err) {
      setRes({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const a = res?.analysis;
  const m = res?.metrics;
  const sheet = res?.sheet;
  const rows = sheet ? [...new Set(sheet.cells.map((c) => c.row))].sort((x, y) => x - y) : [];
  const byRef = new Map<string, ParsedCell>(sheet?.cells.map((c) => [c.ref, c]) ?? []);

  return (
    <div style={{ maxWidth: MOBILE_MAX_WIDTH, margin: "0 auto", minHeight: "100vh", background: "var(--color-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "2px solid var(--color-divider)", position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 5 }}>
        <Link href="/" style={{ font: "600 13px var(--font-heading)", color: "var(--color-text)", textDecoration: "none" }}>← Kembali</Link>
        <div style={{ font: "700 14px var(--font-heading)", color: "var(--color-text)", marginLeft: "auto" }}>Studi Kelayakan</div>
      </div>

      {/* Upload */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={label}>Upload File Excel</div>
        <div className="card" style={{ padding: 14 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xlsm"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { lastFile.current = f; run(f, targetYear); }
            }}
            style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", width: "100%" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <label htmlFor="target" style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)" }}>Target balik modal</label>
            <input
              id="target" type="number" min={1} max={30} value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              style={{ width: 60, height: 30, padding: "0 8px", border: "2px solid var(--color-divider)", background: "var(--color-bg)", font: "13px var(--font-body)", color: "var(--color-text)" }}
            />
            <span style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)" }}>tahun</span>
            {lastFile.current && !busy && (
              <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => run(lastFile.current!, targetYear)}>
                Hitung ulang
              </button>
            )}
          </div>
          <div style={{ font: "11px/1.5 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 10 }}>
            Yang dibaca hanya sheet <strong>Feasibility Study (FULL)</strong>. Semua angka dihitung
            oleh sistem; AI hanya menyusun narasinya.
          </div>
          {busy && <div style={{ font: "12px var(--font-body)", color: "var(--color-text)", marginTop: 10 }}>Membaca dan menganalisa…</div>}
        </div>
      </div>

      {res && !res.ok && (
        <div style={{ padding: "18px 16px 0" }}>
          <div className="card" style={{ padding: 16, borderColor: "var(--color-accent-300)" }}>
            <div style={{ font: "600 13px var(--font-heading)", color: "var(--color-accent-700)" }}>{res.error}</div>
            {res.sheetNames?.length ? (
              <div style={{ font: "12px/1.6 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 8 }}>
                Sheet di file ini:
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{res.sheetNames.map((n) => <li key={n}>{n}</li>)}</ul>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {a && m && (
        <>
          {/* Verdict */}
          <div style={{ padding: "18px 16px 0" }}>
            <div className="card" style={{ padding: 16, borderColor: a.verdict === "Layak" ? "var(--color-divider)" : "var(--color-accent-300)" }}>
              <div style={{ font: "700 11px var(--font-heading)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                Kesimpulan sistem
              </div>
              <div style={{ font: "700 26px var(--font-heading)", color: "var(--color-text)", marginTop: 6 }}>{a.verdict}</div>
              <div style={{ font: "13px/1.6 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 6 }}>{a.verdictReason}</div>
              <div style={{ font: "12px/1.6 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-divider)" }}>
                {m.project} · {m.entity} · {m.country} · {m.years} tahun · investasi {M(m.investment)}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ padding: "18px 16px 0" }}>
            <div style={label}>Angka Kunci</div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {[
                { l: "NPV (dihitung ulang)", v: M(a.npvCorrected), s: a.npvReported !== null ? `di file: ${M(a.npvReported)}` : "" },
                { l: "IRR", v: P(a.irrComputed), s: `hurdle ${P(m.discountRate)}` },
                { l: "Payback", v: a.paybackComputed !== null ? `${a.paybackComputed.toFixed(2)} th` : "—", s: `dari ${m.years} tahun` },
                { l: "Omzet boleh turun", v: P(a.revenueHeadroom), s: "sebelum NPV nol" },
                { l: "NPV tanpa terminal value", v: M(a.npvWithoutTerminal), s: `IRR ${P(a.irrWithoutTerminal)}` },
              ].map((c) => (
                <div key={c.l} className="card" style={{ flex: "0 0 160px", padding: 14, boxSizing: "border-box" }}>
                  <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", lineHeight: 1.3, minHeight: 28 }}>{c.l}</div>
                  <div style={{ font: "700 20px var(--font-heading)", color: "var(--color-text)", marginTop: 6 }}>{c.v}</div>
                  <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 4 }}>{c.s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Findings */}
          {a.findings.length > 0 && (
            <div style={{ padding: "18px 16px 0" }}>
              <div style={label}>Temuan Sistem ({a.findings.length})</div>
              <div style={{ display: "grid", gap: 10 }}>
                {a.findings.map((f, i) => {
                  const s = SEVERITY[f.severity];
                  return (
                    <div key={i} className="card" style={{ padding: 14 }}>
                      <span className="tag" style={{ background: s.bg, color: s.fg }}>{s.text}</span>
                      <div style={{ font: "600 13.5px var(--font-heading)", color: "var(--color-text)", marginTop: 8 }}>{f.title}</div>
                      <div style={{ font: "12.5px/1.65 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 5 }}>{f.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payback levers */}
          {res.levers && (
            <div style={{ padding: "18px 16px 0" }}>
              <div style={label}>Balik Modal di Tahun ke-{res.targetYear}</div>
              <div className="card" style={{ padding: 14 }}>
                {res.levers.alreadyMet ? (
                  <div style={{ font: "13px/1.6 var(--font-body)", color: "var(--color-text)" }}>
                    Sudah tercapai tanpa perubahan apa pun.
                  </div>
                ) : (
                  <>
                    <div style={{ font: "13px/1.6 var(--font-body)", color: "var(--color-text)" }}>
                      Kekurangan arus kas <strong>{M(res.levers.gap)}</strong>. Salah satu ini harus tercapai:
                    </div>
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {[
                        { l: "Naikkan tarif (biaya tetap)", v: `+${P(res.levers.tariffUplift)}` },
                        { l: "Naikkan volume (biaya ikut naik)", v: `+${P(res.levers.volumeUplift)}` },
                        { l: "Pangkas investasi", v: `−${P(res.levers.capexCut)}` },
                      ].map((x) => (
                        <div key={x.l} style={{ display: "flex", justifyContent: "space-between", gap: 10, font: "12.5px var(--font-body)", color: "var(--color-neutral-700)", borderBottom: "1px solid var(--color-divider)", paddingBottom: 6 }}>
                          <span>{x.l}</span>
                          <strong style={{ color: "var(--color-text)" }}>{x.v}</strong>
                        </div>
                      ))}
                    </div>
                    {res.levers.costCutEnough === false && (
                      <div style={{ font: "12px/1.6 var(--font-body)", color: "var(--color-accent-700)", marginTop: 10, padding: "8px 10px", background: "var(--color-accent-100)" }}>
                        Memangkas biaya operasi tidak akan cukup: total biaya sampai tahun ke-{res.targetYear} hanya {M(res.levers.costWithin)},
                        lebih kecil dari kekurangannya. Proyek ini berat di modal, bukan di biaya.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Discount ladder */}
          {a.discountLadder.length > 0 && (
            <div style={{ padding: "18px 16px 0" }}>
              <div style={label}>NPV di Berbagai Tingkat Diskonto</div>
              <div className="card" style={{ padding: "4px 14px" }}>
                {a.discountLadder.map((d) => (
                  <div key={d.rate} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-divider)", font: "13px var(--font-body)" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>{(d.rate * 100).toFixed(1)}%</span>
                    <strong style={{ color: d.npv >= 0 ? "var(--color-text)" : "var(--color-accent-700)" }}>{M(d.npv)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI narrative */}
          <div style={{ padding: "18px 16px 0" }}>
            <div style={label}>Analisis AI</div>
            <div className="card" style={{ padding: 16 }}>
              {res.narrative ? (
                <>
                  <Markdown text={res.narrative} />
                  <div style={{ font: "11px/1.6 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--color-divider)" }}>
                    Disusun oleh {res.provider?.name} ({res.provider?.model}) dari angka yang sudah dihitung sistem.
                    Narasi ini bantuan, bukan keputusan — angka di atas yang mengikat.
                  </div>
                </>
              ) : (
                <div style={{ font: "12.5px/1.65 var(--font-body)", color: "var(--color-accent-700)" }}>
                  Narasi AI gagal dibuat: {res.narrativeError}
                  <div style={{ color: "var(--color-neutral-700)", marginTop: 6 }}>
                    Angka dan temuan di atas tetap sahih — semuanya dihitung sistem, tidak bergantung pada AI.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw sheet */}
          {sheet && (
            <div style={{ padding: "18px 16px 30px" }}>
              <button
                onClick={() => setShowSheet((v) => !v)}
                style={{ ...label, background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: 10 }}
              >
                {showSheet ? "▾" : "▸"} Isi Sheet ({sheet.cells.length} sel)
              </button>
              {showSheet && (
                <div style={{ border: "2px solid var(--color-divider)", overflow: "auto", maxHeight: "70vh" }}>
                  <table style={{ borderCollapse: "collapse", font: "12px var(--font-body)", whiteSpace: "nowrap" }}>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r}>
                          <td style={{ position: "sticky", left: 0, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", padding: "4px 8px", font: "700 11px var(--font-heading)", color: "var(--color-neutral-700)", textAlign: "right" }}>{r}</td>
                          {Array.from({ length: sheet.colCount }, (_, i) => {
                            const cell = byRef.get(`${columnLetter(i + 1)}${r}`);
                            return (
                              <td key={i} title={cell?.formula ? `${cell.ref}  =${cell.formula}` : cell?.ref}
                                style={{ border: "1px solid var(--color-divider)", padding: "4px 8px", textAlign: cell?.kind === "number" ? "right" : "left", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", background: cell?.formula ? "var(--color-accent-100)" : undefined }}>
                                {cell?.value === null || cell?.value === undefined ? "" : typeof cell.value === "number" ? cell.value.toLocaleString("id-ID", { maximumFractionDigits: 2 }) : String(cell.value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
