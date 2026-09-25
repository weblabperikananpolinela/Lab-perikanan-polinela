import { createChunks, stringFromBase64URL, stringToBase64URL } from '@supabase/ssr';

export const AUTH_COOKIE_REGEX = /^(.*-auth-token)(?:\.(\d+))?$/;

export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60,
};

export type CookieLike = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * Strip bulky Google/OAuth fields that must never be persisted in cookies.
 * Keep `user.email` and `user.user_metadata` — navbar and dashboards need them.
 *
 * After ~1h idle, `getUser()` refreshes the JWT and writes a new session that
 * includes `user.identities` (duplicated Google profile). That pushes the
 * cookie past 3180 chars → 2 Set-Cookie chunks → nginx 502
 * ("upstream sent too big header"). Removing identities/factors keeps it
 * in a single chunk without switching to `encode: 'tokens-only'`.
 */
export function slimSessionValue(fullValue: string): string | null {
  if (!fullValue.startsWith('base64-')) return null;
  try {
    const session = JSON.parse(
      stringFromBase64URL(fullValue.slice('base64-'.length)),
    ) as Record<string, unknown>;

    let changed = false;
    if (session.provider_token) {
      delete session.provider_token;
      changed = true;
    }
    if (session.provider_refresh_token) {
      delete session.provider_refresh_token;
      changed = true;
    }

    const user = session.user as Record<string, unknown> | undefined;
    if (user && typeof user === 'object') {
      if (Array.isArray(user.identities) && user.identities.length > 0) {
        delete user.identities;
        changed = true;
      }
      if (user.factors) {
        delete user.factors;
        changed = true;
      }
    }

    if (!changed) return null;
    return 'base64-' + stringToBase64URL(JSON.stringify(session));
  } catch {
    return null;
  }
}

function reassembleAuthChunks(cookies: CookieLike[]) {
  const groups = new Map<string, Map<number, string>>();
  const originalNames = new Map<string, Set<string>>();
  const passthrough: CookieLike[] = [];
  let authOptions: Record<string, unknown> | undefined;

  for (const cookie of cookies) {
    const match = cookie.name.match(AUTH_COOKIE_REGEX);
    if (!match || !cookie.value) {
      passthrough.push(cookie);
      continue;
    }
    const base = match[1];
    const index = match[2] ? Number(match[2]) : 0;
    if (!groups.has(base)) groups.set(base, new Map());
    groups.get(base)!.set(index, cookie.value);
    if (!originalNames.has(base)) originalNames.set(base, new Set());
    originalNames.get(base)!.add(cookie.name);
    if (cookie.options) authOptions = cookie.options;
  }

  return { groups, originalNames, passthrough, authOptions };
}

/** Expire both unchunked (`base`) and chunked (`base.0`, `base.1`, ...) leftovers. */
export function staleAuthCookieNames(
  base: string,
  originalNames: Iterable<string>,
  maxIndex: number,
  keep: Set<string>,
): string[] {
  const candidates = new Set<string>([base, `${base}.0`]);
  for (const name of originalNames) candidates.add(name);
  for (let i = 0; i <= maxIndex; i++) candidates.add(`${base}.${i}`);
  return [...candidates].filter((name) => !keep.has(name));
}

/**
 * Rebuild auth cookies so nginx never sees a fat Set-Cookie from session refresh.
 * Returns null when nothing auth-related needs rewriting.
 */
export function slimCookieWrites(cookies: CookieLike[]): CookieLike[] | null {
  const { groups, originalNames, passthrough, authOptions } =
    reassembleAuthChunks(cookies);
  if (groups.size === 0) return null;

  const rewritten: CookieLike[] = [...passthrough];
  let changed = false;

  for (const [base, chunksByIndex] of groups) {
    const contiguous: string[] = [];
    for (let i = 0; ; i++) {
      const value = chunksByIndex.get(i);
      if (value === undefined) break;
      contiguous.push(value);
    }
    if (contiguous.length === 0) continue;

    const fullValue = contiguous.join('');
    const cleaned = slimSessionValue(fullValue);
    if (!cleaned) {
      for (const name of originalNames.get(base) ?? []) {
        const index = name === base ? 0 : Number(name.slice(base.length + 1));
        rewritten.push({
          name,
          value: chunksByIndex.get(index) ?? '',
          options: authOptions,
        });
      }
      continue;
    }

    changed = true;
    const newChunks = createChunks(base, cleaned);
    const newNames = new Set(newChunks.map((chunk) => chunk.name));
    const maxIndex = Math.max(contiguous.length, ...chunksByIndex.keys(), 0);
    for (const name of staleAuthCookieNames(
      base,
      originalNames.get(base) ?? [],
      maxIndex,
      newNames,
    )) {
      rewritten.push({
        name,
        value: '',
        options: { ...AUTH_COOKIE_OPTIONS, maxAge: 0 },
      });
    }
    for (const chunk of newChunks) {
      rewritten.push({
        name: chunk.name,
        value: chunk.value,
        options: { ...AUTH_COOKIE_OPTIONS, ...(authOptions ?? {}) },
      });
    }
  }

  return changed ? rewritten : null;
}
