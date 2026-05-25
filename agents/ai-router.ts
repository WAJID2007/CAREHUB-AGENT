// ============================================
// CAREHUB AI AGENT — AI ROUTER (AGENT #1)
// ============================================
// The brain traffic controller. Every task goes
// through this router to decide:
// - Should Groq handle it? (code, API, math, speed)
// - Should Gemini handle it? (design, Urdu, creative)
// - Automatic fallback if one AI is down.
// ============================================

import { GroqClient, getGroqClient, GroqTaskType, GroqMessage, GroqResponse } from '@/lib/groq';
import { GeminiClient, getGeminiClient, GeminiTaskType, GeminiMessage, GeminiResponse } from '@/lib/gemini';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface RouterTask {
  id: string;
  message: string;
  context?: string;
  taskType?: string;
  preferredAI?: 'groq' | 'gemini' | 'auto';
  requireJSON?: boolean;
  maxTokens?: number;
  temperature?: number;
  priority?: 'speed' | 'quality' | 'balanced';
}

export interface RouterResponse {
  success: boolean;
  content: string;
  aiUsed: 'groq' | 'gemini';
  taskType: string;
  latencyMs: number;
  fallbackUsed: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  reasoning?: string;
}

export interface RouterStatus {
  groq: {
    available: boolean;
    healthy: boolean;
    remainingRequests: number;
    lastError: string | null;
  };
  gemini: {
    available: boolean;
    healthy: boolean;
    remainingRequests: number;
    lastError: string | null;
  };
  preferredAI: 'groq' | 'gemini';
  totalRequestsRouted: number;
  groqRequests: number;
  geminiRequests: number;
  fallbackCount: number;
}

type AIDecision = {
  ai: 'groq' | 'gemini';
  groqTaskType: GroqTaskType;
  geminiTaskType: GeminiTaskType;
  reason: string;
  confidence: number;
};

// --------------------------------------------
// ROUTING RULES
// --------------------------------------------

interface RoutingRule {
  patterns: RegExp[];
  keywords: string[];
  ai: 'groq' | 'gemini';
  groqTask: GroqTaskType;
  geminiTask: GeminiTaskType;
  reason: string;
  priority: number;
}

