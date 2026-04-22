'use client';

export const FONT_OPTIONS: Array<{ label: string; value: string; google?: string; category: string }> = [
  { label: 'Inter',            value: 'Inter, sans-serif',              google: 'Inter',             category: 'Sans-serif' },
  { label: 'Roboto',           value: 'Roboto, sans-serif',             google: 'Roboto',            category: 'Sans-serif' },
  { label: 'Poppins',          value: 'Poppins, sans-serif',            google: 'Poppins',           category: 'Sans-serif' },
  { label: 'Montserrat',       value: 'Montserrat, sans-serif',         google: 'Montserrat',        category: 'Sans-serif' },
  { label: 'Raleway',          value: 'Raleway, sans-serif',            google: 'Raleway',           category: 'Sans-serif' },
  { label: 'Nunito',           value: 'Nunito, sans-serif',             google: 'Nunito',            category: 'Sans-serif' },
  { label: 'Lato',             value: 'Lato, sans-serif',               google: 'Lato',              category: 'Sans-serif' },
  { label: 'Oswald',           value: 'Oswald, sans-serif',             google: 'Oswald',            category: 'Display' },
  { label: 'Bebas Neue',       value: 'Bebas Neue, sans-serif',         google: 'Bebas+Neue',        category: 'Display' },
  { label: 'Righteous',        value: 'Righteous, sans-serif',          google: 'Righteous',         category: 'Display' },
  { label: 'Fredoka One',      value: 'Fredoka One, sans-serif',        google: 'Fredoka+One',       category: 'Display' },
  { label: 'Pacifico',         value: 'Pacifico, cursive',              google: 'Pacifico',          category: 'Handwriting' },
  { label: 'Caveat',           value: 'Caveat, cursive',                google: 'Caveat',            category: 'Handwriting' },
  { label: 'Playfair Display', value: 'Playfair Display, serif',        google: 'Playfair+Display',  category: 'Serif' },
  { label: 'Merriweather',     value: 'Merriweather, serif',            google: 'Merriweather',      category: 'Serif' },
  { label: 'Georgia',          value: 'Georgia, serif',                 category: 'Serif' },
  { label: 'Arial',            value: 'Arial, sans-serif',              category: 'System' },
  { label: 'Courier New',      value: 'Courier New, monospace',         category: 'Monospace' },
];

export function loadGoogleFont(fontValue: string) {
  if (typeof document === 'undefined') return;
  const match = FONT_OPTIONS.find((f) => f.value === fontValue);
  if (!match?.google) return;
  const id = `gfont-${match.google}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${match.google}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(link);
}
