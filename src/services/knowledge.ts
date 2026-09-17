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
 * Tries websearch FTS first, falls back to plain FTS, then ilike.
 */
export async function searchKnowledge(
  query: string,
  documentTitle?: string,
  limit = 30,
): Promise<KnowledgeChunk[]> {
  const q = query.trim();
  const filterDoc = documentTitle && documentTitle !== 'All' ? documentTitle : null;

  if (!q) {
    // Return broad sample or specific document chunks in order
    let req = supabase.from('knowledge_base').select('*');
    if (filterDoc) {
      req = req.eq('document_title', filterDoc).order('chunk_number', { ascending: true });
    }
    const { data } = await req.limit(limit);
    return (data ?? []) as KnowledgeChunk[];
  }

  // 1. Try websearch FTS (most natural)
  try {
    let req = supabase
      .from('knowledge_base')
      .select('*')
      .textSearch('fts', q, { type: 'websearch', config: 'english' });
    if (filterDoc) req = req.eq('document_title', filterDoc);
    const { data, error } = await req.limit(limit);
    if (!error && data && data.length > 0) return data as KnowledgeChunk[];
  } catch { /* fall through */ }

  // 2. Try plain FTS
  try {
    let req = supabase
      .from('knowledge_base')
      .select('*')
      .textSearch('fts', q, { type: 'plain', config: 'english' });
    if (filterDoc) req = req.eq('document_title', filterDoc);
    const { data, error } = await req.limit(limit);
    if (!error && data && data.length > 0) return data as KnowledgeChunk[];
  } catch { /* fall through */ }

  // 3. Last resort: ilike on content and title separately
  try {
    let reqContent = supabase
      .from('knowledge_base')
      .select('*')
      .ilike('content', `%${q}%`);
    if (filterDoc) reqContent = reqContent.eq('document_title', filterDoc);
    const { data: byContent } = await reqContent.limit(Math.ceil(limit / 2));

    let reqTitle = supabase
      .from('knowledge_base')
      .select('*')
      .ilike('document_title', `%${q}%`);
    if (filterDoc) reqTitle = reqTitle.eq('document_title', filterDoc);
    const { data: byTitle } = await reqTitle.limit(Math.ceil(limit / 2));

    const combined = [...(byContent ?? []), ...(byTitle ?? [])];
    // Deduplicate by id
    const seen = new Set<string>();
    const unique = combined.filter((c: KnowledgeChunk) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    return unique.slice(0, limit) as KnowledgeChunk[];
  } catch {
    return [];
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
  return [...new Set(data.map((r: { document_title: string }) => r.document_title))];
}

/**
 * Build a compact context string from top-N chunks for AI injection.
 */
export async function getKnowledgeContext(userMessage: string, limit = 4): Promise<string> {
  if (!userMessage.trim()) return '';

  const chunks = await searchKnowledge(userMessage, undefined, limit);
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
