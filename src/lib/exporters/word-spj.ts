import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import {
  type SpjItemInput,
  computeSpj,
  pphLabel,
} from "../domain/tax-calc";
import { getSpjTemplate } from "../domain/spj-template";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";

const digits = (n: number) => Math.round(n).toLocaleString("id-ID");

function direct(e: any, name: string): any {
  return Array.from(e?.children || []).find(
    (c: any) => c.namespaceURI === W && c.localName === name
  );
}

function getAttribute(e: any, name: string): string | null {
  return e?.getAttributeNS(W, name) ?? e?.getAttribute(name) ?? null;
}

function ensureDomCompat(doc: any) {
  const ElementProto = doc?.documentElement?.constructor?.prototype;
  if (!ElementProto) return;

  if (!ElementProto.remove) {
    ElementProto.remove = function () {
      if (this.parentNode) this.parentNode.removeChild(this);
    };
  }
  if (!ElementProto.append) {
    ElementProto.append = function (...nodes: any[]) {
      for (const n of nodes) {
        if (typeof n === "string") {
          this.appendChild(this.ownerDocument.createTextNode(n));
        } else if (n) {
          this.appendChild(n);
        }
      }
    };
  }
  if (!ElementProto.prepend) {
    ElementProto.prepend = function (...nodes: any[]) {
      const first = this.firstChild;
      for (const n of nodes) {
        if (typeof n === "string") {
          this.insertBefore(this.ownerDocument.createTextNode(n), first);
        } else if (n) {
          this.insertBefore(n, first);
        }
      }
    };
  }
  if (!("children" in ElementProto)) {
    Object.defineProperty(ElementProto, "children", {
      get() {
        const arr: any[] = [];
        const list = this.childNodes || [];
        for (let i = 0; i < list.length; i++) {
          if (list[i] && list[i].nodeType === 1) arr.push(list[i]);
        }
        return arr;
      },
      configurable: true,
    });
  }
}

function parseXml(text: string): any {
  const d = new DOMParser().parseFromString(text, "application/xml");
  if (d.getElementsByTagName("parsererror").length) {
    throw new Error("Template Word SPJ tidak dapat dibaca.");
  }
  ensureDomCompat(d);
  return d;
}

function linkHandoverDates(doc: any): void {
  let inLetter = false;
  let changed = 0;

  for (const p of Array.from(doc.getElementsByTagNameNS(W, "p"))) {
    const text = Array.from((p as any).getElementsByTagNameNS(W, "t"))
      .map((t: any) => t.textContent)
      .join("");

    if (/Perihal\s*:\s*Penyerahan Pekerjaan/i.test(text)) inLetter = true;
    if (inLetter && /Hormat Kami/i.test(text)) inLetter = false;
    if (!inLetter) continue;

    for (const s of Array.from((p as any).getElementsByTagNameNS(W, "sdt"))) {
      const pr = direct(s, "sdtPr");
      const tag = direct(pr, "tag");
      const key = getAttribute(tag, "val");
      const next =
        key === "spj:hari_periksa"
          ? "hari_penyerahan"
          : key === "spj:tanggal_periksa"
          ? "tanggal_penyerahan"
          : null;
      if (!next) continue;
      tag.setAttributeNS(W, "w:val", "spj:" + next);
      const binding = direct(pr, "dataBinding");
      if (binding) {
        const xpath = getAttribute(binding, "xpath");
        if (xpath && key) {
          binding.setAttributeNS(W, "w:xpath", xpath.replace(key.slice(4), next));
        }
      }
      changed++;
    }
  }

  if (changed !== 2) {
    throw new Error("Isian Hari/Tanggal penyerahan pekerjaan tidak ditemukan lengkap.");
  }
}

