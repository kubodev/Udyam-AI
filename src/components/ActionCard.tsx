import { Link } from 'react-router-dom';
import { Landmark, Calculator, FileText, HeartPulse, QrCode, ListChecks, Shield, ArrowRight } from 'lucide-react';

export interface ActionCardData {
  type: 'funding' | 'calculator' | 'document' | 'health' | 'qr' | 'task' | 'fraud';
  label: string;
  description?: string;
  to: string;
}

const ICON_MAP = {
  funding:    Landmark,
  calculator: Calculator,
  document:   FileText,
  health:     HeartPulse,
  qr:         QrCode,
  task:       ListChecks,
  fraud:      Shield,
};

const COLOR_MAP: Record<ActionCardData['type'], string> = {
  funding:    '#7c3aed',
  calculator: '#c2410c',
  document:   '#d97706',
  health:     '#16a34a',
  qr:         '#0891b2',
  task:       '#4f46e5',
  fraud:      '#dc2626',
};

export default function ActionCard({ card }: { card: ActionCardData }) {
  const Icon = ICON_MAP[card.type];
  const color = COLOR_MAP[card.type];

  return (
    <Link
      to={card.to}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.65rem 0.95rem',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px -2px rgba(0, 0, 0, 0.45)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
          e.currentTarget.style.borderColor = 'rgba(125, 142, 255, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(0, 0, 0, 0.25)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        <div style={{
          width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)',
          background: `${color}25`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={15} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-surface-800)', margin: '0 0 0.125rem 0' }}>{card.label}</p>
          {card.description && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {card.description}
            </p>
          )}
        </div>
        <ArrowRight size={13} color="var(--color-surface-400)" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}

/** Detect what action cards to show based on user message + AI reply */
export function detectActionCards(userMessage: string, aiResponse: string): ActionCardData[] {
  const combined = `${userMessage} ${aiResponse}`.toLowerCase();
  const cards: ActionCardData[] = [];
  const seen = new Set<ActionCardData['type']>();

  const add = (card: ActionCardData) => {
    if (!seen.has(card.type)) { seen.add(card.type); cards.push(card); }
  };

  if (/fund|scheme|loan|grant|pmegp|mudra|sidbi|nabard|startup india|msme scheme/i.test(combined)) {
    add({ type: 'funding', label: 'Browse Funding Opportunities', description: 'Government schemes & loans for MSMEs', to: '/funding' });
  }
  if (/fraud|scam|fake|suspicious|otp|phishing|upi.{0,10}request|beware|cheating/i.test(combined)) {
    add({ type: 'fraud', label: 'Fraud Protection Tips', description: 'Stay safe from digital payment scams', to: '/assistant' });
  }
  if (/break.?even|profit.{0,10}margin|cash.{0,10}runway|fixed.{0,10}cost|calculator|calculate/i.test(combined)) {
    add({ type: 'calculator', label: 'Open Finance Tools', description: 'Break-even, profit margin, cash runway', to: '/finance' });
  }
  if (/document|bank.{0,10}statement|invoice|certificate|upload/i.test(combined)) {
    add({ type: 'document', label: 'Upload Documents', description: 'Bank statements, invoices, certificates', to: '/documents' });
  }
  if (/gst|udyam|msme.{0,10}register|comply|compliance|health.{0,10}check|business.{0,10}health/i.test(combined)) {
    add({ type: 'health', label: 'Check Business Health', description: 'Compliance & funding readiness', to: '/health' });
  }
  if (/qr.{0,10}code|upi.{0,10}id|accept.{0,10}payment|collect.{0,10}payment|generate.{0,10}qr/i.test(combined)) {
    add({ type: 'qr', label: 'Generate UPI QR Code', description: 'Accept payments instantly', to: '/create-qr' });
  }
  if (/task|action.{0,10}item|todo|follow.?up|remind|checklist/i.test(combined)) {
    add({ type: 'task', label: 'View Tasks', description: 'Track your business action items', to: '/tasks' });
  }

  return cards.slice(0, 3);
}
