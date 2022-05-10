/**
 * Format Profile Balance
 *
 * @param val Value to format
 * @param small Value length
 *
 * @returns Formatted profile balance
 */

export function formatBalance(val: number | string = 0, small = false) {
  if (Number(val) === 0 && !small) return "0".repeat(3) + "." + "0".repeat(3);
  val = String(val);
  const full = val.split(".")[0];
  if (full.length >= 10) return full;
  if (small) {
    if (full.length >= 5) return full;
    else return val.slice(0, 5);
  }
  return val.slice(0, 10);
}
