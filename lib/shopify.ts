// ============================================
// CAREHUB AI AGENT — SHOPIFY ADMIN API CLIENT
// ============================================
// Complete Shopify store control — products, orders,
// themes, collections, metafields, pages, everything.
// ============================================

import { z } from 'zod';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface ShopifyConfig {
  store: string;
  accessToken: string;
  apiVersion: string;
}

export interface ShopifyProduct {
  id?: number;
  title: string;
  body_html: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  status?: 'active' | 'draft' | 'archived';
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
  options?: ShopifyOption[];
  metafields?: ShopifyMetafield[];
}

export interface ShopifyVariant {
  id?: number;
  product_id?: number;
  title?: string;
  price: string;
  compare_at_price?: string | null;
  sku?: string;
  inventory_quantity?: number;
  inventory_management?: string;
  weight?: number;
  weight_unit?: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  requires_shipping?: boolean;
}

export interface ShopifyImage {
  id?: number;
  product_id?: number;
  src: string;
  alt?: string;
  position?: number;
  variant_ids?: number[];
}

export interface ShopifyOption {
  id?: number;
  product_id?: number;
  name: string;
  position?: number;
  values: string[];
}

export interface ShopifyMetafield {
  id?: number;
  namespace: string;
  key: string;
  value: string;
  type: string;
  owner_id?: number;
  owner_resource?: string;
}

export interface ShopifyOrder {
  id?: number;
  name?: string;
  email?: string;
  created_at?: string;
  financial_status?: string;
  fulfillment_status?: string | null;
  total_price?: string;
  currency?: string;
  line_items?: ShopifyLineItem[];
  shipping_address?: ShopifyAddress;
  customer?: ShopifyCustomer;
  note?: string;
  tags?: string;
}

export interface ShopifyLineItem {
  id?: number;
  product_id?: number;
  variant_id?: number;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
  variant_title?: string;
  fulfillment_status?: string | null;
}

export interface ShopifyAddress {
  first_name?: string;
  last_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
  country_code?: string;
}

export interface ShopifyCustomer {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  orders_count?: number;
  total_spent?: string;
}

export interface ShopifyCollection {
  id?: number;
  title: string;
  body_html?: string;
  handle?: string;
  image?: { src: string; alt?: string };
  published?: boolean;
  sort_order?: string;
  template_suffix?: string;
  rules?: ShopifyCollectionRule[];
  disjunctive?: boolean;
}

export interface ShopifyCollectionRule {
  column: string;
  relation: string;
  condition: string;
}

export interface ShopifyTheme {
  id: number;
  name: string;
  role: 'main' | 'unpublished' | 'demo';
  created_at: string;
  updated_at: string;
}

export interface ShopifyAsset {
  key: string;
  value?: string;
  attachment?: string;
  content_type?: string;
  theme_id?: number;
}

export interface ShopifyPage {
  id?: number;
  title: string;
  body_html: string;
  handle?: string;
  published?: boolean;
  template_suffix?: string;
  metafields?: ShopifyMetafield[];
}

export interface ShopifyFulfillment {
  id?: number;
  order_id: number;
  tracking_number?: string;
  tracking_company?: string;
  tracking_url?: string;
  line_items?: { id: number; quantity: number }[];
  notify_customer?: boolean;
}

export interface ShopifyWebhook {
  id?: number;
  topic: string;
  address: string;
  format: string;
}

export interface ShopifyNavigationMenu {
  id?: number;
  handle: string;
  title: string;
  links: ShopifyMenuLink[];
}

export interface ShopifyMenuLink {
  title: string;
  url: string;
  links?: ShopifyMenuLink[];
}

export interface ShopifyApiResponse<t> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  rateLimitRemaining?: number;
}

export interface PaginatedResponse {
  data: T[];
  hasNextPage: boolean;
  nextPageInfo?: string;
}

// --------------------------------------------
// VALIDATION SCHEMAS
// --------------------------------------------

const ProductCreateSchema = z.object({
  title: z.string().min(1, 'Product title is required'),
  body_html: z.string().optional().default(''),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional().default('active'),
  variants: z.array(z.object({
    price: z.string(),
    compare_at_price: z.string().nullable().optional(),
    sku: z.string().optional(),
    inventory_quantity: z.number().optional(),
    option1: z.string().nullable().optional(),
    option2: z.string().nullable().optional(),
    option3: z.string().nullable().optional(),
  })).optional(),
  images: z.array(z.object({
    src: z.string().url(),
    alt: z.string().optional(),
  })).optional(),
});

// --------------------------------------------
// SHOPIFY CLIENT CLASS
// --------------------------------------------

