// ============================================
// CAREHUB AI AGENT — HOMEPAGE BUILDER (AGENT #5)
// ============================================
// Complete homepage design & build. Creates:
// - Hero section with compelling headline
// - Featured products section
// - Trust badges (secure, fast delivery, returns)
// - Testimonials / Reviews
// - Urgency elements (countdown, limited stock)
// - Newsletter signup
// - Announcement bar
// - Category showcases
// User sirf "best homepage banao" bole — agent sab kare.
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient } from '@/lib/shopify';
import { GeminiMessage } from '@/lib/gemini';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface HomepageRequest {
  mood?: string;
  sections?: HomepageSectionType[];
  heroHeadline?: string;
  heroSubheadline?: string;
  event?: string;
  products?: string[];
  preserveExisting?: boolean;
  customInstructions?: string;
}

export interface HomepageResult {
  success: boolean;
  sections: HomepageSection[];
  liquidCode: string;
  cssCode: string;
  applied: boolean;
  message: string;
}

export type HomepageSectionType =
  | 'announcement'
  | 'hero'
  | 'featured_products'
  | 'trust_badges'
  | 'testimonials'
  | 'categories'
  | 'urgency'
  | 'newsletter'
  | 'benefits'
  | 'instagram'
  | 'brand_story'
  | 'countdown'
  | 'video'
  | 'comparison'
  | 'faq';

export interface HomepageSection {
  type: HomepageSectionType;
  position: number;
  content: SectionContent;
  liquid: string;
  css: string;
  enabled: boolean;
}

export interface SectionContent {
  headline?: string;
  subheadline?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  items?: Array<Record<string, unknown>>;
  settings?: Record<string, unknown>;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundType: 'gradient' | 'image' | 'video' | 'solid';
  overlayOpacity: number;
  alignment: 'left' | 'center' | 'right';
  height: 'full' | 'large' | 'medium';
}

export interface TrustBadge {
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  rating: number;
  text: string;
  location: string;
  verified: boolean;
}

// --------------------------------------------
// DEFAULT CONTENT
// --------------------------------------------

const DEFAULT_TRUST_BADGES: TrustBadge[] = [
  {
    icon: '🔒',
    title: 'Secure Payment',
    description: '256-bit SSL encryption protects your data',
  },
  {
    icon: '🚚',
    title: 'Fast Shipping',
    description: 'Free delivery on orders over $50',
  },
  {
    icon: '↩️',
    title: '30-Day Returns',
    description: 'Hassle-free returns & exchanges',
  },
  {
    icon: '💬',
    title: '24/7 Support',
    description: 'Always here to help you',
  },
];

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sarah M.',
    rating: 5,
    text: 'Absolutely love the quality! Arrived faster than expected and exactly as described. Will definitely order again.',
    location: 'New York, USA',
    verified: true,
  },
  {
    name: 'James T.',
    rating: 5,
    text: 'Best online shopping experience I have had. The product exceeded my expectations. Highly recommend!',
    location: 'London, UK',
    verified: true,
  },
  {
    name: 'Emily R.',
    rating: 5,
    text: 'Customer service is outstanding. They helped me choose the perfect item. Premium quality at great prices.',
    location: 'Los Angeles, USA',
    verified: true,
  },
  {
    name: 'Michael D.',
    rating: 5,
    text: 'Third time ordering and still impressed. Consistent quality and fast delivery every single time.',
    location: 'Manchester, UK',
    verified: true,
  },
];

// --------------------------------------------
// HOMEPAGE BUILDER CLASS
// --------------------------------------------

export class HomepageBuilder {
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

