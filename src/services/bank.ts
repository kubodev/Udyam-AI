import { supabase } from '../lib/supabase';

export interface BankAccountContext {
  id: string;
  bank_name: string;
  account_name: string;
  masked_account_number: string;
  status: 'connected' | 'disconnected';
}

export interface BankTransaction {
  id: string;
  transaction_at: string;
  description: string;
  amount: number;
  direction: 'credit' | 'debit';
  balance_after: number | null;
  reference: string | null;
}

export async function getMockBankContext(userId: string): Promise<{
  account: BankAccountContext | null;
  transactions: BankTransaction[];
}> {
  const { data: account } = await supabase
    .from('mock_bank_accounts')
    .select('id, bank_name, account_name, masked_account_number, status')
    .eq('user_id', userId)
    .eq('status', 'connected')
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!account) return { account: null, transactions: [] };

  const { data: transactions } = await supabase
    .from('mock_bank_transactions')
    .select('id, transaction_at, description, amount, direction, balance_after, reference')
    .eq('account_id', account.id)
    .order('transaction_at', { ascending: false })
    .limit(5);

  return {
    account: account as BankAccountContext,
    transactions: (transactions ?? []) as BankTransaction[],
  };
}

/** Connects the seeded demo account for the signed-in user through Supabase. */
export async function connectMockBank(): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('connect_mock_bank');
  return { error: error?.message ?? null };
}

export function formatBankContext(
  account: BankAccountContext | null,
  transactions: BankTransaction[],
): string {
  if (!account) {
    return '[Bank connection: Not connected. If a user needs transaction-based confirmation, say exactly: "To confirm this, please connect your bank account through Account Aggregator (AA) with UdyamAI." Do not invent transactions.]';
  }

  const latest = transactions.length
    ? transactions.map((tx, index) => {
        const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(tx.amount);
        const date = new Date(tx.transaction_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        return `${index + 1}. ${date} | ${tx.direction.toUpperCase()} | ${amount} | ${tx.description}${tx.reference ? ` | Ref: ${tx.reference}` : ''}${tx.balance_after !== null ? ` | Balance: ₹${Number(tx.balance_after).toLocaleString('en-IN')}` : ''}`;
      }).join('\n')
    : 'No transactions available.';

  return `[Mock bank account connected via AA for this hackathon demo: ${account.bank_name}, ${account.account_name}, ${account.masked_account_number}. Latest 5 transactions (use only these values; do not fabricate):\n${latest}]`;
}

/** Markdown intended for the visible chat response after a payment-proof check. */
export function formatRecentTransactionsForResponse(
  account: BankAccountContext | null,
  transactions: BankTransaction[],
): string {
  if (!account) {
    return '\n\n**To verify payment:** Connect your bank account through Account Aggregator (AA) with UdyamAI. I can then check the latest transactions for a matching credit.';
  }

  const rows = transactions.map((tx) => {
    const date = new Date(tx.transaction_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const amount = `₹${Number(tx.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    return `- ${date} — ${tx.direction === 'credit' ? 'Credit' : 'Debit'} ${amount}: ${tx.description}`;
  });

  return `\n\n**Latest 5 transactions — ${account.bank_name} (${account.masked_account_number})**\n${rows.length ? rows.join('\n') : '- No transactions found.'}`;
}
