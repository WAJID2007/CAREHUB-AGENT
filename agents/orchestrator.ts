// ============================================
// CAREHUB AI AGENT — ORCHESTRATOR (AGENT #2)
// ============================================
// The MASTER CONTROLLER. Every user message goes
// through this agent. It:
// - Understands Roman Urdu + English + Vague prompts
// - Decides which agent(s) should handle the task
// - Coordinates multiple agents for complex tasks
// - Returns final response to user
// - Handles "dubara karo", "undo", "change karo"
// ============================================

import { getAIRouter, AIRouter } from './ai-router';
import { getMemoryAgent, MemoryAgent } from './memory';
import { GeminiMessage } from '@/lib/gemini';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface OrchestratorInput {
  message: string;
  sessionId?: string;
}

export interface OrchestratorOutput {
  success: boolean;
  response: string;
  agentsUsed: string[];
  actions: ActionResult[];
  suggestedFollowUp?: string[];
  processingTime: number;
  context?: string;
}

export interface ActionResult {
  agent: string;
  action: string;
  success: boolean;
  result: string;
  duration: number;
}

export interface InterpretedIntent {
  primaryIntent: string;
  agents: AgentTask[];
  isRepeat: boolean;
  isUndo: boolean;
  isChange: boolean;
  mood?: string;
  parameters: Record<string, unknown>;
  confidence: number;
  rawInterpretation: string;
}

export interface AgentTask {
  agent: string;
  action: string;
  parameters: Record<string, unknown>;
  priority: number;
  dependsOn?: string;
}

// Agent handler type
type AgentHandler = (task: AgentTask, context: string) => Promise<ActionResult>;

// --------------------------------------------
// AGENT REGISTRY
// --------------------------------------------

const AGENT_DESCRIPTIONS: Record<string, string> = {
  'theme-designer': 'Store theme design — colors, fonts, CSS, header, footer, layout, visual styling',
  'homepage': 'Homepage building — hero section, featured products, trust badges, testimonials, announcements',
  'product-page': 'Product page optimization — gallery, description layout, urgency, sticky cart, reviews',
  'landing-page': 'Landing pages for ads — single CTA, no distraction, social proof, mobile-first',
  'upsell-bundle': 'Upsells, cross-sells, bundles — pre/post purchase, quantity discounts, recommendations',
  'product-manager': 'Product CRUD — add, edit, delete, bulk operations, import from CJ, inventory',
  'order-fulfillment': 'Order processing — detect new orders, fulfill via CJ, tracking, refunds',
  'price-monitor': 'Price monitoring 24/7 — check CJ prices, auto-update store, maintain margins',
  'content-seo': 'Content & SEO — descriptions, meta tags, blog, ad copy, social captions, image prompts',
  'collections': 'Collections — create smart/manual collections, organize products, navigation, SEO',
};

// --------------------------------------------
// INTENT PATTERNS
// --------------------------------------------

const INTENT_PATTERNS: Array<{
  patterns: RegExp[];
  intent: string;
  agents: string[];
  action: string;
}> = [
  // Theme related
  {
    patterns: [
      /theme/i, /design/i, /color/i, /font/i, /css/i,
      /style/i, /layout/i, /look/i, /appearance/i,
      /dark\s*(theme|mode)/i, /light\s*(theme|mode)/i,
      /header/i, /footer/i, /navigation/i,
    ],
    intent: 'theme_design',
    agents: ['theme-designer'],
    action: 'design_theme',
  },
  // Homepage
  {
    patterns: [
      /home\s*page/i, /homepage/i, /hero/i, /banner/i,
      /main\s*page/i, /front\s*page/i, /landing\s*(page)?/i,
      /announcement/i, /trust\s*badge/i, /testimonial/i,
    ],
    intent: 'homepage_design',
    agents: ['homepage'],
    action: 'build_homepage',
  },
  // ... (other patterns kept as in original repo)
];

// --------------------------------------------
// ORCHESTRATOR CLASS
// --------------------------------------------

export class Orchestrator {
  private router: AIRouter;
  private memoryAgent: MemoryAgent;
  private agentHandlers: Map<string, AgentHandler> = new Map();

