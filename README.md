# Finora

**Every Peso. Every Purpose.** Allowance, budgets and savings goals for college students, on the web and on your phone.

| Part | Tech | Folder |
| --- | --- | --- |
| Website | Next.js 15 (App Router), Tailwind CSS, next-themes, Motion | `apps/web` |
| Mobile app | Expo SDK 52, Expo Router, Reanimated | `apps/mobile` |
| Shared logic | TypeScript: money in centavos, safe-to-spend, budgets, goals, theme | `packages/core` |
| Backend | Supabase (Postgres, Auth, row-level security) | `supabase/` |

Both apps use the same database and the same `@finora/core` math, so a GCash expense added on the phone shows up on the web dashboard immediately.

## What's included

- **Sign in / create account** with email and password.
- **Dashboard**: Safe to spend today (counts up), wallets, totals, spending by category, recent transactions, insights, budgets and goals.
- **Transactions**: add income or expenses, search, filter, delete (balances fix themselves).
- **Wallets**: add cash, e-wallet or bank wallets, move money between them, choose which count as spendable.
- **Budgets**: weekly (Mon-Sun) or monthly limits per category, with on track / near limit / over states.
- **Savings goals**: add or withdraw money, see the weekly pace needed, celebrate reached goals.
- **Light and dark mode**: follows your device until you pick one, then remembers it. A pixel wipe plays as it switches.
- **Pixel style and motion**: Press Start 2P and VT323 fonts, hard pixel shadows, a once-per-session boot screen, staggered entrances, filling progress bars, floating peso coins on sign-in. Everything respects the device's reduce-motion setting.

## 1. Set up Supabase (about 5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, then paste and run, in order:
   - `supabase/migrations/20261107000000_init.sql`
   - `supabase/migrations/20261107000100_demo_data.sql`

   Or, with the [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase link` then `supabase db push`.
3. For quick testing, go to **Authentication > Providers > Email** and turn off **Confirm email** (turn it back on before launch).
4. Copy your **Project URL** and **anon public key** from **Project Settings > API**.

## 2. Install

Requires Node.js 20.11 or newer.

```bash
npm install
cp apps/web/.env.example apps/web/.env.local     # paste your URL and anon key
cp apps/mobile/.env.example apps/mobile/.env     # same values
```

## 3. Run the website

```bash
npm run dev:web
```

Open http://localhost:3000, create an account, then press **Load demo data** on the dashboard to see Juan's sample wallets, transactions, budgets and goals.

## 4. Run the mobile app

```bash
npm run dev:mobile
```

Install **Expo Go** on your phone and scan the QR code. Phone and computer must be on the same Wi-Fi.

If Expo warns about package versions, run `npx expo install --fix` inside `apps/mobile`.

## 5. Check the money logic

```bash
npm test
```

Runs the tests in `packages/core/test`, including checks that the safe-to-spend math reproduces the design (₱931 a day, ₱741 left).

## Deploying

- **Website**: import the repo on [Vercel](https://vercel.com), set the root directory to `apps/web`, and add the two `NEXT_PUBLIC_SUPABASE_*` variables.
- **Mobile**: `npm install -g eas-cli`, then `eas build` inside `apps/mobile` for Android (APK/AAB) or iOS.

## How the data stays correct and private

- All money is stored as whole **centavos** (`bigint`), so totals never drift by fractions of a peso.
- Database triggers update wallet balances on every insert, edit and delete of a transaction or transfer, and update goal totals on every deposit or withdrawal.
- **Row-level security** is on for every table: each user can only read or change their own rows, and can't post into someone else's wallet or goal.

## Project map

```
apps/web/app/login            sign in and create account
apps/web/app/(app)/...        dashboard, transactions, wallets, budgets, savings
apps/web/app/(app)/actions.ts server actions that save data (validated with parsePeso)
apps/web/components           logo, theme toggle with wipe, boot screen, count-up, forms
apps/mobile/app               login, (tabs)/index|activity|wallets|budgets|goals, add modal
apps/mobile/lib               supabase client, theme provider, data provider
packages/core/src             finance.ts, types.ts, theme.ts (shared colors and logo)
supabase/migrations           schema, security rules, demo-data loader
```

## Ideas for next steps

- Push notifications when a budget crosses 75%, 90% and 100% (`crossedAlert` in `packages/core` already decides when).
- Recurring transactions (weekly allowance, phone load) and a bills screen.
- Analytics page with monthly trends.
- Receipt photos using Supabase Storage.
