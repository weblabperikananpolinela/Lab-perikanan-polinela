import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

/**
 * Anonymous, cookie-less Supabase client for public server rendering.
 *
 * Pages that only read public data (hero banners, dokumentasi, pimpinan,
 * laboratorium PJ) must NOT read the session cookie, otherwise Next.js marks
 * the whole route dynamic and loses static/ISR rendering. This client uses the
 * anon key and RLS still enforces what an anonymous visitor may see.
 */
export function createPublicClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