  async buildHomepage(request: HomepageRequest): Promise<HomepageResult> {
    try {
      // Step 1: Get context
      const preferences = await this.memory.getPreferences();
      const storeState = await this.memory.getStoreState();
      const mood = request.mood || preferences.mood || 'premium';

      // Step 2: Determine sections
      const sectionTypes = request.sections || this.getDefaultSections();

      // Step 3: Generate content for each section
      const sections: HomepageSection[] = [];
      let position = 0;

      for (const sectionType of sectionTypes) {
        const section = await this.buildSection(sectionType, mood, request, position);
        sections.push(section);
        position++;
      }

      // Step 4: Combine all Liquid and CSS
      const liquidCode = this.combineLiquid(sections);
      const cssCode = this.combineCSS(sections, mood);

      // Step 5: Apply to store
      let applied = false;
      if (this.shopify.isConfigured()) {
        applied = await this.applyToStore(liquidCode, cssCode);
      }

      // Step 6: Save to memory
      await this.memory.recordHomepageUpdate({
        sections: sectionTypes,
        mood,
        appliedAt: Date.now(),
      });

      return {
        success: true,
        sections,
        liquidCode,
        cssCode,
        applied,
        message: applied
          ? `✅ Homepage built with ${sections.length} sections and applied to store!`
          : `✅ Homepage built with ${sections.length} sections! Connect Shopify to apply.`,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        sections: [],
        liquidCode: '',
        cssCode: '',
        applied: false,
        message: `❌ Error building homepage: ${errMsg}`,
      };
    }
  }

  // --------------------------------------------
  // SECTION BUILDERS
  // --------------------------------------------

  private async buildSection(
    type: HomepageSectionType,
    mood: string,
    request: HomepageRequest,
    position: number
  ): Promise<HomepageSection> {
    switch (type) {
      case 'announcement':
        return this.buildAnnouncementSection(mood, position);
      case 'hero':
        return this.buildHeroSection(mood, request, position);
      case 'featured_products':
        return this.buildFeaturedProductsSection(mood, position);
      case 'trust_badges':
        return this.buildTrustBadgesSection(mood, position);
      case 'testimonials':
        return this.buildTestimonialsSection(mood, position);
      case 'categories':
        return this.buildCategoriesSection(mood, position);
      case 'urgency':
        return this.buildUrgencySection(mood, position);
      case 'newsletter':
        return this.buildNewsletterSection(mood, position);
      case 'benefits':
        return this.buildBenefitsSection(mood, position);
      case 'brand_story':
        return this.buildBrandStorySection(mood, position);
      case 'countdown':
        return this.buildCountdownSection(mood, position);
      case 'faq':
        return this.buildFAQSection(mood, position);
      default:
        return this.buildGenericSection(type, mood, position);
    }
  }

  // --- Announcement Bar ---
  private async buildAnnouncementSection(mood: string, position: number): Promise<HomepageSection> {
    const content = await this.generateContent(
      'announcement bar',
      mood,
      'One short compelling announcement text for a premium store. Max 10 words. Create urgency.'
    );

    const text = content || '🔥 Free Shipping on Orders Over $50 — Limited Time Only!';

    return {
      type: 'announcement',
      position,
      content: { headline: text },
      enabled: true,
      liquid: `


  
    ${text}
    ✕
  
`,
      css: `
.carehub-announcement {
  background: var(--color-announcement-bg, #c9a962);
  color: var(--color-announcement-text, #000);
  padding: 10px 20px;
  text-align: center;
  position: relative;
  z-index: 100;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.carehub-announcement__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  max-width: 1200px;
  margin: 0 auto;
}
.carehub-announcement__text {
  margin: 0;
  animation: slideInDown 0.5s ease;
}
.carehub-announcement__close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0;
  line-height: 1;
}
.carehub-announcement__close:hover { opacity: 1; }
@keyframes slideInDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`,
    };
  }

