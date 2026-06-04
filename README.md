# 🤖 CareHub Agent — AI-Powered Shopify Store Automation

> **Complete Shopify store automation with 13 dedicated AI agents.** Design themes, build pages, manage products, fulfill orders, monitor prices, generate content — all from a single command. Runs 24/7 on Vercel, even when your PC is off.

---

## 🚀 Overview

CareHub Agent is an autonomous AI system that manages your entire Shopify dropshipping store. It understands **Roman Urdu** and **English**, requires only a mood description to make design decisions, and runs automated tasks 24/7 via Vercel Cron.

### Key Features

- 🧠 **Dual AI Brain** — Gemini 3.5 Flash + Groq Llama 3.3 70B with smart routing
- 🎨 **AI Theme Designer** — Say "premium dark" and get a complete store redesign
- 🏠 **Homepage Builder** — 10 conversion-optimized sections, one command
- 📦 **Product Page Expert** — 18 high-converting elements with sticky cart
- 🚀 **Landing Page Creator** — Platform-specific pages for FB, Google, TikTok ads
- 💰 **Upsell System** — 8 upsell types including post-purchase & bundles
- 📋 **Product Manager** — CRUD, bulk ops, CJ import with auto-pricing
- 🛒 **Order Fulfillment** — Auto-fulfill via CJ, tracking updates, customer notifications
- 💲 **24/7 Price Monitor** — Checks supplier prices every 6 hours, protects margins
- ✍️ **Content & SEO** — Descriptions, meta tags, blog posts, ad copy, social captions
- 🗂️ **Collections** — Smart/manual collections, auto-organize, preset templates
- 💾 **Persistent Memory** — Remembers preferences, history, supports undo
- 🌐 **Roman Urdu Support** — "Store acha banao" just works

---

## 📁 File Structure

---

## 🧰 Local Development — Run in Browser

Follow these steps to run the CareHub Agent locally and open it in your browser at http://localhost:3000.

Prerequisites
- Node.js >= 18 (LTS recommended)
- npm or yarn
- Git (to clone the repo if needed)

1) Install dependencies

PowerShell / macOS / Linux:
```bash
npm install
# or yarn
yarn install
```

2) Create `.env.local` from `env.example`

You must provide API keys and minimal configuration. Create a copy and fill values.

Windows PowerShell:
```powershell
Copy-Item env.example .env.local
```

Windows CMD:
```cmd
copy env.example .env.local
```

macOS / Linux (bash):
```bash
cp env.example .env.local
```

Open `.env.local` and set at minimum the following values:
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `GEMINI_API_KEY=` (or leave empty for local testing — some features will error)
- `GROQ_API_KEY=`
- `SHOPIFY_STORE=` (e.g., your-shop.myshopify.com)
- `SHOPIFY_CLIENT_ID=` and `SHOPIFY_CLIENT_SECRET=` (required for OAuth flows)
- `SHOPIFY_ACCESS_TOKEN=` (optional — set after OAuth)
- `KV_REST_API_URL=` and `KV_REST_API_TOKEN=` (optional: Vercel KV — memory features may be limited without KV)

Note: For local development you can stub or leave some provider keys empty; the UI will show errors when calling unavailable services. To fully test Shopify OAuth you must set `NEXT_PUBLIC_APP_URL` to your public URL (use a tunnel like `ngrok`), or test OAuth flow on a deployed Vercel preview.

3) Run TypeScript check (optional but recommended)

```bash
npm run type-check
```

4) Run the dev server

```bash
npm run dev
```

By default Next.js will start on `http://localhost:3000`. Open that URL in your browser.

5) Useful tips
- If you need Shopify OAuth testing locally, use a tunneling service (ngrok) and set `NEXT_PUBLIC_APP_URL` to the ngrok URL. Also update the redirect URL in your Shopify app settings to `https://<your-tunnel>/api/callback`.
- If the frontend reports missing tokens, check the server logs (`terminal running npm run dev`) for errors.
- To run a production build locally:
```bash
npm run build
npm start
```

6) Common commands

```bash
# Install
npm install

# Dev server
npm run dev

# Type-check only
npm run type-check

# Lint
npm run lint

# Build + start (production)
npm run build
npm start
```

7) Troubleshooting
- Missing environment variables: ensure `.env.local` is correctly named and in the project root.
- TypeScript errors: run `npm run type-check` to see errors and fix in the files reported.
- If the app complains about Vercel KV, either configure `KV_REST_API_URL` / `KV_REST_API_TOKEN` or mock memory calls in `lib/memory-store.ts` for local testing.

If you want, I can create a `.env.local.example` with minimal placeholder values next.