function applyPphWordLabel(doc: any, label: string): number {
  let replaced = 0;
  for (const p of Array.from(doc.getElementsByTagNameNS(W, "p"))) {
    const nodes = Array.from((p as any).getElementsByTagNameNS(W, "t"));
    const text = nodes.map((t: any) => t.textContent).join("");
    const matches = Array.from(text.matchAll(/\bPPh\s*(?:Pasal\s*)?(?:22|23)\b/gi));

    for (const match of matches.reverse()) {
      const start = match.index!;
      const end = start + match[0].length;
      let cursor = 0;
      let first = -1;
      let last = -1;
      let a = 0;
      let b = 0;

      for (let i = 0; i < nodes.length; i++) {
        const n = (nodes[i] as any).textContent.length;
        if (first < 0 && start < cursor + n) {
          first = i;
          a = start - cursor;
        }
        if (end <= cursor + n) {
          last = i;
          b = end - cursor;
          break;
        }
        cursor += n;
      }

      if (first < 0 || last < 0) {
        throw new Error("Nama pajak pada Word belum dapat diperbarui.");
      }

      if (first === last) {
        (nodes[first] as any).textContent =
          (nodes[first] as any).textContent.slice(0, a) +
          label +
          (nodes[first] as any).textContent.slice(b);
      } else {
        (nodes[first] as any).textContent =
          (nodes[first] as any).textContent.slice(0, a) + label;
        for (let i = first + 1; i < last; i++) {
          (nodes[i] as any).textContent = "";
        }
        (nodes[last] as any).textContent = (nodes[last] as any).textContent.slice(b);
      }
      replaced++;
    }
  }
  return replaced;
}

function forceBlackWordText(doc: any): void {
  for (const r of Array.from(doc.getElementsByTagNameNS(W, "r"))) {
    const hasT = (r as any).getElementsByTagNameNS(W, "t").length > 0;
    if (!hasT) continue;
    let rp = direct(r, "rPr");
    if (!rp) {
      rp = doc.createElementNS(W, "w:rPr");
      (r as any).prepend(rp);
    }
    let color = direct(rp, "color");
    if (!color) {
      color = doc.createElementNS(W, "w:color");
      rp.append(color);
    }
    color.setAttributeNS(W, "w:val", "000000");
    for (const name of ["themeColor", "themeTint", "themeShade"]) {
      color.removeAttributeNS(W, name);
    }
  }
}

