import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | bigint | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "Rp 0";
  const num = typeof amount === "bigint" ? Number(amount) : typeof amount === "string" ? Number(amount.replace(/[^0-9.-]+/g, "")) : amount;
  if (Number.isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}
