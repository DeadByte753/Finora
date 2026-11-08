import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { supabaseEnv } from './env';
import { cookies } from 'next/headers';

/** Supabase client for Server Components and Server Actions, signed in as the current user. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(supabaseEnv().url, supabaseEnv().key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: ((list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      }) satisfies SetAllCookies
    }
  });
}
