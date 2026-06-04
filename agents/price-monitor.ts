// ============================================
// CAREHUB AI AGENT — PRICE MONITOR (AGENT #11)
// ============================================
// 24/7 automatic price monitoring:
// - Checks CJ Dropshipping prices every 6 hours
// - Detects price changes (up or down)
// - Auto-updates store prices maintaining margin
// - Protects profit margins at all times
// - Alerts on significant changes
// - Future: multi-supplier price comparison
// Runs via Vercel Cron — PC off ho tab bhi kaam kare
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient, ShopifyProduct, calculateSellingPrice, calculateCompareAtPrice } from '@/lib/shopify';
import { getSupplierRegistry, SupplierRegistry, PriceCheck } from '@/lib/suppliers';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface PriceMonitorResult {
  success: boolean;
  message: string;
  checked: number;
  updated: number;
  alerts: PriceAlert[];
  errors: string[];
  duration: number;
}

export interface PriceAlert {
  productId: number;
  productTitle: string;
  supplierId: string;
  previousCost: number;
  newCost: number;
  changePercent: number;
  direction: 'up' | 'down';
  previousSelling: string;
  newSelling: string;
  autoUpdated: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PriceMonitorConfig {
  marginPercent: number;
  autoUpdate: boolean;
  alertThresholdPercent: number;
  maxPriceIncreasePercent: number;
  compareAtInflation: number;
  checkInterval: number;
  maxProductsPerRun: number;
  enabled: boolean;
}

export interface PriceHistory {
  productId: number;
  supplierId: string;
  costPrices: Array<{ price: number; timestamp: number }>;
  sellingPrices: Array<{ price: string; timestamp: number }>;
  lastChecked: number;
}

export interface MonitorStatus {
  enabled: boolean;
  lastRun: number | null;
  nextRun: number | null;
  totalChecks: number;
  totalUpdates: number;
  totalAlerts: number;
  config: PriceMonitorConfig;
  supplierHealth: Array<{ name: string; healthy: boolean; score: number }>;
}

// --------------------------------------------
// DEFAULT CONFIG
// --------------------------------------------

const DEFAULT_CONFIG: PriceMonitorConfig = {
  marginPercent: 40,
  autoUpdate: true,
  alertThresholdPercent: 5,
  maxPriceIncreasePercent: 30,
  compareAtInflation: 25,
  checkInterval: 6, // hours
  maxProductsPerRun: 50,
  enabled: true,
};

// --------------------------------------------
// PRICE MONITOR CLASS
// --------------------------------------------

export class PriceMonitor {
  private router: AIRouter;
  private memory: MemoryAgent;
  private shopify: ShopifyClient;
  private suppliers: SupplierRegistry;
  private config: PriceMonitorConfig;
  private totalChecks: number = 0;
  private totalUpdates: number = 0;
  private totalAlerts: number = 0;
  private lastRunTime: number | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<pricemonitorconfig>) {
    this.router = getAIRouter();
    this.memory = getMemoryAgent();
    this.shopify = getShopifyClient();
    this.suppliers = getSupplierRegistry();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Load margin from env
    const envMargin = process.env.DEFAULT_PROFIT_MARGIN;
    if (envMargin) {
      this.config.marginPercent = parseInt(envMargin);
    }
  }

  // --------------------------------------------
  // MAIN MONITOR METHOD (Called by Cron)
  // --------------------------------------------

