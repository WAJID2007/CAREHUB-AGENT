// ============================================
// CAREHUB AI AGENT — GEMINI CLIENT (MULTI-MODEL)
// ============================================
// Models (Free Tier — Separate Limits Per Model):
//   • gemini-2.5-pro       → 5 RPM  | 100 RPD  — Complex reasoning, critical decisions
//   • gemini-2.5-flash     → 10 RPM | 250 RPD  — Primary: design, Urdu, creative, fallback
//   • gemini-2.5-flash-8b  → 15 RPM | 1000 RPD — High-volume: cron, price monitor, bulk ops
//
// Smart Routing: Task type → best model auto-selected
// Daily Quota Guard: Tracks usage per model, auto-downgrades before hitting limits
// Fallback Chain: Pro → Flash → Flash-8b → Groq (handled by ai-router.ts)
// ============================================

import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';

// --------------------------------------------
// CONSTANTS — MODEL NAMES & FREE TIER LIMITS
// --------------------------------------------

export const GEMINI_MODELS = {
  PRO:        'gemini-2.5-pro',
  FLASH:      'gemini-2.5-flash',
  FLASH_LITE: 'gemini-2.5-flash-8b',  // Flash-Lite / 8B — highest free RPD
} as const;

export type GeminiModelName = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS];

// Free tier hard limits (conservative — 90% of actual to stay safe)
const MODEL_LIMITS: Record<GeminiModelName, { rpm: number; rpd: number }> = {
  [GEMINI_MODELS.PRO]:        { rpm: 4,  rpd: 90  },  // actual: 5 RPM / 100 RPD
  [GEMINI_MODELS.FLASH]:      { rpm: 9,  rpd: 225 },  // actual: 10 RPM / 250 RPD
  [GEMINI_MODELS.FLASH_LITE]: { rpm: 13, rpd: 900 },  // actual: 15 RPM / 1000 RPD
};

// Fallback chain: if model exhausted, try next
const FALLBACK_CHAIN: Record<GeminiModelName, GeminiModelName | null> = {
  [GEMINI_MODELS.PRO]:        GEMINI_MODELS.FLASH,
  [GEMINI_MODELS.FLASH]:      GEMINI_MODELS.FLASH_LITE,
  [GEMINI_MODELS.FLASH_LITE]: null,  // last resort — ai-router.ts handles Groq fallback
};

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: GeminiModelName;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
}

export interface GeminiResponse {
  success: boolean;
  content: string;
  model: GeminiModelName;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  latencyMs?: number;
  quotaWarning?: string;  // non-fatal quota info for logging
}

export interface GeminiQuotaStatus {
  model: GeminiModelName;
  rpmUsed: number;
  rpmLimit: number;
  rpdUsed: number;
  rpdLimit: number;
  rpmAvailable: number;
  rpdAvailable: number;
  healthy: boolean;
}

export interface GeminiSystemStatus {
  available: boolean;
  lastError: string | null;
  consecutiveErrors: number;
  quota: Record<GeminiModelName, GeminiQuotaStatus>;
  recommendedModel: GeminiModelName;
}

// --------------------------------------------
// TASK TYPES
// --------------------------------------------

export type GeminiTaskType =
  | 'design_decision'       // Flash — creative design work
  | 'urdu_understanding'    // Flash — language comprehension
  | 'image_prompt'          // Flash — creative image prompts
  | 'complex_reasoning'     // Pro  — deep multi-step thinking
  | 'creative_writing'      // Flash — copy, content, descriptions
  | 'mood_interpretation'   // Flash — mood → design specs
  | 'theme_generation'      // Flash — full CSS generation
  | 'fallback_code'         // Flash — code when Groq unavailable
  | 'price_monitor'         // Flash-Lite — high frequency cron task
  | 'bulk_operation'        // Flash-Lite — mass product/order ops
  | 'quick_classify'        // Flash-Lite — simple classification/routing
  | 'business_strategy'     // Pro  — critical business decisions
  | 'general';              // Flash — default

// --------------------------------------------
// TASK → MODEL ROUTING TABLE
// Most important assignment — drives all model selection
// --------------------------------------------

const TASK_MODEL_MAP: Record<GeminiTaskType, GeminiModelName> = {
  // PRO tasks — complex, high-value, low-frequency
  complex_reasoning:  GEMINI_MODELS.PRO,
  business_strategy:  GEMINI_MODELS.PRO,

  // FLASH tasks — primary workload
  design_decision:    GEMINI_MODELS.FLASH,
  urdu_understanding: GEMINI_MODELS.FLASH,
  image_prompt:       GEMINI_MODELS.FLASH,
  creative_writing:   GEMINI_MODELS.FLASH,
  mood_interpretation:GEMINI_MODELS.FLASH,
  theme_generation:   GEMINI_MODELS.FLASH,
  fallback_code:      GEMINI_MODELS.FLASH,
  general:            GEMINI_MODELS.FLASH,

  // FLASH-LITE tasks — high-volume, cron, bulk
  price_monitor:      GEMINI_MODELS.FLASH_LITE,
  bulk_operation:     GEMINI_MODELS.FLASH_LITE,
  quick_classify:     GEMINI_MODELS.FLASH_LITE,
};

