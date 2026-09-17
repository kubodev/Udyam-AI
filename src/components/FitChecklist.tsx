import type { FitCheckResult } from '../types';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface FitChecklistProps {
  result: FitCheckResult;
}

export default function FitChecklist({ result }: FitChecklistProps) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {result.items.map((item) => (
          <div
            key={item.criterion}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: item.status === 'match' ? '#f0fdf4' : item.status === 'no_match' ? '#fef2f2' : '#fefce8',
              border: `1px solid ${item.status === 'match' ? '#bbf7d0' : item.status === 'no_match' ? '#fecaca' : '#fde68a'}`,
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '1px' }}>
              {item.status === 'match' && <CheckCircle size={16} color="var(--color-success-600)" />}
              {item.status === 'no_match' && <XCircle size={16} color="var(--color-danger-600)" />}
              {item.status === 'unknown' && <HelpCircle size={16} color="var(--color-accent-600)" />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-900)', marginBottom: '0.125rem' }}>
                {item.criterion}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {item.profile_value && <span>Your profile: <strong>{item.profile_value}</strong></span>}
                {item.required_value && item.profile_value && <span>·</span>}
                {item.required_value && <span>Required: <strong>{item.required_value}</strong></span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-surface-500)', fontStyle: 'italic' }}>
        {result.summary}
      </p>
    </div>
  );
}
