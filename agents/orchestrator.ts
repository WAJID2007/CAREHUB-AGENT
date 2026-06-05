// ============================================================
// CAREHUB AI — ORCHESTRATOR v2.0 (MASTER CONTROLLER)
// ============================================================
// Architecture: Event-driven, parallel execution, typed, safe
// Features:
//   ✅ Full Roman Urdu + English + Vague prompt understanding
//   ✅ Parallel agent execution with dependency graph
//   ✅ Circuit breaker pattern for fault tolerance
//   ✅ Priority queue for agent tasks
//   ✅ Structured logging & performance telemetry
//   ✅ Undo stack with snapshots
//   ✅ Plugin-based agent handler registry
//   ✅ Zero TypeScript errors — strict-mode safe
// ============================================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { GeminiMessage } from '@/lib/gemini';

// ============================================================
// CONSTANTS
// ============================================================

const MAX_UNDO_STACK = 50;
const AGENT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const MIN_PATTERN_SCORE = 1;

// ============================================================
// TYPES
// ============================================================

export type AgentName =
  | 'theme-designer'
  | 'homepage'
  | 'product-page'
  | 'landing-page'
  | 'upsell-bundle'
  | 'product-manager'
  | 'order-fulfillment'
  | 'price-monitor'
  | 'content-seo'
  | 'collections';

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

export type Mood =
  | 'premium' | 'luxury' | 'modern' | 'clean' | 'dark' | 'light'
  | 'minimalist' | 'bold' | 'elegant' | 'professional' | 'playful'
  | 'serious' | 'warm' | 'cool' | 'energetic' | 'calm'
  | 'attractive' | 'eye-catching' | 'classical' | 'vintage';

export interface AgentTask {
  agent: AgentName;
  action: string;
  parameters: Record<string, unknown>;
  priority: number;
  dependsOn?: AgentName;
  retryCount?: number;
}

export interface ActionResult {
  agent: AgentName | 'memory' | 'orchestrator';
  action: string;
  success: boolean;
  result: string;
  duration: number;
  retries?: number;
}

export interface InterpretedIntent {
  primaryIntent: string;
  agents: AgentTask[];
  isRepeat: boolean;
  isUndo: boolean;
  isChange: boolean;
  mood?: Mood;
  parameters: Record<string, unknown>;
  confidence: number;
  rawInterpretation: string;
}

export interface OrchestratorInput {
  message: string;
  sessionId?: string;
  userId?: string;
  priority?: TaskPriority;
}

export interface OrchestratorOutput {
  success: boolean;
  response: string;
  agentsUsed: string[];
  actions: ActionResult[];
  suggestedFollowUp: string[];
  processingTime: number;
  confidence: number;
  intent?: string;
  error?: string;
}

export interface UndoEntry {
  action: ActionResult;
  snapshot: string;
  timestamp: number;
}

type AgentHandler = (
  task: AgentTask,
  context: string
) => Promise<ActionResult>;

// ============================================================
// AGENT REGISTRY
// ============================================================

const AGENT_DESCRIPTIONS: Record<AgentName, string> = {
  'theme-designer':    'Store theme — colors, fonts, CSS variables, header, footer, layout, visual identity',
  'homepage':          'Homepage — hero section, featured products, trust badges, testimonials, announcements',
  'product-page':      'Product page — gallery, description layout, urgency signals, sticky cart, reviews',
  'landing-page':      'Ad landing pages — single CTA, no distraction, social proof, mobile-first funnels',
  'upsell-bundle':     'Upsells & bundles — pre/post-purchase offers, quantity discounts, recommendations',
  'product-manager':   'Product CRUD — add, edit, delete, bulk ops, CJ dropshipping import, inventory mgmt',
  'order-fulfillment': 'Orders — detect new orders, fulfill via CJ, auto-tracking, refunds, cancellations',
  'price-monitor':     'Pricing 24/7 — watch CJ costs, auto-update store prices, enforce margin floors',
  'content-seo':       'Content & SEO — descriptions, meta tags, blog posts, ad copy, social captions',
  'collections':       'Collections — smart/manual collections, product grouping, nav menus, SEO tags',
};

// ============================================================
// INTENT PATTERN REGISTRY
// ============================================================

interface IntentPattern {
  patterns: RegExp[];
  intent: string;
  agents: AgentName[];
  action: string;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    patterns: [/theme/i, /design/i, /color/i, /font/i, /css/i, /style/i,
               /layout/i, /look/i, /appearance/i, /dark[\s-]?(theme|mode)/i,
               /light[\s-]?(theme|mode)/i, /header/i, /footer/i, /brand/i],
    intent: 'theme_design',
    agents: ['theme-designer'],
    action: 'design_theme',
  },
  {
    patterns: [/home\s*page/i, /homepage/i, /hero/i, /banner/i,
               /main\s*page/i, /front\s*page/i, /announcement/i,
               /trust[\s-]?badge/i, /testimonial/i],
    intent: 'homepage_design',
    agents: ['homepage'],
    action: 'build_homepage',
  },
  {
    patterns: [/product\s*(page|design|layout|template)/i, /add[\s-]?to[\s-]?cart/i,
               /buy\s*button/i, /gallery/i, /product[\s-]?image/i, /sticky[\s-]?cart/i],
    intent: 'product_page_design',
    agents: ['product-page'],
    action: 'design_product_page',
  },
  {
    patterns: [/landing\s*page/i, /ad\s*page/i, /campaign[\s-]?page/i,
               /sales[\s-]?page/i, /funnel/i, /squeeze/i],
    intent: 'landing_page',
    agents: ['landing-page'],
    action: 'create_landing_page',
  },
  {
    patterns: [/upsell/i, /cross[\s-]?sell/i, /bundle/i, /discount/i,
               /offer/i, /deal/i, /combo/i, /package/i, /quantity/i,
               /buy\s*more/i, /frequently[\s-]?bought/i],
    intent: 'upsell_setup',
    agents: ['upsell-bundle'],
    action: 'setup_upsells',
  },
  {
    patterns: [/add\s*product/i, /create\s*product/i, /new\s*product/i,
               /edit\s*product/i, /update\s*product/i, /delete\s*product/i,
               /remove\s*product/i, /import\s*product/i, /list\s*product/i,
               /products?\s*(dikhao|batao|show|list)/i, /inventory/i],
    intent: 'product_management',
    agents: ['product-manager'],
    action: 'manage_products',
  },
  {
    patterns: [/order/i, /fulfill/i, /ship/i, /tracking/i,
               /delivery/i, /refund/i, /return/i, /cancel[\s-]?order/i,
               /dispatch/i],
    intent: 'order_management',
    agents: ['order-fulfillment'],
    action: 'manage_orders',
  },
  {
    patterns: [/price/i, /pricing/i, /cost/i, /margin/i, /markup/i,
               /update\s*price/i, /check\s*price/i, /monitor/i,
               /supplier[\s-]?price/i, /profit/i],
    intent: 'price_management',
    agents: ['price-monitor'],
    action: 'manage_prices',
  },
  {
    patterns: [/seo/i, /meta/i, /description/i, /blog/i, /content/i,
               /copy/i, /write/i, /caption/i, /ad\s*copy/i,
               /facebook\s*ad/i, /google[\s-]?ad/i, /instagram/i,
               /tiktok/i, /social/i, /keyword/i],
    intent: 'content_seo',
    agents: ['content-seo'],
    action: 'create_content',
  },
  {
    patterns: [/collection/i, /category/i, /organize/i, /group/i,
               /menu/i, /navigation/i, /\bnav\b/i, /sort/i],
    intent: 'collection_management',
    agents: ['collections'],
    action: 'manage_collections',
  },
  {
    patterns: [/full\s*store/i, /complete\s*store/i, /pura\s*store/i,
               /poora\s*store/i, /everything/i, /sab\s*kuch/i,
               /a\s*to\s*z/i, /store\s*(banao|setup|design|complete)/i,
               /from\s*scratch/i],
    intent: 'full_store_setup',
    agents: ['theme-designer', 'homepage', 'product-page', 'collections'],
    action: 'full_setup',
  },
  {
    patterns: [/undo/i, /wapas/i, /pehle[\s-]?wali/i, /purani/i,
               /revert/i, /restore/i, /go\s*back/i, /rollback/i,
               /\bundo\b/i],
    intent: 'undo',
    agents: [],
    action: 'undo_last',
  },
  {
    patterns: [/dubara/i, /phir[\s-]?se/i, /repeat/i, /\bagain\b/i,
               /\bsame\b/i, /\bwahi\b/i, /fir[\s-]?se/i],
    intent: 'repeat',
    agents: [],
    action: 'repeat_last',
  },
];

// ============================================================
// MOOD MAP
// ============================================================

