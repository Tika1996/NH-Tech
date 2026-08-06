/**
 * Utility to generate clean, professional, sequential reference IDs for NH TECH ERP & Web.
 * Structured Invoice ID Formats:
 *  - Factures Caisse / POS (Vente Magasin): FAC-POS-2026-0001, FAC-POS-2026-0002...
 *  - Factures Commandes Web (Site Web): FAC-WEB-2026-0001, FAC-WEB-2026-0002...
 *  - Factures SAV / Réparations (Atelier): FAC-SAV-2026-0001, FAC-SAV-2026-0002...
 * Other Modules:
 *  - Laptops: LAP-0001, LAP-0002...
 *  - Pièces: PCS-0001, PCS-0002...
 *  - Commandes Web: CMD-2026-0001, CMD-2026-0002...
 *  - Fiches SAV: REP-2026-0001, REP-2026-0002...
 *  - Clients: CLT-0001, CLT-0002...
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
    } else if (prefix.startsWith('FAC-') && idStr.startsWith('FAC')) {
      // Legacy invoice ID fallback (FAC-2026-XXXX, FACT-XXXX, FAC-CMD-XXXX)
      const match = idStr.match(/(\d+)$/);
      if (match && match[1]) {
        const parsedNum = parseInt(match[1], 10);
        if (!isNaN(parsedNum) && parsedNum > maxSeq && parsedNum < 100000) {
          maxSeq = parsedNum;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(paddingLength, '0');

  return `${fullPrefix}${paddedSeq}`;
}
