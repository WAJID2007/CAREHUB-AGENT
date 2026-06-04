// ============================================
// CAREHUB AI AGENT — SUPPLIER REGISTRY
// ============================================
// Central registry for all suppliers.
// Add new supplier = register here = DONE.
// Handles: multi-supplier routing, price comparison,
// best supplier selection, failover.
// ============================================

import {
  BaseSupplier,
  SupplierProduct,
  SupplierOrder,
  SupplierOrderItem,
  SupplierSearchParams,
  SupplierSearchResult,
  ShippingAddress,
  ShippingEstimate,
  PriceCheck,
  SupplierStatus,
  SupplierConfig,
} from './base';
import { CJDropshippingSupplier, getCJSupplier } from './cj';

// --------------------------------------------
// TYPES
// --------------------------------------------

export interface SupplierComparison {
  supplierId: string;
  supplierName: string;
  price: number;
  shippingCost: number;
  totalCost: number;
  deliveryDays: { min: number; max: number };
  available: boolean;
  rating: number;
  healthScore: number;
}

export interface BestSupplierResult {
  supplier: BaseSupplier;
  product: SupplierProduct;
  reason: string;
  comparison: SupplierComparison[];
}

export interface MultiSupplierSearchResult {
  results: Array<{
    supplier: string;
    products: SupplierProduct[];
    totalCount: number;
  }>;
  combinedProducts: SupplierProduct[];
  totalCount: number;
}

// --------------------------------------------
// SUPPLIER REGISTRY CLASS
// --------------------------------------------

