import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import {
  type ContractState,
  calculateContract,
  prepareContractValues,
  itemLetter,
  tidy,
} from "../domain/contract-calc";
import { getContractTemplate } from "../domain/contract-template";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const W14 = "http://schemas.microsoft.com/office/word/2010/wordml";
const XML = "http://www.w3.org/XML/1998/namespace";

const numberFormat = new Intl.NumberFormat("id-ID");

function direct(parent: any, name: string): any[] {
  const children = Array.from(parent.childNodes || []);
  return children.filter(
    (child: any) =>
      child.nodeType === 1 &&
      (child.namespaceURI === W || child.prefix === "w") &&
      (child.localName === name || child.nodeName === `w:${name}`)
  );
}

function descendants(parent: any, name: string): any[] {
  return Array.from(parent.getElementsByTagNameNS ? parent.getElementsByTagNameNS(W, name) : parent.getElementsByTagName(`w:${name}`));
}

function paragraphRuns(paragraph: any): any[] {
  return descendants(paragraph, "t").filter((node: any) => {
    let ancestor = node.parentNode;
    while (ancestor && !(ancestor.namespaceURI === W && (ancestor.localName === "p" || ancestor.nodeName === "w:p"))) {
      ancestor = ancestor.parentNode;
    }
    return ancestor === paragraph;
  });
}

function writeText(node: any, text: string) {
  node.textContent = text;
  if (/^\s|\s$/.test(text)) {
    node.setAttributeNS(XML, "xml:space", "preserve");
  }
}

function applySpans(paragraph: any, spans: any[], values: Record<string, string>) {
  const runs = paragraphRuns(paragraph);
  let offset = 0;
  const ranges = runs.map((node) => {
    const range = { node, start: offset, end: offset + (node.textContent || "").length };
    offset = range.end;
    return range;
  });

  const original = runs.map((run) => run.textContent || "").join("");

  for (const span of spans.slice().reverse()) {
    if (original.slice(span.start, span.end) !== span.original) {
      throw new Error("Posisi isian Word tidak sesuai dengan dokumen contoh.");
    }
    let replacement = values[span.key];
    if (typeof replacement !== "string") {
      throw new Error(`Isian Word belum lengkap untuk kunci: ${span.key}`);
    }
    if (span.case === "upper") replacement = replacement.toUpperCase();
    if (span.case === "lower") replacement = replacement.toLowerCase();

    const first = ranges.findIndex((range) => range.end > span.start);
    const last = ranges.findIndex((range) => range.end >= span.end);
    if (first < 0 || last < first) {
      throw new Error("Bagian Word tidak dapat diisi.");
    }

    const a = ranges[first];
    const b = ranges[last];

    if (span.key === "decisionDate") {
      const placeholderColor = descendants(a.node.parentNode, "color")[0];
      if (placeholderColor?.getAttributeNS(W, "val") === "FF0000" || placeholderColor?.getAttribute("w:val") === "FF0000") {
        placeholderColor.setAttributeNS(W, "w:val", "000000");
      }
    }

    const before = a.node.textContent.slice(0, span.start - a.start);
    const after = b.node.textContent.slice(span.end - b.start);

    if (first === last) {
      writeText(a.node, before + replacement + after);
    } else {
      writeText(a.node, before + replacement);
      for (let index = first + 1; index < last; index++) {
        writeText(ranges[index].node, "");
      }
      writeText(b.node, after);
    }
  }
}

function setCell(cell: any, text: string) {
  const runs = descendants(cell, "t");
  if (!runs.length) throw new Error("Sel rincian Word tidak ditemukan.");
  writeText(runs[0], text);
  for (const run of runs.slice(1)) writeText(run, "");
}

