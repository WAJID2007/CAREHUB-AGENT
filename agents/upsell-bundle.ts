// ============================================
// CAREHUB AI AGENT — UPSELL & BUNDLE (AGENT #8)
// ============================================
// Complete upsell ecosystem to maximize revenue:
// - Pre-purchase upsells (on product page)
// - Cart page upsells
// - Post-purchase one-click upsells
// - Product bundles with discount
// - Cross-sell recommendations
// - "Frequently Bought Together"
// - Quantity discount breaks
// - "Complete the look" suggestions
// AI decides best combinations automatically.
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient, ShopifyProduct } from '@/lib/shopify';
import { GeminiMessage } from '@/lib/gemini';
import { GroqMessage } from '@/lib/groq';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface UpsellRequest {
  type: UpsellType;
  productId?: number;
  productIds?: number[];
  discountPercent?: number;
  bundleName?: string;
  maxItems?: number;
  mood?: string;
  customInstructions?: string;
}

export type UpsellType =
  | 'pre_purchase'
  | 'cart_upsell'
  | 'post_purchase'
  | 'bundle'
  | 'cross_sell'
  | 'frequently_bought'
  | 'quantity_discount'
  | 'complete_the_look'
  | 'all';

export interface UpsellResult {
  success: boolean;
  type: UpsellType;
  liquidCode: string;
  cssCode: string;
  jsCode: string;
  applied: boolean;
  message: string;
  config?: UpsellConfig;
}

export interface UpsellConfig {
  bundles: BundleConfig[];
  quantityBreaks: QuantityBreak[];
  crossSells: CrossSellRule[];
  cartUpsells: CartUpsellRule[];
}

export interface BundleConfig {
  id: string;
  name: string;
  productIds: number[];
  discountPercent: number;
  discountType: 'percentage' | 'fixed';
  comparePrice: number;
  bundlePrice: number;
  active: boolean;
}

export interface QuantityBreak {
  minQuantity: number;
  discountPercent: number;
  label: string;
  badge?: string;
}

export interface CrossSellRule {
  triggerProductId: number;
  recommendProductIds: number[];
  message: string;
  discountPercent?: number;
}

export interface CartUpsellRule {
  minCartValue: number;
  productId: number;
  message: string;
  discountPercent: number;
  position: 'top' | 'bottom' | 'popup';
}

// --------------------------------------------
// DEFAULT QUANTITY BREAKS
// --------------------------------------------

const DEFAULT_QUANTITY_BREAKS: QuantityBreak[] = [
  { minQuantity: 1, discountPercent: 0, label: '1 Item', badge: '' },
  { minQuantity: 2, discountPercent: 10, label: '2 Items — Save 10%', badge: 'Popular' },
  { minQuantity: 3, discountPercent: 15, label: '3 Items — Save 15%', badge: 'Best Value' },
  { minQuantity: 5, discountPercent: 20, label: '5+ Items — Save 20%', badge: 'Maximum Savings' },
];

// --------------------------------------------
// UPSELL BUILDER CLASS
// --------------------------------------------

export class UpsellBundleBuilder {
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

  async buildUpsell(request: UpsellRequest): Promise<UpsellResult> {
    try {
      const preferences = await this.memory.getPreferences();
      const mood = request.mood || preferences.mood || 'premium';

      if (request.type === 'all') {
        return this.buildCompleteUpsellSystem(request, mood);
      }

      let liquidCode = '';
      let cssCode = '';
      let jsCode = '';

      switch (request.type) {
        case 'pre_purchase':
          ({ liquidCode, cssCode, jsCode } = this.buildPrePurchase(mood));
          break;
        case 'cart_upsell':
          ({ liquidCode, cssCode, jsCode } = this.buildCartUpsell(mood));
          break;
        case 'post_purchase':
          ({ liquidCode, cssCode, jsCode } = this.buildPostPurchase(mood));
          break;
        case 'bundle':
          ({ liquidCode, cssCode, jsCode } = this.buildBundle(request, mood));
          break;
        case 'cross_sell':
          ({ liquidCode, cssCode, jsCode } = this.buildCrossSell(mood));
          break;
        case 'frequently_bought':
          ({ liquidCode, cssCode, jsCode } = this.buildFrequentlyBought(mood));
          break;
        case 'quantity_discount':
          ({ liquidCode, cssCode, jsCode } = this.buildQuantityDiscount(request, mood));
          break;
        case 'complete_the_look':
          ({ liquidCode, cssCode, jsCode } = this.buildCompleteTheLook(mood));
          break;
      }

      // Apply to store
      let applied = false;
      if (this.shopify.isConfigured()) {
        applied = await this.applyToStore(request.type, liquidCode, cssCode, jsCode);
      }

      // Save to memory
      await this.memory.logAction({
        agent: 'upsell-bundle',
        action: `build_${request.type}`,
        input: JSON.stringify(request),
        output: `Built ${request.type} upsell`,
        success: true,
        duration: 0,
        reversible: true,
      });

      return {
        success: true,
        type: request.type,
        liquidCode,
        cssCode,
        jsCode,
        applied,
        message: applied
          ? `✅ ${request.type} upsell system built and applied!`
          : `✅ ${request.type} upsell system built! Connect Shopify to apply.`,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        type: request.type,
        liquidCode: '',
        cssCode: '',
        jsCode: '',
        applied: false,
        message: `❌ Error building upsell: ${errMsg}`,
      };
    }
  }

