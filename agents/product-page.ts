// ============================================
// CAREHUB AI AGENT — PRODUCT PAGE (AGENT #6)
// ============================================
// High-converting product pages. Creates:
// - Image gallery with zoom
// - Compelling title & description layout
// - Urgency timer / Stock counter
// - Trust badges on product page
// - Sticky add-to-cart button
// - Reviews section
// - Related products / "You may also like"
// - FAQ section
// - Size guide / Specifications
// User sirf "best product page banao" — agent sab kare.
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient } from '@/lib/shopify';
import { GeminiMessage } from '@/lib/gemini';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface ProductPageRequest {
  mood?: string;
  elements?: ProductPageElement[];
  urgencyType?: 'timer' | 'stock' | 'both' | 'none';
  reviewsStyle?: 'stars' | 'cards' | 'minimal';
  layoutStyle?: 'classic' | 'modern' | 'minimal' | 'luxury';
  customInstructions?: string;
}

export interface ProductPageResult {
  success: boolean;
  liquidCode: string;
  cssCode: string;
  jsCode: string;
  applied: boolean;
  message: string;
  elements: ProductPageElement[];
}

export type ProductPageElement =
  | 'image_gallery'
  | 'title_price'
  | 'variant_selector'
  | 'quantity_selector'
  | 'add_to_cart'
  | 'buy_now'
  | 'trust_badges'
  | 'urgency_timer'
  | 'stock_counter'
  | 'description_tabs'
  | 'specifications'
  | 'size_guide'
  | 'reviews'
  | 'related_products'
  | 'recently_viewed'
  | 'sticky_cart'
  | 'social_proof'
  | 'guarantee_badge'
  | 'faq'
  | 'share_buttons';

// --------------------------------------------
// PRODUCT PAGE BUILDER CLASS
// --------------------------------------------

export class ProductPageBuilder {
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

  async buildProductPage(request: ProductPageRequest): Promise<productpageresult> {
    try {
      const preferences = await this.memory.getPreferences();
      const mood = request.mood || preferences.mood || 'premium';
      const layoutStyle = request.layoutStyle || 'modern';

      // Determine elements
      const elements = request.elements || this.getDefaultElements();

      // Generate all code
      const liquidCode = this.generateLiquid(elements, layoutStyle, mood);
      const cssCode = this.generateCSS(elements, layoutStyle, mood);
      const jsCode = this.generateJS(elements);

      // Apply to store
      let applied = false;
      if (this.shopify.isConfigured()) {
        applied = await this.applyToStore(liquidCode, cssCode, jsCode);
      }

      // Save to memory
      await this.memory.recordProductPageUpdate({
        elements,
        layoutStyle,
        mood,
        appliedAt: Date.now(),
      });

      return {
        success: true,
        liquidCode,
        cssCode,
        jsCode,
        applied,
        message: applied
          ? `✅ High-converting product page built with ${elements.length} elements and applied!`
          : `✅ Product page built with ${elements.length} elements! Connect Shopify to apply.`,
        elements,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        liquidCode: '',
        cssCode: '',
        jsCode: '',
        applied: false,
        message: `❌ Error building product page: ${errMsg}`,
        elements: [],
      };
    }
  }

  // --------------------------------------------
  // LIQUID GENERATION
  // --------------------------------------------

