// ============================================
// CAREHUB AI AGENT — ROOT LAYOUT
// ============================================

import type { Metadata, Viewport } from 'next';
import './globals.css';

// --------------------------------------------
// METADATA
// --------------------------------------------

export const metadata: Metadata = {
  title: 'CareHub Agent — AI-Powered Shopify Automation',
  description:
    'Complete Shopify store automation with 13 dedicated AI agents. Design, products, orders, pricing, SEO — all managed by AI.',
  keywords: [
    'shopify automation',
    'ai agent',
    'dropshipping',
    'store management',
    'carehub',
  ],
  authors: [{ name: 'CareHub' }],
  creator: 'CareHub AI Agent System',
  robots: 'noindex, nofollow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
};

// --------------------------------------------
// ROOT LAYOUT
// --------------------------------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0a0a0f',
          color: '#f0f0f5',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
