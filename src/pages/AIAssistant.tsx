import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RefreshCw, Plus, ListChecks, ShieldCheck, Landmark, Calculator, ChevronRight } from 'lucide-react';
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

const PROMPT_CARDS = [
  { label: 'Stay protected', text: 'Is this UPI message a scam?', icon: ShieldCheck, tone: 'safe' },
  { label: 'Find an opportunity', text: 'Find funding for my tailoring business', icon: Landmark, tone: 'funding' },
  { label: 'Make a decision', text: 'What is a break-even point?', icon: Calculator, tone: 'finance' },
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
      <div className="assistant-page-header">
        <div>
          <div className="assistant-eyebrow"><span className="assistant-status-dot" /> Your business copilot</div>
          <h1>Good to see you{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}.</h1>
          <p>Practical guidance for every business decision, in one conversation.</p>
        </div>
      </div>

      <div className="assistant-workspace">
        <div className="assistant-context-bar">
          <div className="assistant-orb"><Sparkles size={16} /></div>
          <div><strong>UdyamAI</strong><span>Ready to help with your next move</span></div>
          <span className="assistant-online">Online</span>
        </div>
        {/* Messages area */}
        <div className="assistant-messages">
          {initializing ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <RefreshCw size={18} color="var(--color-surface-400)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            /* Empty state with suggestions */
            <div className="assistant-welcome">
              <div className="assistant-welcome__icon"><Sparkles size={24} /></div>
              <h2>What are we working on?</h2>
              <p>I have your business context in mind. Pick a direction or ask me anything.</p>
              <div className="prompt-card-grid">
                {PROMPT_CARDS.map(({ label, text, icon: Icon, tone }) => (
                  <button key={text} className={`prompt-card prompt-card--${tone}`} onClick={() => handleSend(text)}>
                    <span className="prompt-card__icon"><Icon size={18} /></span>
                    <span><small>{label}</small><strong>{text}</strong></span><ChevronRight size={16} className="prompt-card__arrow" />
                  </button>
                ))}
              </div>
              <div className="assistant-quick-prompts">
                <span>Try asking</span>
                {SUGGESTIONS.slice(3).map((s) => <button key={s} onClick={() => handleSend(s)}>{s}</button>)}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessageBubble message={msg} />

                {/* Action cards + Create Task — shown after assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="message-actions">
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
                        className="create-task-button"
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
            <div className="chat-typing"><div className="chat-typing__avatar">✦</div><div className="chat-typing__dots">
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
              </div></div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="assistant-composer-wrap">
          <div className="assistant-composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask UdyamAI anything… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="assistant-composer__input"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="assistant-send-button"
          >
            <Send size={15} />
          </button>
          </div>
          <p>UdyamAI can make mistakes. Verify important financial or legal information.</p>
        </div>
      </div>
    </div>
  );
}
