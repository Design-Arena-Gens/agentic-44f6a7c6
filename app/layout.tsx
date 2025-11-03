import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Minimal Scraper',
  description: 'A minimalistic web scraping app',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main className="container">
          <header className="header">
            <h1>Minimal Scraper</h1>
          </header>
          {children}
          <footer className="footer">
            <span>Built with Next.js</span>
          </footer>
        </main>
      </body>
    </html>
  );
}
