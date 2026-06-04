'use client';

// ============================================
// CAREHUB AI AGENT — PREMIUM DASHBOARD UI
// ============================================

import { useState, useRef, useEffect, FormEvent } from 'react';

// --------------------------------------------
// TYPES
// --------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentsUsed?: string[];
  processingTime?: number;
  success?: boolean;
}

interface SystemStatus {
  groqHealthy: boolean;
  geminiHealthy: boolean;
  groqRemaining: number;
  geminiRemaining: number;
  totalRouted: number;
  messagesStored: number;
}

interface QuickAction {
  label: string;
  icon: string;
  action: string;
  params?: Record<string, string>;
  color: string;
}

// --------------------------------------------
// QUICK ACTIONS
// --------------------------------------------

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Design Theme', icon: '🎨', action: 'design_theme', params: { mood: 'premium dark' }, color: '#c9a962' },
  { label: 'Build Homepage', icon: '🏠', action: 'build_homepage', params: {}, color: '#60a5fa' },
  { label: 'Product Page', icon: '📦', action: 'build_product_page', params: {}, color: '#4ade80' },
  { label: 'Check Prices', icon: '💲', action: 'check_prices', params: {}, color: '#fbbf24' },
  { label: 'Order Status', icon: '🛒', action: 'order_summary', params: {}, color: '#f87171' },
  { label: 'Setup Upsells', icon: '💰', action: 'build_upsell', params: { type: 'all' }, color: '#a78bfa' },
  { label: 'Create Collections', icon: '🗂️', action: 'create_preset_collections', params: {}, color: '#2dd4bf' },
  { label: 'System Status', icon: '🤖', action: 'system_status', params: {}, color: '#fb923c' },
];

// --------------------------------------------
// MAIN COMPONENT
// --------------------------------------------

