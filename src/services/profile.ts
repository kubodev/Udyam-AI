import { supabase } from '../lib/supabase';
import type { BusinessProfile } from '../types';

export async function getProfile(userId: string): Promise<{ data: BusinessProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error: error?.message ?? null };
}

export async function upsertProfile(
  userId: string,
  fields: Partial<BusinessProfile>,
): Promise<{ data: BusinessProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('business_profiles')
    .upsert({ ...fields, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}
