// ============================================
// CAREHUB AI AGENT — SHOPIFY OAuth START
// ============================================
// Initiates Shopify OAuth flow.
// User visits /api/auth → redirects to Shopify
// permission screen → user approves → redirects
// back to /api/callback with auth code.
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// --------------------------------------------
// CONFIGURATION
// --------------------------------------------

const SHOPIFY_CONFIG = {
  clientId: process.env.SHOPIFY_CLIENT_ID || '',
  store: process.env.SHOPIFY_STORE || '',
  scopes: [
    'read_products',
    'write_products',
    'read_orders',
    'write_orders',
    'read_themes',
    'write_themes',
    'read_content',
    'write_content',
    'read_script_tags',
    'write_script_tags',
    'read_inventory',
    'write_inventory',
    'read_fulfillments',
    'write_fulfillments',
    'read_customers',
    'read_shipping',
    'write_shipping',
    'read_publications',
    'write_publications',
    'read_price_rules',
    'write_price_rules',
    'read_discounts',
    'write_discounts',
    'read_marketing_events',
    'write_marketing_events',
    'read_locales',
    'read_translations',
    'write_translations',
  ].join(','),
};

// --------------------------------------------
// NONCE GENERATION (CSRF Protection)
// --------------------------------------------

function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

// --------------------------------------------
// GET HANDLER — Start OAuth
// --------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate configuration
    if (!SHOPIFY_CONFIG.clientId) {
      return NextResponse.json({
        error: 'SHOPIFY_CLIENT_ID not configured',
        help: 'Add SHOPIFY_CLIENT_ID to your environment variables in Vercel',
      }, { status: 500 });
    }

    if (!SHOPIFY_CONFIG.store) {
      return NextResponse.json({
        error: 'SHOPIFY_STORE not configured',
        help: 'Add SHOPIFY_STORE (e.g., carehub1.myshopify.com) to your environment variables',
      }, { status: 500 });
    }

    // Get app URL for redirect
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${appUrl}/api/callback`;

    // Generate nonce for CSRF protection
    const nonce = generateNonce();

    // Build Shopify OAuth URL
    const authUrl = new URL(`https://${SHOPIFY_CONFIG.store}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', SHOPIFY_CONFIG.clientId);
    authUrl.searchParams.set('scope', SHOPIFY_CONFIG.scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', nonce);
    authUrl.searchParams.set('grant_options[]', 'per-user');

    // Store nonce in cookie for verification in callback
    const response = NextResponse.redirect(authUrl.toString());

    response.cookies.set('shopify_auth_nonce', nonce, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    console.log('[Auth] OAuth flow started');
    console.log('[Auth] Store:', SHOPIFY_CONFIG.store);
    console.log('[Auth] Redirect URI:', redirectUri);
    console.log('[Auth] Scopes:', SHOPIFY_CONFIG.scopes.split(',').length, 'permissions');

    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auth] Error starting OAuth:', errorMsg);

    return NextResponse.json({
      error: 'Failed to start OAuth flow',
      details: errorMsg,
      help: {
        step1: 'Ensure SHOPIFY_CLIENT_ID is set in Vercel environment variables',
        step2: 'Ensure SHOPIFY_STORE is set (e.g., carehub1.myshopify.com)',
        step3: 'Ensure NEXT_PUBLIC_APP_URL is set to your Vercel deployment URL',
        step4: 'Ensure your Shopify app has the correct redirect URL configured',
      },
    }, { status: 500 });
  }
}
