// ============================================
// CAREHUB AI AGENT — MAIN API ENDPOINT
// ============================================
// This is the main entry point for all agent commands.
// User sends message → Orchestrator processes →
// Correct agent(s) execute → Response returned.
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getOrchestrator } from '@/agents/orchestrator';
import { getMemoryAgent } from '@/agents/memory';
import { getAIRouter } from '@/agents/ai-router';
import { getThemeDesigner } from '@/agents/theme-designer';
import { getHomepageBuilder } from '@/agents/homepage';
import { getProductPageBuilder } from '@/agents/product-page';
import { getLandingPageBuilder } from '@/agents/landing-page';
import { getUpsellBundleBuilder } from '@/agents/upsell-bundle';
import { getProductManager } from '@/agents/product-manager';
import { getOrderFulfillment } from '@/agents/order-fulfillment';
import { getPriceMonitor } from '@/agents/price-monitor';
import { getContentSEO } from '@/agents/content-seo';
import { getCollectionsManager } from '@/agents/collections';

// --------------------------------------------
// TYPES
// --------------------------------------------

interface AgentRequest {
  message: string;
  action?: string;
  params?: Record<string,>;
  sessionId?: string;
}

interface AgentResponse {
  success: boolean;
  response: string;
  agentsUsed: string[];
  actions: Array<{
    agent: string;
    action: string;
    success: boolean;
    result: string;
    duration: number;
  }>;
  suggestedFollowUp?: string[];
  processingTime: number;
  status: {
    aiRouter: ReturnType['getStatus']>;
    memory: Awaited['getStats']>>;
  };
}

// --------------------------------------------
// DIRECT ACTION HANDLERS
// --------------------------------------------

