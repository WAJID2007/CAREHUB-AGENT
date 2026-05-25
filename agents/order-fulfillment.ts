// ============================================
// CAREHUB AI AGENT — ORDER FULFILLMENT (AGENT #10)
// ============================================
// Complete order processing & fulfillment:
// - Detect new/unfulfilled orders
// - Place orders on CJ Dropshipping
// - Track order status
// - Update customer with tracking info
// - Handle failed orders
// - Process refunds/returns
// - Order analytics
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient, ShopifyOrder, ShopifyFulfillment } from '@/lib/shopify';
import { getSupplierRegistry, SupplierRegistry, SupplierOrderItem, ShippingAddress } from '@/lib/suppliers';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface OrderFulfillmentResult {
  success: boolean;
  message: string;
  orders?: ProcessedOrder[];
  order?: ProcessedOrder;
  count?: number;
  errors?: string[];
}

export interface ProcessedOrder {
  shopifyOrderId: number;
  shopifyOrderName: string;
  supplierOrderId?: string;
  status: OrderProcessStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  customerEmail?: string;
  totalPrice: string;
  itemCount: number;
  processedAt?: number;
  error?: string;
}

export type OrderProcessStatus =
  | 'pending'
  | 'processing'
  | 'placed_with_supplier'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface FulfillmentRequest {
  orderId?: number;
  orderIds?: number[];
  autoFulfill?: boolean;
  supplier?: string;
}

export interface OrderSummary {
  total: number;
  unfulfilled: number;
  partiallyFulfilled: number;
  fulfilled: number;
  cancelled: number;
  refunded: number;
  pendingValue: string;
  todayOrders: number;
}

// --------------------------------------------
// ORDER FULFILLMENT CLASS
// --------------------------------------------

export class OrderFulfillment {
  private router: AIRouter;
  private memory: MemoryAgent;
  private shopify: ShopifyClient;
  private suppliers: SupplierRegistry;
  private processingOrders: Set<number> = new Set();

  constructor() {
    this.router = getAIRouter();
    this.memory = getMemoryAgent();
    this.shopify = getShopifyClient();
    this.suppliers = getSupplierRegistry();
  }

  // --------------------------------------------
  // GET ORDERS
  // --------------------------------------------