const ROUTING_RULES: RoutingRule[] = [
  // === GEMINI PRIORITY TASKS ===
  {
    patterns: [
      /urdu/i, /roman\s*urdu/i, /samajh/i, /samjh/i,
      /karo$/i, /banao$/i, /lagao$/i, /hatao$/i, /dikhao$/i,
      /chahiye/i, /chahte/i, /karna/i, /wala/i, /wali/i,
      /mujhe/i, /mera/i, /humara/i, /apna/i,
      /acha/i, /achi/i, /behtareen/i, /zabardast/i,
      /kaise/i, /kyun/i, /kab/i, /kahan/i,
    ],
    keywords: ['karo', 'banao', 'lagao', 'hatao', 'dikhao', 'chahiye', 'karna', 'mujhe', 'mera', 'bhai', 'yaar'],
    ai: 'gemini',
    groqTask: 'general',
    geminiTask: 'urdu_understanding',
    reason: 'Roman Urdu/mixed language detected — Gemini excels at language understanding',
    priority: 10,
  },
  {
    patterns: [
      /design/i, /theme/i, /color/i, /colour/i, /font/i,
      /layout/i, /style/i, /aesthetic/i, /visual/i,
      /beautiful/i, /attractive/i, /premium/i, /luxury/i,
      /modern/i, /clean/i, /minimal/i, /dark/i, /light/i,
      /gradient/i, /animation/i, /hover/i,
    ],
    keywords: ['design', 'theme', 'color', 'font', 'layout', 'style', 'premium', 'luxury', 'attractive', 'beautiful', 'modern'],
    ai: 'gemini',
    groqTask: 'general',
    geminiTask: 'design_decision',
    reason: 'Design/visual decision — Gemini has superior creative and aesthetic judgment',
    priority: 9,
  },
  {
    patterns: [
      /mood/i, /feel/i, /vibe/i, /look/i, /appearance/i,
      /impression/i, /experience/i, /atmosphere/i,
    ],
    keywords: ['mood', 'feel', 'vibe', 'look', 'impression', 'atmosphere'],
    ai: 'gemini',
    groqTask: 'general',
    geminiTask: 'mood_interpretation',
    reason: 'Mood/vibe interpretation — Gemini translates abstract feelings to design specs',
    priority: 9,
  },
  {
    patterns: [
      /image/i, /photo/i, /picture/i, /graphic/i, /banner/i,
      /logo/i, /icon/i, /illustration/i, /visual\s*content/i,
    ],
    keywords: ['image', 'photo', 'picture', 'graphic', 'banner', 'logo', 'icon'],
    ai: 'gemini',
    groqTask: 'general',
    geminiTask: 'image_prompt',
    reason: 'Image/graphic generation — Gemini creates detailed visual prompts',
    priority: 8,
  },
  {
    patterns: [
      /think/i, /analyze/i, /strategy/i, /plan/i, /decide/i,
      /recommend/i, /suggest/i, /best\s*approach/i, /pros?\s*and\s*cons?/i,
      /complex/i, /difficult/i, /challenging/i,
    ],
    keywords: ['think', 'analyze', 'strategy', 'plan', 'decide', 'recommend', 'complex'],
    ai: 'gemini',
    groqTask: 'general',
    geminiTask: 'complex_reasoning',
    reason: 'Complex reasoning/analysis — Gemini has deeper thinking capabilities',
    priority: 7,
  },

  // === GROQ PRIORITY TASKS ===
  {
    patterns: [
      /code/i, /function/i, /class/i, /import/i, /export/i,
      /typescript/i, /javascript/i, /css/i, /html/i, /liquid/i,
      /component/i, /api/i, /endpoint/i, /route/i,
      /bug/i, /fix/i, /error/i, /debug/i,
    ],
    keywords: ['code', 'function', 'class', 'typescript', 'javascript', 'css', 'liquid', 'api', 'bug', 'fix'],
    ai: 'groq',
    groqTask: 'code_generation',
    geminiTask: 'fallback_code',
    reason: 'Code generation — Groq Llama excels at structured code output',
    priority: 10,
  },
  {
    patterns: [
      /shopify/i, /product/i, /order/i, /collection/i,
      /variant/i, /inventory/i, /fulfil/i, /fulfill/i,
      /admin\s*api/i, /webhook/i, /metafield/i,
    ],
    keywords: ['shopify', 'product', 'order', 'collection', 'variant', 'inventory', 'fulfill', 'webhook'],
    ai: 'groq',
    groqTask: 'shopify_api',
    geminiTask: 'general',
    reason: 'Shopify API operations — Groq is faster and more structured',
    priority: 9,
  },
  {
    patterns: [
      /price/i, /cost/i, /margin/i, /profit/i, /discount/i,
      /calculate/i, /percentage/i, /markup/i, /revenue/i,
      /\$\d+/i, /\d+%/i, /\d+\.\d+/i,
    ],
    keywords: ['price', 'cost', 'margin', 'profit', 'discount', 'calculate', 'markup', 'revenue'],
    ai: 'groq',
    groqTask: 'price_calculation',
    geminiTask: 'general',
    reason: 'Price/math calculations — Groq provides precise numerical output',
    priority: 9,
  },
  {
    patterns: [
      /json/i, /structured/i, /format/i, /parse/i, /convert/i,
      /extract/i, /transform/i, /data/i, /schema/i,
    ],
    keywords: ['json', 'structured', 'format', 'parse', 'extract', 'data', 'schema'],
    ai: 'groq',
    groqTask: 'structured_output',
    geminiTask: 'general',
    reason: 'Structured data output — Groq produces clean JSON consistently',
    priority: 8,
  },
  {
    patterns: [
      /quick/i, /fast/i, /immediately/i, /now/i, /asap/i,
      /urgent/i, /hurry/i, /jaldi/i, /abhi/i,
    ],
    keywords: ['quick', 'fast', 'immediately', 'now', 'urgent', 'jaldi', 'abhi'],
    ai: 'groq',
    groqTask: 'quick_response',
    geminiTask: 'general',
    reason: 'Speed priority — Groq has lower latency',
    priority: 8,
  },
  {
    patterns: [
      /description/i, /write/i, /copy/i, /content/i,
      /headline/i, /title/i, /caption/i, /blog/i,
      /seo/i, /meta/i, /ad\s*copy/i,
    ],
    keywords: ['description', 'write', 'copy', 'content', 'headline', 'blog', 'seo', 'meta', 'caption'],
    ai: 'groq',
    groqTask: 'content_writing',
    geminiTask: 'creative_writing',
    reason: 'Content writing — Groq is fast; fallback to Gemini for more creative needs',
    priority: 6,
  },
];

// --------------------------------------------
// AI ROUTER CLASS
// --------------------------------------------

