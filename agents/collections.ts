// ============================================
// CAREHUB AI AGENT — COLLECTIONS (AGENT #13)
// ============================================
// Product collection management:
// - Create smart collections (auto-rules)
// - Create manual collections
// - Collection page design/description
// - Navigation menu management
// - SEO for collection pages
// - Auto-organize products
// - Seasonal/event collections
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { getShopifyClient, ShopifyClient, ShopifyCollection, ShopifyCollectionRule } from '@/lib/shopify';
import { GroqMessage } from '@/lib/groq';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface CollectionCreateRequest {
  title: string;
  type: 'smart' | 'manual';
  description?: string;
  rules?: CollectionRuleInput[];
  productIds?: number[];
  image?: string;
  sortOrder?: string;
  generateDescription?: boolean;
  generateSEO?: boolean;
  published?: boolean;
}

export interface CollectionRuleInput {
  column: 'title' | 'type' | 'vendor' | 'tag' | 'price' | 'compare_at_price' | 'weight' | 'inventory_stock' | 'variant_title';
  relation: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with' | 'contains' | 'not_contains';
  condition: string;
}

export interface CollectionResult {
  success: boolean;
  message: string;
  collection?: ShopifyCollection;
  collections?: ShopifyCollection[];
  count?: number;
}

export interface CollectionSuggestion {
  title: string;
  type: 'smart' | 'manual';
  rules?: CollectionRuleInput[];
  reason: string;
}

export interface NavigationUpdate {
  success: boolean;
  message: string;
  menuItems: Array<{ title: string; url: string }>;
}

// --------------------------------------------
// COLLECTIONS MANAGER CLASS
// --------------------------------------------

export class CollectionsManager {
  private router: AIRouter;
  private memory: MemoryAgent;
  private shopify: ShopifyClient;

  constructor() {
    this.router = getAIRouter();
    this.memory = getMemoryAgent();
    this.shopify = getShopifyClient();
  }

  // --------------------------------------------
  // LIST COLLECTIONS
  // --------------------------------------------