function updateDetailTables(
  doc: any,
  db: any,
  calculation: any,
  dbNamespace: string,
  storeItemId: string
): void {
  const allTables = Array.from(doc.getElementsByTagNameNS(W, "tbl"));
  const tables = allTables.filter(
    (t: any) =>
      getAttribute(direct(direct(t, "tblPr"), "tblCaption"), "val") === "SPJ_RINCIAN"
  );

  if (tables.length !== 5) {
    throw new Error("Kelima tabel rincian tidak ditemukan pada template SPJ.");
  }

  let nextId = Math.max(
    700000,
    ...Array.from(doc.getElementsByTagNameNS(W, "id")).map(
      (e: any) => Number(getAttribute(e, "val")) || 0
    )
  );

  const make = (name: string, attrs: Record<string, any> = {}) => {
    const e = doc.createElementNS(W, "w:" + name);
    for (const [k, v] of Object.entries(attrs)) {
      e.setAttributeNS(W, "w:" + k, String(v));
    }
    return e;
  };

  const columns = ["description", "unit", "quantity", "unitPrice", "base", "ppn", "total"];
  const itemData = calculation.spending.items.map((item: any) => ({
    description: [item.description, (item.detail || "").trim()].filter(Boolean).join("\n"),
    unit: item.unit,
    quantity: String(item.quantity).replace(".", ","),
    unitPrice: digits(item.unitPriceNum),
    base: digits(item.base),
    ppn: digits(item.ppn),
    total: digits(item.total),
  }));

  for (const old of Array.from(db.documentElement.children).filter(
    (e: any) => e.namespaceURI === dbNamespace && e.localName === "items"
  )) {
    (old as any).remove();
  }

  const itemsNode = db.createElementNS(dbNamespace, "s:items");
  for (const item of itemData) {
    const node = db.createElementNS(dbNamespace, "s:item");
    for (const [key, value] of Object.entries(item)) {
      const leaf = db.createElementNS(dbNamespace, "s:" + key);
      leaf.textContent = value as string;
      node.append(leaf);
    }
    itemsNode.append(node);
  }

  const baseNode = db.createElementNS(dbNamespace, "s:jumlah_sebelum_ppn");
  baseNode.textContent = digits(calculation.spending.base);
  db.documentElement.append(itemsNode, baseNode);

  function cellValue(
    cell: any,
    text: string,
    key: string | null = null,
    itemIndex: number | null = null,
    colIndex: number = 1,
    header: boolean = false
  ) {
    let p = Array.from(cell.children).find(
      (e: any) => e.namespaceURI === W && e.localName === "p"
    );
    if (!p) {
      p = make("p");
      cell.append(p);
    }

    const oldRp = Array.from((p as any).getElementsByTagNameNS(W, "rPr"))[0];
    const rp = oldRp ? (oldRp as any).cloneNode(true) : make("rPr");

    for (const e of Array.from((p as any).children)) {
      if ((e as any).namespaceURI !== W || (e as any).localName !== "pPr") {
        (e as any).remove();
      }
    }
    for (const other of Array.from(cell.children).filter(
      (e: any) => e.namespaceURI === W && e.localName === "p" && e !== p
    )) {
      (other as any).remove();
    }

    let pp = direct(p, "pPr");
    if (!pp) {
      pp = make("pPr");
      (p as any).prepend(pp);
    }

    let jc = direct(pp, "jc");
    if (!jc) {
      jc = make("jc");
      pp.insertBefore(jc, direct(pp, "rPr") || null);
    }
    jc.setAttributeNS(
      W,
      "w:val",
      header ? "center" : colIndex === 1 ? "left" : colIndex >= 3 ? "right" : "center"
    );

    const size = header ? 20 : 21;
    for (const props of [rp, direct(pp, "rPr")].filter(Boolean)) {
      direct(props, "sz")?.remove();
      direct(props, "szCs")?.remove();
      props.append(make("sz", { val: size }), make("szCs", { val: size }));
    }

    const r = make("r");
    r.append(rp);

    for (const [idx, line] of String(text).split(/\r\n?|\n/).entries()) {
      if (idx) r.append(make("br"));
      const t = make("t");
      t.setAttributeNS(
        "http://www.w3.org/XML/1998/namespace",
        "xml:space",
        "preserve"
      );
      t.textContent = line;
      r.append(t);
    }

    if (!key) {
      (p as any).append(r);
      return;
    }

    const control = make("sdt");
    const pr = make("sdtPr");
    const item = itemIndex !== null;

    pr.append(make("alias", { val: item ? "Belanja " + (itemIndex + 1) + " " + key : key }));
    pr.append(make("tag", { val: item ? "spj:item:" + itemIndex + ":" + key : "spj:" + key }));
    pr.append(make("id", { val: ++nextId }));
    pr.append(make("lock", { val: "sdtLocked" }));
    pr.append(
      make("dataBinding", {
        prefixMappings: "xmlns:s='" + dbNamespace + "'",
        xpath: item
          ? "/s:data[1]/s:items[1]/s:item[" + (itemIndex + 1) + "]/s:" + key + "[1]"
          : "/s:data[1]/s:" + key + "[1]",
        storeItemID: storeItemId,
      })
    );
    pr.append(make("text", key === "description" ? { multiLine: "1" } : {}));
    control.append(pr);
    const content = make("sdtContent");
    content.append(r);
    control.append(content);
    (p as any).append(control);
  }

  for (const table of tables) {
    const rows = Array.from((table as any).children).filter(
      (e: any) => e.namespaceURI === W && e.localName === "tr"
    );
    if (rows.length !== 3) {
      throw new Error("Struktur awal tabel rincian berbeda dari template.");
    }

    const [header, prototype, totalRow] = rows;
    const cells = Array.from((prototype as any).children).filter(
      (e: any) => e.namespaceURI === W && e.localName === "tc"
    );
    if (cells.length !== 6) {
      throw new Error("Tabel rincian harus memiliki enam kolom.");
    }

    let hp = direct(header, "trPr");
    if (!hp) {
      hp = make("trPr");
      (header as any).prepend(hp);
    }
    if (!direct(hp, "tblHeader")) hp.append(make("tblHeader"));

    const headerCells = Array.from((header as any).children).filter(
      (e: any) => e.localName === "tc"
    );
    const priceBasis =
      calculation.spending.basis === "included" ? "dengan PPN" : "sebelum PPN";
    const labels = [
      "No",
      "Uraian Pekerjaan / Komponen",
      "Satuan",
      "Vol.",
      "Harga satuan\n(Rp)\n" + priceBasis,
      "Sebelum PPN\n(Rp)",
      "PPN\n(Rp)",
      "Total termasuk\nPPN (Rp)",
    ];

    for (const [index, label] of labels.entries()) {
      const cell = headerCells[index] || (headerCells[5] as any).cloneNode(true);
      if (index >= 6) (header as any).append(cell);
      cellValue(cell, label, null, null, index, true);
    }

    for (let index = 0; index < itemData.length; index++) {
      const row = (prototype as any).cloneNode(true);
      const rowCells = Array.from((row as any).children).filter(
        (e: any) => e.namespaceURI === W && e.localName === "tc"
      );
      for (const h of Array.from((row as any).getElementsByTagNameNS(W, "trHeight"))) {
        (h as any).remove();
      }
      for (let col = 6; col < 8; col++) {
        const cell = (rowCells[5] as any).cloneNode(true);
        rowCells.push(cell);
        (row as any).append(cell);
      }
      let trp = direct(row, "trPr");
      if (!trp) {
        trp = make("trPr");
        (row as any).prepend(trp);
      }
      if (!direct(trp, "cantSplit")) trp.append(make("cantSplit"));

      const item = itemData[index];
      cellValue(rowCells[0], String(index + 1) + ".", null, null, 0);
      for (const [j, key] of columns.entries()) {
        cellValue(rowCells[j + 1], item[key], key, index, j + 1);
      }
      (table as any).insertBefore(row, totalRow);
    }

    (prototype as any).remove();

    const totalCell = Array.from((totalRow as any).children)
      .filter((e: any) => e.localName === "tc")
      .slice(-1)[0];

    for (const [index, key, value] of [
      [5, "jumlah_sebelum_ppn", calculation.spending.base],
      [6, "ppn", calculation.spending.ppn],
    ]) {
      const cell = (totalCell as any).cloneNode(true);
      (totalRow as any).insertBefore(cell, totalCell);
      cellValue(cell, digits(value as number), key as string, null, index as number);
    }
    cellValue(totalCell, digits(calculation.spending.total), "nilai_total", null, 7);

    const widths = [475, 2940, 780, 540, 1280, 1370, 1080, 1510];
    let grid = direct(table, "tblGrid");
    if (!grid) {
      grid = make("tblGrid");
      const firstRow = Array.from((table as any).children).find(
        (e: any) => e.localName === "tr"
      );
      (table as any).insertBefore(grid, firstRow);
    }
    for (const e of Array.from((grid as any).children)) (e as any).remove();
    for (const width of widths) grid.append(make("gridCol", { w: width }));

    let tp = direct(table, "tblPr");
    if (!tp) {
      tp = make("tblPr");
      (table as any).prepend(tp);
    }
    let layout = direct(tp, "tblLayout");
    if (!layout) {
      layout = make("tblLayout");
      tp.append(layout);
    }
    layout.setAttributeNS(W, "w:type", "fixed");

    const margins = make("tblCellMar");
    for (const [side, width] of [
      ["top", 24],
      ["left", 56],
      ["bottom", 24],
      ["right", 56],
    ]) {
      margins.append(make(side as string, { w: width, type: "dxa" }));
    }
    direct(tp, "tblCellMar")?.remove();
    tp.insertBefore(margins, direct(tp, "tblLook") || null);
  }
}

