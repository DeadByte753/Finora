-- Loads Juan's demo data into the signed-in user's own account.
-- Dates are shifted so the latest activity is "today", which keeps the dashboard lively.
-- Call from the app (Settings > Load demo data) or SQL: select public.seed_demo_data();

create or replace function public.seed_demo_data() returns void
language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  d int := current_date - date '2026-10-31';
  w_cash uuid; w_gcash uuid; w_bpi uuid; g uuid;
begin
  if uid is null then raise exception 'sign in first'; end if;
  if exists (select 1 from wallets where user_id = uid) then
    raise exception 'demo data needs an empty account';
  end if;

  update profiles set full_name = coalesce(nullif(full_name, ''), 'Juan Dela Cruz'),
                      school = coalesce(nullif(school, ''), 'Aklan State University'),
                      next_allowance_on = current_date + 2
   where user_id = uid;

  insert into wallets (name, kind, opening_balance, spendable) values ('Cash', 'cash', 0, true) returning id into w_cash;
  insert into wallets (name, kind, opening_balance, spendable) values ('GCash', 'ewallet', 0, true) returning id into w_gcash;
  insert into wallets (name, kind, opening_balance, spendable) values ('BPI Savings', 'bank', 0, false) returning id into w_bpi;

  insert into transactions (wallet_id, kind, category, amount, title, note, occurred_on) values
    (w_cash,  'expense', 'Food',           9500,   'Iced coffee',             null,                   date '2026-10-31' + d),
    (w_cash,  'expense', 'Food',           9500,   'Lunch at canteen',        null,                   date '2026-10-31' + d),
    (w_gcash, 'expense', 'Transportation', 18500,  'Grab ride home',          null,                   date '2026-10-30' + d),
    (w_gcash, 'expense', 'Food',           65000,  'Samgyup with blockmates', 'Birthday treat for Mia', date '2026-10-29' + d),
    (w_cash,  'expense', 'Transportation', 5200,   'Jeepney fare',            null,                   date '2026-10-29' + d),
    (w_cash,  'expense', 'Food',           9500,   'Lunch at canteen',        null,                   date '2026-10-29' + d),
    (w_gcash, 'expense', 'Entertainment',  120000, 'Concert ticket',          null,                   date '2026-10-27' + d),
    (w_cash,  'expense', 'Food',           11000,  'Lunch at canteen',        null,                   date '2026-10-27' + d),
    (w_gcash, 'income',  'Allowance',      150000, 'Weekly allowance',        'From Mama',            date '2026-10-26' + d),
    (w_gcash, 'expense', 'Education',      45000,  'Lab manual',              null,                   date '2026-10-25' + d),
    (w_cash,  'expense', 'Transportation', 2600,   'Jeepney fare',            null,                   date '2026-10-25' + d),
    (w_cash,  'expense', 'Food',           7500,   'Lunch at canteen',        null,                   date '2026-10-25' + d),
    (w_cash,  'expense', 'Food',           9500,   'Lunch at canteen',        null,                   date '2026-10-23' + d),
    (w_cash,  'expense', 'Transportation', 3900,   'Jeepney fare',            null,                   date '2026-10-21' + d),
    (w_cash,  'expense', 'Food',           8500,   'Lunch at canteen',        null,                   date '2026-10-21' + d),
    (w_cash,  'expense', 'Food',           11000,  'Lunch at canteen',        null,                   date '2026-10-19' + d),
    (w_gcash, 'income',  'Allowance',      150000, 'Weekly allowance',        'From Mama',            date '2026-10-19' + d),
    (w_cash,  'expense', 'Personal Needs', 18000,  'Toiletries',              null,                   date '2026-10-18' + d),
    (w_cash,  'expense', 'Transportation', 2600,   'Jeepney fare',            null,                   date '2026-10-17' + d),
    (w_cash,  'expense', 'Food',           8500,   'Lunch at canteen',        null,                   date '2026-10-17' + d),
    (w_cash,  'expense', 'School Supplies', 12000, 'Bond paper and pens',     null,                   date '2026-10-14' + d),
    (w_gcash, 'income',  'Allowance',      150000, 'Weekly allowance',        'From Mama',            date '2026-10-12' + d),
    (w_gcash, 'income',  'Allowance',      150000, 'Weekly allowance',        'From Mama',            date '2026-10-05' + d);

  insert into transfers (from_wallet, to_wallet, amount, note, occurred_on) values
    (w_gcash, w_bpi,  1299100, 'Ipon',                   date '2026-10-28' + d),
    (w_gcash, w_cash, 200000,  'Cash-out at 7-Eleven',   date '2026-10-02' + d),
    (w_gcash, w_bpi,  250000,  'Monthly ipon',           date '2026-09-28' + d);

  -- Match the balances in the design by setting each opening balance.
  update wallets set opening_balance = opening_balance + (107100 - balance), balance = 107100 where id = w_cash;
  update wallets set opening_balance = opening_balance + (70000 - balance),  balance = 70000  where id = w_gcash;
  update wallets set opening_balance = opening_balance + (3849100 - balance), balance = 3849100 where id = w_bpi;

  insert into bills (name, amount, due_on) values ('Phone load', 9900, current_date + 1);

  insert into budgets (category, period, limit_amount) values
    ('Entertainment', 'monthly', 120000),
    ('Transportation', 'weekly', 22000),
    ('Food', 'monthly', 260000),
    ('School Supplies', 'monthly', 60000);

  insert into goals (name, target, target_date) values ('Baguio trip', 600000, current_date + 5) returning id into g;
  insert into goal_entries (goal_id, amount, label) values (g, 420000, 'Deposit');
  insert into goals (name, target, target_date) values ('New laptop', 3500000, current_date + 150) returning id into g;
  insert into goal_entries (goal_id, amount, label) values (g, 1200000, 'Starting amount'), (g, 600000, 'Deposit');
  insert into goals (name, target, target_date) values ('Emergency fund', 1000000, null) returning id into g;
  insert into goal_entries (goal_id, amount, label) values (g, 350000, 'Starting amount');
  insert into goals (name, target, target_date) values ('Graphing calculator', 250000, null) returning id into g;
  insert into goal_entries (goal_id, amount, label) values (g, 250000, 'Deposit');
end $$;

grant execute on function public.seed_demo_data() to authenticated;
