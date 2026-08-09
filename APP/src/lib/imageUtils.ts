/**
 * Utility to format & normalize image URLs.
 * Automatically converts Google Drive share links (file/d/..., open?id=..., uc?id=...)
 * into direct embeddable image URLs via Google's lh3 CDN.
 */
export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Google Drive direct file links:
  // Ex: https://drive.google.com/file/d/1Ioz-lo-8JEU749mY3S1QU_ESYiFghJ2c/view?usp=drive_link
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // Ex: https://drive.google.com/open?id=1Ioz-lo... or https://drive.google.com/uc?id=1Ioz-lo...
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?(?:[^&]+&)*id=([a-zA-Z0-9_-]+)/i);
  if (driveIdMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  return trimmed;
}

/**
 * Normalizes multi-line image URLs text into an array of clean direct image URLs.
 */
export function parseGalleryImagesText(text?: string): string[] {
  if (!text || typeof text !== 'string') return [];
  return text
    .split('\n')
    .map(line => formatImageUrl(line))
    .filter(url => url.length > 0);
}
