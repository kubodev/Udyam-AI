import type { Message } from '../types';

interface ChatMessageBubbleProps {
  message: Message | { role: 'user' | 'assistant'; content: string; id: string; created_at: string };
}

export default function ChatMessage({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      <div className="chat-message__avatar" style={{ background: isUser ? undefined : '#fff', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: isUser ? undefined : '2px', width: '2.35rem', height: '2.35rem', borderRadius: '6px' }}>
        {isUser ? 'Y' : <img src="/ai-logo.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
      </div>
      <div className="chat-message__content">
        {message.content}
      </div>
    </div>
  );
}
