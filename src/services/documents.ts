import { supabase } from '../lib/supabase';
import type { Document, DocumentExtraction } from '../types';

/** Upload a file to Supabase Storage and insert a row in `documents` */
export async function uploadDocument(
  userId: string,
  file: File,
  docType: Document['doc_type'],
): Promise<{ data: Document | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Upload to Supabase Storage bucket "documents"
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { upsert: false });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  // Insert metadata row
  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      storage_path: storagePath,
      doc_type: docType,
      status: 'uploaded',
    })
    .select()
    .single();

  return { data: (data ?? null) as Document | null, error: insertError?.message ?? null };
}

/** Get all documents for a user */
export async function getDocuments(userId: string): Promise<Document[]> {
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });
  return (data ?? []) as Document[];
}

/** Get signed or public URL for a stored file */
export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage.from('documents').createSignedUrl(storagePath, 3600);
  if (data?.signedUrl) return data.signedUrl;
  const { data: pub } = supabase.storage.from('documents').getPublicUrl(storagePath);
  return pub.publicUrl;
}

/** Download an existing private document so it can be extracted again in-browser. */
export async function getDocumentFile(storagePath: string): Promise<File | null> {
  const { data } = await supabase.storage.from('documents').download(storagePath);
  if (!data) return null;
  const name = storagePath.split('/').pop() ?? 'document';
  return new File([data], name, { type: data.type || 'application/pdf' });
}

/** Delete a document and its storage file */
export async function deleteDocument(doc: Document): Promise<{ error: string | null }> {
  if (doc.storage_path) {
    await supabase.storage.from('documents').remove([doc.storage_path]);
  }
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  return { error: error?.message ?? null };
}

/** Get extraction result for a document */
export async function getExtraction(documentId: string): Promise<DocumentExtraction | null> {
  const { data } = await supabase
    .from('document_extractions')
    .select('*')
    .eq('document_id', documentId)
    .maybeSingle();
  return (data ?? null) as DocumentExtraction | null;
}

/** Update processing status when a client-side extraction completes or fails. */
export async function updateDocumentStatus(
  documentId: string,
  status: Document['status'],
): Promise<void> {
  await supabase.from('documents').update({ status }).eq('id', documentId);
}
