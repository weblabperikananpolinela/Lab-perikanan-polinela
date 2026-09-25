import { createChunks, createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_COOKIE_OPTIONS,
  AUTH_COOKIE_REGEX,
  slimCookieWrites,
  slimSessionValue,
  staleAuthCookieNames,
} from '@/lib/supabase/slim-session';

const MAINTENANCE_CACHE_SECONDS = 30;

async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return false;

    const res = await fetch(
      `${url}/rest/v1/app_settings?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
        next: { revalidate: MAINTENANCE_CACHE_SECONDS },
      },
    );
    if (!res.ok) return false;
    const rows = await res.json();
    return rows?.[0]?.value === true;
  } catch {
    return false;
  }
}

/**
 * Expire leftover fat chunks from the request cookies, then rewrite any
 * remaining session so nginx never sees an oversized Set-Cookie.
 *
 * Must run AFTER getUser() because a JWT refresh writes a new session
 * (with identities / leftover provider tokens) onto the response.
 */
function slimAuthCookies(request: NextRequest, response: NextResponse) {
  const groups = new Map<string, Map<number, string>>();
  const originalNames = new Map<string, Set<string>>();
  for (const cookie of request.cookies.getAll()) {
    const match = cookie.name.match(AUTH_COOKIE_REGEX);
    if (!match) continue;
    const base = match[1];
    const index = match[2] ? Number(match[2]) : 0;
    if (!groups.has(base)) groups.set(base, new Map());
    groups.get(base)!.set(index, cookie.value);
    if (!originalNames.has(base)) originalNames.set(base, new Set());
    originalNames.get(base)!.add(cookie.name);
  }

  for (const [base, chunksByIndex] of groups) {
    const contiguous: string[] = [];
    for (let i = 0; ; i++) {
      const v = chunksByIndex.get(i);
      if (v === undefined) break;
      contiguous.push(v);
    }

    const fullValue = contiguous.join('');
    const cleaned = fullValue ? slimSessionValue(fullValue) : null;
    const maxIndex = Math.max(contiguous.length, ...chunksByIndex.keys(), 0);

    if (!cleaned) {
      // Nothing to strip: only expire chunks beyond the contiguous run
      // (leftovers from the pre-fix "fat cookie" era).
      for (const [index] of chunksByIndex) {
        if (index >= contiguous.length) {
          response.cookies.set(`${base}.${index}`, '', {
            ...AUTH_COOKIE_OPTIONS,
            maxAge: 0,
          });
        }
      }
      continue;
    }

    const newChunks = createChunks(base, cleaned);
    const newNames = new Set(newChunks.map((c) => c.name));
    for (const name of staleAuthCookieNames(
      base,
      originalNames.get(base) ?? [],
      maxIndex,
      newNames,
    )) {
      response.cookies.set(name, '', { ...AUTH_COOKIE_OPTIONS, maxAge: 0 });
    }
    for (const chunk of newChunks) {
      response.cookies.set(chunk.name, chunk.value, AUTH_COOKIE_OPTIONS);
    }
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== '/maintenance') {
    const isMaintenanceMode = await isMaintenanceModeEnabled();
    if (isMaintenanceMode) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const slimmed = slimCookieWrites(cookiesToSet) ?? cookiesToSet;
          slimmed.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          slimmed.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the JWT when it is close to expiry. After ~1 hour idle this
  // writes a new Set-Cookie; slimCookieWrites above keeps it under the
  // nginx proxy buffer.
  await supabase.auth.getUser();

  slimAuthCookies(request, response);

  return response;
}

export const config = {
  matcher: [
    // Skip static PWA/worker files so a leftover fat cookie cannot 502
    // /sw.js on the first request after idle.
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|workbox-.*\\.js|worker-.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
