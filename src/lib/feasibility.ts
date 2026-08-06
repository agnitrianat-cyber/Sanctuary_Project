import ExcelJS from "exceljs";

export const TARGET_SHEET = "Feasibility Study (FULL)";

export type CellKind = "number" | "text" | "date" | "boolean" | "formula" | "error" | "empty";

export type ParsedCell = {
  /** A1-style address, e.g. "C12". */
  ref: string;
  row: number;
  col: number;
  kind: CellKind;
  /** Display value, already resolved from formulas. */
  value: string | number | boolean | null;
  /** The formula text, when the cell holds one. */
  formula?: string;
  /** Excel number format, useful for spotting currency and percentages. */
  format?: string;
};

export type ParsedSheet = {
  name: string;
  rowCount: number;
  colCount: number;
  cells: ParsedCell[];
  merges: string[];
  /** Formula cells with no cached result — Excel never recalculated them. */
  staleFormulas: number;
};

export type ParseResult =
  | { ok: true; sheet: ParsedSheet; sheetNames: string[] }
  | { ok: false; error: string; sheetNames: string[] };

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

function normalise(cell: ExcelJS.Cell): { kind: CellKind; value: ParsedCell["value"]; formula?: string } {
  const raw = cell.value;
  if (raw === null || raw === undefined || raw === "") return { kind: "empty", value: null };

  if (typeof raw === "number") return { kind: "number", value: raw };
  if (typeof raw === "boolean") return { kind: "boolean", value: raw };
  if (typeof raw === "string") return { kind: "text", value: raw };
  if (raw instanceof Date) return { kind: "date", value: raw.toISOString().slice(0, 10) };

  if (typeof raw === "object") {
    // Formula cells carry the expression plus the value Excel last calculated.
    // The cached result is what matters here; the sheet is already computed.
    if ("formula" in raw || "sharedFormula" in raw) {
      const f = raw as ExcelJS.CellFormulaValue & { sharedFormula?: string };
      // Read the result from the cell rather than from cell.value: the latter
      // is built with `value ? value.result : undefined`, which throws away a
      // cached 0. Whole rows here legitimately compute to zero, and treating
      // those as uncalculated would blank them out and raise a false alarm.
      const result = cell.result as unknown;
      const formula = f.formula || f.sharedFormula || "";
      if (result === null || result === undefined) return { kind: "formula", value: null, formula };
      if (typeof result === "object" && result !== null && "error" in (result as object)) {
        return { kind: "error", value: String((result as { error: string }).error), formula };
      }
      if (result instanceof Date) return { kind: "date", value: result.toISOString().slice(0, 10), formula };
      return {
        kind: typeof result === "number" ? "number" : "text",
        value: result as string | number,
        formula,
      };
    }
    if ("richText" in raw) {
      const rt = raw as ExcelJS.CellRichTextValue;
      return { kind: "text", value: rt.richText.map((p) => p.text).join("") };
    }
    if ("text" in raw) return { kind: "text", value: String((raw as { text: unknown }).text) };
    if ("error" in raw) return { kind: "error", value: String((raw as { error: unknown }).error) };
  }

  return { kind: "text", value: String(raw) };
}

export async function parseFeasibility(buffer: ArrayBuffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const sheetNames = wb.worksheets.map((w) => w.name);

  // Match the exact name first, then forgive stray spacing and casing, since
  // sheet tabs are typed by hand.
  const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const ws =
    wb.worksheets.find((w) => w.name === TARGET_SHEET) ??
    wb.worksheets.find((w) => key(w.name) === key(TARGET_SHEET));

  if (!ws) {
    return {
      ok: false,
      error: `Sheet "${TARGET_SHEET}" tidak ditemukan di file ini.`,
      sheetNames,
    };
  }

  const cells: ParsedCell[] = [];
  let staleFormulas = 0;
  let maxCol = 0;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // In a merged range every cell reports the master's value. Keeping only
      // the master stops a heading from being repeated across its whole span.
      if (cell.isMerged && cell.master && cell.master.address !== cell.address) return;

      const { kind, value, formula } = normalise(cell);
      if (kind === "empty") return;
      if (formula && value === null) staleFormulas += 1;
      if (colNumber > maxCol) maxCol = colNumber;
      cells.push({
        ref: `${columnLetter(colNumber)}${rowNumber}`,
        row: rowNumber,
        col: colNumber,
        kind,
        value,
        ...(formula ? { formula } : {}),
        ...(typeof cell.numFmt === "string" ? { format: cell.numFmt } : {}),
      });
    });
  });

  const merges = Array.isArray((ws as unknown as { model?: { merges?: string[] } }).model?.merges)
    ? ((ws as unknown as { model: { merges: string[] } }).model.merges ?? [])
    : [];

  return {
    ok: true,
    sheetNames,
    sheet: {
      name: ws.name,
      rowCount: ws.rowCount,
      colCount: maxCol,
      cells,
      merges,
      staleFormulas,
    },
  };
}
