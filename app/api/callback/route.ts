// ============================================
// CAREHUB AI AGENT — SHOPIFY OAuth CALLBACK
// ============================================
// Handles the redirect from Shopify after user
// approves the app. Exchanges auth code for
// permanent access token. Validates HMAC signature
// and nonce for security.
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// --------------------------------------------
// CONFIGURATION
// --------------------------------------------

const SHOPIFY_CONFIG = {
  clientId: process.env.SHOPIFY_CLIENT_ID || '',
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
  store: process.env.SHOPIFY_STORE || '',
};

// --------------------------------------------
// HMAC VALIDATION
// --------------------------------------------

function validateHmac(query: Record<string,>, secret: string): boolean {
  const hmac = query.hmac;
  if (!hmac) return false;

  // Build message string from query params (excluding hmac)
  const params = Object.keys(query)
    .filter(key => key !== 'hmac')
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');

  const generatedHmac = createHmac('sha256', secret)
    .update(params)
    .digest('hex');

  // Timing-safe comparison
  if (generatedHmac.length !== hmac.length) return false;

  let result = 0;
  for (let i = 0; i < generatedHmac.length; i++) {
    result |= generatedHmac.charCodeAt(i) ^ hmac.charCodeAt(i);
  }

  return result === 0;
}

// --------------------------------------------
// GET HANDLER — OAuth Callback
// --------------------------------------------

export async function GET(request: NextRequest): Promise {
  const startTime = Date.now();

  try {
    const { searchParams } = request.nextUrl;

    // Extract query parameters
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');
    const timestamp = searchParams.get('timestamp');

    // ------------------------------------------
    // VALIDATION STEP 1: Required parameters
    // ------------------------------------------

    if (!code || !shop || !state) {
      console.error('[Callback] Missing required parameters');
      return NextResponse.json({
        error: 'Missing required OAuth parameters',
        received: { code: !!code, shop: !!shop, state: !!state },
      }, { status: 400 });
    }

    // ------------------------------------------
    // VALIDATION STEP 2: Verify nonce (CSRF)
    // ------------------------------------------

    const storedNonce = request.cookies.get('shopify_auth_nonce')?.value;

    if (!storedNonce || storedNonce !== state) {
      console.error('[Callback] Nonce mismatch — possible CSRF attack');
      console.error('[Callback] Expected:', storedNonce);
      console.error('[Callback] Received:', state);

      return NextResponse.json({
        error: 'State parameter mismatch — authentication failed',
        help: 'Please restart the OAuth flow from /api/auth',
      }, { status: 403 });
    }

    // ------------------------------------------
    // VALIDATION STEP 3: Verify HMAC signature
    // ------------------------------------------

    if (SHOPIFY_CONFIG.clientSecret && hmac) {
      const queryParams: Record = {};
      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      const isValid = validateHmac(queryParams, SHOPIFY_CONFIG.clientSecret);

      if (!isValid) {
        console.error('[Callback] HMAC validation failed');
        return NextResponse.json({
          error: 'HMAC validation failed — request may have been tampered with',
        }, { status: 403 });
      }
    }

    // ------------------------------------------
    // VALIDATION STEP 4: Verify shop domain
    // ------------------------------------------

    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      console.error('[Callback] Invalid shop domain:', shop);
      return NextResponse.json({
        error: 'Invalid shop domain format',
      }, { status: 400 });
    }

    // ------------------------------------------
    // VALIDATION STEP 5: Verify timestamp freshness
    // ------------------------------------------

    if (timestamp) {
      const requestTime = parseInt(timestamp) * 1000;
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes

      if (now - requestTime > maxAge) {
        console.error('[Callback] Timestamp too old');
        return NextResponse.json({
          error: 'Authentication request expired. Please try again.',
        }, { status: 400 });
      }
    }

    // ------------------------------------------
    // EXCHANGE CODE FOR ACCESS TOKEN
    // ------------------------------------------

    console.log('[Callback] All validations passed. Exchanging code for token...');

    const tokenUrl = `https://${shop}/admin/oauth/access_token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_CONFIG.clientId,
        client_secret: SHOPIFY_CONFIG.clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Callback] Token exchange failed:', tokenResponse.status, errorText);

      return NextResponse.json({
        error: 'Failed to exchange authorization code for access token',
        status: tokenResponse.status,
        details: errorText,
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      scope: string;
      expires_in?: number;
      associated_user_scope?: string;
      associated_user?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
      };
    };

    if (!tokenData.access_token) {
      console.error('[Callback] No access token in response:', tokenData);
      return NextResponse.json({
        error: 'No access token received from Shopify',
      }, { status: 500 });
    }

    // ------------------------------------------
    // SUCCESS — TOKEN RECEIVED
    // ------------------------------------------

    const grantedScopes = tokenData.scope?.split(',') || [];

    console.log('[Callback] ✅ Access token received successfully!');
    console.log('[Callback] Shop:', shop);
    console.log('[Callback] Scopes granted:', grantedScopes.length);
    console.log('[Callback] Token prefix:', tokenData.access_token.substring(0, 8) + '...');
    console.log('[Callback] Duration:', Date.now() - startTime, 'ms');

    if (tokenData.associated_user) {
      console.log('[Callback] User:', tokenData.associated_user.email);
    }

    // ------------------------------------------
    // REDIRECT TO SUCCESS PAGE
    // ------------------------------------------

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Build success redirect with info
    const successUrl = new URL(appUrl);
    successUrl.searchParams.set('auth', 'success');
    successUrl.searchParams.set('shop', shop);
    successUrl.searchParams.set('scopes', grantedScopes.length.toString());

    // Create response with redirect
    const response = NextResponse.redirect(successUrl.toString());

    // Clear the nonce cookie
    response.cookies.delete('shopify_auth_nonce');

    // IMPORTANT: In production, you should:
    // 1. Store the access_token securely (encrypted in database/KV)
    // 2. Never expose it to the client
    // 3. Use it server-side only
    //
    // For this setup, the token should be added to Vercel
    // environment variables as SHOPIFY_ACCESS_TOKEN
    //
    // Display token for manual setup (remove in production):
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  🔑 SHOPIFY ACCESS TOKEN RECEIVED               ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Token: ${tokenData.access_token.substring(0, 20)}...`);
    console.log(`║  Shop: ${shop}`);
    console.log(`║  Scopes: ${grantedScopes.length} permissions`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  NEXT STEP:                                     ║');
    console.log('║  Add this token to Vercel env vars as:          ║');
    console.log('║  SHOPIFY_ACCESS_TOKEN =                  ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    // Also store temporarily in a way the frontend can detect success
    response.cookies.set('shopify_auth_status', 'success', {
      httpOnly: false, // Readable by frontend
      secure: true,
      sameSite: 'lax',
      maxAge: 60, // 1 minute
      path: '/',
    });

    // Store token hint (NOT the full token) for UI display
    response.cookies.set('shopify_token_hint', tokenData.access_token.substring(0, 8), {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Callback] Unexpected error:', errorMsg);

    return NextResponse.json({
      error: 'OAuth callback failed',
      details: errorMsg,
      help: {
        step1: 'Ensure SHOPIFY_CLIENT_SECRET is correctly set',
        step2: 'Ensure the redirect URL in Shopify app settings matches your Vercel URL',
        step3: 'Try the OAuth flow again from /api/auth',
      },
    }, { status: 500 });
  }
}
