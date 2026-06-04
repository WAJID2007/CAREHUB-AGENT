// ============================================
// CAREHUB AI AGENT — MEMORY AGENT (AGENT #3)
// ============================================
// The brain's memory center. Manages:
// - Conversation context across sessions
// - User preference learning
// - Action history & undo capability
// - Store state tracking
// - Intelligent context summarization
// - "Pehle wali lagao" type commands
// ============================================

import { getMemoryManager, MemoryManager, ConversationMessage, AgentAction, UserPreferences, StoreState, MemorySnapshot } from '@/lib/memory-store';
import { getAIRouter, AIRouter } from './ai-router';

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface MemoryContext {
  recentConversation: string;
  userPreferences: UserPreferences;
  storeState: StoreState;
  lastActions: AgentAction[];
  relevantHistory: string;
  sessionSummary: string;
}

export interface MemorySearchResult {
  messages: ConversationMessage[];
  actions: AgentAction[];
  relevance: string;
}

export interface UndoResult {
  success: boolean;
  undoneAction: AgentAction | null;
  restoredState?: unknown;
  message: string;
}

export interface LearnedPreference {
  key: string;
  value: string;
  confidence: number;
  source: string;
  learnedAt: number;
}

// --------------------------------------------
// MEMORY AGENT CLASS
// --------------------------------------------

export class MemoryAgent {
  private memory: MemoryManager;
  private router: AIRouter;
  private learnedPreferences: LearnedPreference[] = [];

  constructor() {
    this.memory = getMemoryManager();
    this.router = getAIRouter();
  }

  // --------------------------------------------
  // CONTEXT BUILDING — For other agents
  // --------------------------------------------

  async buildContext(currentMessage: string, targetAgent?: string): Promise<MemoryContext> {
    const [
      preferences,
      storeState,
      recentActions,
      conversationHistory,
    ] = await Promise.all([
      this.memory.getPreferences(),
      this.memory.getStoreState(),
      this.memory.getRecentActions(10),
      this.memory.getConversationHistory(15),
    ]);

    // Build recent conversation string
    const recentConversation = conversationHistory
      .slice(-10)
      .map(m => `[${m.role}${m.metadata?.agent ? ` (${m.metadata.agent})` : ''}]: ${m.content.substring(0, 150)}`)
      .join('\n');

    // Get relevant history based on current message
    const relevantHistory = await this.findRelevantHistory(currentMessage);

    // Build session summary
    const sessionSummary = await this.memory.getSessionSummary();

    return {
      recentConversation,
      userPreferences: preferences,
      storeState,
      lastActions: recentActions,
      relevantHistory,
      sessionSummary,
    };
  }

  async buildAgentContext(agentName: string): Promise<any> {
    return this.memory.getAgentContext(agentName);
  }

  // --------------------------------------------
  // CONVERSATION MANAGEMENT
  // --------------------------------------------

  async recordUserMessage(message: string): Promise<any> {
    const recorded = await this.memory.addMessage({
      role: 'user',
      content: message,
    });

    // Learn preferences from message
    await this.learnFromMessage(message);

    return recorded;
  }

  async recordAssistantMessage(
    content: string,
    metadata?: { agent?: string; action?: string; success?: boolean; duration?: number }
  ): Promise<any> {
    return this.memory.addMessage({
      role: 'assistant',
      content,
      metadata,
    });
  }

  async recordSystemMessage(content: string): Promise<any> {
    return this.memory.addMessage({
      role: 'system',
      content,
    });
  }

  async getRecentMessages(count: number = 10): Promise<ConversationMessage[]> {
    return this.memory.getConversationHistory(count);
  }

  // --------------------------------------------
  // ACTION LOGGING
  // --------------------------------------------

  async logAction(params: {
    agent: string;
    action: string;
    input: string;
    output: string;
    success: boolean;
    duration: number;
    reversible?: boolean;
    undoData?: unknown;
  }): Promise<any> {
    return this.memory.logAction({
      agent: params.agent,
      action: params.action,
      input: params.input,
      output: params.output,
      success: params.success,
      duration: params.duration,
      reversible: params.reversible || false,
      undoData: params.undoData,
    });
  }

  async getLastAgentAction(agentName: string): Promise<AgentAction | null> {
    return this.memory.getLastAction(agentName);
  }

  async getAgentHistory(agentName: string, limit: number = 10): Promise<AgentAction[]> {
    return this.memory.getActionsByAgent(agentName, limit);
  }

  // --------------------------------------------
  // PREFERENCE LEARNING
  // --------------------------------------------

