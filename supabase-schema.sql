-- ============================================================
-- UdyamAI — Supabase Database Schema
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable pgvector extension
create extension if not exists vector;

-- ── business_profiles ──────────────────────────────────────
create table if not exists business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  name text,
  preferred_language text default 'en',
  business_name text,
  business_type text,
  sector text,
  description text,
  location text,
  state text,
  business_stage text,
  employee_count int,
  monthly_revenue numeric,
  monthly_expenses numeric,
  existing_debt text,
  primary_goal text,
  funding_requirement numeric,
  use_of_funds text,
  upi_id text,
  web_presence text,
  gst_status text,
  udyam_status text,
  other_certificates text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table business_profiles enable row level security;
create policy "own profile" on business_profiles for all using (auth.uid() = user_id);

-- ── conversations ──────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,
  created_at timestamptz default now()
);
alter table conversations enable row level security;
create policy "own conversations" on conversations for all using (auth.uid() = user_id);

-- ── messages ───────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations not null,
  role text not null,
  content text,
  tool_calls jsonb,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "own messages" on messages for all using (
  auth.uid() = (select user_id from conversations where id = conversation_id)
);

-- ── knowledge_chunks (pgvector RAG) ────────────────────────
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  source text,
  chunk_text text not null,
  embedding vector(1536)  -- adjust dimension to match your embedding model
);
-- Public read, admin write — no RLS needed
create index if not exists knowledge_chunks_embedding_idx on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── funding_sources ────────────────────────────────────────
create table if not exists funding_sources (
  id uuid primary key default gen_random_uuid(),
  name text,
  org text,
  url text,
  last_synced timestamptz
);

-- ── funding_opportunities ──────────────────────────────────
create table if not exists funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references funding_sources,
  name text,
  provider text,
  description text,
  sector text,
  location text,
  business_stage text,
  funding_range_min numeric,
  funding_range_max numeric,
  eligibility_text text,
  deadline date,
  source_url text,
  application_url text,
  last_verified date,
  metadata jsonb
);

-- ── saved_opportunities ────────────────────────────────────
create table if not exists saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  opportunity_id uuid references funding_opportunities not null,
  status text default 'Saved',
  notes text,
  created_at timestamptz default now()
);
alter table saved_opportunities enable row level security;
create policy "own saved_opportunities" on saved_opportunities for all using (auth.uid() = user_id);

-- ── applications ───────────────────────────────────────────
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  opportunity_id text not null,  -- text to support both UUID and seed IDs
  draft_content jsonb,
  status text default 'Draft Ready',
  missing_fields jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table applications enable row level security;
create policy "own applications" on applications for all using (auth.uid() = user_id);

-- ── tasks ──────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  due_date date,
  category text,
  priority text,
  status text default 'open',
  created_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "own tasks" on tasks for all using (auth.uid() = user_id);

-- ── documents (P1) ─────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  storage_path text,
  doc_type text,
  status text default 'uploaded',
  uploaded_at timestamptz default now()
);
alter table documents enable row level security;
create policy "own documents" on documents for all using (auth.uid() = user_id);

-- ── document_extractions (P1) ──────────────────────────────
create table if not exists document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents not null,
  extracted_fields jsonb,
  confidence numeric,
  reviewed boolean default false,
  created_at timestamptz default now()
);
alter table document_extractions enable row level security;
create policy "own extractions" on document_extractions for all using (
  auth.uid() = (select user_id from documents where id = document_id)
);

-- ── financial_records (P1) ─────────────────────────────────
create table if not exists financial_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  document_id uuid references documents,
  date date,
  amount numeric,
  direction text,
  category text,
  is_recurring boolean default false
);
alter table financial_records enable row level security;
create policy "own financial_records" on financial_records for all using (auth.uid() = user_id);

-- ── Seed: funding_sources ──────────────────────────────────
insert into funding_sources (id, name, org, url, last_synced) values
  ('00000000-0000-0000-0000-000000000001', 'MSME Development Institute', 'Ministry of MSME, Government of India', 'https://msme.gov.in', now()),
  ('00000000-0000-0000-0000-000000000002', 'SIDBI', 'Small Industries Development Bank of India', 'https://www.sidbi.in', now()),
  ('00000000-0000-0000-0000-000000000003', 'Telangana State Innovation Cell', 'Government of Telangana', 'https://startup.telangana.gov.in', now())
on conflict (id) do nothing;

-- ── Seed: funding_opportunities ────────────────────────────
insert into funding_opportunities (id, source_id, name, provider, description, sector, location, business_stage, funding_range_min, funding_range_max, eligibility_text, deadline, source_url, application_url, last_verified, metadata) values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Prime Minister Employment Generation Programme (PMEGP)',
    'KVIC / Ministry of MSME',
    'A credit-linked subsidy scheme to generate employment through establishment of micro-enterprises in the non-farm sector. Subsidy up to 35% for rural areas and 25% for urban areas. Project cost up to ₹50 lakh for manufacturing and ₹20 lakh for service sector.',
    null, null, 'Early Stage (< 1 year)', 100000, 5000000,
    'Any individual above 18 years of age. Beneficiary should have passed VIII standard for projects above ₹10 lakh. No income ceiling. Existing units not eligible.',
    null, 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp', 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp', '2025-09-01',
    '{"scheme_type": "subsidy", "implementing_agency": "KVIC / State DIC"}'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'SIDBI MSME Loan — Direct Finance',
    'Small Industries Development Bank of India (SIDBI)',
    'SIDBI provides direct finance to MSMEs for term loans for capacity expansion, technology upgradation, quality improvement, and working capital. Competitive interest rates typically ranging 7.5%–12% p.a.',
    null, null, 'Growing (1–3 years)', 1000000, 100000000,
    'Udyam-registered MSME with minimum 3 years of profitable operations. Valid financial statements required. GST registered preferred. No NPA classification.',
    null, 'https://www.sidbi.in/en/loans/direct-finance', 'https://www.sidbi.in/en/loans/direct-finance', '2025-09-01',
    '{"scheme_type": "loan", "interest_range": "7.5-12% p.a."}'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'T-Hub Startup Incubation Program',
    'T-Hub, Government of Telangana',
    'T-Hub is India''s largest startup incubator. The incubation program provides mentorship, co-working space, industry connections, and access to funding networks.',
    'Technology', 'Telangana', 'Early Stage (< 1 year)', 0, 5000000,
    'Technology-focused startup incorporated in India, preferably in Telangana. Early-stage preferred. Must pitch and clear selection process.',
    null, 'https://t-hub.co/incubation', 'https://t-hub.co/incubation', '2025-09-01',
    '{"scheme_type": "incubation", "location_preference": "Telangana"}'
  )
on conflict (id) do nothing;

-- ── Supabase Storage: documents bucket ─────────────────────
-- Note: In Supabase hosted, policies on storage.objects should be created
-- via Dashboard > Storage > Policies (storage.objects is owned by supabase_storage_admin).

-- Drop existing policies if already defined to allow safe re-runs
drop policy if exists "User document upload" on storage.objects;
drop policy if exists "User document read" on storage.objects;
drop policy if exists "User document delete" on storage.objects;

-- RLS policies for storage — users can only access their own user-id folder
create policy "User document upload" on storage.objects
  for insert with check (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "User document read" on storage.objects
  for select using (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "User document delete" on storage.objects
  for delete using (
    bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );

