export function generateNextInvoiceNo(sequence = 42): string {
  const padded = String(sequence).padStart(4, '0');
  return `INV/2025/05/28-${padded}`;
}

export function formatCurrentTimeHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