// --------------------------------------------
// TASK-SPECIFIC GENERATION CONFIGS
// --------------------------------------------

interface TaskGenConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
}

const TASK_GEN_CONFIGS: Record<GeminiTaskType, TaskGenConfig> = {
  design_decision:    { maxTokens: 8192, temperature: 0.80, topP: 0.95, topK: 40 },
  urdu_understanding: { maxTokens: 2048, temperature: 0.25, topP: 0.90, topK: 30 },
  image_prompt:       { maxTokens: 2048, temperature: 0.90, topP: 0.95, topK: 50 },
  complex_reasoning:  { maxTokens: 8192, temperature: 0.35, topP: 0.90, topK: 35 },
  creative_writing:   { maxTokens: 6144, temperature: 0.85, topP: 0.95, topK: 45 },
  mood_interpretation:{ maxTokens: 3072, temperature: 0.60, topP: 0.90, topK: 35 },
  theme_generation:   { maxTokens: 8192, temperature: 0.70, topP: 0.92, topK: 40 },
  fallback_code:      { maxTokens: 8192, temperature: 0.15, topP: 0.85, topK: 20 },
  price_monitor:      { maxTokens: 1024, temperature: 0.10, topP: 0.80, topK: 15 },
  bulk_operation:     { maxTokens: 4096, temperature: 0.20, topP: 0.85, topK: 25 },
  quick_classify:     { maxTokens: 512,  temperature: 0.10, topP: 0.80, topK: 15 },
  business_strategy:  { maxTokens: 8192, temperature: 0.40, topP: 0.90, topK: 35 },
  general:            { maxTokens: 4096, temperature: 0.50, topP: 0.90, topK: 35 },
};

// --------------------------------------------
// SYSTEM PROMPTS
// --------------------------------------------

