/**
 * Convert a Prisma Decimal (or nullable/undefined) to a plain number.
 * Prisma returns Decimal objects for `Decimal` schema fields; arithmetic
 * operators and Math functions don't work on them directly.
 */
export function toNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  // Prisma.Decimal has a .toNumber() method
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}
