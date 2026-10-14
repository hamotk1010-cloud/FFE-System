/**
 * Utility to parse and convert Google Drive share links into direct image URLs.
 */
export function formatGoogleDriveUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  const trimmed = url.trim();

  // Check for common Google Drive URL patterns
  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    const fileId = fileDMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) {
    const fileId = idQueryMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // If already lh3 or drive thumbnail or standard image URL (http/https/data:image)
  return trimmed;
}

/**
 * Extracts Google Drive File ID if present
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];
  const idQueryMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) return idQueryMatch[1];
  return null;
}

/**
 * Currency formatter (Philippine Peso ₱)
 */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

/**
 * Fallback avatar generator using UI Avatars if image fails to load
 */
export function getFallbackAvatarUrl(name: string): string {
  const cleanName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=0284c7&color=fff&bold=true`;
}

/**
 * Default fallback image for FFE asset items by category
 */
export function getFallbackAssetImageUrl(category: string): string {
  switch (category) {
    case 'Furniture':
      return 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?auto=format&fit=crop&w=600&q=80';
    case 'Fixture':
      return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80';
    case 'Equipment':
      return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80';
    default:
      return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80';
  }
}
