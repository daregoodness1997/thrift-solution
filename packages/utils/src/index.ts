export function formatCurrency(amount: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function generateId(): string {
  return crypto.randomUUID();
}

const PHONE_REGEX = /^(?:\+234|234|0)?([789][01]\d{8})$/;

export function isValidPhoneNumber(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/[\s\-\(\)]/g, ""));
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const match = PHONE_REGEX.exec(cleaned);

  if (!match) {
    throw new Error(`Invalid phone number: ${phone}`);
  }

  const digits = match[1];
  return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export { NIGERIAN_BANKS, getBankByCode } from "./banks";
export type { Bank } from "./banks";