async function handleDirectAction(action: string, params: Record): Promise<{
  success: boolean;
  response: string;
  agent: string;
}> {
  switch (action) {
    // --- Theme ---
    case 'design_theme': {
      const designer = getThemeDesigner();
      const result = await designer.designTheme({
        mood: (params.mood as string) || 'premium',
        specificRequests: params.requests as string[] | undefined,
        event: params.event as string | undefined,
      });
      return { success: result.success, response: result.message, agent: 'theme-designer' };
    }

    case 'modify_theme': {
      const designer = getThemeDesigner();
      const result = await designer.modifyTheme((params.modification as string) || '');
      return { success: result.success, response: result.message, agent: 'theme-designer' };
    }

    case 'event_theme': {
      const designer = getThemeDesigner();
      const result = await designer.applyEventTheme((params.event as string) || '');
      return { success: result.success, response: result.message, agent: 'theme-designer' };
    }

    // --- Homepage ---
    case 'build_homepage': {
      const builder = getHomepageBuilder();
      const result = await builder.buildHomepage({
        mood: params.mood as string | undefined,
        sections: params.sections as string[] | undefined as unknown as undefined,
        heroHeadline: params.headline as string | undefined,
        event: params.event as string | undefined,
      });
      return { success: result.success, response: result.message, agent: 'homepage' };
    }

    // --- Product Page ---
    case 'build_product_page': {
      const builder = getProductPageBuilder();
      const result = await builder.buildProductPage({
        mood: params.mood as string | undefined,
        layoutStyle: params.layout as 'classic' | 'modern' | 'minimal' | 'luxury' | undefined,
      });
      return { success: result.success, response: result.message, agent: 'product-page' };
    }

    // --- Landing Page ---
    case 'build_landing_page': {
      const builder = getLandingPageBuilder();
      const result = await builder.buildLandingPage({
        productTitle: params.product as string | undefined,
        productUrl: params.url as string | undefined,
        productPrice: params.price as string | undefined,
        adPlatform: params.platform as 'facebook' | 'google' | 'tiktok' | undefined,
        mood: params.mood as string | undefined,
      });
      return { success: result.success, response: result.message, agent: 'landing-page' };
    }

    // --- Upsell ---
    case 'build_upsell': {
      const builder = getUpsellBundleBuilder();
      const result = await builder.buildUpsell({
        type: (params.type as string || 'all') as 'all',
        discountPercent: params.discount as number | undefined,
        bundleName: params.name as string | undefined,
      });
      return { success: result.success, response: result.message, agent: 'upsell-bundle' };
    }

    // --- Products ---
    case 'list_products': {
      const manager = getProductManager();
      const result = await manager.listProducts(params as { limit?: number; status?: string });
      return { success: result.success, response: result.message, agent: 'product-manager' };
    }

    case 'create_product': {
      const manager = getProductManager();
      const result = await manager.createProduct({
        title: (params.title as string) || 'New Product',
        description: params.description as string | undefined,
        price: params.price as string | undefined,
        images: params.images as string[] | undefined,
        tags: params.tags as string[] | undefined,
        generateDescription: (params.generateDescription as boolean) !== false,
      });
      return { success: result.success, response: result.message, agent: 'product-manager' };
    }

    case 'import_products': {
      const manager = getProductManager();
      const result = await manager.importFromSupplier({
        supplier: (params.supplier as string) || 'cj_dropshipping',
        searchQuery: params.query as string | undefined,
        maxProducts: (params.limit as number) || 5,
        autoDescription: true,
        autoPrice: true,
      });
      return { success: result.success, response: result.message, agent: 'product-manager' };
    }

    // --- Orders ---
    case 'get_orders': {
      const fulfillment = getOrderFulfillment();
      const result = await fulfillment.getUnfulfilledOrders();
      return { success: result.success, response: result.message, agent: 'order-fulfillment' };
    }

    case 'fulfill_orders': {
      const fulfillment = getOrderFulfillment();
      const result = await fulfillment.fulfillOrder({
        autoFulfill: true,
        supplier: params.supplier as string | undefined,
      });
      return { success: result.success, response: result.message, agent: 'order-fulfillment' };
    }

    case 'order_summary': {
      const fulfillment = getOrderFulfillment();
      const summary = await fulfillment.getOrderSummary();
      return {
        success: true,
        response: `📊 Orders: ${summary.total} total | ${summary.unfulfilled} pending | ${summary.todayOrders} today | $${summary.pendingValue} pending value`,
        agent: 'order-fulfillment',
      };
    }

    // --- Price Monitor ---
    case 'check_prices': {
      const monitor = getPriceMonitor();
      const result = await monitor.runMonitor();
      return { success: result.success, response: result.message, agent: 'price-monitor' };
    }

    case 'update_margin': {
      const monitor = getPriceMonitor();
      const result = await monitor.updateMargin((params.margin as number) || 40);
      return { success: result.success, response: result.message, agent: 'price-monitor' };
    }

    // --- Content & SEO ---
    case 'generate_content': {
      const content = getContentSEO();
      const result = await content.generate({
        type: (params.type as string || 'product_description') as 'product_description',
        product: params.product as string | undefined,
        topic: params.topic as string | undefined,
        keywords: params.keywords as string[] | undefined,
        platform: params.platform as string | undefined,
      });
      return { success: result.success, response: result.content || result.message, agent: 'content-seo' };
    }

    case 'seo_audit': {
      const content = getContentSEO();
      const result = await content.auditProductSEO((params.productId as number) || 0);
      return {
        success: result.success,
        response: `SEO Score: ${result.score}/100\nIssues: ${result.issues.length}\nRecommendations: ${result.recommendations.join(', ')}`,
        agent: 'content-seo',
      };
    }

    // --- Collections ---
    case 'list_collections': {
      const collections = getCollectionsManager();
      const result = await collections.listCollections();
      return { success: result.success, response: result.message, agent: 'collections' };
    }

    case 'create_collection': {
      const collections = getCollectionsManager();
      const result = await collections.createCollection({
        title: (params.title as string) || 'New Collection',
        type: (params.type as 'smart' | 'manual') || 'smart',
        rules: params.rules as CollectionRuleInput[] | undefined,
        generateDescription: true,
      });
      return { success: result.success, response: result.message, agent: 'collections' };
    }

    case 'create_preset_collections': {
      const collections = getCollectionsManager();
      const result = await collections.createPresetCollections();
      return { success: result.success, response: result.message, agent: 'collections' };
    }

    case 'auto_organize': {
      const collections = getCollectionsManager();
      const result = await collections.autoOrganize();
      return { success: result.success, response: result.message, agent: 'collections' };
    }

    // --- System ---
    case 'system_status': {
      const router = getAIRouter();
      const memory = getMemoryAgent();
      const status = router.getStatus();
      const stats = await memory.getStats();
      return {
        success: true,
        response: `🤖 System Status:\n• Groq: ${status.groq.healthy ? '✅' : '❌'} (${status.groq.remainingRequests} remaining)\n• Gemini: ${status.gemini.healthy ? '✅' : '❌'} (${status.gemini.remainingRequests} remaining)\n• Total routed: ${status.totalRequestsRouted}\n• Messages: ${stats.totalMessages}\n• Actions: ${stats.totalActions}\n• Storage: ${stats.storageType}`,
        agent: 'system',
      };
    }

    case 'memory_summary': {
      const memory = getMemoryAgent();
      const summary = await memory.getFullSummary();
      return { success: true, response: summary, agent: 'memory' };
    }

    case 'reset_memory': {
      const memory = getMemoryAgent();
      await memory.reset('conversations');
      return { success: true, response: '✅ Conversation history cleared. Preferences and state preserved.', agent: 'memory' };
    }

    default:
      return { success: false, response: `Unknown action: ${action}`, agent: 'system' };
  }
}

