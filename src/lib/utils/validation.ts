export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Reject if it's clearly a color string (e.g. "#FF0000")
  if (isColorString(url)) return false;
  
  // Data URL (base64 images)
  if (url.startsWith('data:image/')) return true;
  
  // Standard HTTP/HTTPS URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const lower = url.toLowerCase();
    return (
      lower.includes('.png') || 
      lower.includes('.jpg') || 
      lower.includes('.jpeg') || 
      lower.includes('.webp') || 
      lower.includes('.svg') ||
      lower.includes('.gif') ||
      lower.includes('blob:') // For local object URLs
    );
  }

  // Filesystem/relative paths (if applicable)
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true; 
  }

  return false;
}

/**
 * Validates if a string is a CSS color.
 * Basic check for hex, rgb, rgba, hsl, etc.
 */
export function isColorString(str: string | null | undefined): boolean {
  if (!str) return false;
  const s = str.trim();
  return (
    s.startsWith('#') || 
    s.toLowerCase().startsWith('rgb') || 
    s.toLowerCase().startsWith('hsl') || 
    s.toLowerCase().startsWith('oklch') ||
    ['transparent', 'currentColor', 'inherit'].includes(s.toLowerCase())
  );
}