  // --- Hero Section ---
  private async buildHeroSection(mood: string, request: HomepageRequest, position: number): Promise<HomepageSection> {
    let headline = request.heroHeadline;
    let subheadline = request.heroSubheadline;

    if (!headline || !subheadline) {
      const aiContent = await this.generateHeroContent(mood, request.event);
      headline = headline || aiContent.headline;
      subheadline = subheadline || aiContent.subheadline;
    }

    const buttonText = 'Shop Now';
    const buttonLink = '/collections/all';

    return {
      type: 'hero',
      position,
      content: {
        headline,
        subheadline,
        buttonText,
        buttonLink,
      },
      enabled: true,
      liquid: `


  
  
    ${headline}
    ${subheadline}
    
      ${buttonText}
      Explore Collections
    
    
      ⭐ 4.9/5 Rating
      •
      🚚 Free Shipping
      •
      🔒 Secure Checkout
    
  
`,
      css: `
.carehub-hero {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, var(--color-gradient-1, #c9a962) 0%, var(--color-gradient-2, #8b6914) 50%, var(--color-background, #0a0a0f) 100%);
  overflow: hidden;
  padding: 60px 20px;
}
.carehub-hero__overlay {
  position: absolute;
  inset: 0;
  background: var(--color-overlay, rgba(0,0,0,0.5));
  z-index: 1;
}
.carehub-hero__content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  animation: fadeInUp 0.8s ease;
}
.carehub-hero__headline {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(2.2rem, 5vw, 4rem);
  font-weight: 800;
  color: #ffffff !important;
  margin-bottom: 20px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.carehub-hero__subheadline {
  font-size: clamp(1rem, 2vw, 1.3rem);
  color: rgba(255,255,255,0.85) !important;
  margin-bottom: 35px;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.carehub-hero__buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 30px;
}
.carehub-hero__btn {
  padding: 16px 36px;
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-decoration: none;
  border-radius: var(--border-radius, 8px);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.carehub-hero__btn--primary {
  background: var(--color-button-bg, #c9a962);
  color: var(--color-button-text, #000) !important;
  box-shadow: 0 4px 15px rgba(201, 169, 98, 0.4);
}
.carehub-hero__btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(201, 169, 98, 0.6);
}
.carehub-hero__btn--secondary {
  background: transparent;
  color: #ffffff !important;
  border: 2px solid rgba(255,255,255,0.5);
}
.carehub-hero__btn--secondary:hover {
  border-color: #ffffff;
  background: rgba(255,255,255,0.1);
}
.carehub-hero__trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.7) !important;
  flex-wrap: wrap;
}
@media (max-width: 768px) {
  .carehub-hero { min-height: 70vh; padding: 40px 15px; }
  .carehub-hero__buttons { flex-direction: column; align-items: center; }
  .carehub-hero__btn { width: 100%; max-width: 280px; justify-content: center; }
  .carehub-hero__trust { flex-direction: column; gap: 8px; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}`,
    };
  }

  // --- Featured Products ---
  private async buildFeaturedProductsSection(mood: string, position: number): Promise<HomepageSection> {
    return {
      type: 'featured_products',
      position,
      content: {
        headline: 'Best Sellers',
        subheadline: 'Our most popular products loved by thousands',
      },
      enabled: true,
      liquid: `


  
    
      Best Sellers
      Our most popular products loved by thousands
    
    
      {% for product in collections.all.products limit: 8 %}
      
        
          
            {% if product.featured_image %}
              
            {% else %}
              {{ product.title | truncate: 1, '' }}
            {% endif %}
          
          {% if product.compare_at_price > product.price %}
            SALE
          {% endif %}
        
        
          
            {{ product.title }}
          
          
            {{ product.price | money }}
            {% if product.compare_at_price > product.price %}
              {{ product.compare_at_price | money }}
            {% endif %}
          
          View Product
        
      
      {% endfor %}
    
    
      View All Products
    
  
`,
      css: `
.carehub-featured {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-featured__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-featured__header {
  text-align: center;
  margin-bottom: 50px;
}
.carehub-featured__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-featured__subtitle {
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 1.05rem;
}
.carehub-featured__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.carehub-featured__card {
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
  transition: all 0.3s ease;
}
.carehub-featured__card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border-color: var(--color-primary, #c9a962);
}
.carehub-featured__image-wrap {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
}
.carehub-featured__image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.carehub-featured__card:hover .carehub-featured__image-wrap img {
  transform: scale(1.08);
}
.carehub-featured__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-error, #f87171);
  color: #fff;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.carehub-featured__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface, #1a1a2e);
  font-size: 3rem;
  color: var(--color-primary, #c9a962);
}
.carehub-featured__info {
  padding: 16px;
}
.carehub-featured__product-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
}
.carehub-featured__product-title a {
  color: var(--color-heading, #fff) !important;
  text-decoration: none;
}
.carehub-featured__price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.carehub-featured__current-price {
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
  font-size: 1.1rem;
}
.carehub-featured__compare-price {
  color: var(--color-text-muted, #8a8a9a) !important;
  text-decoration: line-through;
  font-size: 0.9rem;
}
.carehub-featured__quick-btn {
  display: block;
  text-align: center;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-primary, #c9a962);
  color: var(--color-primary, #c9a962) !important;
  border-radius: var(--border-radius, 8px);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}
.carehub-featured__quick-btn:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
}
.carehub-featured__view-all {
  text-align: center;
  margin-top: 40px;
}
@media (max-width: 1024px) {
  .carehub-featured__grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .carehub-featured__grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}
@media (max-width: 480px) {
  .carehub-featured__grid { grid-template-columns: 1fr; }
}`,
    };
  }

