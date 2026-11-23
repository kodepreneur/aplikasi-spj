export const AMOUNT_LIMIT = 999_999_999_999_999n;

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const WEEKDAYS = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
];

const numberFormat = new Intl.NumberFormat("id-ID");

export function tidy(text: string | null | undefined): string {
  return (text ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

export function money(amount: bigint | number | null | undefined): string {
  if (amount == null) return "—";
  return "Rp " + numberFormat.format(amount);
}

export function supplierName(state: { providerName?: string }): string {
  return tidy(state.providerName).replace(/^(?:CV|PT)\.?(?:\s+|$)/i, "");
}

export function company(state: { providerType?: string; providerName?: string }): string {
  return (state.providerType || "CV") + " " + supplierName(state);
}

export function readMoney(value: string | null | undefined): bigint | null {
  if (!value) return null;
  const text = value.trim().replace(/^Rp\.?\s*/i, "");
  if (!/^(?:\d{1,15}|\d{1,3}(?:\.\d{3}){1,4})$/.test(text)) return null;
  return BigInt(text.replace(/\./g, ""));
}

export function formatPriceInput(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.trim().replace(/^Rp\.?\s*/i, "").replace(/\./g, "");
  if (!/^\d{0,15}$/.test(digits)) return value;
  return digits.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function readDecimal(value: string | null | undefined): { units: bigint; scale: bigint } | null {
  if (!value) return null;
  const text = value.trim();
  if (!/^\d{1,9}(?:[.,]\d{1,6})?$/.test(text)) return null;
  const [integer, fraction = ""] = text.replace(",", ".").split(".");
  return { units: BigInt(integer + fraction), scale: 10n ** BigInt(fraction.length) };
}

export function readDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function dateText(value: string | null | undefined): string {
  const date = readDate(value);
  if (!date) return "";
  return (
    String(date.getUTCDate()).padStart(2, "0") +
    " " +
    MONTHS[date.getUTCMonth()] +
    " " +
    date.getUTCFullYear()
  );
}

export function weekdayText(value: string | null | undefined): string {
  const date = readDate(value);
  return date ? WEEKDAYS[date.getUTCDay()] : "";
}

export function workPeriod(start: string, end: string): string {
  if (!start || !end) return "";
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return start.slice(8) + " - " + dateText(end);
  }
  return dateText(start) + " s.d. " + dateText(end);
}

export function rounded(numerator: bigint, denominator: bigint): bigint {
  return (2n * numerator + denominator) / (2n * denominator);
}

export function spell(value: bigint | number): string {
  const n = Number(value);
  const units = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n < 12) return units[n];
  if (n < 20) return spell(n - 10) + " belas";
  if (n < 100) return spell(Math.floor(n / 10)) + " puluh " + spell(n % 10);
  if (n < 200) return "seratus " + spell(n - 100);
  if (n < 1000) return spell(Math.floor(n / 100)) + " ratus " + spell(n % 100);
  if (n < 2000) return "seribu " + spell(n - 1000);
  for (const [scale, name] of [[1e12, "triliun"], [1e9, "miliar"], [1e6, "juta"], [1000, "ribu"]] as const) {
    if (n >= scale) return spell(Math.floor(n / scale)) + " " + name + " " + spell(n % scale);
  }
  return "";
}

export function titleCase(text: string): string {
  return text.trim().replace(/\s+/g, " ").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function rupiahWords(amount: bigint | number): string {
  const b = typeof amount === "number" ? BigInt(amount) : amount;
  return titleCase((b === 0n ? "nol" : spell(b)) + " rupiah");
}

export interface RabItemInput {
  name: string;
  unit: string;
  quantity: string;
  volume: string;
  earlyPrice: string;
  finalPrice: string;
}

export interface RabGroupInput {
  name: string;
  items: RabItemInput[];
}

export interface ContractState {
  providerType: string;
  providerName: string;
  address: string;
  npwp: string;
  signatory: string;
  providerPhone?: string;
  packageName: string;
  program: string;
  activity: string;
  subactivity: string;
  coverAddition?: string;
  scope?: string;
  accountCode: string;
  budget: string;
  vatRate: string;
  fiscalYear: string;
  dppaNumber: string;
  dppaDate: string;
  workStart: string;
  workEnd: string;
  paymentMonth: string;
  ppkName: string;
  ppkPlanningNip: string;
  ppkSpkNip: string;
  procurementName: string;
  procurementNip: string;
  groups: RabGroupInput[];
  [key: string]: any;
}

export interface CalculationResult {
  groups: {
    items: {
      early: bigint | null;
      final: bigint | null;
      earlyPrice: bigint | null;
      finalPrice: bigint | null;
    }[];
  }[];
  totals: {
    early: { subtotal: bigint; vat: bigint; total: bigint };
    final: { subtotal: bigint; vat: bigint; total: bigint };
  } | null;
  budget: bigint | null;
  errors: string[];
  itemCount: number;
}

export type ContractCalculationResult = CalculationResult;

export function calculateContract(
  state: ContractState,
  dateFields: { key: string; label: string; optional?: boolean }[] = []
): CalculationResult {
  const errors: string[] = [];
  const budget = readMoney(state.budget);

  if (!supplierName(state)) errors.push("Isi nama perusahaan penyedia.");
  if (!tidy(state.packageName)) errors.push("Isi nama paket pengadaan.");
  if (!/^\d{4}$/.test((state.fiscalYear ?? "").trim())) errors.push("Tahun anggaran harus terdiri dari empat angka.");
  if (budget == null) errors.push("Isi pagu dengan rupiah bulat.");

  for (const { key, label, optional } of dateFields) {
    if (!(optional && !state[key]) && !readDate(state[key])) {
      errors.push(label + " belum valid.");
    }
  }

  if (state.workStart && state.workEnd && state.workEnd < state.workStart) {
    errors.push("Akhir pelaksanaan harus pada atau setelah tanggal mulai.");
  }

  const rate = readDecimal(state.vatRate ?? "11");
  let rabValid = true;
  if (!rate || rate.units > 100n * rate.scale) {
    errors.push("Masukkan tarif PPN antara 0 dan 100 persen.");
    rabValid = false;
  }

  const sums = { early: 0n, final: 0n };
  let itemCount = 0;

  const groups = (state.groups || []).map((group, groupIndex) => {
    if (!tidy(group.name)) errors.push("Isi nama kelompok RAB " + (groupIndex + 1) + ".");
    if (!group.items || !group.items.length) errors.push("Tambahkan item ke kelompok " + (groupIndex + 1) + ".");

    const items = (group.items || []).map((item, index) => {
      itemCount += 1;
      const at = "Kelompok " + (groupIndex + 1) + ", item " + (index + 1) + ". ";
      const quantity = readDecimal(item.quantity);
      const volume = readDecimal(item.volume);
      const earlyPrice = readMoney(item.earlyPrice);
      const finalPrice = (item.finalPrice ?? "").trim() === "" ? earlyPrice : readMoney(item.finalPrice);

      if (!tidy(item.name) || !tidy(item.unit)) {
        errors.push(at + "Isi uraian dan satuan.");
      }

      if (!quantity?.units || !volume?.units || earlyPrice == null || finalPrice == null) {
        errors.push(at + "QTY dan volume harus positif. Harga harus rupiah bulat.");
        rabValid = false;
        return { early: null, final: null, earlyPrice: null, finalPrice: null };
      }

      const factor = quantity.units * volume.units;
      const scale = quantity.scale * volume.scale;
      const early = rounded(factor * earlyPrice, scale);
      const final = rounded(factor * finalPrice, scale);

      if (early > AMOUNT_LIMIT || final > AMOUNT_LIMIT) {
        errors.push(at + "Jumlah item melebihi batas angka.");
        rabValid = false;
        return { early: null, final: null, earlyPrice: null, finalPrice: null };
      }

      sums.early += early;
      sums.final += final;
      return { early, final, earlyPrice, finalPrice };
    });

    return { items };
  });

  if (!itemCount) {
    errors.push("Tambahkan sedikitnya satu item RAB.");
    rabValid = false;
  }

  let totals: CalculationResult["totals"] = null;
  if (rabValid && rate) {
    totals = {
      early: { subtotal: sums.early, vat: 0n, total: 0n },
      final: { subtotal: sums.final, vat: 0n, total: 0n },
    };

    for (const basis of ["early", "final"] as const) {
      const subtotal = sums[basis];
      const vat = rounded(subtotal * rate.units, 100n * rate.scale);
      totals[basis] = { subtotal, vat, total: subtotal + vat };

      if (totals[basis].total > AMOUNT_LIMIT) {
        errors.push("Total RAB melebihi batas angka.");
        rabValid = false;
      }
    }
  }

  return { groups, totals: rabValid ? totals : null, budget, errors, itemCount };
}

export function prepareContractValues(
  state: ContractState,
  result: CalculationResult,
  dateFields: { key: string; label: string; optional?: boolean }[]
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of Object.entries(state)) {
    if (typeof value === "string") {
      values[key] = tidy(value);
    }
  }

  values.company = company(state);
  values.coverAddition = values.coverAddition ? " " + values.coverAddition : "";

  const words = (values.subactivity || "").split(/\s+/);
  let firstLine = words.shift() || "";
  while (words.length && firstLine.length + words[0].length + 1 <= 58) {
    firstLine += " " + words.shift();
  }
  values.subactivityFirst = firstLine;
  values.subactivityTail = words.join(" ");

  for (const { key } of dateFields) {
    const date = readDate(state[key]);
    if (!date) continue;
    const day = WEEKDAYS[date.getUTCDay()];
    values[key] = dateText(state[key]);
    values[key + "Day"] = day;
    values[key + "Words"] =
      day +
      " tanggal " +
      titleCase(spell(date.getUTCDate())) +
      " bulan " +
      MONTHS[date.getUTCMonth()] +
      " tahun " +
      titleCase(spell(date.getUTCFullYear()));
  }

  if (!state.decisionDate) {
    values.decisionDate = "              " + (values.fiscalYear || "2026");
  }

  values.workPeriod = workPeriod(state.workStart, state.workEnd);
  values.budget = result.budget ? numberFormat.format(result.budget) : "0";
  values.budgetWords = result.budget ? rupiahWords(result.budget) : "Nol rupiah";

  if (result.totals) {
    for (const basis of ["early", "final"] as const) {
      values[basis + "Total"] = numberFormat.format(result.totals[basis].total);
      values[basis + "Words"] = rupiahWords(result.totals[basis].total);
    }
  }

  return values;
}

export function itemLetter(index: number): string {
  let letter = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letter = String.fromCharCode(97 + ((n - 1) % 26)) + letter;
  }
  return letter;
}

