import type { ParsedCell, ParsedSheet } from "./feasibility";

// Values are located by their label rather than by a fixed address, so
// inserting a row in the workbook does not silently shift every figure.

export type Metrics = {
  country: string | null;
  entity: string | null;
  project: string | null;
  discountRate: number | null;
  taxRate: number | null;
  investment: number | null;
  npvReported: number | null;
  npvFormula: string | null;
  irrReported: number | null;
  paybackReported: number | null;
  aricReported: number | null;
  years: number;
  cashFlowT0: number | null;
  cashFlows: number[];
  revenue: number[];
  cost: number[];
  operatingCashFlow: number[];
  terminalValue: number | null;
  replacementCapex: number[];
  /** Labels that could not be located, so the gaps are visible. */
  missing: string[];
};

function rowsByLabel(cells: ParsedCell[]) {
  const labels = new Map<number, string>();
  for (const c of cells) {
    if (c.kind !== "text" || typeof c.value !== "string") continue;
    if (c.col > 4) continue; // labels live in the left-hand columns
    const existing = labels.get(c.row);
    if (!existing || c.col < 4) labels.set(c.row, String(c.value));
  }
  return labels;
}

function findRow(labels: Map<number, string>, pattern: RegExp): number | null {
  for (const [row, text] of [...labels].sort((a, b) => a[0] - b[0])) {
    if (pattern.test(text)) return row;
  }
  return null;
}

/**
 * Same match, but only accepts a row that actually carries a number. Sheet
 * titles repeat the metric names — "Net Present Value / IRR / Payback
 * Calculations" as a heading would otherwise win over the real NPV row.
 */
function findValueRow(labels: Map<number, string>, cells: ParsedCell[], pattern: RegExp): number | null {
  const hasNumber = new Set(cells.filter((c) => c.kind === "number").map((c) => c.row));
  for (const [row, text] of [...labels].sort((a, b) => a[0] - b[0])) {
    if (pattern.test(text) && hasNumber.has(row)) return row;
  }
  return null;
}

/** First numeric cell to the right of the label on that row. */
function valueOn(cells: ParsedCell[], row: number | null): number | null {
  if (row === null) return null;
  const found = cells
    .filter((c) => c.row === row && c.kind === "number" && typeof c.value === "number")
    .sort((a, b) => a.col - b.col)[0];
  return found ? (found.value as number) : null;
}

function textOn(cells: ParsedCell[], row: number | null): string | null {
  if (row === null) return null;
  const found = cells
    .filter((c) => c.row === row && c.col > 2 && c.kind === "text")
    .sort((a, b) => a.col - b.col)[0];
  return found ? String(found.value) : null;
}

function seriesOn(cells: ParsedCell[], row: number | null, cols: number[]): number[] {
  if (row === null) return [];
  const byCol = new Map(cells.filter((c) => c.row === row).map((c) => [c.col, c]));
  return cols.map((col) => {
    const c = byCol.get(col);
    return c && typeof c.value === "number" ? c.value : 0;
  });
}

export function extractMetrics(sheet: ParsedSheet): Metrics {
  const cells = sheet.cells;
  const labels = rowsByLabel(cells);
  const missing: string[] = [];

  // Metric rows must carry a number; headings that merely mention the metric
  // are skipped.
  const need = (name: string, pattern: RegExp) => {
    const row = findValueRow(labels, cells, pattern);
    if (row === null) missing.push(name);
    return row;
  };

  // The year header row defines which columns hold the projection.
  const yearCells = cells
    .filter((c) => c.kind === "text" && /^year\s*\d+$/i.test(String(c.value)))
    .sort((a, b) => a.col - b.col);
  const headerRow = yearCells.length ? yearCells[0].row : null;
  const yearCols = headerRow
    ? [...new Set(yearCells.filter((c) => c.row === headerRow).map((c) => c.col))].sort((a, b) => a - b)
    : [];
  if (!yearCols.length) missing.push("kolom Year 1..N");

  const npvRow = need("Net Present Value", /net present value/i);
  const cashFlowRow = need("Total Cash Flow for NPV", /total cash flow/i);

  const npvCell = npvRow === null ? null : cells.filter((c) => c.row === npvRow && c.kind === "number").sort((a, b) => a.col - b.col)[0];

  // The period-zero outflow sits left of the first projection column.
  let cashFlowT0: number | null = null;
  if (cashFlowRow !== null && yearCols.length) {
    const before = cells
      .filter((c) => c.row === cashFlowRow && c.col < yearCols[0] && typeof c.value === "number")
      .sort((a, b) => b.col - a.col)[0];
    cashFlowT0 = before ? (before.value as number) : null;
  }

  const investedRow = findValueRow(labels, cells, /total invested capital/i);
  const investedCapital = valueOn(cells, investedRow);

  return {
    country: textOn(cells, findRow(labels, /^country$/i)),
    entity: textOn(cells, findRow(labels, /^entity$/i)),
    project: textOn(cells, findRow(labels, /project description/i)),
    discountRate: valueOn(cells, need("Discount Rate", /discount rate/i)),
    taxRate: valueOn(cells, findValueRow(labels, cells, /^tax\s*\/\s*rate/i)),
    investment: cashFlowT0 !== null ? Math.abs(cashFlowT0) : investedCapital,
    npvReported: npvCell ? (npvCell.value as number) : null,
    npvFormula: npvCell?.formula ?? null,
    irrReported: valueOn(cells, need("IRR", /^irr\b/i)),
    paybackReported: valueOn(cells, need("Payback Period", /payback period/i)),
    aricReported: valueOn(cells, findValueRow(labels, cells, /average return on invested capital/i)),
    years: yearCols.length,
    cashFlowT0,
    cashFlows: seriesOn(cells, cashFlowRow, yearCols),
    revenue: seriesOn(cells, findRow(labels, /^revenue$/i), yearCols),
    cost: seriesOn(cells, findRow(labels, /^total cost$/i), yearCols),
    operatingCashFlow: seriesOn(cells, findRow(labels, /total operating cash flow/i), yearCols),
    terminalValue: (() => {
      const row = findRow(labels, /terminal value/i);
      if (row === null) return null;
      const nums = cells.filter((c) => c.row === row && typeof c.value === "number");
      return nums.length ? (nums[nums.length - 1].value as number) : null;
    })(),
    replacementCapex: seriesOn(cells, findRow(labels, /capital expenditure|capex/i), yearCols),
    missing,
  };
}
