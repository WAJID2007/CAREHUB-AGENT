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

carehub-agent/ ├── package.json ├── tsconfig.json ├── next.config.mjs ├── vercel.json ← Cron job config (every 6 hours) ├── .env.example ← Environment variables template ├── .gitignore ├── README.md ├── lib/ │ ├── shopify.ts ← Shopify Admin API client │ ├── groq.ts ← Groq AI client (Llama 3.3 70B) │ ├── gemini.ts ← Gemini 3.5 Flash client │ ├── memory-store.ts ← Persistent memory (Vercel KV) │ └── suppliers/ │ ├── base.ts ← Supplier interface (all suppliers implement this) │ ├── cj.ts ← CJ Dropshipping integration │ └── index.ts ← Supplier registry & multi-supplier routing ├── agents/ │ ├── ai-router.ts ← Smart AI routing (Groq vs Gemini) │ ├── orchestrator.ts ← Master controller (interprets commands) │ ├── memory.ts ← Context & preference management │ ├── theme-designer.ts ← Complete theme design & CSS generation │ ├── homepage.ts ← Homepage builder (10 sections) │ ├── product-page.ts ← High-converting product page (18 elements) │ ├── landing-page.ts ← Ad landing pages (FB/Google/TikTok) │ ├── upsell-bundle.ts ← 8 upsell types │ ├── product-manager.ts ← Product CRUD + CJ import │ ├── order-fulfillment.ts ← Order processing + tracking │ ├── price-monitor.ts ← 24/7 price monitoring │ ├── content-seo.ts ← Content generation (16 types) │ └── collections.ts ← Collection management ├── app/ │ ├── layout.tsx ← Root layout (fonts, meta) │ ├── globals.css ← Premium dark theme styles │ ├── page.tsx ← Dashboard UI (chat + quick actions) │ └── api/ │ ├── agent/route.ts ← Main agent endpoint (POST + GET) │ ├── auth/route.ts ← Shopify OAuth start │ ├── callback/route.ts← Shopify OAuth callback │ └── cron/route.ts ← 24/7 automated tasks

---

## ⚡ Quick Start

### 1. Clone & Deploy

```bash
# Fork or clone this repo
git clone https://github.com/YOUR_USERNAME/CAREHUB-AGENT.git

# Deploy to Vercel (free)
# Connect your GitHub repo at vercel.com/new
2. Get API Keys (All Free)
Service	URL	Free Tier
Gemini AI	https://aistudio.google.com/apikey	60 req/min
Groq AI	https://console.groq.com/keys	30 req/min
CJ Dropshipping	https://developers.cjdropshipping.com	Unlimited
Vercel KV	Vercel Dashboard → Storage → KV	30K req/month
3. Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
SHOPIFY_STORE=yourstore.myshopify.com
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret
SHOPIFY_ACCESS_TOKEN=your_token (after OAuth)
CJ_API_KEY=your_cj_key
CJ_EMAIL=your_cj_email
KV_REST_API_URL=auto_from_vercel_kv
KV_REST_API_TOKEN=auto_from_vercel_kv
CRON_SECRET=any_random_string_32_chars
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DEFAULT_PROFIT_MARGIN=40
4. Connect Shopify
Visit https://your-app.vercel.app/api/auth
Approve permissions on Shopify
Copy access token from Vercel logs
Add as SHOPIFY_ACCESS_TOKEN in Vercel env vars
Redeploy
5. Start Using!
Visit https://your-app.vercel.app and start commanding your agents:

"Store ki theme luxury dark gold banao"
"Homepage best banao with countdown timer"
"CJ se trending products import karo"
"Sab orders fulfill karo"
"Prices check karo abhi"
