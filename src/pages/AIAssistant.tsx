import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, RefreshCw, Plus, ListChecks, ShieldCheck, Landmark,
  Calculator, MessageSquare, Trash2, ChevronDown, ChevronRight, Zap,
  Bot, User, Clock, Globe, Check,
} from 'lucide-react';
import ActionCard, { detectActionCards, type ActionCardData } from '../components/ActionCard';
import {
  sendChatMessage, getOrCreateConversation, getMessages, saveMessage,
  listConversations, createConversation, deleteConversation,
  updateConversationTitle, generateConversationTitle,
  CHAT_LANGUAGES, type ChatLanguage,
} from '../services/chat';
import { createTask } from '../services/tasks';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { ChatMessage } from '../services/chat';
import type { Message, Conversation } from '../types';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  actionCards?: ActionCardData[];
  userText?: string;
  isNew?: boolean;
}

const SUGGESTIONS = [
  { text: 'Is this UPI message a scam?',         icon: ShieldCheck, color: '#245536' },
  { text: 'Find funding for my tailoring business', icon: Landmark,   color: '#c24a1e' },
  { text: 'What is a break-even point?',          icon: Calculator,  color: '#1e4d3a' },
  { text: 'How do I improve my business health?', icon: Zap,         color: '#8a5a12' },
];

/* ─── lightweight markdown renderer ─────────────────────────────── */
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="ai-msg-text">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isBullet =
          trimmed.startsWith('- ') ||
          trimmed.startsWith('• ') ||
          /^\d+\./.test(trimmed);
        const content = trimmed.startsWith('- ')
          ? trimmed.slice(2)
          : trimmed.startsWith('• ')
          ? trimmed.slice(2)
          : trimmed.replace(/^\d+\.\s*/, '');

        const renderBold = (str: string) => {
          const parts = str.split(/\*\*(.+?)\*\*/g);
          return parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p));
        };

        if (!trimmed) return <div key={i} style={{ height: '0.5em' }} />;
        if (isBullet)
          return (
            <div key={i} className="ai-bullet">
              <span className="ai-bullet__dot" />
              <span>{renderBold(content)}</span>
            </div>
          );
        return <p key={i} style={{ margin: 0 }}>{renderBold(trimmed)}</p>;
      })}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────── */
export default function AIAssistant() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [creatingTask, setCreatingTask] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('udyam_chat_lang') || profile?.preferred_language || 'en';
  });

  const bottomRef       = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const dropdownRef     = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    localStorage.setItem('udyam_chat_lang', code);
    setLangDropdownOpen(false);
  };

  const currentLang = CHAT_LANGUAGES.find((l) => l.code === selectedLanguage) ?? CHAT_LANGUAGES[0];

  /* ── helpers ── */
  const businessContext = profile
    ? JSON.stringify({
        name: profile.name, business_name: profile.business_name, sector: profile.sector,
        description: profile.description, location: profile.location, state: profile.state,
        business_stage: profile.business_stage, monthly_revenue: profile.monthly_revenue,
        monthly_expenses: profile.monthly_expenses, upi_id: profile.upi_id,
        gst_status: profile.gst_status, udyam_status: profile.udyam_status,
        primary_goal: profile.primary_goal, funding_requirement: profile.funding_requirement,
      })
    : '{}';

  const loadMessages = useCallback(async (convId: string) => {
    const history = await getMessages(convId);
    setMessages(
      history.map((m: Message) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content ?? '',
        created_at: m.created_at,
      }))
    );

    // Auto-update conversation title if it still has a default title
    const firstUserMsg = history.find((m) => m.role === 'user');
    if (firstUserMsg?.content) {
      setConversations((prev) => {
        const target = prev.find((c) => c.id === convId);
        if (target && (!target.title || target.title === 'New conversation' || target.title === 'New chat')) {
          const generated = generateConversationTitle(firstUserMsg.content);
          updateConversationTitle(convId, generated).catch(() => {});
          return prev.map((c) => (c.id === convId ? { ...c, title: generated } : c));
        }
        return prev;
      });
    }
  }, []);

  /* ── init ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const list = await listConversations(user.id);
      setConversations(list);
      if (list.length > 0) {
        setActiveConvId(list[0].id);
        await loadMessages(list[0].id);
      } else {
        const convo = await getOrCreateConversation(user.id);
        if (convo) {
          setActiveConvId(convo.id);
          setConversations([convo]);
        }
      }
      setInitializing(false);
    })();
  }, [user]);

  /* ── auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── new chat ── */
  const handleNewChat = async () => {
    if (!user) return;
    const convo = await createConversation(user.id, 'New chat');
    if (convo) {
      setConversations((prev) => [convo, ...prev]);
      setActiveConvId(convo.id);
      setMessages([]);
      setDropdownOpen(false);
    }
  };

  /* ── switch conversation ── */
  const handleSelectConv = async (convId: string) => {
    if (convId === activeConvId) { setDropdownOpen(false); return; }
    setActiveConvId(convId);
    setMessages([]);
    setDropdownOpen(false);
    await loadMessages(convId);
  };

  /* ── delete conversation ── */
  const handleDeleteConv = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setDeletingId(convId);
    const ok = await deleteConversation(convId);
    setDeletingId(null);
    if (!ok) return;
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);
    if (activeConvId === convId) {
      if (updated.length > 0) {
        setActiveConvId(updated[0].id);
        await loadMessages(updated[0].id);
      } else {
        const convo = await createConversation(user!.id);
        if (convo) { setConversations([convo]); setActiveConvId(convo.id); setMessages([]); }
      }
    }
  };

  /* ── send message ── */
  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: DisplayMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user', content: messageText,
      created_at: new Date().toISOString(), isNew: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    if (activeConvId) {
      await saveMessage(activeConvId, 'user', messageText);
      const conv = conversations.find((c) => c.id === activeConvId);
      if (conv && (!conv.title || conv.title === 'New conversation' || conv.title === 'New chat')) {
        const newTitle = generateConversationTitle(messageText);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, title: newTitle } : c))
        );
        updateConversationTitle(activeConvId, newTitle).catch(() => {});
      }
    }

    const history: ChatMessage[] = [...messages, userMsg]
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const { content } = await sendChatMessage(history, businessContext, selectedLanguage);
    const actionCards = detectActionCards(messageText, content);

    const assistantMsg: DisplayMessage = {
      id: `tmp-${Date.now() + 1}`,
      role: 'assistant', content,
      created_at: new Date().toISOString(),
      actionCards, userText: messageText, isNew: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);

    if (activeConvId) await saveMessage(activeConvId, 'assistant', content);
  };

  /* ── create task ── */
  const handleCreateTask = async (msg: DisplayMessage) => {
    if (!user) return;
    setCreatingTask(msg.id);
    const rawTitle = msg.userText ?? msg.content;
    const title = rawTitle.length > 80 ? rawTitle.slice(0, 77) + '…' : rawTitle;
    const { error } = await createTask(user.id, {
      title: `Follow up: ${title}`,
      description: `Created from AI conversation. AI response: ${msg.content.slice(0, 200)}…`,
      category: 'general', priority: 'medium',
    });
    setCreatingTask(null);
    if (error) showToast(`Failed to create task: ${error}`, 'error');
    else showToast('Task created — view it in Tasks ✓', 'success');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  /* ─────────────────────────────── render ─────────────────────────── */
  return (
    <div className="ai-shell">

      {/* ── Minimal Top Controls (No navbar) ── */}
      <div className="ai-top-bar">
        <div className="ai-top-bar__actions" ref={dropdownRef}>
          {/* Recent chats dropdown */}
          <div className="ai-dropdown-container">
            <button
              className="ai-btn-minimal"
              onClick={() => setDropdownOpen((v) => !v)}
              title="Recent conversations"
            >
              <Clock size={14} />
              <span className="ai-btn-minimal__label">
                {activeConv?.title && activeConv.title !== 'New conversation' && activeConv.title !== 'New chat'
                  ? activeConv.title.length > 28
                    ? activeConv.title.slice(0, 26) + '…'
                    : activeConv.title
                  : 'Recent chats'}
              </span>
              <ChevronDown
                size={13}
                className={`ai-caret ${dropdownOpen ? 'ai-caret--open' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="ai-conv-dropdown">
                <div className="ai-conv-dropdown__header">
                  <MessageSquare size={13} />
                  <span>Recent conversations</span>
                </div>

                <div className="ai-conv-dropdown__list">
                  {conversations.length === 0 ? (
                    <p className="ai-conv-dropdown__empty">No conversations yet</p>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`ai-conv-row ${conv.id === activeConvId ? 'ai-conv-row--active' : ''}`}
                        onClick={() => handleSelectConv(conv.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ai-conv-row__body">
                          <span className="ai-conv-row__title">
                            {conv.title && conv.title !== 'New conversation' ? conv.title : 'New chat'}
                          </span>
                          <span className="ai-conv-row__date">{formatDate(conv.created_at)}</span>
                        </div>
                        <button
                          className="ai-conv-row__del"
                          onClick={(e) => handleDeleteConv(e, conv.id)}
                          title="Delete conversation"
                        >
                          {deletingId === conv.id
                            ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Trash2 size={11} />}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="ai-dropdown-container" ref={langDropdownRef}>
            <button
              className="ai-btn-minimal"
              onClick={() => setLangDropdownOpen((v) => !v)}
              title="Select response language"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Globe size={14} />
              <span className="ai-btn-minimal__label">
                {currentLang.native} {currentLang.code !== 'en' ? `(${currentLang.name})` : ''}
              </span>
              <ChevronDown
                size={13}
                className={`ai-caret ${langDropdownOpen ? 'ai-caret--open' : ''}`}
              />
            </button>

            {langDropdownOpen && (
              <div className="ai-conv-dropdown" style={{ minWidth: '13.5rem', right: 0, left: 'auto' }}>
                <div className="ai-conv-dropdown__header">
                  <Globe size={13} />
                  <span>Response language</span>
                </div>

                <div className="ai-conv-dropdown__list" style={{ maxHeight: '18rem', overflowY: 'auto' }}>
                  {CHAT_LANGUAGES.map((lang) => (
                    <div
                      key={lang.code}
                      className={`ai-conv-row ${lang.code === selectedLanguage ? 'ai-conv-row--active' : ''}`}
                      onClick={() => handleSelectLanguage(lang.code)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="ai-conv-row__body">
                        <span className="ai-conv-row__title" style={{ fontWeight: lang.code === selectedLanguage ? 650 : 400 }}>
                          {lang.native}
                        </span>
                        <span className="ai-conv-row__date">{lang.name}</span>
                      </div>
                      {lang.code === selectedLanguage && (
                        <Check size={14} color="var(--color-primary-600)" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New chat button */}
          <button className="ai-btn-minimal ai-btn-minimal--primary" onClick={handleNewChat} title="Start new conversation">
            <Plus size={14} />
            <span>New chat</span>
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="ai-messages">
        {initializing ? (
          <div className="ai-center-state">
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-surface-400)' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="ai-welcome">
            <div className="ai-welcome__glow" />
            <div className="ai-welcome__icon" style={{ background: '#fff', border: '1px solid var(--color-surface-200)', overflow: 'hidden', padding: '0.45rem', width: '5.5rem', height: '5.5rem', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', marginBottom: '1.25rem' }}>
              <img src="/ai-logo.png" alt="Udyam AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h2 className="ai-welcome__title">
              What are we working on{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}?
            </h2>
            <p className="ai-welcome__sub">
              I have your business context. Ask me anything or pick a direction below.
            </p>

            {/* Quick Language Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Globe size={13} /> Language:
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {CHAT_LANGUAGES.slice(0, 6).map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleSelectLanguage(l.code)}
                    style={{
                      background: selectedLanguage === l.code ? 'var(--color-primary-600)' : 'var(--color-surface-100)',
                      color: selectedLanguage === l.code ? '#fff' : 'var(--color-surface-700)',
                      border: `1px solid ${selectedLanguage === l.code ? 'var(--color-primary-600)' : 'var(--color-surface-300)'}`,
                      borderRadius: '999px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {l.native}
                  </button>
                ))}
                {CHAT_LANGUAGES.length > 6 && (
                  <button
                    onClick={() => setLangDropdownOpen(true)}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-primary-600)',
                      border: '1px dashed var(--color-primary-300)',
                      borderRadius: '999px',
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    More ({CHAT_LANGUAGES.length - 6}) ▾
                  </button>
                )}
              </div>
            </div>
            <div className="ai-suggestion-grid">
              {SUGGESTIONS.map(({ text, icon: Icon, color }) => (
                <button
                  key={text}
                  className="ai-suggestion-card"
                  onClick={() => handleSend(text)}
                  style={{ '--card-accent': color } as React.CSSProperties}
                >
                  <span className="ai-suggestion-card__icon"><Icon size={17} /></span>
                  <span className="ai-suggestion-card__text">{text}</span>
                  <ChevronRight size={14} className="ai-suggestion-card__arrow" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-msg ${msg.role === 'user' ? 'ai-msg--user' : 'ai-msg--ai'} ${msg.isNew ? 'ai-msg--new' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="ai-msg__avatar ai-msg__avatar--ai" style={{ background: '#fff', border: '1px solid var(--color-surface-200)', overflow: 'hidden', padding: '1px' }}>
                    <img src="/ai-logo.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}

                <div className="ai-msg__body">
                  <div className={`ai-msg__bubble ${msg.role === 'user' ? 'ai-msg__bubble--user' : 'ai-msg__bubble--ai'}`}>
                    {msg.role === 'assistant'
                      ? <MarkdownText text={msg.content} />
                      : <span>{msg.content}</span>}
                  </div>
                  <div className="ai-msg__meta"><span>{formatTime(msg.created_at)}</span></div>

                  {msg.role === 'assistant' && msg.actionCards && msg.actionCards.length > 0 && (
                    <div className="ai-action-cards">
                      {msg.actionCards.map((card) => <ActionCard key={card.type} card={card} />)}
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <button
                      className="ai-task-btn"
                      onClick={() => handleCreateTask(msg)}
                      disabled={creatingTask === msg.id}
                    >
                      {creatingTask === msg.id
                        ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                        : <><Plus size={11} /><ListChecks size={11} /></>}
                      Save as task
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="ai-msg__avatar ai-msg__avatar--user"><User size={18} /></div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-msg ai-msg--ai ai-msg--new">
                <div className="ai-msg__avatar ai-msg__avatar--ai" style={{ background: '#fff', border: '1px solid var(--color-surface-200)', overflow: 'hidden', padding: '1px' }}>
                  <img src="/ai-logo.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div className="ai-msg__body">
                  <div className="ai-msg__bubble ai-msg__bubble--ai ai-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Composer ── */}
      <div className="ai-composer-wrap">
        <div className="ai-composer">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask UdyamAI anything… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="ai-composer__input"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="ai-composer__send"
          >
            {loading
              ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={16} />}
          </button>
        </div>
        <p className="ai-composer__hint">
          UdyamAI can make mistakes. Verify important financial or legal information.
        </p>
      </div>
    </div>
  );
}
