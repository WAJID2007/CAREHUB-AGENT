// ============================================
// CAREHUB AI AGENT — LANDING PAGE (AGENT #7)
// ============================================
// Creates high-converting landing pages for paid ads.
// Features:
// - Single CTA focus (no distractions)
// - Strong headline + subheadline
// - Social proof elements
// - Urgency/scarcity
// - Mobile-first design
// - Fast loading (minimal elements)
// - A/B test ready
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient } from '@/lib/shopify';
import { GeminiMessage } from '@/lib/gemini';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface LandingPageRequest {
  productTitle?: string;
  productUrl?: string;
  productPrice?: string;
  productImage?: string;
  adPlatform?: 'facebook' | 'google' | 'tiktok' | 'instagram' | 'general';
  goal?: 'purchase' | 'add_to_cart' | 'lead' | 'signup';
  mood?: string;
  headline?: string;
  benefits?: string[];
  testimonials?: LPTestimonial[];
  urgency?: boolean;
  customInstructions?: string;
  variant?: 'A' | 'B';
}

export interface LandingPageResult {
  success: boolean;
  pageHandle: string;
  pageUrl: string;
  liquidCode: string;
  cssCode: string;
  applied: boolean;
  message: string;
  abVariant?: string;
}

export interface LPTestimonial {
  name: string;
  text: string;
  rating: number;
  image?: string;
}

export interface LPContent {
  headline: string;
  subheadline: string;
  benefits: string[];
  ctaText: string;
  urgencyText: string;
  socialProofText: string;
  guaranteeText: string;
  faqItems: Array<{ question: string; answer: string }>;
}

// --------------------------------------------
// LANDING PAGE BUILDER CLASS
// --------------------------------------------

export class LandingPageBuilder {
  private router: AIRouter;
  private memory: MemoryAgent;
  private shopify: ShopifyClient;

  constructor() {
    this.router = getAIRouter();
    this.memory = getMemoryAgent();
    this.shopify = getShopifyClient();
  }

  // --------------------------------------------
  // MAIN BUILD METHOD
  // --------------------------------------------

  async buildLandingPage(request: LandingPageRequest): Promise<LandingPageResult> {
    try {
      const preferences = await this.memory.getPreferences();
      const mood = request.mood || preferences.mood || 'premium';

      // Step 1: Generate content via AI
      const content = await this.generateContent(request, mood);

      // Step 2: Build page code
      const liquidCode = this.generateLiquid(request, content, mood);
      const cssCode = this.generateCSS(mood);

      // Step 3: Create page on Shopify
      let applied = false;
      let pageHandle = '';
      let pageUrl = '';

      if (this.shopify.isConfigured()) {
        const result = await this.createShopifyPage(request, liquidCode, cssCode);
        applied = result.success;
        pageHandle = result.handle;
        pageUrl = result.url;
      } else {
        pageHandle = this.generateHandle(request.productTitle || 'landing-page');
        pageUrl = `/pages/${pageHandle}`;
      }

      // Step 4: Save to memory
      await this.memory.logAction({
        agent: 'landing-page',
        action: 'create_landing_page',
        input: JSON.stringify(request),
        output: `Created landing page: ${pageUrl}`,
        success: true,
        duration: 0,
        reversible: true,
        undoData: { pageHandle },
      });

      return {
        success: true,
        pageHandle,
        pageUrl,
        liquidCode,
        cssCode,
        applied,
        message: applied
          ? `✅ Landing page created and live at: ${pageUrl}`
          : `✅ Landing page generated! Connect Shopify to publish.`,
        abVariant: request.variant,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        pageHandle: '',
        pageUrl: '',
        liquidCode: '',
        cssCode: '',
        applied: false,
        message: `❌ Error creating landing page: ${errMsg}`,
      };
    }
  }

  // --------------------------------------------
  // AI CONTENT GENERATION
  // --------------------------------------------

  private async generateContent(request: LandingPageRequest, mood: string): Promise<LPContent> {
    const prompt = `Create high-converting landing page content for a paid ad campaign.

Product: ${request.productTitle || 'Premium product'}
Price: ${request.productPrice || 'Not specified'}
Ad Platform: ${request.adPlatform || 'general'}
Goal: ${request.goal || 'purchase'}
Mood: ${mood}
Target Audience: US/UK online shoppers

Return ONLY valid JSON:
{
  "headline": "powerful 5-10 word headline that creates desire (use power words)",
  "subheadline": "15-25 word subheadline that expands on the promise",
  "benefits": ["benefit 1 with emoji", "benefit 2 with emoji", "benefit 3 with emoji", "benefit 4 with emoji", "benefit 5 with emoji", "benefit 6 with emoji"],
  "ctaText": "action-oriented button text (max 5 words)",
  "urgencyText": "urgency message that creates FOMO",
  "socialProofText": "social proof statement with numbers",
  "guaranteeText": "risk-reversal guarantee statement",
  "faqItems": [
    {"question": "common objection as question", "answer": "reassuring answer"},
    {"question": "common objection as question", "answer": "reassuring answer"},
    {"question": "common objection as question", "answer": "reassuring answer"}
  ]
}

Rules:
- Headline MUST stop scrolling — use curiosity, benefit, or shock
- Benefits should be specific and tangible (not generic)
- CTA should create urgency without being pushy
- Social proof should include specific numbers
- FAQ should overcome purchase objections
- Everything should feel exclusive and premium
- Consider the ad platform: ${request.adPlatform === 'facebook' ? 'emotional, visual' : request.adPlatform === 'google' ? 'intent-based, specific' : request.adPlatform === 'tiktok' ? 'trendy, casual' : 'balanced'}`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGeminiJSON(messages, 'creative_writing');

    if (response.success && response.data) {
      return response.data;
    }

    // Fallback content
    return {
      headline: request.headline || 'Transform Your Life With Premium Quality',
      subheadline: 'Join thousands of happy customers who made the switch. Premium quality at an unbeatable price.',
      benefits: [
        '✅ Premium quality materials',
        '🚚 Free express shipping',
        '💰 30-day money-back guarantee',
        '⭐ Rated 4.9/5 by 2,000+ customers',
        '🔒 Secure & encrypted checkout',
        '🎁 Special launch pricing — save 40%',
      ],
      ctaText: 'Get Yours Now — 40% Off',
      urgencyText: '⚡ Sale ends tonight! Only 17 left at this price.',
      socialProofText: '★★★★★ 2,347 happy customers and counting',
      guaranteeText: "Try it risk-free. If you don't love it, get a full refund. No questions asked.",
      faqItems: [
        { question: "How long does shipping take?", answer: "We offer free shipping that arrives in 7-15 business days with full tracking." },
        { question: "What if I don't like it?", answer: "30-day money-back guarantee. Return it for a full refund, no questions asked." },
        { question: "Is this website secure?", answer: "Yes! We use bank-level 256-bit SSL encryption to protect your information." },
      ],
    };
  }

  // --------------------------------------------
  // LIQUID GENERATION
  // --------------------------------------------

  private generateLiquid(request: LandingPageRequest, content: LPContent, mood: string): string {
    const productUrl = request.productUrl || '/collections/all';
    const productImage = request.productImage || '';
    const productPrice = request.productPrice || '';
    const testimonials = request.testimonials || [
      { name: 'Sarah M.', text: 'Absolutely love it! Best purchase I made this year.', rating: 5 },
      { name: 'James T.', text: 'Premium quality, fast shipping. Highly recommend!', rating: 5 },
      { name: 'Emily R.', text: 'Exceeded my expectations. Will buy again!', rating: 5 },
    ];

    const benefitsHtml = content.benefits.map(b =>
      `${b}`
    ).join('\n              ');

    const testimonialsHtml = testimonials.map(t =>
      `
                ${'★'.repeat(t.rating)}
                "${t.text}"
                — ${t.name} ✓ Verified
              `
    ).join('\n              ');

    const faqHtml = content.faqItems.map(faq =>
      `
                ${faq.question}
                ${faq.answer}
              `
    ).join('\n              ');

    return `{% comment %}
  ============================================
  CareHub Landing Page — ${request.productTitle || 'Product'}
  Platform: ${request.adPlatform || 'general'}
  Variant: ${request.variant || 'A'}
  Generated: ${new Date().toISOString()}
  ============================================
{% endcomment %}

{% layout none %}



  
  
  ${content.headline} | {{ shop.name }}
  
  
  
  ${productImage ? `` : ''}
  
  
  {{ 'carehub-landing.css' | asset_url | stylesheet_tag }}
  {{ content_for_header }}



  
  
    ${content.urgencyText}
  

  
  
    
      ${content.socialProofText}
      ${content.headline}
      ${content.subheadline}
      ${productImage ? `
      
        
      ` : ''}
      ${productPrice ? `
      
        ${productPrice}
        + Free Shipping
      ` : ''}
      
        ${content.ctaText}
      
      🔒 Secure Checkout • Free Shipping • 30-Day Guarantee
    
  

  
  
    
      Why You'll Love This
      
        ${benefitsHtml}
      
    
  

  
  
    
      What Customers Are Saying
      
        ${testimonialsHtml}
      
    
  

  
  
    
      
        🛡️
        100% Satisfaction Guaranteed
        ${content.guaranteeText}
      
    
  

  
  
    
      Common Questions
      
        ${faqHtml}
      
    
  

  
  
    
      Ready to Transform Your Experience?
      ${content.urgencyText}
      
        ${content.ctaText}
      
      
        🔒 SSL Secure
        💳 All Cards Accepted
        ↩️ Easy Returns
      
    
  

  
  
    
      ${content.ctaText}
    
  

  
  
  (function(){
    var bar = document.querySelector('.carehub-lp__urgency-bar span');
    if(!bar) return;
    function tick(){
      var now=new Date();var end=new Date();end.setHours(23,59,59);
      var d=end-now;if(d<=0)return;
      var h=Math.floor(d/3600000);var m=Math.floor((d%3600000)/60000);var s=Math.floor((d%60000)/1000);
      bar.innerHTML='⚡ Sale ends in <strong>'+h+'h '+m+'m '+s+'s</strong> — Don\'t miss out!';
    }
    tick();setInterval(tick,1000);
  })();
  

  {{ content_for_layout }}

`;
  }

