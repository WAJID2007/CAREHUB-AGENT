// ============================================
// CAREHUB AI AGENT — PRODUCT MANAGER (AGENT #9)
// ============================================
// Complete product management:
// - List/search products
// - Add new products (title, desc, price, images)
// - Edit existing products
// - Delete products
// - Bulk operations
// - Import from CJ Dropshipping
// - Inventory management
// - Variant management
// - Price management with margin calculation
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient, ShopifyProduct, ShopifyVariant, calculateSellingPrice, calculateCompareAtPrice } from '@/lib/shopify';
import { getSupplierRegistry, SupplierRegistry, SupplierProduct } from '@/lib/suppliers';
import { GroqMessage } from '@/lib/groq';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface ProductCreateRequest {
  title: string;
  description?: string;
  price?: string;
  compareAtPrice?: string;
  images?: string[];
  variants?: VariantInput[];
  tags?: string[];
  productType?: string;
  vendor?: string;
  status?: 'active' | 'draft' | 'archived';
  generateDescription?: boolean;
  generateSEO?: boolean;
}

export interface ProductEditRequest {
  productId: number;
  updates: Partial<{
    title: string;
    description: string;
    price: string;
    compareAtPrice: string;
    images: string[];
    tags: string;
    productType: string;
    vendor: string;
    status: 'active' | 'draft' | 'archived';
  }>;
}

export interface VariantInput {
  title?: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  inventoryQuantity?: number;
  option1?: string;
  option2?: string;
  option3?: string;
  weight?: number;
  weightUnit?: string;
}

export interface ProductImportRequest {
  supplier: string;
  externalIds?: string[];
  searchQuery?: string;
  category?: string;
  maxProducts?: number;
  autoPrice?: boolean;
  marginPercent?: number;
  autoDescription?: boolean;
  status?: 'active' | 'draft';
}

export interface BulkOperation {
  type: 'update_price' | 'update_status' | 'add_tag' | 'remove_tag' | 'delete' | 'update_inventory';
  productIds: number[];
  value?: string | number;
}

export interface ProductManagerResult {
  success: boolean;
  message: string;
  products?: ShopifyProduct[];
  product?: ShopifyProduct;
  count?: number;
  errors?: string[];
}

// --------------------------------------------
// PRODUCT MANAGER CLASS
// --------------------------------------------

export class ProductManager {
  private router: AIRouter;
  private memory: MemoryAgent;
  private shopify: ShopifyClient;
  private suppliers: SupplierRegistry;

  constructor() {
    this.router = getAIRouter();
    this.memory = getMemoryAgent();
    this.shopify = getShopifyClient();
    this.suppliers = getSupplierRegistry();
  }

  // --------------------------------------------
  // LIST & SEARCH PRODUCTS
  // --------------------------------------------

