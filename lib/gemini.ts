// ============================================
// CAREHUB AI AGENT — GEMINI CLIENT (3.5 FLASH)
// ============================================
// Creative AI for: Design decisions, Urdu understanding,
// Image generation prompts, Complex reasoning, Fallback.
// Free tier: 60 requests/minute, 1M tokens/day
// ============================================

import { GoogleGenerativeAI, GenerativeModel, Content, Part } from '@google/generative-ai';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
}

export interface GeminiResponse {
  success: boolean;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  latencyMs?: number;
}

export type GeminiTaskType =
  | 'design_decision'
  | 'urdu_understanding'
  | 'image_prompt'
  | 'complex_reasoning'
  | 'creative_writing'
  | 'mood_interpretation'
  | 'theme_generation'
  | 'fallback_code'
  | 'general';

// --------------------------------------------
// TASK-SPECIFIC CONFIGURATIONS
// --------------------------------------------

const TASK_CONFIGS: Record<GeminiTaskType, Partial<GeminiConfig>> = {
  design_decision: {
    model: 'gemini-2.0-flash',
    maxTokens: 8000,
    temperature: 0.8,
    topP: 0.95,
    topK: 40,
  },
  urdu_understanding: {
    model: 'gemini-2.0-flash',
    maxTokens: 4000,
    temperature: 0.3,
    topP: 0.9,
    topK: 30,
  },
  image_prompt: {
    model: 'gemini-2.0-flash',
    maxTokens: 3000,
    temperature: 0.9,
    topP: 0.95,
    topK: 50,
  },
  complex_reasoning: {
    model: 'gemini-2.0-flash',
    maxTokens: 8000,
    temperature: 0.4,
    topP: 0.9,
    topK: 35,
  },
  creative_writing: {
    model: 'gemini-2.0-flash',
    maxTokens: 6000,
    temperature: 0.85,
    topP: 0.95,
    topK: 45,
  },
  mood_interpretation: {
    model: 'gemini-2.0-flash',
    maxTokens: 4000,
    temperature: 0.6,
    topP: 0.9,
    topK: 35,
  },
  theme_generation: {
    model: 'gemini-2.0-flash',
    maxTokens: 8000,
    temperature: 0.7,
    topP: 0.92,
    topK: 40,
  },
  fallback_code: {
    model: 'gemini-2.0-flash',
    maxTokens: 8000,
    temperature: 0.2,
    topP: 0.85,
    topK: 20,
  },
  general: {
    model: 'gemini-2.0-flash',
    maxTokens: 4000,
    temperature: 0.5,
    topP: 0.9,
    topK: 35,
  },
};

// --------------------------------------------
// SYSTEM PROMPTS FOR DIFFERENT TASKS
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
- If ambiguous, provide most likely interpretation
- Common patterns: "karo" = do it, "banao" = make/create, "lagao" = apply, "hatao" = remove, "dikhao" = show`,

  image_prompt: `You are an expert at creating detailed image generation prompts for e-commerce product images and store graphics.
Rules:
- Create highly detailed, specific prompts
- Include: style, lighting, composition, colors, mood, background
- Optimize for product photography and marketing materials
- Consider the target audience (US/UK premium shoppers)
- Include negative prompts (what to avoid)
- Specify aspect ratios and quality parameters
- Think IT/Graphic design professional level`,

  complex_reasoning: `You are an advanced reasoning engine for e-commerce business decisions.
Rules:
- Analyze problems from multiple angles
- Consider business impact, user experience, and technical feasibility
- Provide step-by-step reasoning
- Quantify impacts where possible
- Consider edge cases and potential issues
- Make data-driven recommendations
- Think like a $200/hour e-commerce consultant`,

  creative_writing: `You are a premium e-commerce copywriter who writes content that sells.
Rules:
- Write copy that converts browsers into buyers
- Use psychological triggers: urgency, social proof, exclusivity
- Match the brand tone (premium, trustworthy, modern)
- Target US/UK audience language and preferences
- SEO-friendly without sacrificing readability
- Every word earns its place — no filler
- Headlines that stop scrolling, descriptions that close sales`,

  mood_interpretation: `You are an expert at interpreting vague mood descriptions and converting them into actionable design specifications.