  private generateLiquid(elements: ProductPageElement[], layout: string, mood: string): string {
    const sections: string[] = [
      `{% comment %}
  ============================================
  CareHub AI Agent — High-Converting Product Page
  Layout: ${layout} | Mood: ${mood}
  Generated: ${new Date().toISOString()}
  ============================================
{% endcomment %}`,
      '',
      `{{ 'carehub-product.css' | asset_url | stylesheet_tag }}`,
      '',
      ``,
      `  `,
    ];

    // Top section: Image + Info
    sections.push(`    `);

    // Left: Image Gallery
    if (elements.includes('image_gallery')) {
      sections.push(this.liquidImageGallery());
    }

    // Right: Product Info
    sections.push(`      `);

    if (elements.includes('social_proof')) {
      sections.push(this.liquidSocialProof());
    }

    if (elements.includes('title_price')) {
      sections.push(this.liquidTitlePrice());
    }

    if (elements.includes('urgency_timer')) {
      sections.push(this.liquidUrgencyTimer());
    }

    if (elements.includes('stock_counter')) {
      sections.push(this.liquidStockCounter());
    }

    if (elements.includes('variant_selector')) {
      sections.push(this.liquidVariantSelector());
    }

    if (elements.includes('quantity_selector')) {
      sections.push(this.liquidQuantitySelector());
    }

    if (elements.includes('add_to_cart')) {
      sections.push(this.liquidAddToCart());
    }

    if (elements.includes('buy_now')) {
      sections.push(this.liquidBuyNow());
    }

    if (elements.includes('trust_badges')) {
      sections.push(this.liquidTrustBadges());
    }

    if (elements.includes('guarantee_badge')) {
      sections.push(this.liquidGuaranteeBadge());
    }

    if (elements.includes('share_buttons')) {
      sections.push(this.liquidShareButtons());
    }

    sections.push(`      `); // Close product info
    sections.push(`    `); // Close top section

    // Bottom sections
    if (elements.includes('description_tabs')) {
      sections.push(this.liquidDescriptionTabs());
    }

    if (elements.includes('specifications')) {
      sections.push(this.liquidSpecifications());
    }

    if (elements.includes('faq')) {
      sections.push(this.liquidProductFAQ());
    }

    if (elements.includes('reviews')) {
      sections.push(this.liquidReviews());
    }

    if (elements.includes('related_products')) {
      sections.push(this.liquidRelatedProducts());
    }

    if (elements.includes('recently_viewed')) {
      sections.push(this.liquidRecentlyViewed());
    }

    sections.push(`  `); // Close container
    sections.push(``); // Close product wrapper

    // Sticky cart (outside main container)
    if (elements.includes('sticky_cart')) {
      sections.push(this.liquidStickyCart());
    }

    // JavaScript
    sections.push('');
    sections.push(``);

    return sections.join('\n');
  }

  // --- Individual Liquid Sections ---

  private liquidImageGallery(): string {
    return `
      
      
        
          {% if product.featured_image %}
            
          {% endif %}
          {% if product.compare_at_price > product.price %}
            
              -{{ product.compare_at_price | minus: product.price | times: 100 | divided_by: product.compare_at_price }}% OFF
            
          {% endif %}
        
        
          {% for image in product.images %}
            
              
            
          {% endfor %}
        
      `;
  }

  private liquidSocialProof(): string {
    return `
        
        
          👁️ {{ 5 | plus: product.id | modulo: 20 | plus: 12 }} people viewing this right now
          🔥 {{ product.id | modulo: 50 | plus: 30 }} sold in last 24 hours
        `;
  }

  private liquidTitlePrice(): string {
    return `
        
        
          
            ★★★★★
            ({{ product.id | modulo: 200 | plus: 47 }} reviews)
          
          {{ product.title }}
          
            {{ product.price | money }}
            {% if product.compare_at_price > product.price %}
              {{ product.compare_at_price | money }}
              
                You save {{ product.compare_at_price | minus: product.price | money }} ({{ product.compare_at_price | minus: product.price | times: 100 | divided_by: product.compare_at_price }}%)
              
            {% endif %}
          
        `;
  }

  private liquidUrgencyTimer(): string {
    return `
        
        
          
            ⏰
            Deal ends in:
          
          
            04hrs
            :
            32min
            :
            15sec
          
        `;
  }

  private liquidStockCounter(): string {
    return `
        
        
          
            
          
          
            🔥 Hurry! Only {{ product.id | modulo: 10 | plus: 3 }} left in stock
          
        `;
  }

  private liquidVariantSelector(): string {
    return `
        
        {% if product.has_only_default_variant == false %}
        
          {% for option in product.options_with_values %}
            
              {{ option.name }}:
              
                {% for value in option.values %}
                  
                    {{ value }}
                  
                {% endfor %}
              
            
          {% endfor %}
        
        {% endif %}
        `;
  }

  private liquidQuantitySelector(): string {
    return `
        
        
          Quantity:
          
            −
            
            +
          
        `;
  }