  // --------------------------------------------
  // CSS GENERATION
  // --------------------------------------------

  private generateCSS(mood: string): string {
    return `
/* ============================================ */
/* CareHub Landing Page CSS — ${mood} */
/* Zero distractions, maximum conversions */
/* ============================================ */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.carehub-lp-body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #0a0a0f;
  color: #e8e8e8;
  line-height: 1.7;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* --- Urgency Bar --- */
.carehub-lp__urgency-bar {
  background: linear-gradient(90deg, #dc2626, #f87171);
  color: #fff;
  text-align: center;
  padding: 10px 20px;
  font-size: 0.85rem;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 100;
  animation: pulse 2s infinite;
}
.carehub-lp__urgency-bar strong {
  color: #fef08a;
}

/* --- Container --- */
.carehub-lp__container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* --- Hero --- */
.carehub-lp__hero {
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f 0%, #12121a 100%);
}
.carehub-lp__hero-content {
  max-width: 700px;
  margin: 0 auto;
}
.carehub-lp__social-badge {
  display: inline-block;
  background: rgba(201, 169, 98, 0.1);
  border: 1px solid rgba(201, 169, 98, 0.3);
  color: #c9a962;
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 24px;
  letter-spacing: 0.02em;
}
.carehub-lp__headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  color: #ffffff;
  line-height: 1.1;
  margin-bottom: 18px;
  letter-spacing: -0.02em;
}
.carehub-lp__subheadline {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #a0a0b0;
  margin-bottom: 30px;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Product Image */
.carehub-lp__product-image {
  margin: 30px auto;
  max-width: 400px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.carehub-lp__product-image img {
  width: 100%;
  height: auto;
  display: block;
}

/* Price */
.carehub-lp__price-section {
  margin-bottom: 24px;
}
.carehub-lp__price {
  font-size: 2rem;
  font-weight: 800;
  color: #c9a962;
}
.carehub-lp__price-note {
  display: block;
  font-size: 0.85rem;
  color: #4ade80;
  margin-top: 4px;
}

/* CTA Button */
.carehub-lp__cta-btn {
  display: inline-block;
  text-decoration: none;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}
.carehub-lp__cta-btn--primary {
  background: linear-gradient(135deg, #c9a962, #e2c275);
  color: #000 !important;
  padding: 18px 40px;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.4);
}
.carehub-lp__cta-btn--primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 35px rgba(201, 169, 98, 0.6);
}
.carehub-lp__cta-btn--large {
  padding: 22px 50px;
  font-size: 1.1rem;
}
.carehub-lp__cta-sub {
  margin-top: 14px;
  font-size: 0.8rem;
  color: #6a6a7a;
}

/* --- Benefits --- */
.carehub-lp__benefits {
  padding: 80px 20px;
  background: #12121a;
}
.carehub-lp__section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: #ffffff;
  text-align: center;
  margin-bottom: 40px;
  font-weight: 800;
}
.carehub-lp__benefit-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.carehub-lp__benefit-item {
  padding: 16px 20px;
  background: #1a1a2e;
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #d4d4d4;
  transition: all 0.3s ease;
}
.carehub-lp__benefit-item:hover {
  border-color: #c9a962;
  transform: translateX(5px);
}

/* --- Testimonials --- */
.carehub-lp__testimonials {
  padding: 80px 20px;
  background: #0a0a0f;
}
.carehub-lp__testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.carehub-lp__testimonial {
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}
.carehub-lp__testimonial:hover {
  border-color: #c9a962;
  transform: translateY(-3px);
}
.carehub-lp__testimonial-stars {
  color: #fbbf24;
  font-size: 1.1rem;
  margin-bottom: 12px;
  letter-spacing: 2px;
}
.carehub-lp__testimonial-text {
  font-size: 0.9rem;
  color: #c8c8d0;
  line-height: 1.6;
  font-style: italic;
  margin-bottom: 12px;
}
.carehub-lp__testimonial-author {
  font-size: 0.8rem;
  color: #4ade80;
  font-weight: 600;
}

/* --- Guarantee --- */
.carehub-lp__guarantee {
  padding: 60px 20px;
  background: #12121a;
}
.carehub-lp__guarantee-box {
  text-align: center;
  padding: 40px;
  background: rgba(74, 222, 128, 0.05);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.carehub-lp__guarantee-icon {
  font-size: 3rem;
  margin-bottom: 14px;
}
.carehub-lp__guarantee-box h3 {
  font-size: 1.3rem;
  color: #fff;
  margin-bottom: 10px;
}
.carehub-lp__guarantee-box p {
  font-size: 0.95rem;
  color: #a0a0b0;
  line-height: 1.6;
}

/* --- FAQ --- */
.carehub-lp__faq {
  padding: 80px 20px;
  background: #0a0a0f;
}
.carehub-lp__faq-list {
  max-width: 600px;
  margin: 0 auto;
}
.carehub-lp__faq-item {
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}
.carehub-lp__faq-item[open] {
  border-color: #c9a962;
}
.carehub-lp__faq-item summary {
  padding: 16px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  background: #12121a;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.carehub-lp__faq-item summary::after {
  content: '+';
  font-size: 1.3rem;
  color: #c9a962;
  transition: transform 0.3s;
}
.carehub-lp__faq-item[open] summary::after {
  transform: rotate(45deg);
}
.carehub-lp__faq-item summary::-webkit-details-marker { display: none; }
.carehub-lp__faq-item p {
  padding: 14px 20px 18px;
  font-size: 0.88rem;
  color: #a0a0b0;
  line-height: 1.7;
  border-top: 1px solid #2a2a3a;
}

/* --- Final CTA --- */
.carehub-lp__final-cta {
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f, #1a1a2e);
}
.carehub-lp__final-headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  color: #fff;
  margin-bottom: 12px;
  font-weight: 800;
}
.carehub-lp__final-sub {
  color: #f87171;
  font-weight: 600;
  margin-bottom: 30px;
  font-size: 1rem;
}
.carehub-lp__trust-icons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  font-size: 0.8rem;
  color: #6a6a7a;
  flex-wrap: wrap;
}

/* --- Floating CTA (Mobile) --- */
.carehub-lp__floating-cta {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99;
  padding: 12px 16px;
  background: #0a0a0f;
  border-top: 1px solid #2a2a3a;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
}
.carehub-lp__floating-cta .carehub-lp__cta-btn {
  width: 100%;
  text-align: center;
  display: block;
  padding: 16px;
}

/* --- Animations --- */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.carehub-lp__hero-content {
  animation: fadeInUp 0.8s ease;
}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  .carehub-lp__hero { padding: 50px 15px; }
  .carehub-lp__benefit-list { grid-template-columns: 1fr; }
  .carehub-lp__testimonials-grid { grid-template-columns: 1fr; }
  .carehub-lp__floating-cta { display: block; }
  .carehub-lp__benefits,
  .carehub-lp__testimonials,
  .carehub-lp__faq,
  .carehub-lp__final-cta { padding: 50px 15px; }
  .carehub-lp__product-image { max-width: 300px; }
  body { padding-bottom: 70px; }
}

@media (max-width: 480px) {
  .carehub-lp__cta-btn--primary { padding: 16px 30px; font-size: 0.9rem; }
  .carehub-lp__guarantee-box { padding: 24px; }
  .carehub-lp__trust-icons { flex-direction: column; gap: 8px; }
}

/* --- No Distractions --- */
.carehub-lp-body .shopify-section-header,
.carehub-lp-body .shopify-section-footer,
.carehub-lp-body header,
.carehub-lp-body footer,
.carehub-lp-body nav {
  display: none !important;
}`;
  }