Rules:
- When user says "premium" — translate to specific colors, fonts, spacing
- When user says "modern" — translate to exact design elements
- When user says "attractive" — determine what makes it attractive for the target audience
- Always output complete, actionable specifications
- Consider cultural context (US/UK market preferences)
- Map emotions to design elements precisely
- Return JSON with: colors (primary, secondary, accent, background, text), fonts (heading, body), spacing, style elements`,

  theme_generation: `You are a Shopify theme customization expert who creates stunning store designs.
Rules:
- Generate complete CSS that transforms a basic Shopify theme into a premium experience
- Include: colors, typography, spacing, buttons, cards, headers, footers, animations
- Mobile-responsive — looks perfect on all devices
- Fast loading — no heavy animations or unnecessary elements
- High-converting — every design choice serves a business purpose
- Trust-building — professional, credible, premium feel
- Return production-ready CSS code`,

  fallback_code: `You are a code generation expert. This is a fallback task — Groq is unavailable, so you're handling code generation.
Rules:
- Write production-ready TypeScript, Liquid, CSS, JavaScript
- Handle all edge cases
- Follow best practices
- No placeholders or TODOs
- Complete, working, deployable code
- Well-commented and structured`,

  general: `You are the AI brain of CareHub Agent — a complete Shopify store automation system.
You help with design, content, strategy, and any task that requires creativity or deep understanding.
You understand Roman Urdu and respond in English with actionable outputs.`,
};

// --------------------------------------------
// RATE LIMITER
// --------------------------------------------

class GeminiRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 55, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      console.log(`[Gemini] Rate limit approaching — waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
  }

  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.maxRequests - this.requests.length;
  }
}

