// ============================================
// CAREHUB AI AGENT — GROQ CLIENT (LLAMA 4)
// ============================================
// Fast AI for: Code generation, Shopify API calls,
// Price calculations, structured outputs, quick tasks.
// Free tier: 30 requests/minute, 6000 tokens/minute
// ============================================

import Groq from 'groq-sdk';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface GroqResponse {
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

export interface GroqStreamChunk {
  content: string;
  done: boolean;
}

export type GroqTaskType =
  | 'code_generation'
  | 'shopify_api'
  | 'price_calculation'
  | 'structured_output'
  | 'quick_response'
  | 'content_writing'
  | 'data_analysis'
  | 'general';

// --------------------------------------------
// TASK-SPECIFIC CONFIGURATIONS
// --------------------------------------------

const TASK_CONFIGS: Record<GroqTaskType, Partial<GroqConfig>> = {
  code_generation: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 8000,
    temperature: 0.2,
    topP: 0.9,
  },
  shopify_api: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4000,
    temperature: 0.1,
    topP: 0.85,
  },
  price_calculation: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 2000,
    temperature: 0.0,
    topP: 0.8,
  },
  structured_output: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4000,
    temperature: 0.1,
    topP: 0.85,
  },
  quick_response: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 2000,
    temperature: 0.3,
    topP: 0.9,
  },
  content_writing: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 6000,
    temperature: 0.7,
    topP: 0.95,
  },
  data_analysis: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4000,
    temperature: 0.1,
    topP: 0.8,
  },
  general: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4000,
    temperature: 0.4,
    topP: 0.9,
  },
};

// --------------------------------------------
// SYSTEM PROMPTS FOR DIFFERENT TASKS
// --------------------------------------------

const SYSTEM_PROMPTS: Record<GroqTaskType, string> = {
  code_generation: `You are an expert code generator for a Shopify store automation system called CareHub Agent. 
You write production-ready TypeScript, Liquid, CSS, and JavaScript code.
Rules:
- Write clean, well-structured, commented code
- Use TypeScript strict mode conventions
- Handle all edge cases and errors
- No placeholders or TODOs — complete working code only
- Follow Shopify best practices for Liquid/theme code
- Optimize for performance and readability`,

  shopify_api: `You are a Shopify API expert. You plan and structure Shopify Admin API calls.
Rules:
- Use REST Admin API 2024-10 version
- Structure responses as actionable JSON plans
- Include error handling strategies
- Consider rate limits (40 calls/second burst, 2/second sustained)
- Always validate data before API calls
- Return structured action plans the system can execute`,

  price_calculation: `You are a pricing and margin calculator for a dropshipping business.
Rules:
- All calculations must be precise to 2 decimal places
- Consider: cost price, profit margin, competitor pricing, psychological pricing
- Apply psychological pricing (e.g., $29.99 instead of $30.00)
- Always maintain minimum profit margins
- Factor in shipping costs if applicable
- Return calculations as structured JSON`,

  structured_output: `You are a data structuring expert. You convert unstructured input into clean, structured JSON output.
Rules:
- Always return valid JSON
- Use consistent naming conventions (camelCase)
- Include all necessary fields
- Validate data types
- Handle missing/null values gracefully`,

  quick_response: `You are a fast, concise assistant for the CareHub AI Agent system.
Rules:
- Keep responses brief and actionable
- No unnecessary explanations
- Direct answers only
- If action needed, specify exact steps`,

  content_writing: `You are an expert e-commerce copywriter specializing in high-converting product content.
Rules:
- Write compelling, benefit-focused copy
- Use power words that drive action
- Include social proof language
- Create urgency without being pushy
- SEO-optimized with natural keyword usage
- Appropriate for US/UK audience`,

  data_analysis: `You are a data analyst for e-commerce metrics.
Rules:
- Analyze data patterns and trends
- Provide actionable insights
- Use precise numbers and percentages
- Compare against industry benchmarks
- Suggest optimizations based on data`,

  general: `You are an AI assistant for the CareHub Shopify store automation system.
You help with various tasks related to running a dropshipping store targeting US/UK markets.
Be helpful, precise, and action-oriented.`,
};

// --------------------------------------------
// RATE LIMITER
// --------------------------------------------

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 28, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      console.log(`[Groq] Rate limit approaching — waiting ${waitTime}ms`);
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
// GROQ CLIENT CLASS
// --------------------------------------------