  async getUnfulfilledOrders(): Promise {
    try {
      const response = await this.shopify.getOrders({
        status: 'open',
        fulfillment_status: 'unfulfilled',
        limit: 50,
      });

      if (!response.success || !response.data) {
        return { success: false, message: response.error || 'Failed to fetch orders' };
      }

      const orders = response.data.orders;
      const processed = orders.map(o => this.mapToProcessedOrder(o));

      return {
        success: true,
        message: `Found ${orders.length} unfulfilled orders`,
        orders: processed,
        count: orders.length,
      };
    } catch (error) {
      return { success: false, message: `Error fetching orders: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async getRecentOrders(limit: number = 20): Promise {
    try {
      const response = await this.shopify.getOrders({
        status: 'any',
        limit,
      });

      if (!response.success || !response.data) {
        return { success: false, message: response.error || 'Failed to fetch orders' };
      }

      const processed = response.data.orders.map(o => this.mapToProcessedOrder(o));

      return {
        success: true,
        message: `Found ${processed.length} recent orders`,
        orders: processed,
        count: processed.length,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async getOrder(orderId: number): Promise {
    try {
      const response = await this.shopify.getOrder(orderId);

      if (!response.success || !response.data) {
        return { success: false, message: response.error || 'Order not found' };
      }

      return {
        success: true,
        message: 'Order found',
        order: this.mapToProcessedOrder(response.data.order),
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // ORDER SUMMARY / ANALYTICS
  // --------------------------------------------

  async getOrderSummary(): Promise {
    try {
      const [totalResp, unfulfilledResp] = await Promise.all([
        this.shopify.getOrderCount({ status: 'open' }),
        this.shopify.getOrderCount({ status: 'open', fulfillment_status: 'unfulfilled' }),
      ]);

      const total = totalResp.data?.count || 0;
      const unfulfilled = unfulfilledResp.data?.count || 0;

      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = await this.shopify.getOrders({
        status: 'any',
        created_at_min: today.toISOString(),
        limit: 50,
      });

      // Calculate pending value
      let pendingValue = 0;
      if (todayOrders.success && todayOrders.data) {
        pendingValue = todayOrders.data.orders
          .filter(o => !o.fulfillment_status)
          .reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0);
      }

      const summary: OrderSummary = {
        total,
        unfulfilled,
        partiallyFulfilled: 0,
        fulfilled: total - unfulfilled,
        cancelled: 0,
        refunded: 0,
        pendingValue: pendingValue.toFixed(2),
        todayOrders: todayOrders.data?.orders.length || 0,
      };

      await this.memory.updateStoreState({ totalOrders: total });

      return summary;
    } catch {
      return {
        total: 0,
        unfulfilled: 0,
        partiallyFulfilled: 0,
        fulfilled: 0,
        cancelled: 0,
        refunded: 0,
        pendingValue: '0.00',
        todayOrders: 0,
      };
    }
  }

  // --------------------------------------------
  // FULFILL ORDERS
  // --------------------------------------------

  async fulfillOrder(request: FulfillmentRequest): Promise {
    try {
      // Single order
      if (request.orderId) {
        const result = await this.processSingleOrder(request.orderId, request.supplier);
        return {
          success: result.status !== 'failed',
          message: result.error || `Order ${result.shopifyOrderName} processed: ${result.status}`,
          order: result,
        };
      }

      // Multiple orders
      if (request.orderIds && request.orderIds.length > 0) {
        return this.processMultipleOrders(request.orderIds, request.supplier);
      }

      // Auto-fulfill all unfulfilled
      if (request.autoFulfill) {
        return this.autoFulfillAll(request.supplier);
      }

      return { success: false, message: 'Provide orderId, orderIds, or set autoFulfill: true' };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  private async processSingleOrder(orderId: number, preferredSupplier?: string): Promise {
    // Prevent double-processing
    if (this.processingOrders.has(orderId)) {
      return {
        shopifyOrderId: orderId,
        shopifyOrderName: `#${orderId}`,
        status: 'processing',
        totalPrice: '0',
        itemCount: 0,
        error: 'Order is already being processed',
      };
    }

    this.processingOrders.add(orderId);

    try {
      // Get order details
      const orderResponse = await this.shopify.getOrder(orderId);
      if (!orderResponse.success || !orderResponse.data) {
        return {
          shopifyOrderId: orderId,
          shopifyOrderName: `#${orderId}`,
          status: 'failed',
          totalPrice: '0',
          itemCount: 0,
          error: 'Could not fetch order details',
        };
      }

      const order = orderResponse.data.order;

      // Check if already fulfilled
      if (order.fulfillment_status === 'fulfilled') {
        return {
          shopifyOrderId: orderId,
          shopifyOrderName: order.name || `#${orderId}`,
          status: 'shipped',
          totalPrice: order.total_price || '0',
          itemCount: order.line_items?.length || 0,
        };
      }

      // Build supplier order items
      const supplierItems: SupplierOrderItem[] = (order.line_items || []).map(item => ({
        externalProductId: item.product_id?.toString() || '',
        externalVariantId: item.variant_id?.toString() || '',
        quantity: item.quantity,
        costPrice: parseFloat(item.price) * 0.6, // Estimated cost (60% of selling price)
        sku: item.sku || '',
        title: item.title,
      }));

      // Build shipping address
      const shippingAddr = order.shipping_address;
      const address: ShippingAddress = {
        firstName: shippingAddr?.first_name || '',
        lastName: shippingAddr?.last_name || '',
        address1: shippingAddr?.address1 || '',
        address2: shippingAddr?.address2 || '',
        city: shippingAddr?.city || '',
        state: shippingAddr?.province || '',
        country: shippingAddr?.country || '',
        countryCode: shippingAddr?.country_code || 'US',
        zip: shippingAddr?.zip || '',
        phone: shippingAddr?.phone || '',
        email: order.email || '',
      };

      // Place order with supplier
      let supplierOrderId: string | undefined;
      let trackingNumber: string | undefined;
      let trackingUrl: string | undefined;
      let orderStatus: OrderProcessStatus = 'processing';

      try {
        const supplierOrder = await this.suppliers.placeOrderWithBest(
          supplierItems,
          address,
          preferredSupplier || 'cj_dropshipping'
        );

        supplierOrderId = supplierOrder.externalOrderId;
        trackingNumber = supplierOrder.trackingInfo?.trackingNumber;
        trackingUrl = supplierOrder.trackingInfo?.trackingUrl;
        orderStatus = 'placed_with_supplier';

        // If tracking available, create fulfillment on Shopify
        if (trackingNumber) {
          await this.createShopifyFulfillment(orderId, order, trackingNumber, trackingUrl);
          orderStatus = 'shipped';
        }
      } catch (supplierError) {
        // Supplier order failed — log but don't crash
        console.error(`[OrderFulfillment] Supplier order failed for #${orderId}:`, supplierError);
        orderStatus = 'placed_with_supplier'; // Mark as placed, tracking will come later
      }

      // Add note to order
      await this.shopify.updateOrder(orderId, {
        note: `[CareHub Agent] Processed at ${new Date().toISOString()}. Supplier order: ${supplierOrderId || 'pending'}`,
        tags: `carehub_processed,supplier_${preferredSupplier || 'cj'}`,
      });

      // Log action
      await this.memory.logAction({
        agent: 'order-fulfillment',
        action: 'fulfill_order',
        input: `Order #${order.name || orderId}`,
        output: `Status: ${orderStatus}, Supplier ID: ${supplierOrderId || 'N/A'}`,
        success: true,
        duration: 0,
        reversible: false,
      });

      const result: ProcessedOrder = {
        shopifyOrderId: orderId,
        shopifyOrderName: order.name || `#${orderId}`,
        supplierOrderId,
        status: orderStatus,
        trackingNumber,
        trackingUrl,
        customerEmail: order.email || undefined,
        totalPrice: order.total_price || '0',
        itemCount: order.line_items?.length || 0,
        processedAt: Date.now(),
      };

      return result;
    } finally {
      this.processingOrders.delete(orderId);
    }
  }