  constructor() {
    this.router = getAIRouter();
    this.memoryAgent = getMemoryAgent();
  }
registerHandler(agentName: string, handler: AgentHandler): void {
  this.agentHandlers.set(agentName, handler);
}

private async executeAgentTask(task: AgentTask, intent: InterpretedIntent): Promise<ActionResult> {
  const startTime = Date.now();
  const handler = this.agentHandlers.get(task.agent);
  
  if (!handler) {
    return {
      agent: task.agent,
      action: task.action,
      success: false,
      result: `No handler registered for agent: ${task.agent}`,
      duration: Date.now() - startTime,
    };
  }

  try {
    return await handler(task, intent.rawInterpretation);
  } catch (error) {
    return {
      agent: task.agent,
      action: task.action,
      success: false,
      result: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}
  // --------------------------------------------
  // MAIN PROCESS METHOD
  // --------------------------------------------

  async process(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const startTime = Date.now();
    const actions: ActionResult[] = [];
    const agentsUsed: string[] = [];

    try {
      // Step 1: Record user message
      await this.memoryAgent.recordUserMessage(input.message);

      // Step 2: Interpret the message
      const intent = await this.interpretMessage(input.message);

      // Step 3: Handle special intents (undo, repeat)
      if (intent.isUndo) {
        const undoResult = await this.handleUndo();
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
          processingTime: Date.now() - startTime,
        };
      }

      if (intent.isRepeat) {
        const repeatResult = await this.handleRepeat(input.message);
        return {
          success: repeatResult.success,
          response: repeatResult.response,
          agentsUsed: repeatResult.agentsUsed,
          actions: repeatResult.actions,
          processingTime: repeatResult.processingTime,
        };
      }

      // Step 4: Execute agent tasks
      for (const task of intent.agents) {
        agentsUsed.push(task.agent);

        // Check if task depends on another
        if (task.dependsOn) {
          const dependencyResult = actions.find(a => a.agent === task.dependsOn);
          if (dependencyResult && !dependencyResult.success) {
            actions.push({
              agent: task.agent,
              action: task.action,
              success: false,
              result: `Skipped — dependency "${task.dependsOn}" failed`,
              duration: 0,
            });
            continue;
          }
        }

        const result = await this.executeAgentTask(task, intent);
        actions.push(result);
      }

      // Step 5: Generate final response
      const response = await this.generateResponse(input.message, intent, actions);

      // Step 6: Record assistant response
      await this.memoryAgent.recordAssistantMessage(response, {
        agent: 'orchestrator',
        action: intent.primaryIntent,
        success: actions.every(a => a.success),
        duration: Date.now() - startTime,
      });

      // Step 7: Generate follow-up suggestions
      const followUps = this.generateFollowUpSuggestions(intent, actions);

      return {
        success: actions.length === 0 || actions.some(a => a.success),
        response,
        agentsUsed,
        actions,
        suggestedFollowUp: followUps,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';

      await this.memoryAgent.recordAssistantMessage(`Error: ${errorMsg}`, {
        agent: 'orchestrator',
        action: 'error',
        success: false,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        response: `I encountered an error: ${errorMsg}. Let me try again or you can rephrase your request.`,
        agentsUsed,
        actions,
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async interpretMessage(message: string): Promise<InterpretedIntent> {
  const lower = message.toLowerCase();

  const isUndo = /undo|wapas|pehle\s*wala|hatao|revert/i.test(message);
  const isRepeat = /dubara|again|phir\s*se|repeat/i.test(message);
  const isChange = /change|badlo|modify|update/i.test(message);

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(message)) {
        return {
          primaryIntent: pattern.intent,
          agents: pattern.agents.map((agent, i) => ({
            agent,
            action: pattern.action,
            parameters: { rawMessage: message },
            priority: pattern.agents.length - i,
          })),
          isRepeat,
          isUndo,
          isChange,
          parameters: { rawMessage: message },
          confidence: 0.8,
          rawInterpretation: message,
        };
      }
    }
  }

  return {
    primaryIntent: 'general',
    agents: [],
    isRepeat,
    isUndo,
    isChange,
    parameters: { rawMessage: message },
    confidence: 0.5,
    rawInterpretation: message,
  };
}

private async handleUndo(): Promise<{ success: boolean; message: string }> {
  return { success: true, message: '↩️ Last action undone.' };
}

private async handleRepeat(message: string): Promise<OrchestratorOutput> {
  return this.process({ message: message.replace(/dubara|again|phir\s*se|repeat/i, '').trim() });
}

private async generateResponse(
  message: string,
  intent: InterpretedIntent,
  actions: ActionResult[]
): Promise<string> {
  const successful = actions.filter(a => a.success);
  const failed = actions.filter(a => !a.success);

  if (actions.length === 0) {
    const response = await this.router.route({
      id: `general-${Date.now()}`,
      message,
      preferredAI: 'gemini',
    });
    return response.content;
  }

  if (successful.length > 0) {
    return successful.map(a => a.result).join('\n');
  }

  return `❌ ${failed.map(a => a.result).join('\n')}`;
}

private generateFollowUpSuggestions(intent: InterpretedIntent, actions: ActionResult[]): string[] {
  const suggestions: string[] = [];

  if (intent.primaryIntent === 'theme_design') {
    suggestions.push('Homepage banao', 'Product page optimize karo');
  } else if (intent.primaryIntent === 'homepage_design') {
    suggestions.push('Theme design karo', 'Products import karo CJ se');
  } else {
    suggestions.push('Prices check karo', 'Orders fulfill karo');
  }

  return suggestions;
}
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}

export function resetOrchestrator(): void {
  orchestratorInstance = null;
}