  // --- Trust Badges ---
  private async buildTrustBadgesSection(mood: string, position: number): Promise<HomepageSection> {
    const badges = DEFAULT_TRUST_BADGES;

    const badgesHtml = badges.map(badge => `
      
        ${badge.icon}
        ${badge.title}
        ${badge.description}
      `).join('');

    return {
      type: 'trust_badges',
      position,
      content: {
        items: badges.map(b => ({ icon: b.icon, title: b.title, description: b.description })),
      },
      enabled: true,
      liquid: `


  
    ${badgesHtml}
  
`,
      css: `
.carehub-trust {
  padding: 50px 0;
  background: var(--color-surface, #12121a);
  border-top: 1px solid var(--color-border, #2a2a3a);
  border-bottom: 1px solid var(--color-border, #2a2a3a);
}
.carehub-trust__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  text-align: center;
}
.carehub-trust__badge {
  padding: 20px;
  transition: transform 0.3s ease;
}
.carehub-trust__badge:hover {
  transform: translateY(-3px);
}
.carehub-trust__icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}
.carehub-trust__title {
  font-family: var(--font-body, 'Inter'), sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 6px;
}
.carehub-trust__desc {
  font-size: 0.85rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  line-height: 1.5;
}
@media (max-width: 768px) {
  .carehub-trust__container { grid-template-columns: repeat(2, 1fr); gap: 20px; }
}
@media (max-width: 480px) {
  .carehub-trust__container { grid-template-columns: 1fr; }
}`,
    };
  }

  // --- Testimonials ---
  private async buildTestimonialsSection(mood: string, position: number): Promise<HomepageSection> {
    const testimonials = DEFAULT_TESTIMONIALS;

    const testimonialsHtml = testimonials.map(t => `
      
        ${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}
        "${t.text}"
        
          ${t.name}
          ${t.verified ? '✓ Verified' : ''}
        
        ${t.location}
      `).join('');

    return {
      type: 'testimonials',
      position,
      content: {
        headline: 'What Our Customers Say',
        items: testimonials.map(t => ({
          name: t.name,
          text: t.text,
          rating: t.rating.toString(),
          location: t.location,
        })),
      },
      enabled: true,
      liquid: `


  
    
      What Our Customers Say
      Join thousands of satisfied customers worldwide
    
    
      ${testimonialsHtml}
    
  
`,
      css: `
.carehub-testimonials {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-testimonials__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-testimonials__header {
  text-align: center;
  margin-bottom: 50px;
}
.carehub-testimonials__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-testimonials__subtitle {
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 1.05rem;
}
.carehub-testimonials__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.carehub-testimonial__card {
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  padding: 28px;
  transition: all 0.3s ease;
}
.carehub-testimonial__card:hover {
  border-color: var(--color-primary, #c9a962);
  transform: translateY(-3px);
}
.carehub-testimonial__stars {
  color: #fbbf24;
  font-size: 1.2rem;
  margin-bottom: 14px;
  letter-spacing: 2px;
}
.carehub-testimonial__text {
  color: var(--color-text, #e8e8e8) !important;
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 16px;
  font-style: italic;
}
.carehub-testimonial__author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.carehub-testimonial__name {
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  font-size: 0.9rem;
}
.carehub-testimonial__verified {
  background: var(--color-success, #4ade80);
  color: #000;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.carehub-testimonial__location {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
@media (max-width: 768px) {
  .carehub-testimonials__grid { grid-template-columns: 1fr; }
}`,
    };
  }