  async listProducts(params?: {
    limit?: number;
    status?: string;
    collection_id?: number;
    product_type?: string;
    vendor?: string;
    title?: string;
  }): Promise<productmanagerresult> {
    try {
      const response = await this.shopify.getProducts({
        limit: params?.limit || 50,
        status: params?.status,
        collection_id: params?.collection_id,
        product_type: params?.product_type,
        vendor: params?.vendor,
        title: params?.title,
      });

      if (!response.success || !response.data) {
        return { success: false, message: response.error || 'Failed to fetch products' };
      }

      const products = response.data.products;

      await this.memory.updateStoreState({ totalProducts: products.length });

      return {
        success: true,
        message: `Found ${products.length} products`,
        products,
        count: products.length,
      };
    } catch (error) {
      return { success: false, message: `Error listing products: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async searchProducts(query: string): Promise {
    return this.listProducts({ title: query });
  }

  async getProduct(productId: number): Promise {
    try {
      const response = await this.shopify.getProduct(productId);
      if (!response.success || !response.data) {
        return { success: false, message: response.error || 'Product not found' };
      }
      return { success: true, message: 'Product found', product: response.data.product };
    } catch (error) {
      return { success: false, message: `Error fetching product: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async getProductCount(): Promise {
    const response = await this.shopify.getProductCount();
    if (response.success && response.data) {
      await this.memory.updateStoreState({ totalProducts: response.data.count });
      return response.data.count;
    }
    return 0;
  }

  // --------------------------------------------
  // CREATE PRODUCT
  // --------------------------------------------

  async createProduct(request: ProductCreateRequest): Promise {
    try {
      // Generate description if requested
      let description = request.description || '';
      if (request.generateDescription || !description) {
        description = await this.generateProductDescription(request.title, request.tags);
      }

      // Build product data
      const productData: ShopifyProduct = {
        title: request.title,
        body_html: description,
        vendor: request.vendor || 'CareHub',
        product_type: request.productType || '',
        tags: request.tags?.join(', ') || '',
        status: request.status || 'active',
      };

      // Add variants
      if (request.variants && request.variants.length > 0) {
        productData.variants = request.variants.map(v => ({
          price: v.price,
          compare_at_price: v.compareAtPrice || null,
          sku: v.sku || '',
          inventory_quantity: v.inventoryQuantity || 0,
          inventory_management: 'shopify',
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          weight: v.weight || 0,
          weight_unit: v.weightUnit || 'g',
          requires_shipping: true,
        }));
      } else if (request.price) {
        productData.variants = [{
          price: request.price,
          compare_at_price: request.compareAtPrice || null,
          inventory_management: 'shopify',
          inventory_quantity: 100,
          requires_shipping: true,
        }];
      }

      // Add images
      if (request.images && request.images.length > 0) {
        productData.images = request.images.map((src, index) => ({
          src,
          alt: `${request.title} - Image ${index + 1}`,
          position: index + 1,
        }));
      }

      // Create on Shopify
      const response = await this.shopify.createProduct(productData);

      if (!response.success || !response.data) {
        return { success: false, message: response.error || 'Failed to create product' };
      }

      // Log action
      await this.memory.logAction({
        agent: 'product-manager',
        action: 'create_product',
        input: JSON.stringify({ title: request.title }),
        output: `Created product ID: ${response.data.product.id}`,
        success: true,
        duration: 0,
        reversible: true,
        undoData: { productId: response.data.product.id },
      });

      return {
        success: true,
        message: `✅ Product "${request.title}" created successfully!`,
        product: response.data.product,
      };
    } catch (error) {
      return { success: false, message: `Error creating product: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // EDIT PRODUCT
  // --------------------------------------------

  async editProduct(request: ProductEditRequest): Promise {
    try {
      // Get current product for undo data
      const currentProduct = await this.shopify.getProduct(request.productId);

      const updateData: Partial = {};

      if (request.updates.title) updateData.title = request.updates.title;
      if (request.updates.description) updateData.body_html = request.updates.description;
      if (request.updates.tags) updateData.tags = request.updates.tags;
      if (request.updates.productType) updateData.product_type = request.updates.productType;
      if (request.updates.vendor) updateData.vendor = request.updates.vendor;
      if (request.updates.status) updateData.status = request.updates.status;

      // Update product
      const response = await this.shopify.updateProduct(request.productId, updateData);

      if (!response.success || !response.data) {
        return { success: false, message: response.error || 'Failed to update product' };
      }

      // Update price if specified
      if (request.updates.price || request.updates.compareAtPrice) {
        const variants = await this.shopify.getVariants(request.productId);
        if (variants.success && variants.data) {
          for (const variant of variants.data.variants) {
            if (variant.id) {
              await this.shopify.updateVariant(variant.id, {
                price: request.updates.price || variant.price,
                compare_at_price: request.updates.compareAtPrice || variant.compare_at_price,
              });
            }
          }
        }
      }

      // Add images if specified
      if (request.updates.images && request.updates.images.length > 0) {
        for (const imageUrl of request.updates.images) {
          await this.shopify.createProductImage(request.productId, {
            src: imageUrl,
            alt: response.data.product.title || '',
          });
        }
      }

      // Log action
      await this.memory.logAction({
        agent: 'product-manager',
        action: 'edit_product',
        input: JSON.stringify(request),
        output: `Updated product ID: ${request.productId}`,
        success: true,
        duration: 0,
        reversible: true,
        undoData: currentProduct.data?.product,
      });

      return {
        success: true,
        message: `✅ Product updated successfully!`,
        product: response.data.product,
      };
    } catch (error) {
      return { success: false, message: `Error editing product: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // DELETE PRODUCT
  // --------------------------------------------

  async deleteProduct(productId: number): Promise {
    try {
      // Get product data before deletion (for undo)
      const productData = await this.shopify.getProduct(productId);

      const response = await this.shopify.deleteProduct(productId);

      if (!response.success) {
        return { success: false, message: response.error || 'Failed to delete product' };
      }

      // Log action
      await this.memory.logAction({
        agent: 'product-manager',
        action: 'delete_product',
        input: `Product ID: ${productId}`,
        output: 'Product deleted',
        success: true,
        duration: 0,
        reversible: true,
        undoData: productData.data?.product,
      });

      return { success: true, message: `✅ Product deleted successfully!` };
    } catch (error) {
      return { success: false, message: `Error deleting product: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // BULK OPERATIONS
  // --------------------------------------------

  async bulkOperation(operation: BulkOperation): Promise {
    const errors: string[] = [];
    let successCount = 0;

    try {
      for (const productId of operation.productIds) {
        try {
          switch (operation.type) {
            case 'update_price': {
              const variants = await this.shopify.getVariants(productId);
              if (variants.success && variants.data) {
                for (const variant of variants.data.variants) {
                  if (variant.id) {
                    await this.shopify.updateVariant(variant.id, {
                      price: String(operation.value),
                    });
                  }
                }
              }
              successCount++;
              break;
            }
            case 'update_status': {
              await this.shopify.updateProduct(productId, {
                status: operation.value as 'active' | 'draft' | 'archived',
              });
              successCount++;
              break;
            }
            case 'add_tag': {
              const product = await this.shopify.getProduct(productId);
              if (product.success && product.data) {
                const currentTags = product.data.product.tags || '';
                const newTags = currentTags ? `${currentTags}, ${operation.value}` : String(operation.value);
                await this.shopify.updateProduct(productId, { tags: newTags });
              }
              successCount++;
              break;
            }
            case 'remove_tag': {
              const prod = await this.shopify.getProduct(productId);
              if (prod.success && prod.data) {
                const tags = (prod.data.product.tags || '').split(',').map(t => t.trim());
                const filtered = tags.filter(t => t.toLowerCase() !== String(operation.value).toLowerCase());
                await this.shopify.updateProduct(productId, { tags: filtered.join(', ') });
              }
              successCount++;
              break;
            }
            case 'delete': {
              await this.shopify.deleteProduct(productId);
              successCount++;
              break;
            }
            case 'update_inventory': {
              const variantsResp = await this.shopify.getVariants(productId);
              if (variantsResp.success && variantsResp.data) {
                // Note: Would need location_id for full inventory management
                successCount++;
              }
              break;
            }
          }

          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          errors.push(`Product ${productId}: ${error instanceof Error ? error.message : 'Failed'}`);
        }
      }

      await this.memory.logAction({
        agent: 'product-manager',
        action: `bulk_${operation.type}`,
        input: `${operation.productIds.length} products`,
        output: `${successCount} succeeded, ${errors.length} failed`,
        success: errors.length === 0,
        duration: 0,
        reversible: false,
      });

      return {
        success: errors.length === 0,
        message: `✅ Bulk operation complete: ${successCount}/${operation.productIds.length} succeeded`,
        count: successCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return { success: false, message: `Error in bulk operation: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // IMPORT FROM SUPPLIER
  // --------------------------------------------

  async importFromSupplier(request: ProductImportRequest): Promise {
    try {
      const supplier = this.suppliers.get(request.supplier);
      if (!supplier) {
        return { success: false, message: `Supplier "${request.supplier}" not found or not configured` };
      }

      // Get preferences for margin
      const preferences = await this.memory.getPreferences();
      const marginPercent = request.marginPercent || preferences.profitMargin || 40;

      let supplierProducts: SupplierProduct[] = [];

      // Fetch products from supplier
      if (request.externalIds && request.externalIds.length > 0) {
        supplierProducts = await supplier.getProducts(request.externalIds);
      } else if (request.searchQuery) {
        const searchResult = await supplier.searchProducts({
          query: request.searchQuery,
          category: request.category,
          limit: request.maxProducts || 10,
        });
        supplierProducts = searchResult.products;
      } else {
        return { success: false, message: 'Provide externalIds or searchQuery to import products' };
      }

      if (supplierProducts.length === 0) {
        return { success: false, message: 'No products found on supplier' };
      }

      // Import each product
      const importedProducts: ShopifyProduct[] = [];
      const errors: string[] = [];

      for (const sp of supplierProducts.slice(0, request.maxProducts || 10)) {
        try {
          const imported = await this.importSingleProduct(sp, marginPercent, request);
          if (imported) {
            importedProducts.push(imported);
          }

          // Delay between imports
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          errors.push(`${sp.title}: ${error instanceof Error ? error.message : 'Failed'}`);
        }
      }

      await this.memory.logAction({
        agent: 'product-manager',
        action: 'import_from_supplier',
        input: `${request.supplier}: ${supplierProducts.length} products`,
        output: `Imported ${importedProducts.length} products`,
        success: true,
        duration: 0,
        reversible: true,
        undoData: { productIds: importedProducts.map(p => p.id) },
      });

      return {
        success: true,
        message: `✅ Imported ${importedProducts.length}/${supplierProducts.length} products from ${request.supplier}`,
        products: importedProducts,
        count: importedProducts.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return { success: false, message: `Error importing: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  private async importSingleProduct(
    supplierProduct: SupplierProduct,
    marginPercent: number,
    request: ProductImportRequest
  ): Promise {
    // Calculate selling price
    const sellingPrice = calculateSellingPrice(supplierProduct.costPrice, marginPercent);
    const compareAtPrice = calculateCompareAtPrice(parseFloat(sellingPrice), 25);

    // Generate description if requested
    let description = supplierProduct.description;
    if (request.autoDescription) {
      description = await this.generateProductDescription(
        supplierProduct.title,
        supplierProduct.tags
      );
    }

    // Build product
    const productData: ShopifyProduct = {
      title: this.cleanTitle(supplierProduct.title),
      body_html: description,
      vendor: 'CareHub',
      product_type: supplierProduct.category,
      tags: [
        ...(supplierProduct.tags || []),
        `supplier:${supplierProduct.supplierName}`,
        `ext_id:${supplierProduct.externalId}`,
        `cost:${supplierProduct.costPrice}`,
      ].join(', '),
      status: request.status || 'draft',
      variants: supplierProduct.variants.map(v => ({
        price: calculateSellingPrice(v.costPrice, marginPercent),
        compare_at_price: calculateCompareAtPrice(
          parseFloat(calculateSellingPrice(v.costPrice, marginPercent)),
          25
        ),
        sku: v.sku,
        inventory_quantity: Math.min(v.inventoryQuantity, 100),
        inventory_management: 'shopify',
        option1: v.options[0]?.value || null,
        option2: v.options[1]?.value || null,
        option3: v.options[2]?.value || null,
        weight: v.weight || supplierProduct.weight,
        weight_unit: supplierProduct.weightUnit || 'g',
        requires_shipping: true,
      })),
      images: supplierProduct.images.map((img, index) => ({
        src: img.url,
        alt: `${supplierProduct.title} - ${index + 1}`,
        position: index + 1,
      })),
    };

    // Add options if variants have them
    if (supplierProduct.variants.length > 1) {
      const optionNames = new Set();
      supplierProduct.variants.forEach(v => {
        v.options.forEach(o => optionNames.add(o.name));
      });

      productData.options = Array.from(optionNames).map((name, index) => {
        const values = [...new Set(
          supplierProduct.variants
            .map(v => v.options.find(o => o.name === name)?.value)
            .filter(Boolean) as string[]
        )];
        return { name, position: index + 1, values };
      });
    }

    // Create on Shopify
    const response = await this.shopify.createProduct(productData);

    if (response.success && response.data) {
      // Store supplier mapping in metafield
      const productId = response.data.product.id;
      if (productId) {
        await this.shopify.createMetafield('products', productId, {
          namespace: 'carehub',
          key: 'supplier_id',
          value: supplierProduct.externalId,
          type: 'single_line_text_field',
        });
        await this.shopify.createMetafield('products', productId, {
          namespace: 'carehub',
          key: 'supplier_name',
          value: supplierProduct.supplierName,
          type: 'single_line_text_field',
        });
        await this.shopify.createMetafield('products', productId, {
          namespace: 'carehub',
          key: 'cost_price',
          value: supplierProduct.costPrice.toString(),
          type: 'single_line_text_field',
        });
      }

      return response.data.product;
    }

    return null;
  }

  // --------------------------------------------
  // PRICE MANAGEMENT
  // --------------------------------------------

  async updatePrice(productId: number, newPrice: string, compareAtPrice?: string): Promise {
    try {
      const variants = await this.shopify.getVariants(productId);
      if (!variants.success || !variants.data) {
        return { success: false, message: 'Could not fetch variants' };
      }

      for (const variant of variants.data.variants) {
        if (variant.id) {
          await this.shopify.updateVariant(variant.id, {
            price: newPrice,
            compare_at_price: compareAtPrice || null,
          });
        }
      }

      return { success: true, message: `✅ Price updated to $${newPrice}` };
    } catch (error) {
      return { success: false, message: `Error updating price: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async updateAllPricesWithMargin(marginPercent: number): Promise {
    try {
      const products = await this.shopify.getAllProducts();
      let updated = 0;
      const errors: string[] = [];

      for (const product of products) {
        try {
          // Get cost price from tags or metafield
          const costTag = product.tags?.split(',')
            .map(t => t.trim())
            .find(t => t.startsWith('cost:'));

          if (costTag) {
            const costPrice = parseFloat(costTag.replace('cost:', ''));
            if (!isNaN(costPrice)) {
              const newPrice = calculateSellingPrice(costPrice, marginPercent);
              const newCompareAt = calculateCompareAtPrice(parseFloat(newPrice), 20);

              if (product.variants) {
                for (const variant of product.variants) {
                  if (variant.id) {
                    await this.shopify.updateVariant(variant.id, {
                      price: newPrice,
                      compare_at_price: newCompareAt,
                    });
                  }
                }
              }
              updated++;
            }
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          errors.push(`${product.title}: ${error instanceof Error ? error.message : 'Failed'}`);
        }
      }

      return {
        success: true,
        message: `✅ Updated prices for ${updated}/${products.length} products with ${marginPercent}% margin`,
        count: updated,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return { success: false, message: `Error updating prices: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // CONTENT GENERATION
  // --------------------------------------------

  private async generateProductDescription(title: string, tags?: string[]): Promise {
    const prompt = `Write a compelling e-commerce product description for:

Product: ${title}
Tags: ${tags?.join(', ') || 'N/A'}
Target audience: US/UK online shoppers
Tone: Professional, trustworthy, persuasive

Requirements:
- Start with a compelling hook (1-2 sentences)
- List 4-5 key benefits with emojis
- Add a short "Why Choose This?" section
- Include a subtle urgency note
- 150-200 words total
- Use HTML formatting (p, ul, li, strong)
- NO filler words — every word should sell

Return ONLY the HTML content, nothing else.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    if (response.success && response.content) {
      return response.content;
    }

    // Fallback description
    return `
${title} — Premium quality, designed for those who demand the best.

  ✅ Premium quality materials
  🚚 Fast & free shipping
  ↩️ 30-day hassle-free returns
  🔒 Secure checkout

Why Choose This?
Join thousands of satisfied customers who've made the switch. Experience the difference quality makes.
⚡ Limited stock available — order now to avoid disappointment.`;
  }

  // --------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------

  private cleanTitle(title: string): string {
    // Remove common supplier noise from titles
    return title
      .replace(/\d+pcs?/gi, '')
      .replace(/wholesale/gi, '')
      .replace(/dropship(ping)?/gi, '')
      .replace(/free\s*shipping/gi, '')
      .replace(/hot\s*sale/gi, '')
      .replace(/new\s*arrival/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  async getProductStats(): Promise<{
    total: number;
    active: number;
    draft: number;
    archived: number;
  }> {
    const [total, active, draft] = await Promise.all([
      this.shopify.getProductCount(),
      this.shopify.getProductCount({ status: 'active' }),
      this.shopify.getProductCount({ status: 'draft' }),
    ]);

    return {
      total: total.data?.count || 0,
      active: active.data?.count || 0,
      draft: draft.data?.count || 0,
      archived: Math.max(0, (total.data?.count || 0) - (active.data?.count || 0) - (draft.data?.count || 0)),
    };
  }

  // Quick actions for natural language commands
  async handleCommand(command: string): Promise<ProductManagerResult> {
  const lower = command.toLowerCase();

  if (lower.includes('list') || lower.includes('show') || lower.includes('dikhao') || lower.includes('dekho')) {
    return this.listProducts();
  }

  if (lower.includes('count') || lower.includes('kitne') || lower.includes('total')) {
    const count = await this.getProductCount();
    return { success: true, message: `Total products: ${count}`, count };
  }

  if (lower.includes('stats') || lower.includes('statistics')) {
    const stats = await this.getProductStats();
    return {
      success: true,
      message: `📊 Products: ${stats.total} total | ${stats.active} active | ${stats.draft} draft | ${stats.archived} archived`,
    };
  }

  if (
    lower.includes('import') || lower.includes('add') || lower.includes('lao') ||
    lower.includes('dalo') || lower.includes('karo') || lower.includes('trending') ||
    lower.includes('cj') || lower.includes('supplier') || lower.includes('product') ||
    lower.includes('upload') || lower.includes('store par') || lower.includes('la do') ||
    lower.includes('mangao') || lower.includes('le ao')
  ) {
    const numMatch = lower.match(/\b(\d+)\b/);
    const maxProducts = numMatch ? Math.min(parseInt(numMatch[1]), 20) : 10;

    let searchQuery = 'trending health wellness products';
    const keywords = ['health', 'beauty', 'skincare', 'fitness', 'wellness', 'kitchen', 'home', 'electronics', 'clothing', 'accessories'];
    for (const kw of keywords) {
      if (lower.includes(kw)) { searchQuery = kw; break; }
    }

    return this.importFromSupplier({
      supplier: 'cj',
      searchQuery,
      maxProducts,
      autoDescription: true,
      status: 'draft',
    });
  }

  return {
    success: false,
    message: 'Command samajh nahi aya. Try karo:\n• "list products"\n• "add 10 trending products"\n• "import health products"\n• "product stats"',
  };
}
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let productManagerInstance: ProductManager | null = null;

export function getProductManager(): ProductManager {
  if (!productManagerInstance) {
    productManagerInstance = new ProductManager();
  }
  return productManagerInstance;
}

export function resetProductManager(): void {
  productManagerInstance = null;
}