export class GroqClient {
  private client: Groq;
  private rateLimiter: RateLimiter;
  private isAvailable: boolean = true;
  private lastError: string | null = null;
  private consecutiveErrors: number = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('GROQ_API_KEY is required — get from console.groq.com');
    }

    this.client = new Groq({ apiKey: key });
    this.rateLimiter = new RateLimiter(28, 60000);
  }

  // --------------------------------------------
  // MAIN CHAT METHOD
  // --------------------------------------------

  async chat(
    messages: GroqMessage[],
    taskType: GroqTaskType = 'general',
    overrides?: Partial<GroqConfig>
  ): Promise<GroqResponse> {
    const startTime = Date.now();
    const config = { ...TASK_CONFIGS[taskType], ...overrides };

    // Check if Groq is available
    if (!this.isAvailable) {
      return {
        success: false,
        content: '',
        model: config.model || 'llama-3.3-70b-versatile',
        error: `Groq temporarily unavailable: ${this.lastError}`,
      };
    }

    // Wait for rate limit slot
    await this.rateLimiter.waitForSlot();

    // Prepend system prompt if not already present
    const systemPrompt = SYSTEM_PROMPTS[taskType];
    const fullMessages: GroqMessage[] = messages[0]?.role === 'system'
      ? messages
      : [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      const completion = await this.client.chat.completions.create({
        model: config.model || 'llama-3.3-70b-versatile',
        messages: fullMessages,
        max_tokens: config.maxTokens || 4000,
        temperature: config.temperature ?? 0.4,
        top_p: config.topP ?? 0.9,
        stream: false,
      });

      const content = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;

      // Reset error counter on success
      this.consecutiveErrors = 0;
      this.isAvailable = true;
      this.lastError = null;

      return {
        success: true,
        content,
        model: config.model || 'llama-3.3-70b-versatile',
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Groq error';
      this.consecutiveErrors++;
      this.lastError = errorMessage;

      // Mark as unavailable after too many consecutive errors
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.isAvailable = false;
        console.error(`[Groq] Marked unavailable after ${this.MAX_CONSECUTIVE_ERRORS} consecutive errors`);

        // Auto-recover after 5 minutes
        setTimeout(() => {
          this.isAvailable = true;
          this.consecutiveErrors = 0;
          console.log('[Groq] Auto-recovered — marking as available');
        }, 5 * 60 * 1000);
      }

      return {
        success: false,
        content: '',
        model: config.model || 'llama-3.3-70b-versatile',
        error: errorMessage,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // --------------------------------------------
  // SPECIALIZED METHODS
  // --------------------------------------------

  async generateCode(prompt: string, context?: string): Promise<GroqResponse> {
    const messages: GroqMessage[] = [];
    if (context) {
      messages.push({ role: 'user', content: `Context: ${context}` });
      messages.push({ role: 'assistant', content: 'Understood. I have the context.' });
    }
    messages.push({ role: 'user', content: prompt });
    return this.chat(messages, 'code_generation');
  }

  async planShopifyAction(task: string, currentState?: string): Promise<GroqResponse> {
    const messages: GroqMessage[] = [];
    if (currentState) {
      messages.push({
        role: 'user',
        content: `Current store state: ${currentState}\n\nTask: ${task}\n\nPlan the exact Shopify API calls needed. Return as JSON array of actions.`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `Task: ${task}\n\nPlan the exact Shopify API calls needed. Return as JSON array of actions.`,
      });
    }
    return this.chat(messages, 'shopify_api');
  }

  async calculatePricing(params: {
    costPrice: number;
    targetMargin: number;
    competitorPrices?: number[];
    category?: string;
  }): Promise<GroqResponse> {
    const prompt = `Calculate optimal pricing:
- Cost price: $${params.costPrice}
- Target margin: ${params.targetMargin}%
- Competitor prices: ${params.competitorPrices?.map(p => `$${p}`).join(', ') || 'N/A'}
- Category: ${params.category || 'General'}

Return JSON with: sellingPrice, compareAtPrice, actualMargin, priceJustification`;

    return this.chat([{ role: 'user', content: prompt }], 'price_calculation');
  }

  async structureData(input: string, outputFormat: string): Promise<GroqResponse> {
    const prompt = `Convert this input into structured data:

Input: ${input}

Required output format: ${outputFormat}

Return ONLY valid JSON, no markdown, no explanation.`;

    return this.chat([{ role: 'user', content: prompt }], 'structured_output');
  }

  async quickAnswer(question: string): Promise<GroqResponse> {
    return this.chat([{ role: 'user', content: question }], 'quick_response');
  }

  async writeContent(params: {
    type: 'product_description' | 'meta_title' | 'meta_description' | 'ad_copy' | 'blog_post' | 'social_caption';
    product?: string;
    keywords?: string[];
    tone?: string;
    maxLength?: number;
  }): Promise<GroqResponse> {
    const prompt = `Write ${params.type.replace('_', ' ')}:
- Product/Topic: ${params.product || 'N/A'}
- Keywords: ${params.keywords?.join(', ') || 'N/A'}
- Tone: ${params.tone || 'professional, compelling'}
- Max length: ${params.maxLength || 'appropriate for type'}
- Target audience: US/UK online shoppers

Write compelling, conversion-focused content. No filler words.`;

    return this.chat([{ role: 'user', content: prompt }], 'content_writing');
  }

  async analyzeData(data: string, question: string): Promise<GroqResponse> {
    const prompt = `Analyze this data and answer the question:

Data: ${data}

Question: ${question}

Provide actionable insights with specific numbers.`;

    return this.chat([{ role: 'user', content: prompt }], 'data_analysis');
  }

  // --------------------------------------------
  // JSON EXTRACTION HELPER
  // --------------------------------------------

  async chatJSON<T>(
    messages: GroqMessage[],
    taskType: GroqTaskType = 'structured_output'
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const response = await this.chat(messages, taskType);

    if (!response.success) {
      return { success: false, error: response.error };
    }

    try {
      // Try to extract JSON from response
      let jsonStr = response.content;

      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // Try to find JSON object or array
      const objectMatch = jsonStr.match(/(\{[\s\S]*\})/);
      const arrayMatch = jsonStr.match(/($$[\s\S]*$$)/);

      if (objectMatch) {
        jsonStr = objectMatch[1];
      } else if (arrayMatch) {
        jsonStr = arrayMatch[1];
      }

      const data = JSON.parse(jsonStr) as T;
      return { success: true, data };
    } catch {
      return {
        success: false,
        error: `Failed to parse JSON from response: ${response.content.substring(0, 200)}`,
      };
    }
  }

  // --------------------------------------------
  // STATUS & HEALTH
  // --------------------------------------------

  getStatus(): { available: boolean; lastError: string | null; remainingRequests: number; consecutiveErrors: number } {
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

let groqInstance: GroqClient | null = null;

export function getGroqClient(apiKey?: string): GroqClient {
  if (!groqInstance) {
    groqInstance = new GroqClient(apiKey);
  }
  return groqInstance;
}

export function resetGroqClient(): void {
  groqInstance = null;
}