  // --------------------------------------------
  // SHOPIFY PAGE CREATION
  // --------------------------------------------

  private async createShopifyPage(
    request: LandingPageRequest,
    liquidCode: string,
    cssCode: string
  ): Promise<{ success: boolean; handle: string; url: string }> {
    try {
      const themeResponse = await this.shopify.getMainTheme();
      if (!themeResponse.success || !themeResponse.data) {
        return { success: false, handle: '', url: '' };
      }

      const themeId = themeResponse.data.id;
      const handle = this.generateHandle(request.productTitle || 'special-offer');
      const variant = request.variant ? `-${request.variant.toLowerCase()}` : '';
      const fullHandle = `${handle}${variant}`;

      // Upload CSS
      await this.shopify.updateThemeAsset(themeId, {
        key: 'assets/carehub-landing.css',
        value: cssCode,
      });

      // Create landing page template
      await this.shopify.updateThemeAsset(themeId, {
        key: `templates/page.carehub-landing.liquid`,
        value: liquidCode,
      });

      // Create the page
      const pageResult = await this.shopify.createPage({
        title: request.productTitle ? `${request.productTitle} — Special Offer` : 'Special Offer',
        body_html: '',
        handle: fullHandle,
        published: true,
        template_suffix: 'carehub-landing',
      });

      if (pageResult.success) {
        return {
          success: true,
          handle: fullHandle,
          url: `/pages/${fullHandle}`,
        };
      }

      return { success: false, handle: fullHandle, url: `/pages/${fullHandle}` };
    } catch (error) {
      console.error('[LandingPage] Error creating page:', error);
      return { success: false, handle: '', url: '' };
    }
  }

