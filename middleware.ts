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
import { SEO_FILE_PATHS } from '@/lib/site-seo';
import {
  checkSession,
  SESSION_SID_COOKIE,
  SESSION_SID_COOKIE_OPTIONS,
} from '@/lib/supabase/session-gate';

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
  // Berkas SEO harus tetap 200 walau maintenance ON — kalau ikut ter-redirect
  // ke /maintenance, Google membaca robots.txt / sitemap.xml sebagai tidak
  // tersedia tepat ketika situs sedang tidak stabil.
  if (
    !SEO_FILE_PATHS.has(request.nextUrl.pathname) &&
    request.nextUrl.pathname !== '/maintenance'
  ) {
    const isMaintenanceMode = await isMaintenanceModeEnabled();
    if (isMaintenanceMode) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  let response = NextResponse.next({ request });

  // Tangkap SEMUA tulis cookie auth Supabase agar bisa diputar ulang ke
  // response redirect (kasus sesi expired) — NextResponse tujuan tidak
  // mewarisi Set-Cookie dari response yang dibuang.
  const pendingCookieWrites: { name: string; value: string; options?: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const c of cookiesToSet) {
            pendingCookieWrites.push({ name: c.name, value: c.value, options: c.options });
          }
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate idle-expiry (v5.9.0): user login wajib punya baris sesi aktif.
  if (user) {
    const sessionCheck = await checkSession(
      supabase,
      request.cookies.get(SESSION_SID_COOKIE)?.value,
      user,
    );
    if (!sessionCheck.ok) {
      // Cabut sesi Supabase (revoke refresh token) lalu arahkan ke landing
      // login. `expired=false` = sesi belum bisa dibuat/diverifikasi;
      // fail-closed agar JWT saja tidak cukup melewati gate (anti login-loop).
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
      url.pathname = '/';
      url.search = '';
      url.searchParams.set('login', sessionCheck.expired ? 'expired' : 'required');
      if (nextPath !== '/' && nextPath.length > 1 && nextPath.length < 500) {
        url.searchParams.set('next', nextPath);
      }
      const redirect = NextResponse.redirect(url);
      for (const w of pendingCookieWrites) {
        redirect.cookies.set(w.name, w.value, w.options);
      }
      redirect.cookies.set(SESSION_SID_COOKIE, '', { path: '/', maxAge: 0 });
      return redirect;
    } else if (sessionCheck.fresh) {
      // Baris baru/adopsi → tanam cookie sid (heartbeat rutin tak perlu).
      response.cookies.set(SESSION_SID_COOKIE, sessionCheck.sid, {
        ...SESSION_SID_COOKIE_OPTIONS,
        maxAge: sessionCheck.idleSeconds,
      });
    }
  }

  slimAuthCookies(request, response);

  // Deployment demo Vercel tetap hidup (PM) tapi tidak boleh diindeks.
  // Canonical HTML tetap ke Polinela; header ini lapisan kedua saat crawler
  // membaca HEAD tanpa mengeksekusi JS. Production host tidak kena rule.
  const host = request.headers.get('host') || '';
  if (host.endsWith('.vercel.app')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static PWA/worker files so a leftover fat cookie cannot 502
    // /sw.js on the first request after idle.
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|workbox-.*\\.js|worker-.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