export class ShopifyClient {
  private config: ShopifyConfig;
  private baseUrl: string;
  private rateLimitQueue: Array<() => Promise> = [];
  private isProcessingQueue: boolean = false;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 250; // 4 requests per second max

  constructor(config?: Partial) {
    this.config = {
      store: config?.store || process.env.SHOPIFY_STORE || '',
      accessToken: config?.accessToken || process.env.SHOPIFY_ACCESS_TOKEN || '',
      apiVersion: config?.apiVersion || '2024-10',
    };

    if (!this.config.store) {
      throw new Error('SHOPIFY_STORE is required — set in environment variables');
    }

    this.baseUrl = `https://${this.config.store}/admin/api/${this.config.apiVersion}`;
  }

  // --------------------------------------------
  // CORE HTTP METHOD — Rate Limited
  // --------------------------------------------

  private async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown,
    retries: number = 3
  ): Promise> {
    // Rate limiting — ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await this.sleep(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.config.accessToken,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Rate limit handling
      const rateLimitRemaining = parseInt(
        response.headers.get('X-Shopify-Shop-Api-Call-Limit')?.split('/')[0] || '0'
      );

      // 429 Too Many Requests — wait and retry
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2');
        console.warn(`[Shopify] Rate limited — waiting ${retryAfter}s before retry`);
        await this.sleep(retryAfter * 1000);
        if (retries > 0) {
          return this.request(method, endpoint, body, retries - 1);
        }
        return { success: false, error: 'Rate limit exceeded after retries', statusCode: 429 };
      }

      // 5xx Server errors — retry
      if (response.status >= 500 && retries > 0) {
        console.warn(`[Shopify] Server error ${response.status} — retrying...`);
        await this.sleep(1000);
        return this.request(method, endpoint, body, retries - 1);
      }

      // Parse response
      const responseText = await response.text();
      let data: T | undefined;

      if (responseText) {
        try {
          data = JSON.parse(responseText) as T;
        } catch {
          return {
            success: false,
            error: `Invalid JSON response: ${responseText.substring(0, 200)}`,
            statusCode: response.status,
          };
        }
      }

      if (!response.ok) {
        const errorData = data as unknown as { errors?: unknown };
        const errorMessage = errorData?.errors
          ? JSON.stringify(errorData.errors)
          : `HTTP ${response.status}: ${response.statusText}`;
        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
          rateLimitRemaining,
        };
      }

      return {
        success: true,
        data,
        statusCode: response.status,
        rateLimitRemaining,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Network errors — retry
      if (retries > 0 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
        console.warn(`[Shopify] Network error — retrying... (${retries} left)`);
        await this.sleep(1000);
        return this.request(method, endpoint, body, retries - 1);
      }

      return { success: false, error: errorMessage };
    }
  }

  // --------------------------------------------
  // PRODUCTS
  // --------------------------------------------

  async getProducts(params?: {
    limit?: number;
    page_info?: string;
    status?: string;
    collection_id?: number;
    product_type?: string;
    vendor?: string;
    title?: string;
    ids?: string;
  }): Promise> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.page_info) queryParams.set('page_info', params.page_info);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.collection_id) queryParams.set('collection_id', params.collection_id.toString());
    if (params?.product_type) queryParams.set('product_type', params.product_type);
    if (params?.vendor) queryParams.set('vendor', params.vendor);
    if (params?.title) queryParams.set('title', params.title);
    if (params?.ids) queryParams.set('ids', params.ids);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ products: ShopifyProduct[] }>('GET', `/products.json${query}`);
  }

  async getProduct(productId: number): Promise> {
    return this.request<{ product: ShopifyProduct }>('GET', `/products/${productId}.json`);
  }

  async createProduct(product: ShopifyProduct): Promise> {
    const validated = ProductCreateSchema.safeParse(product);
    if (!validated.success) {
      return { success: false, error: `Validation failed: ${validated.error.message}` };
    }
    return this.request<{ product: ShopifyProduct }>('POST', '/products.json', { product });
  }

  async updateProduct(productId: number, product: Partial): Promise> {
    return this.request<{ product: ShopifyProduct }>('PUT', `/products/${productId}.json`, { product });
  }

  async deleteProduct(productId: number): Promise> {
    return this.request('DELETE', `/products/${productId}.json`);
  }

  async getProductCount(params?: { status?: string; collection_id?: number }): Promise> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.collection_id) queryParams.set('collection_id', params.collection_id.toString());
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ count: number }>('GET', `/products/count.json${query}`);
  }

  // --------------------------------------------
  // VARIANTS
  // --------------------------------------------

  async getVariants(productId: number): Promise> {
    return this.request<{ variants: ShopifyVariant[] }>('GET', `/products/${productId}/variants.json`);
  }

  async updateVariant(variantId: number, variant: Partial): Promise> {
    return this.request<{ variant: ShopifyVariant }>('PUT', `/variants/${variantId}.json`, { variant });
  }

  async createVariant(productId: number, variant: ShopifyVariant): Promise> {
    return this.request<{ variant: ShopifyVariant }>('POST', `/products/${productId}/variants.json`, { variant });
  }

  async deleteVariant(productId: number, variantId: number): Promise> {
    return this.request('DELETE', `/products/${productId}/variants/${variantId}.json`);
  }

  // --------------------------------------------
  // PRODUCT IMAGES
  // --------------------------------------------

  async getProductImages(productId: number): Promise> {
    return this.request<{ images: ShopifyImage[] }>('GET', `/products/${productId}/images.json`);
  }

  async createProductImage(productId: number, image: ShopifyImage): Promise> {
    return this.request<{ image: ShopifyImage }>('POST', `/products/${productId}/images.json`, { image });
  }

  async deleteProductImage(productId: number, imageId: number): Promise> {
    return this.request('DELETE', `/products/${productId}/images/${imageId}.json`);
  }

  // --------------------------------------------
  // COLLECTIONS
  // --------------------------------------------

  async getCustomCollections(params?: { limit?: number; title?: string }): Promise> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.title) queryParams.set('title', params.title);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ custom_collections: ShopifyCollection[] }>('GET', `/custom_collections.json${query}`);
  }

  async createCustomCollection(collection: ShopifyCollection): Promise> {
    return this.request<{ custom_collection: ShopifyCollection }>('POST', '/custom_collections.json', { custom_collection: collection });
  }

  async updateCustomCollection(collectionId: number, collection: Partial): Promise> {
    return this.request<{ custom_collection: ShopifyCollection }>('PUT', `/custom_collections/${collectionId}.json`, { custom_collection: collection });
  }

  async deleteCustomCollection(collectionId: number): Promise> {
    return this.request('DELETE', `/custom_collections/${collectionId}.json`);
  }

  async getSmartCollections(params?: { limit?: number; title?: string }): Promise> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.title) queryParams.set('title', params.title);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ smart_collections: ShopifyCollection[] }>('GET', `/smart_collections.json${query}`);
  }

  async createSmartCollection(collection: ShopifyCollection): Promise> {
    return this.request<{ smart_collection: ShopifyCollection }>('POST', '/smart_collections.json', { smart_collection: collection });
  }

  async updateSmartCollection(collectionId: number, collection: Partial): Promise> {
    return this.request<{ smart_collection: ShopifyCollection }>('PUT', `/smart_collections/${collectionId}.json`, { smart_collection: collection });
  }

  async addProductToCollection(collectionId: number, productId: number): Promise> {
    return this.request('POST', '/collects.json', {
      collect: { product_id: productId, collection_id: collectionId },
    });
  }

  async removeProductFromCollection(collectId: number): Promise> {
    return this.request('DELETE', `/collects/${collectId}.json`);
  }

  // --------------------------------------------
  // ORDERS
  // --------------------------------------------

  async getOrders(params?: {
    limit?: number;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    fulfillment_status?: 'shipped' | 'partial' | 'unshipped' | 'unfulfilled' | 'any';
    financial_status?: 'authorized' | 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'voided' | 'any';
    created_at_min?: string;
    created_at_max?: string;
    page_info?: string;
  }): Promise> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.fulfillment_status) queryParams.set('fulfillment_status', params.fulfillment_status);
    if (params?.financial_status) queryParams.set('financial_status', params.financial_status);
    if (params?.created_at_min) queryParams.set('created_at_min', params.created_at_min);
    if (params?.created_at_max) queryParams.set('created_at_max', params.created_at_max);
    if (params?.page_info) queryParams.set('page_info', params.page_info);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ orders: ShopifyOrder[] }>('GET', `/orders.json${query}`);
  }

  async getOrder(orderId: number): Promise> {
    return this.request<{ order: ShopifyOrder }>('GET', `/orders/${orderId}.json`);
  }

  async getOrderCount(params?: { status?: string; fulfillment_status?: string }): Promise> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.fulfillment_status) queryParams.set('fulfillment_status', params.fulfillment_status);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ count: number }>('GET', `/orders/count.json${query}`);
  }

  async updateOrder(orderId: number, order: Partial): Promise> {
    return this.request<{ order: ShopifyOrder }>('PUT', `/orders/${orderId}.json`, { order });
  }

  async closeOrder(orderId: number): Promise> {
    return this.request<{ order: ShopifyOrder }>('POST', `/orders/${orderId}/close.json`);
  }

  // --------------------------------------------
  // FULFILLMENTS
  // --------------------------------------------

  async createFulfillment(orderId: number, fulfillment: Partial): Promise> {
    return this.request<{ fulfillment: ShopifyFulfillment }>(
      'POST',
      `/orders/${orderId}/fulfillments.json`,
      { fulfillment: { ...fulfillment, notify_customer: fulfillment.notify_customer ?? true } }
    );
  }

  async updateFulfillmentTracking(
    orderId: number,
    fulfillmentId: number,
    tracking: { tracking_number: string; tracking_company: string; tracking_url?: string }
  ): Promise> {
    return this.request<{ fulfillment: ShopifyFulfillment }>(
      'PUT',
      `/orders/${orderId}/fulfillments/${fulfillmentId}.json`,
      { fulfillment: tracking }
    );
  }

  // --------------------------------------------
  // THEMES
  // --------------------------------------------

  async getThemes(): Promise> {
    return this.request<{ themes: ShopifyTheme[] }>('GET', '/themes.json');
  }

  async getMainTheme(): Promise> {
    const response = await this.getThemes();
    if (!response.success || !response.data) {
      return { success: false, error: response.error || 'Failed to get themes' };
    }
    const mainTheme = response.data.themes.find(t => t.role === 'main');
    if (!mainTheme) {
      return { success: false, error: 'No main theme found' };
    }
    return { success: true, data: mainTheme };
  }

  async getThemeAsset(themeId: number, assetKey: string): Promise> {
    const encodedKey = encodeURIComponent(assetKey);
    return this.request<{ asset: ShopifyAsset }>('GET', `/themes/${themeId}/assets.json?asset[key]=${encodedKey}`);
  }

  async updateThemeAsset(themeId: number, asset: ShopifyAsset): Promise> {
    return this.request<{ asset: ShopifyAsset }>('PUT', `/themes/${themeId}/assets.json`, { asset });
  }

  async getThemeAssets(themeId: number): Promise> {
    return this.request<{ assets: ShopifyAsset[] }>('GET', `/themes/${themeId}/assets.json`);
  }

  async deleteThemeAsset(themeId: number, assetKey: string): Promise> {
    const encodedKey = encodeURIComponent(assetKey);
    return this.request('DELETE', `/themes/${themeId}/assets.json?asset[key]=${encodedKey}`);
  }

  // --------------------------------------------
  // PAGES
  // --------------------------------------------

  async getPages(params?: { limit?: number }): Promise> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ pages: ShopifyPage[] }>('GET', `/pages.json${query}`);
  }

  async createPage(page: ShopifyPage): Promise> {
    return this.request<{ page: ShopifyPage }>('POST', '/pages.json', { page });
  }

  async updatePage(pageId: number, page: Partial): Promise> {
    return this.request<{ page: ShopifyPage }>('PUT', `/pages/${pageId}.json`, { page });
  }

  async deletePage(pageId: number): Promise> {
    return this.request('DELETE', `/pages/${pageId}.json`);
  }

  // --------------------------------------------
  // METAFIELDS
  // --------------------------------------------

  async getMetafields(params: {
    owner_resource: string;
    owner_id: number;
    namespace?: string;
  }): Promise> {
    const queryParams = new URLSearchParams();
    if (params.namespace) queryParams.set('namespace', params.namespace);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<{ metafields: ShopifyMetafield[] }>(
      'GET',
      `/${params.owner_resource}/${params.owner_id}/metafields.json${query}`
    );
  }

  async createMetafield(
    ownerResource: string,
    ownerId: number,
    metafield: ShopifyMetafield
  ): Promise> {
    return this.request<{ metafield: ShopifyMetafield }>(
      'POST',
      `/${ownerResource}/${ownerId}/metafields.json`,
      { metafield }
    );
  }

  async updateMetafield(metafieldId: number, metafield: Partial): Promise> {
    return this.request<{ metafield: ShopifyMetafield }>('PUT', `/metafields/${metafieldId}.json`, { metafield });
  }

  // --------------------------------------------
  // SCRIPT TAGS (for injecting custom JS/CSS)
  // --------------------------------------------

  async getScriptTags(): Promise }>> {
    return this.request<{ script_tags: Array<{ id: number; src: string; event: string }> }>('GET', '/script_tags.json');
  }

  async createScriptTag(src: string, event: string = 'onload'): Promise> {
    return this.request('POST', '/script_tags.json', {
      script_tag: { event, src },
    });
  }

  async deleteScriptTag(scriptTagId: number): Promise> {
    return this.request('DELETE', `/script_tags/${scriptTagId}.json`);
  }

  // --------------------------------------------
  // WEBHOOKS
  // --------------------------------------------

  async getWebhooks(): Promise> {
    return this.request<{ webhooks: ShopifyWebhook[] }>('GET', '/webhooks.json');
  }

  async createWebhook(webhook: ShopifyWebhook): Promise> {
    return this.request<{ webhook: ShopifyWebhook }>('POST', '/webhooks.json', { webhook });
  }

  async deleteWebhook(webhookId: number): Promise> {
    return this.request('DELETE', `/webhooks/${webhookId}.json`);
  }

  // --------------------------------------------
  // SHOP INFO
  // --------------------------------------------

  async getShopInfo(): Promise> {
    return this.request<{ shop: { name: string; email: string; domain: string; currency: string; plan_name: string } }>('GET', '/shop.json');
  }

  // --------------------------------------------
  // INVENTORY
  // --------------------------------------------

  async getInventoryLevels(inventoryItemIds: number[]): Promise }>> {
    const ids = inventoryItemIds.join(',');
    return this.request<{ inventory_levels: Array<{ inventory_item_id: number; available: number; location_id: number }> }>(
      'GET',
      `/inventory_levels.json?inventory_item_ids=${ids}`
    );
  }

  async adjustInventory(inventoryItemId: number, locationId: number, adjustment: number): Promise> {
    return this.request('POST', '/inventory_levels/adjust.json', {
      inventory_item_id: inventoryItemId,
      location_id: locationId,
      available_adjustment: adjustment,
    });
  }

  async setInventory(inventoryItemId: number, locationId: number, available: number): Promise> {
    return this.request('POST', '/inventory_levels/set.json', {
      inventory_item_id: inventoryItemId,
      location_id: locationId,
      available,
    });
  }

  // --------------------------------------------
  // LOCATIONS
  // --------------------------------------------

  async getLocations(): Promise }>> {
    return this.request<{ locations: Array<{ id: number; name: string; active: boolean }> }>('GET', '/locations.json');
  }

  // --------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------

  async bulkUpdateProducts(products: Array<{ id: number; updates: Partial }>): Promise>> {
    const results: Array> = [];
    for (const { id, updates } of products) {
      const result = await this.updateProduct(id, updates);
      results.push(result);
      // Small delay between bulk operations
      await this.sleep(300);
    }
    return results;
  }

  async bulkUpdatePrices(
    updates: Array<{ variantId: number; price: string; compareAtPrice?: string }>
  ): Promise>> {
    const results: Array> = [];
    for (const update of updates) {
      const result = await this.updateVariant(update.variantId, {
        price: update.price,
        compare_at_price: update.compareAtPrice || null,
      });
      results.push(result);
      await this.sleep(300);
    }
    return results;
  }

  async getAllProducts(): Promise {
    const allProducts: ShopifyProduct[] = [];
    let pageInfo: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getProducts({ limit: 250, page_info: pageInfo });
      if (!response.success || !response.data) break;

      allProducts.push(...response.data.products);

      if (response.data.products.length < 250) {
        hasMore = false;
      } else {
        // Note: In production, you'd parse the Link header for page_info
        // For now, we stop at 250 to avoid rate limits during cron
        hasMore = false;
      }
    }

    return allProducts;
  }

  // --------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------

  private sleep(ms: number): Promise {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isConfigured(): boolean {
    return !!(this.config.store && this.config.accessToken);
  }

  getStoreUrl(): string {
    return `https://${this.config.store}`;
  }

  getConfig(): ShopifyConfig {
    return { ...this.config };
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let shopifyInstance: ShopifyClient | null = null;

export function getShopifyClient(config?: Partial): ShopifyClient {
  if (!shopifyInstance) {
    shopifyInstance = new ShopifyClient(config);
  }
  return shopifyInstance;
}

export function resetShopifyClient(): void {
  shopifyInstance = null;
}

// --------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------

export function calculateSellingPrice(costPrice: number, marginPercent: number): string {
  const margin = marginPercent / 100;
  const sellingPrice = costPrice / (1 - margin);
  return sellingPrice.toFixed(2);
}

export function calculateCompareAtPrice(sellingPrice: number, discountPercent: number = 20): string {
  const compareAt = sellingPrice / (1 - discountPercent / 100);
  return compareAt.toFixed(2);
}

export function formatPrice(price: number | string, currency: string = 'USD'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numPrice);
}
