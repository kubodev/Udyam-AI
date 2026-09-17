/* ──────────────────────────────────────────────
   VyapaarAI — Core Type Definitions
   Mirrors the Supabase Postgres schema defined
   in architecture/MAIN_DEVELOPMENT_PROMPT.md §5.
   ────────────────────────────────────────────── */

// ── Business Profile ──────────────────────────
export interface BusinessProfile {
  id: string;
  user_id: string;
  name: string | null;
  preferred_language: string;
  business_name: string | null;
  business_type: string | null;
  sector: string | null;
  description: string | null;
  location: string | null;
  state: string | null;
  business_stage: string | null;
  employee_count: number | null;
  monthly_revenue: number | null;
  monthly_expenses: number | null;
  existing_debt: string | null;
  primary_goal: string | null;
  funding_requirement: number | null;
  use_of_funds: string | null;
  upi_id: string | null;
  web_presence: string | null;
  gst_status: string | null;
  udyam_status: string | null;
  other_certificates: string | null;
  created_at: string;
  updated_at: string;
}

// ── Conversations & Messages ──────────────────
export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string | null;
  tool_calls: ToolCall[] | null;
  created_at: string;
}

// ── Knowledge / RAG ───────────────────────────
export type KnowledgeCategory = 'fraud' | 'literacy' | 'scheme_info' | 'document';

export interface KnowledgeChunk {
  id: string;
  category: KnowledgeCategory;
  source: string | null;
  chunk_text: string;
  embedding?: number[]; // pgvector — not typically sent to client
}

// ── Funding ───────────────────────────────────
export interface FundingSource {
  id: string;
  name: string | null;
  org: string | null;
  url: string | null;
  last_synced: string | null;
}

export interface FundingOpportunity {
  id: string;
  source_id: string | null;
  name: string | null;
  provider: string | null;
  description: string | null;
  sector: string | null;
  location: string | null;
  business_stage: string | null;
  funding_range_min: number | null;
  funding_range_max: number | null;
  eligibility_text: string | null;
  deadline: string | null;
  source_url: string | null;
  application_url: string | null;
  last_verified: string | null;
  metadata: Record<string, unknown> | null;
}

export type OpportunityStatus = 'Saved' | 'Preparing' | 'Draft Ready' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Closed';

export interface SavedOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: OpportunityStatus;
  notes: string | null;
  created_at: string;
}

// ── Applications ──────────────────────────────
export type ApplicationStatus = 'Draft Ready' | 'Preparing' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Closed';

export interface ApplicationDraftContent {
  business_overview?: string;
  current_business?: string;
  problem_opportunity?: string;
  growth_plan?: string;
  funding_requirement?: string;
  use_of_funds?: string;
  expected_impact?: string;
}

export interface Application {
  id: string;
  user_id: string;
  opportunity_id: string;
  draft_content: ApplicationDraftContent | null;
  status: ApplicationStatus;
  missing_fields: string[] | null;
  created_at: string;
  updated_at: string;
}

// ── Tasks ─────────────────────────────────────
export type TaskStatus = 'open' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'funding' | 'compliance' | 'finance' | 'operations' | 'general';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  category: TaskCategory | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  created_at: string;
}

// ── Documents (P1) ────────────────────────────
export type DocumentType = 'bank_statement' | 'invoice' | 'certificate' | 'other';
export type DocumentStatus = 'uploaded' | 'processing' | 'extracted' | 'needs_review' | 'error';

export interface Document {
  id: string;
  user_id: string;
  storage_path: string | null;
  doc_type: DocumentType | null;
  status: DocumentStatus;
  uploaded_at: string;
}

export interface DocumentExtraction {
  id: string;
  document_id: string;
  extracted_fields: Record<string, unknown> | null;
  confidence: number | null;
  reviewed: boolean;
  created_at: string;
}

// ── Financial Records (P1) ────────────────────
export type TransactionDirection = 'credit' | 'debit';

export interface FinancialRecord {
  id: string;
  user_id: string;
  document_id: string | null;
  date: string | null;
  amount: number | null;
  direction: TransactionDirection | null;
  category: string | null;
  is_recurring: boolean;
}

// ── Fit Check Result ──────────────────────────
export type FitStatus = 'match' | 'no_match' | 'unknown';

export interface FitCheckItem {
  criterion: string;
  status: FitStatus;
  profile_value: string | null;
  required_value: string | null;
}

export interface FitCheckResult {
  opportunity_id: string;
  items: FitCheckItem[];
  summary: string;
}

// ── AI Tool Definitions (model TBD) ───────────
export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// ── Action Cards (rendered from AI tool calls) ─
export type ActionCardType =
  | 'view_opportunities'
  | 'view_opportunity_detail'
  | 'calculate_break_even'
  | 'check_payment_risk'
  | 'generate_qr'
  | 'create_task'
  | 'view_health_check';

export interface ActionCard {
  type: ActionCardType;
  data: Record<string, unknown>;
}
