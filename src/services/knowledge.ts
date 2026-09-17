import { supabase } from '../lib/supabase';

export interface KnowledgeChunk {
  id: string;
  document_title: string;
  chunk_number: number | null;
  section: string | null;
  category: string | null;
  source: string | null;
  source_url: string | null;
  content: string;
  page_start: number | null;
  page_end: number | null;
  original_source_file: string | null;
}

/**
 * Full-text search the knowledge_base table.
 * Returns up to `limit` chunks ranked by relevance.
 */
export async function searchKnowledge(
  query: string,
  limit = 10,
): Promise<KnowledgeChunk[]> {
  if (!query.trim()) return [];

  try {
    // Use Postgres full-text search via the generated `fts` column
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .textSearch('fts', query.trim().split(/\s+/).join(' & '), {
        type: 'websearch',
        config: 'english',
      })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as KnowledgeChunk[];
  } catch {
    // Fallback: simple ilike search if fts fails
    try {
      const { data } = await supabase
        .from('knowledge_base')
        .select('*')
        .or(`content.ilike.%${query}%,document_title.ilike.%${query}%,section.ilike.%${query}%`)
        .limit(limit);
      return (data ?? []) as KnowledgeChunk[];
    } catch {
      return [];
    }
  }
}

/**
 * Fetch knowledge chunks by category (e.g. "funding", "acceleration").
 */
export async function getKnowledgeByCategory(
  category: string,
  limit = 20,
): Promise<KnowledgeChunk[]> {
  const { data } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('category', category)
    .limit(limit);
  return (data ?? []) as KnowledgeChunk[];
}

/**
 * Fetch all distinct document titles (for scheme browsing UI).
 */
export async function getKnowledgeDocuments(): Promise<string[]> {
  const { data } = await supabase
    .from('knowledge_base')
    .select('document_title')
    .order('document_title');

  if (!data) return [];
  // Deduplicate
  return [...new Set(data.map((r: { document_title: string }) => r.document_title))];
}

/**
 * Build a compact context string from top-N chunks for AI injection.
 * Returns empty string if no results or knowledge base not seeded.
 */
export async function getKnowledgeContext(userMessage: string, limit = 4): Promise<string> {
  if (!userMessage.trim()) return '';

  const chunks = await searchKnowledge(userMessage, limit);
  if (chunks.length === 0) return '';

  const formatted = chunks
    .map((c, i) =>
      [
        `[Scheme ${i + 1}: ${c.document_title}${c.section ? ` — ${c.section}` : ''}]`,
        `Source: ${c.source ?? 'Government of India'}`,
        c.content.slice(0, 800).trim(),
      ].join('\n')
    )
    .join('\n\n---\n\n');

  return `\n\n[Relevant Knowledge Base Context — use this to give accurate answers]:\n${formatted}`;
}
