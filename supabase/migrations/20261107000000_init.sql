-- Finora schema. All money is bigint centavos (₱1.00 = 100).
-- Every table carries user_id and row-level security limits each user to their own rows.

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  school text not null default '',
  time_zone text not null default 'Asia/Manila',
  next_allowance_on date,
  allowance_label text not null default 'Weekly allowance',
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- wallets ----------
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  kind text not null check (kind in ('cash', 'ewallet', 'bank')),
  opening_balance bigint not null default 0,
  balance bigint not null default 0,
  spendable boolean not null default true,
  created_at timestamptz not null default now()
);
create index wallets_user_idx on public.wallets (user_id);

-- Balance starts at the opening balance.
create function public.wallet_set_opening() returns trigger language plpgsql as $$
begin
  new.balance := new.opening_balance;
  return new;
end $$;
create trigger wallet_opening before insert on public.wallets
  for each row execute function public.wallet_set_opening();

-- ---------- transactions ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  category text not null,
  amount bigint not null check (amount > 0),
  title text not null check (length(title) between 1 and 80),
  note text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);

-- Keep wallet balances in step with every insert, edit and delete.
create function public.tx_apply_balance() returns trigger language plpgsql as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.wallets
       set balance = balance - (case when old.kind = 'income' then old.amount else -old.amount end)
     where id = old.wallet_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.wallets
       set balance = balance + (case when new.kind = 'income' then new.amount else -new.amount end)
     where id = new.wallet_id;
  end if;
  return coalesce(new, old);
end $$;
create trigger tx_balance after insert or update or delete on public.transactions
  for each row execute function public.tx_apply_balance();

-- ---------- transfers between wallets ----------
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_wallet uuid not null references public.wallets (id) on delete cascade,
  to_wallet uuid not null references public.wallets (id) on delete cascade,
  amount bigint not null check (amount > 0),
  note text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_wallet <> to_wallet)
);
create index transfers_user_idx on public.transfers (user_id, occurred_on desc);

create function public.transfer_apply_balance() returns trigger language plpgsql as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.wallets set balance = balance + old.amount where id = old.from_wallet;
    update public.wallets set balance = balance - old.amount where id = old.to_wallet;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.wallets set balance = balance - new.amount where id = new.from_wallet;
    update public.wallets set balance = balance + new.amount where id = new.to_wallet;
  end if;
  return coalesce(new, old);
end $$;
create trigger transfer_balance after insert or update or delete on public.transfers
  for each row execute function public.transfer_apply_balance();

-- ---------- budgets ----------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null,
  period text not null check (period in ('weekly', 'monthly')),
  limit_amount bigint not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category, period)
);

-- ---------- savings goals ----------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  target bigint not null check (target > 0),
  saved bigint not null default 0 check (saved >= 0),
  target_date date,
  reached_on date,
  created_at timestamptz not null default now()
);

create table public.goal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  -- positive = deposit, negative = withdrawal
  amount bigint not null check (amount <> 0),
  label text not null default 'Deposit',
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create function public.goal_apply_entry() returns trigger language plpgsql as $$
begin
  update public.goals g
     set saved = g.saved + new.amount,
         reached_on = case when g.saved + new.amount >= g.target then coalesce(g.reached_on, new.occurred_on) else null end
   where g.id = new.goal_id;
  return new;
end $$;
create trigger goal_entry_apply after insert on public.goal_entries
  for each row execute function public.goal_apply_entry();

-- ---------- upcoming bills ----------
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  amount bigint not null check (amount > 0),
  due_on date not null,
  created_at timestamptz not null default now()
);

-- ---------- row-level security ----------
do $$
declare t text;
begin
  foreach t in array array['wallets','transactions','transfers','budgets','goals','goal_entries','bills'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A transaction or transfer may only touch the caller's own wallets.
create function public.assert_own_wallet() returns trigger language plpgsql as $$
begin
  if tg_table_name = 'transactions' then
    if not exists (select 1 from public.wallets where id = new.wallet_id and user_id = new.user_id) then
      raise exception 'wallet not found';
    end if;
  else
    if (select count(*) from public.wallets where id in (new.from_wallet, new.to_wallet) and user_id = new.user_id) <> 2 then
      raise exception 'wallet not found';
    end if;
  end if;
  return new;
end $$;
create trigger tx_own_wallet before insert or update on public.transactions
  for each row execute function public.assert_own_wallet();
create trigger transfer_own_wallet before insert or update on public.transfers
  for each row execute function public.assert_own_wallet();

create function public.assert_own_goal() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.goals where id = new.goal_id and user_id = new.user_id) then
    raise exception 'goal not found';
  end if;
  return new;
end $$;
create trigger goal_entry_own before insert on public.goal_entries
  for each row execute function public.assert_own_goal();
