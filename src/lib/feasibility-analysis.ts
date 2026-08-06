import type { Metrics } from "./feasibility-metrics";

// Every figure here is computed, never asked of a language model. Arithmetic is
// the part an LLM is least reliable at, and these numbers end up in front of
// management.

export type Finding = {
  severity: "tinggi" | "sedang" | "info";
  title: string;
  detail: string;
};

export type Analysis = {
  verdict: "Layak" | "Marginal" | "Tidak layak";
  verdictReason: string;
  npvReported: number | null;
  npvCorrected: number | null;
  npvGap: number | null;
  irrComputed: number | null;
  paybackComputed: number | null;
  terminalValuePv: number | null;
  terminalValueShare: number | null;
  npvWithoutTerminal: number | null;
  irrWithoutTerminal: number | null;
  revenueHeadroom: number | null;
  discountLadder: { rate: number; npv: number }[];
  breakEvenRate: number | null;
  findings: Finding[];
};

function npvOf(rate: number, t0: number, flows: number[]): number {
  return t0 + flows.reduce((s, x, i) => s + x / Math.pow(1 + rate, i + 1), 0);
}

function irrOf(t0: number, flows: number[]): number | null {
  const all = [t0, ...flows];
  const f = (r: number) => all.reduce((s, x, i) => s + x / Math.pow(1 + r, i), 0);
  if (f(-0.99) * f(10) > 0) return null;
  let lo = -0.99;
  let hi = 10;
  for (let i = 0; i < 300; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

function paybackOf(investment: number, flows: number[]): number | null {
  let cum = -investment;
  for (let i = 0; i < flows.length; i++) {
    if (flows[i] !== 0 && cum + flows[i] >= 0) return i + -cum / flows[i];
    cum += flows[i];
  }
  return null;
}

/**
 * Excel's NPV() discounts its first argument by one period. Passing the
 * period-zero outflow inside that range therefore discounts the investment an
 * extra year. IRR() treats its first value as period zero, so the same range
 * cannot be correct for both.
 */
function npvRangeIncludesPeriodZero(formula: string | null, t0Ref?: string): boolean {
  if (!formula) return false;
  const m = /NPV\s*\(\s*[^,]+,\s*([A-Z]+\$?\d+)\s*:/i.exec(formula);
  if (!m) return false;
  const first = m[1].replace("$", "");
  // The range starts one column left of the first projection year when the
  // period-zero cell has been swept in.
  return t0Ref ? first.toUpperCase() === t0Ref.toUpperCase() : true;
}

export function analyse(m: Metrics): Analysis {
  const findings: Finding[] = [];
  const rate = m.discountRate;
  const t0 = m.cashFlowT0;
  const flows = m.cashFlows;
  const usable = rate !== null && t0 !== null && flows.length > 0;

  let npvCorrected: number | null = null;
  let irrComputed: number | null = null;
  let paybackComputed: number | null = null;
  let terminalValuePv: number | null = null;
  let npvWithoutTerminal: number | null = null;
  let irrWithoutTerminal: number | null = null;
  let revenueHeadroom: number | null = null;
  let breakEvenRate: number | null = null;
  const discountLadder: { rate: number; npv: number }[] = [];

  if (usable) {
    npvCorrected = npvOf(rate, t0, flows);
    irrComputed = irrOf(t0, flows);
    paybackComputed = paybackOf(Math.abs(t0), m.operatingCashFlow.length ? m.operatingCashFlow : flows);

    if (m.terminalValue) {
      terminalValuePv = m.terminalValue / Math.pow(1 + rate, flows.length);
      const withoutTv = flows.slice();
      withoutTv[withoutTv.length - 1] -= m.terminalValue;
      npvWithoutTerminal = npvOf(rate, t0, withoutTv);
      irrWithoutTerminal = irrOf(t0, withoutTv);
    }

    // How far revenue can fall before the project stops creating value, with
    // costs held flat. Terminal value capitalises the final year's cash flow,
    // so it has to shrink along with it — leaving it untouched would overstate
    // the room available by a wide margin.
    if (m.revenue.length === flows.length && m.revenue.some((r) => r !== 0)) {
      const last = flows.length - 1;
      const tv = m.terminalValue ?? 0;
      const baseLastOperating = flows[last] - tv;
      const shrink = (drop: number) => {
        const scaled = flows.map((f, i) => f - m.revenue[i] * drop);
        if (tv && baseLastOperating !== 0) {
          const ratio = (scaled[last] - tv) / baseLastOperating;
          scaled[last] = scaled[last] - tv + tv * ratio;
        }
        return scaled;
      };
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (npvOf(rate, t0, shrink(mid)) > 0) lo = mid;
        else hi = mid;
      }
      revenueHeadroom = (lo + hi) / 2;
    }

    for (const r of [rate, rate + 0.03, rate + 0.05, rate + 0.08]) {
      discountLadder.push({ rate: r, npv: npvOf(r, t0, flows) });
    }
    breakEvenRate = irrComputed;
  }

  // --- Findings -----------------------------------------------------------
  if (m.missing.length) {
    findings.push({
      severity: "sedang",
      title: "Sebagian label tidak ditemukan",
      detail: `Tidak ketemu di sheet: ${m.missing.join(", ")}. Angka terkait tidak dianalisa.`,
    });
  }

  if (m.npvReported !== null && npvCorrected !== null) {
    const gap = npvCorrected - m.npvReported;
    if (Math.abs(gap) > Math.abs(npvCorrected) * 0.001) {
      const understated = gap > 0;
      findings.push({
        severity: "tinggi",
        title: "Rumus NPV mendiskon investasi awal satu periode ekstra",
        detail:
          `NPV di file ${fmt(m.npvReported)}, hasil hitung ulang ${fmt(npvCorrected)} — selisih ${fmt(Math.abs(gap))} ` +
          `(${understated ? "kekecilan" : "kebesaran"}). Fungsi NPV() Excel mendiskon nilai pertamanya satu periode, ` +
          `jadi arus kas periode nol tidak boleh ikut di dalam rentangnya. IRR() justru sebaliknya. ` +
          `Perbaikannya: pisahkan arus kas awal, "= <sel awal> + NPV(rate, <tahun 1..N>)".`,
      });
    }
  }

  if (m.replacementCapex.length && m.replacementCapex.every((x) => x === 0) && m.terminalValue) {
    findings.push({
      severity: "tinggi",
      title: "Terminal value tanpa capex penggantian",
      detail:
        `Belanja modal penggantian nol di seluruh ${m.years} tahun, tapi terminal value ${fmt(m.terminalValue)} ` +
        `mengasumsikan arus kas berlanjut selamanya. Aset fisik perlu peremajaan; ini asumsi paling menyanjung di model ini.`,
    });
  }

  if (terminalValuePv !== null && npvCorrected) {
    const share = terminalValuePv / npvCorrected;
    if (share > 0.4) {
      findings.push({
        severity: npvWithoutTerminal !== null && npvWithoutTerminal > 0 ? "sedang" : "tinggi",
        title: `Terminal value menyumbang ${(share * 100).toFixed(0)}% dari NPV`,
        detail:
          npvWithoutTerminal !== null && npvWithoutTerminal > 0
            ? `Tanpa terminal value NPV masih ${fmt(npvWithoutTerminal)} dan IRR ${pct(irrWithoutTerminal)} — proyek tetap berdiri sendiri.`
            : `Tanpa terminal value NPV menjadi ${fmt(npvWithoutTerminal)}. Kelayakan bergantung pada asumsi nilai sisa.`,
      });
    }
  }

  if (m.taxRate !== null && m.taxRate <= 0.15) {
    findings.push({
      severity: "sedang",
      title: `Tarif pajak ${pct(m.taxRate)} perlu dikonfirmasi`,
      detail:
        `Tarif ini konsisten dengan PPh Final atas sewa tanah/bangunan, bukan PPh Badan yang 22% atas laba. ` +
        `Pastikan rezim pajaknya benar — kalau ternyata PPh Badan, arus kas turun cukup besar.`,
    });
  }

  if (rate !== null && irrComputed !== null) {
    const spread = irrComputed - rate;
    if (spread < 0) {
      findings.push({ severity: "tinggi", title: "IRR di bawah tingkat diskonto", detail: `IRR ${pct(irrComputed)} lebih rendah dari hurdle ${pct(rate)}.` });
    } else if (spread < 0.02) {
      findings.push({ severity: "tinggi", title: "Jarak IRR ke hurdle tipis", detail: `IRR ${pct(irrComputed)} hanya ${(spread * 100).toFixed(1)} poin di atas ${pct(rate)}.` });
    }
  }

  // --- Verdict ------------------------------------------------------------
  let verdict: Analysis["verdict"] = "Marginal";
  let verdictReason = "Data tidak cukup untuk menyimpulkan.";
  if (npvCorrected !== null && rate !== null && irrComputed !== null) {
    const spread = irrComputed - rate;
    if (npvCorrected > 0 && spread >= 0.03 && (revenueHeadroom ?? 0) >= 0.1) {
      verdict = "Layak";
      verdictReason = `NPV ${fmt(npvCorrected)}, IRR ${pct(irrComputed)} terhadap hurdle ${pct(rate)}, dan omzet masih boleh turun ${pct(revenueHeadroom)} sebelum NPV nol.`;
    } else if (npvCorrected > 0) {
      verdict = "Marginal";
      verdictReason = `NPV positif ${fmt(npvCorrected)}, tapi jarak ke hurdle atau daya tahannya tipis.`;
    } else {
      verdict = "Tidak layak";
      verdictReason = `NPV ${fmt(npvCorrected)} pada tingkat diskonto ${pct(rate)}.`;
    }
  }

  return {
    verdict,
    verdictReason,
    npvReported: m.npvReported,
    npvCorrected,
    npvGap: m.npvReported !== null && npvCorrected !== null ? npvCorrected - m.npvReported : null,
    irrComputed,
    paybackComputed,
    terminalValuePv,
    terminalValueShare: terminalValuePv !== null && npvCorrected ? terminalValuePv / npvCorrected : null,
    npvWithoutTerminal,
    irrWithoutTerminal,
    revenueHeadroom,
    discountLadder,
    breakEvenRate,
    findings,
  };
}

/** What each lever must deliver to bring payback to the target year. */
export function paybackLevers(m: Metrics, targetYear: number) {
  const investment = m.investment;
  const ocf = m.operatingCashFlow.length ? m.operatingCashFlow : m.cashFlows;
  if (!investment || ocf.length < targetYear) return null;

  const within = ocf.slice(0, targetYear).reduce((a, b) => a + b, 0);
  const gap = investment - within;
  if (gap <= 0) return { alreadyMet: true as const, gap: 0, within };

  const revWithin = m.revenue.slice(0, targetYear).reduce((a, b) => a + b, 0);
  const costWithin = m.cost.slice(0, targetYear).reduce((a, b) => a + b, 0);

  return {
    alreadyMet: false as const,
    gap,
    within,
    /** Uplift needed if tariffs rise and costs hold. */
    tariffUplift: revWithin > 0 ? gap / revWithin : null,
    /** Uplift needed if volume rises and costs scale with it. */
    volumeUplift: within > 0 ? gap / within : null,
    /** Share of the investment that would have to be cut instead. */
    capexCut: gap / investment,
    /** Whether cutting operating cost alone could ever close the gap. */
    costCutEnough: costWithin >= gap,
    costWithin,
  };
}

function fmt(n: number | null): string {
  if (n === null) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (abs >= 1e6) return `${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

function pct(n: number | null): string {
  return n === null ? "-" : `${(n * 100).toFixed(2)}%`;
}
