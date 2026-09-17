import { supabase } from '../lib/supabase';
import type { Application, ApplicationDraftContent } from '../types';

export async function getApplications(userId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Application[];
}

export async function createApplication(
  userId: string,
  opportunityId: string,
  draftContent: ApplicationDraftContent,
  missingFields: string[],
): Promise<{ data: Application | null; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      opportunity_id: opportunityId,
      draft_content: draftContent,
      missing_fields: missingFields,
      status: 'Draft Ready',
    })
    .select()
    .single();
  return { data: data as Application | null, error: error?.message ?? null };
}

export async function updateApplicationStatus(
  id: string,
  status: Application['status'],
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error?.message ?? null };
}