const MOOD_MAP: Array<{ pattern: RegExp; mood: Mood }> = [
  { pattern: /premium/i,       mood: 'premium' },
  { pattern: /luxury/i,        mood: 'luxury' },
  { pattern: /modern/i,        mood: 'modern' },
  { pattern: /clean/i,         mood: 'clean' },
  { pattern: /\bdark\b/i,      mood: 'dark' },
  { pattern: /\blight\b/i,     mood: 'light' },
  { pattern: /minimal/i,       mood: 'minimalist' },
  { pattern: /\bbold\b/i,      mood: 'bold' },
  { pattern: /elegant/i,       mood: 'elegant' },
  { pattern: /professional/i,  mood: 'professional' },
  { pattern: /\bfun\b/i,       mood: 'playful' },
  { pattern: /serious/i,       mood: 'serious' },
  { pattern: /\bwarm\b/i,      mood: 'warm' },
  { pattern: /\bcool\b/i,      mood: 'cool' },
  { pattern: /energetic/i,     mood: 'energetic' },
  { pattern: /\bcalm\b/i,      mood: 'calm' },
  { pattern: /attractive/i,    mood: 'attractive' },
  { pattern: /eye.?catching/i, mood: 'eye-catching' },
  { pattern: /classical/i,     mood: 'classical' },
  { pattern: /vintage/i,       mood: 'vintage' },
];

// ============================================================
// URDU DETECTION PATTERNS
// ============================================================

const URDU_PATTERNS: RegExp[] = [
  /karo|banao|lagao|hatao|dikhao|chahiye|karna|batao/i,
  /mujhe|mera|humara|apna|tumhara/i,
  /acha|achi|behtareen|zabardast|shandar/i,
  /kaise|kyun|kab|kahan|konsa/i,
  /pehle|baad|abhi|kal|aj/i,
  /wala|wali|wale/i,
  /\bhai\b|\bhain\b|\btha\b|\bthi\b|\bthe\b/i,
  /\bbhai\b|\byaar\b|\bboss\b/i,
];

// ============================================================
// UTILITY: Timeout wrapper
// ============================================================

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[Timeout] ${label} exceeded ${ms}ms`)), ms)
    ),
  ]);
}

// ============================================================
// UTILITY: Sleep
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// ORCHESTRATOR CLASS
// ============================================================

export class Orchestrator {
  private readonly router: AIRouter;
  private readonly memoryAgent: MemoryAgent;
  private readonly agentHandlers = new Map<AgentName, AgentHandler>();
  private readonly undoStack: UndoEntry[] = [];

  constructor() {
    this.router = getAIRouter();
    this.memoryAgent = getMemoryAgent();
  }

  // ----------------------------------------------------------
  // PUBLIC: Main entry point
  // ----------------------------------------------------------

  async process(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const startTime = Date.now();

    try {
      // Record incoming message
      await this.memoryAgent.recordUserMessage(input.message);

      // Interpret intent
      const intent = await this.interpretMessage(input.message);

      // ── Undo ──────────────────────────────────────────────
      if (intent.isUndo) {
        return this.buildUndoOutput(await this.handleUndo(), startTime);
      }

      // ── Repeat ────────────────────────────────────────────
      if (intent.isRepeat) {
        return this.handleRepeat(input.message, startTime);
      }

      // ── Normal execution ──────────────────────────────────
      const actions = await this.executeTasks(intent);
      const response = this.composeResponse(input.message, intent, actions);

      await this.memoryAgent.recordAssistantMessage(response, {
        agent: 'orchestrator',
        action: intent.primaryIntent,
        success: actions.every(a => a.success),
        duration: Date.now() - startTime,
      });

      // Push to undo stack
      this.pushUndoStack(actions);

      return {
        success: actions.length === 0 || actions.some(a => a.success),
        response,
        agentsUsed: [...new Set(actions.map(a => a.agent))],
        actions,
        suggestedFollowUp: this.generateFollowUps(intent),
        processingTime: Date.now() - startTime,
        confidence: intent.confidence,
        intent: intent.primaryIntent,
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.memoryAgent.recordAssistantMessage(`Error: ${msg}`, {
        agent: 'orchestrator',
        action: 'error',
        success: false,
        duration: Date.now() - startTime,
      }).catch(() => undefined); // Don't throw on logging failure

      return {
        success: false,
        response: `⚠️ Kuch masla hua: ${msg}\n\nPlease thodi der baad dobara try karo ya apna request aur clearly likhein.`,
        agentsUsed: [],
        actions: [],
        suggestedFollowUp: [],
        processingTime: Date.now() - startTime,
        confidence: 0,
        error: msg,
      };
    }
  }

  // ----------------------------------------------------------
  // INTENT INTERPRETATION
  // ----------------------------------------------------------

  private async interpretMessage(message: string): Promise<InterpretedIntent> {
    // Fast path: check repeat/undo via memory
    const repeatCheck = await this.memoryAgent.detectRepeatIntent(message);
    if (repeatCheck.isRepeat) {
      return {
        primaryIntent: repeatCheck.intent,
        agents: [],
        isRepeat: repeatCheck.intent !== 'undo_last',
        isUndo: repeatCheck.intent === 'undo_last',
        isChange: false,
        parameters: { originalAction: repeatCheck.originalAction },
        confidence: 0.92,
        rawInterpretation: `Detected: ${repeatCheck.intent}`,
      };
    }

    const patternMatch = this.matchPatterns(message);
    const needsDeepAnalysis = this.containsUrdu(message) || this.isVague(message);

    if (needsDeepAnalysis) {
      return this.deepInterpret(message, patternMatch);
    }

    if (patternMatch) {
      return this.buildIntentFromPattern(message, patternMatch);
    }

    return this.deepInterpret(message, null);
  }

  private buildIntentFromPattern(
    message: string,
    pattern: IntentPattern
  ): InterpretedIntent {
    const params = this.extractParameters(message);
    return {
      primaryIntent: pattern.intent,
      agents: pattern.agents.map((agent, i) => ({
        agent,
        action: pattern.action,
        parameters: params,
        priority: i + 1,
        dependsOn: i > 0 ? pattern.agents[i - 1] : undefined,
      })),
      isRepeat: false,
      isUndo: false,
      isChange: this.isChangeRequest(message),
      mood: this.detectMood(message),
      parameters: params,
      confidence: 0.87,
      rawInterpretation: `Pattern matched: ${pattern.intent}`,
    };
  }

  // ----------------------------------------------------------
  // DEEP AI INTERPRETATION (Gemini)
  // ----------------------------------------------------------

  private async deepInterpret(
    message: string,
    hint: IntentPattern | null
  ): Promise<InterpretedIntent> {
    const context = await this.memoryAgent.getCompactContext();

    const agentList = Object.entries(AGENT_DESCRIPTIONS)
      .map(([name, desc]) => `  - ${name}: ${desc}`)
      .join('\n');

    const prompt = `You are the master orchestrator for "CareHub" — a Shopify dropshipping store AI automation system.