// Import for type
interface CollectionRuleInput {
  column: string;
  relation: string;
  condition: string;
}

// --------------------------------------------
// POST HANDLER — Main Agent Endpoint
// --------------------------------------------

export async function POST(request: NextRequest): Promise> {
  const startTime = Date.now();

  try {
    const body = await request.json() as AgentRequest;

    if (!body.message && !body.action) {
      return NextResponse.json({
        success: false,
        response: 'Please provide a message or action.',
        agentsUsed: [],
        actions: [],
        processingTime: Date.now() - startTime,
        status: {
          aiRouter: getAIRouter().getStatus(),
          memory: await getMemoryAgent().getStats(),
        },
      }, { status: 400 });
    }

    // Direct action mode
    if (body.action) {
      const result = await handleDirectAction(body.action, body.params || {});

      const response: AgentResponse = {
        success: result.success,
        response: result.response,
        agentsUsed: [result.agent],
        actions: [{
          agent: result.agent,
          action: body.action,
          success: result.success,
          result: result.response,
          duration: Date.now() - startTime,
        }],
        processingTime: Date.now() - startTime,
        status: {
          aiRouter: getAIRouter().getStatus(),
          memory: await getMemoryAgent().getStats(),
        },
      };

      return NextResponse.json(response);
    }

    // Natural language mode — Orchestrator handles
    const orchestrator = getOrchestrator();

    // Register agent handlers for direct execution
    registerAgentHandlers(orchestrator);

    const result = await orchestrator.process({
      message: body.message,
      sessionId: body.sessionId,
    });

    const response: AgentResponse = {
      success: result.success,
      response: result.response,
      agentsUsed: result.agentsUsed,
      actions: result.actions,
      suggestedFollowUp: result.suggestedFollowUp,
      processingTime: result.processingTime,
      status: {
        aiRouter: getAIRouter().getStatus(),
        memory: await getMemoryAgent().getStats(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({
      success: false,
      response: `❌ Error: ${errorMsg}`,
      agentsUsed: [],
      actions: [],
      processingTime: Date.now() - startTime,
      status: {
        aiRouter: getAIRouter().getStatus(),
        memory: await getMemoryAgent().getStats(),
      },
    }, { status: 500 });
  }
}

// --------------------------------------------
// GET HANDLER — Health Check & Status
// --------------------------------------------

export async function GET(): Promise {
  try {
    const router = getAIRouter();
    const memory = getMemoryAgent();

    const status = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      agents: {
        total: 13,
        active: [
          'ai-router', 'orchestrator', 'memory',
          'theme-designer', 'homepage', 'product-page',
          'landing-page', 'upsell-bundle', 'product-manager',
          'order-fulfillment', 'price-monitor', 'content-seo',
          'collections',
        ],
      },
      ai: router.getStatus(),
      memory: await memory.getStats(),
      uptime: process.uptime(),
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// --------------------------------------------
// REGISTER AGENT HANDLERS
// --------------------------------------------

function registerAgentHandlers(orchestrator: ReturnType): void {
  // Theme Designer
  orchestrator.registerHandler('theme-designer', async (task) => {
    const designer = getThemeDesigner();
    const startTime = Date.now();

    const mood = (task.parameters.rawMessage as string) || (task.parameters.mood as string) || 'premium';
    const result = await designer.designTheme({ mood });

    return {
      agent: 'theme-designer',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Homepage
  orchestrator.registerHandler('homepage', async (task) => {
    const builder = getHomepageBuilder();
    const startTime = Date.now();

    const result = await builder.buildHomepage({
      mood: (task.parameters.mood as string) || undefined,
      event: (task.parameters.event as string) || undefined,
    });

    return {
      agent: 'homepage',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Product Page
  orchestrator.registerHandler('product-page', async (task) => {
    const builder = getProductPageBuilder();
    const startTime = Date.now();

    const result = await builder.buildProductPage({
      mood: (task.parameters.mood as string) || undefined,
    });

    return {
      agent: 'product-page',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Landing Page
  orchestrator.registerHandler('landing-page', async (task) => {
    const builder = getLandingPageBuilder();
    const startTime = Date.now();

    const result = await builder.buildLandingPage({
      productTitle: (task.parameters.product as string) || undefined,
      mood: (task.parameters.mood as string) || undefined,
    });

    return {
      agent: 'landing-page',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Upsell
  orchestrator.registerHandler('upsell-bundle', async (task) => {
    const builder = getUpsellBundleBuilder();
    const startTime = Date.now();

    const result = await builder.buildUpsell({ type: 'all' });

    return {
      agent: 'upsell-bundle',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Product Manager
  orchestrator.registerHandler('product-manager', async (task) => {
    const manager = getProductManager();
    const startTime = Date.now();

    const result = await manager.handleCommand(
      (task.parameters.rawMessage as string) || task.action
    );

    return {
      agent: 'product-manager',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Order Fulfillment
  orchestrator.registerHandler('order-fulfillment', async (task) => {
    const fulfillment = getOrderFulfillment();
    const startTime = Date.now();

    const result = await fulfillment.handleCommand(
      (task.parameters.rawMessage as string) || task.action
    );

    return {
      agent: 'order-fulfillment',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Price Monitor
  orchestrator.registerHandler('price-monitor', async (task) => {
    const monitor = getPriceMonitor();
    const startTime = Date.now();

    const result = await monitor.handleCommand(
      (task.parameters.rawMessage as string) || task.action
    );

    return {
      agent: 'price-monitor',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });

  // Content & SEO
  orchestrator.registerHandler('content-seo', async (task) => {
    const content = getContentSEO();
    const startTime = Date.now();

    const result = await content.handleCommand(
      (task.parameters.rawMessage as string) || task.action
    );

    return {
      agent: 'content-seo',
      action: task.action,
      success: result.success,
      result: result.content || result.message,
      duration: Date.now() - startTime,
    };
  });

  // Collections
  orchestrator.registerHandler('collections', async (task) => {
    const collections = getCollectionsManager();
    const startTime = Date.now();

    const result = await collections.handleCommand(
      (task.parameters.rawMessage as string) || task.action
    );

    return {
      agent: 'collections',
      action: task.action,
      success: result.success,
      result: result.message,
      duration: Date.now() - startTime,
    };
  });
}
