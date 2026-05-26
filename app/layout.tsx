// ============================================
// CAREHUB AI AGENT — ROOT LAYOUT
// ============================================
// Next.js 14 App Router root layout.
// Sets up: fonts, metadata, theme, global styles.
// ============================================

import type { Metadata, Viewport } from 'next';
import './globals.css';

// --------------------------------------------
// METADATA
// --------------------------------------------

export const metadata: Metadata = {
  title: 'CareHub Agent — AI-Powered Shopify Automation',
  description: 'Complete Shopify store automation with 13 dedicated AI agents. Design, products, orders, pricing, SEO — all managed by AI.',
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
  icons: {
    icon: 'data:image/svg+xml,<svg>🤖</svg>',
  },
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
    
      
        <link>
        <link>
        <link>
      
      
        {children}
      
    
  );
}