export interface FormattedContractSummary {
  earlySubtotal: string;
  earlyVat: string;
  earlyTotal: string;
  earlyWords: string;
  finalSubtotal: string;
  finalVat: string;
  finalTotal: string;
  finalWords: string;
  budget: string;
  budgetWords: string;
  earlyDiff: string;
  finalDiff: string;
  itemCount: number;
  errors: string[];
}

export function summarizeCalculation(result: CalculationResult): FormattedContractSummary {
  const budget = result.budget ?? 0n;
  const early = result.totals?.early;
  const final = result.totals?.final;

  const earlyTotal = early?.total ?? 0n;
  const finalTotal = final?.total ?? 0n;

  return {
    earlySubtotal: early ? numberFormat.format(early.subtotal) : "0",
    earlyVat: early ? numberFormat.format(early.vat) : "0",
    earlyTotal: early ? numberFormat.format(earlyTotal) : "0",
    earlyWords: early ? rupiahWords(earlyTotal) : "Nol rupiah",
    finalSubtotal: final ? numberFormat.format(final.subtotal) : "0",
    finalVat: final ? numberFormat.format(final.vat) : "0",
    finalTotal: final ? numberFormat.format(finalTotal) : "0",
    finalWords: final ? rupiahWords(finalTotal) : "Nol rupiah",
    budget: result.budget ? numberFormat.format(result.budget) : "0",
    budgetWords: result.budget ? rupiahWords(budget) : "Nol rupiah",
    earlyDiff: early ? numberFormat.format(budget - earlyTotal) : "0",
    finalDiff: final ? numberFormat.format(budget - finalTotal) : "0",
    itemCount: result.itemCount,
    errors: result.errors,
  };
}
