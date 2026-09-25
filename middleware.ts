import {
  createChunks,
  createServerClient,
  stringFromBase64URL,
  stringToBase64URL,
} from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cache maintenance flag (seconds). Toggling in Supabase takes at most this
// long to propagate to all visitors.
const MAINTENANCE_CACHE_SECONDS = 30;

const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60,
};

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
 * Remove the heavy Google OAuth `provider_token` / `provider_refresh_token`
 * fields from the Supabase session stored in cookies, and expire stale
 * leftover chunks from the pre-fix "fat cookie" era.
 *
 * This is the root-cause fix for HTTP 431 (Request Header Fields Too Large):
 * Apache rejects the oversized `Cookie` header before Node.js ever runs, so the
 * only reliable fix is to never persist those multi-KB tokens in the browser.
 *
 * Runs last (after session refresh) so it sees the final cookie state.
 */
function slimAuthCookies(request: NextRequest, response: NextResponse) {
  // Group auth cookies by their base name, e.g. "sb-xxx-auth-token"
  const groups = new Map<string, Map<number, string>>();
  for (const cookie of request.cookies.getAll()) {
    const match = cookie.name.match(/^(.*-auth-token)(?:\.(\d+))?$/);
    if (!match) continue;
    const base = match[1];
    const index = match[2] ? Number(match[2]) : 0;
    if (!groups.has(base)) groups.set(base, new Map());
    groups.get(base)!.set(index, cookie.value);
  }

  for (const [base, chunksByIndex] of groups) {
    // Reassemble only the contiguous chunk run starting at 0 — mirrors
    // combineChunks() semantics. Chunks above a gap are stale leftovers.
    const contiguous: string[] = [];
    for (let i = 0; ; i++) {
      const v = chunksByIndex.get(i);
      if (v === undefined) break;
      contiguous.push(v);
    }

    // Expire every chunk that is not part of the contiguous run (e.g. old
    // fat-session chunks .2/.3 left behind after a slim re-chunk).
    for (const index of chunksByIndex.keys()) {
      if (index >= contiguous.length) {
        response.cookies.set(`${base}.${index}`, '', {
          ...COOKIE_OPTIONS,
          maxAge: 0,
        });
      }
    }

    if (contiguous.length === 0) continue;
    const fullValue = contiguous.join('');
    if (!fullValue.startsWith('base64-')) continue;

    let session: Record<string, unknown>;
    try {
      session = JSON.parse(
        stringFromBase64URL(fullValue.slice('base64-'.length)),
      );
    } catch {
      // Corrupt or non-JSON payload — nothing safe to rewrite.
      continue;
    }

    if (!session.provider_token && !session.provider_refresh_token) continue;

    delete session.provider_token;
    delete session.provider_refresh_token;

    const cleaned = 'base64-' + stringToBase64URL(JSON.stringify(session));
    const newChunks = createChunks(base, cleaned);
    const newNames = new Set(newChunks.map((c) => c.name));

    // Expire old contiguous chunks that are no longer needed
    for (let i = 0; i < contiguous.length; i++) {
      if (!newNames.has(`${base}.${i}`)) {
        response.cookies.set(`${base}.${i}`, '', {
          ...COOKIE_OPTIONS,
          maxAge: 0,
        });
      }
    }
    for (const chunk of newChunks) {
      response.cookies.set(chunk.name, chunk.value, COOKIE_OPTIONS);
    }
  }
}

export async function middleware(request: NextRequest) {
  // =========================================================================
  // GERBANG 1: LOGIC MAINTENANCE MODE (Supabase-driven)
  // =========================================================================
  if (request.nextUrl.pathname !== '/maintenance') {
    const isMaintenanceMode = await isMaintenanceModeEnabled();
    if (isMaintenanceMode) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // =========================================================================
  // GERBANG 2: REFRESH SESSION SUPABASE SSR
  // =========================================================================
  // Runs BEFORE cookie slimming: setAll below reassigns `response`, which
  // would otherwise discard any cookies already written onto it.
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Silently refresh the session so server components always receive a valid
  // token. getUser() (not getSession()) so stale JWTs are never trusted.
  await supabase.auth.getUser();

  // =========================================================================
  // GERBANG 3: ANTI-ERROR 431 — SLIM DOWN OVERSIZED SESSION COOKIES
  // =========================================================================
  // Strips provider OAuth tokens from any session cookie still carrying them
  // (e.g. sessions created before the fix, or freshly exchanged on the
  // server). Must run last so the slimmed cookies land on the final response.
  slimAuthCookies(request, response);

  return response;
}

// Exclude API routes, static assets, images and PWA files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
