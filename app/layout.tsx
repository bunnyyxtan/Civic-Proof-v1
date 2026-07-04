import type {Metadata} from 'next';
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'CivicProof — Neighborhood Native Civic Evidence Engine',
  description: 'CivicProof turns citizen reports into evidence-backed civic case files.',
};



const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display-loaded',
  weight: ['400', '500', '600', '700', '800'],
});

const sansFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
  weight: ['400', '500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-loaded',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var orig = window.fetch;
                  if (orig) {
                    var localFetch = orig;
                    Object.defineProperty(window, 'fetch', {
                      get: function() { return localFetch; },
                      set: function(v) { 
                        console.warn('window.fetch assignment intercepted and handled');
                        localFetch = v; 
                      },
                      configurable: true,
                      enumerable: true
                    });
                  }
                } catch(e) {
                  console.error('Fetch patch failed:', e);
                }
              })();
            `
          }}
        />
      </head>
      <body className="paper-noise" suppressHydrationWarning>{children}</body>
    </html>
  );
}
