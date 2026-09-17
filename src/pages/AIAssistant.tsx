import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare, RefreshCw, Plus, ListChecks } from 'lucide-react';
import ChatMessageBubble from '../components/ChatMessage';
import ActionCard, { detectActionCards, type ActionCardData } from '../components/ActionCard';
import { sendChatMessage, getOrCreateConversation, getMessages, saveMessage } from '../services/chat';
import { createTask } from '../services/tasks';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { ChatMessage } from '../services/chat';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  actionCards?: ActionCardData[];
  userText?: string; // original user text that triggered this assistant message
}

const SUGGESTIONS = [
  'Is this UPI message a scam?',
  'Find funding for my tailoring business',
  'What is a break-even point?',
  'How do I improve my business health score?',
  'Generate a UPI QR for me',
  'What government schemes apply to my business?',
];

export default function AIAssistant() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [creatingTask, setCreatingTask] = useState<string | null>(null); // message id being task-ified
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize conversation and load history
  useEffect(() => {
    if (!user) return;
    (async () => {
      const convo = await getOrCreateConversation(user.id);
      if (convo) {
        setConversationId(convo.id);
        const history = await getMessages(convo.id);
        setMessages(history.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content ?? '',
          created_at: m.created_at,
        })));
      }
      setInitializing(false);
    })();
  }, [user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const businessContext = profile
    ? JSON.stringify({
        name: profile.name,
        business_name: profile.business_name,
        sector: profile.sector,
        description: profile.description,
        location: profile.location,
        state: profile.state,
        business_stage: profile.business_stage,
        monthly_revenue: profile.monthly_revenue,
        monthly_expenses: profile.monthly_expenses,
        upi_id: profile.upi_id,
        gst_status: profile.gst_status,
        udyam_status: profile.udyam_status,
        primary_goal: profile.primary_goal,
        funding_requirement: profile.funding_requirement,
      })
    : '{}';

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;
    setInput('');

    const userMsg: DisplayMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Save user message
    if (conversationId) await saveMessage(conversationId, 'user', messageText);

    // Build history for LLM context (last 10 messages)
    const history: ChatMessage[] = [...messages, userMsg]
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const { content } = await sendChatMessage(history, businessContext);

    // Detect action cards from user intent + AI response
    const actionCards = detectActionCards(messageText, content);

    const assistantMsg: DisplayMessage = {
      id: `tmp-${Date.now() + 1}`,
      role: 'assistant',
      content,
      created_at: new Date().toISOString(),
      actionCards,
      userText: messageText,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);

    // Save assistant message
    if (conversationId) await saveMessage(conversationId, 'assistant', content);
  };

  const handleCreateTask = async (msg: DisplayMessage) => {
    if (!user) return;
    setCreatingTask(msg.id);

    // Build a concise task title from the user's question
    const rawTitle = msg.userText ?? msg.content;
    const title = rawTitle.length > 80 ? rawTitle.slice(0, 77) + '…' : rawTitle;

    const { error } = await createTask(user.id, {
      title: `Follow up: ${title}`,
      description: `Created from AI conversation. AI response: ${msg.content.slice(0, 200)}…`,
      category: 'general',
      priority: 'medium',
    });

    setCreatingTask(null);
    if (error) {
      showToast(`Failed to create task: ${error}`, 'error');
    } else {
      showToast('Task created — view it in Tasks ✓', 'success');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6.5rem)' }}
    >
      <div className="page-header">
        <h1>AI Assistant</h1>
        <p>Ask anything about your business — fraud protection, funding, finances</p>
      </div>

      <div
        className="card"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {initializing ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <RefreshCw size={18} color="var(--color-surface-400)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            /* Empty state with suggestions */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Sparkles size={24} color="white" />
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '0.375rem' }}>
                Hi{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}! I'm VyapaarAI
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1.5rem', maxWidth: '28rem' }}>
                I know your business context and can help with fraud protection, funding discovery, financial tools, and business decisions.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: '36rem' }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem' }}
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessageBubble message={msg} />

                {/* Action cards + Create Task — shown after assistant messages */}
                {msg.role === 'assistant' && (
                  <div style={{ marginLeft: '2.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {/* Action cards */}
                    {msg.actionCards && msg.actionCards.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {msg.actionCards.map((card) => (
                          <ActionCard key={card.type} card={card} />
                        ))}
                      </div>
                    )}

                    {/* Create Task button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                      <button
                        onClick={() => handleCreateTask(msg)}
                        disabled={creatingTask === msg.id}
                        title="Create a task from this conversation"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.25rem 0.625rem',
                          fontSize: '0.75rem', fontWeight: 500,
                          color: 'var(--color-surface-400)',
                          background: 'none', border: '1px solid var(--color-surface-200)',
                          borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary-600)'; e.currentTarget.style.borderColor = 'var(--color-primary-300)'; e.currentTarget.style.background = 'var(--color-primary-50)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-surface-400)'; e.currentTarget.style.borderColor = 'var(--color-surface-200)'; e.currentTarget.style.background = 'none'; }}
                      >
                        {creatingTask === msg.id
                          ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Plus size={11} />
                        }
                        <ListChecks size={11} />
                        Create task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: '1.875rem', height: '1.875rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent-400), var(--color-accent-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'white', fontWeight: 600 }}>✦</div>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--color-surface-100)', borderRadius: '0.25rem 1rem 1rem 1rem', border: '1px solid var(--color-surface-300)', boxShadow: 'var(--shadow-card)' }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--color-surface-400)',
                      animation: `pulse-subtle 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ borderTop: '1px solid var(--color-surface-200)', padding: '0.875rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <MessageSquare size={18} color="var(--color-surface-400)" style={{ marginBottom: '0.5rem', flexShrink: 0 }} />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask VyapaarAI anything… (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontSize: '0.875rem', color: 'var(--color-surface-800)',
              background: 'transparent', lineHeight: 1.5, maxHeight: '8rem',
              fontFamily: 'var(--font-sans)',
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
