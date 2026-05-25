// ============================================
// CAREHUB AI AGENT — CJ DROPSHIPPING SUPPLIER
// ============================================
// Primary supplier implementation.
// CJ Dropshipping API integration for:
// - Product search & import
// - Price monitoring
// - Order placement & fulfillment
// - Tracking updates
// API Docs: https://developers.cjdropshipping.com/
// ============================================

import {
  BaseSupplier,
  SupplierProduct,
  SupplierVariant,
  SupplierImage,
  SupplierOrder,
  SupplierOrderItem,
  SupplierSearchParams,
  SupplierSearchResult,
  ShippingAddress,
  ShippingEstimate,
  TrackingInfo,
  TrackingEvent,
  PriceCheck,
  SupplierConfig,
  VariantOption,
} from './base';

// --------------------------------------------
// CJ-SPECIFIC TYPES
// --------------------------------------------

interface CJApiResponse<t> {
  code: number;
  result: boolean;
  message: string;
  data: T;
}

interface CJProduct {
  pid: string;
  productName: string;
  productNameEn: string;
  description: string;
  categoryId: string;
  categoryName: string;
  productImage: string;
  productWeight: number;
  productUnit: string;
  sellPrice: number;
  sourceFrom: number;
  variants: CJVariant[];
  productImageSet?: string[];
  createTime?: string;
  listedNum?: number;
  productSku?: string;
  entryCode?: string;
  materialKey?: string;
  packingWeight?: number;
}

interface CJVariant {
  vid: string;
  variantName: string;
  variantNameEn: string;
  variantSku: string;
  variantImage?: string;
  variantSellPrice: number;
  variantVolume?: number;
  variantWeight?: number;
  variantProperty?: string;
  variantKey?: string;
  createTime?: string;
}

interface CJOrder {
  orderId: string;
  orderNum: string;
  orderStatus: string;
  cjOrderId?: string;
  shippingCountryCode: string;
  trackNumber?: string;
  logisticName?: string;
  createDate: string;
  orderAmount: number;
  productAmount: number;
  shippingCustomerName?: string;
  products?: CJOrderProduct[];
}

interface CJOrderProduct {
  vid: string;
  quantity: number;
  sellPrice: number;
  productName?: string;
  variantName?: string;
}

interface CJShipping {
  logisticName: string;
  logisticAging: string;
  logisticPrice: number;
  logisticPriceCn?: number;
}

interface CJCategory {
  categoryId: string;
  categoryName: string;
  parentId?: string;
  categoryLevel?: number;
}

interface CJTracking {
  trackNumber: string;
  logisticName: string;
  trackInfoList?: Array<{
    date: string;
    info: string;
    location?: string;
  }>;
}

// --------------------------------------------
// CJ DROPSHIPPING CLIENT
// --------------------------------------------

export class CJDropshippingSupplier extends BaseSupplier {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly BASE_URL = 'https://developers.cjdropshipping.com/api/v2';
  private productsTracked: number = 0;
  private ordersPlacedCount: number = 0;

  constructor(config?: Partial) {
    super({
      name: 'CJ Dropshipping',
      apiKey: config?.apiKey || process.env.CJ_API_KEY || '',
      baseUrl: 'https://developers.cjdropshipping.com/api/v2',
      enabled: true,
      priority: 1,
      rateLimitPerMinute: 30,
      defaultShippingMethod: 'CJPacket',
      supportedCountries: ['US', 'UK', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'PT', 'SE', 'DK', 'FI', 'NO', 'NZ', '*'],
      ...config,
    });
  }

  // --------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------