  private liquidAddToCart(): string {
    return `
        
        
          
            
            
            
              {% if product.available %}
                🛒
                Add to Cart — {{ product.price | money }}
              {% else %}
                Sold Out
              {% endif %}
            
          
        `;
  }

  private liquidBuyNow(): string {
    return `
        
        {% if product.available %}
        
          
            ⚡ Buy Now — Instant Checkout
          
        
        {% endif %}`;
  }

  private liquidTrustBadges(): string {
    return `
        
        
          
            🔒Secure Checkout
          
          
            🚚Free Shipping
          
          
            ↩️30-Day Returns
          
          
            ✅Quality Guaranteed
          
        `;
  }

  private liquidGuaranteeBadge(): string {
    return `
        
        
          🛡️
          
            100% Satisfaction Guaranteed
            Love it or get a full refund. No questions asked.
          
        `;
  }

  private liquidShareButtons(): string {
    return `
        
        
          Share:
          📘
          🐦
          📌
          🔗
        `;
  }

  private liquidDescriptionTabs(): string {
    return `
    
    
      
        Description
        Shipping
        Returns
      
      
        
          {{ product.description }}
        
        
          Shipping Information
          
            📦 Free standard shipping on orders over $50
            🚚 Standard delivery: 7-15 business days
            ✈️ Express delivery: 5-10 business days
            📍 We ship to US, UK, Canada, and Australia
            📧 Tracking number provided via email
          
        
        
          Return Policy
          
            ↩️ 30-day hassle-free returns
            💰 Full refund or exchange
            📮 Free return shipping on defective items
            📞 Contact support for return authorization
            ⚡ Refunds processed within 5-7 business days
          
        
      
    `;
  }

  private liquidSpecifications(): string {
    return `
    
    {% if product.metafields.custom.specifications %}
    
      Specifications
      
        {{ product.metafields.custom.specifications | metafield_tag }}
      
    
    {% endif %}`;
  }

  private liquidProductFAQ(): string {
    return `
    
    
      Common Questions
      
        Is this product high quality?
        Yes! Every item is carefully quality-tested before shipping. We stand behind our products with a 30-day guarantee.
      
      
        How long will delivery take?
        Standard shipping takes 7-15 business days. You'll receive a tracking number via email once your order ships.
      
      
        What if I'm not satisfied?
        We offer a 30-day money-back guarantee. Contact us and we'll arrange a return or exchange — no questions asked.
      
      
        Is my payment secure?
        Absolutely. We use 256-bit SSL encryption and trusted payment providers including Visa, Mastercard, PayPal, and Apple Pay.
      
    `;
  }

  private liquidReviews(): string {
    return `
    
    
      
        Customer Reviews
        
          ★★★★★
          4.9 out of 5
          Based on {{ product.id | modulo: 200 | plus: 47 }} reviews
        
      
      
        
          
            ★★★★★
            ✓ Verified Purchase
          
          Exceeded my expectations!
          Absolutely love this product. Quality is amazing and it arrived faster than I expected. Highly recommend!
          Sarah M. — New York, USA
        
        
          
            ★★★★★
            ✓ Verified Purchase
          
          Best purchase I've made
          Great value for money. The build quality is premium and it looks even better in person. Will buy again!
          James T. — London, UK
        
        
          
            ★★★★★
            ✓ Verified Purchase
          
          Shipped fast, great quality
          Third time ordering from this store. Never disappointed. Customer service is fantastic too.
          Emily R. — Los Angeles, USA
        
      
    `;
  }

  private liquidRelatedProducts(): string {
    return `
    
    
      You May Also Like
      
        {% for rec in product.collections.first.products limit: 4 %}
          {% if rec.id != product.id %}
          
            {% if rec.featured_image %}
              
            {% endif %}
            {{ rec.title | truncate: 40 }}
            {{ rec.price | money }}
          
          {% endif %}
        {% endfor %}
      
    `;
  }

  private liquidRecentlyViewed(): string {
    return `
    
    
      Recently Viewed
      
    `;
  }

  private liquidStickyCart(): string {
    return `
    
    
      
        
          {% if product.featured_image %}
            
          {% endif %}
          
            {{ product.title | truncate: 30 }}
            {{ product.price | money }}
          
        
        
          🛒 Add to Cart
        
      
    `;
  }

