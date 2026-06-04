// ============================================
// CAREHUB AI AGENT — MEMORY STORAGE SYSTEM
// ============================================
// Persistent memory across sessions — conversations,
// preferences, actions, states, undo history.
// Uses Vercel KV (Redis) with local fallback.
// ============================================

// --------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    agent?: string;
    action?: string;
    success?: boolean;
    duration?: number;
  };
}

export interface AgentAction {
  id: string;
  agent: string;
  action: string;
  input: string;
  output: string;
  success: boolean;
  timestamp: number;
  duration: number;
  reversible: boolean;
  undoData?: unknown;
}

export interface UserPreferences {
  designStyle: string;
  colorPreference: string;
  fontPreference: string;
  mood: string;
  language: string;
  profitMargin: number;
  currency: string;
  targetMarket: string;
  lastUpdated: number;
}

export interface StoreState {
  currentTheme: {
    id: number;
    name: string;
    customCSS: string;
    appliedAt: number;
    mood: string;
  } | null;
  lastHomepageUpdate: number | null;
  lastProductPageUpdate: number | null;
  totalProducts: number;
  totalOrders: number;
  lastPriceCheck: number | null;
  lastOrderFulfillment: number | null;
  activeCollections: string[];
  activeBundles: string[];
}

export interface MemorySnapshot {
  id: string;
  label: string;
  timestamp: number;
  storeState: StoreState;
  themeCSS?: string;
  homepageConfig?: unknown;
  productPageConfig?: unknown;
}

export interface MemoryStore {
  conversations: ConversationMessage[];
  actions: AgentAction[];
  preferences: UserPreferences;
  storeState: StoreState;
  snapshots: MemorySnapshot[];
  context: Record<string, any>;
}

// --------------------------------------------
// DEFAULT VALUES
// --------------------------------------------

const DEFAULT_PREFERENCES: UserPreferences = {
  designStyle: 'premium',
  colorPreference: 'dark',
  fontPreference: 'modern',
  mood: 'luxury',
  language: 'roman_urdu',
  profitMargin: 40,
  currency: 'USD',
  targetMarket: 'US/UK',
  lastUpdated: Date.now(),
};

const DEFAULT_STORE_STATE: StoreState = {
  currentTheme: null,
  lastHomepageUpdate: null,
  lastProductPageUpdate: null,
  totalProducts: 0,
  totalOrders: 0,
  lastPriceCheck: null,
  lastOrderFulfillment: null,
  activeCollections: [],
  activeBundles: [],
};

const DEFAULT_MEMORY: MemoryStore = {
  conversations: [],
  actions: [],
  preferences: DEFAULT_PREFERENCES,
  storeState: DEFAULT_STORE_STATE,
  snapshots: [],
  context: {},
};

// --------------------------------------------
// MEMORY LIMITS
// --------------------------------------------

const LIMITS = {
  maxConversations: 500,
  maxActions: 200,
  maxSnapshots: 50,
  maxContextKeys: 100,
  conversationTrimTo: 300,
  actionsTrimTo: 100,
  snapshotsTrimTo: 30,
};

// --------------------------------------------
// KV STORAGE ADAPTER
// --------------------------------------------

class KVAdapter {
  private localStore: Map<string, string> = new Map();
  private kvAvailable: boolean = false;
  private kv: { get: (key: string) => Promise<any>; set: (key: string, value: string) => Promise<any> } | null = null;

  constructor() {
    this.initKV();
  }

  private async initKV(): Promise<void> {
    try {
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const { kv } = await import('@vercel/kv');
        this.kv = kv as unknown as { get: (key: string) => Promise<any>; set: (key: string, value: string) => Promise<any> };
        this.kvAvailable = true;
        console.log('[Memory] Vercel KV connected ✅');
      } else {
        console.log('[Memory] Using local memory store (Vercel KV not configured)');
      }
    } catch {
      console.log('[Memory] Vercel KV not available — using local store');
      this.kvAvailable = false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.kvAvailable && this.kv) {
        const value = await this.kv.get(key);
        return value;
      }
      return this.localStore.get(key) || null;
    } catch (error) {
      console.error(`[Memory] KV get error for key "${key}":`, error);
      return this.localStore.get(key) || null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      if (this.kvAvailable && this.kv) {
        await this.kv.set(key, value);
      }
      // Always keep local copy as backup
      this.localStore.set(key, value);
    } catch (error) {
      console.error(`[Memory] KV set error for key "${key}":`, error);
      // Fallback to local
      this.localStore.set(key, value);
    }
  }

  isConnected(): boolean {
    return this.kvAvailable;
  }
}

