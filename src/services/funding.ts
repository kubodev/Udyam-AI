import { supabase } from '../lib/supabase';
import type { FundingOpportunity } from '../types';
import { fundingOpportunities as SEED_DATA } from '../data/funding-seed';

interface SearchFundingParams {
  sector?: string;
  location?: string;
  stage?: string;
}

/** Search funding opportunities. Tries Supabase first; falls back to local seed data if not connected. */
export async function searchFunding(params: SearchFundingParams = {}): Promise<FundingOpportunity[]> {
  try {
    let query = supabase.from('funding_opportunities').select('*');
    if (params.sector) query = query.ilike('sector', `%${params.sector}%`);
    if (params.location) query = query.ilike('location', `%${params.location}%`);
    if (params.stage) query = query.eq('business_stage', params.stage);

    const { data, error } = await query.order('last_verified', { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) return data as FundingOpportunity[];
  } catch {
    // Supabase not connected or no data — fall through to seed
  }

  // Fallback to local seed data with same filter logic
  let results = [...SEED_DATA];
  if (params.sector) results = results.filter((o) => !o.sector || o.sector.toLowerCase().includes(params.sector!.toLowerCase()));
  if (params.location) results = results.filter((o) => !o.location || o.location.toLowerCase().includes(params.location!.toLowerCase()));
  if (params.stage) results = results.filter((o) => !o.business_stage || o.business_stage === params.stage);
  return results;
}

/** Get a single funding opportunity by ID. */
export async function getFundingOpportunity(id: string): Promise<FundingOpportunity | null> {
  try {
    const { data, error } = await supabase.from('funding_opportunities').select('*').eq('id', id).single();
    if (!error && data) return data as FundingOpportunity;
  } catch {
    // Fall through
  }
  return SEED_DATA.find((o) => o.id === id) ?? null;
}

/** Save opportunity to tracker */
export async function saveOpportunity(userId: string, opportunityId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('saved_opportunities').insert({ user_id: userId, opportunity_id: opportunityId, status: 'Saved' });
  return { error: error?.message ?? null };
}
