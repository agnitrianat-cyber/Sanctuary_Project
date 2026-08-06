"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MOBILE_MAX_WIDTH } from "./MobileOverlay";
import type { ParsedCell, ParsedSheet } from "@/lib/feasibility";

type Response = {
  ok: boolean;
  error?: string;
  sheet?: ParsedSheet;
  sheetNames?: string[];
  filename?: string;
};

function columnLetter(col: number): string {
  let s = "";
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function display(cell: ParsedCell): string {
  if (cell.value === null) return "";
  if (typeof cell.value === "number") {
    // Keep full precision visible; rounding decisions come later.
    return Number.isInteger(cell.value) ? cell.value.toLocaleString("id-ID") : String(cell.value);
  }
  return String(cell.value);
}

const label = {
  font: "700 11px var(--font-heading)",
  letterSpacing: ".04em",
  textTransform: "uppercase" as const,
  color: "var(--color-neutral-700)",
  marginBottom: 10,
};

export default function KelayakanClient() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Response | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setRes(null);
    try {
      // Sent as a plain multipart body rather than a streamed upload, so it
      // does not depend on the connection negotiating HTTP/2.
      const body = new FormData();
      body.append("file", file);
      const r = await fetch("/api/kelayakan/parse", { method: "POST", body });
      setRes(await r.json());
    } catch (err) {
      setRes({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const sheet = res?.sheet;
  const rows = sheet ? [...new Set(sheet.cells.map((c) => c.row))].sort((a, b) => a - b) : [];
  const byRef = new Map(sheet?.cells.map((c) => [c.ref, c]) ?? []);

  return (
    <div style={{ maxWidth: MOBILE_MAX_WIDTH, margin: "0 auto", minHeight: "100vh", background: "var(--color-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "2px solid var(--color-divider)", position: "sticky", top: 0, background: "var(--color-bg)", zIndex: 5 }}>
        <Link href="/" style={{ font: "600 13px var(--font-heading)", color: "var(--color-text)", textDecoration: "none" }}>
          ← Kembali
        </Link>
        <div style={{ font: "700 14px var(--font-heading)", color: "var(--color-text)", marginLeft: "auto" }}>
          Studi Kelayakan
        </div>
      </div>

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
              if (f) handleFile(f);
            }}
            style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", width: "100%" }}
          />
          <div style={{ font: "11px/1.5 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 10 }}>
            Yang dibaca hanya sheet <strong>Feasibility Study (FULL)</strong>. Format .xlsx atau
            .xlsm, maksimal 4 MB. Rumus dibaca dari hasil hitungannya, bukan rumusnya.
          </div>
          {busy && (
            <div style={{ font: "12px var(--font-body)", color: "var(--color-text)", marginTop: 10 }}>
              Membaca file…
            </div>
          )}
        </div>
      </div>

      {res && !res.ok && (
        <div style={{ padding: "18px 16px 0" }}>
          <div className="card" style={{ padding: 16, borderColor: "var(--color-accent-300)" }}>
            <div style={{ font: "600 13px var(--font-heading)", color: "var(--color-accent-700)" }}>
              {res.error}
            </div>
            {res.sheetNames && res.sheetNames.length > 0 && (
              <div style={{ font: "12px/1.6 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 8 }}>
                Sheet yang ada di file ini:
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {res.sheetNames.map((n) => <li key={n}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {sheet && (
        <>
          <div style={{ padding: "18px 16px 0" }}>
            <div style={label}>Hasil Baca</div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ font: "12.5px/1.7 var(--font-body)", color: "var(--color-text)" }}>
                <div><strong>File:</strong> {res?.filename}</div>
                <div><strong>Sheet:</strong> {sheet.name}</div>
                <div><strong>Sel terisi:</strong> {sheet.cells.length.toLocaleString("id-ID")}</div>
                <div><strong>Ukuran:</strong> {sheet.rowCount} baris × {sheet.colCount} kolom</div>
                <div><strong>Sel berumus:</strong> {sheet.cells.filter((c) => c.formula).length.toLocaleString("id-ID")}</div>
              </div>
              {sheet.staleFormulas > 0 && (
                <div style={{ font: "12px/1.6 var(--font-body)", color: "var(--color-accent-700)", marginTop: 10, padding: "8px 10px", background: "var(--color-accent-100)" }}>
                  {sheet.staleFormulas} rumus tidak punya hasil tersimpan. Buka file di Excel,
                  simpan ulang, lalu upload lagi supaya angkanya ikut terbaca.
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "18px 16px 30px" }}>
            <div style={label}>Isi Sheet</div>
            <div style={{ border: "2px solid var(--color-divider)", overflow: "auto", maxHeight: "70vh", background: "var(--color-bg)" }}>
              <table style={{ borderCollapse: "collapse", font: "12px var(--font-body)", whiteSpace: "nowrap" }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", top: 0, left: 0, zIndex: 3, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", padding: "4px 8px", font: "700 11px var(--font-heading)" }} />
                    {Array.from({ length: sheet.colCount }, (_, i) => (
                      <th key={i} style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", padding: "4px 8px", font: "700 11px var(--font-heading)", color: "var(--color-neutral-700)" }}>
                        {columnLetter(i + 1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r}>
                      <td style={{ position: "sticky", left: 0, zIndex: 1, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", padding: "4px 8px", font: "700 11px var(--font-heading)", color: "var(--color-neutral-700)", textAlign: "right" }}>
                        {r}
                      </td>
                      {Array.from({ length: sheet.colCount }, (_, i) => {
                        const cell = byRef.get(`${columnLetter(i + 1)}${r}`);
                        const numeric = cell?.kind === "number";
                        return (
                          <td
                            key={i}
                            title={cell?.formula ? `${cell.ref}  =${cell.formula}` : cell?.ref}
                            style={{
                              border: "1px solid var(--color-divider)",
                              padding: "4px 8px",
                              textAlign: numeric ? "right" : "left",
                              maxWidth: 260,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: cell?.kind === "error" ? "var(--color-accent-700)" : "var(--color-text)",
                              background: cell?.formula ? "var(--color-accent-100)" : undefined,
                            }}
                          >
                            {cell ? display(cell) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ font: "11px/1.6 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 8 }}>
              Sel berlatar warna berisi rumus — arahkan kursor untuk melihat rumus aslinya.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
