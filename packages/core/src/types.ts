/** All money is stored and computed as whole centavos (₱1.00 = 100). */
export type Centavos = number;

/** Calendar date as YYYY-MM-DD, interpreted in the user's local day. */
export type ISODate = string;

export type WalletKind = 'cash' | 'ewallet' | 'bank';

export interface Wallet {
  id: string;
  name: string;
  kind: WalletKind;
  balance: Centavos;
  /** Counted in "Safe to spend today". Turn off for savings accounts. */
  spendable: boolean;
}

export type TxKind = 'income' | 'expense';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Education',
  'School Supplies',
  'Entertainment',
  'Personal Needs',
  'Others'
] as const;

export const INCOME_CATEGORIES = ['Allowance', 'Scholarship', 'Part-time Income', 'Other Income'] as const;

export type Category = (typeof EXPENSE_CATEGORIES)[number] | (typeof INCOME_CATEGORIES)[number];

export interface Transaction {
  id: string;
  walletId: string;
  kind: TxKind;
  category: Category;
  /** Always positive; `kind` gives the direction. */
  amount: Centavos;
  title: string;
  note?: string | null;
  occurredOn: ISODate;
}

export type BudgetPeriod = 'weekly' | 'monthly';

export interface Budget {
  id: string;
  category: Category;
  period: BudgetPeriod;
  limit: Centavos;
}

export interface Goal {
  id: string;
  name: string;
  target: Centavos;
  saved: Centavos;
  targetDate: ISODate | null;
}

export interface Bill {
  id: string;
  name: string;
  amount: Centavos;
  dueOn: ISODate;
}