  // --------------------------------------------
  // CSS GENERATION
  // --------------------------------------------

  private generateCSS(elements: ProductPageElement[], layout: string, mood: string): string {
    return `
/* ============================================ */
/* CareHub Product Page CSS — ${mood} / ${layout} */
/* Generated: ${new Date().toISOString()} */
/* ============================================ */

/* --- Product Page Layout --- */
.carehub-product {
  padding: 40px 0 80px;
  background: var(--color-background, #0a0a0f);
}
.carehub-product__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
}
.carehub-product__top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  margin-bottom: 60px;
  align-items: start;
}

/* --- Image Gallery --- */
.carehub-product__gallery {
  position: sticky;
  top: 100px;
}
.carehub-product__main-image {
  position: relative;
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
  background: var(--color-surface, #12121a);
  margin-bottom: 12px;
}
.carehub-product__img {
  width: 100%;
  height: auto;
  display: block;
  cursor: zoom-in;
  transition: transform 0.3s ease;
}
.carehub-product__main-image:hover .carehub-product__img {
  transform: scale(1.05);
}
.carehub-product__sale-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: var(--color-error, #f87171);
  color: #fff;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 6px;
  letter-spacing: 0.03em;
}
.carehub-product__thumbnails {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}
.carehub-product__thumb {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-surface, #12121a);
  padding: 0;
}
.carehub-product__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.carehub-product__thumb--active,
.carehub-product__thumb:hover {
  border-color: var(--color-primary, #c9a962);
}

/* --- Product Info --- */
.carehub-product__info {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Social Proof */
.carehub-product__social-proof {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.82rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  padding: 10px 14px;
  background: var(--color-surface, #12121a);
  border-radius: var(--border-radius-sm, 6px);
  border: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__social-proof strong {
  color: var(--color-primary, #c9a962) !important;
}

/* Rating */
.carehub-product__rating {
  display: flex;
  align-items: center;
  gap: 8px;
}
.carehub-product__stars {
  color: #fbbf24;
  font-size: 1.1rem;
  letter-spacing: 1px;
}
.carehub-product__rating-count {
  font-size: 0.85rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* Title & Price */
.carehub-product__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  line-height: 1.2;
  margin: 0;
}
.carehub-product__price-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.carehub-product__price {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-product__compare-price {
  font-size: 1.1rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-decoration: line-through;
}
.carehub-product__savings {
  font-size: 0.85rem;
  color: var(--color-success, #4ade80) !important;
  font-weight: 600;
  background: rgba(74, 222, 128, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
}

/* Urgency Timer */
.carehub-product__urgency {
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: var(--border-radius, 8px);
  padding: 14px 18px;
}
.carehub-product__urgency-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.carehub-product__urgency-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-error, #f87171) !important;
}
.carehub-product__timer {
  display: flex;
  align-items: center;
  gap: 6px;
}
.carehub-product__timer-unit {
  text-align: center;
}
.carehub-product__timer-unit b {
  display: block;
  font-size: 1.3rem;
  color: var(--color-heading, #fff) !important;
  font-weight: 800;
}
.carehub-product__timer-unit small {
  font-size: 0.65rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-transform: uppercase;
}
.carehub-product__timer-sep {
  font-size: 1.2rem;
  color: var(--color-error, #f87171);
  font-weight: 700;
}

/* Stock Counter */
.carehub-product__stock {
  padding: 12px 0;
}
.carehub-product__stock-bar {
  height: 6px;
  background: var(--color-border, #2a2a3a);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}
.carehub-product__stock-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-error, #f87171), var(--color-warning, #fbbf24));
  border-radius: 3px;
  transition: width 1s ease;
}
.carehub-product__stock-text {
  font-size: 0.85rem;
  color: var(--color-warning, #fbbf24) !important;
  margin: 0;
}

/* Variant Selector */
.carehub-product__variants {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.carehub-product__option-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  display: block;
  margin-bottom: 8px;
}
.carehub-product__option-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.carehub-product__option-btn {
  padding: 10px 18px;
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-sm, 6px);
  background: var(--color-surface, #12121a);
  color: var(--color-text, #e8e8e8);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.carehub-product__option-btn:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-product__option-btn--active {
  border-color: var(--color-primary, #c9a962) !important;
  background: rgba(201, 169, 98, 0.1);
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}

/* Quantity */
.carehub-product__quantity-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  display: block;
  margin-bottom: 8px;
}
.carehub-product__quantity-wrap {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
}
.carehub-product__qty-btn {
  width: 40px;
  height: 40px;
  background: var(--color-surface, #12121a);
  border: none;
  color: var(--color-text, #e8e8e8);
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.carehub-product__qty-btn:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000);
}
.carehub-product__qty-input {
  width: 50px;
  height: 40px;
  text-align: center;
  border: none !important;
  background: var(--color-background, #0a0a0f) !important;
  color: var(--color-heading, #fff) !important;
  font-weight: 700;
  font-size: 1rem;
  padding: 0 !important;
  -moz-appearance: textfield;
}
.carehub-product__qty-input::-webkit-outer-spin-button,
.carehub-product__qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

/* Add to Cart Button */
.carehub-product__add-btn {
  width: 100%;
  padding: 18px 30px !important;
  background: var(--color-button-bg, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none !important;
  border-radius: var(--border-radius, 8px) !important;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.carehub-product__add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(201, 169, 98, 0.4);
}
.carehub-product__add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Buy Now */
.carehub-product__buy-now-btn {
  width: 100%;
  padding: 16px 30px !important;
  background: transparent !important;
  color: var(--color-primary, #c9a962) !important;
  border: 2px solid var(--color-primary, #c9a962) !important;
  border-radius: var(--border-radius, 8px) !important;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.carehub-product__buy-now-btn:hover {
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
}

/* Trust Badges */
.carehub-product__trust {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 16px;
  background: var(--color-surface, #12121a);
  border-radius: var(--border-radius, 8px);
  border: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__trust-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* Guarantee Badge */
.carehub-product__guarantee {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(74, 222, 128, 0.05);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: var(--border-radius, 8px);
}
.carehub-product__guarantee-icon {
  font-size: 2rem;
}
.carehub-product__guarantee-text strong {
  display: block;
  font-size: 0.9rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__guarantee-text span {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* Share Buttons */
.carehub-product__share {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__share-label {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
.carehub-product__share a,
.carehub-product__share button {
  font-size: 1.3rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
  text-decoration: none;
}
.carehub-product__share a:hover,
.carehub-product__share button:hover {
  transform: scale(1.2);
}

/* --- Tabs --- */
.carehub-product__tabs {
  margin-top: 60px;
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
  overflow: hidden;
}
.carehub-product__tab-nav {
  display: flex;
  border-bottom: 1px solid var(--color-border, #2a2a3a);
  background: var(--color-surface, #12121a);
}
.carehub-product__tab-btn {
  flex: 1;
  padding: 16px 20px;
  background: none;
  border: none;
  color: var(--color-text-muted, #8a8a9a);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}
.carehub-product__tab-btn:hover {
  color: var(--color-heading, #fff);
}
.carehub-product__tab-btn--active {
  color: var(--color-primary, #c9a962) !important;
  border-bottom-color: var(--color-primary, #c9a962);
}
.carehub-product__tab-panel {
  display: none;
  padding: 30px;
  color: var(--color-text, #e8e8e8) !important;
  line-height: 1.8;
}
.carehub-product__tab-panel--active {
  display: block;
}
.carehub-product__tab-panel ul {
  list-style: none;
  padding: 0;
}
.carehub-product__tab-panel li {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border, #2a2a3a);
}
.carehub-product__tab-panel h4 {
  color: var(--color-heading, #fff) !important;
  margin-bottom: 16px;
}

/* --- FAQ --- */
.carehub-product__faq {
  margin-top: 50px;
}
.carehub-product__faq-title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 20px;
}
.carehub-product__faq-item {
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
  margin-bottom: 10px;
  overflow: hidden;
}
.carehub-product__faq-item summary {
  padding: 16px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-heading, #fff) !important;
  background: var(--color-card-bg, #12121a);
  list-style: none;
}
.carehub-product__faq-item summary::-webkit-details-marker { display: none; }
.carehub-product__faq-item p {
  padding: 12px 20px 16px;
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  line-height: 1.7;
}

/* --- Reviews --- */
.carehub-product__reviews {
  margin-top: 50px;
}
.carehub-product__reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.carehub-product__reviews-title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__reviews-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}
.carehub-product__reviews-stars { color: #fbbf24; font-size: 1.1rem; }
.carehub-product__reviews-avg { font-weight: 700; color: var(--color-heading, #fff) !important; }
.carehub-product__reviews-count { font-size: 0.85rem; color: var(--color-text-muted, #8a8a9a) !important; }
.carehub-product__reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.carehub-product__review {
  padding: 20px;
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
}
.carehub-product__review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.carehub-product__review-stars { color: #fbbf24; }
.carehub-product__review-verified {
  font-size: 0.75rem;
  color: var(--color-success, #4ade80) !important;
  font-weight: 600;
}
.carehub-product__review h4 {
  font-size: 0.95rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-product__review p {
  font-size: 0.88rem;
  color: var(--color-text, #e8e8e8) !important;
  line-height: 1.6;
  margin-bottom: 10px;
}
.carehub-product__review-author {
  font-size: 0.8rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}

/* --- Related Products --- */
.carehub-product__related {
  margin-top: 60px;
}
.carehub-product__related-title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 24px;
}
.carehub-product__related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.carehub-product__related-card {
  text-decoration: none;
  background: var(--color-card-bg, #12121a);
  border: 1px solid var(--color-card-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  transition: all 0.3s ease;
}
.carehub-product__related-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary, #c9a962);
}
.carehub-product__related-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.carehub-product__related-card h4 {
  padding: 12px 12px 4px;
  font-size: 0.85rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__related-price {
  padding: 0 12px 12px;
  display: block;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
  font-size: 0.95rem;
}

/* --- Sticky Cart --- */
.carehub-product__sticky {
  position: fixed;
  bottom: -100%;
  left: 0;
  right: 0;
  z-index: 999;
  background: var(--color-surface, #12121a);
  border-top: 1px solid var(--color-border, #2a2a3a);
  padding: 12px 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
  transition: bottom 0.3s ease;
}
.carehub-product__sticky--visible {
  bottom: 0;
}
.carehub-product__sticky-inner {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.carehub-product__sticky-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.carehub-product__sticky-img {
  width: 45px;
  height: 45px;
  border-radius: 6px;
  object-fit: cover;
}
.carehub-product__sticky-title {
  display: block;
  font-size: 0.85rem;
  color: var(--color-heading, #fff) !important;
}
.carehub-product__sticky-price {
  font-size: 0.9rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-product__sticky-btn {
  padding: 12px 24px;
  background: var(--color-button-bg, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: var(--border-radius, 8px);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.carehub-product__sticky-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 15px rgba(201,169,98,0.3);
}

/* --- Mobile Responsive --- */
@media (max-width: 768px) {
  .carehub-product__top {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .carehub-product__gallery {
    position: static;
  }
  .carehub-product__trust {
    grid-template-columns: 1fr;
  }
  .carehub-product__related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .carehub-product__tab-nav {
    overflow-x: auto;
  }
  .carehub-product__sticky-info {
    display: none;
  }
  .carehub-product__sticky-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .carehub-product { padding: 20px 0 60px; }
  .carehub-product__related-grid { grid-template-columns: 1fr; }
}`;
  }