  // --- Urgency Section ---
  private async buildUrgencySection(mood: string, position: number): Promise<HomepageSection> {
    return {
      type: 'urgency',
      position,
      content: {
        headline: 'Limited Time Offer',
        description: "Don't miss out on our exclusive deals. Sale ends soon!",
      },
      enabled: true,
      liquid: `


  
    
      ⚡ LIMITED TIME
      Exclusive Deal — Up to 40% Off
      Don't miss out! This offer expires soon. Grab your favorites before they're gone.
      
        23Hours
        :
        59Minutes
        :
        59Seconds
      
      Shop the Sale
    
  


(function(){
  function updateCountdown(){
    var now=new Date();
    var end=new Date();
    end.setHours(23,59,59,999);
    var diff=end-now;
    if(diff<=0){end.setDate(end.getDate()+1);diff=end-now;}
    var h=Math.floor(diff/3600000);
    var m=Math.floor((diff%3600000)/60000);
    var s=Math.floor((diff%60000)/1000);
    var he=document.getElementById('ch-hours');
    var me=document.getElementById('ch-minutes');
    var se=document.getElementById('ch-seconds');
    if(he)he.textContent=h.toString().padStart(2,'0');
    if(me)me.textContent=m.toString().padStart(2,'0');
    if(se)se.textContent=s.toString().padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown,1000);
})();
`,
      css: `
.carehub-urgency {
  padding: 60px 0;
  background: linear-gradient(135deg, var(--color-surface, #12121a) 0%, var(--color-background, #0a0a0f) 100%);
  border: 1px solid var(--color-border, #2a2a3a);
  margin: 20px 0;
}
.carehub-urgency__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}
.carehub-urgency__badge {
  display: inline-block;
  background: var(--color-error, #f87171);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}
.carehub-urgency__headline {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-urgency__desc {
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 30px;
  font-size: 1rem;
}
.carehub-urgency__timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
}
.carehub-urgency__unit {
  background: var(--color-card-bg, #1a1a2e);
  border: 1px solid var(--color-primary, #c9a962);
  border-radius: var(--border-radius, 8px);
  padding: 15px 20px;
  min-width: 70px;
}
.carehub-urgency__unit span {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962) !important;
  line-height: 1;
}
.carehub-urgency__unit small {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 5px;
}
.carehub-urgency__separator {
  font-size: 1.5rem;
  color: var(--color-primary, #c9a962);
  font-weight: 700;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
}
@media (max-width: 480px) {
  .carehub-urgency__unit { padding: 10px 14px; min-width: 55px; }
  .carehub-urgency__unit span { font-size: 1.4rem; }
}`,
    };
  }

  // --- Newsletter ---
  private async buildNewsletterSection(mood: string, position: number): Promise<HomepageSection> {
    return {
      type: 'newsletter',
      position,
      content: {
        headline: 'Stay in the Loop',
        description: 'Subscribe for exclusive deals, new arrivals, and insider-only discounts.',
      },
      enabled: true,
      liquid: `


  
    Stay in the Loop
    Subscribe for exclusive deals, new arrivals, and insider-only discounts.
    
      
      
      
        
        Subscribe
      
    
    🔒 No spam, ever. Unsubscribe anytime.
  
`,
      css: `
.carehub-newsletter {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-surface, #12121a);
  text-align: center;
}
.carehub-newsletter__container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-newsletter__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 10px;
}
.carehub-newsletter__desc {
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 25px;
  font-size: 1rem;
}
.carehub-newsletter__input-wrap {
  display: flex;
  gap: 0;
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  border: 1px solid var(--color-border, #2a2a3a);
}
.carehub-newsletter__input {
  flex: 1;
  padding: 16px 20px !important;
  border: none !important;
  background: var(--color-background, #0a0a0f) !important;
  color: var(--color-text, #e8e8e8) !important;
  font-size: 0.95rem;
  outline: none;
  border-radius: 0 !important;
}
.carehub-newsletter__btn {
  padding: 16px 28px !important;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none !important;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.3s ease;
  border-radius: 0 !important;
  white-space: nowrap;
}
.carehub-newsletter__btn:hover {
  background: var(--color-button-hover, #e2c275) !important;
}
.carehub-newsletter__privacy {
  margin-top: 12px;
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
@media (max-width: 480px) {
  .carehub-newsletter__input-wrap { flex-direction: column; }
  .carehub-newsletter__btn { border-radius: 0 !important; }
}`,
    };
  }

