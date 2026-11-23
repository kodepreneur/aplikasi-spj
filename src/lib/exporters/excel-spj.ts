import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { getSpjTemplate } from "../domain/spj-template";
import { calculateSpending, type SpjItemInput } from "../domain/tax-calc";

export const RECORD_OPD = "BADAN PENDAPATAN DAERAH KABUPATEN JEMBER";

export function reportDateSerial(iso: string | null | undefined): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const parts = (iso || "").split("-").map(Number);
  const y = parts[0]!;
  const m = parts[1]!;
  const d = parts[2]!;
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d ||
    y < 1900
  ) {
    return null;
  }
  return (t - Date.UTC(1899, 11, 30)) / 86_400_000;
}

export interface SpjReportRecord {
  id: string;
  values: Record<string, any>;
  items: SpjItemInput[];
}

export function reportRow(record: SpjReportRecord): any[] {
  const v = record.values || {};
  let total = 0;
  try {
    const spending = calculateSpending(v, record.items || []);
    total = spending.total || 0;
  } catch {
    total = 0;
  }

  return [
    RECORD_OPD,
    v.pekerjaan || "",
    total,
    v.nomor_sp || "",
    reportDateSerial(v.date_sp),
    reportDateSerial(v.date_selesai),
    v.nama_penyedia || "",
    v.nama_pa || "",
    v.nama_pptk || "",
  ];
}

export async function generateSpjReportExcel(
  records: SpjReportRecord[]
): Promise<Uint8Array> {
  const template = getSpjTemplate();
  const zip = await JSZip.loadAsync(template.reportTemplateBase64, {
    base64: true,
    checkCRC32: true,
  });

  const S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const doc = new DOMParser().parseFromString(
    await zip.file("xl/worksheets/sheet1.xml")!.async("string"),
    "application/xml"
  );

  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("Template rekap Excel tidak dapat dibaca.");
  }

  const data = doc.getElementsByTagNameNS(S, "sheetData")[0];
  if (!data) {
    throw new Error("Element sheetData tidak ditemukan pada template Excel.");
  }

  const rowElements = Array.from((data as any).children);
  const prototype = rowElements.find((r: any) => r.getAttribute("r") === "4");
  const styles: Record<string, string> = {};

  if (prototype) {
    for (const c of Array.from((prototype as any).children)) {
      const rAttr = (c as any).getAttribute("r") || "";
      const colLetter = rAttr.replace(/\d+$/, "");
      const sAttr = (c as any).getAttribute("s");
      if (sAttr) styles[colLetter] = sAttr;
    }
  }

  for (const r of rowElements) {
    if (Number((r as any).getAttribute("r")) >= 4) {
      (r as any).remove();
    }
  }

  const cols = ["B", "C", "D", "E", "F", "G", "H", "I", "J"];

  records.forEach((record, index) => {
    const row = doc.createElementNS(S, "row");
    const rowNumber = index + 4;
    row.setAttribute("r", String(rowNumber));

    const vals = reportRow(record);
    const wrapped = Math.max(
      3,
      ...vals.map((v, i) =>
        typeof v === "string"
          ? Math.ceil(v.length / [34, 54, 24, 44, 23, 24, 36, 32, 32][i]!)
          : 1
      )
    );

    row.setAttribute("ht", String(Math.min(300, Math.max(60, wrapped * 14 + 8))));
    row.setAttribute("customHeight", "1");

    vals.forEach((value, i) => {
      const cell = doc.createElementNS(S, "c");
      const col = cols[i]!;
      cell.setAttribute("r", col + rowNumber);
      if (styles[col]) cell.setAttribute("s", styles[col]);

      if (typeof value === "number" && Number.isFinite(value)) {
        const v = doc.createElementNS(S, "v");
        v.textContent = String(value);
        cell.appendChild(v);
      } else if (value !== null && value !== undefined && value !== "") {
        cell.setAttribute("t", "inlineStr");
        const is = doc.createElementNS(S, "is");
        const t = doc.createElementNS(S, "t");
        t.setAttributeNS(
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          "preserve"
        );
        t.textContent = String(value).replace(
          /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
          ""
        );
        is.appendChild(t);
        cell.appendChild(is);
      }
      row.appendChild(cell);
    });

    (data as any).appendChild(row);
  });

  const last = Math.max(3, records.length + 3);
  const dimension = doc.getElementsByTagNameNS(S, "dimension")[0];
  if (dimension) {
    (dimension as any).setAttribute("ref", "B3:J" + last);
  }

  let filter = doc.getElementsByTagNameNS(S, "autoFilter")[0];
  if (filter) {
    (filter as any).setAttribute("ref", "B3:J" + last);
  }

  zip.file("xl/worksheets/sheet1.xml", new XMLSerializer().serializeToString(doc));

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