  async listCollections(): Promise<collectionresult> {
    try {
      const [customResp, smartResp] = await Promise.all([
        this.shopify.getCustomCollections({ limit: 50 }),
        this.shopify.getSmartCollections({ limit: 50 }),
      ]);

      const collections: ShopifyCollection[] = [];

      if (customResp.success && customResp.data) {
        collections.push(...customResp.data.custom_collections);
      }
      if (smartResp.success && smartResp.data) {
        collections.push(...smartResp.data.smart_collections);
      }

      await this.memory.updateStoreState({
        activeCollections: collections.map(c => c.title),
      });

      return {
        success: true,
        message: `Found ${collections.length} collections`,
        collections,
        count: collections.length,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // CREATE COLLECTION
  // --------------------------------------------

  async createCollection(request: CollectionCreateRequest): Promise {
    try {
      // Generate description if needed
      let description = request.description || '';
      if (request.generateDescription || !description) {
        description = await this.generateCollectionDescription(request.title);
      }

      const collectionData: ShopifyCollection = {
        title: request.title,
        body_html: description,
        published: request.published !== false,
        sort_order: request.sortOrder || 'best-selling',
      };

      if (request.image) {
        collectionData.image = { src: request.image, alt: request.title };
      }

      let response;

      if (request.type === 'smart') {
        // Smart collection with rules
        const rules: ShopifyCollectionRule[] = (request.rules || []).map(r => ({
          column: r.column,
          relation: r.relation,
          condition: r.condition,
        }));

        if (rules.length === 0) {
          // Default rule: match by title tag
          rules.push({
            column: 'tag',
            relation: 'equals',
            condition: request.title.toLowerCase().replace(/\s+/g, '-'),
          });
        }

        response = await this.shopify.createSmartCollection({
          ...collectionData,
          rules,
          disjunctive: false,
        });

        if (!response.success) {
          return { success: false, message: response.error || 'Failed to create smart collection' };
        }

        return {
          success: true,
          message: `✅ Smart collection "${request.title}" created with ${rules.length} rules!`,
          collection: response.data?.smart_collection,
        };
      } else {
        // Manual collection
        response = await this.shopify.createCustomCollection(collectionData);

        if (!response.success) {
          return { success: false, message: response.error || 'Failed to create collection' };
        }

        const collection = response.data?.custom_collection;

        // Add products if specified
        if (request.productIds && request.productIds.length > 0 && collection?.id) {
          for (const productId of request.productIds) {
            await this.shopify.addProductToCollection(collection.id, productId);
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        }

        return {
          success: true,
          message: `✅ Manual collection "${request.title}" created${request.productIds ? ` with ${request.productIds.length} products` : ''}!`,
          collection,
        };
      }
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // UPDATE COLLECTION
  // --------------------------------------------

  async updateCollection(collectionId: number, updates: Partial): Promise {
    try {
      const updateData: Partial = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.body_html = updates.description;
      if (updates.sortOrder) updateData.sort_order = updates.sortOrder;
      if (updates.image) updateData.image = { src: updates.image, alt: updates.title || '' };
      if (updates.published !== undefined) updateData.published = updates.published;

      // Try as custom collection first
      let response = await this.shopify.updateCustomCollection(collectionId, updateData);

      if (!response.success) {
        // Try as smart collection
        response = await this.shopify.updateSmartCollection(collectionId, updateData);
      }

      if (!response.success) {
        return { success: false, message: response.error || 'Failed to update collection' };
      }

      return {
        success: true,
        message: `✅ Collection updated successfully!`,
        collection: response.data?.custom_collection || response.data?.smart_collection,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // DELETE COLLECTION
  // --------------------------------------------

  async deleteCollection(collectionId: number): Promise {
    try {
      // Try custom first
      let response = await this.shopify.deleteCustomCollection(collectionId);

      if (!response.success) {
        // Try smart
        const smartResp = await this.shopify.getSmartCollections();
        if (smartResp.success && smartResp.data) {
          const found = smartResp.data.smart_collections.find(c => c.id === collectionId);
          if (found) {
            // Use update to delete (Shopify doesn't have a dedicated smart collection delete in our client)
            await this.shopify.updateSmartCollection(collectionId, { published: false });
            return { success: true, message: `✅ Collection unpublished (archived)` };
          }
        }
        return { success: false, message: 'Collection not found' };
      }

      return { success: true, message: `✅ Collection deleted successfully!` };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // ADD/REMOVE PRODUCTS FROM COLLECTION
  // --------------------------------------------

  async addProductsToCollection(collectionId: number, productIds: number[]): Promise {
    try {
      let added = 0;
      for (const productId of productIds) {
        const response = await this.shopify.addProductToCollection(collectionId, productId);
        if (response.success) added++;
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      return {
        success: added > 0,
        message: `✅ Added ${added}/${productIds.length} products to collection`,
        count: added,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // SMART COLLECTION PRESETS
  // --------------------------------------------

  async createPresetCollections(): Promise {
    const presets: CollectionCreateRequest[] = [
      {
        title: 'New Arrivals',
        type: 'smart',
        rules: [{ column: 'tag', relation: 'equals', condition: 'new-arrival' }],
        sortOrder: 'created-desc',
        generateDescription: true,
      },
      {
        title: 'Best Sellers',
        type: 'smart',
        rules: [{ column: 'tag', relation: 'equals', condition: 'best-seller' }],
        sortOrder: 'best-selling',
        generateDescription: true,
      },
      {
        title: 'On Sale',
        type: 'smart',
        rules: [{ column: 'compare_at_price', relation: 'greater_than', condition: '0' }],
        sortOrder: 'best-selling',
        generateDescription: true,
      },
      {
        title: 'Under $25',
        type: 'smart',
        rules: [{ column: 'price', relation: 'less_than', condition: '25' }],
        sortOrder: 'price-ascending',
        generateDescription: true,
      },
      {
        title: 'Premium Collection',
        type: 'smart',
        rules: [{ column: 'price', relation: 'greater_than', condition: '50' }],
        sortOrder: 'price-descending',
        generateDescription: true,
      },
    ];

    const created: ShopifyCollection[] = [];
    const errors: string[] = [];

    for (const preset of presets) {
      const result = await this.createCollection(preset);
      if (result.success && result.collection) {
        created.push(result.collection);
      } else {
        errors.push(`${preset.title}: ${result.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await this.memory.logAction({
      agent: 'collections',
      action: 'create_preset_collections',
      input: `${presets.length} preset collections`,
      output: `Created ${created.length} collections`,
      success: created.length > 0,
      duration: 0,
      reversible: true,
      undoData: { collectionIds: created.map(c => c.id) },
    });

    return {
      success: created.length > 0,
      message: `✅ Created ${created.length}/${presets.length} preset collections${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
      collections: created,
      count: created.length,
    };
  }

  // --------------------------------------------
  // SEASONAL / EVENT COLLECTIONS
  // --------------------------------------------

  async createSeasonalCollection(event: string): Promise {
    const eventConfig: Record = {
      'valentine': { title: "Valentine's Day Gifts", tag: 'valentines', sortOrder: 'best-selling' },
      'christmas': { title: 'Christmas Gift Guide', tag: 'christmas', sortOrder: 'price-ascending' },
      'black friday': { title: 'Black Friday Deals', tag: 'black-friday', sortOrder: 'price-ascending' },
      'summer': { title: 'Summer Essentials', tag: 'summer', sortOrder: 'best-selling' },
      'mothers day': { title: "Mother's Day Gifts", tag: 'mothers-day', sortOrder: 'price-ascending' },
      'fathers day': { title: "Father's Day Gifts", tag: 'fathers-day', sortOrder: 'price-ascending' },
      'halloween': { title: 'Halloween Specials', tag: 'halloween', sortOrder: 'best-selling' },
      'new year': { title: 'New Year New You', tag: 'new-year', sortOrder: 'best-selling' },
      'back to school': { title: 'Back to School', tag: 'school', sortOrder: 'price-ascending' },
      'winter': { title: 'Winter Collection', tag: 'winter', sortOrder: 'best-selling' },
    };

    const lowerEvent = event.toLowerCase();
    let config = eventConfig[lowerEvent];

    if (!config) {
      // Try partial match
      for (const [key, value] of Object.entries(eventConfig)) {
        if (lowerEvent.includes(key)) {
          config = value;
          break;
        }
      }
    }

    if (!config) {
      config = {
        title: `${event} Collection`,
        tag: event.toLowerCase().replace(/\s+/g, '-'),
        sortOrder: 'best-selling',
      };
    }

    return this.createCollection({
      title: config.title,
      type: 'smart',
      rules: [{ column: 'tag', relation: 'equals', condition: config.tag }],
      sortOrder: config.sortOrder,
      generateDescription: true,
    });
  }

  // --------------------------------------------
  // AI SUGGESTIONS
  // --------------------------------------------

  async suggestCollections(): Promise {
    try {
      // Get current products to analyze
      const productsResp = await this.shopify.getProducts({ limit: 50 });
      if (!productsResp.success || !productsResp.data) {
        return this.getDefaultSuggestions();
      }

      const products = productsResp.data.products;

      // Analyze product data
      const types = new Set();
      const vendors = new Set();
      const priceRanges = { under25: 0, under50: 0, over50: 0, over100: 0 };
      const allTags = new Set();

      for (const product of products) {
        if (product.product_type) types.add(product.product_type);
        if (product.vendor) vendors.add(product.vendor);
        if (product.tags) {
          product.tags.split(',').map(t => t.trim()).forEach(t => allTags.add(t));
        }
        const price = parseFloat(product.variants?.[0]?.price || '0');
        if (price < 25) priceRanges.under25++;
        else if (price < 50) priceRanges.under50++;
        else if (price < 100) priceRanges.over50++;
        else priceRanges.over100++;
      }

      const suggestions: CollectionSuggestion[] = [];

      // Suggest by product type
      for (const type of types) {
        if (type && products.filter(p => p.product_type === type).length >= 3) {
          suggestions.push({
            title: type,
            type: 'smart',
            rules: [{ column: 'type', relation: 'equals', condition: type }],
            reason: `You have ${products.filter(p => p.product_type === type).length} products of type "${type}"`,
          });
        }
      }

      // Suggest by price range
      if (priceRanges.under25 >= 3) {
        suggestions.push({
          title: 'Budget Finds — Under $25',
          type: 'smart',
          rules: [{ column: 'price', relation: 'less_than', condition: '25' }],
          reason: `${priceRanges.under25} products under $25`,
        });
      }

      if (priceRanges.over100 >= 3) {
        suggestions.push({
          title: 'Premium Collection',
          type: 'smart',
          rules: [{ column: 'price', relation: 'greater_than', condition: '100' }],
          reason: `${priceRanges.over100} premium products over $100`,
        });
      }

      // Always suggest these
      suggestions.push({
        title: 'On Sale',
        type: 'smart',
        rules: [{ column: 'compare_at_price', relation: 'greater_than', condition: '0' }],
        reason: 'Showcase discounted products to drive conversions',
      });

      suggestions.push({
        title: 'New Arrivals',
        type: 'smart',
        rules: [{ column: 'tag', relation: 'equals', condition: 'new-arrival' }],
        reason: 'Keep your store fresh — highlight latest additions',
      });

      return suggestions.slice(0, 8);
    } catch {
      return this.getDefaultSuggestions();
    }
  }

  private getDefaultSuggestions(): CollectionSuggestion[] {
    return [
      { title: 'New Arrivals', type: 'smart', rules: [{ column: 'tag', relation: 'equals', condition: 'new-arrival' }], reason: 'Showcase latest products' },
      { title: 'Best Sellers', type: 'smart', rules: [{ column: 'tag', relation: 'equals', condition: 'best-seller' }], reason: 'Social proof — what others buy' },
      { title: 'On Sale', type: 'smart', rules: [{ column: 'compare_at_price', relation: 'greater_than', condition: '0' }], reason: 'Bargain hunters love this' },
      { title: 'Under $25', type: 'smart', rules: [{ column: 'price', relation: 'less_than', condition: '25' }], reason: 'Low barrier to first purchase' },
      { title: 'Gift Ideas', type: 'smart', rules: [{ column: 'tag', relation: 'equals', condition: 'gift' }], reason: 'Capture gift-buying audience' },
    ];
  }

  // --------------------------------------------
  // DESCRIPTION GENERATION
  // --------------------------------------------

  private async generateCollectionDescription(title: string): Promise {
    const prompt = `Write a collection page description for: "${title}"

Rules:
- 80-120 words
- SEO-optimized
- Compelling opening sentence
- Mention variety and quality
- Include value proposition
- Subtle CTA at end
- HTML format: , 
- Target: US/UK shoppers
- Tone: Professional, trustworthy

Return ONLY the HTML content.`;

    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await this.router.useGroq(messages, 'content_writing');

    if (response.success) {
      return response.content;
    }

    return `Explore our curated ${title} collection. Hand-picked for quality and value, each item is designed to exceed your expectations. Shop with confidence — free shipping and 30-day returns on every order.`;
  }

  // --------------------------------------------
  // SEO FOR COLLECTIONS
  // --------------------------------------------

  async optimizeCollectionSEO(collectionId: number): Promise {
    try {
      // Get collection
      const collections = await this.listCollections();
      const collection = collections.collections?.find(c => c.id === collectionId);

      if (!collection) {
        return { success: false, message: 'Collection not found' };
      }

      // Generate optimized description if missing or short
      let updated = false;
      const updates: Partial = {};

      if (!collection.body_html || collection.body_html.length < 100) {
        updates.body_html = await this.generateCollectionDescription(collection.title);
        updated = true;
      }

      // Generate handle if not optimal
      if (collection.handle) {
        const optimalHandle = collection.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        if (optimalHandle !== collection.handle && optimalHandle.length > 3) {
          updates.handle = optimalHandle;
          updated = true;
        }
      }

      if (updated) {
        await this.updateCollection(collectionId, { description: updates.body_html });
      }

      return {
        success: true,
        message: updated
          ? `✅ Collection "${collection.title}" SEO optimized!`
          : `✅ Collection "${collection.title}" SEO already good!`,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  async optimizeAllCollectionsSEO(): Promise {
    const collections = await this.listCollections();
    if (!collections.success || !collections.collections) {
      return { success: false, message: 'Could not fetch collections' };
    }

    let optimized = 0;
    for (const collection of collections.collections) {
      if (collection.id) {
        const result = await this.optimizeCollectionSEO(collection.id);
        if (result.success) optimized++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return {
      success: true,
      message: `✅ Optimized SEO for ${optimized}/${collections.collections.length} collections`,
      count: optimized,
    };
  }

  // --------------------------------------------
  // AUTO-ORGANIZE
  // --------------------------------------------

  async autoOrganize(): Promise {
    try {
      // Get suggestions
      const suggestions = await this.suggestCollections();

      // Create suggested collections that don't exist yet
      const existing = await this.listCollections();
      const existingTitles = (existing.collections || []).map(c => c.title.toLowerCase());

      const newSuggestions = suggestions.filter(
        s => !existingTitles.includes(s.title.toLowerCase())
      );

      if (newSuggestions.length === 0) {
        return { success: true, message: '✅ Store already well-organized! No new collections needed.' };
      }

      let created = 0;
      for (const suggestion of newSuggestions.slice(0, 5)) {
        const result = await this.createCollection({
          title: suggestion.title,
          type: suggestion.type,
          rules: suggestion.rules,
          generateDescription: true,
        });
        if (result.success) created++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await this.memory.logAction({
        agent: 'collections',
        action: 'auto_organize',
        input: `${newSuggestions.length} suggestions`,
        output: `Created ${created} collections`,
        success: true,
        duration: 0,
        reversible: true,
      });

      return {
        success: true,
        message: `✅ Auto-organized: Created ${created} new collections based on your products!`,
        count: created,
      };
    } catch (error) {
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }

  // --------------------------------------------
  // NAVIGATION
  // --------------------------------------------

  async getNavigationSuggestion(): Promise {
    const collections = await this.listCollections();
    if (!collections.success || !collections.collections) {
      return { success: false, message: 'Could not fetch collections', menuItems: [] };
    }

    // Suggest top collections for navigation
    const topCollections = collections.collections
      .filter(c => c.published !== false)
      .slice(0, 6);

    const menuItems = [
      { title: 'Home', url: '/' },
      ...topCollections.map(c => ({
        title: c.title,
        url: `/collections/${c.handle || c.title.toLowerCase().replace(/\s+/g, '-')}`,
      })),
      { title: 'Contact', url: '/pages/contact' },
    ];

    return {
      success: true,
      message: `Suggested navigation with ${menuItems.length} items`,
      menuItems,
    };
  }

  // --------------------------------------------
  // QUICK COMMAND HANDLER
  // --------------------------------------------

  async handleCommand(command: string): Promise {
    const lower = command.toLowerCase();

    if (lower.includes('list') || lower.includes('show') || lower.includes('dikhao')) {
      return this.listCollections();
    }

    if (lower.includes('preset') || lower.includes('default') || lower.includes('basic')) {
      return this.createPresetCollections();
    }

    if (lower.includes('organize') || lower.includes('auto')) {
      return this.autoOrganize();
    }

    if (lower.includes('suggest') || lower.includes('recommend')) {
      const suggestions = await this.suggestCollections();
      const formatted = suggestions.map(s => `• ${s.title} (${s.type}) — ${s.reason}`).join('\n');
      return { success: true, message: `📋 Suggested Collections:\n${formatted}` };
    }

    if (lower.includes('seo') || lower.includes('optimize')) {
      return this.optimizeAllCollectionsSEO();
    }

    if (lower.includes('seasonal') || lower.includes('event')) {
      const eventMatch = command.match(/(?:for|event|seasonal)\s+"?([^"]+)"?/i);
      const event = eventMatch?.[1] || 'summer';
      return this.createSeasonalCollection(event);
    }

    // Create collection from command
    if (lower.includes('create') || lower.includes('banao') || lower.includes('new')) {
      const titleMatch = command.match(/(?:create|banao|new)\s+(?:collection\s+)?["']?([^"']+)["']?/i);
      const title = titleMatch?.[1] || 'New Collection';

      return this.createCollection({
        title: title.trim(),
        type: 'smart',
        rules: [{ column: 'tag', relation: 'equals', condition: title.trim().toLowerCase().replace(/\s+/g, '-') }],
        generateDescription: true,
      });
    }

    return { success: false, message: 'Try: list collections, create presets, auto organize, suggest collections, optimize SEO, create "Collection Name"' };
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let collectionsInstance: CollectionsManager | null = null;

export function getCollectionsManager(): CollectionsManager {
  if (!collectionsInstance) {
    collectionsInstance = new CollectionsManager();
  }
  return collectionsInstance;
}

export function resetCollectionsManager(): void {
  collectionsInstance = null;
}