  async runMonitor(): Promise {
    const startTime = Date.now();
    const alerts: PriceAlert[] = [];
    const errors: string[] = [];
    let checked = 0;
    let updated = 0;

    // Prevent concurrent runs
    if (this.isRunning) {
      return {
        success: false,
        message: 'Price monitor is already running',
        checked: 0,
        updated: 0,
        alerts: [],
        errors: ['Concurrent run prevented'],
        duration: 0,
      };
    }

    if (!this.config.enabled) {
      return {
        success: true,
        message: 'Price monitor is disabled',
        checked: 0,
        updated: 0,
        alerts: [],
        errors: [],
        duration: 0,
      };
    }

    this.isRunning = true;

    try {
      // Load config from memory
      const preferences = await this.memory.getPreferences();
      this.config.marginPercent = preferences.profitMargin || this.config.marginPercent;

      // Step 1: Get products that have supplier info
      const products = await this.getTrackedProducts();

      if (products.length === 0) {
        this.isRunning = false;
        return {
          success: true,
          message: '✅ No products with supplier tracking. Import products from CJ first.',
          checked: 0,
          updated: 0,
          alerts: [],
          errors: [],
          duration: Date.now() - startTime,
        };
      }

      // Step 2: Check prices for each product
      for (const product of products.slice(0, this.config.maxProductsPerRun)) {
        try {
          const result = await this.checkProductPrice(product);
          checked++;

          if (result.alert) {
            alerts.push(result.alert);
            this.totalAlerts++;

            // Auto-update if configured
            if (this.config.autoUpdate && result.alert.severity !== 'critical') {
              const updateSuccess = await this.updateProductPrice(product, result.alert.newCost);
              if (updateSuccess) {
                updated++;
                result.alert.autoUpdated = true;
              }
            }
          }

          // Rate limit — small delay between checks
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          errors.push(`${product.title}: ${error instanceof Error ? error.message : 'Failed'}`);
        }
      }

      // Step 3: Update memory
      this.lastRunTime = Date.now();
      this.totalChecks += checked;
      this.totalUpdates += updated;

      await this.memory.updateStoreState({
        lastPriceCheck: Date.now(),
      });

      // Step 4: Log action
      await this.memory.logAction({
        agent: 'price-monitor',
        action: 'price_check_run',
        input: `Checked ${checked} products`,
        output: `Updated: ${updated}, Alerts: ${alerts.length}, Errors: ${errors.length}`,
        success: true,
        duration: Date.now() - startTime,
        reversible: false,
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: this.generateSummaryMessage(checked, updated, alerts, errors, duration),
        checked,
        updated,
        alerts,
        errors,
        duration,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errMsg);

      return {
        success: false,
        message: `❌ Price monitor error: ${errMsg}`,
        checked,
        updated,
        alerts,
        errors,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isRunning = false;
    }
  }

  // --------------------------------------------
  // GET TRACKED PRODUCTS
  // --------------------------------------------

  private async getTrackedProducts(): Promise {
    try {
      const allProducts = await this.shopify.getAllProducts();

      // Filter products that have supplier info in tags
      return allProducts.filter(product => {
        const tags = product.tags || '';
        return tags.includes('ext_id:') || tags.includes('supplier:');
      });
    } catch {
      return [];
    }
  }

  // --------------------------------------------
  // CHECK SINGLE PRODUCT PRICE
  // --------------------------------------------

  private async checkProductPrice(product: ShopifyProduct): Promise<{
    changed: boolean;
    alert?: PriceAlert;
  }> {
    const tags = product.tags || '';

    // Extract supplier info from tags
    const extIdMatch = tags.match(/ext_id:(\S+)/);
    const costMatch = tags.match(/cost:([\d.]+)/);
    const supplierMatch = tags.match(/supplier:(\S+)/);

    if (!extIdMatch || !costMatch) {
      return { changed: false };
    }

    const externalId = extIdMatch[1].replace(',', '');
    const storedCost = parseFloat(costMatch[1].replace(',', ''));
    const supplierName = supplierMatch ? supplierMatch[1].replace(',', '') : 'cj_dropshipping';

    // Get supplier
    const supplierId = this.getSupplierIdFromName(supplierName);
    const supplier = this.suppliers.get(supplierId);

    if (!supplier || !supplier.isHealthy()) {
      return { changed: false };
    }

    // Check current price
    const priceCheck: PriceCheck = await supplier.checkPrice(externalId);

    if (!priceCheck.available) {
      // Product unavailable — high severity alert
      return {
        changed: true,
        alert: {
          productId: product.id || 0,
          productTitle: product.title,
          supplierId: externalId,
          previousCost: storedCost,
          newCost: 0,
          changePercent: -100,
          direction: 'down',
          previousSelling: product.variants?.[0]?.price || '0',
          newSelling: '0',
          autoUpdated: false,
          severity: 'critical',
        },
      };
    }

    const currentCost = priceCheck.currentPrice;

    // Check if price changed
    if (Math.abs(currentCost - storedCost) < 0.01) {
      return { changed: false };
    }

    // Calculate change
    const changePercent = ((currentCost - storedCost) / storedCost) * 100;
    const direction: 'up' | 'down' = currentCost > storedCost ? 'up' : 'down';
    const severity = this.calculateSeverity(Math.abs(changePercent), direction);

    // Calculate new selling price
    const newSellingPrice = calculateSellingPrice(currentCost, this.config.marginPercent);

    const alert: PriceAlert = {
      productId: product.id || 0,
      productTitle: product.title,
      supplierId: externalId,
      previousCost: storedCost,
      newCost: currentCost,
      changePercent: parseFloat(changePercent.toFixed(2)),
      direction,
      previousSelling: product.variants?.[0]?.price || '0',
      newSelling: newSellingPrice,
      autoUpdated: false,
      severity,
    };

    return { changed: true, alert };
  }

  // --------------------------------------------
  // UPDATE PRODUCT PRICE
  // --------------------------------------------

  private async updateProductPrice(product: ShopifyProduct, newCostPrice: number): Promise {
    try {
      const newSellingPrice = calculateSellingPrice(newCostPrice, this.config.marginPercent);
      const newCompareAt = calculateCompareAtPrice(
        parseFloat(newSellingPrice),
        this.config.compareAtInflation
      );

      // Check if price increase is too much
      const currentPrice = parseFloat(product.variants?.[0]?.price || '0');
      const newPrice = parseFloat(newSellingPrice);

      if (currentPrice > 0) {
        const priceIncrease = ((newPrice - currentPrice) / currentPrice) * 100;
        if (priceIncrease > this.config.maxPriceIncreasePercent) {
          console.warn(`[PriceMonitor] Price increase too high (${priceIncrease.toFixed(1)}%) for "${product.title}" — skipping auto-update`);
          return false;
        }
      }

      // Update all variants
      if (product.variants) {
        for (const variant of product.variants) {
          if (variant.id) {
            await this.shopify.updateVariant(variant.id, {
              price: newSellingPrice,
              compare_at_price: newCompareAt,
            });
          }
        }
      }

      // Update cost tag
      if (product.id) {
        const tags = (product.tags || '')
          .split(',')
          .map(t => t.trim())
          .filter(t => !t.startsWith('cost:'));
        tags.push(`cost:${newCostPrice}`);

        await this.shopify.updateProduct(product.id, {
          tags: tags.join(', '),
        });
      }

      return true;
    } catch (error) {
      console.error(`[PriceMonitor] Error updating price for "${product.title}":`, error);
      return false;
    }
  }

  // --------------------------------------------
  // MANUAL PRICE CHECK
  // --------------------------------------------

  async checkAllPricesNow(): Promise {
    return this.runMonitor();
  }

  async checkSingleProduct(productId: number): Promise<{
    success: boolean;
    message: string;
    alert?: PriceAlert;
  }> {
    try {
      const response = await this.shopify.getProduct(productId);
      if (!response.success || !response.data) {
        return { success: false, message: 'Product not found' };
      }

      const product = response.data.product;
      const result = await this.checkProductPrice(product);

      if (result.alert) {
        return {
          success: true,
          message: `Price ${result.alert.direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(result.alert.changePercent)}%`,
          alert: result.alert,
        };
      }

      return { success: true, message: '✅ Price unchanged — no action needed' };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // MARGIN MANAGEMENT
  // --------------------------------------------

  async updateMargin(newMarginPercent: number): Promise<{ success: boolean; message: string }> {
    if (newMarginPercent < 5 || newMarginPercent > 90) {
      return { success: false, message: 'Margin must be between 5% and 90%' };
    }

    this.config.marginPercent = newMarginPercent;

    // Update in preferences
    await this.memory.setPreferences({ profitMargin: newMarginPercent });

    return {
      success: true,
      message: `✅ Profit margin updated to ${newMarginPercent}%. Next price check will use new margin.`,
    };
  }

  async recalculateAllPrices(): Promise {
    const startTime = Date.now();
    const alerts: PriceAlert[] = [];
    const errors: string[] = [];
    let checked = 0;
    let updated = 0;

    try {
      const products = await this.getTrackedProducts();

      for (const product of products) {
        try {
          const tags = product.tags || '';
          const costMatch = tags.match(/cost:([\d.]+)/);

          if (costMatch) {
            const costPrice = parseFloat(costMatch[1].replace(',', ''));
            const success = await this.updateProductPrice(product, costPrice);

            if (success) updated++;
            checked++;
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          errors.push(`${product.title}: ${error instanceof Error ? error.message : 'Failed'}`);
        }
      }

      return {
        success: true,
        message: `✅ Recalculated prices for ${updated}/${checked} products with ${this.config.marginPercent}% margin`,
        checked,
        updated,
        alerts,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        checked,
        updated,
        alerts,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  // --------------------------------------------
  // CONFIGURATION
  // --------------------------------------------

  getConfig(): PriceMonitorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial): PriceMonitorConfig {
    this.config = { ...this.config, ...updates };
    return this.config;
  }

  // --------------------------------------------
  // STATUS
  // --------------------------------------------

  getStatus(): MonitorStatus {
    const supplierHealth = this.suppliers.getAllStatus().map(s => ({
      name: s.name,
      healthy: s.connected,
      score: s.healthScore,
    }));

    return {
      enabled: this.config.enabled,
      lastRun: this.lastRunTime,
      nextRun: this.lastRunTime
        ? this.lastRunTime + (this.config.checkInterval * 60 * 60 * 1000)
        : null,
      totalChecks: this.totalChecks,
      totalUpdates: this.totalUpdates,
      totalAlerts: this.totalAlerts,
      config: this.config,
      supplierHealth,
    };
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  // --------------------------------------------
  // HELPER METHODS
  // --------------------------------------------

  private calculateSeverity(changePercent: number, direction: 'up' | 'down'): PriceAlert['severity'] {
    if (direction === 'up') {
      if (changePercent >= 50) return 'critical';
      if (changePercent >= 20) return 'high';
      if (changePercent >= 10) return 'medium';
      return 'low';
    } else {
      // Price drops are generally good, but large ones might indicate issue
      if (changePercent >= 50) return 'high'; // Suspicious large drop
      if (changePercent >= 20) return 'medium';
      return 'low';
    }
  }

  private getSupplierIdFromName(name: string): string {
    const nameMap: Record = {
      'cj': 'cj_dropshipping',
      'cj_dropshipping': 'cj_dropshipping',
      'cjdropshipping': 'cj_dropshipping',
      'aliexpress': 'aliexpress',
      'zendrop': 'zendrop',
      'spocket': 'spocket',
    };

    return nameMap[name.toLowerCase()] || name;
  }

  private generateSummaryMessage(
    checked: number,
    updated: number,
    alerts: PriceAlert[],
    errors: string[],
    duration: number
  ): string {
    const lines: string[] = [
      `✅ Price Monitor Complete`,
      ``,
      `📊 Results:`,
      `• Products checked: ${checked}`,
      `• Prices updated: ${updated}`,
      `• Alerts generated: ${alerts.length}`,
      `• Errors: ${errors.length}`,
      `• Duration: ${(duration / 1000).toFixed(1)}s`,
      `• Margin: ${this.config.marginPercent}%`,
    ];

    if (alerts.length > 0) {
      lines.push('');
      lines.push('⚠️ Price Alerts:');

      const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
      const otherAlerts = alerts.filter(a => a.severity === 'medium' || a.severity === 'low');

      for (const alert of criticalAlerts) {
        lines.push(`  🔴 ${alert.productTitle}: ${alert.direction === 'up' ? '📈' : '📉'} ${alert.changePercent > 0 ? '+' : ''}${alert.changePercent}% ($${alert.previousCost.toFixed(2)} → $${alert.newCost.toFixed(2)}) ${alert.autoUpdated ? '✅ Auto-updated' : '⚠️ Manual review needed'}`);
      }

      if (otherAlerts.length > 0) {
        lines.push(`  ℹ️ +${otherAlerts.length} minor price changes (auto-handled)`);
      }
    }

    if (errors.length > 0) {
      lines.push('');
      lines.push(`❌ Errors (${errors.length}):`);
      errors.slice(0, 3).forEach(e => lines.push(`  • ${e}`));
      if (errors.length > 3) lines.push(`  • ...and ${errors.length - 3} more`);
    }

    return lines.join('\n');
  }

  // Quick command handler
  async handleCommand(command: string): Promise {
    const lower = command.toLowerCase();

    if (lower.includes('check') || lower.includes('run') || lower.includes('monitor') || lower.includes('price check')) {
      return this.runMonitor();
    }

    if (lower.includes('status')) {
      const status = this.getStatus();
      return {
        success: true,
        message: `📊 Price Monitor Status:\n• Enabled: ${status.enabled}\n• Last run: ${status.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}\n• Total checks: ${status.totalChecks}\n• Total updates: ${status.totalUpdates}\n• Margin: ${status.config.marginPercent}%`,
      };
    }

    if (lower.includes('margin')) {
      const marginMatch = lower.match(/(\d+)\s*%?/);
      if (marginMatch) {
        return this.updateMargin(parseInt(marginMatch[1]));
      }
      return { success: true, message: `Current margin: ${this.config.marginPercent}%` };
    }

    if (lower.includes('recalculate') || lower.includes('update all')) {
      return this.recalculateAllPrices();
    }

    if (lower.includes('enable')) {
      this.enable();
      return { success: true, message: '✅ Price monitor enabled' };
    }

    if (lower.includes('disable') || lower.includes('stop')) {
      this.disable();
      return { success: true, message: '⏸️ Price monitor disabled' };
    }

    return {
      success: false,
      message: 'Try: run price check, monitor status, set margin 40%, recalculate prices, enable/disable',
      checked: 0,
      updated: 0,
      alerts: [],
      errors: [],
      duration: 0,
    };
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let priceMonitorInstance: PriceMonitor | null = null;

export function getPriceMonitor(config?: Partial): PriceMonitor {
  if (!priceMonitorInstance) {
    priceMonitorInstance = new PriceMonitor(config);
  }
  return priceMonitorInstance;
}

export function resetPriceMonitor(): void {
  priceMonitorInstance = null;
}