export class SupplierRegistry {
  private suppliers: Map<string, BaseSupplier> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.registerDefaultSuppliers();
  }

  // --------------------------------------------
  // REGISTRATION
  // --------------------------------------------

  private registerDefaultSuppliers(): void {
    // Register CJ Dropshipping (primary supplier)
    if (process.env.CJ_API_KEY) {
      this.register('cj_dropshipping', getCJSupplier());
    }

    // ================================================
    // FUTURE SUPPLIERS — Uncomment when ready
    // ================================================
    //
    // if (process.env.ALIEXPRESS_API_KEY) {
    //   const { getAliExpressSupplier } = require('./aliexpress');
    //   this.register('aliexpress', getAliExpressSupplier());
    // }
    //
    // if (process.env.ZENDROP_API_KEY) {
    //   const { getZendropSupplier } = require('./zendrop');
    //   this.register('zendrop', getZendropSupplier());
    // }
    //
    // if (process.env.SPOCKET_API_KEY) {
    //   const { getSpocketSupplier } = require('./spocket');
    //   this.register('spocket', getSpocketSupplier());
    // }
    //
    // if (process.env.DSERS_API_KEY) {
    //   const { getDSersSupplier } = require('./dsers');
    //   this.register('dsers', getDSersSupplier());
    // }
    // ================================================

    this.initialized = true;
  }

  /**
   * Register a new supplier
   */
  register(id: string, supplier: BaseSupplier): void {
    this.suppliers.set(id, supplier);
    console.log(`[Suppliers] Registered: ${supplier.getName()} (id: ${id})`);
  }

  /**
   * Unregister a supplier
   */
  unregister(id: string): boolean {
    const result = this.suppliers.delete(id);
    if (result) {
      console.log(`[Suppliers] Unregistered: ${id}`);
    }
    return result;
  }

  /**
   * Get a specific supplier by ID
   */
  get(id: string): BaseSupplier | null {
    return this.suppliers.get(id) || null;
  }

  /**
   * Get all registered suppliers
   */
  getAll(): BaseSupplier[] {
    return Array.from(this.suppliers.values());
  }

  /**
   * Get all healthy suppliers
   */
  getHealthy(): BaseSupplier[] {
    return this.getAll().filter(s => s.isHealthy());
  }

  /**
   * Get suppliers sorted by priority
   */
  getByPriority(): BaseSupplier[] {
    return this.getAll()
      .filter(s => s.isHealthy())
      .sort((a, b) => a.getPriority() - b.getPriority());
  }

  /**
   * Get supplier count
   */
  count(): number {
    return this.suppliers.size;
  }

  // --------------------------------------------
  // MULTI-SUPPLIER OPERATIONS
  // --------------------------------------------

  /**
   * Search across all suppliers
   */
  async searchAll(params: SupplierSearchParams): Promise<MultiSupplierSearchResult> {
    const healthySuppliers = this.getHealthy();
    const results: Array<{ supplier: string; products: SupplierProduct[]; totalCount: number }> = [];
    const combinedProducts: SupplierProduct[] = [];

    // Search all healthy suppliers in parallel
    const searchPromises = healthySuppliers.map(async (supplier) => {
      try {
        const result = await supplier.searchProducts(params);
        return {
          supplier: supplier.getName(),
          products: result.products,
          totalCount: result.totalCount,
        };
      } catch (error) {
        console.error(`[Suppliers] Search failed for ${supplier.getName()}:`, error);
        return {
          supplier: supplier.getName(),
          products: [],
          totalCount: 0,
        };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    for (const result of searchResults) {
      results.push(result);
      combinedProducts.push(...result.products);
    }

    // Sort combined products by price (lowest first)
    combinedProducts.sort((a, b) => a.costPrice - b.costPrice);

    return {
      results,
      combinedProducts,
      totalCount: combinedProducts.length,
    };
  }

  /**
   * Find best supplier for a specific product
   */
  async findBestSupplier(
    productQuery: string,
    destination: string = 'US',
    prioritize: 'price' | 'speed' | 'rating' = 'price'
  ): Promise<BestSupplierResult | null> {
    const healthySuppliers = this.getHealthy();

    if (healthySuppliers.length === 0) {
      return null;
    }

    const comparisons: SupplierComparison[] = [];
    let bestProduct: SupplierProduct | null = null;
    let bestSupplier: BaseSupplier | null = null;

    for (const supplier of healthySuppliers) {
      try {
        const searchResult = await supplier.searchProducts({
          query: productQuery,
          limit: 1,
          shippingTo: destination,
        });

        if (searchResult.products.length === 0) continue;

        const product = searchResult.products[0];
        const shipping = await supplier.getShippingEstimate(product.externalId, destination);
        const shippingCost = shipping[0]?.cost || 0;
        const status = supplier.getStatus();

        const comparison: SupplierComparison = {
          supplierId: product.supplierId,
          supplierName: product.supplierName,
          price: product.costPrice,
          shippingCost,
          totalCost: product.costPrice + shippingCost,
          deliveryDays: {
            min: shipping[0]?.minDays || 7,
            max: shipping[0]?.maxDays || 15,
          },
          available: product.available,
          rating: product.rating || 0,
          healthScore: status.healthScore,
        };

        comparisons.push(comparison);

        // Determine best based on priority
        if (!bestProduct || this.isBetter(comparison, comparisons, prioritize)) {
          bestProduct = product;
          bestSupplier = supplier;
        }
      } catch (error) {
        console.error(`[Suppliers] Comparison failed for ${supplier.getName()}:`, error);
      }
    }

    if (!bestSupplier || !bestProduct) {
      return null;
    }

    const reason = this.generateSelectionReason(comparisons, prioritize);

    return {
      supplier: bestSupplier,
      product: bestProduct,
      reason,
      comparison: comparisons,
    };
  }

  /**
   * Compare prices across all suppliers for specific product IDs
   */
  async comparePrices(
    productMappings: Array<{ supplierId: string; externalId: string }>
  ): Promise<Array<{ supplierId: string; externalId: string; price: PriceCheck | null }>> {
    const results: Array<{ supplierId: string; externalId: string; price: PriceCheck | null }> = [];

    for (const mapping of productMappings) {
      const supplier = this.get(mapping.supplierId);
      if (!supplier || !supplier.isHealthy()) {
        results.push({ ...mapping, price: null });
        continue;
      }

      try {
        const priceCheck = await supplier.checkPrice(mapping.externalId);
        results.push({ ...mapping, price: priceCheck });
      } catch {
        results.push({ ...mapping, price: null });
      }
    }

    return results;
  }

  /**
   * Place order with optimal supplier
   */
  async placeOrderWithBest(
    items: SupplierOrderItem[],
    shippingAddress: ShippingAddress,
    preferredSupplier?: string
  ): Promise<SupplierOrder> {
    // Try preferred supplier first
    if (preferredSupplier) {
      const supplier = this.get(preferredSupplier);
      if (supplier && supplier.isHealthy()) {
        try {
          return await supplier.placeOrder(items, shippingAddress);
        } catch (error) {
          console.warn(`[Suppliers] Preferred supplier ${preferredSupplier} failed, trying others...`);
        }
      }
    }

    // Try suppliers by priority
    const suppliers = this.getByPriority();
    for (const supplier of suppliers) {
      if (supplier.supportsCountry(shippingAddress.countryCode)) {
        try {
          return await supplier.placeOrder(items, shippingAddress);
        } catch (error) {
          console.warn(`[Suppliers] ${supplier.getName()} failed, trying next...`);
          continue;
        }
      }
    }

    throw new Error('No available supplier could fulfill this order');
  }

  /**
   * Get shipping estimates from all suppliers
   */
  async getAllShippingEstimates(
    externalId: string,
    destination: string
  ): Promise<Array<{ supplier: string; estimates: ShippingEstimate[] }>> {
    const results: Array<{ supplier: string; estimates: ShippingEstimate[] }> = [];
    const healthySuppliers = this.getHealthy();

    for (const supplier of healthySuppliers) {
      if (supplier.supportsCountry(destination)) {
        try {
          const estimates = await supplier.getShippingEstimate(externalId, destination);
          results.push({
            supplier: supplier.getName(),
            estimates,
          });
        } catch {
          // Skip failed suppliers
        }
      }
    }

    return results;
  }

  // --------------------------------------------
  // STATUS & HEALTH
  // --------------------------------------------

  /**
   * Get status of all suppliers
   */
  getAllStatus(): SupplierStatus[] {
    return this.getAll().map(s => s.getStatus());
  }

  /**
   * Test connections for all suppliers
   */
  async testAllConnections(): Promise<Array<{ supplier: string; connected: boolean; error?: string }>> {
    const results: Array<{ supplier: string; connected: boolean; error?: string }> = [];

    for (const supplier of this.getAll()) {
      try {
        const connected = await supplier.testConnection();
        results.push({ supplier: supplier.getName(), connected });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ supplier: supplier.getName(), connected: false, error: errMsg });
      }
    }

    return results;
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    totalSuppliers: number;
    healthySuppliers: number;
    unhealthySuppliers: string[];
    overallScore: number;
  } {
    const all = this.getAll();
    const healthy = this.getHealthy();
    const unhealthy = all
      .filter(s => !s.isHealthy())
      .map(s => s.getName());

    const scores = all.map(s => s.getStatus().healthScore);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      totalSuppliers: all.length,
      healthySuppliers: healthy.length,
      unhealthySuppliers: unhealthy,
      overallScore,
    };
  }

  // --------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------

  private isBetter(
    current: SupplierComparison,
    all: SupplierComparison[],
    prioritize: 'price' | 'speed' | 'rating'
  ): boolean {
    const others = all.filter(c => c.supplierId !== current.supplierId);
    if (others.length === 0) return true;

    switch (prioritize) {
      case 'price':
        return current.totalCost <= Math.min(...others.map(o => o.totalCost));
      case 'speed':
        return current.deliveryDays.max <= Math.min(...others.map(o => o.deliveryDays.max));
      case 'rating':
        return current.rating >= Math.max(...others.map(o => o.rating));
      default:
        return current.totalCost <= Math.min(...others.map(o => o.totalCost));
    }
  }

  private generateSelectionReason(
    comparisons: SupplierComparison[],
    prioritize: 'price' | 'speed' | 'rating'
  ): string {
    if (comparisons.length <= 1) {
      return 'Only available supplier';
    }

    switch (prioritize) {
      case 'price':
        return `Selected for lowest total cost ($${Math.min(...comparisons.map(c => c.totalCost)).toFixed(2)})`;
      case 'speed':
        return `Selected for fastest delivery (${Math.min(...comparisons.map(c => c.deliveryDays.min))}-${Math.min(...comparisons.map(c => c.deliveryDays.max))} days)`;
      case 'rating':
        return `Selected for highest rating (${Math.max(...comparisons.map(c => c.rating))}/5)`;
      default:
        return 'Best overall option';
    }
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let registryInstance: SupplierRegistry | null = null;

export function getSupplierRegistry(): SupplierRegistry {
  if (!registryInstance) {
    registryInstance = new SupplierRegistry();
  }
  return registryInstance;
}

export function resetSupplierRegistry(): void {
  registryInstance = null;
}

// --------------------------------------------
// RE-EXPORT ALL TYPES
// --------------------------------------------

export * from './base';
export { CJDropshippingSupplier, getCJSupplier } from './cj';