export class AIRouter {
  private groq: GroqClient;
  private gemini: GeminiClient;
  private totalRequests: number = 0;
  private groqRequests: number = 0;
  private geminiRequests: number = 0;
  private fallbackCount: number = 0;

  constructor() {
    this.groq = getGroqClient();
    this.gemini = getGeminiClient();
  }

  // --------------------------------------------
  // MAIN ROUTING METHOD
  // --------------------------------------------

  async route(task: RouterTask): Promise<routerresponse> {
    const startTime = Date.now();
    this.totalRequests++;

    // Determine which AI should handle this
    const decision = this.decideAI(task);

    // Try primary AI
    let response = await this.executeWithAI(task, decision);

    // If primary fails, try fallback
    if (!response.success) {
      this.fallbackCount++;
      const fallbackAI = decision.ai === 'groq' ? 'gemini' : 'groq';
      console.log(`[Router] Primary (${decision.ai}) failed — falling back to ${fallbackAI}`);

      const fallbackDecision: AIDecision = {
        ...decision,
        ai: fallbackAI,
      };

      response = await this.executeWithAI(task, fallbackDecision);
      response.fallbackUsed = true;
      response.reasoning = `Fallback: ${decision.ai} failed (${decision.reason}) → switched to ${fallbackAI}`;
    }

    response.latencyMs = Date.now() - startTime;
    return response;
  }

  // --------------------------------------------
  // AI DECISION ENGINE
  // --------------------------------------------

  private decideAI(task: RouterTask): AIDecision {
    // If user explicitly specified AI preference
    if (task.preferredAI && task.preferredAI !== 'auto') {
      return {
        ai: task.preferredAI,
        groqTaskType: this.getGroqTaskType(task.message),
        geminiTaskType: this.getGeminiTaskType(task.message),
        reason: `User preference: ${task.preferredAI}`,
        confidence: 1.0,
      };
    }

    // Check health — if one AI is down, use the other
    const groqHealthy = this.groq.isHealthy();
    const geminiHealthy = this.gemini.isHealthy();

    if (!groqHealthy && geminiHealthy) {
      return {
        ai: 'gemini',
        groqTaskType: 'general',
        geminiTaskType: this.getGeminiTaskType(task.message),
        reason: 'Groq unavailable — using Gemini',
        confidence: 0.9,
      };
    }

    if (!geminiHealthy && groqHealthy) {
      return {
        ai: 'groq',
        groqTaskType: this.getGroqTaskType(task.message),
        geminiTaskType: 'general',
        reason: 'Gemini unavailable — using Groq',
        confidence: 0.9,
      };
    }

    if (!groqHealthy && !geminiHealthy) {
      // Both down — try Groq (it auto-recovers faster)
      return {
        ai: 'groq',
        groqTaskType: 'general',
        geminiTaskType: 'general',
        reason: 'Both AIs unhealthy — trying Groq (faster recovery)',
        confidence: 0.3,
      };
    }

    // Speed priority — always Groq
    if (task.priority === 'speed') {
      return {
        ai: 'groq',
        groqTaskType: this.getGroqTaskType(task.message),
        geminiTaskType: 'general',
        reason: 'Speed priority requested — Groq has lower latency',
        confidence: 0.95,
      };
    }

    // Quality priority — always Gemini
    if (task.priority === 'quality') {
      return {
        ai: 'gemini',
        groqTaskType: 'general',
        geminiTaskType: this.getGeminiTaskType(task.message),
        reason: 'Quality priority requested — Gemini has deeper reasoning',
        confidence: 0.95,
      };
    }

    // Pattern-based routing
    const matchedRules = this.matchRules(task.message);

    if (matchedRules.length > 0) {
      // Sort by priority (highest first)
      matchedRules.sort((a, b) => b.priority - a.priority);
      const bestRule = matchedRules[0];

      return {
        ai: bestRule.ai,
        groqTaskType: bestRule.groqTask,
        geminiTaskType: bestRule.geminiTask,
        reason: bestRule.reason,
        confidence: Math.min(0.95, 0.5 + (matchedRules.length * 0.1)),
      };
    }

    // Context-based decision
    if (task.context) {
      const contextDecision = this.decideFromContext(task.context);
      if (contextDecision) return contextDecision;
    }

    // Default: Groq for speed (most common use case)
    return {
      ai: 'groq',
      groqTaskType: 'general',
      geminiTaskType: 'general',
      reason: 'Default routing — Groq for balanced speed/quality',
      confidence: 0.6,
    };
  }

