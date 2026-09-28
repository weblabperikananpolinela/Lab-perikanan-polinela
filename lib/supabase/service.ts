import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

/**
 * Supabase client using the service role key — server-side only.
 *
 * The service role bypasses RLS, so this module must NEVER be imported from a
 * client component. It exists for the few server routes that legitimately need
 * privileged access on behalf of an anonymous caller (for example
 * /api/send-notification, which must read push_subscriptions, whose RLS grants
 * SELECT only to the system admin).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the server environment. Keep the value
 * out of the repository and out of any NEXT_PUBLIC_ variable.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured on the server; privileged lookup is unavailable.',
    );
  }

  return createSupabaseJsClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** True when the server has the service role key configured. */
export function hasServiceRoleKey(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