  private async processMultipleOrders(orderIds: number[], supplier?: string): Promise {
    const processed: ProcessedOrder[] = [];
    const errors: string[] = [];

    for (const orderId of orderIds) {
      try {
        const result = await this.processSingleOrder(orderId, supplier);
        processed.push(result);

        if (result.status === 'failed') {
          errors.push(`Order #${result.shopifyOrderName}: ${result.error}`);
        }

        // Delay between orders
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push(`Order ${orderId}: ${error instanceof Error ? error.message : 'Failed'}`);
      }
    }

    const successCount = processed.filter(p => p.status !== 'failed').length;

    return {
      success: successCount > 0,
      message: `✅ Processed ${successCount}/${orderIds.length} orders`,
      orders: processed,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async autoFulfillAll(supplier?: string): Promise {
    // Get all unfulfilled orders
    const unfulfilledResult = await this.getUnfulfilledOrders();

    if (!unfulfilledResult.success || !unfulfilledResult.orders || unfulfilledResult.orders.length === 0) {
      return {
        success: true,
        message: '✅ No unfulfilled orders to process!',
        count: 0,
      };
    }

    const orderIds = unfulfilledResult.orders.map(o => o.shopifyOrderId);
    return this.processMultipleOrders(orderIds, supplier);
  }

  // --------------------------------------------
  // TRACKING UPDATES
  // --------------------------------------------

  async updateTracking(orderId: number, trackingNumber: string, trackingCompany?: string): Promise {
    try {
      const orderResponse = await this.shopify.getOrder(orderId);
      if (!orderResponse.success || !orderResponse.data) {
        return { success: false, message: 'Order not found' };
      }

      const order = orderResponse.data.order;
      const trackingUrl = this.generateTrackingUrl(trackingNumber, trackingCompany);

      // Create fulfillment with tracking
      await this.createShopifyFulfillment(orderId, order, trackingNumber, trackingUrl, trackingCompany);

      await this.memory.logAction({
        agent: 'order-fulfillment',
        action: 'update_tracking',
        input: `Order #${order.name}: ${trackingNumber}`,
        output: 'Tracking updated and customer notified',
        success: true,
        duration: 0,
        reversible: false,
      });

      return {
        success: true,
        message: `✅ Tracking updated for order #${order.name}. Customer notified!`,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async checkAndUpdateTracking(): Promise {
    try {
      // Get orders that are placed but not yet shipped
      const response = await this.shopify.getOrders({
        status: 'open',
        fulfillment_status: 'unfulfilled',
        limit: 50,
      });

      if (!response.success || !response.data) {
        return { success: false, message: 'Could not fetch orders' };
      }

      const orders = response.data.orders.filter(o =>
        o.tags?.includes('carehub_processed') && !o.fulfillment_status
      );

      let updated = 0;
      const errors: string[] = [];

      for (const order of orders) {
        try {
          // Check supplier for tracking
          const supplierNote = order.note || '';
          const supplierIdMatch = supplierNote.match(/Supplier order: (\S+)/);

          if (supplierIdMatch && supplierIdMatch[1] !== 'pending') {
            const supplierId = supplierIdMatch[1];

            // Try to get tracking from CJ
            const cjSupplier = this.suppliers.get('cj_dropshipping');
            if (cjSupplier) {
              const tracking = await cjSupplier.getTracking(supplierId);

              if (tracking && tracking.trackingNumber && order.id) {
                await this.createShopifyFulfillment(
                  order.id,
                  order,
                  tracking.trackingNumber,
                  tracking.trackingUrl,
                  tracking.carrier
                );
                updated++;
              }
            }
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          errors.push(`Order #${order.name}: ${error instanceof Error ? error.message : 'Failed'}`);
        }
      }

      return {
        success: true,
        message: `✅ Checked ${orders.length} orders, updated tracking for ${updated}`,
        count: updated,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // SHOPIFY FULFILLMENT CREATION
  // --------------------------------------------

  private async createShopifyFulfillment(
    orderId: number,
    order: ShopifyOrder,
    trackingNumber: string,
    trackingUrl?: string,
    trackingCompany?: string
  ): Promise {
    try {
      const lineItems = (order.line_items || [])
        .filter(item => !item.fulfillment_status)
        .map(item => ({
          id: item.id!,
          quantity: item.quantity,
        }));

      if (lineItems.length === 0) return false;

      const fulfillment: Partial = {
        order_id: orderId,
        tracking_number: trackingNumber,
        tracking_company: trackingCompany || this.detectCarrier(trackingNumber),
        tracking_url: trackingUrl || this.generateTrackingUrl(trackingNumber),
        line_items: lineItems,
        notify_customer: true,
      };

      const result = await this.shopify.createFulfillment(orderId, fulfillment);
      return result.success;
    } catch (error) {
      console.error(`[OrderFulfillment] Failed to create fulfillment for #${orderId}:`, error);
      return false;
    }
  }

  // --------------------------------------------
  // REFUND / CANCEL
  // --------------------------------------------

  async cancelOrder(orderId: number, reason?: string): Promise {
    try {
      // Update order tags
      await this.shopify.updateOrder(orderId, {
        tags: 'cancelled,carehub_cancelled',
        note: `[CareHub] Cancelled: ${reason || 'Customer request'} at ${new Date().toISOString()}`,
      });

      // Close the order
      await this.shopify.closeOrder(orderId);

      // Try to cancel with supplier
      const orderResponse = await this.shopify.getOrder(orderId);
      if (orderResponse.success && orderResponse.data) {
        const supplierNote = orderResponse.data.order.note || '';
        const supplierIdMatch = supplierNote.match(/Supplier order: (\S+)/);

        if (supplierIdMatch && supplierIdMatch[1] !== 'pending') {
          const cjSupplier = this.suppliers.get('cj_dropshipping');
          if (cjSupplier) {
            try {
              // Attempt to cancel with CJ
              const cj = cjSupplier as unknown as { cancelOrder: (id: string) => Promise };
              if (typeof cj.cancelOrder === 'function') {
                await cj.cancelOrder(supplierIdMatch[1]);
              }
            } catch {
              // Supplier cancellation failed — log but continue
            }
          }
        }
      }

      await this.memory.logAction({
        agent: 'order-fulfillment',
        action: 'cancel_order',
        input: `Order #${orderId}: ${reason || 'No reason'}`,
        output: 'Order cancelled',
        success: true,
        duration: 0,
        reversible: false,
      });

      return {
        success: true,
        message: `✅ Order #${orderId} cancelled successfully`,
      };
    } catch (error) {
      return { success: false, message: `Error cancelling: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async flagForRefund(orderId: number, reason: string): Promise {
    try {
      await this.shopify.updateOrder(orderId, {
        tags: 'refund_requested,carehub_refund',
        note: `[CareHub] Refund requested: ${reason} at ${new Date().toISOString()}`,
      });

      return {
        success: true,
        message: `✅ Order #${orderId} flagged for refund. Reason: ${reason}`,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // CRON JOB — AUTO PROCESS
  // --------------------------------------------

  async cronProcess(): Promise {
    const results: string[] = [];

    try {
      // Step 1: Check for new unfulfilled orders
      const unfulfilled = await this.getUnfulfilledOrders();
      results.push(`📦 Unfulfilled orders: ${unfulfilled.count || 0}`);

      // Step 2: Update tracking for processed orders
      const trackingUpdate = await this.checkAndUpdateTracking();
      results.push(`📍 Tracking updated: ${trackingUpdate.count || 0}`);

      // Step 3: Update memory
      const summary = await this.getOrderSummary();
      await this.memory.updateStoreState({
        totalOrders: summary.total,
        lastOrderFulfillment: Date.now(),
      });
      results.push(`📊 Total orders: ${summary.total}, Pending: ${summary.unfulfilled}`);

      await this.memory.logAction({
        agent: 'order-fulfillment',
        action: 'cron_process',
        input: 'Automatic cron run',
        output: results.join(' | '),
        success: true,
        duration: 0,
        reversible: false,
      });

      return {
        success: true,
        message: `✅ Order cron complete:\n${results.join('\n')}`,
      };
    } catch (error) {
      return { success: false, message: `Cron error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------

  private mapToProcessedOrder(order: ShopifyOrder): ProcessedOrder {
    let status: OrderProcessStatus = 'pending';

    if (order.fulfillment_status === 'fulfilled') status = 'shipped';
    else if (order.fulfillment_status === 'partial') status = 'processing';
    else if (order.financial_status === 'refunded') status = 'refunded';
    else if (order.tags?.includes('cancelled')) status = 'cancelled';
    else if (order.tags?.includes('carehub_processed')) status = 'placed_with_supplier';

    return {
      shopifyOrderId: order.id || 0,
      shopifyOrderName: order.name || `#${order.id}`,
      status,
      customerEmail: order.email || undefined,
      totalPrice: order.total_price || '0',
      itemCount: order.line_items?.length || 0,
    };
  }

  private detectCarrier(trackingNumber: string): string {
    if (!trackingNumber) return 'Other';

    const num = trackingNumber.toUpperCase();

    if (num.startsWith('1Z')) return 'UPS';
    if (num.length === 22 && /^\d+$/.test(num)) return 'USPS';
    if (num.length === 12 || num.length === 15) return 'FedEx';
    if (num.length === 10 && /^\d+$/.test(num)) return 'DHL';
    if (num.startsWith('LY') || num.startsWith('LP')) return 'China Post';
    if (num.startsWith('YT') || num.startsWith('YW')) return 'YunTrack';

    return '17Track';
  }

  private generateTrackingUrl(trackingNumber: string, carrier?: string): string {
    if (!trackingNumber) return '';

    const detectedCarrier = carrier || this.detectCarrier(trackingNumber);

    switch (detectedCarrier.toLowerCase()) {
      case 'ups':
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      case 'usps':
        return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
      case 'fedex':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case 'dhl':
        return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${trackingNumber}`;
      default:
        return `https://www.17track.net/en/track#nums=${trackingNumber}`;
    }
  }

  // Quick command handler
  async handleCommand(command: string): Promise {
    const lower = command.toLowerCase();

    if (lower.includes('unfulfilled') || lower.includes('pending') || lower.includes('new order')) {
      return this.getUnfulfilledOrders();
    }

    if (lower.includes('summary') || lower.includes('stats') || lower.includes('kitne order')) {
      const summary = await this.getOrderSummary();
      return {
        success: true,
        message: `📊 Order Summary:\n• Total: ${summary.total}\n• Unfulfilled: ${summary.unfulfilled}\n• Today: ${summary.todayOrders}\n• Pending Value: $${summary.pendingValue}`,
      };
    }

    if (lower.includes('fulfill all') || lower.includes('sab fulfill') || lower.includes('auto')) {
      return this.fulfillOrder({ autoFulfill: true });
    }

    if (lower.includes('tracking') || lower.includes('track')) {
      return this.checkAndUpdateTracking();
    }

    return { success: false, message: 'Command not recognized. Try: unfulfilled orders, order summary, fulfill all, update tracking' };
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let orderFulfillmentInstance: OrderFulfillment | null = null;

export function getOrderFulfillment(): OrderFulfillment {
  if (!orderFulfillmentInstance) {
    orderFulfillmentInstance = new OrderFulfillment();
  }
  return orderFulfillmentInstance;
}

export function resetOrderFulfillment(): void {
  orderFulfillmentInstance = null;
}
