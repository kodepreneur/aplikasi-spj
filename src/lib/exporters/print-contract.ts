import {
  type ContractState,
  calculateContract,
  prepareContractValues,
  itemLetter,
  tidy,
} from "../domain/contract-calc";
import { getContractTemplate } from "../domain/contract-template";

const numberFormat = new Intl.NumberFormat("id-ID");

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

function updateCellText(tdHtml: string, text: string): string {
  // If td contains <p>...</p>, replace the content inside <p>...</p>
  if (/<p[^>]*>[\s\S]*?<\/p>/i.test(tdHtml)) {
    return tdHtml.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/i, `$1${text}$3`);
  }
  return tdHtml.replace(/(<td[^>]*>)([\s\S]*?)(<\/td>)/i, `$1${text}$3`);
}

function rebuildPrintTable(
  tableHtml: string,
  basis: "early" | "final",
  state: ContractState,
  result: any
): string {
  const tbodyMatch = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return tableHtml;

  const tbodyContent = tbodyMatch[1];
  const trs = tbodyContent.match(/<tr[\s\S]*?<\/tr>/g);
  if (!trs || trs.length !== 18) return tableHtml;

  const groupPrototype = trs[0];
  const itemPrototype = trs[1];
  const subtotalRow = trs[trs.length - 3];
  const vatRow = trs[trs.length - 2];
  const totalRow = trs[trs.length - 1];

  const builtRows: string[] = [];

  for (const row of rabRows(basis, state, result)) {
    const proto = row.group ? groupPrototype : itemPrototype;
    const tds = proto.match(/<td[\s\S]*?<\/td>/g) || [];
    let updatedRow = proto;

    if (row.group) {
      const td0 = tds[0];
      const td1 = tds[1];
      if (td0) {
        updatedRow = updatedRow.replace(td0, updateCellText(td0, row.values[0]));
      }
      if (td1) {
        updatedRow = updatedRow.replace(td1, updateCellText(td1, row.values[1]));
      }
      updatedRow = updatedRow.replace(/<tr/i, '<tr class="print-rab-group"');
    } else {
      for (let i = 0; i < row.values.length && i < tds.length; i++) {
        const td = tds[i];
        if (td) {
          updatedRow = updatedRow.replace(td, updateCellText(td, row.values[i]));
        }
      }
    }

    builtRows.push(updatedRow);
  }

  // Update subtotal, vat, total rows
  const totals = rabTotals(basis, state, result);

  let updatedSubtotalRow = subtotalRow;
  const subTds = subtotalRow.match(/<td[\s\S]*?<\/td>/g) || [];
  if (subTds.length > 0) {
    const lastSubTd = subTds[subTds.length - 1];
    if (lastSubTd) {
      updatedSubtotalRow = updatedSubtotalRow.replace(
        lastSubTd,
        updateCellText(lastSubTd, totals.subtotal)
      );
    }
  }
  builtRows.push(updatedSubtotalRow);

  let updatedVatRow = vatRow;
  const vatTds = vatRow.match(/<td[\s\S]*?<\/td>/g) || [];
  if (vatTds.length > 0) {
    const firstVatTd = vatTds[0];
    const lastVatTd = vatTds[vatTds.length - 1];
    if (firstVatTd) {
      updatedVatRow = updatedVatRow.replace(firstVatTd, updateCellText(firstVatTd, totals.vatLabel));
    }
    if (lastVatTd) {
      updatedVatRow = updatedVatRow.replace(
        lastVatTd,
        updateCellText(lastVatTd, totals.vat)
      );
    }
  }
  builtRows.push(updatedVatRow);

  let updatedTotalRow = totalRow;
  const totalTds = totalRow.match(/<td[\s\S]*?<\/td>/g) || [];
  if (totalTds.length > 0) {
    const lastTotalTd = totalTds[totalTds.length - 1];
    if (lastTotalTd) {
      updatedTotalRow = updatedTotalRow.replace(
        lastTotalTd,
        updateCellText(lastTotalTd, totals.total)
      );
    }
  }
  updatedTotalRow = updatedTotalRow.replace(/<tr/i, '<tr class="print-rab-group"');
  builtRows.push(updatedTotalRow);

  return tableHtml.replace(
    /<tbody>[\s\S]*?<\/tbody>/i,
    `<tbody>\n${builtRows.join("\n")}\n</tbody>`
  );
}

export function generatePrintContractHtml(state: ContractState): string {
  const payload = getContractTemplate();
  const result = calculateContract(state, payload.dateFields);
  if (result.errors.length) {
    throw new Error(result.errors[0]);
  }

  const values = prepareContractValues(state, result, payload.dateFields);
  let html = payload.printTemplate;

  // Replace title
  html = html.replace(/<title>.*?<\/title>/i, `<title>Kontrak – ${tidy(state.packageName)}</title>`);

  // Replace data-print-logo
  const logoDataUri = "data:image/png;base64," + payload.printLogo;
  html = html.replace(/data-print-logo=""/g, `src="${logoDataUri}" data-print-logo=""`);

  // Rebuild all data-print-rab tables
  html = html.replace(
    /<table([^>]*data-print-rab="(early|final)"[^>]*)>([\s\S]*?)<\/table>/gi,
    (match, attrs, basis) => {
      return rebuildPrintTable(match, basis.toLowerCase() as "early" | "final", state, result);
    }
  );

  // Replace simple data-print-field matches
  for (const [key, val] of Object.entries(values)) {
    // Upper case pattern
    const upperRegex = new RegExp(`(<[^>]*data-print-field="${key}"[^>]*data-print-case="upper"[^>]*>)(.*?)(<\\/[^>]+>)`, "g");
    html = html.replace(upperRegex, `$1${val.toUpperCase()}$3`);

    // Lower case pattern
    const lowerRegex = new RegExp(`(<[^>]*data-print-field="${key}"[^>]*data-print-case="lower"[^>]*>)(.*?)(<\\/[^>]+>)`, "g");
    html = html.replace(lowerRegex, `$1${val.toLowerCase()}$3`);

    // Normal pattern
    const normalRegex = new RegExp(`(<[^>]*data-print-field="${key}"(?![^>]*data-print-case)[^>]*>)(.*?)(<\\/[^>]+>)`, "g");
    html = html.replace(normalRegex, `$1${val}$3`);
  }

  // Remove empty subactivityTail paragraph if absent
  if (!values.subactivityTail) {
    html = html.replace(/<p[^>]*><span[^>]*data-print-field="subactivityTail"[^>]*>.*?<\/span><\/p>/gi, "");
  }

  if (!html.startsWith("<!doctype html>")) {
    html = "<!doctype html>\n" + html;
  }

  return html;
}