  // --- Benefits Section ---
  private async buildBenefitsSection(mood: string, position: number): Promise<HomepageSection> {
    return {
      type: 'benefits',
      position,
      content: {
        headline: 'Why Choose Us',
      },
      enabled: true,
      liquid: `


  
    Why Choose CareHub
    
      
        01
        Premium Quality
        Every product is carefully selected and quality-tested before reaching you.
      
      
        02
        Fast & Free Shipping
        Enjoy free shipping on orders over $50 with tracking on every order.
      
      
        03
        Easy Returns
        30-day hassle-free returns. No questions asked, no hidden fees.
      
      
        04
        Secure Shopping
        Your data is protected with bank-level 256-bit SSL encryption.
      
    
  
`,
      css: `
.carehub-benefits {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-benefits__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-benefits__title {
  text-align: center;
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 50px;
}
.carehub-benefits__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}
.carehub-benefits__item {
  padding: 30px;
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  transition: all 0.3s ease;
}
.carehub-benefits__item:hover {
  border-color: var(--color-primary, #c9a962);
  transform: translateY(-3px);
}
.carehub-benefits__number {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--color-primary, #c9a962) !important;
  opacity: 0.3;
  margin-bottom: 10px;
  font-family: var(--font-heading, 'Playfair Display'), serif;
}
.carehub-benefits__item h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-benefits__item p {
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  line-height: 1.6;
}
@media (max-width: 1024px) {
  .carehub-benefits__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .carehub-benefits__grid { grid-template-columns: 1fr; }
}`,
    };
  }

  // --- Brand Story ---
  private async buildBrandStorySection(mood: string, position: number): Promise<HomepageSection> {
    return {
      type: 'brand_story',
      position,
      content: {
        headline: 'Our Story',
      },
      enabled: true,
      liquid: `


  
    
      Our Story
      Curated for You, Delivered with Care
      At CareHub, we believe everyone deserves access to premium products without the premium price tag. We carefully curate each item in our collection, testing for quality and value so you can shop with confidence.
      Founded with a simple mission — to deliver happiness to your doorstep — we've served thousands of satisfied customers across the US and UK.
      
        10K+Happy Customers
        500+Products
        4.9★Average Rating
      
    
  
`,
      css: `
.carehub-story {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-surface, #12121a);
}
.carehub-story__container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}
.carehub-story__label {
  display: inline-block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 600;
  margin-bottom: 12px;
}
.carehub-story__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 20px;
}
.carehub-story__text {
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 1rem;
  line-height: 1.8;
  margin-bottom: 16px;
}
.carehub-story__stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid var(--color-border, #2a2a3a);
}
.carehub-story__stat strong {
  display: block;
  font-size: 1.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 800;
}
.carehub-story__stat span {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
@media (max-width: 480px) {
  .carehub-story__stats { flex-direction: column; gap: 20px; }
}`,
    };
  }

  // --- Countdown Section ---
  private async buildCountdownSection(mood: string, position: number): Promise<HomepageSection> {
    return this.buildUrgencySection(mood, position);
  }

  // --- FAQ Section ---
  private async buildFAQSection(mood: string, position: number): Promise<HomepageSection> {
    return {
      type: 'faq',
      position,
      content: { headline: 'Frequently Asked Questions' },
      enabled: true,
      liquid: `


  
    Frequently Asked Questions
    
      
        How long does shipping take?
        Standard shipping takes 7-15 business days. We offer tracking on all orders so you can follow your package every step of the way.
      
      
        What is your return policy?
        We offer a 30-day hassle-free return policy. If you're not satisfied with your purchase, simply contact us and we'll arrange a return or exchange.
      
      
        Is my payment secure?
        Absolutely! We use 256-bit SSL encryption and partner with trusted payment providers including Visa, Mastercard, and PayPal.
      
      
        Do you ship internationally?
        Yes! We currently ship to the US, UK, Canada, and Australia. International shipping times vary by destination.
      
    
  
`,
      css: `
.carehub-faq {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-background, #0a0a0f);
}
.carehub-faq__container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-faq__title {
  text-align: center;
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 40px;
}
.carehub-faq__item {
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
  margin-bottom: 12px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}
.carehub-faq__item[open] {
  border-color: var(--color-primary, #c9a962);
}
.carehub-faq__question {
  padding: 18px 24px;
  cursor: pointer;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  font-size: 0.95rem;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-card-bg, #12121a);
  transition: background 0.3s ease;
}
.carehub-faq__question:hover {
  background: var(--color-surface, #1a1a2e);
}
.carehub-faq__question::after {
  content: '+';
  font-size: 1.3rem;
  color: var(--color-primary, #c9a962);
  transition: transform 0.3s ease;
}
.carehub-faq__item[open] .carehub-faq__question::after {
  transform: rotate(45deg);
}
.carehub-faq__question::-webkit-details-marker { display: none; }
.carehub-faq__answer {
  padding: 16px 24px 20px;
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 0.9rem;
  line-height: 1.7;
  background: var(--color-card-bg, #12121a);
  border-top: 1px solid var(--color-border, #2a2a3a);
}`,
    };
  }

