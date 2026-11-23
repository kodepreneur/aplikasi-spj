export const AMOUNT_LIMIT = 999_999_999_999_999n;

export const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const WEEKDAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export const PPH_DEFAULT_RATES: Record<string, string> = {
  "23": "2",
  "22": "1,5",
  "21": "5",
  "final": "0,5",
  "none": "0",
};

export interface DecimalParts {
  units: bigint;
  scale: bigint;
}

export function decimal(value: string | number | null | undefined): DecimalParts | null {
  const text = String(value ?? "").trim().replace(/\s/g, "");
  if (!/^\d{1,30}(?:[.,]\d{1,12})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.replace(",", ".").split(".");
  return { units: BigInt(whole + fraction), scale: 10n ** BigInt(fraction.length) };
}

export function roundAmount(numerator: bigint, denominator: bigint): bigint {
  return (2n * numerator + denominator) / (2n * denominator);
}

export function decimalProduct(
  first: string | number | null | undefined,
  second: string | number | null | undefined
): string {
  const a = decimal(first);
  const b = decimal(second);
  if (!a || !b) throw new Error("QTY atau volume kontrak tidak valid.");
  const units = a.units * b.units;
  const scale = a.scale * b.scale;
  const fraction = (units % scale)
    .toString()
    .padStart(scale.toString().length - 1, "0")
    .replace(/0+$/, "");
  return (units / scale).toString() + (fraction ? "," + fraction : "");
}

export function numberValue(val: string | number | null | undefined, allowComma = false): number {
  if (val === null || val === undefined) return NaN;
  let text = String(val).trim().replace(/\s/g, "");
  if (allowComma) text = text.replace(",", ".");
  else text = text.replace(/\./g, "");
  const num = Number(text);
  return Number.isFinite(num) ? num : NaN;
}

export function terbilang(n: number | bigint): string {
  const a = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  const num = typeof n === "bigint" ? Number(n) : Math.floor(n);

  if (num === 0) return "nol";
  if (num < 12) return a[num]!;
  if (num < 20) return a[num - 10] + " belas";
  if (num < 100) return a[Math.floor(num / 10)] + " puluh" + (num % 10 ? " " + terbilang(num % 10) : "");
  if (num < 200) return "seratus" + (num % 100 ? " " + terbilang(num % 100) : "");
  if (num < 1000) return a[Math.floor(num / 100)] + " ratus" + (num % 100 ? " " + terbilang(num % 100) : "");
  if (num < 2000) return "seribu" + (num % 1000 ? " " + terbilang(num % 1000) : "");

  const scales: [number, string][] = [
    [1e12, "triliun"],
    [1e9, "miliar"],
    [1e6, "juta"],
    [1000, "ribu"],
  ];

  for (const [m, label] of scales) {
    if (num >= m) {
      return terbilang(Math.floor(num / m)) + " " + label + (num % m ? " " + terbilang(num % m) : "");
    }
  }

  throw new Error("Nilai di luar rentang terbilang.");
}

export function titleCase(s: string): string {
  return (s ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface DatePartsResult {
  date: string;
  numeric: string;
  day: string;
  long: string;
}

export function dateParts(iso: string | null | undefined): DatePartsResult | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const parts = (iso || "").split("-").map(Number);
  const y = parts[0]!;
  const m = parts[1]!;
  const d = parts[2]!;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  const day = WEEKDAYS[dt.getUTCDay()]!;
  return {
    date: String(d).padStart(2, "0") + " " + MONTHS[m - 1] + " " + y,
    numeric: String(d).padStart(2, "0") + "-" + String(m).padStart(2, "0") + "-" + y,
    day,
    long:
      day +
      "; tanggal : " +
      titleCase(terbilang(d)) +
      "; bulan : " +
      MONTHS[m - 1] +
      "; tahun : " +
      titleCase(terbilang(y)),
  };
}

export function pphLabel(type: string = "23"): string {
  if (type === "22") return "PPh 22";
  if (type === "21") return "PPh 21";
  if (type === "final") return "PPh Final";
  if (type === "none") return "Tanpa PPh";
  return "PPh 23";
}

export interface SpjItemInput {
  description: string;
  detail?: string;
  unit: string;
  quantity: string | number;
  unitPrice: string | number;
}

export interface ComputedSpjItem extends SpjItemInput {
  quantityNum: number;
  unitPriceNum: number;
  base: number;
  ppn: number;
  total: number;
}

export interface SpendingResult {
  items: ComputedSpjItem[];
  rate: number;
  basis: "included" | "excluded";
  base: number;
  ppn: number;
  total: number;
  subtotal: number;
  errors: string[];
}

export function calculateSpending(
  input: { price_basis?: string; ppn_rate?: string | number },
  sourceItems: SpjItemInput[]
): SpendingResult {
  const rate = decimal(input.ppn_rate ?? "11");
  const included = input.price_basis === "included";
  const validRate = rate && rate.units <= 100n * rate.scale;
  const errors: string[] = [];

  if (!sourceItems.length) errors.push("Tambahkan setidaknya satu jenis belanja.");
  if (!validRate) errors.push("Tarif efektif PPN harus berupa angka antara 0 sampai 100.");
  if (!["included", "excluded"].includes(input.price_basis || "")) {
    errors.push("Pilih harga sudah atau belum termasuk PPN.");
  }

  let subtotal = 0n;
  let runningPpn = 0n;

  const items: ComputedSpjItem[] = sourceItems.map((item, index) => {
    const qty = decimal(item.quantity);
    const priceText = String(item.unitPrice ?? "").trim().replace(/^Rp\.?\s*/i, "");
    const price = /^\d+(?:\.\d{3})*$/.test(priceText)
      ? BigInt(priceText.replace(/\./g, ""))
      : null;

    const goodQty = qty && qty.units > 0n && qty.units <= 1_000_000_000n * qty.scale;
    const goodPrice = price !== null && price < AMOUNT_LIMIT;
    const amount = goodQty && goodPrice ? roundAmount(qty.units * price, qty.scale) : null;
    const goodAmount = amount !== null && amount < AMOUNT_LIMIT;

    if (!goodQty) errors.push("Volume belanja " + (index + 1) + " harus berupa angka positif.");
    if (!goodPrice) errors.push("Harga satuan belanja " + (index + 1) + " harus berupa rupiah bulat, minimal nol.");
    if (goodQty && goodPrice && !goodAmount) errors.push("Jumlah belanja di luar batas angka.");

    const quantityNum = qty ? Number(qty.units) / Number(qty.scale) : NaN;
    const unitPriceNum = price === null ? NaN : Number(price);

    if (!goodAmount || !validRate || !rate) {
      return {
        ...item,
        quantityNum,
        unitPriceNum,
        base: NaN,
        ppn: NaN,
        total: NaN,
      };
    }

    subtotal += amount;
    const running = roundAmount(
      subtotal * rate.units,
      (included ? rate.units : 0n) + 100n * rate.scale
    );
    const tax = running - runningPpn;
    runningPpn = running;

    return {
      ...item,
      quantityNum,
      unitPriceNum,
      base: Number(included ? amount - tax : amount),
      ppn: Number(tax),
      total: Number(included ? amount : amount + tax),
    };
  });

  const total = included ? subtotal : subtotal + runningPpn;
  if (total >= AMOUNT_LIMIT) {
    errors.push("Nilai total harus lebih kecil dari 1 kuadriliun rupiah.");
  }

  const numbers = errors.length
    ? { base: NaN, ppn: NaN, total: NaN, subtotal: NaN }
    : {
        base: Number(total - runningPpn),
        ppn: Number(runningPpn),
        total: Number(total),
        subtotal: Number(subtotal),
      };

  return {
    items,
    rate: rate ? Number(rate.units) / Number(rate.scale) : NaN,
    basis: (input.price_basis as any) || "excluded",
    errors,
    ...numbers,
  };
}

export interface PphCalculationResult {
  type: string;
  label: string;
  rate: number;
  base: number;
  amount: number;
  errors: string[];
}

export function calculatePph(
  input: { pph_type?: string; pph_rate?: string | number },
  total: number,
  ppn: number
): PphCalculationResult {
  const pphType = input.pph_type || "23";
  const rate = numberValue(input.pph_rate, true);
  const base = total - ppn;
  const label = pphLabel(pphType);
  const errors: string[] = [];

  if (pphType === "none") {
    return { type: "none", label: "Tanpa PPh", rate: 0, base, amount: 0, errors: [] };
  }

  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    errors.push("Tarif PPh harus berupa angka antara 0 sampai 100.");
  }

  const amount = Math.round((base * (rate || 0)) / 100);
  if (!Number.isSafeInteger(base) || base < 0 || !Number.isSafeInteger(amount) || amount < 0) {
    errors.push("Dasar pengenaan dan potongan PPh belum dapat dihitung.");
  }

  return { type: pphType, label, rate, base, amount, errors };
}

export interface SpjCalculationResult {
  spending: SpendingResult;
  pph: PphCalculationResult;
  net: number;
  data: Record<string, string>;
  errors: string[];
}

const numberFormat = new Intl.NumberFormat("id-ID");

export function computeSpj(
  input: Record<string, any>,
  sourceItems: SpjItemInput[],
  templateFields: { key: string; value: string; group: string; label: string }[]
): SpjCalculationResult {
  const data: Record<string, string> = {};
  for (const f of templateFields) {
    data[f.key] = input[f.key] ?? f.value ?? "";
  }

  const spending = calculateSpending(input, sourceItems);
  const { items: computedItems, ppn, total } = spending;
  const errors = [...spending.errors];

  const days = numberValue(input.days, true);
  const maint = numberValue(input.masa_pemeliharaan, true);

  for (const [index, item] of sourceItems.entries()) {
    if (!item.description?.trim()) errors.push("Uraian belanja " + (index + 1) + " belum diisi.");
    if (!item.unit?.trim()) errors.push("Satuan belanja " + (index + 1) + " belum diisi.");
  }

  const ph = calculatePph(input, total, ppn);
  const pphAmount = ph.amount;
  const net = total - ppn - pphAmount;
  errors.push(...ph.errors);

  if (Number.isFinite(net) && net < 0) {
    errors.push("Total potongan pajak melebihi nilai bruto.");
  }
  if (!Number.isInteger(days) || days < 1 || days > 36600) {
    errors.push("Jangka waktu harus berupa jumlah hari bulat positif.");
  }
  if (!Number.isInteger(maint) || maint < 0 || maint > 36600) {
    errors.push("Masa pemeliharaan harus berupa hari bulat, minimal nol.");
  }
  if (!/^\d{4}$/.test((input.tahun_anggaran || "").trim())) {
    errors.push("Tahun anggaran harus 4 digit.");
  }

  const requiredFields = [
    "pekerjaan",
    "sub_kegiatan",
    "nama_penyedia",
    "wakil_penyedia",
    "nama_pa",
    "nama_pptk",
    "nama_bendahara",
    "nama_aset",
  ];
  for (const key of requiredFields) {
    if (!String(input[key] || "").trim()) {
      const fLabel = templateFields.find((f) => f.key === key)?.label || key;
      errors.push(fLabel + " belum diisi.");
    }
  }

  if (!errors.length && computedItems.length > 0) {
    const first = computedItems[0]!;
    data.satuan = first.unit;
    data.volume = String(first.quantity).replace(".", ",");
    data.harga_satuan = numberFormat.format(first.unitPriceNum);
    data.nilai_total = numberFormat.format(total);
    data.terbilang_total = titleCase(terbilang(total) + " rupiah");
    data.ppn = numberFormat.format(ppn);
    data.pph23 = numberFormat.format(pphAmount);
    data.nilai_bersih = numberFormat.format(net);
    data.jangka_waktu = days + " (" + titleCase(terbilang(days)) + ")";
    data.masa_pemeliharaan = String(maint);
  }

  const dateMapping = [
    ["date_dpa", "tanggal_dpa"],
    ["date_sp", "tanggal_sp"],
    ["date_selesai", "tanggal_selesai"],
    ["date_penyerahan", "tanggal_penyerahan"],
    ["date_periksa", "tanggal_periksa"],
    ["date_terima", "tanggal_terima_barang"],
    ["date_permohonan_bayar", "tanggal_permohonan_bayar"],
    ["date_bapp", "tanggal_bapp"],
    ["date_ringkasan", "tanggal_ringkasan"],
    ["date_kuitansi", "tanggal_kuitansi"],
    ["date_nota_cair", "tanggal_nota_cair"],
    ["date_sk_pa", "sk_pa_tanggal"],
    ["date_sk_pptk", "sk_pptk_tanggal"],
    ["date_sk_aset", "sk_aset_tanggal"],
  ];

  for (const [src, dst] of dateMapping) {
    const p = dateParts(input[src!]);
    if (p) {
      data[dst!] = p.date;
    } else if (input[src!]) {
      errors.push("Format tanggal tidak valid pada " + src + ".");
    } else if (["tanggal_ringkasan", "tanggal_kuitansi", "tanggal_nota_cair", "sk_aset_tanggal"].includes(dst!)) {
      data[dst!] = "                      " + (input.tahun_anggaran || "2026");
    }
  }

  const handover = dateParts(input.date_penyerahan);
  if (handover) data.hari_penyerahan = handover.day;

  const finish = dateParts(input.date_selesai);
  if (finish) data.tanggal_selesai_angka = finish.numeric;

  const check = dateParts(input.date_periksa);
  if (check) {
    data.tanggal_periksa_angka = check.numeric;
    data.hari_periksa = check.day;
  }

  const longDateMapping = [
    ["date_adm", "uraian_tanggal_adm"],
    ["date_periksa", "uraian_tanggal_periksa"],
    ["date_bast_ppk", "uraian_tanggal_bast_ppk"],
    ["date_bast_aset", "uraian_tanggal_bast_aset"],
    ["date_bapp", "uraian_tanggal_bapp"],
  ];

  for (const [src, dst] of longDateMapping) {
    const p = dateParts(input[src!]);
    if (p) {
      data[dst!] = p.long;
    }
  }

  return {
    spending,
    pph: ph,
    net,
    data,
    errors,
  };
}