const SYSTEM_PROMPTS: Record<GeminiTaskType, string> = {
  design_decision: `You are a world-class UI/UX designer and creative director for premium e-commerce stores.
You make design decisions that rival top agencies charging $10,000+.
Rules:
- Always provide specific hex colors, exact font names, precise spacing values
- Design for high conversion AND premium aesthetics
- Mobile-first approach always
- Consider loading speed — no heavy elements
- Use proven e-commerce design patterns
- Return structured JSON with complete design specifications
- Think like a luxury brand designer — every pixel matters`,

  urdu_understanding: `You are an expert at understanding Roman Urdu (Urdu written in English alphabet) and mixed Urdu-English messages.
You accurately interpret the user's intent even from casual, informal messages.
Rules:
- Understand slang, abbreviations, and informal Roman Urdu
- Extract the core task/intent from the message
- Handle mixed language (Urdu + English in same sentence)
- Return your interpretation in clear English
- Include confidence level in your interpretation
- If ambiguous, provide the most likely interpretation
- Common patterns: karo=do it, banao=make/create, lagao=apply, hatao=remove, dikhao=show, chalao=run, band karo=stop, update karo=update, check karo=check`,

  image_prompt: `You are an expert at creating detailed image generation prompts for e-commerce product images and store graphics.
Rules:
- Create highly detailed, specific prompts
- Include: style, lighting, composition, colors, mood, background
- Optimize for product photography and marketing materials
- Consider the target audience (US/UK premium shoppers, 25-45)
- Include negative prompts (what to avoid)
- Specify aspect ratios and quality parameters
- Think IT/Graphic design professional level — no generic outputs`,

  complex_reasoning: `You are an advanced strategic reasoning engine for e-commerce business decisions.
You have deep expertise in: Shopify store operations, dropshipping (CJ Dropshipping), US/UK e-commerce markets, conversion rate optimization, and supply chain management.
Rules:
- Analyze problems from multiple angles — business, UX, technical, financial
- Consider downstream effects and second-order consequences
- Provide step-by-step reasoning with clear logic chain
- Quantify impacts where possible (revenue, conversion, time)
- Identify edge cases, risks, and mitigation strategies
- Make concrete, actionable recommendations — no vague advice
- Think like a $500/hour e-commerce consultant with 15 years experience`,

  creative_writing: `You are a world-class e-commerce copywriter who writes content that converts at 3x industry average.
Rules:
- Write copy that converts browsers into buyers using proven psychology
- Triggers: urgency (limited stock/time), social proof, exclusivity, loss aversion, authority
- Match brand tone: premium, trustworthy, modern, approachable
- Target US/UK audience — native-sounding language, cultural references
- SEO-optimized without sacrificing readability or conversion
- Every word earns its place — ruthlessly cut filler
- Headlines that stop scrolling, CTAs that close sales, descriptions that create desire`,

  mood_interpretation: `You are an expert design psychologist who translates vague emotional descriptions into precise, actionable design systems.
Rules:
- Map abstract feelings to exact design elements with scientific precision
- "Premium" → dark navy/black, gold accents, Playfair Display, wide letter-spacing
- "Modern" → clean whites/grays, Inter/Geist font, generous whitespace, subtle shadows
- "Energetic" → bold oranges/reds, large type, dynamic angles, strong contrast
- Always output COMPLETE specifications — every color, every font, every spacing value
- Consider US/UK market design preferences and e-commerce conversion research
- Return JSON with: full color palette, typography stack, spacing system, interaction patterns`,

  theme_generation: `You are a Shopify Dawn theme CSS expert who creates conversion-optimized premium store experiences.
Rules:
- Generate complete, production-ready CSS targeting Shopify Dawn theme selectors
- Cover ALL sections: header, hero, product cards, product page, cart, footer, navigation, buttons, forms, badges
- Mobile-responsive: 320px → 768px → 1024px → 1440px+ breakpoints
- Performance-first: CSS only, no JavaScript, no external resources in CSS
- Conversion-focused: visual hierarchy guides eye to CTA, trust signals prominent
- Use CSS custom properties (--variables) for every design token
- Include: hover states, focus states, active states, transitions (max 300ms)
- Comment every major section clearly`,

  fallback_code: `You are a senior TypeScript/JavaScript engineer handling code generation as Groq fallback.
Rules:
- Write production-ready TypeScript — strict types, no 'any', proper generics
- Handle ALL edge cases: null checks, empty arrays, network failures, type guards
- Follow Next.js 14 App Router conventions
- No placeholders, no TODOs, no incomplete functions
- Complete, deployable, zero-bug code
- Thorough JSDoc comments on all public functions
- Error handling: try/catch with typed errors, meaningful messages`,

  price_monitor: `You are a price analysis engine for dropshipping margin management.
Rules:
- Analyze supplier prices quickly and accurately
- Calculate margins: (selling_price - supplier_price - fees) / selling_price
- Flag items below minimum margin threshold (default: 30%)
- Suggest optimal price adjustments to maintain target margin
- Return structured JSON — fast, minimal, machine-parseable
- No explanations needed — pure data output`,

  bulk_operation: `You are a batch processing engine for e-commerce store operations.
Rules:
- Process items efficiently in structured batches
- Return consistent JSON arrays — one result per input item
- Include success/failure status per item
- Aggregate summary at the end: total, succeeded, failed, warnings
- Handle partial failures gracefully — don't stop on single item error
- Keep responses concise — this is machine-to-machine communication`,

  quick_classify: `You are a fast intent classifier for e-commerce command routing.
Rules:
- Classify user intent in ONE word or short phrase
- Output ONLY the classification — no explanation, no preamble
- Speed is the priority here — minimal token usage
- Be decisive — pick the single best category even if ambiguous`,

  business_strategy: `You are a senior e-commerce strategy consultant specializing in Shopify dropshipping for international markets.
You have deep expertise in: US/UK consumer psychology, CJ Dropshipping supply chain, Shopify conversion optimization, digital marketing (Meta/Google Ads), and Pakistan-based seller tax/compliance (FBR, Payoneer).
Rules:
- Think at CEO level — revenue, margins, growth, risk
- Consider both short-term wins and long-term sustainability
- Provide specific, implementable recommendations with clear ROI
- Address risks honestly — don't just tell what the user wants to hear
- Structure: situation analysis → options → recommendation → action plan → risks`,

  general: `You are the AI brain of CareHub Agent — a complete Shopify dropshipping store automation system targeting US/UK markets.
Context: Owner is Pakistan-based, uses CJ Dropshipping, Payoneer for payments, Vercel hosting.
You understand Roman Urdu and respond in clear English with specific, actionable outputs.
When in doubt, ask one clarifying question rather than assuming wrong.`,
};

// --------------------------------------------
// PER-MODEL RATE LIMITER
// Tracks both RPM (sliding window) and RPD (daily counter)
// --------------------------------------------

class ModelRateLimiter {
  private minuteWindow: number[] = [];        // timestamps of requests in last 60s
  private dailyCount: number = 0;             // requests today
  private dailyResetTime: number;             // midnight UTC in ms
  private readonly rpm: number;
  private readonly rpd: number;
  private readonly modelName: GeminiModelName;

  constructor(modelName: GeminiModelName, rpm: number, rpd: number) {
    this.modelName = modelName;
    this.rpm = rpm;
    this.rpd = rpd;
    this.dailyResetTime = this.getNextMidnightPacific();
  }

  // Pacific Time midnight (Google resets at midnight PT)
  private getNextMidnightPacific(): number {
    const now = new Date();
    // PT is UTC-8 (PST) or UTC-7 (PDT) — use UTC-8 conservatively
    const ptOffset = -8 * 60 * 60 * 1000;
    const ptNow = new Date(now.getTime() + ptOffset);
    const ptMidnight = new Date(ptNow);
    ptMidnight.setUTCHours(24, 0, 0, 0);
    return ptMidnight.getTime() - ptOffset;
  }

