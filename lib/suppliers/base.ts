// ============================================
// CAREHUB AI AGENT — SUPPLIER BASE INTERFACE
// ============================================
// Every supplier (CJ, AliExpress, Zendrop, etc.)
// MUST implement this interface. This ensures
// uniform behavior across all suppliers.
// Add new supplier = implement this interface = DONE.
// ============================================

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface SupplierProduct {
  supplierId: string;
  supplierName: string;
  externalId: string;
  title: string;
  description: string;
  category: string;
  images: SupplierImage[];
  variants: SupplierVariant[];
  costPrice: number;
  currency: string;
  weight: number;
  weightUnit: 'g' | 'kg' | 'oz' | 'lb';
  shippingTime: ShippingEstimate;
  available: boolean;
  rating?: number;
  totalOrders?: number;
  url?: string;
  tags?: string[];
  specifications?: Record<string,>;
  lastUpdated: number;
}

export interface SupplierVariant {
  externalId: string;
  title: string;
  sku: string;
  costPrice: number;
  comparePrice?: number;
  available: boolean;
  inventoryQuantity: number;
  options: VariantOption[];
  weight?: number;
  image?: string;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface SupplierImage {
  url: string;
  alt?: string;
  position: number;
  isMain: boolean;
}

export interface ShippingEstimate {
  minDays: number;
  maxDays: number;
  method: string;
  cost: number;
  currency: string;
  destination: string;
}

export interface SupplierOrder {
  supplierId: string;
  supplierName: string;
  externalOrderId: string;
  internalOrderId: string;
  status: OrderStatus;
  items: SupplierOrderItem[];
  shippingAddress: ShippingAddress;
  trackingInfo?: TrackingInfo;
  totalCost: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
}

export interface SupplierOrderItem {
  externalProductId: string;
  externalVariantId: string;
  quantity: number;
  costPrice: number;
  sku: string;
  title: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
  status: string;
  estimatedDelivery?: string;
  events?: TrackingEvent[];
}

export interface TrackingEvent {
  date: string;
  location: string;
  description: string;
  status: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | 'returned';

export interface PriceCheck {
  externalId: string;
  currentPrice: number;
  previousPrice: number | null;
  priceChanged: boolean;
  changePercent: number | null;
  available: boolean;
  lastChecked: number;
  currency: string;
}

export interface SupplierSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'orders' | 'newest';
  page?: number;
  limit?: number;
  shippingTo?: string;
}

export interface SupplierSearchResult {
  products: SupplierProduct[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SupplierStatus {
  name: string;
  connected: boolean;
  lastSync: number | null;
  productsTracked: number;
  ordersPlaced: number;
  errorRate: number;
  apiCallsRemaining?: number;
  healthScore: number; // 0-100
}

export interface SupplierConfig {
  name: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  enabled: boolean;
  priority: number; // Lower = higher priority
  rateLimitPerMinute: number;
  defaultShippingMethod?: string;
  supportedCountries: string[];
}

// --------------------------------------------
// BASE SUPPLIER ABSTRACT CLASS
// --------------------------------------------

export abstract class BaseSupplier {
  protected config: SupplierConfig;
  protected requestCount: number = 0;
  protected requestTimestamps: number[] = [];
  protected isConnected: boolean = false;
  protected lastError: string | null = null;
  protected consecutiveErrors: number = 0;

  constructor(config: SupplierConfig) {
    this.config = config;
  }

  // ==========================================
  // ABSTRACT METHODS — Every supplier MUST implement
  // ==========================================

  /**
   * Test connection to supplier API
   */
  abstract testConnection(): Promise;

  /**
   * Search products on supplier platform
   */
  abstract searchProducts(params: SupplierSearchParams): Promise;

  /**
   * Get single product details by external ID
   */
  abstract getProduct(externalId: string): Promise;

  /**
   * Get multiple products by IDs (batch)
   */
  abstract getProducts(externalIds: string[]): Promise;

  /**
   * Check current price of a product
   */
  abstract checkPrice(externalId: string): Promise;

  /**
   * Check prices for multiple products (batch)
   */
  abstract checkPrices(externalIds: string[]): Promise;

  /**
   * Place order with supplier
   */
  abstract placeOrder(items: SupplierOrderItem[], shippingAddress: ShippingAddress): Promise;

  /**
   * Get order status from supplier
   */
  abstract getOrderStatus(externalOrderId: string): Promise;

  /**
   * Get tracking information
   */
  abstract getTracking(externalOrderId: string): Promise;

  /**
   * Get shipping estimates for a product to destination
   */
  abstract getShippingEstimate(externalId: string, destination: string): Promise;

  /**
   * Get product categories from supplier
   */
  abstract getCategories(): Promise<{ id: string; name: string; parentId?: string }[]>;

  // ==========================================
  // COMMON METHODS — Shared by all suppliers
  // ==========================================

  /**
   * Rate limiter — ensures we don't exceed API limits
   */
  protected async waitForRateLimit(): Promise {
    const now = Date.now();
    const windowMs = 60000;

    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      t => now - t < windowMs
    );

    if (this.requestTimestamps.length >= this.config.rateLimitPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = windowMs - (now - oldestRequest) + 100;
      console.log(`[${this.config.name}] Rate limit — waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForRateLimit();
    }

    this.requestTimestamps.push(now);
    this.requestCount++;
  }

  /**
   * Get supplier status/health
   */
  getStatus(): SupplierStatus {
    return {
      name: this.config.name,
      connected: this.isConnected,
      lastSync: this.requestTimestamps[this.requestTimestamps.length - 1] || null,
      productsTracked: 0, // Override in implementation
      ordersPlaced: 0, // Override in implementation
      errorRate: this.consecutiveErrors > 0 ? (this.consecutiveErrors / Math.max(this.requestCount, 1)) * 100 : 0,
      apiCallsRemaining: this.config.rateLimitPerMinute - this.requestTimestamps.filter(t => Date.now() - t < 60000).length,
      healthScore: this.calculateHealthScore(),
    };
  }

  /**
   * Calculate health score (0-100)
   */
  private calculateHealthScore(): number {
    let score = 100;

    if (!this.isConnected) score -= 50;
    if (this.consecutiveErrors > 0) score -= this.consecutiveErrors * 10;
    if (this.lastError) score -= 10;

    // Rate limit proximity
    const currentRequests = this.requestTimestamps.filter(t => Date.now() - t < 60000).length;
    const usagePercent = (currentRequests / this.config.rateLimitPerMinute) * 100;
    if (usagePercent > 80) score -= 15;
    if (usagePercent > 95) score -= 25;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if supplier is healthy and available
   */
  isHealthy(): boolean {
    return this.isConnected && this.consecutiveErrors < 3 && this.config.enabled;
  }

  /**
   * Get supplier name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get supplier priority (lower = higher priority)
   */
  getPriority(): number {
    return this.config.priority;
  }

  /**
   * Check if supplier supports shipping to country
   */
  supportsCountry(countryCode: string): boolean {
    return this.config.supportedCountries.includes(countryCode.toUpperCase()) ||
      this.config.supportedCountries.includes('*');
  }

  /**
   * Reset error state
   */
  resetErrors(): void {
    this.consecutiveErrors = 0;
    this.lastError = null;
  }

  /**
   * Record error
   */
  protected recordError(error: string): void {
    this.consecutiveErrors++;
    this.lastError = error;
    console.error(`[${this.config.name}] Error #${this.consecutiveErrors}: ${error}`);
  }

  /**
   * Record success (resets error counter)
   */
  protected recordSuccess(): void {
    this.consecutiveErrors = 0;
    this.lastError = null;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate selling price with margin
   */
  calculateSellingPrice(costPrice: number, marginPercent: number): number {
    const margin = marginPercent / 100;
    return parseFloat((costPrice / (1 - margin)).toFixed(2));
  }

  /**
   * Calculate compare-at price (for showing "savings")
   */
  calculateCompareAtPrice(sellingPrice: number, inflationPercent: number = 25): number {
    return parseFloat((sellingPrice * (1 + inflationPercent / 100)).toFixed(2));
  }

  /**
   * Apply psychological pricing ($29.99 instead of $30.00)
   */
  applyPsychologicalPricing(price: number): number {
    if (price < 10) {
      return parseFloat((Math.ceil(price) - 0.01).toFixed(2));
    } else if (price < 100) {
      return parseFloat((Math.ceil(price) - 0.01).toFixed(2));
    } else {
      return parseFloat((Math.ceil(price / 5) * 5 - 0.01).toFixed(2));
    }
  }
}

// --------------------------------------------
// SUPPLIER EVENTS (for logging/monitoring)
// --------------------------------------------

export interface SupplierEvent {
  supplier: string;
  event: 'price_change' | 'stock_change' | 'order_placed' | 'order_shipped' | 'order_delivered' | 'error' | 'connection_lost' | 'connection_restored';
  data: Record;
  timestamp: number;
}

export type SupplierEventHandler = (event: SupplierEvent) => void;

// --------------------------------------------
// SUPPLIER FACTORY TYPE
// --------------------------------------------

export type SupplierFactory = (config: Partial) => BaseSupplier;
