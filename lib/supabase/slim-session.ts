import { createChunks, stringFromBase64URL, stringToBase64URL } from '@supabase/ssr';

export const AUTH_COOKIE_REGEX = /^(.*-auth-token)(?:\.(\d+))?$/;

/** Harus sama dengan MAX_CHUNK_SIZE di @supabase/ssr (3180). */
export const MAX_CHUNK_SIZE = 3180;

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

/** Field `user` yang dipakai aplikasi (navbar + dashboard). */
const USER_KEYS_TO_KEEP = new Set(['id', 'aud', 'role', 'email', 'app_metadata', 'user_metadata']);
const APP_METADATA_KEYS_TO_KEEP = new Set(['provider']);
/** Aplikasi hanya membaca `full_name`; `name` disimpan sebagai cadangan. */
const USER_METADATA_KEYS_TO_KEEP = new Set(['full_name', 'name']);

/** Buang key yang tidak ada di allowlist. Return true bila ada yang dibuang. */
function keepOnly(target: Record<string, unknown>, allowed: Set<string>): boolean {
  let changed = false;
  for (const key of Object.keys(target)) {
    if (!allowed.has(key)) {
      delete target[key];
      changed = true;
    }
  }
  return changed;
}

/**
 * Pangkas objek session agar muat dalam SATU cookie chunk (3180 char).
 *
 * Latar belakang insiden 502:
 * - `access_token` Supabase kedaluwarsa tiap **3600 detik (1 jam)**.
 * - Request pertama setelah idle memicu middleware `getUser()` → refresh JWT
 *   → menulis session baru lewat `Set-Cookie`.
 * - Session itu memuat `provider_token` + `user.identities` (duplikat profil
 *   Google) sehingga > 3180 char → `createChunks()` memecahnya jadi 2-3
 *   `Set-Cookie`. Total header respons melewati buffer nginx
 *   (`upstream sent too big header`) → HTTP 502.
 *
 * Slim ini memangkas berlapis sehingga session selalu muat 1 chunk:
 * 1. `provider_token` / `provider_refresh_token` (hanya ada saat OAuth exchange).
 * 2. `user.identities` (duplikat `user_metadata`) + `user.factors`.
 * 3. Field `user` di luar allowlist (timestamp, phone, is_anonymous, dll).
 * 4. `user_metadata` + `app_metadata` di luar allowlist (URL foto Google yang
 *    ganda, iss, sub, provider_id, custom_claims).
 * 5. Bila masih ≥ 3180 char, `user_metadata.name` yang menduplikasi
 *    `full_name` juga dibuang.
 * 6. Jaring terakhir: `user_metadata` dibuang seluruhnya. Navbar punya
 *    fallback ke email, jadi UI tetap benar.
 *
 * Yang DIPERTAHANKAN: `access_token`, `refresh_token`, `expires_at`,
 * `user.id`, `user.role`, `user.email`, `user.user_metadata.full_name`.
 */
export function slimSessionValue(fullValue: string): string | null {
  if (!fullValue.startsWith('base64-')) return null;
  try {
    const session = JSON.parse(
      stringFromBase64URL(fullValue.slice('base64-'.length)),
    ) as Record<string, any>;

    let changed = false;

    // Lapis 1 — token OAuth besar.
    if (session.provider_token) {
      delete session.provider_token;
      changed = true;
    }
    if (session.provider_refresh_token) {
      delete session.provider_refresh_token;
      changed = true;
    }

    // Lapis 2-4 — objek user.
    const user = session.user;
    if (user && typeof user === 'object') {
      if (Array.isArray(user.identities) && user.identities.length > 0) {
        delete user.identities;
        changed = true;
      }
      if (user.factors) {
        delete user.factors;
        changed = true;
      }
      if (keepOnly(user, USER_KEYS_TO_KEEP)) changed = true;

      if (user.app_metadata && typeof user.app_metadata === 'object') {
        if (keepOnly(user.app_metadata, APP_METADATA_KEYS_TO_KEEP)) changed = true;
      }
      if (user.user_metadata && typeof user.user_metadata === 'object') {
        const metadata = user.user_metadata;
        if (keepOnly(metadata, USER_METADATA_KEYS_TO_KEEP)) changed = true;
        // `full_name` adalah field metadata yang dibaca navbar.
        if (!metadata.full_name && typeof metadata.name === 'string') {
          metadata.full_name = metadata.name;
          changed = true;
        }
      }
    }

    if (!changed) return null;

    let encoded = 'base64-' + stringToBase64URL(JSON.stringify(session));
    const meta = session.user?.user_metadata as Record<string, unknown> | undefined;
    const reencode = () => {
      encoded = 'base64-' + stringToBase64URL(JSON.stringify(session));
    };

    // Lapis 5 — `name` sering menduplikasi `full_name`; buang bila masih gemuk.
    if (encoded.length >= MAX_CHUNK_SIZE && meta?.name) {
      delete meta.name;
      reencode();
    }

    // Lapis 6 — jaring pengaman terakhir: profil Google yang sangat panjang
    // (nama + email panjang) masih bisa > 3180. Buang `user_metadata`;
    // navbar jatuh ke fallback email (lihat components/navbar.tsx).
    if (encoded.length >= MAX_CHUNK_SIZE && session.user?.user_metadata) {
      delete session.user.user_metadata;
      reencode();
    }
    return encoded;
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