  // --------------------------------------------
  // A/B TESTING
  // --------------------------------------------

  async createABTest(request: LandingPageRequest): Promise<{
    variantA: LandingPageResult;
    variantB: LandingPageResult;
  }> {
    // Variant A — Original
    const variantA = await this.buildLandingPage({
      ...request,
      variant: 'A',
    });

    // Variant B — Different headline/CTA approach
    const variantB = await this.buildLandingPage({
      ...request,
      variant: 'B',
      mood: request.mood === 'premium' ? 'urgent' : 'premium',
      customInstructions: 'Use a completely different headline approach. If A was benefit-focused, make B curiosity-focused. If A was calm, make B urgent.',
    });

    return { variantA, variantB };
  }

  // --------------------------------------------
  // PLATFORM-SPECIFIC PAGES
  // --------------------------------------------

  async buildForFacebook(request: LandingPageRequest): Promise<LandingPageResult> {
    return this.buildLandingPage({
      ...request,
      adPlatform: 'facebook',
      customInstructions: 'Emotional, story-driven, social proof heavy. People come from scroll — grab attention instantly.',
    });
  }

  async buildForGoogle(request: LandingPageRequest): Promise<LandingPageResult> {
    return this.buildLandingPage({
      ...request,
      adPlatform: 'google',
      customInstructions: 'Intent-based, specific, match search intent. People are actively looking — deliver what they want.',
    });
  }

  async buildForTikTok(request: LandingPageRequest): Promise<LandingPageResult> {
    return this.buildLandingPage({
      ...request,
      adPlatform: 'tiktok',
      customInstructions: 'Trendy, casual, fast-paced. Young audience, mobile-first. Keep it snappy and visual.',
    });
  }

  // --------------------------------------------
  // HELPERS
  // --------------------------------------------

  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-offer';
  }

  async deleteLandingPage(handle: string): Promise<boolean> {
    try {
      const pages = await this.shopify.getPages({ limit: 50 });
      if (pages.success && pages.data) {
        const page = pages.data.pages.find((p: { handle?: string }) => p.handle === handle);
        if (page && page.id) {
          await this.shopify.deletePage(page.id);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let landingPageInstance: LandingPageBuilder | null = null;

export function getLandingPageBuilder(): LandingPageBuilder {
  if (!landingPageInstance) {
    landingPageInstance = new LandingPageBuilder();
  }
  return landingPageInstance;
}

export function resetLandingPageBuilder(): void {
  landingPageInstance = null;
}
