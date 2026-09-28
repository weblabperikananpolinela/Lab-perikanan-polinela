'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * First-party page view beacon (v5.3.0).
 *
 * Fire-and-forget: reports the current public path to the `record_pageview`
 * RPC, which stores a daily aggregate per path (no IP, no cookie, no PII).
 * Admin, API and static routes are filtered out here and again in SQL.
 */
export function PageviewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/maintenance')
    ) {
      return;
    }

    const key = `dolphin_pv:${new Date().toISOString().slice(0, 10)}:${pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Private mode: fall through, the RPC is idempotent per day+path.
    }

    const supabase = createClient();
    void supabase.rpc('record_pageview', { p_path: pathname }).then(
      () => undefined,
      () => undefined,
    );
  }, [pathname]);

  return null;
}
