import { supabase } from '../lib/supabase';
import type { FinancialRecord } from '../types';

export async function getFinancialRecords(userId: string): Promise<FinancialRecord[]> {
  const { data } = await supabase
    .from('financial_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  return (data ?? []) as FinancialRecord[];
}

export async function createFinancialRecord(
  userId: string,
  record: Omit<FinancialRecord, 'id' | 'user_id'>,
): Promise<{ data: FinancialRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from('financial_records')
    .insert({ user_id: userId, ...record })
    .select()
    .single();
  return { data: (data ?? null) as FinancialRecord | null, error: error?.message ?? null };
}

export async function deleteFinancialRecord(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('financial_records').delete().eq('id', id);
  return { error: error?.message ?? null };
}

/** Compute monthly totals from records */
export function summariseRecords(records: FinancialRecord[]) {
  const totalCredit = records
    .filter((r) => r.direction === 'credit')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const totalDebit = records
    .filter((r) => r.direction === 'debit')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const net = totalCredit - totalDebit;
  return { totalCredit, totalDebit, net };
}