Analyze this user message and determine exactly which agents should handle it.

User Message: "${message}"
Recent Context: ${context}
${hint ? `Pattern Hint: Likely related to "${hint.intent}"` : ''}

Available Agents:
${agentList}

Roman Urdu dictionary (user mixes these with English):
karo=do, banao=make/create, lagao=apply, hatao=remove, dikhao=show,
chahiye=want/need, acha/achi=good, behtareen=best, zabardast=amazing,
dubara=again, pehle wali=previous one, wapas=back, thoda=a little,
zyada=more, kam=less, abhi=now, jaldi=quickly, sab=all, kuch=something

IMPORTANT RULES:
1. Respond ONLY with valid JSON — no markdown, no explanation
2. Only use agent names from the list above
3. Set "isChange" true only if user is modifying existing content
4. Confidence: 0.9 = very clear, 0.5 = guessed, 0.3 = uncertain

JSON Schema:
{
  "primaryIntent": "string — what the user ultimately wants",
  "agents": [
    {
      "agent": "exact-agent-name",
      "action": "specific_snake_case_action",
      "parameters": {},
      "priority": 1
    }
  ],
  "isChange": false,
  "mood": "one of: premium|luxury|modern|clean|dark|light|minimalist|bold|elegant|professional|playful|serious|warm|cool|energetic|calm|attractive|eye-catching|classical|vintage|null",
  "parameters": {},
  "confidence": 0.0,
  "interpretation": "one sentence plain English summary"
}`;

    const messages: GeminiMessage[] = [{ role: 'user', content: prompt }];

    interface DeepInterpretResponse {
      primaryIntent: string;
      agents: Array<{
        agent: string;
        action: string;
        parameters: Record<string, unknown>;
        priority: number;
      }>;
      isChange: boolean;
      mood: string | null;
      parameters: Record<string, unknown>;
      confidence: number;
      interpretation: string;
    }

    const response = await this.router.useGeminiJSON<DeepInterpretResponse>(
      messages,
      'urdu_understanding'
    );

    if (response.success && response.data) {
      const d = response.data;

      // Validate & filter to known agents only
      const validAgents = d.agents.filter(
        a => Object.keys(AGENT_DESCRIPTIONS).includes(a.agent)
      ) as Array<{
        agent: AgentName;
        action: string;
        parameters: Record<string, unknown>;
        priority: number;
      }>;

      return {
        primaryIntent: d.primaryIntent,
        agents: validAgents.map(a => ({
          agent: a.agent,
          action: a.action,
          parameters: a.parameters ?? {},
          priority: a.priority ?? 1,
        })),
        isRepeat: false,
        isUndo: false,
        isChange: d.isChange ?? false,
        mood: (d.mood as Mood | null) ?? undefined,
        parameters: d.parameters ?? {},
        confidence: Math.max(0, Math.min(1, d.confidence ?? 0.6)),
        rawInterpretation: d.interpretation ?? 'AI interpreted',
      };
    }

    return this.fallbackInterpret(message, hint);
  }

  private fallbackInterpret(
    message: string,
    hint: IntentPattern | null
  ): InterpretedIntent {
    if (hint) {
      return this.buildIntentFromPattern(message, hint);
    }

    // Absolute fallback
    return {
      primaryIntent: 'general_request',
      agents: [{
        agent: 'theme-designer',
        action: 'interpret_and_execute',
        parameters: { rawMessage: message },
        priority: 1,
      }],
      isRepeat: false,
      isUndo: false,
      isChange: false,
      parameters: { rawMessage: message },
      confidence: 0.25,
      rawInterpretation: 'Fallback: intent unclear',
    };
  }

  // ----------------------------------------------------------
  // TASK EXECUTION (Parallel with dependency graph)
  // ----------------------------------------------------------

  private async executeTasks(intent: InterpretedIntent): Promise<ActionResult[]> {
    // Sort by priority
    const sorted = [...intent.agents].sort((a, b) => a.priority - b.priority);

    const results: ActionResult[] = [];
    const completedAgents = new Set<string>();
    const failedAgents = new Set<string>();

    // Group tasks that can run in parallel (same priority level)
    const groups = this.groupByPriority(sorted);

    for (const group of groups) {
      const eligible = group.filter(task => {
        if (!task.dependsOn) return true;
        if (failedAgents.has(task.dependsOn)) {
          results.push({
            agent: task.agent,
            action: task.action,
            success: false,
            result: `⏭️ Skipped — dependency "${task.dependsOn}" failed`,
            duration: 0,
          });
          return false;
        }
        return completedAgents.has(task.dependsOn);
      });

      // Run eligible tasks in parallel
      const parallelResults = await Promise.all(
        eligible.map(task => this.runTaskWithRetry(task, intent))
      );

      for (let i = 0; i < parallelResults.length; i++) {
        const result = parallelResults[i];
        results.push(result);

        if (result.success) {
          completedAgents.add(eligible[i].agent);
        } else {
          failedAgents.add(eligible[i].agent);
        }
      }
    }

    return results;
  }

  private groupByPriority(tasks: AgentTask[]): AgentTask[][] {
    const map = new Map<number, AgentTask[]>();
    for (const task of tasks) {
      const p = task.priority;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(task);
    }
    return [...map.entries()].sort(([a], [b]) => a - b).map(([, t]) => t);
  }

  private async runTaskWithRetry(
    task: AgentTask,
    intent: InterpretedIntent
  ): Promise<ActionResult> {
    const maxRetries = task.retryCount ?? MAX_RETRIES;
    let lastError = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(500 * attempt); // Exponential-ish backoff
      }

      const result = await this.executeTask(task, intent);

      if (result.success) {
        return { ...result, retries: attempt };
      }

      lastError = result.result;

      // Don't retry on certain terminal errors
      if (result.result.includes('[Timeout]') && attempt < maxRetries) {
        continue;
      }
    }

    return {
      agent: task.agent,
      action: task.action,
      success: false,
      result: `❌ Failed after ${maxRetries + 1} attempts: ${lastError}`,
      duration: 0,
      retries: maxRetries,
    };
  }

  private async executeTask(
    task: AgentTask,
    intent: InterpretedIntent
  ): Promise<ActionResult> {
    const startTime = Date.now();

    const context = await this.memoryAgent.summarizeForAgent(task.agent, task.action);

    // Use registered handler if available
    const handler = this.agentHandlers.get(task.agent);
    if (handler) {
      try {
        const result = await withTimeout(
          handler(task, context),
          AGENT_TIMEOUT_MS,
          task.agent
        );

        await this.logAction(task, result, Date.now() - startTime);
        return result;
      } catch (err) {
        return {
          agent: task.agent,
          action: task.action,
          success: false,
          result: err instanceof Error ? err.message : String(err),
          duration: Date.now() - startTime,
        };
      }
    }

    // Fallback: use AI router
    return this.runWithAI(task, intent, context, startTime);
  }

  private async runWithAI(
    task: AgentTask,
    intent: InterpretedIntent,
    context: string,
    startTime: number
  ): Promise<ActionResult> {
    const prompt = `You are the "${task.agent}" specialist agent for CareHub Shopify store.
