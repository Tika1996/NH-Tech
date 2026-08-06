/**
 * Utility to generate clean, professional, sequential reference IDs for NH TECH ERP & Web.
 * Format examples:
 *  - Commandes: CMD-2026-0001, CMD-2026-0002...
 *  - Factures / Caisse: FAC-2026-0001, FAC-2026-0002...
 *  - Laptops: LAP-0001, LAP-0002...
 *  - Pièces: PCS-0001, PCS-0002...
 */

export function generateNextId(
  existingItems: { id?: string }[] | string[] | undefined | null,
  prefix: string,
  includeYear: boolean = false,
  paddingLength: number = 4
): string {
  const currentYear = new Date().getFullYear();
  const fullPrefix = includeYear ? `${prefix}-${currentYear}-` : `${prefix}-`;

  let maxSeq = 0;
  const items = existingItems || [];

  for (const item of items) {
    const idStr = typeof item === 'string' ? item : item?.id;
    if (!idStr) continue;

    if (idStr.startsWith(fullPrefix)) {
      const numPart = idStr.substring(fullPrefix.length);
      const parsedNum = parseInt(numPart, 10);
      if (!isNaN(parsedNum) && parsedNum > maxSeq && parsedNum < 1000000) {
        maxSeq = parsedNum;
      }
    } else if (idStr.startsWith(`${prefix}-`)) {
      const regex = new RegExp(`^${prefix}-(?:\\d{4}-)?(\\d+)`);
      const match = idStr.match(regex);
      if (match && match[1]) {
        const parsedNum = parseInt(match[1], 10);
        if (!isNaN(parsedNum) && parsedNum > maxSeq && parsedNum < 1000000) {
          maxSeq = parsedNum;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(paddingLength, '0');

  return `${fullPrefix}${paddedSeq}`;
}
