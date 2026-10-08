// One place that decides what currency the whole platform speaks in and how
// an amount is written. Everything that shows a salary, rate, or filter
// range goes through here, so changing the currency or the style is a
// one-file change instead of a hunt through every page.
//
// Style: number first, thousands separated, currency after — "400,000 AMD".
// Ranges carry the currency once, at the end: "400,000–900,000 AMD".

export const CURRENCY = "AMD";

type Amount = number | string | null | undefined;

// "1800" -> "1,800". Deliberately hand-rolled (not toLocaleString) so the
// server and the browser always produce the exact same text — no locale or
// ICU differences that could cause a hydration mismatch.
export function formatAmount(amount: Amount): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  const [whole, fraction] = String(n).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

// A single amount with its currency: "1,700 AMD".
export function formatMoney(amount: Amount): string {
  const formatted = formatAmount(amount);
  return formatted ? `${formatted} ${CURRENCY}` : "";
}

// A range with the currency written once: "1,600–2,000 AMD".
export function formatMoneyRange(min: Amount, max: Amount): string {
  return `${formatAmount(min)}–${formatMoney(max)}`;
}