  // --------------------------------------------
  // COMPLETE UPSELL SYSTEM
  // --------------------------------------------

  private async buildCompleteUpsellSystem(request: UpsellRequest, mood: string): Promise<UpsellResult> {
    const prePurchase = this.buildPrePurchase(mood);
    const cartUpsell = this.buildCartUpsell(mood);
    const frequentlyBought = this.buildFrequentlyBought(mood);
    const quantityDiscount = this.buildQuantityDiscount(request, mood);
    const crossSell = this.buildCrossSell(mood);

    const liquidCode = [
      prePurchase.liquidCode,
      cartUpsell.liquidCode,
      frequentlyBought.liquidCode,
      quantityDiscount.liquidCode,
      crossSell.liquidCode,
    ].join('\n\n');

    const cssCode = [
      prePurchase.cssCode,
      cartUpsell.cssCode,
      frequentlyBought.cssCode,
      quantityDiscount.cssCode,
      crossSell.cssCode,
    ].join('\n\n');

    const jsCode = [
      prePurchase.jsCode,
      cartUpsell.jsCode,
      frequentlyBought.jsCode,
      quantityDiscount.jsCode,
      crossSell.jsCode,
    ].join('\n\n');

    let applied = false;
    if (this.shopify.isConfigured()) {
      applied = await this.applyToStore('all', liquidCode, cssCode, jsCode);
    }

    return {
      success: true,
      type: 'all',
      liquidCode,
      cssCode,
      jsCode,
      applied,
      message: applied
        ? `✅ Complete upsell system built (5 components) and applied!`
        : `✅ Complete upsell system built! Connect Shopify to apply.`,
    };
  }

  // --------------------------------------------
  // PRE-PURCHASE UPSELL (Product Page)
  // --------------------------------------------