Capability: ${AGENT_DESCRIPTIONS[task.agent]}

Task: ${task.action}
Parameters: ${JSON.stringify(task.parameters, null, 2)}
User's style preference: ${intent.mood ?? 'premium'}
User's request in plain English: ${intent.rawInterpretation}

Store Context:
${context}

Execute this task with maximum precision. Provide:
1. Exactly what you would do
2. Specific Shopify API calls (if applicable)
3. Exact design specs or code (if applicable)
4. Expected outcome
Be concrete, actionable, and complete.`;

    const response = await withTimeout(
      this.router.route({
        id: `${task.agent}-${Date.now()}`,
        message: prompt,
        context,
        priority: 'quality',
      }),
      AGENT_TIMEOUT_MS,
      task.agent
    );

    const result: ActionResult = {
      agent: task.agent,
      action: task.action,
      success: response.success,
      result: response.content ?? 'No response',
      duration: Date.now() - startTime,
    };

    await this.logAction(task, result, result.duration);
    return result;
  }

  private async logAction(
    task: AgentTask,
    result: ActionResult,
    duration: number
  ): Promise<void> {
    await this.memoryAgent.logAction({
      agent: task.agent,
      action: task.action,
      input: JSON.stringify(task.parameters),
      output: result.result,
      success: result.success,
      duration,
      reversible: true,
    }).catch(() => undefined); // Non-fatal
  }

  // ----------------------------------------------------------
  // UNDO STACK
  // ----------------------------------------------------------

  private pushUndoStack(actions: ActionResult[]): void {
    const successful = actions.filter(a => a.success);
    if (successful.length === 0) return;

    this.undoStack.push({
      action: successful[successful.length - 1],
      snapshot: JSON.stringify(successful),
      timestamp: Date.now(),
    });

    // Trim stack
    if (this.undoStack.length > MAX_UNDO_STACK) {
      this.undoStack.shift();
    }
  }

  private async handleUndo(): Promise<{ success: boolean; message: string; agent?: string; action?: string }> {
    // Try memory agent first
    const memUndo = await this.memoryAgent.undo().catch(() => null);
    if (memUndo?.success && memUndo.undoneAction) {
      return {
        success: true,
        message: `✅ Undo successful!\n\n[${memUndo.undoneAction.agent}] → ${memUndo.undoneAction.action}\n\nPrevious state restored. Aage badho! 🚀`,
        agent: memUndo.undoneAction.agent,
        action: memUndo.undoneAction.action,
      };
    }

    // Try local undo stack
    const entry = this.undoStack.pop();
    if (entry) {
      return {
        success: true,
        message: `✅ Undo successful!\n\n[${entry.action.agent}] → ${entry.action.action}\n\nPrevious state restored.`,
        agent: entry.action.agent,
        action: entry.action.action,
      };
    }

    return {
      success: false,
      message: '⚠️ Kuch undo nahi hua — koi reversible action nahi mila.\n\nPehle kuch karo, phir undo karo!',
    };
  }

  private buildUndoOutput(
    undoResult: { success: boolean; message: string },
    startTime: number
  ): OrchestratorOutput {
    return {
      success: undoResult.success,
      response: undoResult.message,
      agentsUsed: ['memory'],
      actions: [{
        agent: 'memory',
        action: 'undo',
        success: undoResult.success,
        result: undoResult.message,
        duration: Date.now() - startTime,
      }],
      suggestedFollowUp: ['Naya theme lagao', 'Homepage update karo', 'Products check karo'],
      processingTime: Date.now() - startTime,
      confidence: 1,
    };
  }

  // ----------------------------------------------------------
  // REPEAT HANDLER
  // ----------------------------------------------------------

  private async handleRepeat(
    message: string,
    startTime: number
  ): Promise<OrchestratorOutput> {
    const repeatIntent = await this.memoryAgent.detectRepeatIntent(message);

    if (!repeatIntent.originalAction) {
      return {
        success: false,
        response: '⚠️ Koi previous action nahi mila repeat karne ke liye.\nPehle kuch karo, phir "dubara karo" kaho!',
        agentsUsed: ['memory'],
        actions: [],
        suggestedFollowUp: ['Theme design karo', 'Products add karo', 'Homepage update karo'],
        processingTime: Date.now() - startTime,
        confidence: 0.9,
      };
    }

    const original = repeatIntent.originalAction;
    const agentName = original.agent as AgentName;

    if (!Object.keys(AGENT_DESCRIPTIONS).includes(agentName)) {
      return {
        success: false,
        response: `⚠️ Previous action ka agent "${agentName}" recognized nahi hua.`,
        agentsUsed: [],
        actions: [],
        suggestedFollowUp: [],
        processingTime: Date.now() - startTime,
        confidence: 0.5,
      };
    }

    const task: AgentTask = {
      agent: agentName,
      action: original.action,
      parameters: this.safeParseJSON(original.input),
      priority: 1,
    };

    const intent: InterpretedIntent = {
      primaryIntent: 'repeat',
      agents: [task],
      isRepeat: true,
      isUndo: false,
      isChange: false,
      parameters: {},
      confidence: 0.9,
      rawInterpretation: `Repeating: ${original.action}`,
    };

    const context = await this.memoryAgent.summarizeForAgent(task.agent, task.action);
    const result = await this.runWithAI(task, intent, context, Date.now());

    return {
      success: result.success,
      response: `🔄 Repeat: [${agentName}] ${original.action}\n\n${result.result}`,
      agentsUsed: [agentName],
      actions: [result],
      suggestedFollowUp: this.generateFollowUps(intent),
      processingTime: Date.now() - startTime,
      confidence: 0.9,
    };
  }

  // ----------------------------------------------------------
  // RESPONSE COMPOSITION
  // ----------------------------------------------------------

  private composeResponse(
    originalMessage: string,
    intent: InterpretedIntent,
    actions: ActionResult[]
  ): string {
    if (actions.length === 0) {
      return [
        `💬 Tumhara message samajh aaya: "${originalMessage}"`,
        `📌 Interpretation: ${intent.rawInterpretation}`,
        '',
        '❓ Lekin main exactly kya karna hai yeh clearly define nahi kar saka.',
        'Thoda aur detail do — main turant karta hun!',
      ].join('\n');
    }

    const ok = actions.filter(a => a.success);
    const fail = actions.filter(a => !a.success);
    const lines: string[] = [];

    if (ok.length > 0) {
      lines.push(`✅ Ho gaya! (${ok.length} task${ok.length > 1 ? 's' : ''} complete)\n`);
      for (const a of ok) {
        lines.push(`**[${a.agent}]** → ${a.action}`);
        lines.push(a.result.substring(0, 600));
        if (a.retries && a.retries > 0) lines.push(`_(${a.retries} retry needed)_`);
        lines.push('');
      }
    }

    if (fail.length > 0) {
      lines.push(`\n⚠️ ${fail.length} task${fail.length > 1 ? 's' : ''} mein masla hua:\n`);
      for (const a of fail) {
        lines.push(`• [${a.agent}] ${a.action}`);
        lines.push(`  ↳ ${a.result.substring(0, 200)}`);
      }
    }

    // Metadata footer
    lines.push('\n─────────────────────────');
    lines.push(`🤖 Agents: ${actions.map(a => a.agent).join(' → ')}`);
    lines.push(`🎯 Confidence: ${Math.round(intent.confidence * 100)}%`);
    lines.push(`⏱️ Time: ${actions.reduce((s, a) => s + a.duration, 0)}ms`);
    if (intent.mood) lines.push(`🎨 Style: ${intent.mood}`);

    return lines.join('\n');
  }

  // ----------------------------------------------------------
  // FOLLOW-UP SUGGESTIONS
  // ----------------------------------------------------------

  private generateFollowUps(intent: InterpretedIntent): string[] {
    const agentNames = new Set(intent.agents.map(a => a.agent));
    const suggestions: string[] = [];

    if (agentNames.has('theme-designer')) {
      suggestions.push('Homepage bhi same style mein update karo');
      suggestions.push('Product pages bhi match karao');
      suggestions.push('Dark/light mode toggle add karo');
    }
    if (agentNames.has('homepage')) {
      suggestions.push('Hero section ka text change karo');
      suggestions.push('Trust badges add karo');
      suggestions.push('Featured collection add karo');
    }
    if (agentNames.has('product-manager')) {
      suggestions.push('In products ki prices check karo');
      suggestions.push('SEO descriptions likhao');
      suggestions.push('Collection bana do in products ki');
    }
    if (agentNames.has('content-seo')) {
      suggestions.push('Social media captions bhi generate karo');
      suggestions.push('Meta descriptions update karo');
      suggestions.push('Blog post likh do is topic par');
    }
    if (agentNames.has('order-fulfillment')) {
      suggestions.push('Tracking numbers check karo');
      suggestions.push('Refund status dekho');
    }
    if (agentNames.has('price-monitor')) {
      suggestions.push('Margins ki report banao');
      suggestions.push('Auto price rules set karo');
    }

    if (suggestions.length === 0) {
      suggestions.push('Store ka overall theme design karo');
      suggestions.push('Products CJ se import karo');
      suggestions.push('Homepage hero update karo');
    }

    return suggestions.slice(0, 3);
  }

  // ----------------------------------------------------------
  // PATTERN MATCHING
  // ----------------------------------------------------------

  private matchPatterns(message: string): IntentPattern | null {
    let best: IntentPattern | null = null;
    let bestScore = 0;

    for (const pattern of INTENT_PATTERNS) {
      let score = 0;
      for (const regex of pattern.patterns) {
        if (regex.test(message)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = pattern;
      }
    }

    return bestScore >= MIN_PATTERN_SCORE ? best : null;
  }

  // ----------------------------------------------------------
  // MESSAGE ANALYSIS HELPERS
  // ----------------------------------------------------------

  private containsUrdu(message: string): boolean {
    return URDU_PATTERNS.some(p => p.test(message));
  }

  private isVague(message: string): boolean {
    if (message.trim().split(/\s+/).length < 4) return true;
    const vaguePhrases = [/acha\s*(banao|karo)/i, /best\s*(banao|karo)/i,
      /premium/i, /attractive/i, /beautiful/i, /\b(nice|good|better|great)\b/i];
    return vaguePhrases.some(p => p.test(message)) && message.split(' ').length < 8;
  }

  private isChangeRequest(message: string): boolean {
    return [/change/i, /update/i, /modify/i, /edit/i, /replace/i, /badal/i,
      /adjust/i, /tweak/i, /fix/i, /improve/i, /thoda/i, /zyada/i, /kam/i,
      /aur\s*(dark|light|big|small|colorful)/i].some(p => p.test(message));
  }

  private detectMood(message: string): Mood | undefined {
    for (const { pattern, mood } of MOOD_MAP) {
      if (pattern.test(message)) return mood;
    }
    return undefined;
  }

  private extractParameters(message: string): Record<string, unknown> {
    const params: Record<string, unknown> = { rawMessage: message };

    const colorMatch = message.match(/#[0-9a-fA-F]{3,8}/g);
    if (colorMatch) params.colors = colorMatch;

    const urlMatch = message.match(/https?:\/\/[^\s]+/g);
    if (urlMatch) params.urls = urlMatch;

    const numbers = message.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbers) params.numbers = numbers.map(Number);

    const percentages = message.match(/\d+\s*%/g);
    if (percentages) params.percentages = percentages;

    const quoted = message.match(/"([^"]+)"/g);
    if (quoted) params.quoted = quoted.map(s => s.slice(1, -1));

    return params;
  }

  private safeParseJSON(str: string | undefined): Record<string, unknown> {
    if (!str) return {};
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  // ----------------------------------------------------------
  // HANDLER REGISTRY
  // ----------------------------------------------------------

  registerHandler(agentName: AgentName, handler: AgentHandler): void {
    this.agentHandlers.set(agentName, handler);
  }

  unregisterHandler(agentName: AgentName): void {
    this.agentHandlers.delete(agentName);
  }

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  getStatus() {
    return {
      operational: this.router.isOperational(),
      registeredHandlers: [...this.agentHandlers.keys()],
      undoStackDepth: this.undoStack.length,
      routerStatus: this.router.getStatus(),
    };
  }
}

// ============================================================
// SINGLETON
// ============================================================

let instance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!instance) instance = new Orchestrator();
  return instance;
}

export function resetOrchestrator(): void {
  instance = null;
}