export async function generateSpjDocx(
  inputValues: Record<string, any>,
  items: SpjItemInput[],
  includeMaster: boolean = false
): Promise<Uint8Array> {
  const template = getSpjTemplate();
  const calculation = computeSpj(inputValues, items, template.fields);

  if (calculation.errors.length > 0) {
    throw new Error(calculation.errors[0]);
  }

  const pLabel = pphLabel(inputValues.pph_type || "23");

  const zip = await JSZip.loadAsync(template.templateBase64, {
    base64: true,
    checkCRC32: true,
  });

  const doc = parseXml(await zip.file("word/document.xml")!.async("string"));

  if (!includeMaster) {
    for (const s of Array.from(doc.getElementsByTagNameNS(W, "sdt"))) {
      const p = direct(s, "sdtPr");
      const t = p && direct(p, "tag");
      if (getAttribute(t, "val") === "SPJ_DATA_UTAMA") {
        (s as any).remove();
      }
    }
  }

  linkHandoverDates(doc);
  applyPphWordLabel(doc, pLabel);

  let updated = 0;
  for (const s of Array.from(doc.getElementsByTagNameNS(W, "sdt"))) {
    const pr = direct(s, "sdtPr");
    const tag = pr && getAttribute(direct(pr, "tag"), "val");
    if (!tag?.startsWith("spj:")) continue;
    const key = tag.slice(4);
    if (!Object.hasOwn(calculation.data, key)) {
      throw new Error("Data template tidak lengkap untuk " + key + ".");
    }
    const content = direct(s, "sdtContent");
    const ts = Array.from((content as any).getElementsByTagNameNS(W, "t"));
    if (!ts.length) {
      throw new Error("Isian Word tidak ditemukan untuk " + key + ".");
    }
    (ts[0] as any).textContent = calculation.data[key];
    for (const t of ts.slice(1)) (t as any).textContent = "";

    for (const r of Array.from((content as any).getElementsByTagNameNS(W, "r"))) {
      let rp = direct(r, "rPr");
      if (!rp) {
        rp = doc.createElementNS(W, "w:rPr");
        (r as any).prepend(rp);
      }
      let color = direct(rp, "color");
      if (!color) {
        color = doc.createElementNS(W, "w:color");
        rp.append(color);
      }
      color.setAttributeNS(W, "w:val", "000000");
      color.removeAttributeNS(W, "themeColor");
      color.removeAttributeNS(W, "themeTint");
      color.removeAttributeNS(W, "themeShade");
    }
    updated++;
  }

  const expected =
    Object.values(template.counts).reduce((a, b) => a + b, 0) +
    (includeMaster ? template.fields.length : 0);

  if (updated !== expected) {
    throw new Error(
      `Jumlah isian Word (${updated}) berbeda dari template (${expected}). Pembuatan dihentikan agar tidak ada data tertinggal.`
    );
  }

  const db = parseXml(await zip.file("customXml/item2.xml")!.async("string"));

  for (const [key, value] of Object.entries(calculation.data)) {
    let e = db.getElementsByTagNameNS(template.dataNamespace, key)[0];
    if (!e && key === "hari_penyerahan") {
      e = db.createElementNS(template.dataNamespace, "spj:hari_penyerahan");
      db.documentElement.append(e);
    }
    if (!e) {
      throw new Error("Sumber data Word tidak ditemukan untuk " + key + ".");
    }
    e.textContent = value;
  }

  updateDetailTables(doc, db, calculation, template.dataNamespace, template.store);
  forceBlackWordText(doc);

  zip.file("word/document.xml", new XMLSerializer().serializeToString(doc));
  zip.file("customXml/item2.xml", new XMLSerializer().serializeToString(db));

  for (const name of Object.keys(zip.files).filter(
    (n) => /^word\/.*\.xml$/.test(n) && n !== "word/document.xml"
  )) {
    const part = parseXml(await zip.file(name)!.async("string"));
    if (
      part.getElementsByTagNameNS(W, "r").length ||
      part.getElementsByTagNameNS(W, "rPr").length ||
      part.getElementsByTagNameNS(A, "rPr").length
    ) {
      applyPphWordLabel(part, pLabel);
      forceBlackWordText(part);
      zip.file(name, new XMLSerializer().serializeToString(part));
    }
  }

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
