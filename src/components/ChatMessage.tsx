import type { Message } from '../types';

interface ChatMessageBubbleProps {
  message: Message | { role: 'user' | 'assistant'; content: string; id: string; created_at: string };
}

export default function ChatMessage({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      <div className="chat-message__avatar">
        {isUser ? 'Y' : '✦'}
      </div>
      <div className="chat-message__content">
        {message.content}
      </div>
    </div>
  );
}
