/**
 * Clean currency formatting that safely prevents double dollar signs ('$$')
 * regardless of whether the input is a raw number, numeric string, or already
 * formatted string like "$1,250.00" or "$ 0.00".
 */
export function formatMoney(val: any): string {
  if (val == null || val === "") return "$0.00";
  const str = String(val).trim();
  if (str.startsWith("$")) {
    // Strip leading dollar signs and optional whitespace, keeping a single '$'
    const cleaned = str.replace(/^\$+\s*/, "");
    return cleaned ? `$${cleaned}` : "$0.00";
  }
  const num = parseFloat(str.replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return str;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
