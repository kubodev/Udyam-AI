-- ============================================================
-- knowledge_base table — run in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste and Run
-- ============================================================

-- Create the knowledge_base table
create table if not exists knowledge_base (
  id                  uuid primary key default gen_random_uuid(),
  document_title      text not null,
  chunk_number        int,
  section             text,
  category            text,
  source              text,
  source_url          text,
  content             text not null,
  page_start          int,
  page_end            int,
  original_source_file text,
  -- Full-text search column (auto-generated)
  fts                 tsvector generated always as (
    setweight(to_tsvector('english', coalesce(document_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(section, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored
);

-- Full-text search index
create index if not exists knowledge_base_fts_idx
  on knowledge_base using gin(fts);

-- Category index for fast filtering
create index if not exists knowledge_base_category_idx
  on knowledge_base(category);

-- Document title index
create index if not exists knowledge_base_doc_title_idx
  on knowledge_base(document_title);

-- No RLS needed — this is public reference data (read-only for users)
-- Inserts are done by the admin seed script using service-role key

-- Allow anyone (including anon) to read knowledge_base rows
alter table knowledge_base enable row level security;
create policy "public read knowledge_base"
  on knowledge_base for select
  using (true);
