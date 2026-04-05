import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import type { SalaryCurrency } from "@/types";

const SALARY_CURRENCY_LOCALES: Partial<Record<SalaryCurrency, string>> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  KRW: "ko-KR",
  SGD: "en-SG",
  AUD: "en-AU",
  CAD: "en-CA",
  CNY: "zh-CN",
  THB: "th-TH",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy", { locale: vi });
}

function formatSalaryAmount(amount: number, currency: SalaryCurrency) {
  if (currency === "VND" && amount >= 1_000_000) {
    const compact = amount / 1_000_000;
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1).replace(/\.0$/, "")}tr`;
  }

  return amount.toLocaleString(
    currency === "VND" ? "vi-VN" : SALARY_CURRENCY_LOCALES[currency] ?? "en-US"
  );
}

export function formatSalary(
  min: number | null,
  max: number | null,
  currency: SalaryCurrency = "VND"
): string {
  if (min == null && max == null) return "Thỏa thuận";

  const fmt = (n: number) => formatSalaryAmount(n, currency);
  const suffix = ` ${currency}`;

  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}${suffix}`;
  if (min != null) return `Từ ${fmt(min)}${suffix}`;
  return `Đến ${fmt(max!)}${suffix}`;
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildApiUrl(
  path: string,
  params: Record<string, string | number | undefined>
): string {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  return url.toString();
}