  private async learnFromMessage(message: string): Promise<any> {
    const lower = message.toLowerCase();

    // Design style detection
    const styleKeywords: Record<string, string> = {
      'premium': 'premium',
      'luxury': 'luxury',
      'modern': 'modern',
      'minimal': 'minimalist',
      'clean': 'clean',
      'bold': 'bold',
      'elegant': 'elegant',
      'professional': 'professional',
      'playful': 'playful',
      'dark': 'dark',
      'light': 'light',
      'colorful': 'colorful',
      'simple': 'simple',
      'fancy': 'fancy',
      'classical': 'classical',
      'vintage': 'vintage',
    };

    for (const [keyword, style] of Object.entries(styleKeywords)) {
      if (lower.includes(keyword)) {
        await this.updatePreference('designStyle' as keyof UserPreferences, style, keyword);
        break;
      }
    }

    // Color preference detection
    const colorKeywords: Record<string, string> = {
      'dark': 'dark',
      'light': 'light',
      'black': 'dark',
      'white': 'light',
      'blue': 'blue',
      'red': 'red',
      'green': 'green',
      'gold': 'gold',
      'purple': 'purple',
      'pink': 'pink',
      'orange': 'orange',
    };

    for (const [keyword, color] of Object.entries(colorKeywords)) {
      if (lower.includes(keyword) && (lower.includes('color') || lower.includes('theme') || lower.includes('design'))) {
        await this.updatePreference('colorPreference' as keyof UserPreferences, color, keyword);
        break;
      }
    }

    // Mood detection
    const moodKeywords: Record<string, string> = {
      'happy': 'energetic',
      'serious': 'professional',
      'fun': 'playful',
      'trust': 'trustworthy',
      'expensive': 'luxury',
      'cheap': 'value',
      'fast': 'energetic',
      'calm': 'serene',
      'exciting': 'dynamic',
      'warm': 'warm',
      'cool': 'cool',
    };

    for (const [keyword, mood] of Object.entries(moodKeywords)) {
      if (lower.includes(keyword)) {
        await this.updatePreference('mood' as keyof UserPreferences, mood, keyword);
        break;
      }
    }

    // Margin detection
    const marginMatch = lower.match(/(\d+)\s*%?\s*(margin|profit|markup)/);
    if (marginMatch) {
      const margin = parseInt(marginMatch[1]);
      if (margin > 0 && margin < 100) {
        await this.memory.updatePreferences({ profitMargin: margin } as Partial<UserPreferences>);
      }
    }
  }

