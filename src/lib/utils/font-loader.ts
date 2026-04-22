import { FONT_OPTIONS } from '../constants/fonts';

export function loadGoogleFont(fontValue: string) {
  const match = FONT_OPTIONS.find((f) => f.value === fontValue);
  if (!match?.google) return;
  const id = `gfont-${match.google}`;
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${match.google}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(link);
}