  private resetDailyIfNeeded(): void {
    if (Date.now() >= this.dailyResetTime) {
      this.dailyCount = 0;
      this.dailyResetTime = this.getNextMidnightPacific();
      console.log(`[Gemini:${this.modelName}] Daily quota reset`);
    }
  }

  private cleanMinuteWindow(): void {
    const cutoff = Date.now() - 60_000;
    this.minuteWindow = this.minuteWindow.filter(t => t > cutoff);
  }

  /** Returns true if this model can accept a request right now */
  canAccept(): boolean {
    this.resetDailyIfNeeded();
    this.cleanMinuteWindow();
    return this.minuteWindow.length < this.rpm && this.dailyCount < this.rpd;
  }

  /** Returns ms to wait until next RPM slot opens (0 if available now) */
  msUntilRpmSlot(): number {
    this.cleanMinuteWindow();
    if (this.minuteWindow.length < this.rpm) return 0;
    // Oldest request in window — wait until it expires
    return this.minuteWindow[0] + 60_000 - Date.now() + 100;
  }

  /** Record a request — call AFTER canAccept() returns true */
  record(): void {
    this.minuteWindow.push(Date.now());
    this.dailyCount++;
  }

  /** Wait for an RPM slot (blocking) */
  async waitForSlot(): Promise<void> {
    const wait = this.msUntilRpmSlot();
    if (wait > 0) {
      console.log(`[Gemini:${this.modelName}] RPM limit — waiting ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      return this.waitForSlot(); // re-check after waiting
    }
    this.record();
  }

  getStatus(): GeminiQuotaStatus {
    this.resetDailyIfNeeded();
    this.cleanMinuteWindow();
    return {
      model:        this.modelName,
      rpmUsed:      this.minuteWindow.length,
      rpmLimit:     this.rpm,
      rpdUsed:      this.dailyCount,
      rpdLimit:     this.rpd,
      rpmAvailable: Math.max(0, this.rpm - this.minuteWindow.length),
      rpdAvailable: Math.max(0, this.rpd - this.dailyCount),
      healthy:      this.canAccept(),
    };
  }

  isDailyExhausted(): boolean {
    this.resetDailyIfNeeded();
    return this.dailyCount >= this.rpd;
  }
}

// --------------------------------------------
// GEMINI CLIENT — MAIN CLASS
// --------------------------------------------

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private limiters: Record<GeminiModelName, ModelRateLimiter>;
  private isAvailable: boolean = true;
  private lastError: string | null = null;
  private consecutiveErrors: number = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;
  private readonly RECOVERY_DELAY_MS = 5 * 60 * 1000;  // 5 minutes

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('[GeminiClient] GEMINI_API_KEY missing — get from aistudio.google.com');
    }

    this.genAI = new GoogleGenerativeAI(key);

    // Initialize per-model rate limiters
    this.limiters = {
      [GEMINI_MODELS.PRO]:        new ModelRateLimiter(GEMINI_MODELS.PRO,        MODEL_LIMITS[GEMINI_MODELS.PRO].rpm,        MODEL_LIMITS[GEMINI_MODELS.PRO].rpd),
      [GEMINI_MODELS.FLASH]:      new ModelRateLimiter(GEMINI_MODELS.FLASH,      MODEL_LIMITS[GEMINI_MODELS.FLASH].rpm,      MODEL_LIMITS[GEMINI_MODELS.FLASH].rpd),
      [GEMINI_MODELS.FLASH_LITE]: new ModelRateLimiter(GEMINI_MODELS.FLASH_LITE, MODEL_LIMITS[GEMINI_MODELS.FLASH_LITE].rpm, MODEL_LIMITS[GEMINI_MODELS.FLASH_LITE].rpd),
    };
  }

  // --------------------------------------------
  // MODEL SELECTION — Smart fallback resolver
  // --------------------------------------------

  /**
   * Resolves the best available model for a task.
   * Follows fallback chain if preferred model is quota-exhausted.
   * Returns null if ALL models are exhausted (caller should use Groq).
   */
  private resolveModel(preferred: GeminiModelName): GeminiModelName | null {
    let candidate: GeminiModelName | null = preferred;

    while (candidate !== null) {
      if (!this.limiters[candidate].isDailyExhausted()) {
        return candidate;
      }
      console.warn(`[GeminiClient] ${candidate} daily quota exhausted — trying fallback`);
      candidate = FALLBACK_CHAIN[candidate];
    }

    // All Gemini models exhausted
    console.error('[GeminiClient] All Gemini models daily quota exhausted');
    return null;
  }

  // --------------------------------------------
  // CORE CHAT METHOD
  // --------------------------------------------

  async chat(
    messages: GeminiMessage[],
    taskType: GeminiTaskType = 'general',
    modelOverride?: GeminiModelName,
  ): Promise<GeminiResponse> {
    const startTime = Date.now();

    // Global availability check
    if (!this.isAvailable) {
      return {
        success: false,
        content: '',
        model: GEMINI_MODELS.FLASH,
        error: `[GeminiClient] Temporarily unavailable: ${this.lastError}`,
      };
    }

    // Resolve model: override → task map → fallback chain
    const preferredModel = modelOverride ?? TASK_MODEL_MAP[taskType];
    const resolvedModel = this.resolveModel(preferredModel);

    if (!resolvedModel) {
      return {
        success: false,
        content: '',
        model: GEMINI_MODELS.FLASH,
        error: '[GeminiClient] All models quota exhausted — use Groq fallback',
      };
    }

    // Log if we had to downgrade
    const quotaWarning = resolvedModel !== preferredModel
      ? `Downgraded from ${preferredModel} to ${resolvedModel} (quota)`
      : undefined;

    if (quotaWarning) console.warn(`[GeminiClient] ${quotaWarning}`);

    // Wait for RPM slot on resolved model
    await this.limiters[resolvedModel].waitForSlot();

    const genConfig = TASK_GEN_CONFIGS[taskType];
    const systemPrompt = SYSTEM_PROMPTS[taskType];

    try {
      const model: GenerativeModel = this.genAI.getGenerativeModel({
        model: resolvedModel,
        generationConfig: {
          maxOutputTokens: genConfig.maxTokens,
          temperature:     genConfig.temperature,
          topP:            genConfig.topP,
          topK:            genConfig.topK,
        },
        // System instruction — proper Gemini 2.5 way (not hacky first-turn injection)
        systemInstruction: {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
      });

      // Build conversation history (without system prompt — it's in systemInstruction now)
      const contents: Content[] = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      if (contents.length === 0) {
        return {
          success: false,
          content: '',
          model: resolvedModel,
          error: '[GeminiClient] No messages provided',
        };
      }

      // Start chat with history (all messages except last)
      const chatSession = model.startChat({
        history: contents.length > 1 ? contents.slice(0, -1) : [],
      });

      // Send last message
      const lastPart = contents[contents.length - 1].parts[0];
      const result = await chatSession.sendMessage(
        (lastPart as { text: string }).text
      );
      const response = await result.response;
      const content = response.text();

      if (!content || content.trim() === '') {
        throw new Error('Empty response from Gemini API');
      }

      // Success — reset error counters
      this.consecutiveErrors = 0;
      this.isAvailable = true;
      this.lastError = null;

      const meta = response.usageMetadata;

      return {
        success:      true,
        content,
        model:        resolvedModel,
        quotaWarning,
        latencyMs:    Date.now() - startTime,
        usage: meta ? {
          promptTokens:     meta.promptTokenCount     ?? 0,
          completionTokens: meta.candidatesTokenCount ?? 0,
          totalTokens:      meta.totalTokenCount      ?? 0,
        } : undefined,
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.consecutiveErrors++;
      this.lastError = msg;

      console.error(`[GeminiClient:${resolvedModel}] Error (${this.consecutiveErrors}/${this.MAX_CONSECUTIVE_ERRORS}): ${msg}`);

      // Mark globally unavailable after threshold
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.isAvailable = false;
        console.error(`[GeminiClient] Marked UNAVAILABLE — auto-recovery in 5 min`);
        setTimeout(() => {
          this.isAvailable = true;
          this.consecutiveErrors = 0;
          this.lastError = null;
          console.log('[GeminiClient] Auto-recovered ✓');
        }, this.RECOVERY_DELAY_MS);
      }

      return {
        success:   false,
        content:   '',
        model:     resolvedModel,
        error:     msg,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // --------------------------------------------
  // SPECIALIZED HIGH-LEVEL METHODS
  // --------------------------------------------

  /** Interpret Roman Urdu / Hinglish commands → structured English intent */
  async interpretUrdu(message: string): Promise<GeminiResponse> {
    const prompt = `Interpret this Roman Urdu/Hinglish message and extract the user's exact intent:

Message: "${message}"

Return ONLY valid JSON (no markdown, no explanation):
{
  "originalMessage": "${message}",
  "interpretation": "clear English interpretation of what the user wants",
  "intent": "single primary action verb + object (e.g. 'update product prices', 'redesign homepage')",
  "entities": ["extracted entities: product names, colors, numbers, etc"],
  "mood": "detected urgency or emotional tone if any",
  "confidence": 0.0,
  "suggestedAgent": "one of: theme-designer | homepage | product-page | landing-page | upsell-bundle | product-manager | order-fulfillment | price-monitor | content-seo | collections | orchestrator",
  "parameters": {}
}`;

    return this.chat([{ role: 'user', content: prompt }], 'urdu_understanding');
  }

  /** Convert vague mood description → complete design system specification */
  async interpretMood(moodDescription: string): Promise<GeminiResponse> {
    const prompt = `Convert this mood/vibe into a complete, production-ready design system specification:

Mood: "${moodDescription}"
Target Market: US/UK e-commerce shoppers, 25-45, premium segment

Return ONLY valid JSON:
{
  "interpretation": "what this mood means in precise design terms",
  "rationale": "why these design choices match the mood",
  "colors": {
    "primary":    "#hex — main brand color",
    "secondary":  "#hex — supporting color",
    "accent":     "#hex — CTAs, highlights, badges",
    "background": "#hex — page background",
    "surface":    "#hex — cards, panels",
    "surfaceAlt": "#hex — alternate surface (hover states)",
    "text":       "#hex — primary text",
    "textMuted":  "#hex — secondary/caption text",
    "border":     "#hex — dividers, input borders",
    "success":    "#hex",
    "warning":    "#hex",
    "error":      "#hex",
    "overlay":    "rgba — modal/drawer overlay"
  },
  "typography": {
    "headingFont":    "exact Google Font name",
    "bodyFont":       "exact Google Font name",
    "monoFont":       "exact Google Font name for prices/codes",
    "headingWeight":  "700 or 800",
    "bodyWeight":     "400",
    "strongWeight":   "600",
    "baseSize":       "16px",
    "scaleRatio":     "1.25 or 1.333",
    "letterSpacing":  "normal | wide | tight",
    "lineHeight":     "1.5 or 1.6"
  },
  "spacing": {
    "sectionPadding": "px",
    "cardPadding":    "px",
    "elementGap":     "px",
    "borderRadius":   "px",
    "borderRadiusLg": "px",
    "borderRadiusFull": "9999px or px"
  },
  "style": {
    "buttonStyle":       "rounded | sharp | pill",
    "shadowIntensity":   "none | subtle | medium | strong",
    "shadowColor":       "rgba hex",
    "animationLevel":    "none | subtle | moderate",
    "animationDuration": "200ms | 300ms",
    "imageStyle":        "rounded | sharp | circle",
    "layoutDensity":     "spacious | normal | compact",
    "gradientUsage":     "none | subtle | prominent"
  },
  "mood_keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    return this.chat([{ role: 'user', content: prompt }], 'mood_interpretation');
  }

  /** Make a data-driven design decision with full specifications */
  async makeDesignDecision(params: {
    context: string;
    currentDesign?: string;
    userPreference?: string;
    targetAudience?: string;
    constraints?: string[];
  }): Promise<GeminiResponse> {
    const prompt = `Make a precise design decision for this premium Shopify e-commerce store:

Context: ${params.context}
Current design: ${params.currentDesign ?? 'Default Shopify Dawn theme — unstyled'}
User preference: ${params.userPreference ?? 'Premium, high-converting, trustworthy'}
Target audience: ${params.targetAudience ?? 'US/UK online shoppers, 25-45, disposable income'}
Constraints: ${params.constraints?.join(', ') ?? 'Free Shopify theme (Dawn), no custom Liquid, CSS only'}

Provide complete, actionable design specifications as JSON.
Include exact CSS property values — no vague descriptions.
Every decision must have a conversion/UX rationale.`;

    return this.chat([{ role: 'user', content: prompt }], 'design_decision');
  }

  /** Generate complete production-ready Shopify Dawn theme CSS */
  async generateThemeCSS(params: {
    mood: string;
    currentTheme?: string;
    sections?: string[];
    preferences?: Record<string, unknown>;
    existingCSS?: string;
  }): Promise<GeminiResponse> {
    const sectionList = params.sections?.join(', ')
      ?? 'header, announcement-bar, hero/slideshow, product-grid, product-card, product-page, featured-collection, testimonials, trust-badges, newsletter, footer, cart-drawer, mobile-nav, buttons, forms, badges, typography';

    const prompt = `Generate complete production-ready CSS for a Shopify Dawn theme:

Mood/Style: ${params.mood}
Base theme: ${params.currentTheme ?? 'Shopify Dawn (latest)'}
Sections: ${sectionList}
Preferences: ${JSON.stringify(params.preferences ?? {})}
${params.existingCSS ? `Existing CSS to extend/override:\n${params.existingCSS.substring(0, 500)}...` : ''}

REQUIREMENTS:
1. Target actual Dawn theme CSS selectors (.section-*, .product-card*, .btn, etc.)
2. CSS custom properties for ALL design tokens at :root
3. Full mobile breakpoints: 320px, 480px, 768px, 1024px, 1440px
4. Hover + focus + active states on all interactive elements
5. Smooth transitions max 300ms, prefer transform/opacity (GPU accelerated)
6. No !important except where absolutely necessary (override Dawn defaults)
7. Comment every major section

Return ONLY the CSS — no markdown fences, no explanation, pure CSS.`;

    return this.chat([{ role: 'user', content: prompt }], 'theme_generation');
  }

  /** Create detailed image generation prompt for e-commerce assets */
  async generateImagePrompt(params: {
    type: 'product_photo' | 'hero_banner' | 'lifestyle' | 'social_media' | 'logo' | 'icon' | 'ad_creative';
    product?: string;
    mood?: string;
    dimensions?: string;
    style?: string;
    brandColors?: string[];
  }): Promise<GeminiResponse> {
    const prompt = `Create a highly detailed image generation prompt for e-commerce:

Type: ${params.type}
Product: ${params.product ?? 'General premium product'}
Mood: ${params.mood ?? 'Premium, modern, trustworthy'}
Dimensions/Ratio: ${params.dimensions ?? '1:1'}
Style: ${params.style ?? 'Professional studio product photography'}
Brand colors: ${params.brandColors?.join(', ') ?? 'No constraint'}
Target: US/UK premium shoppers, 25-45

Return ONLY valid JSON:
{
  "mainPrompt": "ultra-detailed positive prompt (50+ words)",
  "negativePrompt": "what to avoid (blurry, watermark, text, low quality, etc)",
  "style": "photography | illustration | 3d-render | flat-design",
  "aspectRatio": "ratio",
  "suggestedTool": "Midjourney | DALL-E 3 | Stable Diffusion | Ideogram",
  "toolParams": "model-specific parameters if any",
  "lighting": "detailed lighting description",
  "background": "exact background description",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "alternativeAngles": ["alt prompt 1", "alt prompt 2"]
}`;

    return this.chat([{ role: 'user', content: prompt }], 'image_prompt');
  }

  /** Deep multi-step reasoning for complex business/technical problems */
  async complexReasoning(problem: string, context?: string): Promise<GeminiResponse> {
    const prompt = `Analyze this e-commerce problem with deep, structured reasoning:

Problem: ${problem}
${context ? `Context: ${context}` : ''}

Structure your analysis:
1. SITUATION: What exactly is the problem? What are the known facts?
2. ROOT CAUSE: Why does this problem exist?
3. OPTION ANALYSIS: 3 distinct approaches with pros/cons/trade-offs
4. RECOMMENDATION: Best option with full justification
5. ACTION PLAN: Step-by-step implementation (prioritized)
6. RISKS & MITIGATIONS: What could go wrong and how to prevent it
7. SUCCESS METRICS: How to measure if the solution worked

Be specific, quantitative where possible, and practical.`;

    return this.chat([{ role: 'user', content: prompt }], 'complex_reasoning');
  }

  /** Generate high-converting e-commerce copy */
  async creativeContent(params: {
    type: 'product_description' | 'meta_description' | 'hero_headline' | 'ad_copy' | 'email_subject' | 'cta_button' | 'blog_post' | 'social_caption';
    topic: string;
    tone?: string;
    length?: string;
    audience?: string;
    keywords?: string[];
  }): Promise<GeminiResponse> {
    const prompt = `Create ${params.type} content for a premium Shopify dropshipping store:

Topic/Product: ${params.topic}
Tone: ${params.tone ?? 'Premium, trustworthy, slightly urgent'}
Length: ${params.length ?? 'Optimal for type'}
Audience: ${params.audience ?? 'US/UK online shoppers, 25-45'}
SEO keywords to include: ${params.keywords?.join(', ') ?? 'None specified'}

Make it compelling, unique, and conversion-focused.
Use psychological triggers appropriately (urgency, social proof, exclusivity, authority).
Every word must earn its place.`;

    return this.chat([{ role: 'user', content: prompt }], 'creative_writing');
  }

  /** High-volume price analysis — uses Flash-Lite to conserve Flash/Pro quota */
  async analyzePrices(items: Array<{ id: string; supplierPrice: number; currentPrice: number; targetMargin: number }>): Promise<GeminiResponse> {
    const prompt = `Analyze these product prices and return adjustment recommendations:

Items: ${JSON.stringify(items)}

For each item calculate:
- current_margin = (currentPrice - supplierPrice) / currentPrice
- needed_price = supplierPrice / (1 - targetMargin)
- action: "increase" | "ok" | "urgent_increase"

Return ONLY valid JSON array:
[{ "id": "...", "current_margin": 0.00, "needed_price": 0.00, "action": "...", "priority": "high|medium|low" }]`;

    return this.chat([{ role: 'user', content: prompt }], 'price_monitor');
  }

  /** Strategic business analysis — uses Pro model for depth */
  async businessStrategy(situation: string, goals: string[]): Promise<GeminiResponse> {
    const prompt = `Strategic analysis for CareHub Shopify dropshipping store:

Situation: ${situation}
Goals: ${goals.join(', ')}
Store context: US/UK market, CJ Dropshipping supplier, Pakistan-based owner, Payoneer payments

Provide executive-level strategic analysis with specific, actionable recommendations.
Consider: revenue impact, implementation complexity, time-to-result, risks.`;

    return this.chat([{ role: 'user', content: prompt }], 'business_strategy');
  }

  // --------------------------------------------
  // JSON EXTRACTION HELPER
  // Tries to parse JSON from response, with auto-fix attempt
  // --------------------------------------------

  async chatJSON<T>(
    messages: GeminiMessage[],
    taskType: GeminiTaskType = 'general',
    modelOverride?: GeminiModelName,
  ): Promise<{ success: boolean; data?: T; error?: string; model?: GeminiModelName }> {
    const response = await this.chat(messages, taskType, modelOverride);

    if (!response.success) {
      return { success: false, error: response.error, model: response.model };
    }

    const parsed = this.extractJSON<T>(response.content);
    if (parsed !== null) {
      return { success: true, data: parsed, model: response.model };
    }

    // Auto-fix: ask Gemini to correct the JSON
    console.warn(`[GeminiClient] JSON parse failed — attempting auto-fix`);
    const fixResponse = await this.chat(
      [{
        role: 'user',
        content: `The following text should be valid JSON but isn't. Fix all syntax errors and return ONLY the corrected JSON — no markdown, no explanation:\n\n${response.content}`,
      }],
      'quick_classify',  // Use Flash-Lite for cheap fix attempt
    );

    if (fixResponse.success) {
      const fixedParsed = this.extractJSON<T>(fixResponse.content);
      if (fixedParsed !== null) {
        return { success: true, data: fixedParsed, model: fixResponse.model };
      }
    }

    return {
      success: false,
      error: `JSON parse failed. Raw: ${response.content.substring(0, 300)}`,
      model: response.model,
    };
  }

  /** Extract JSON object or array from a string (handles markdown fences) */
  private extractJSON<T>(text: string): T | null {
    try {
      // Strip markdown code fences
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      let str = fenceMatch ? fenceMatch[1].trim() : text.trim();

      // Find first JSON object or array
      const objMatch = str.match(/(\{[\s\S]*\})/);
      const arrMatch = str.match(/(\[[\s\S]*\])/);
      if (objMatch) str = objMatch[1];
      else if (arrMatch) str = arrMatch[1];

      return JSON.parse(str) as T;
    } catch {
      return null;
    }
  }

  // --------------------------------------------
  // MULTI-TURN CONVERSATION
  // --------------------------------------------

  async multiTurnChat(
    conversationHistory: GeminiMessage[],
    newMessage: string,
    taskType: GeminiTaskType = 'general',
    modelOverride?: GeminiModelName,
  ): Promise<GeminiResponse> {
    return this.chat(
      [...conversationHistory, { role: 'user', content: newMessage }],
      taskType,
      modelOverride,
    );
  }

  // --------------------------------------------
  // STATUS, HEALTH & QUOTA MONITORING
  // --------------------------------------------

  /** Get the best currently-available model (highest capability with quota remaining) */
  getBestAvailableModel(): GeminiModelName {
    for (const model of [GEMINI_MODELS.PRO, GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_LITE] as GeminiModelName[]) {
      if (this.limiters[model].canAccept()) return model;
    }
    return GEMINI_MODELS.FLASH_LITE;  // last resort
  }

  getQuotaStatus(): Record<GeminiModelName, GeminiQuotaStatus> {
    return {
      [GEMINI_MODELS.PRO]:        this.limiters[GEMINI_MODELS.PRO].getStatus(),
      [GEMINI_MODELS.FLASH]:      this.limiters[GEMINI_MODELS.FLASH].getStatus(),
      [GEMINI_MODELS.FLASH_LITE]: this.limiters[GEMINI_MODELS.FLASH_LITE].getStatus(),
    };
  }

  getSystemStatus(): GeminiSystemStatus {
    return {
      available:        this.isAvailable,
      lastError:        this.lastError,
      consecutiveErrors:this.consecutiveErrors,
      quota:            this.getQuotaStatus(),
      recommendedModel: this.getBestAvailableModel(),
    };
  }

  isHealthy(): boolean {
    return this.isAvailable
      && this.consecutiveErrors < 3
      && Object.values(this.getQuotaStatus()).some(s => s.healthy);
  }

  /** Force reset — use only for testing or manual recovery */
  resetStatus(): void {
    this.isAvailable = true;
    this.consecutiveErrors = 0;
    this.lastError = null;
    console.log('[GeminiClient] Status manually reset');
  }

/** Backward compatibility alias — ai-router.ts uses getStatus() */
  getStatus() {
    const s = this.getSystemStatus();
    return {
      available:         s.available,
      lastError:         s.lastError,
      remainingRequests: s.quota[GEMINI_MODELS.FLASH].rpmAvailable,
      consecutiveErrors: s.consecutiveErrors,
    };
  }
}
// --------------------------------------------
// SINGLETON — one instance per process
// --------------------------------------------

let geminiInstance: GeminiClient | null = null;

export function getGeminiClient(apiKey?: string): GeminiClient {
  if (!geminiInstance) {
    geminiInstance = new GeminiClient(apiKey);
  }
  return geminiInstance;
}

export function resetGeminiClient(): void {
  geminiInstance = null;
}
