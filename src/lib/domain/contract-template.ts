import fs from "node:fs";
import path from "node:path";

export interface DateFieldDef {
  key: string;
  label: string;
  optional?: boolean;
  legacy?: string | null;
}

export interface LetterDef {
  title: string;
  date?: string;
  number?: string;
  note?: string;
  dateLinks?: number;
  numberLinks?: number;
}

export interface LetterGroupDef {
  title: string;
  letters: LetterDef[];
}

export interface TablePlanEntry {
  index: number;
  basis: "early" | "final";
  label: string;
}

export interface ParagraphSpan {
  start: number;
  end: number;
  key: string;
  original: string;
  case?: "upper" | "lower" | "";
}

export interface ParagraphPlanEntry {
  index: number;
  spans: ParagraphSpan[];
}

export interface ContractTemplatePayload {
  defaults: Record<string, any>;
  dateFields: DateFieldDef[];
  letterGroups: LetterGroupDef[];
  tablePlan: TablePlanEntry[];
  paragraphPlan: ParagraphPlanEntry[];
  template: string; // Base64 docx
  printTemplate: string; // HTML string
  printLogo: string; // Base64 png
  counts: Record<string, number>;
}

let cachedTemplate: ContractTemplatePayload | null = null;

export function getContractTemplate(): ContractTemplatePayload {
  if (cachedTemplate) return cachedTemplate;

  const templatePath = path.join(process.cwd(), "templates", "kontrak.json");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Berkas template kontrak tidak ditemukan pada: ${templatePath}`);
  }

  const raw = fs.readFileSync(templatePath, "utf-8");
  cachedTemplate = JSON.parse(raw) as ContractTemplatePayload;
  return cachedTemplate;
}
