export function formatBRL(value: number | string | undefined | null): string {
  const num = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
  return (isNaN(num) ? 0 : num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length < 3) return dateString;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}
