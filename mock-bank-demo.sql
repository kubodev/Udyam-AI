-- UdyamAI hackathon mock Account Aggregator data
-- Run this once in the Supabase SQL Editor. It creates a per-user demo bank
-- account and a five-line mock statement when the user taps Connect demo bank.
-- The same SQL is also included in supabase-schema.sql for fresh installs.

create table if not exists mock_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  bank_name text not null default 'Udyam Demo Bank',
  account_name text not null default 'UdyamAI Business Account',
  masked_account_number text not null default 'XXXX 4821',
  status text not null default 'connected' check (status in ('connected', 'disconnected')),
  connected_at timestamptz not null default now()
);
alter table mock_bank_accounts enable row level security;
drop policy if exists "own mock bank account" on mock_bank_accounts;
create policy "own mock bank account" on mock_bank_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists mock_bank_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references mock_bank_accounts on delete cascade not null,
  transaction_at timestamptz not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  direction text not null check (direction in ('credit', 'debit')),
  balance_after numeric(12,2),
  reference text
);
create index if not exists mock_bank_transactions_recent_idx on mock_bank_transactions (account_id, transaction_at desc);
alter table mock_bank_transactions enable row level security;
drop policy if exists "own mock bank transactions" on mock_bank_transactions;
create policy "own mock bank transactions" on mock_bank_transactions for select using (
  exists (select 1 from mock_bank_accounts a where a.id = account_id and a.user_id = auth.uid())
);

create or replace function connect_mock_bank()
returns void language plpgsql security definer set search_path = public as $$
declare demo_account_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  insert into mock_bank_accounts (user_id) values (auth.uid())
  on conflict (user_id) do update set status = 'connected', connected_at = now()
  returning id into demo_account_id;
  if not exists (select 1 from mock_bank_transactions where account_id = demo_account_id) then
    insert into mock_bank_transactions (account_id, transaction_at, description, amount, direction, balance_after, reference) values
      (demo_account_id, now() - interval '1 hour',  'UPI received — Meera Boutique', 2850.00, 'credit', 48760.00, 'UPI/MBT24091801'),
      (demo_account_id, now() - interval '4 hours', 'UPI payment — Fabric supplier', 4200.00, 'debit', 45910.00, 'UPI/FS24091722'),
      (demo_account_id, now() - interval '1 day', 'QR sale — customer payment', 1350.00, 'credit', 50110.00, 'UPI/QR24091714'),
      (demo_account_id, now() - interval '2 days', 'Electricity bill', 980.00, 'debit', 48760.00, 'BILL/EB24091609'),
      (demo_account_id, now() - interval '3 days', 'NEFT received — wholesale order', 7500.00, 'credit', 49740.00, 'NEFT/WO24091503');
  end if;
end;
$$;
grant execute on function connect_mock_bank() to authenticated;
