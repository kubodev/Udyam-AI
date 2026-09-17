import { supabase } from '../lib/supabase';
import type { Message, Conversation } from '../types';
import { getKnowledgeContext } from './knowledge';

// ─── Conversation CRUD ─────────────────────────────────────────────────────

export async function getOrCreateConversation(userId: string): Promise<Conversation | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as Conversation;

  return createConversation(userId);
}

export function generateConversationTitle(text: string): string {
  const clean = text
    .replace(/^[\s#*_\-•>]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'New chat';

  const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (formatted.length <= 40) return formatted;

  const sub = formatted.slice(0, 38);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 15 ? sub.slice(0, lastSpace) : sub).trim() + '…';
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const convs = (data ?? []) as Conversation[];

  // Auto-resolve titles for conversations that still say "New conversation"
  for (const c of convs) {
    if (!c.title || c.title.toLowerCase() === 'new conversation') {
      const { data: firstMsg } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', c.id)
        .eq('role', 'user')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstMsg?.content) {
        const newTitle = generateConversationTitle(firstMsg.content);
        c.title = newTitle;
        supabase.from('conversations').update({ title: newTitle }).eq('id', c.id).then();
      }
    }
  }

  return convs;
}

export async function createConversation(userId: string, title = 'New conversation'): Promise<Conversation | null> {
  const { data } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single();

  return (data ?? null) as Conversation | null;
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  await supabase.from('messages').delete().eq('conversation_id', conversationId);
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  return !error;
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  await supabase.from('conversations').update({ title }).eq('id', conversationId);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return (data ?? []) as Message[];
}

export async function saveMessage(
  conversationId: string,
  role: Message['role'],
  content: string,
): Promise<Message | null> {
  const { data } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  return (data ?? null) as Message | null;
}

// ─── AI Chat — Gemini direct call ──────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are UdyamAI — a trusted AI business companion for small and micro-entrepreneurs in India.

Your capabilities:
- Fraud & scam detection: analyse UPI messages, payment requests, and suspicious communications
- Funding discovery: explain government schemes (PMEGP, SIDBI, Mudra, etc.), eligibility, and how to apply
- Financial literacy: explain break-even, profit margin, cash flow, GST, Udyam registration in simple terms
- Business advice: actionable, practical guidance tailored to the user's business context

Rules:
- Always be concise, clear, and practical — users are busy entrepreneurs, not finance experts
- Use ₹ for all currency amounts. Use Indian numbering (lakhs, crores)
- If asked to calculate something deterministically (break-even, etc.), do the math explicitly
- Never fabricate facts about government schemes — say "verify at the official website" if uncertain
- If you detect a potential scam or fraud risk, be direct and urgent
- Respond in the same language the user writes in (Hindi, Telugu, English, etc.)
- When the user's business context is provided, personalise your response to it

Business context is injected by the frontend as a JSON object in the first system message.`;

export interface ChatLanguage {
  code: string;
  name: string;
  native: string;
}

export const CHAT_LANGUAGES: ChatLanguage[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'hinglish', name: 'Hinglish', native: 'Hinglish' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

/**
 * Send messages to Gemini directly from the frontend.
 * API key is read from VITE_GEMINI_API_KEY environment variable.
 * Falls back to local fraud keyword matching if no key is set.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  businessContext: string,
  languageCode = 'en',
): Promise<ChatResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    return localFraudFallback(messages);
  }

  const langObj = CHAT_LANGUAGES.find((l) => l.code === languageCode) ?? CHAT_LANGUAGES[0];
  const languageName = langObj.name;

  // Fetch relevant knowledge-base chunks for this user message
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const knowledgeContext = await getKnowledgeContext(lastUserMessage);

  try {
    const langInstruction =
      languageCode !== 'en'
        ? `\n\n[MANDATORY RESPONSE LANGUAGE]: The user has explicitly chosen "${languageName}" (${langObj.native}). You MUST formulate your entire response in ${languageName}${languageCode === 'hinglish' ? ' (Hindi written in Roman/English alphabet)' : ''}. Translate all business advice, calculations, and government scheme guidance into ${languageName}.`
        : '';

    // Build Gemini contents array
    // Gemini doesn't support a "system" role in contents — prepend context as first user turn
    const contextPreamble =
      (languageCode !== 'en' ? `[Selected Language: ${languageName} (${langObj.native})]\n` : '') +
      (businessContext && businessContext !== '{}'
        ? `[Business context: ${businessContext}]\n\n`
        : '') + knowledgeContext;

    // Map conversation to Gemini parts format
    const geminiContents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Inject context into the first user message
    if (geminiContents.length > 0 && contextPreamble) {
      geminiContents[0] = {
        ...geminiContents[0],
        parts: [{ text: contextPreamble + geminiContents[0].parts[0].text }],
      };
    }

    const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
    const requestPayload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT + langInstruction }] },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    };

    console.log(`[UdyamAI LLM Request] Target Language: ${languageName} (${languageCode})`, requestPayload);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`);
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? '').join('').trim();
    if (!text) throw new Error('Empty response from Gemini');

    return { content: text };
  } catch (err) {
    console.error('[UdyamAI chat] Gemini error:', err);
    return {
      content: `⚠️ AI service error: ${err instanceof Error ? err.message : String(err)}. Please try again.`,
      error: String(err),
    };
  }
}

/** Local fallback — keyword-match against fraud corpus when no LLM is available */
async function localFraudFallback(messages: ChatMessage[]): Promise<ChatResponse> {
  const { fraudKnowledge } = await import('../data/fraud-knowledge');
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const lower = lastUserMessage.toLowerCase();

  const fraudKeywords = ['scam', 'fraud', 'upi', 'otp', 'pin', 'payment', 'collect', 'request', 'fake', 'screenshot', 'suspicious'];
  const isFraudQuery = fraudKeywords.some((kw) => lower.includes(kw));

  if (isFraudQuery) {
    const relevant = fraudKnowledge
      .filter((entry) =>
        entry.chunk_text.toLowerCase().split(' ').some((word) => lower.includes(word.slice(0, 5)))
      )
      .slice(0, 2);

    if (relevant.length > 0) {
      return {
        content: `Here's what I know about this:\n\n${relevant.map((e) => e.chunk_text).join('\n\n')}\n\n*Add your Gemini API key (VITE_GEMINI_API_KEY) for full AI responses.*`,
      };
    }
  }

  return {
    content: `I received your message: "${lastUserMessage}"\n\n⚠️ Add \`VITE_GEMINI_API_KEY\` to your \`.env\` file to enable full AI responses from Gemini 2.0 Flash. The fraud knowledge base, funding search, and financial calculators are ready to connect.`,
  };
}