  // --------------------------------------------
  // RULE MATCHING
  // --------------------------------------------

  private matchRules(message: string): RoutingRule[] {
    const lowerMessage = message.toLowerCase();
    const matched: RoutingRule[] = [];

    for (const rule of ROUTING_RULES) {
      let score = 0;

      // Check patterns (regex)
      for (const pattern of rule.patterns) {
        if (pattern.test(message)) {
          score += 2;
        }
      }

      // Check keywords
      for (const keyword of rule.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      // If any match found, add to results
      if (score > 0) {
        matched.push({ ...rule, priority: rule.priority + score });
      }
    }

    return matched;
  }

  // --------------------------------------------
  // CONTEXT-BASED DECISION
  // --------------------------------------------

  private decideFromContext(context: string): AIDecision | null {
    const lowerContext = context.toLowerCase();

    if (lowerContext.includes('theme') || lowerContext.includes('design') || lowerContext.includes('style')) {
      return {
        ai: 'gemini',
        groqTaskType: 'general',
        geminiTaskType: 'design_decision',
        reason: 'Context indicates design work — Gemini preferred',
        confidence: 0.8,
      };
    }

    if (lowerContext.includes('product') || lowerContext.includes('order') || lowerContext.includes('price')) {
      return {
        ai: 'groq',
        groqTaskType: 'shopify_api',
        geminiTaskType: 'general',
        reason: 'Context indicates Shopify operations — Groq preferred',
        confidence: 0.8,
      };
    }

    return null;
  }

  // --------------------------------------------
  // TASK TYPE DETECTION
  // --------------------------------------------

  private getGroqTaskType(message: string): GroqTaskType {
    const lower = message.toLowerCase();

    if (/code|function|class|import|export|typescript|javascript|css|liquid/.test(lower)) return 'code_generation';
    if (/shopify|product|order|collection|variant|fulfil/.test(lower)) return 'shopify_api';
    if (/price|cost|margin|profit|calculate|discount/.test(lower)) return 'price_calculation';
    if (/json|structured|format|parse|schema/.test(lower)) return 'structured_output';
    if (/quick|fast|immediately|now|urgent/.test(lower)) return 'quick_response';
    if (/write|description|copy|content|blog|seo/.test(lower)) return 'content_writing';
    if (/analyze|data|metrics|performance|stats/.test(lower)) return 'data_analysis';

    return 'general';
  }

  private getGeminiTaskType(message: string): GeminiTaskType {
    const lower = message.toLowerCase();

    // Check for Urdu first
    if (/karo|banao|lagao|hatao|dikhao|chahiye|karna|mujhe|mera|bhai|yaar/.test(lower)) return 'urdu_understanding';
    if (/design|theme|color|font|layout|style|css/.test(lower)) return 'design_decision';
    if (/mood|feel|vibe|look|premium|luxury|modern|attractive/.test(lower)) return 'mood_interpretation';
    if (/image|photo|picture|graphic|banner|logo/.test(lower)) return 'image_prompt';
    if (/think|analyze|strategy|plan|complex|reason/.test(lower)) return 'complex_reasoning';
    if (/write|creative|story|copy|compelling/.test(lower)) return 'creative_writing';
    if (/theme|css|generate.*theme|store.*design/.test(lower)) return 'theme_generation';
    if (/code|function|class/.test(lower)) return 'fallback_code';

    return 'general';
  }

  // --------------------------------------------
  // EXECUTION
  // --------------------------------------------

  private async executeWithAI(task: RouterTask, decision: AIDecision): Promise {
    if (decision.ai === 'groq') {
      return this.executeGroq(task, decision);
    } else {
      return this.executeGemini(task, decision);
    }
  }

  private async executeGroq(task: RouterTask, decision: AIDecision): Promise {
    const messages: GroqMessage[] = [];

    if (task.context) {
      messages.push({ role: 'user', content: `Context: ${task.context}` });
      messages.push({ role: 'assistant', content: 'Understood. I have the context.' });
    }

    messages.push({ role: 'user', content: task.message });

    const response = await this.groq.chat(messages, decision.groqTaskType, {
      maxTokens: task.maxTokens,
      temperature: task.temperature,
    });

    this.groqRequests++;

    return {
      success: response.success,
      content: response.content,
      aiUsed: 'groq',
      taskType: decision.groqTaskType,
      latencyMs: response.latencyMs || 0,
      fallbackUsed: false,
      usage: response.usage,
      error: response.error,
      reasoning: decision.reason,
    };
  }

  private async executeGemini(task: RouterTask, decision: AIDecision): Promise {
    const messages: GeminiMessage[] = [];

    if (task.context) {
      messages.push({ role: 'user', content: `Context: ${task.context}` });
      messages.push({ role: 'model', content: 'Understood. I have the context.' });
    }

    messages.push({ role: 'user', content: task.message });

    const response = await this.gemini.chat(messages, decision.geminiTaskType, {
      maxTokens: task.maxTokens,
      temperature: task.temperature,
    });

    this.geminiRequests++;

    return {
      success: response.success,
      content: response.content,
      aiUsed: 'gemini',
      taskType: decision.geminiTaskType,
      latencyMs: response.latencyMs || 0,
      fallbackUsed: false,
      usage: response.usage,
      error: response.error,
      reasoning: decision.reason,
    };
  }

  // --------------------------------------------
  // DIRECT ACCESS (bypass routing)
  // --------------------------------------------

  async useGroq(messages: GroqMessage[], taskType: GroqTaskType = 'general'): Promise {
    this.groqRequests++;
    this.totalRequests++;
    return this.groq.chat(messages, taskType);
  }

  async useGemini(messages: GeminiMessage[], taskType: GeminiTaskType = 'general'): Promise {
    this.geminiRequests++;
    this.totalRequests++;
    return this.gemini.chat(messages, taskType);
  }

  async useGroqJSON(messages: GroqMessage[], taskType: GroqTaskType = 'structured_output'): Promise<{ success: boolean; data?: T; error?: string }> {
    this.groqRequests++;
    this.totalRequests++;
    return this.groq.chatJSON(messages, taskType);
  }

  async useGeminiJSON(messages: GeminiMessage[], taskType: GeminiTaskType = 'general'): Promise<{ success: boolean; data?: T; error?: string }> {
    this.geminiRequests++;
    this.totalRequests++;
    return this.gemini.chatJSON(messages, taskType);
  }

  // --------------------------------------------
  // SPECIALIZED ROUTING
  // --------------------------------------------

  async routeForCode(prompt: string, context?: string): Promise {
    return this.route({
      id: `code-${Date.now()}`,
      message: prompt,
      context,
      preferredAI: 'groq',
      taskType: 'code_generation',
    });
  }

  async routeForDesign(prompt: string, context?: string): Promise {
    return this.route({
      id: `design-${Date.now()}`,
      message: prompt,
      context,
      preferredAI: 'gemini',
      taskType: 'design_decision',
    });
  }

  async routeForUrdu(message: string): Promise {
    return this.route({
      id: `urdu-${Date.now()}`,
      message,
      preferredAI: 'gemini',
      taskType: 'urdu_understanding',
    });
  }

  async routeForPrice(prompt: string): Promise {
    return this.route({
      id: `price-${Date.now()}`,
      message: prompt,
      preferredAI: 'groq',
      taskType: 'price_calculation',
    });
  }

  async routeForContent(prompt: string, context?: string): Promise {
    return this.route({
      id: `content-${Date.now()}`,
      message: prompt,
      context,
      priority: 'balanced',
    });
  }

  // --------------------------------------------
  // STATUS
  // --------------------------------------------

  getStatus(): RouterStatus {
    const groqStatus = this.groq.getStatus();
    const geminiStatus = this.gemini.getStatus();

    return {
      groq: {
        available: groqStatus.available,
        healthy: this.groq.isHealthy(),
        remainingRequests: groqStatus.remainingRequests,
        lastError: groqStatus.lastError,
      },
      gemini: {
        available: geminiStatus.available,
        healthy: this.gemini.isHealthy(),
        remainingRequests: geminiStatus.remainingRequests,
        lastError: geminiStatus.lastError,
      },
      preferredAI: this.groq.isHealthy() ? 'groq' : 'gemini',
      totalRequestsRouted: this.totalRequests,
      groqRequests: this.groqRequests,
      geminiRequests: this.geminiRequests,
      fallbackCount: this.fallbackCount,
    };
  }

  isOperational(): boolean {
    return this.groq.isHealthy() || this.gemini.isHealthy();
  }

  resetAll(): void {
    this.groq.resetStatus();
    this.gemini.resetStatus();
    this.totalRequests = 0;
    this.groqRequests = 0;
    this.geminiRequests = 0;
    this.fallbackCount = 0;
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let routerInstance: AIRouter | null = null;

export function getAIRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter();
  }
  return routerInstance;
}

export function resetAIRouter(): void {
  routerInstance = null;
}
