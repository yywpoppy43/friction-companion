import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Instrument_Serif({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = IBM_Plex_Sans({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-mono', display: 'swap' });
// Noto Serif SC is loaded as a stylesheet: the browser then fetches only the slices that hold the characters on the page.
const ZH_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&display=swap';

export const metadata: Metadata = {
  title: { default: 'The Counter-Roll', template: '%s · The Counter-Roll' },
  description: 'A personal instrument. The sort places a structure; the examiner logs a miss; both read the converter.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// Applies a saved theme before first paint so there is no flash. Falls through to the system setting.
const themeScript = `(function(){try{var t=localStorage.getItem('counter-roll-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={ZH_CSS} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
