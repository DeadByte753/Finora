/** Reads the Supabase URL and anon key, failing with a clear message when .env.local is missing or unfilled. */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('YOUR-PROJECT') || key === 'your-anon-key') {
    throw new Error(
      'Supabase is not configured. Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local ' +
        '(Supabase dashboard > Project Settings > API), then restart `npm run dev`.'
    );
  }
  return { url, key };
}
