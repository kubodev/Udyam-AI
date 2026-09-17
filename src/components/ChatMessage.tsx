import type { Message } from '../types';

interface ChatMessageBubbleProps {
  message: Message | { role: 'user' | 'assistant'; content: string; id: string; created_at: string };
}

export default function ChatMessage({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '0.625rem',
        alignItems: 'flex-start',
        animation: 'fade-in 0.2s ease-out',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '1.875rem',
          height: '1.875rem',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: isUser
            ? 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))'
            : 'linear-gradient(135deg, var(--color-accent-400), var(--color-accent-600))',
          color: 'white',
        }}
      >
        {isUser ? 'Y' : '✦'}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '72%',
          padding: '0.75rem 1rem',
          borderRadius: isUser ? '1rem 0.25rem 1rem 1rem' : '0.25rem 1rem 1rem 1rem',
          background: isUser ? '#6578f8' : 'var(--color-surface-100)',
          color: isUser ? 'white' : 'var(--color-surface-800)',
          fontSize: '0.875rem',
          lineHeight: 1.65,
          boxShadow: 'var(--shadow-card)',
          border: isUser ? 'none' : '1px solid var(--color-surface-300)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