  // --- Categories Section ---
  private async buildCategoriesSection(mood: string, position: number): Promise<HomepageSection> {
    return {
      type: 'categories',
      position,
      content: { headline: 'Shop by Category' },
      enabled: true,
      liquid: `


  
    Shop by Category
    
      {% for collection in collections limit: 6 %}
        {% if collection.handle != 'all' %}
        
          
            {% if collection.image %}
              
            {% else %}
              {{ collection.title | truncate: 1, '' }}
            {% endif %}
          
          {{ collection.title }}
          {{ collection.products_count }} Products
        
        {% endif %}
      {% endfor %}
    
  
`,
      css: `
.carehub-categories {
  padding: var(--section-padding, 80px) 0;
  background: var(--color-surface, #12121a);
}
.carehub-categories__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-categories__title {
  text-align: center;
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  color: var(--color-heading, #fff) !important;
  margin-bottom: 40px;
}
.carehub-categories__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.carehub-categories__card {
  text-align: center;
  text-decoration: none;
  background: var(--color-card-bg, #0a0a0f);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
  transition: all 0.3s ease;
  padding-bottom: 20px;
}
.carehub-categories__card:hover {
  transform: translateY(-5px);
  border-color: var(--color-primary, #c9a962);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.carehub-categories__image {
  aspect-ratio: 16/9;
  overflow: hidden;
}
.carehub-categories__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.carehub-categories__card:hover img {
  transform: scale(1.08);
}
.carehub-categories__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface, #1a1a2e);
  font-size: 3rem;
  color: var(--color-primary, #c9a962);
}
.carehub-categories__name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 16px 0 4px;
  padding: 0 16px;
}
.carehub-categories__count {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
@media (max-width: 768px) {
  .carehub-categories__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .carehub-categories__grid { grid-template-columns: 1fr; }
}`,
    };
  }

  // --- Generic Section ---
  private async buildGenericSection(type: string, mood: string, position: number): Promise<HomepageSection> {
    return {
      type: type as HomepageSectionType,
      position,
      content: { headline: type },
      enabled: false,
      liquid: ``,
      css: '',
    };
  }

  // --------------------------------------------
  // AI CONTENT GENERATION
  // --------------------------------------------

  private async generateHeroContent(mood: string, event?: string): Promise<{ headline: string; subheadline: string }> {
    const prompt = `Generate a compelling hero section for an e-commerce store.

Store mood: ${mood}
${event ? `Event/occasion: ${event}` : ''}
Target audience: US/UK premium online shoppers

Return ONLY valid JSON:
{
  "headline": "powerful 5-8 word headline that stops scrolling",
  "subheadline": "compelling 15-20 word subheadline that creates desire"
}

Rules:
- Headline should be bold, memorable, create curiosity
- Subheadline should expand on the promise, create urgency
- Use power words: exclusive, premium, limited, discover, transform
- NO generic phrases like "Welcome to our store"
- Make it feel premium and exclusive`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGeminiJSON<{ headline: string; subheadline: string }>(
      messages,
      'creative_writing'
    );

    if (response.success && response.data) {
      return response.data;
    }

    // Fallback
    return {
      headline: 'Discover Premium Products Curated Just For You',
      subheadline: 'Shop our exclusive collection of hand-picked items. Premium quality, unbeatable prices, delivered to your door.',
    };
  }