function cloneRow(doc: any, prototype: any, texts: string[]): any {
  const row = prototype.cloneNode(true);
  const cells = direct(row, "tc");
  if (cells.length !== texts.length) {
    throw new Error(`Kolom rincian Word tidak sesuai. Diharapkan ${cells.length}, didapat ${texts.length}.`);
  }
  cells.forEach((cell, index) => setCell(cell, texts[index]));

  for (const paragraph of descendants(row, "p")) {
    paragraph.removeAttributeNS(W14, "paraId");
    paragraph.removeAttributeNS(W14, "textId");
    paragraph.removeAttribute("w14:paraId");
    paragraph.removeAttribute("w14:textId");
  }
  for (const height of descendants(row, "trHeight")) {
    if (height.getAttributeNS(W, "hRule") === "exact" || height.getAttribute("w:hRule") === "exact") {
      height.setAttributeNS(W, "w:hRule", "atLeast");
    }
  }
  return row;
}

function rabRows(basis: "early" | "final", state: ContractState, result: any): any[] {
  return state.groups.flatMap((group, groupIndex) => [
    { group: true, values: [String(groupIndex + 1), tidy(group.name)] },
    ...group.items.map((item, index) => {
      const amounts = result.groups[groupIndex].items[index];
      return {
        group: false,
        values: [
          itemLetter(index),
          tidy(item.name),
          tidy(item.unit),
          (item.quantity || "").trim().replace(".", ","),
          (item.volume || "").trim().replace(".", ","),
          numberFormat.format(amounts[basis + "Price"] ?? 0n),
          numberFormat.format(amounts[basis] ?? 0n),
        ],
      };
    }),
  ]);
}

function rabTotals(basis: "early" | "final", state: ContractState, result: any) {
  const totals = result.totals[basis];
  return {
    subtotal: numberFormat.format(totals.subtotal),
    vatLabel: "PPN (" + (state.vatRate ?? "11").trim().replace(".", ",") + "%)",
    vat: numberFormat.format(totals.vat),
    total: numberFormat.format(totals.total),
  };
}

function rebuildTable(doc: any, table: any, basis: "early" | "final", state: ContractState, result: any) {
  const rows = direct(table, "tr");
  if (rows.length !== 19) {
    throw new Error("Tabel RAB pada template tidak sesuai.");
  }

  const groupPrototype = rows[1];
  const itemPrototype = rows[2];
  const [subtotalRow, vatRow, totalRow] = rows.slice(-3);

  for (const row of rows.slice(1, -3)) {
    table.removeChild(row);
  }

  for (const row of rabRows(basis, state, result)) {
    const cloned = cloneRow(doc, row.group ? groupPrototype : itemPrototype, row.values);
    table.insertBefore(cloned, subtotalRow);
  }

  const totals = rabTotals(basis, state, result);
  const subtotalCells = direct(subtotalRow, "tc");
  setCell(subtotalCells[subtotalCells.length - 1], totals.subtotal);

  const vatCells = direct(vatRow, "tc");
  setCell(vatCells[0], totals.vatLabel);
  setCell(vatCells[vatCells.length - 1], totals.vat);

  const totalCells = direct(totalRow, "tc");
  setCell(totalCells[totalCells.length - 1], totals.total);
}

export async function generateWordContract(state: ContractState): Promise<Uint8Array> {
  const payload = getContractTemplate();
  const result = calculateContract(state, payload.dateFields);
  if (result.errors.length) {
    throw new Error(result.errors[0]);
  }

  const values = prepareContractValues(state, result, payload.dateFields);
  const zip = await JSZip.loadAsync(payload.template, { base64: true });
  const part = "word/document.xml";
  const fileContent = await zip.file(part)?.async("string");
  if (!fileContent) {
    throw new Error("Berkas word/document.xml tidak ditemukan di dalam template.");
  }

  const document = new DOMParser().parseFromString(fileContent, "application/xml");
  const paragraphs = descendants(document, "p");
  const tables = descendants(document, "tbl");

  for (const entry of payload.paragraphPlan) {
    if (paragraphs[entry.index]) {
      applySpans(paragraphs[entry.index], entry.spans, values);
    }
  }

  if (!values.subactivityTail && paragraphs[3]) {
    paragraphs[3].parentNode.removeChild(paragraphs[3]);
  }

  for (const entry of payload.tablePlan) {
    if (tables[entry.index]) {
      rebuildTable(document, tables[entry.index], entry.basis, state, result);
    }
  }

  zip.file(part, new XMLSerializer().serializeToString(document));
  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 5 },
  });
}

export { generateWordContract as generateContractDocx };