  // --------------------------------------------
  // JAVASCRIPT GENERATION
  // --------------------------------------------

  private generateJS(elements: ProductPageElement[]): string {
    return `
// ============================================
// CareHub Product Page — Interactive JavaScript
// ============================================

(function() {
  'use strict';

  // --- Image Gallery ---
  window.changeImage = function(src, thumb) {
    var mainImg = document.getElementById('ch-product-img');
    if (mainImg) {
      mainImg.style.opacity = '0';
      setTimeout(function() {
        mainImg.src = src;
        mainImg.style.opacity = '1';
      }, 200);
    }
    // Update active thumbnail
    var thumbs = document.querySelectorAll('.carehub-product__thumb');
    thumbs.forEach(function(t) { t.classList.remove('carehub-product__thumb--active'); });
    if (thumb) thumb.classList.add('carehub-product__thumb--active');
  };

  // --- Quantity Selector ---
  window.updateQty = function(change) {
    var input = document.getElementById('ch-quantity');
    var formQty = document.getElementById('ch-form-qty');
    if (!input) return;
    var current = parseInt(input.value) || 1;
    var newVal = Math.max(1, Math.min(10, current + change));
    input.value = newVal;
    if (formQty) formQty.value = newVal;
  };

  // --- Buy Now ---
  window.buyNow = function() {
    var variantId = document.getElementById('ch-variant-id');
    var qty = document.getElementById('ch-quantity');
    if (variantId) {
      var id = variantId.value;
      var quantity = qty ? qty.value : 1;
      window.location.href = '/cart/' + id + ':' + quantity + '?checkout=true';
    }
  };

  // --- Tabs ---
  var tabBtns = document.querySelectorAll('.carehub-product__tab-btn');
  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = this.getAttribute('data-tab');
      // Remove active from all
      tabBtns.forEach(function(b) { b.classList.remove('carehub-product__tab-btn--active'); });
      document.querySelectorAll('.carehub-product__tab-panel').forEach(function(p) { p.classList.remove('carehub-product__tab-panel--active'); });
      // Add active
      this.classList.add('carehub-product__tab-btn--active');
      var panel = document.getElementById('tab-' + tab);
      if (panel) panel.classList.add('carehub-product__tab-panel--active');
    });
  });

  // --- Variant Selector ---
  var optionBtns = document.querySelectorAll('.carehub-product__option-btn');
  optionBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var siblings = this.parentElement.querySelectorAll('.carehub-product__option-btn');
      siblings.forEach(function(s) { s.classList.remove('carehub-product__option-btn--active'); });
      this.classList.add('carehub-product__option-btn--active');
    });
  });

  // --- Urgency Timer ---
  ${elements.includes('urgency_timer') ? `
  function updateProductTimer() {
    var now = new Date();
    var end = new Date();
    end.setHours(23, 59, 59, 999);
    var diff = end - now;
    if (diff <= 0) { end.setDate(end.getDate() + 1); diff = end - now; }
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    var he = document.getElementById('ch-p-hours');
    var me = document.getElementById('ch-p-mins');
    var se = document.getElementById('ch-p-secs');
    if (he) he.textContent = h.toString().padStart(2, '0');
    if (me) me.textContent = m.toString().padStart(2, '0');
    if (se) se.textContent = s.toString().padStart(2, '0');
  }
  updateProductTimer();
  setInterval(updateProductTimer, 1000);
  ` : ''}

  // --- Sticky Cart ---
  ${elements.includes('sticky_cart') ? `
  var stickyCart = document.getElementById('ch-sticky-cart');
  var addBtn = document.querySelector('.carehub-product__add-btn');
  if (stickyCart && addBtn) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          stickyCart.classList.remove('carehub-product__sticky--visible');
        } else {
          stickyCart.classList.add('carehub-product__sticky--visible');
        }
      });
    }, { threshold: 0 });
    observer.observe(addBtn);
  }
  ` : ''}

  // --- Social Proof (Random Viewers) ---
  ${elements.includes('social_proof') ? `
  var viewersEl = document.getElementById('ch-viewers');
  if (viewersEl) {
    setInterval(function() {
      var current = parseInt(viewersEl.textContent) || 15;
      var change = Math.random() > 0.5 ? 1 : -1;
      var newVal = Math.max(8, Math.min(35, current + change));
      viewersEl.textContent = newVal;
    }, 5000);
  }
  ` : ''}

  // --- Recently Viewed ---
  ${elements.includes('recently_viewed') ? `
  try {
    var productData = {
      url: window.location.pathname,
      title: document.querySelector('.carehub-product__title') ? document.querySelector('.carehub-product__title').textContent.trim() : '',
      image: document.getElementById('ch-product-img') ? document.getElementById('ch-product-img').src : '',
      price: document.querySelector('.carehub-product__price') ? document.querySelector('.carehub-product__price').textContent.trim() : ''
    };
    var rv = JSON.parse(localStorage.getItem('carehub_rv') || '[]');
    rv = rv.filter(function(p) { return p.url !== productData.url; });
    rv.unshift(productData);
    rv = rv.slice(0, 8);
    localStorage.setItem('carehub_rv', JSON.stringify(rv));
    // Display
    var rvSection = document.getElementById('ch-recently-viewed');
    var rvGrid = document.getElementById('ch-rv-grid');
    var rvItems = rv.filter(function(p) { return p.url !== window.location.pathname; });
    if (rvSection && rvGrid && rvItems.length > 0) {
      rvSection.style.display = 'block';
      rvGrid.innerHTML = rvItems.slice(0, 4).map(function(p) {
        return '' +
          (p.image ? '' : '') +
          '' + p.title.substring(0, 40) + '' +
          '' + p.price + '' +
          '';
      }).join('');
    }
  } catch(e) {}
  ` : ''}

  // --- Image Zoom (simple) ---
  var mainImage = document.getElementById('ch-product-img');
  if (mainImage) {
    mainImage.style.transition = 'opacity 0.2s ease, transform 0.3s ease';
  }

})();`;
  }

  // --------------------------------------------
  // APPLY TO STORE
  // --------------------------------------------

  private async applyToStore(liquidCode: string, cssCode: string, jsCode: string): Promise {
    try {
      const themeResponse = await this.shopify.getMainTheme();
      if (!themeResponse.success || !themeResponse.data) return false;

      const themeId = themeResponse.data.id;

      // Upload CSS
      await this.shopify.updateThemeAsset(themeId, {
        key: 'assets/carehub-product.css',
        value: cssCode,
      });

      // Upload JS
      await this.shopify.updateThemeAsset(themeId, {
        key: 'assets/carehub-product.js',
        value: jsCode,
      });

      // Upload Liquid snippet
      await this.shopify.updateThemeAsset(themeId, {
        key: 'snippets/carehub-product-page.liquid',
        value: liquidCode,
      });

      // Try to inject into product template
      const productTemplate = await this.shopify.getThemeAsset(themeId, 'templates/product.liquid');
      if (productTemplate.success && productTemplate.data?.asset.value) {
        let content = productTemplate.data.asset.value;
        if (!content.includes('carehub-product-page')) {
          content = `{% render 'carehub-product-page' %}\n`;
          await this.shopify.updateThemeAsset(themeId, {
            key: 'templates/product.liquid',
            value: content,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('[ProductPage] Error applying to store:', error);
      return false;
    }
  }

  // --------------------------------------------
  // HELPERS
  // --------------------------------------------

  private getDefaultElements(): ProductPageElement[] {
    return [
      'image_gallery',
      'social_proof',
      'title_price',
      'urgency_timer',
      'stock_counter',
      'variant_selector',
      'quantity_selector',
      'add_to_cart',
      'buy_now',
      'trust_badges',
      'guarantee_badge',
      'share_buttons',
      'description_tabs',
      'faq',
      'reviews',
      'related_products',
      'recently_viewed',
      'sticky_cart',
    ];
  }

  // --------------------------------------------
  // SECTION MANAGEMENT
  // --------------------------------------------

  async addElement(element: ProductPageElement): Promise {
    const preferences = await this.memory.getPreferences();
    const elements = [...this.getDefaultElements(), element];
    return this.buildProductPage({ elements, mood: preferences.mood });
  }

  async removeElement(element: ProductPageElement): Promise {
    const preferences = await this.memory.getPreferences();
    const elements = this.getDefaultElements().filter(e => e !== element);
    return this.buildProductPage({ elements, mood: preferences.mood });
  }

  async updateLayout(layoutStyle: 'classic' | 'modern' | 'minimal' | 'luxury'): Promise {
    const preferences = await this.memory.getPreferences();
    return this.buildProductPage({ layoutStyle, mood: preferences.mood });
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let productPageInstance: ProductPageBuilder | null = null;

export function getProductPageBuilder(): ProductPageBuilder {
  if (!productPageInstance) {
    productPageInstance = new ProductPageBuilder();
  }
  return productPageInstance;
}

export function resetProductPageBuilder(): void {
  productPageInstance = null;
}
