export function extractArray(res: any): any[] {
  return Array.isArray(res) ? res : (res?.results || res?.data || []);
}

export function getOffsetMonth(year: number, month: number, offset: number): { year: number; month: number } {
  let m = month - 1 + offset;
  const y = year + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return { year: y, month: m + 1 };
}