  private async generateContent(section: string, mood: string, instruction: string): Promise<string | null> {
    const prompt = `${instruction}

Store mood: ${mood}
Section: ${section}
Target: US/UK audience

Return ONLY the text, nothing else. No quotes, no explanation.`;

    const response = await this.router.route({
      id: `content-${Date.now()}`,
      message: prompt,
      priority: 'speed',
    });

    return response.success ? response.content.trim().replace(/^["']|["']$/g, '') : null;
  }

  // --------------------------------------------
  // COMBINE & APPLY
  // --------------------------------------------

  private combineLiquid(sections: HomepageSection[]): string {
    const enabledSections = sections.filter(s => s.enabled);
    const header = `{% comment %}
  ============================================
  CareHub AI Agent — Custom Homepage
  Generated: ${new Date().toISOString()}
  Sections: ${enabledSections.length}
  ============================================
{% endcomment %}\n\n`;

    return header + enabledSections.map(s => s.liquid).join('\n\n');
  }

  private combineCSS(sections: HomepageSection[], mood: string): string {
    const enabledSections = sections.filter(s => s.enabled && s.css);
    const header = `/* ============================================ */\n/* CareHub Homepage CSS — ${mood} */\n/* Generated: ${new Date().toISOString()} */\n/* ============================================ */\n\n`;

    return header + enabledSections.map(s => s.css).join('\n\n');
  }

  private async applyToStore(liquidCode: string, cssCode: string): Promise<boolean> {
    try {
      const themeResponse = await this.shopify.getMainTheme();
      if (!themeResponse.success || !themeResponse.data) return false;

      const themeId = themeResponse.data.id;

      // Upload homepage CSS
      await this.shopify.updateThemeAsset(themeId, {
        key: 'assets/carehub-homepage.css',
        value: cssCode,
      });

      // Upload homepage section as snippet
      await this.shopify.updateThemeAsset(themeId, {
        key: 'snippets/carehub-homepage.liquid',
        value: liquidCode,
      });

      // Inject into index template
      const indexTemplate = await this.shopify.getThemeAsset(themeId, 'templates/index.liquid');
      if (indexTemplate.success && indexTemplate.data?.asset.value) {
        let content = indexTemplate.data.asset.value;
        if (!content.includes('carehub-homepage')) {
          content = `{{ 'carehub-homepage.css' | asset_url | stylesheet_tag }}\n{% render 'carehub-homepage' %}\n\n${content}`;
          await this.shopify.updateThemeAsset(themeId, {
            key: 'templates/index.liquid',
            value: content,
          });
        }
      } else {
        // Try JSON template (Dawn theme uses JSON templates)
        const jsonTemplate = await this.shopify.getThemeAsset(themeId, 'templates/index.json');
        if (jsonTemplate.success) {
          // For JSON templates, inject via theme.liquid or a section
          const themeLiquid = await this.shopify.getThemeAsset(themeId, 'layout/theme.liquid');
          if (themeLiquid.success && themeLiquid.data?.asset.value) {
            let themeContent = themeLiquid.data.asset.value;
            if (!themeContent.includes('carehub-homepage.css')) {
              const cssInject = `  {{ 'carehub-homepage.css' | asset_url | stylesheet_tag }}\n`;
              themeContent = themeContent.replace('', `${cssInject}`);
              await this.shopify.updateThemeAsset(themeId, {
                key: 'layout/theme.liquid',
                value: themeContent,
              });
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[Homepage] Error applying to store:', error);
      return false;
    }
  }

  // --------------------------------------------
  // SECTION MANAGEMENT
  // --------------------------------------------

  async addSection(type: HomepageSectionType, position?: number): Promise<HomepageSection> {
    const preferences = await this.memory.getPreferences();
    const mood = preferences.mood || 'premium';
    const pos = position || 99;

    return this.buildSection(type, mood, {}, pos);
  }

  async removeSection(type: HomepageSectionType): Promise<boolean> {
    // This would rebuild homepage without the specified section
    const storeState = await this.memory.getStoreState();
    // Implementation would filter out the section and rebuild
    return true;
  }

  async updateSection(type: HomepageSectionType, content: Partial<SectionContent>): Promise<HomepageSection> {
    const preferences = await this.memory.getPreferences();
    const mood = preferences.mood || 'premium';
    const section = await this.buildSection(type, mood, {}, 0);
    section.content = { ...section.content, ...content };
    return section;
  }

  // --------------------------------------------
  // HELPERS
  // --------------------------------------------

  private getDefaultSections(): HomepageSectionType[] {
    return [
      'announcement',
      'hero',
      'trust_badges',
      'featured_products',
      'benefits',
      'testimonials',
      'urgency',
      'brand_story',
      'newsletter',
      'faq',
    ];
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let homepageInstance: HomepageBuilder | null = null;

export function getHomepageBuilder(): HomepageBuilder {
  if (!homepageInstance) {
    homepageInstance = new HomepageBuilder();
  }
  return homepageInstance;
}

export function resetHomepageBuilder(): void {
  homepageInstance = null;
}