export default function CareHubDashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `🤖 **CareHub Agent Ready!**\n\nMain tumhara 13 AI agents ka system hoon. Mujhe Roman Urdu ya English mein command do:\n\n• "Store ki theme premium dark lagao"\n• "Homepage best banao"\n• "Products import karo CJ se"\n• "Prices check karo"\n• "Orders fulfill karo"\n\nYa neeche Quick Actions use karo. Kya karna hai? 🚀`,
      timestamp: Date.now(),
      success: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<SystemStatus>({
    groqHealthy: true,
    geminiHealthy: true,
    groqRemaining: 28,
    geminiRemaining: 55,
    totalRouted: 0,
    messagesStored: 0,
  });
  const [showActions, setShowActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const authStatus = document.cookie.includes('shopify_auth_status=success');
    if (authStatus) {
      addSystemMessage('✅ Shopify connected successfully! All agents can now access your store.');
    }
    fetchStatus();
  }, []);

  // --------------------------------------------
  // API CALLS
  // --------------------------------------------

  async function sendMessage(
    message: string,
    action?: string,
    params?: Record<string, string>
  ) {
    if (!message.trim() && !action) return;

    setIsLoading(true);
    setShowActions(false);

    if (message.trim()) {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
    }

    try {
      const body: Record<string, unknown> = {};
      if (action) {
        body.action = action;
        body.params = params || {};
      } else {
        body.message = message;
      }

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'No response received.',
        timestamp: Date.now(),
        agentsUsed: data.agentsUsed,
        processingTime: data.processingTime,
        success: data.success,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.status?.aiRouter) {
        setStatus({
          groqHealthy: data.status.aiRouter.groq?.healthy ?? true,
          geminiHealthy: data.status.aiRouter.gemini?.healthy ?? true,
          groqRemaining: data.status.aiRouter.groq?.remainingRequests ?? 28,
          geminiRemaining: data.status.aiRouter.gemini?.remainingRequests ?? 55,
          totalRouted: data.status.aiRouter.totalRequestsRouted ?? 0,
          messagesStored: data.status.memory?.totalMessages ?? 0,
        });
      }
    } catch (error) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Connection error: ${
          error instanceof Error ? error.message : 'Could not reach the server'
        }. Make sure the app is deployed on Vercel.`,
        timestamp: Date.now(),
        success: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  async function fetchStatus() {
    try {
      const response = await fetch('/api/agent');
      if (response.ok) {
        const data = await response.json();
        if (data.ai) {
          setStatus({
            groqHealthy: data.ai.groq?.healthy ?? true,
            geminiHealthy: data.ai.gemini?.healthy ?? true,
            groqRemaining: data.ai.groq?.remainingRequests ?? 28,
            geminiRemaining: data.ai.gemini?.remainingRequests ?? 55,
            totalRouted: data.ai.totalRequestsRouted ?? 0,
            messagesStored: data.memory?.totalMessages ?? 0,
          });
        }
      }
    } catch {
      // Silently fail — status will show defaults
    }
  }

  function addSystemMessage(content: string) {
    const msg: Message = {
      id: `system-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
    }
  }

  function handleQuickAction(action: QuickAction) {
    sendMessage(`[${action.label}]`, action.action, action.params);
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatContent(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n/g, ' ');
  }

  // --------------------------------------------
  // RENDER
  // --------------------------------------------

  return (
    <div style={styles.container}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🤖</span>
            <div>
              <p style={styles.logoText}>CareHub Agent</p>
              <p style={styles.logoSub}>13 AI Agents • Shopify Automation</p>
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statusDots}>
            <span
              style={{
                ...styles.statusDot,
                background: status.groqHealthy ? '#4ade80' : '#f87171',
              }}
            />
            <span
              style={{
                ...styles.statusDot,
                background: status.geminiHealthy ? '#4ade80' : '#f87171',
              }}
            />
          </div>
          <a href="/api/auth/shopify" style={styles.connectBtn}>
            🔌 Connect Shopify
          </a>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={styles.main}>
        <div style={styles.chatContainer}>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    msg.role === 'user'
                      ? 'flex-end'
                      : msg.role === 'system'
                      ? 'center'
                      : 'flex-start',
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(msg.role === 'user'
                      ? styles.userBubble
                      : msg.role === 'system'
                      ? styles.systemBubble
                      : styles.assistantBubble),
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={styles.msgHeader}>
                      <span style={styles.msgAgent}>🤖 CareHub</span>
                      {msg.processingTime && (
                        <span style={styles.msgTime}>{msg.processingTime}ms</span>
                      )}
                    </div>
                  )}

                  <div style={styles.msgContent}>{formatContent(msg.content)}</div>

                  <div style={styles.msgFooter}>
                    <span style={styles.timestamp}>{formatTime(msg.timestamp)}</span>
                    {msg.agentsUsed && msg.agentsUsed.length > 0 && (
                      <span style={styles.agentsTag}>{msg.agentsUsed.join(', ')}</span>
                    )}
                    {msg.success === false && (
                      <span style={styles.errorTag}>⚠️</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                  <div style={styles.loadingDots}>
                    <span style={styles.loadingDot}>●</span>
                    <span style={{ ...styles.loadingDot, animationDelay: '0.3s' }}>●</span>
                    <span style={{ ...styles.loadingDot, animationDelay: '0.6s' }}>●</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showActions && (
            <div style={styles.quickActions}>
              <p style={styles.quickActionsLabel}>⚡ Quick Actions</p>
              <div style={styles.quickActionsGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.action}
                    onClick={() => handleQuickAction(action)}
                    style={{
                      ...styles.quickActionBtn,
                      borderColor: `${action.color}33`,
                    }}
                    disabled={isLoading}
                  >
                    <span style={styles.quickActionIcon}>{action.icon}</span>
                    <span style={styles.quickActionLabel}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={styles.inputArea}>
            <form onSubmit={handleSubmit} style={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a command... (Roman Urdu ya English)"
                style={styles.input}
                disabled={isLoading}
                autoComplete="off"
              />
              <button type="submit" style={styles.sendBtn} disabled={isLoading}>
                {isLoading ? '⏳' : '➤'}
              </button>
            </form>
            <div style={styles.inputHints}>
              <button
                type="button"
                onClick={() => setShowActions(!showActions)}
                style={styles.hintBtn}
              >
                ⚡ {showActions ? 'Hide' : 'Show'} Actions
              </button>
              <span style={styles.hintText}>
                Groq: {status.groqRemaining} • Gemini: {status.geminiRemaining} • Routed:{' '}
                {status.totalRouted}
              </span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// --------------------------------------------
// STYLES
// --------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0f',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #2a2a3d',
    background: '#0f0f17',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '1.8rem',
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#f0f0f5',
    margin: 0,
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: '0.7rem',
    color: '#6a6a82',
    letterSpacing: '0.02em',
    margin: 0,
  },
  statusDots: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  connectBtn: {
    padding: '8px 14px',
    background: 'rgba(201, 169, 98, 0.1)',
    border: '1px solid rgba(201, 169, 98, 0.3)',
    borderRadius: '8px',
    color: '#c9a962',
    fontSize: '0.78rem',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 65px)',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '16px',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    wordBreak: 'break-word',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #c9a962, #a68b4b)',
    color: '#000',
    borderBottomRightRadius: '4px',
    fontWeight: 500,
  },
  assistantBubble: {
    background: '#14141f',
    border: '1px solid #2a2a3d',
    color: '#e0e0ec',
    borderBottomLeftRadius: '4px',
  },
  systemBubble: {
    background: 'rgba(96, 165, 250, 0.08)',
    border: '1px solid rgba(96, 165, 250, 0.2)',
    color: '#93c5fd',
    maxWidth: '100%',
    textAlign: 'center',
    borderRadius: '10px',
    fontSize: '0.82rem',
  },
  msgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  msgAgent: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#c9a962',
  },
  msgTime: {
    fontSize: '0.68rem',
    color: '#6a6a82',
    background: '#1a1a28',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  msgContent: {
    lineHeight: 1.7,
  },
  msgFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  timestamp: {
    fontSize: '0.68rem',
    color: '#4a4a62',
  },
  agentsTag: {
    fontSize: '0.65rem',
    color: '#c9a962',
    background: 'rgba(201, 169, 98, 0.1)',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid rgba(201, 169, 98, 0.2)',
  },
  errorTag: {
    fontSize: '0.75rem',
  },
  loadingDots: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  loadingDot: {
    color: '#c9a962',
    fontSize: '1.2rem',
    animation: 'pulse 1.5s infinite',
  },
  quickActions: {
    padding: '16px 20px',
    borderTop: '1px solid #1a1a28',
  },
  quickActionsLabel: {
    fontSize: '0.75rem',
    color: '#6a6a82',
    marginBottom: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  quickActionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '12px 8px',
    background: '#14141f',
    border: '1px solid #2a2a3d',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#e0e0ec',
  },
  quickActionIcon: {
    fontSize: '1.3rem',
  },
  quickActionLabel: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: '#a0a0b8',
    textAlign: 'center',
  },
  inputArea: {
    padding: '14px 20px 20px',
    borderTop: '1px solid #1a1a28',
    background: '#0f0f17',
  },
  inputWrapper: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '14px 18px',
    background: '#0a0a0f',
    border: '1px solid #2a2a3d',
    borderRadius: '12px',
    color: '#f0f0f5',
    fontSize: '0.9rem',
    outline: 'none',
  },
  sendBtn: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #c9a962, #a68b4b)',
    border: 'none',
    color: '#000',
    fontSize: '1.2rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputHints: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    padding: '0 4px',
  },
  hintBtn: {
    background: 'none',
    border: 'none',
    color: '#6a6a82',
    fontSize: '0.7rem',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  hintText: {
    fontSize: '0.68rem',
    color: '#4a4a62',
  },
};
