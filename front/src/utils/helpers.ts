export function extractArray(res: any): any[] {
  return Array.isArray(res) ? res : (res?.results || res?.data || []);
}

export function getOffsetMonth(year: number, month: number, offset: number): { year: number; month: number } {
  let m = month - 1 + offset;
  const y = year + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return { year: y, month: m + 1 };
}

export function getRandomColor(currentColor?: string): string {
  const curatedColors = [
    '#22C55E', '#10B981', '#059669', '#14B8A6', '#06B6D4',
    '#0EA5E9', '#3B82F6', '#2563EB', '#6366F1', '#4F46E5',
    '#8B5CF6', '#7C3AED', '#A855F7', '#9333EA', '#D946EF',
    '#EC4899', '#DB2777', '#F43F5E', '#E11D48', '#EF4444',
    '#DC2626', '#F97316', '#EA580C', '#F59E0B', '#D97706',
    '#EAB308', '#84CC16', '#65A30D'
  ];
  const available = currentColor
    ? curatedColors.filter(c => c.toLowerCase() !== currentColor.toLowerCase())
    : curatedColors;
  return available[Math.floor(Math.random() * available.length)];
}