  private async updatePreference(key: keyof UserPreferences, value: string, source: string): Promise<any> {
    const currentPrefs = await this.memory.getPreferences();

    // Only update if different from current
    if ((currentPrefs as any)[key] !== value) {
      await this.memory.updatePreferences({ [key]: value } as Partial<UserPreferences>);

      this.learnedPreferences.push({
        key: key as string,
        value,
        confidence: 0.7,
        source,
        learnedAt: Date.now(),
      });
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    return this.memory.getPreferences();
  }

  async setPreferences(updates: Partial<UserPreferences>): Promise<any> {
    return this.memory.updatePreferences(updates);
  }

  // --------------------------------------------
  // STORE STATE MANAGEMENT
  // --------------------------------------------

  async getStoreState(): Promise<StoreState> {
    return this.memory.getStoreState();
  }

  async updateStoreState(updates: Partial<StoreState>): Promise<any> {
    return this.memory.updateStoreState(updates);
  }

  async recordThemeChange(themeData: {
    id: number;
    name: string;
    customCSS: string;
    mood: string;
  }): Promise<any> {
    // Create snapshot before change
    const currentState = await this.memory.getStoreState();
    if ((currentState as any).currentTheme) {
      await this.memory.createSnapshot(`Before theme change to: ${themeData.mood}`, {
        themeCSS: (currentState as any).currentTheme.customCSS,
      });
    }

    // Update store state
    await this.memory.updateStoreState({
      currentTheme: {
        ...themeData,
        appliedAt: Date.now(),
      },
    });
  }

  async recordHomepageUpdate(config: unknown): Promise<any> {
    await this.memory.createSnapshot('Before homepage update', {
      homepageConfig: config,
    });
    await this.memory.updateStoreState({
      lastHomepageUpdate: Date.now(),
    });
  }

  async recordProductPageUpdate(config: unknown): Promise<any> {
    await this.memory.createSnapshot('Before product page update', {
      productPageConfig: config,
    });
    await this.memory.updateStoreState({
      lastProductPageUpdate: Date.now(),
    });
  }

  // --------------------------------------------
  // UNDO / RESTORE
  // --------------------------------------------

  async undo(): Promise<UndoResult> {
    // Get last reversible action
    const reversibleActions = await this.memory.getReversibleActions();

    if (reversibleActions.length === 0) {
      return {
        success: false,
        undoneAction: null,
        message: 'No reversible actions found. Cannot undo.',
      };
    }

    const lastAction = reversibleActions[reversibleActions.length - 1];

    return {
      success: true,
      undoneAction: lastAction,
      restoredState: lastAction.undoData,
      message: `Undone: ${lastAction.agent} — ${lastAction.action}`,
    };
  }

  async restorePreviousState(label?: string): Promise<{ success: boolean; message: string; snapshot?: MemorySnapshot }> {
    if (label) {
      // Find snapshot by label
      const snapshots = await this.memory.getSnapshots();
      const found = snapshots.find(s => s.label.toLowerCase().includes(label.toLowerCase()));

      if (!found) {
        return { success: false, message: `No snapshot found matching: "${label}"` };
      }

      await this.memory.restoreSnapshot(found.id);
      return { success: true, message: `Restored state: ${found.label}`, snapshot: found };
    }

    // Restore latest snapshot
    const latest = await this.memory.getLatestSnapshot();
    if (!latest) {
      return { success: false, message: 'No snapshots available to restore' };
    }

    await this.memory.restoreSnapshot(latest.id);
    return { success: true, message: `Restored to: ${latest.label}`, snapshot: latest };
  }

  async getAvailableSnapshots(): Promise<MemorySnapshot[]> {
    return this.memory.getSnapshots();
  }

  // --------------------------------------------
  // INTELLIGENT SEARCH
  // --------------------------------------------

  async findRelevantHistory(query: string): Promise<string> {
    const lower = query.toLowerCase();
    const allActions = await this.memory.getRecentActions(50);
    const allMessages = await this.memory.getConversationHistory(50);

    // Find relevant actions
    const relevantActions = allActions.filter(action => {
      const actionStr = `${action.agent} ${action.action} ${action.input}`.toLowerCase();
      return lower.split(' ').some(word => word.length > 3 && actionStr.includes(word));
    }).slice(-5);

    // Find relevant messages
    const relevantMessages = allMessages.filter(msg => {
      return lower.split(' ').some(word => word.length > 3 && msg.content.toLowerCase().includes(word));
    }).slice(-5);

    const parts: string[] = [];

    if (relevantActions.length > 0) {
      parts.push('Related past actions:');
      relevantActions.forEach(a => {
        parts.push(`  - [${a.agent}] ${a.action}: ${a.success ? '✅' : '❌'} (${new Date(a.timestamp).toLocaleDateString()})`);
      });
    }

    if (relevantMessages.length > 0) {
      parts.push('Related past messages:');
      relevantMessages.forEach(m => {
        parts.push(`  - [${m.role}]: ${m.content.substring(0, 100)}`);
      });
    }

    return parts.join('\n') || 'No relevant history found.';
  }

  async search(query: string): Promise<MemorySearchResult> {
    const messages = await this.memory.searchConversations(query);
    const actions = await this.memory.getRecentActions(100);
    const relevantActions = actions.filter(a =>
      `${a.agent} ${a.action} ${a.input} ${a.output}`.toLowerCase().includes(query.toLowerCase())
    );

    return {
      messages: messages.slice(-10),
      actions: relevantActions.slice(-10),
      relevance: `Found ${messages.length} messages and ${relevantActions.length} actions matching "${query}"`,
    };
  }

  // --------------------------------------------
  // CONTEXT SUMMARIZATION
  // --------------------------------------------

  async summarizeForAgent(agentName: string, currentTask: string): Promise<string> {
    const agentContext = await this.memory.getAgentContext(agentName);
    const preferences = await this.memory.getPreferences();
    const storeState = await this.memory.getStoreState();
    const recentMessages = await this.memory.getConversationHistory(5);

    const summary = [
      `=== Context for ${agentName} ===`,
      ``,
      `Current Task: ${currentTask}`,
      ``,
      `User Preferences:`,
      `  Style: ${preferences.designStyle}`,
      `  Color: ${preferences.colorPreference}`,
      `  Mood: ${preferences.mood}`,
      `  Margin: ${preferences.profitMargin}%`,
      `  Market: ${preferences.targetMarket}`,
      ``,
      `Store State:`,
      `  Theme: ${storeState.currentTheme?.name || 'Default'} (${storeState.currentTheme?.mood || 'not set'})`,
      `  Products: ${storeState.totalProducts}`,
      `  Orders: ${storeState.totalOrders}`,
      ``,
      `Recent Conversation:`,
      ...recentMessages.slice(-3).map(m => `  [${m.role}]: ${m.content.substring(0, 100)}`),
      ``,
      `Agent History:`,
      agentContext,
    ];

    return summary.join('\n');
  }

  async getCompactContext(): Promise<string> {
    const preferences = await this.memory.getPreferences();
    const storeState = await this.memory.getStoreState();
    const lastAction = await this.memory.getLastAction();

    return [
      `Style: ${preferences.designStyle}/${preferences.mood}/${preferences.colorPreference}`,
      `Theme: ${storeState.currentTheme?.mood || 'default'}`,
      `Products: ${storeState.totalProducts}`,
      `Last action: ${lastAction ? `${lastAction.agent}:${lastAction.action}` : 'none'}`,
    ].join(' | ');
  }

  // --------------------------------------------
  // INTENT DETECTION FROM HISTORY
  // --------------------------------------------

  async detectRepeatIntent(message: string): Promise<{
    isRepeat: boolean;
    originalAction?: AgentAction;
    intent: string;
  }> {
    const lower = message.toLowerCase();

    // Check for repeat/undo keywords
    const repeatPatterns = [
      /dubara|phir\s*se|repeat|again|wapas|pehle\s*wali|undo|revert|restore/i,
      /same\s*(thing|kaam|action)/i,
      /last\s*(time|baar|wali)/i,
      /go\s*back/i,
      /as\s*before/i,
    ];

    const isRepeat = repeatPatterns.some(p => p.test(lower));

    if (!isRepeat) {
      return { isRepeat: false, intent: 'new_action' };
    }

    // Find what they want to repeat
    const lastAction = await this.memory.getLastAction();

    // Check for specific agent mentions
    const agentMentions: Record<string, string> = {
      'theme': 'theme-designer',
      'homepage': 'homepage',
      'home page': 'homepage',
      'product page': 'product-page',
      'landing': 'landing-page',
      'upsell': 'upsell-bundle',
      'product': 'product-manager',
      'order': 'order-fulfillment',
      'price': 'price-monitor',
      'content': 'content-seo',
      'seo': 'content-seo',
      'collection': 'collections',
    };

    let targetAgent: string | undefined;
    for (const [keyword, agent] of Object.entries(agentMentions)) {
      if (lower.includes(keyword)) {
        targetAgent = agent;
        break;
      }
    }

    if (targetAgent) {
      const agentAction = await this.memory.getLastAction(targetAgent);
      return {
        isRepeat: true,
        originalAction: agentAction || undefined,
        intent: `repeat_${targetAgent}`,
      };
    }

    return {
      isRepeat: true,
      originalAction: lastAction || undefined,
      intent: 'undo_last',
    };
  }

  // --------------------------------------------
  // CUSTOM CONTEXT STORE
  // --------------------------------------------

  async setCustomContext(key: string, value: unknown): Promise<any> {
    await this.memory.setContext(key, value);
  }

  async getCustomContext(key: string): Promise<any> {
    return this.memory.getContext(key);
  }

  async deleteCustomContext(key: string): Promise<any> {
    await this.memory.deleteContext(key);
  }

  // --------------------------------------------
  // STATS & INFO
  // --------------------------------------------

  async getStats(): Promise<{
    totalMessages: number;
    totalActions: number;
    totalSnapshots: number;
    storageType: string;
    learnedPreferences: number;
  }> {
    const stats = await this.memory.getStats();
    return {
      ...stats,
      learnedPreferences: this.learnedPreferences.length,
    };
  }

  async getFullSummary(): Promise<any> {
    return this.memory.getSessionSummary();
  }

  // --------------------------------------------
  // RESET
  // --------------------------------------------

  async reset(what: 'all' | 'conversations' | 'actions' | 'preferences'): Promise<any> {
    switch (what) {
      case 'all':
        await this.memory.reset();
        this.learnedPreferences = [];
        break;
      case 'conversations':
        await this.memory.resetConversations();
        break;
      case 'actions':
        await this.memory.resetActions();
        break;
      case 'preferences':
        await this.memory.updatePreferences({
          designStyle: 'premium',
          colorPreference: 'dark',
          fontPreference: 'modern',
          mood: 'luxury',
          language: 'roman_urdu',
          profitMargin: 40,
          currency: 'USD',
          targetMarket: 'US/UK',
        } as Partial<UserPreferences>);
        break;
    }
  }

  async forceSave(): Promise<any> {
    await this.memory.forceSave();
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let memoryAgentInstance: MemoryAgent | null = null;

export function getMemoryAgent(): MemoryAgent {
  if (!memoryAgentInstance) {
    memoryAgentInstance = new MemoryAgent();
  }
  return memoryAgentInstance;
}

export function resetMemoryAgent(): void {
  memoryAgentInstance = null;
}