// --------------------------------------------
// GEMINI CLIENT CLASS
// --------------------------------------------

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private rateLimiter: GeminiRateLimiter;
  private isAvailable: boolean = true;
  private lastError: string | null = null;
  private consecutiveErrors: number = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required — get from aistudio.google.com');
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.rateLimiter = new GeminiRateLimiter(55, 60000);
  }

  // --------------------------------------------
  // MAIN CHAT METHOD
  // --------------------------------------------

  async chat(
    messages: GeminiMessage[],
    taskType: GeminiTaskType = 'general',
    overrides?: Partial<GeminiConfig>
  ): Promise<GeminiResponse> {
    const startTime = Date.now();
    const config = { ...TASK_CONFIGS[taskType], ...overrides };

    // Check availability
    if (!this.isAvailable) {
      return {
        success: false,
        content: '',
        model: config.model || 'gemini-2.0-flash',
        error: `Gemini temporarily unavailable: ${this.lastError}`,
      };
    }

    // Wait for rate limit slot
    await this.rateLimiter.waitForSlot();

    try {
      const model: GenerativeModel = this.genAI.getGenerativeModel({
        model: config.model || 'gemini-2.0-flash',
        generationConfig: {
          maxOutputTokens: config.maxTokens || 4000,
          temperature: config.temperature ?? 0.5,
          topP: config.topP ?? 0.9,
          topK: config.topK ?? 35,
        },
      });

      // Build conversation history
      const systemPrompt = SYSTEM_PROMPTS[taskType];
      const contents: Content[] = [];

      // Add system prompt as first user message + model acknowledgment
      contents.push({
        role: 'user',
        parts: [{ text: `System Instructions: ${systemPrompt}\n\nAcknowledge and follow these instructions.` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions precisely for all responses.' }],
      });

      // Add conversation messages
      for (const msg of messages) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }

      // Generate response
      const chat = model.startChat({
        history: contents.slice(0, -1),
      });

      const lastMessage = contents[contents.length - 1];
      const result = await chat.sendMessage(lastMessage.parts[0].text || '');
      const response = await result.response;
      const content = response.text();

      // Get usage metadata
      const usageMetadata = response.usageMetadata;

      // Reset error counter on success
      this.consecutiveErrors = 0;
      this.isAvailable = true;
      this.lastError = null;

      return {
        success: true,
        content,
        model: config.model || 'gemini-2.0-flash',
        usage: usageMetadata ? {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
        } : undefined,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Gemini error';
      this.consecutiveErrors++;
      this.lastError = errorMessage;

      // Mark as unavailable after too many consecutive errors
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.isAvailable = false;
        console.error(`[Gemini] Marked unavailable after ${this.MAX_CONSECUTIVE_ERRORS} consecutive errors`);

        // Auto-recover after 5 minutes
        setTimeout(() => {
          this.isAvailable = true;
          this.consecutiveErrors = 0;
          console.log('[Gemini] Auto-recovered — marking as available');
        }, 5 * 60 * 1000);
      }

      return {
        success: false,
        content: '',
        model: config.model || 'gemini-2.0-flash',
        error: errorMessage,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // --------------------------------------------
  // SPECIALIZED METHODS
  // --------------------------------------------

  async interpretUrdu(message: string): Promise<GeminiResponse> {
    const prompt = `Interpret this Roman Urdu/mixed message and extract the exact intent:

Message: "${message}"

Return JSON:
{
  "originalMessage": "the message",
  "interpretation": "clear English interpretation",
  "intent": "primary action intent",
  "entities": ["extracted entities like product names, colors, etc"],
  "mood": "detected mood/tone if any",
  "confidence": 0.0-1.0,
  "suggestedAgent": "which agent should handle this (theme-designer/homepage/product-page/landing-page/upsell-bundle/product-manager/order-fulfillment/price-monitor/content-seo/collections)",
  "parameters": {}
}`;

    return this.chat([{ role: 'user', content: prompt }], 'urdu_understanding');
  }

  async interpretMood(moodDescription: string): Promise<GeminiResponse> {
    const prompt = `Convert this mood/vibe description into complete actionable design specifications:

Mood: "${moodDescription}"

Return JSON:
{
  "interpretation": "what this mood means in design terms",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "border": "#hex",
    "success": "#hex",
    "error": "#hex"
  },
  "typography": {
    "headingFont": "Google Font name",
    "bodyFont": "Google Font name",
    "headingWeight": "700",
    "bodyWeight": "400",
    "headingStyle": "normal/italic",
    "letterSpacing": "normal/wide/tight"
  },
  "spacing": {
    "sectionPadding": "px value",
    "cardPadding": "px value",
    "elementGap": "px value",
    "borderRadius": "px value"
  },
  "style": {
    "buttonStyle": "rounded/sharp/pill",
    "shadowIntensity": "none/subtle/medium/strong",
    "animationLevel": "none/subtle/moderate",
    "imageStyle": "rounded/sharp/circle",
    "layoutDensity": "spacious/normal/compact"
  },
  "mood_keywords": ["keyword1", "keyword2"]
}`;

    return this.chat([{ role: 'user', content: prompt }], 'mood_interpretation');
  }

  async makeDesignDecision(params: {
    context: string;
    currentDesign?: string;
    userPreference?: string;
    targetAudience?: string;
  }): Promise<GeminiResponse> {
    const prompt = `Make a design decision for this e-commerce store:

Context: ${params.context}
Current design: ${params.currentDesign || 'None/Default Shopify theme'}
User preference: ${params.userPreference || 'Premium, high-converting'}
Target audience: ${params.targetAudience || 'US/UK online shoppers, 25-45 age group'}

Provide complete design specifications as actionable JSON that can be directly implemented.
Include specific CSS properties, exact values, no vague descriptions.`;

    return this.chat([{ role: 'user', content: prompt }], 'design_decision');
  }

  async generateThemeCSS(params: {
    mood: string;
    currentTheme?: string;
    sections?: string[];
    preferences?: Record<string, any>;
  }): Promise<GeminiResponse> {
    const prompt = `Generate complete production-ready CSS for a Shopify store theme:

Mood/Style: ${params.mood}
Current theme: ${params.currentTheme || 'Default Dawn theme'}
Sections to style: ${params.sections?.join(', ') || 'All — header, hero, products, footer, buttons, cards, typography'}
Additional preferences: ${JSON.stringify(params.preferences || {})}

Requirements:
- Complete CSS — every section styled
- Mobile responsive (320px to 1440px+)
- Fast loading — no complex animations
- High converting — proven design patterns
- Trust-building — professional appearance
- Compatible with Shopify Dawn theme structure
- Use CSS custom properties (variables) for easy customization
- Include hover states, transitions, focus states
- Dark/light mode considerations

Return ONLY the CSS code, wrapped in a single code block. No explanation needed.`;

    return this.chat([{ role: 'user', content: prompt }], 'theme_generation');
  }

  async generateImagePrompt(params: {
    type: 'product_photo' | 'hero_banner' | 'lifestyle' | 'social_media' | 'logo' | 'icon';
    product?: string;
    mood?: string;
    dimensions?: string;
    style?: string;
  }): Promise<GeminiResponse> {
    const prompt = `Create a detailed image generation prompt:

Type: ${params.type}
Product: ${params.product || 'General store imagery'}
Mood: ${params.mood || 'Premium, modern'}
Dimensions: ${params.dimensions || '1:1'}
Style: ${params.style || 'Professional product photography'}

Return JSON:
{
  "mainPrompt": "detailed positive prompt",
  "negativePrompt": "things to avoid",
  "style": "photography/illustration/3d/flat",
  "aspectRatio": "ratio",
  "quality": "settings",
  "lighting": "lighting description",
  "background": "background description",
  "colorPalette": ["#hex1", "#hex2", "#hex3"]
}`;

    return this.chat([{ role: 'user', content: prompt }], 'image_prompt');
  }

  async complexReasoning(problem: string, context?: string): Promise<GeminiResponse> {
    const prompt = `Analyze this problem with deep reasoning:

Problem: ${problem}
${context ? `Context: ${context}` : ''}

Provide:
1. Problem breakdown
2. Multiple solution approaches
3. Best recommendation with reasoning
4. Implementation steps
5. Potential risks and mitigations
6. Expected outcomes`;

    return this.chat([{ role: 'user', content: prompt }], 'complex_reasoning');
  }

  async creativeContent(params: {
    type: string;
    topic: string;
    tone?: string;
    length?: string;
    audience?: string;
  }): Promise<GeminiResponse> {
    const prompt = `Create ${params.type} content:

Topic: ${params.topic}
Tone: ${params.tone || 'Premium, trustworthy'}
Length: ${params.length || 'Appropriate for type'}
Audience: ${params.audience || 'US/UK online shoppers'}

Make it compelling, unique, and conversion-focused. Every word should serve a purpose.`;

    return this.chat([{ role: 'user', content: prompt }], 'creative_writing');
  }

  // --------------------------------------------
  // JSON EXTRACTION HELPER
  // --------------------------------------------

  async chatJSON<T>(
    messages: GeminiMessage[],
    taskType: GeminiTaskType = 'general'
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const response = await this.chat(messages, taskType);

    if (!response.success) {
      return { success: false, error: response.error };
    }

    try {
      let jsonStr = response.content;

      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // Try to find JSON object or array
      const objectMatch = jsonStr.match(/(\{[\s\S]*\})/);
      const arrayMatch = jsonStr.match(/(\[[\s\S]*\])/);

      if (objectMatch) {
        jsonStr = objectMatch[1];
      } else if (arrayMatch) {
        jsonStr = arrayMatch[1];
      }

      const data = JSON.parse(jsonStr) as T;
      return { success: true, data };
    } catch {
      // Second attempt — ask Gemini to fix the JSON
      const fixResponse = await this.chat(
        [{ role: 'user', content: `Fix this into valid JSON. Return ONLY the JSON, nothing else:\n\n${response.content}` }],
        'general'
      );

      if (fixResponse.success) {
        try {
          let fixedJson = fixResponse.content;
          const match = fixedJson.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) fixedJson = match[1].trim();
          const objMatch = fixedJson.match(/(\{[\s\S]*\})/);
          if (objMatch) fixedJson = objMatch[1];

          const data = JSON.parse(fixedJson) as T;
          return { success: true, data };
        } catch {
          return { success: false, error: `Failed to parse JSON even after fix attempt` };
        }
      }

      return {
        success: false,
        error: `Failed to parse JSON from response: ${response.content.substring(0, 200)}`,
      };
    }
  }

  // --------------------------------------------
  // MULTI-TURN CONVERSATION
  // --------------------------------------------

  async multiTurnChat(
    conversationHistory: GeminiMessage[],
    newMessage: string,
    taskType: GeminiTaskType = 'general'
  ): Promise<GeminiResponse> {
    const messages: GeminiMessage[] = [
      ...conversationHistory,
      { role: 'user', content: newMessage },
    ];
    return this.chat(messages, taskType);
  }

  // --------------------------------------------
  // STATUS & HEALTH
  // --------------------------------------------

  getStatus(): {
    available: boolean;
    lastError: string | null;
    remainingRequests: number;
    consecutiveErrors: number;
  } {
    return {
      available: this.isAvailable,
      lastError: this.lastError,
      remainingRequests: this.rateLimiter.getRemaining(),
      consecutiveErrors: this.consecutiveErrors,
    };
  }

  isHealthy(): boolean {
    return this.isAvailable && this.consecutiveErrors < 3;
  }

  resetStatus(): void {
    this.isAvailable = true;
    this.consecutiveErrors = 0;
    this.lastError = null;
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
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