// --------------------------------------------
// MEMORY MANAGER CLASS
// --------------------------------------------

export class MemoryManager {
  private kv: KVAdapter;
  private cache: MemoryStore | null = null;
  private readonly STORE_KEY = 'carehub:memory';
  private isDirty: boolean = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.kv = new KVAdapter();
  }

  // --------------------------------------------
  // CORE LOAD/SAVE
  // --------------------------------------------

  private async load(): Promise<MemoryStore> {
    if (this.cache) return this.cache;

    try {
      const data = await this.kv.get(this.STORE_KEY);
      if (data) {
        this.cache = JSON.parse(data) as MemoryStore;
        // Merge with defaults in case new fields were added
        this.cache = {
          ...DEFAULT_MEMORY,
          ...this.cache,
          preferences: { ...DEFAULT_PREFERENCES, ...this.cache.preferences },
          storeState: { ...DEFAULT_STORE_STATE, ...this.cache.storeState },
        };
      } else {
        this.cache = { ...DEFAULT_MEMORY };
      }
    } catch (error) {
      console.error('[Memory] Load error:', error);
      this.cache = { ...DEFAULT_MEMORY };
    }

    return this.cache;
  }

  private async save(): Promise<void> {
    if (!this.cache) return;

    try {
      // Trim data if exceeding limits
      this.trimData();
      const data = JSON.stringify(this.cache);
      await this.kv.set(this.STORE_KEY, data);
      this.isDirty = false;
    } catch (error) {
      console.error('[Memory] Save error:', error);
    }
  }

  private debouncedSave(): void {
    this.isDirty = true;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.save(), 1000);
  }

  private trimData(): void {
    if (!this.cache) return;

    // Trim conversations
    if (this.cache.conversations.length > LIMITS.maxConversations) {
      this.cache.conversations = this.cache.conversations.slice(-LIMITS.conversationTrimTo);
    }

    // Trim actions
    if (this.cache.actions.length > LIMITS.maxActions) {
      this.cache.actions = this.cache.actions.slice(-LIMITS.actionsTrimTo);
    }

    // Trim snapshots
    if (this.cache.snapshots.length > LIMITS.maxSnapshots) {
      this.cache.snapshots = this.cache.snapshots.slice(-LIMITS.snapshotsTrimTo);
    }

    // Trim context keys
    const contextKeys = Object.keys(this.cache.context);
    if (contextKeys.length > LIMITS.maxContextKeys) {
      const keysToRemove = contextKeys.slice(0, contextKeys.length - LIMITS.maxContextKeys);
      for (const key of keysToRemove) {
        delete this.cache.context[key];
      }
    }
  }

  // --------------------------------------------
  // CONVERSATION METHODS
  // --------------------------------------------

  async addMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): Promise<ConversationMessage> {
    const memory = await this.load();
    const fullMessage: ConversationMessage = {
      ...message,
      id: this.generateId(),
      timestamp: Date.now(),
    };
    memory.conversations.push(fullMessage);
    this.debouncedSave();
    return fullMessage;
  }

  async getConversationHistory(limit: number = 20): Promise<ConversationMessage[]> {
    const memory = await this.load();
    return memory.conversations.slice(-limit);
  }

  async getRecentContext(messageCount: number = 10): Promise<string> {
    const messages = await this.getConversationHistory(messageCount);
    return messages
      .map(m => `[${m.role}]: ${m.content.substring(0, 200)}`)
      .join('\n');
  }

  async searchConversations(query: string): Promise<ConversationMessage[]> {
    const memory = await this.load();
    const lowerQuery = query.toLowerCase();
    return memory.conversations.filter(
      m => m.content.toLowerCase().includes(lowerQuery)
    );
  }

  async clearConversations(): Promise<void> {
    const memory = await this.load();
    memory.conversations = [];
    this.debouncedSave();
  }

  // --------------------------------------------
  // ACTION METHODS
  // --------------------------------------------

  async logAction(action: Omit<AgentAction, 'id' | 'timestamp'>): Promise<AgentAction> {
    const memory = await this.load();
    const fullAction: AgentAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
    };
    memory.actions.push(fullAction);
    this.debouncedSave();
    return fullAction;
  }

  async getRecentActions(limit: number = 10): Promise<AgentAction[]> {
    const memory = await this.load();
    return memory.actions.slice(-limit);
  }

  async getActionsByAgent(agent: string, limit: number = 10): Promise<AgentAction[]> {
    const memory = await this.load();
    return memory.actions
      .filter(a => a.agent === agent)
      .slice(-limit);
  }

  async getLastAction(agent?: string): Promise<AgentAction | null> {
    const memory = await this.load();
    if (agent) {
      const agentActions = memory.actions.filter(a => a.agent === agent);
      return agentActions[agentActions.length - 1] || null;
    }
    return memory.actions[memory.actions.length - 1] || null;
  }

  async getReversibleActions(): Promise<AgentAction[]> {
    const memory = await this.load();
    return memory.actions.filter(a => a.reversible && a.undoData);
  }

  // --------------------------------------------
  // PREFERENCES METHODS
  // --------------------------------------------

  async getPreferences(): Promise<UserPreferences> {
    const memory = await this.load();
    return memory.preferences;
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const memory = await this.load();
    memory.preferences = {
      ...memory.preferences,
      ...updates,
      lastUpdated: Date.now(),
    };
    this.debouncedSave();
    return memory.preferences;
  }

  async getPreference<K extends keyof UserPreferences>(key: K): Promise<UserPreferences[K]> {
    const memory = await this.load();
    return memory.preferences[key];
  }

  // --------------------------------------------
  // STORE STATE METHODS
  // --------------------------------------------

  async getStoreState(): Promise<StoreState> {
    const memory = await this.load();
    return memory.storeState;
  }

  async updateStoreState(updates: Partial<StoreState>): Promise<StoreState> {
    const memory = await this.load();
    memory.storeState = {
      ...memory.storeState,
      ...updates,
    };
    this.debouncedSave();
    return memory.storeState;
  }

  // --------------------------------------------
  // SNAPSHOT METHODS (UNDO/RESTORE)
  // --------------------------------------------

  async createSnapshot(label: string, additionalData?: { themeCSS?: string; homepageConfig?: unknown; productPageConfig?: unknown }): Promise<MemorySnapshot> {
    const memory = await this.load();
    const snapshot: MemorySnapshot = {
      id: this.generateId(),
      label,
      timestamp: Date.now(),
      storeState: { ...memory.storeState },
      ...additionalData,
    };
    memory.snapshots.push(snapshot);
    this.debouncedSave();
    return snapshot;
  }

  async getSnapshots(): Promise<MemorySnapshot[]> {
    const memory = await this.load();
    return memory.snapshots;
  }

  async getSnapshot(snapshotId: string): Promise<MemorySnapshot | null> {
    const memory = await this.load();
    return memory.snapshots.find(s => s.id === snapshotId) || null;
  }

  async getLatestSnapshot(): Promise<MemorySnapshot | null> {
    const memory = await this.load();
    return memory.snapshots[memory.snapshots.length - 1] || null;
  }

  async restoreSnapshot(snapshotId: string): Promise<{ success: boolean; error?: string }> {
    const memory = await this.load();
    const snapshot = memory.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      return { success: false, error: 'Snapshot not found' };
    }
    memory.storeState = { ...snapshot.storeState };
    this.debouncedSave();
    return { success: true };
  }

  // --------------------------------------------
  // CONTEXT METHODS (Key-Value Store)
  // --------------------------------------------

  async setContext(key: string, value: unknown): Promise<void> {
    const memory = await this.load();
    memory.context[key] = value;
    this.debouncedSave();
  }

  async getContext(key: string): Promise<any> {
    const memory = await this.load();
    return memory.context[key] || null;
  }

  async deleteContext(key: string): Promise<void> {
    const memory = await this.load();
    delete memory.context[key];
    this.debouncedSave();
  }

  async getAllContext(): Promise<Record<string, any>> {
    const memory = await this.load();
    return memory.context;
  }

  // --------------------------------------------
  // SUMMARY METHODS
  // --------------------------------------------

  async getSessionSummary(): Promise<string> {
    const memory = await this.load();
    const recentMessages = memory.conversations.slice(-20);
    const recentActions = memory.actions.slice(-10);

    const summary = [
      `=== CareHub Agent Memory Summary ===`,
      ``,
      `📊 Store State:`,
      `- Current Theme: ${memory.storeState.currentTheme?.name || 'Default'}`,
      `- Theme Mood: ${memory.storeState.currentTheme?.mood || 'Not set'}`,
      `- Total Products: ${memory.storeState.totalProducts}`,
      `- Total Orders: ${memory.storeState.totalOrders}`,
      `- Last Price Check: ${memory.storeState.lastPriceCheck ? new Date(memory.storeState.lastPriceCheck).toLocaleString() : 'Never'}`,
      `- Active Collections: ${memory.storeState.activeCollections.join(', ') || 'None'}`,
      ``,
      `🎨 User Preferences:`,
      `- Design Style: ${memory.preferences.designStyle}`,
      `- Color Preference: ${memory.preferences.colorPreference}`,
      `- Mood: ${memory.preferences.mood}`,
      `- Profit Margin: ${memory.preferences.profitMargin}%`,
      `- Target Market: ${memory.preferences.targetMarket}`,
      ``,
      `💬 Recent Conversation (last ${recentMessages.length} messages):`,
      ...recentMessages.slice(-5).map(m => `  [${m.role}]: ${m.content.substring(0, 100)}...`),
      ``,
      `⚡ Recent Actions (last ${recentActions.length}):`,
      ...recentActions.slice(-5).map(a => `  [${a.agent}] ${a.action} — ${a.success ? '✅' : '❌'}`),
      ``,
      `📸 Snapshots Available: ${memory.snapshots.length}`,
      `🔑 Context Keys: ${Object.keys(memory.context).length}`,
    ];

    return summary.join('\n');
  }

  async getAgentContext(agentName: string): Promise<string> {
    const memory = await this.load();
    const agentActions = memory.actions.filter(a => a.agent === agentName).slice(-5);
    const relevantContext = Object.entries(memory.context)
      .filter(([key]) => key.startsWith(agentName))
      .map(([key, value]) => `${key}: ${JSON.stringify(value).substring(0, 100)}`);

    return [
      `Agent: ${agentName}`,
      `Previous actions:`,
      ...agentActions.map(a => `- ${a.action}: ${a.success ? 'Success' : 'Failed'} (${new Date(a.timestamp).toLocaleString()})`),
      `Context:`,
      ...relevantContext,
      `User preferences: ${memory.preferences.designStyle}, ${memory.preferences.mood}, ${memory.preferences.colorPreference}`,
    ].join('\n');
  }

  // --------------------------------------------
  // FULL RESET
  // --------------------------------------------

  async reset(): Promise<void> {
    this.cache = { ...DEFAULT_MEMORY };
    await this.save();
  }

  async resetConversations(): Promise<void> {
    const memory = await this.load();
    memory.conversations = [];
    await this.save();
  }

  async resetActions(): Promise<void> {
    const memory = await this.load();
    memory.actions = [];
    await this.save();
  }

  // --------------------------------------------
  // STATS
  // --------------------------------------------

  async getStats(): Promise<{
    totalMessages: number;
    totalActions: number;
    totalSnapshots: number;
    contextKeys: number;
    storageType: string;
    oldestMessage: number | null;
    newestMessage: number | null;
  }> {
    const memory = await this.load();
    return {
      totalMessages: memory.conversations.length,
      totalActions: memory.actions.length,
      totalSnapshots: memory.snapshots.length,
      contextKeys: Object.keys(memory.context).length,
      storageType: this.kv.isConnected() ? 'Vercel KV (Redis)' : 'Local Memory',
      oldestMessage: memory.conversations[0]?.timestamp || null,
      newestMessage: memory.conversations[memory.conversations.length - 1]?.timestamp || null,
    };
  }

  // --------------------------------------------
  // UTILITY
  // --------------------------------------------

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async forceSave(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.save();
  }
}

// --------------------------------------------
// SINGLETON INSTANCE
// --------------------------------------------

let memoryInstance: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
  if (!memoryInstance) {
    memoryInstance = new MemoryManager();
  }
  return memoryInstance;
}

export function resetMemoryManager(): void {
  memoryInstance = null;
}