  private async getAccessToken(): Promise {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    await this.waitForRateLimit();

    try {
      const response = await fetch(`${this.BASE_URL}/authentication/getAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: process.env.CJ_EMAIL, password: this.config.apiKey }),
      });

      const data = await response.json() as CJApiResponse<{ accessToken: string; accessTokenExpiryDate: string }>;

      if (data.result && data.data?.accessToken) {
        this.accessToken = data.data.accessToken;
        this.tokenExpiry = new Date(data.data.accessTokenExpiryDate).getTime();
        this.isConnected = true;
        this.recordSuccess();
        return this.accessToken;
      }

      // If email/password auth fails, try API key directly
      this.accessToken = this.config.apiKey;
      this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      this.isConnected = true;
      return this.accessToken;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Auth failed';
      this.recordError(errMsg);

      // Fallback: use API key directly
      this.accessToken = this.config.apiKey;
      this.tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
      return this.accessToken;
    }
  }

  // --------------------------------------------
  // HTTP REQUEST HELPER
  // --------------------------------------------

  private async apiRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    endpoint: string,
    body?: unknown,
    retries: number = 3
  ): Promise | null> {
    await this.waitForRateLimit();
    const token = await this.getAccessToken();

    try {
      const url = `${this.BASE_URL}${endpoint}`;
      const headers: Record = {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      // Handle rate limiting
      if (response.status === 429) {
        if (retries > 0) {
          console.warn(`[CJ] Rate limited — waiting 5s before retry`);
          await this.sleep(5000);
          return this.apiRequest(method, endpoint, body, retries - 1);
        }
        this.recordError('Rate limit exceeded');
        return null;
      }

      // Handle server errors
      if (response.status >= 500) {
        if (retries > 0) {
          console.warn(`[CJ] Server error ${response.status} — retrying...`);
          await this.sleep(2000);
          return this.apiRequest(method, endpoint, body, retries - 1);
        }
        this.recordError(`Server error: ${response.status}`);
        return null;
      }

      const data = await response.json() as CJApiResponse;

      if (data.result) {
        this.recordSuccess();
      } else {
        this.recordError(data.message || 'Unknown CJ API error');
      }

      return data;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Network error';
      this.recordError(errMsg);

      if (retries > 0 && errMsg.includes('fetch')) {
        await this.sleep(2000);
        return this.apiRequest(method, endpoint, body, retries - 1);
      }

      return null;
    }
  }

  // --------------------------------------------
  // ABSTRACT METHOD IMPLEMENTATIONS
  // --------------------------------------------

  async testConnection(): Promise {
    try {
      const token = await this.getAccessToken();
      if (token) {
        this.isConnected = true;
        return true;
      }
      return false;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  async searchProducts(params: SupplierSearchParams): Promise {
    const body: Record = {
      pageNum: params.page || 1,
      pageSize: params.limit || 20,
    };

    if (params.query) body.productNameEn = params.query;
    if (params.category) body.categoryId = params.category;
    if (params.minPrice) body.startPrice = params.minPrice;
    if (params.maxPrice) body.endPrice = params.maxPrice;
    if (params.sortBy) {
      switch (params.sortBy) {
        case 'price_asc': body.orderBy = 'price_asc'; break;
        case 'price_desc': body.orderBy = 'price_desc'; break;
        case 'orders': body.orderBy = 'orders_desc'; break;
        case 'newest': body.orderBy = 'create_desc'; break;
      }
    }

    const response = await this.apiRequest<{ list: CJProduct[]; total: number; pageNum: number; pageSize: number }>(
      'POST',
      '/product/list',
      body
    );

    if (!response || !response.result || !response.data) {
      return { products: [], totalCount: 0, page: 1, totalPages: 0, hasMore: false };
    }

    const products = response.data.list.map(p => this.transformProduct(p));
    const totalCount = response.data.total || 0;
    const pageSize = params.limit || 20;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      products,
      totalCount,
      page: params.page || 1,
      totalPages,
      hasMore: (params.page || 1) < totalPages,
    };
  }

  async getProduct(externalId: string): Promise {
    const response = await this.apiRequest(
      'GET',
      `/product/query?pid=${externalId}`
    );

    if (!response || !response.result || !response.data) {
      return null;
    }

    return this.transformProduct(response.data);
  }

  async getProducts(externalIds: string[]): Promise {
    const products: SupplierProduct[] = [];

    // CJ doesn't support batch get — fetch one by one with delay
    for (const id of externalIds) {
      const product = await this.getProduct(id);
      if (product) {
        products.push(product);
      }
      // Small delay between requests
      await this.sleep(500);
    }

    return products;
  }

  async checkPrice(externalId: string): Promise {
    const product = await this.getProduct(externalId);

    if (!product) {
      return {
        externalId,
        currentPrice: 0,
        previousPrice: null,
        priceChanged: false,
        changePercent: null,
        available: false,
        lastChecked: Date.now(),
        currency: 'USD',
      };
    }

    this.productsTracked++;

    return {
      externalId,
      currentPrice: product.costPrice,
      previousPrice: null, // Will be compared with stored price
      priceChanged: false, // Will be determined by price-monitor agent
      changePercent: null,
      available: product.available,
      lastChecked: Date.now(),
      currency: product.currency,
    };
  }

  async checkPrices(externalIds: string[]): Promise {
    const results: PriceCheck[] = [];

    for (const id of externalIds) {
      const priceCheck = await this.checkPrice(id);
      results.push(priceCheck);
      // Delay between price checks
      await this.sleep(300);
    }

    return results;
  }

  async placeOrder(items: SupplierOrderItem[], shippingAddress: ShippingAddress): Promise {
    const orderProducts = items.map(item => ({
      vid: item.externalVariantId,
      quantity: item.quantity,
    }));

    const body = {
      orderNumber: `CH-${Date.now()}`,
      shippingZip: shippingAddress.zip,
      shippingCountryCode: shippingAddress.countryCode,
      shippingCountry: shippingAddress.country,
      shippingProvince: shippingAddress.state,
      shippingCity: shippingAddress.city,
      shippingAddress: shippingAddress.address1,
      shippingAddress2: shippingAddress.address2 || '',
      shippingCustomerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      shippingPhone: shippingAddress.phone || '',
      products: orderProducts,
      remark: 'CareHub Agent Order',
      logisticName: this.config.defaultShippingMethod || 'CJPacket',
      fromCountryCode: 'CN',
    };

    const response = await this.apiRequest('POST', '/shopping/order/createOrder', body);

    if (!response || !response.result || !response.data) {
      const errorMsg = response?.message || 'Failed to place order with CJ';
      throw new Error(errorMsg);
    }

    this.ordersPlacedCount++;

    return this.transformOrder(response.data, items, shippingAddress);
  }

  async getOrderStatus(externalOrderId: string): Promise {
    const response = await this.apiRequest(
      'GET',
      `/shopping/order/getOrderDetail?orderId=${externalOrderId}`
    );

    if (!response || !response.result || !response.data) {
      return null;
    }

    return this.transformOrder(response.data, [], {
      firstName: response.data.shippingCustomerName?.split(' ')[0] || '',
      lastName: response.data.shippingCustomerName?.split(' ').slice(1).join(' ') || '',
      address1: '',
      city: '',
      state: '',
      country: response.data.shippingCountryCode || '',
      countryCode: response.data.shippingCountryCode || '',
      zip: '',
    });
  }

  async getTracking(externalOrderId: string): Promise {
    const response = await this.apiRequest(
      'GET',
      `/shopping/order/getTrackInfo?orderNum=${externalOrderId}`
    );

    if (!response || !response.result || !response.data) {
      return null;
    }

    const tracking = response.data;

    return {
      trackingNumber: tracking.trackNumber || '',
      carrier: tracking.logisticName || 'Unknown',
      trackingUrl: this.generateTrackingUrl(tracking.trackNumber, tracking.logisticName),
      status: this.determineTrackingStatus(tracking.trackInfoList),
      events: tracking.trackInfoList?.map((event): TrackingEvent => ({
        date: event.date,
        location: event.location || '',
        description: event.info,
        status: event.info,
      })) || [],
    };
  }

  async getShippingEstimate(externalId: string, destination: string): Promise {
    const body = {
      startCountryCode: 'CN',
      endCountryCode: destination,
      productId: externalId,
    };

    const response = await this.apiRequest(
      'POST',
      '/logistics/freightCalculate',
      body
    );

    if (!response || !response.result || !response.data) {
      // Return default estimate
      return [{
        minDays: 7,
        maxDays: 15,
        method: 'CJPacket',
        cost: 0,
        currency: 'USD',
        destination,
      }];
    }

    return response.data.map((shipping): ShippingEstimate => {
      const agingMatch = shipping.logisticAging?.match(/(\d+)-(\d+)/);
      return {
        minDays: agingMatch ? parseInt(agingMatch[1]) : 7,
        maxDays: agingMatch ? parseInt(agingMatch[2]) : 15,
        method: shipping.logisticName,
        cost: shipping.logisticPrice || 0,
        currency: 'USD',
        destination,
      };
    });
  }

  async getCategories(): Promise<{ id: string; name: string; parentId?: string }[]> {
    const response = await this.apiRequest(
      'GET',
      '/product/getCategory'
    );

    if (!response || !response.result || !response.data) {
      return [];
    }

    return response.data.map(cat => ({
      id: cat.categoryId,
      name: cat.categoryName,
      parentId: cat.parentId,
    }));
  }

  // --------------------------------------------
  // ADDITIONAL CJ-SPECIFIC METHODS
  // --------------------------------------------

  async getProductVariants(productId: string): Promise {
    const product = await this.getProduct(productId);
    return product?.variants || [];
  }

  async confirmOrder(orderId: string): Promise {
    const response = await this.apiRequest(
      'PATCH',
      '/shopping/order/confirmOrder',
      { orderId }
    );

    return response?.result || false;
  }

  async cancelOrder(orderId: string): Promise {
    const response = await this.apiRequest(
      'POST',
      '/shopping/order/deleteOrder',
      { orderId }
    );

    return response?.result || false;
  }

  async getInventory(variantId: string): Promise<{ available: boolean; quantity: number }> {
    const response = await this.apiRequest<{ inventory: number }>(
      'GET',
      `/product/stock?vid=${variantId}`
    );

    if (!response || !response.result || !response.data) {
      return { available: false, quantity: 0 };
    }

    return {
      available: response.data.inventory > 0,
      quantity: response.data.inventory,
    };
  }

  // --------------------------------------------
  // DATA TRANSFORMATION HELPERS
  // --------------------------------------------

  private transformProduct(cjProduct: CJProduct): SupplierProduct {
    const images: SupplierImage[] = [];

    // Main image
    if (cjProduct.productImage) {
      images.push({
        url: cjProduct.productImage,
        alt: cjProduct.productNameEn || cjProduct.productName,
        position: 0,
        isMain: true,
      });
    }

    // Additional images
    if (cjProduct.productImageSet) {
      cjProduct.productImageSet.forEach((img, index) => {
        if (img !== cjProduct.productImage) {
          images.push({
            url: img,
            alt: `${cjProduct.productNameEn} - Image ${index + 1}`,
            position: index + 1,
            isMain: false,
          });
        }
      });
    }

    // Transform variants
    const variants: SupplierVariant[] = cjProduct.variants?.map(v => this.transformVariant(v)) || [];

    // If no variants, create default variant
    if (variants.length === 0) {
      variants.push({
        externalId: cjProduct.pid,
        title: 'Default',
        sku: cjProduct.productSku || cjProduct.pid,
        costPrice: cjProduct.sellPrice,
        available: true,
        inventoryQuantity: 999,
        options: [],
      });
    }

    return {
      supplierId: 'cj_dropshipping',
      supplierName: 'CJ Dropshipping',
      externalId: cjProduct.pid,
      title: cjProduct.productNameEn || cjProduct.productName,
      description: cjProduct.description || '',
      category: cjProduct.categoryName || '',
      images,
      variants,
      costPrice: cjProduct.sellPrice,
      currency: 'USD',
      weight: cjProduct.productWeight || 0,
      weightUnit: 'g',
      shippingTime: {
        minDays: 7,
        maxDays: 15,
        method: 'CJPacket',
        cost: 0,
        currency: 'USD',
        destination: 'US',
      },
      available: true,
      totalOrders: cjProduct.listedNum || 0,
      url: `https://cjdropshipping.com/product/${cjProduct.pid}.html`,
      tags: [cjProduct.categoryName].filter(Boolean),
      lastUpdated: Date.now(),
    };
  }

  private transformVariant(cjVariant: CJVariant): SupplierVariant {
    // Parse variant properties
    const options: VariantOption[] = [];
    if (cjVariant.variantProperty) {
      try {
        const props = JSON.parse(cjVariant.variantProperty) as Array<{ pName: string; pValue: string }>;
        props.forEach(prop => {
          options.push({ name: prop.pName, value: prop.pValue });
        });
      } catch {
        // If JSON parse fails, use variant name as single option
        if (cjVariant.variantNameEn || cjVariant.variantName) {
          options.push({
            name: 'Style',
            value: cjVariant.variantNameEn || cjVariant.variantName,
          });
        }
      }
    } else if (cjVariant.variantNameEn || cjVariant.variantName) {
      options.push({
        name: 'Style',
        value: cjVariant.variantNameEn || cjVariant.variantName,
      });
    }

    return {
      externalId: cjVariant.vid,
      title: cjVariant.variantNameEn || cjVariant.variantName || 'Default',
      sku: cjVariant.variantSku || cjVariant.vid,
      costPrice: cjVariant.variantSellPrice,
      available: true,
      inventoryQuantity: 999, // CJ doesn't always provide exact stock
      options,
      weight: cjVariant.variantWeight,
      image: cjVariant.variantImage,
    };
  }

  private transformOrder(
    cjOrder: CJOrder,
    items: SupplierOrderItem[],
    shippingAddress: ShippingAddress
  ): SupplierOrder {
    return {
      supplierId: 'cj_dropshipping',
      supplierName: 'CJ Dropshipping',
      externalOrderId: cjOrder.orderId || cjOrder.orderNum,
      internalOrderId: cjOrder.orderNum,
      status: this.mapOrderStatus(cjOrder.orderStatus),
      items,
      shippingAddress,
      trackingInfo: cjOrder.trackNumber ? {
        trackingNumber: cjOrder.trackNumber,
        carrier: cjOrder.logisticName || 'CJ Logistics',
        trackingUrl: this.generateTrackingUrl(cjOrder.trackNumber, cjOrder.logisticName),
        status: cjOrder.orderStatus,
      } : undefined,
      totalCost: cjOrder.orderAmount || cjOrder.productAmount || 0,
      currency: 'USD',
      createdAt: new Date(cjOrder.createDate).getTime() || Date.now(),
      updatedAt: Date.now(),
    };
  }

  // --------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------

  private mapOrderStatus(cjStatus: string): SupplierOrder['status'] {
    const statusMap: Record = {
      'CREATED': 'pending',
      'IN_CART': 'pending',
      'UNPAID': 'pending',
      'UNSHIPPED': 'confirmed',
      'PROCESSING': 'processing',
      'SHIPPED': 'shipped',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded',
      'IN_TRANSIT': 'in_transit',
      'PARTIAL_SHIPPED': 'shipped',
    };

    return statusMap[cjStatus?.toUpperCase()] || 'pending';
  }

  private generateTrackingUrl(trackingNumber?: string, carrier?: string): string {
    if (!trackingNumber) return '';

    const carrierLower = (carrier || '').toLowerCase();

    if (carrierLower.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    }
    if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    }
    if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    }
    if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`;
    }
    if (carrierLower.includes('yanwen')) {
      return `https://track.yanwen.com/en/tracking?nums=${trackingNumber}`;
    }
    if (carrierLower.includes('cjpacket') || carrierLower.includes('cj')) {
      return `https://www.17track.net/en/track#nums=${trackingNumber}`;
    }

    // Default: 17track (universal tracker)
    return `https://www.17track.net/en/track#nums=${trackingNumber}`;
  }

  private determineTrackingStatus(events?: Array<{ date: string; info: string }>): string {
    if (!events || events.length === 0) return 'pending';

    const lastEvent = events[events.length - 1].info.toLowerCase();

    if (lastEvent.includes('delivered') || lastEvent.includes('signed')) return 'delivered';
    if (lastEvent.includes('out for delivery')) return 'out_for_delivery';
    if (lastEvent.includes('arrived') || lastEvent.includes('customs')) return 'in_transit';
    if (lastEvent.includes('departed') || lastEvent.includes('transit')) return 'in_transit';
    if (lastEvent.includes('picked up') || lastEvent.includes('shipping')) return 'shipped';
    if (lastEvent.includes('accepted') || lastEvent.includes('received')) return 'processing';

    return 'in_transit';
  }

  // Override getStatus to include tracked counts
  override getStatus() {
    const baseStatus = super.getStatus();
    return {
      ...baseStatus,
      productsTracked: this.productsTracked,
      ordersPlaced: this.ordersPlacedCount,
    };
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let cjInstance: CJDropshippingSupplier | null = null;

export function getCJSupplier(config?: Partial): CJDropshippingSupplier {
  if (!cjInstance) {
    cjInstance = new CJDropshippingSupplier(config);
  }
  return cjInstance;
}

export function resetCJSupplier(): void {
  cjInstance = null;
}