  private buildPrePurchase(mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const liquidCode = `
{% comment %} CareHub: Pre-Purchase Upsell {% endcomment %}

  
    🎁 Special Offer
    Add These & Save More
  
  
    {% for rec in product.collections.first.products limit: 3 %}
      {% if rec.id != product.id %}
      
        
          
          {% if rec.featured_image %}
            
          {% endif %}
          
            {{ rec.title | truncate: 35 }}
            {{ rec.price | money }}
          
        
        + Add
      
      {% endif %}
    {% endfor %}
  
  
    💰 You're saving $0 with this combination!
  
`;

    const cssCode = `
/* Pre-Purchase Upsell */
.carehub-upsell-pre {
  margin: 20px 0;
  padding: 20px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
}
.carehub-upsell-pre__header {
  margin-bottom: 14px;
}
.carehub-upsell-pre__badge {
  display: inline-block;
  background: rgba(201, 169, 98, 0.1);
  color: var(--color-primary, #c9a962);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.carehub-upsell-pre__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 0;
}
.carehub-upsell-pre__items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.carehub-upsell-pre__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}
.carehub-upsell-pre__item:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-upsell-pre__item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.carehub-upsell-pre__check {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary, #c9a962);
  cursor: pointer;
}
.carehub-upsell-pre__img {
  width: 45px;
  height: 45px;
  border-radius: 6px;
  object-fit: cover;
}
.carehub-upsell-pre__name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
}
.carehub-upsell-pre__price {
  font-size: 0.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-upsell-pre__add-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid var(--color-primary, #c9a962);
  border-radius: 6px;
  transition: all 0.2s;
}
.carehub-upsell-pre__add-label:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
}
.carehub-upsell-pre__savings {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--color-success, #4ade80) !important;
  text-align: center;
}`;

    const jsCode = `
// Pre-Purchase Upsell Logic
(function(){
  var checks = document.querySelectorAll('.carehub-upsell-pre__check');
  var savingsEl = document.getElementById('ch-pre-savings');
  var saveAmountEl = document.getElementById('ch-save-amount');
  
  checks.forEach(function(check) {
    check.addEventListener('change', function() {
      var checked = document.querySelectorAll('.carehub-upsell-pre__check:checked');
      if (checked.length > 0 && savingsEl) {
        savingsEl.style.display = 'block';
        var savings = checked.length * 5;
        if (saveAmountEl) saveAmountEl.textContent = '$' + savings.toFixed(2);
      } else if (savingsEl) {
        savingsEl.style.display = 'none';
      }
    });
    
    // Click entire item to toggle
    var item = check.closest('.carehub-upsell-pre__item');
    if (item) {
      item.addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
          check.checked = !check.checked;
          check.dispatchEvent(new Event('change'));
        }
      });
    }
  });
})();`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // CART UPSELL
  // --------------------------------------------

  private buildCartUpsell(mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const liquidCode = `
{% comment %} CareHub: Cart Upsell {% endcomment %}

  
    🔥 Customers Also Bought
    Add & Save 15%
  
  
    {% for product in collections.all.products limit: 6 %}
    
      
        {% if product.featured_image %}
          
        {% endif %}
      
      
        {{ product.title | truncate: 25 }}
        
          {{ product.price | times: 0.85 | money }}
          {{ product.price | money }}
        
      
      
        + Add
      
    
    {% endfor %}
  
`;

    const cssCode = `
/* Cart Upsell */
.carehub-cart-upsell {
  margin: 20px 0;
  padding: 20px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
}
.carehub-cart-upsell__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.carehub-cart-upsell__header h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 0;
}
.carehub-cart-upsell__discount {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-success, #4ade80) !important;
  background: rgba(74, 222, 128, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}
.carehub-cart-upsell__slider {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.carehub-cart-upsell__slider::-webkit-scrollbar { display: none; }
.carehub-cart-upsell__item {
  flex-shrink: 0;
  width: 160px;
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 10px;
  text-align: center;
  scroll-snap-align: start;
  transition: all 0.2s ease;
}
.carehub-cart-upsell__item:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-cart-upsell__image {
  margin-bottom: 8px;
}
.carehub-cart-upsell__image img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}
.carehub-cart-upsell__name {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 6px;
  line-height: 1.3;
}
.carehub-cart-upsell__pricing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
}
.carehub-cart-upsell__sale-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-cart-upsell__original-price {
  font-size: 0.75rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  text-decoration: line-through;
}
.carehub-cart-upsell__add-btn {
  width: 100%;
  padding: 8px;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}
.carehub-cart-upsell__add-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.carehub-cart-upsell__add-btn.added {
  background: var(--color-success, #4ade80);
}`;

    const jsCode = `
// Cart Upsell — Add to Cart
window.addCartUpsell = function(btn) {
  var variantId = btn.getAttribute('data-variant-id');
  if (!variantId) return;
  
  btn.textContent = '...';
  btn.disabled = true;
  
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
  })
  .then(function(r) { return r.json(); })
  .then(function() {
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(function() { btn.textContent = '+ Add'; btn.disabled = false; btn.classList.remove('added'); }, 2000);
  })
  .catch(function() {
    btn.textContent = 'Error';
    setTimeout(function() { btn.textContent = '+ Add'; btn.disabled = false; }, 2000);
  });
};`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // POST-PURCHASE UPSELL
  // --------------------------------------------

  private buildPostPurchase(mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const liquidCode = `
{% comment %} CareHub: Post-Purchase Upsell (Thank You Page) {% endcomment %}

  
    🎉 Exclusive One-Time Offer
    Wait! Add This For 25% Off
    As a thank you for your order, we're offering you an exclusive deal. This offer won't appear again!
    
      {% for product in collections.all.products limit: 1 offset: 3 %}
      
        {% if product.featured_image %}
          
        {% endif %}
        
          {{ product.title }}
          
            {{ product.price | times: 0.75 | money }}
            {{ product.price | money }}
            Save 25%
          
        
      
      
        
          ✅ Yes! Add to My Order
        
        
          No thanks, I'll pass
        
      
      {% endfor %}
    
    
      ⏰ Offer expires in: 4:59
    
  
`;

    const cssCode = `
/* Post-Purchase Upsell */
.carehub-post-upsell {
  max-width: 500px;
  margin: 30px auto;
  padding: 30px;
  background: var(--color-surface, #12121a);
  border: 2px solid var(--color-primary, #c9a962);
  border-radius: var(--border-radius-lg, 16px);
  text-align: center;
  box-shadow: 0 10px 40px rgba(201, 169, 98, 0.15);
}
.carehub-post-upsell__badge {
  display: inline-block;
  background: rgba(201, 169, 98, 0.15);
  color: var(--color-primary, #c9a962);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 14px;
}
.carehub-post-upsell__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.5rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-post-upsell__desc {
  font-size: 0.9rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 20px;
  line-height: 1.5;
}
.carehub-post-upsell__product-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-background, #0a0a0f);
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: left;
}
.carehub-post-upsell__product-card img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}
.carehub-post-upsell__product-info h4 {
  font-size: 0.9rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 8px;
}
.carehub-post-upsell__pricing {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.carehub-post-upsell__new-price {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-post-upsell__old-price {
  font-size: 0.9rem;
  text-decoration: line-through;
  color: var(--color-text-muted, #8a8a9a) !important;
}
.carehub-post-upsell__save-badge {
  background: var(--color-success, #4ade80);
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}
.carehub-post-upsell__buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.carehub-post-upsell__yes-btn {
  padding: 16px;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.carehub-post-upsell__yes-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(201, 169, 98, 0.4);
}
.carehub-post-upsell__no-btn {
  padding: 12px;
  background: none;
  border: none;
  color: var(--color-text-muted, #8a8a9a) !important;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
}
.carehub-post-upsell__timer {
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--color-error, #f87171) !important;
}
.carehub-post-upsell__timer strong {
  color: var(--color-error, #f87171) !important;
}`;

    const jsCode = `
// Post-Purchase Upsell
window.acceptPostUpsell = function(btn) {
  var variantId = btn.getAttribute('data-variant-id');
  if (!variantId) return;
  btn.textContent = 'Adding...';
  btn.disabled = true;
  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
  })
  .then(function(r) { return r.json(); })
  .then(function() {
    btn.textContent = '✅ Added to Order!';
    btn.style.background = '#4ade80';
  })
  .catch(function() {
    btn.textContent = 'Error — Try Again';
    btn.disabled = false;
  });
};

// Post-purchase timer
(function(){
  var timerEl = document.getElementById('ch-post-timer');
  if (!timerEl) return;
  var seconds = 299;
  setInterval(function(){
    if (seconds <= 0) { timerEl.textContent = 'EXPIRED'; return; }
    seconds--;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    timerEl.textContent = m + ':' + s.toString().padStart(2, '0');
  }, 1000);
})();`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // FREQUENTLY BOUGHT TOGETHER
  // --------------------------------------------

  private buildFrequentlyBought(mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const liquidCode = `
{% comment %} CareHub: Frequently Bought Together {% endcomment %}

  Frequently Bought Together
  
    
      {% if product.featured_image %}
        
      {% endif %}
      {{ product.title | truncate: 20 }}
      {{ product.price | money }}
    
    {% for rec in product.collections.first.products limit: 2 %}
      {% if rec.id != product.id %}
      +
      
        
        {% if rec.featured_image %}
          
        {% endif %}
        {{ rec.title | truncate: 20 }}
        {{ rec.price | money }}
      
      {% endif %}
    {% endfor %}
  
  
    
      Bundle Price:
      Save 15%
    
    
      🛒 Add All to Cart
    
  
`;

    const cssCode = `
/* Frequently Bought Together */
.carehub-fbt {
  margin: 40px 0;
  padding: 24px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
}
.carehub-fbt__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 20px;
}
.carehub-fbt__products {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.carehub-fbt__product {
  text-align: center;
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 10px;
  width: 130px;
  position: relative;
}
.carehub-fbt__product--current {
  border-color: var(--color-primary, #c9a962);
}
.carehub-fbt__product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 6px;
}
.carehub-fbt__product span {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 4px;
}
.carehub-fbt__product strong {
  font-size: 0.9rem;
  color: var(--color-primary, #c9a962) !important;
}
.carehub-fbt__check {
  position: absolute;
  top: 8px;
  right: 8px;
  accent-color: var(--color-primary, #c9a962);
}
.carehub-fbt__plus {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962);
}
.carehub-fbt__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--color-border, #2a2a3a);
}
.carehub-fbt__bundle-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-success, #4ade80) !important;
}
.carehub-fbt__buy-btn {
  padding: 12px 24px;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}
.carehub-fbt__buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(201, 169, 98, 0.3);
}
@media (max-width: 600px) {
  .carehub-fbt__products { flex-direction: column; }
  .carehub-fbt__plus { transform: rotate(90deg); }
  .carehub-fbt__product { width: 100%; }
}`;

    const jsCode = `
// Frequently Bought Together — Buy Bundle
window.buyBundle = function() {
  var products = document.querySelectorAll('.carehub-fbt__product:not(.carehub-fbt__product--current)');
  var items = [];
  
  // Add current product
  var currentVariant = document.getElementById('ch-variant-id');
  if (currentVariant) {
    items.push({ id: parseInt(currentVariant.value), quantity: 1 });
  }
  
  // Add checked upsell products
  products.forEach(function(p) {
    var check = p.querySelector('.carehub-fbt__check');
    if (check && check.checked) {
      var vid = p.getAttribute('data-variant-id');
      if (vid) items.push({ id: parseInt(vid), quantity: 1 });
    }
  });
  
  if (items.length === 0) return;
  
  var btn = document.querySelector('.carehub-fbt__buy-btn');
  if (btn) { btn.textContent = 'Adding...'; btn.disabled = true; }
  
  // Add all items
  var addPromises = items.map(function(item) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  });
  
  Promise.all(addPromises)
    .then(function() {
      if (btn) { btn.textContent = '✅ Added All!'; btn.style.background = '#4ade80'; }
      setTimeout(function() { window.location.href = '/cart'; }, 1000);
    })
    .catch(function() {
      if (btn) { btn.textContent = 'Error — Try Again'; btn.disabled = false; }
    });
};`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // QUANTITY DISCOUNT
  // --------------------------------------------

  private buildQuantityDiscount(request: UpsellRequest, mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const breaks = DEFAULT_QUANTITY_BREAKS;

    const breaksHtml = breaks.map((b, i) => `
      
        ${b.badge ? `${b.badge}` : ''}
        ${b.label}
        ${b.discountPercent > 0 ? `-${b.discountPercent}%` : 'Standard'}
      `
    ).join('');

    const liquidCode = `
{% comment %} CareHub: Quantity Discount Breaks {% endcomment %}

  💰 Buy More, Save More
  
    ${breaksHtml}
  
`;

    const cssCode = `
/* Quantity Discount Breaks */
.carehub-qty-break {
  margin: 18px 0;
  padding: 18px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius, 8px);
}
.carehub-qty-break__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 0 0 14px 0;
}
.carehub-qty-break__options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.carehub-qty-break__option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.carehub-qty-break__option:hover {
  border-color: var(--color-primary, #c9a962);
}
.carehub-qty-break__option--popular {
  border-color: var(--color-primary, #c9a962);
  background: rgba(201, 169, 98, 0.05);
}
.carehub-qty-break__option--selected {
  border-color: var(--color-primary, #c9a962) !important;
  background: rgba(201, 169, 98, 0.1) !important;
  box-shadow: 0 0 0 1px var(--color-primary, #c9a962);
}
.carehub-qty-break__badge {
  position: absolute;
  top: -8px;
  right: 10px;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}
.carehub-qty-break__label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-heading, #fff) !important;
}
.carehub-qty-break__savings {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-success, #4ade80) !important;
}`;

    const jsCode = `
// Quantity Discount Break Selection
window.selectQtyBreak = function(el) {
  // Remove previous selection
  document.querySelectorAll('.carehub-qty-break__option').forEach(function(opt) {
    opt.classList.remove('carehub-qty-break__option--selected');
  });
  
  // Select this one
  el.classList.add('carehub-qty-break__option--selected');
  
  // Update quantity input
  var qty = el.getAttribute('data-qty');
  var qtyInput = document.getElementById('ch-quantity');
  var formQty = document.getElementById('ch-form-qty');
  if (qtyInput) qtyInput.value = qty;
  if (formQty) formQty.value = qty;
};`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // CROSS-SELL
  // --------------------------------------------

  private buildCrossSell(mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const liquidCode = `
{% comment %} CareHub: Cross-Sell (Scroll-Triggered) {% endcomment %}

  
    ✕
    
      👋 While you're here...
      Complete Your Order
      
        {% for rec in collections.all.products limit: 1 offset: 2 %}
        
        
          {{ rec.title | truncate: 30 }}
          {{ rec.price | money }}
        
        Add
        {% endfor %}
      
    
  
`;

    const cssCode = `
/* Cross-Sell Popup */
.carehub-cross-sell {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 998;
  animation: slideUp 0.5s ease;
}
.carehub-cross-sell__inner {
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  max-width: 320px;
  position: relative;
}
.carehub-cross-sell__close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  color: var(--color-text-muted, #8a8a9a);
  font-size: 1.1rem;
  cursor: pointer;
}
.carehub-cross-sell__label {
  font-size: 0.75rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 600;
}
.carehub-cross-sell__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
  margin: 4px 0 12px;
}
.carehub-cross-sell__product {
  display: flex;
  align-items: center;
  gap: 10px;
}
.carehub-cross-sell__img {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
}
.carehub-cross-sell__name {
  display: block;
  font-size: 0.8rem;
  color: var(--color-heading, #fff) !important;
  font-weight: 600;
}
.carehub-cross-sell__price {
  font-size: 0.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-cross-sell__add {
  margin-left: auto;
  padding: 8px 14px;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
@keyframes slideUp {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (max-width: 480px) {
  .carehub-cross-sell { left: 10px; right: 10px; bottom: 10px; }
  .carehub-cross-sell__inner { max-width: 100%; }
}`;

    const jsCode = `
// Cross-Sell — Show on Scroll
(function(){
  var crossSell = document.getElementById('ch-cross-sell');
  if (!crossSell) return;
  var shown = false;
  window.addEventListener('scroll', function() {
    if (shown) return;
    var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    if (scrollPercent > 50) {
      crossSell.style.display = 'block';
      shown = true;
      // Auto-hide after 15 seconds
      setTimeout(function() {
        if (crossSell.style.display !== 'none') {
          crossSell.style.display = 'none';
        }
      }, 15000);
    }
  });
})();`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // COMPLETE THE LOOK
  // --------------------------------------------

  private buildCompleteTheLook(mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const liquidCode = `
{% comment %} CareHub: Complete the Look {% endcomment %}

  ✨ Complete the Look
  Hand-picked items that pair perfectly together
  
    {% for rec in product.collections.first.products limit: 3 %}
      {% if rec.id != product.id %}
      
        {% if rec.featured_image %}
          
            
          
        {% endif %}
        {{ rec.title | truncate: 30 }}
        {{ rec.price | money }}
        + Add to Cart
      
      {% endif %}
    {% endfor %}
  
`;

    const cssCode = `
/* Complete the Look */
.carehub-complete {
  margin: 50px 0;
  padding: 30px;
  background: var(--color-surface, #12121a);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: var(--border-radius-lg, 16px);
}
.carehub-complete__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.3rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 4px;
}
.carehub-complete__subtitle {
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 20px;
}
.carehub-complete__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.carehub-complete__item {
  text-align: center;
  padding: 14px;
  background: var(--color-background, #0a0a0f);
  border: 1px solid var(--color-border, #2a2a3a);
  border-radius: 10px;
  transition: all 0.3s ease;
}
.carehub-complete__item:hover {
  border-color: var(--color-primary, #c9a962);
  transform: translateY(-3px);
}
.carehub-complete__item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 10px;
}
.carehub-complete__item h4 {
  font-size: 0.85rem;
  margin-bottom: 6px;
}
.carehub-complete__item h4 a {
  color: var(--color-heading, #fff) !important;
  text-decoration: none;
}
.carehub-complete__price {
  display: block;
  font-weight: 700;
  color: var(--color-primary, #c9a962) !important;
  margin-bottom: 10px;
  font-size: 0.95rem;
}
.carehub-complete__add-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-primary, #c9a962);
  color: var(--color-primary, #c9a962) !important;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}
.carehub-complete__add-btn:hover {
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000) !important;
}
@media (max-width: 600px) {
  .carehub-complete__grid { grid-template-columns: 1fr; }
}`;

    const jsCode = `// Complete the Look uses the addCartUpsell function defined above`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // BUNDLE BUILDER
  // --------------------------------------------

  private buildBundle(request: UpsellRequest, mood: string): { liquidCode: string; cssCode: string; jsCode: string } {
    const discountPercent = request.discountPercent || 15;
    const bundleName = request.bundleName || 'Ultimate Bundle';

    const liquidCode = `
{% comment %} CareHub: Product Bundle {% endcomment %}

  
    🎁 Bundle & Save ${discountPercent}%
    ${bundleName}
    Get everything you need at a special bundle price
  
  
    {% for rec in product.collections.first.products limit: 3 %}
    
      {% if rec.featured_image %}
        
      {% endif %}
      {{ rec.title | truncate: 25 }}
      {{ rec.price | money }}
    
    {% unless forloop.last %}+{% endunless %}
    {% endfor %}
  
  
    
      Regular Price:
      
    
    
      Bundle Price:
      
    
    
      You Save: ${discountPercent}%
    
  
  
    🛒 Get the Bundle — Save ${discountPercent}%
  
`;

    const cssCode = `
/* Product Bundle */
.carehub-bundle {
  margin: 30px 0;
  padding: 28px;
  background: var(--color-surface, #12121a);
  border: 2px solid var(--color-primary, #c9a962);
  border-radius: var(--border-radius-lg, 16px);
  text-align: center;
}
.carehub-bundle__badge {
  display: inline-block;
  background: var(--color-primary, #c9a962);
  color: var(--color-button-text, #000);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 10px;
}
.carehub-bundle__title {
  font-family: var(--font-heading, 'Playfair Display'), serif;
  font-size: 1.4rem;
  color: var(--color-heading, #fff) !important;
  margin-bottom: 4px;
}
.carehub-bundle__desc {
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 20px;
}
.carehub-bundle__products {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.carehub-bundle__product {
  padding: 12px;
  background: var(--color-background, #0a0a0f);
  border-radius: 10px;
  width: 120px;
}
.carehub-bundle__product img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 6px;
}
.carehub-bundle__product-name {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #8a8a9a) !important;
  margin-bottom: 3px;
}
.carehub-bundle__product-price {
  font-size: 0.8rem;
  color: var(--color-primary, #c9a962) !important;
  font-weight: 700;
}
.carehub-bundle__connector {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary, #c9a962);
}
.carehub-bundle__pricing {
  margin-bottom: 18px;
  padding: 14px;
  background: rgba(201, 169, 98, 0.05);
  border-radius: 8px;
}
.carehub-bundle__original {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.88rem;
  color: var(--color-text-muted, #8a8a9a) !important;
}
.carehub-bundle__original-price {
  text-decoration: line-through;
}
.carehub-bundle__discounted {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading, #fff) !important;
}
.carehub-bundle__bundle-price {
  color: var(--color-primary, #c9a962) !important;
  font-size: 1.2rem;
}
.carehub-bundle__you-save {
  font-size: 0.9rem;
  color: var(--color-success, #4ade80) !important;
  font-weight: 600;
}
.carehub-bundle__buy-btn {
  width: 100%;
  padding: 16px;
  background: var(--color-primary, #c9a962) !important;
  color: var(--color-button-text, #000) !important;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.carehub-bundle__buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 169, 98, 0.4);
}
@media (max-width: 480px) {
  .carehub-bundle__products { flex-direction: column; }
  .carehub-bundle__connector { transform: rotate(90deg); }
}`;

    const jsCode = `// Bundle uses the buyBundle() function defined in Frequently Bought Together`;

    return { liquidCode, cssCode, jsCode };
  }

  // --------------------------------------------
  // APPLY TO STORE
  // --------------------------------------------

  private async applyToStore(
    type: string,
    liquidCode: string,
    cssCode: string,
    jsCode: string
  ): Promise<boolean> {
    try {
      const themeResponse = await this.shopify.getMainTheme();
      if (!themeResponse.success || !themeResponse.data) return false;

      const themeId = themeResponse.data.id;

      // Upload CSS
      await this.shopify.updateThemeAsset(themeId, {
        key: 'assets/carehub-upsell.css',
        value: cssCode,
      });

      // Upload JS
      await this.shopify.updateThemeAsset(themeId, {
        key: 'assets/carehub-upsell.js',
        value: jsCode,
      });

      // Upload Liquid snippet
      await this.shopify.updateThemeAsset(themeId, {
        key: 'snippets/carehub-upsell.liquid',
        value: liquidCode,
      });

      // Inject CSS in theme.liquid
      const themeLiquid = await this.shopify.getThemeAsset(themeId, 'layout/theme.liquid');
      if (themeLiquid.success && themeLiquid.data?.asset.value) {
        let content = themeLiquid.data.asset.value;
        if (!content.includes('carehub-upsell.css')) {
          content = content.replace('', `  {{ 'carehub-upsell.css' | asset_url | stylesheet_tag }}\n`);
          content = content.replace('', `  \n`);
          await this.shopify.updateThemeAsset(themeId, {
            key: 'layout/theme.liquid',
            value: content,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('[Upsell] Error applying to store:', error);
      return false;
    }
  }

  // --------------------------------------------
  // AI RECOMMENDATIONS
  // --------------------------------------------

  async getSmartRecommendations(productId: number): Promise<{
    crossSells: number[];
    bundleWith: number[];
    reason: string;
  }> {
    if (!this.shopify.isConfigured()) {
      return { crossSells: [], bundleWith: [], reason: 'Shopify not configured' };
    }

    const productResponse = await this.shopify.getProduct(productId);
    if (!productResponse.success || !productResponse.data) {
      return { crossSells: [], bundleWith: [], reason: 'Product not found' };
    }

    const product = productResponse.data.product;
    const productsResponse = await this.shopify.getProducts({ limit: 20 });
    if (!productsResponse.success || !productsResponse.data) {
      return { crossSells: [], bundleWith: [], reason: 'Could not fetch products' };
    }

    const allProducts = productsResponse.data.products;
    const prompt = `Given this product:
Title: ${product.title}
Type: ${product.product_type}
Tags: ${product.tags}
Price: ${product.variants?.[0]?.price}

And these other products:
${allProducts.slice(0, 10).map(p => `- ID:${p.id} "${p.title}" ($${p.variants?.[0]?.price}) [${p.product_type}]`).join('\n')}

Which products would make the best:
1. Cross-sells (complementary products)
2. Bundle partners (bought together)

Return JSON:
{
  "crossSells": [product_id_1, product_id_2],
  "bundleWith": [product_id_1, product_id_2],
  "reason": "why these combinations work"
}`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGeminiJSON<{
      crossSells: number[];
      bundleWith: number[];
      reason: string;
    }>(messages, 'complex_reasoning');

    if (response.success && response.data) {
      return response.data;
    }

    return { crossSells: [], bundleWith: [], reason: 'AI recommendation failed' };
  }

  // --------------------------------------------
  // REMOVE UPSELLS
  // --------------------------------------------

  async removeUpsell(type: UpsellType): Promise<boolean> {
    try {
      if (!this.shopify.isConfigured()) return false;

      const themeResponse = await this.shopify.getMainTheme();
      if (!themeResponse.success || !themeResponse.data) return false;

      const themeId = themeResponse.data.id;

      // Remove assets
      await this.shopify.deleteThemeAsset(themeId, 'assets/carehub-upsell.css');
      await this.shopify.deleteThemeAsset(themeId, 'assets/carehub-upsell.js');
      await this.shopify.deleteThemeAsset(themeId, 'snippets/carehub-upsell.liquid');

      return true;
    } catch {
      return false;
    }
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let upsellInstance: UpsellBundleBuilder | null = null;

export function getUpsellBundleBuilder(): UpsellBundleBuilder {
  if (!upsellInstance) {
    upsellInstance = new UpsellBundleBuilder();
  }
  return upsellInstance;
}

export function resetUpsellBundleBuilder(): void {
  upsellInstance = null;
}
