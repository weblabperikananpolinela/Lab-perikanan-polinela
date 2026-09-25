import {
  createBrowserClient,
  createChunks,
  stringFromBase64URL,
  stringToBase64URL,
} from '@supabase/ssr';

// Matches auth session cookies, chunked ("sb-xxx-auth-token.0") or not
// ("sb-xxx-auth-token"). Deliberately excludes other auth cookies such as
// "sb-xxx-auth-token-code-verifier", which end with a different suffix.
const AUTH_COOKIE_REGEX = /^(.*-auth-token)(?:\.(\d+))?$/;

function parseDocumentCookies(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof document === 'undefined' || !document.cookie) return out;
  for (const part of document.cookie.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = value;
  }
  return out;
}

function serializeCookie(
  name: string,
  value: string,
  options?: {
    path?: string;
    maxAge?: number;
    sameSite?: string | boolean;
    secure?: boolean;
  },
): string {
  const path = options?.path ?? '/';
  const maxAge = options?.maxAge ?? 400 * 24 * 60 * 60;
  const sameSite = options?.sameSite ?? 'lax';
  return `${name}=${value}; path=${path}; max-age=${maxAge}; samesite=${sameSite}; secure`;
}

// Remove provider OAuth tokens from a raw chunked session value.
// Returns the cleaned value, or null if nothing needed stripping.
function stripProviderTokens(fullValue: string): string | null {
  if (!fullValue.startsWith('base64-')) return null;
  try {
    const session = JSON.parse(
      stringFromBase64URL(fullValue.substring('base64-'.length)),
    );
    if (!session.provider_token && !session.provider_refresh_token) return null;
    delete session.provider_token;
    delete session.provider_refresh_token;
    return 'base64-' + stringToBase64URL(JSON.stringify(session));
  } catch (err) {
    console.warn('DOLPHIN: gagal melangsingkan cookie sesi:', err);
    return null;
  }
}

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(parseDocumentCookies()).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          // Collect chunked auth-token writes so they can be processed as a
          // whole (the session may span multiple cookies).
          const authChunkSets = new Map<string, Map<number, string>>();
          const authCookieOptions: { path?: string; maxAge?: number } = {
            path: '/',
            maxAge: 400 * 24 * 60 * 60,
          };

          for (const { name, value, options } of cookiesToSet) {
            const match = name.match(AUTH_COOKIE_REGEX);
            if (match && value) {
              const base = match[1];
              const index = match[2] ? Number(match[2]) : 0;
              if (!authChunkSets.has(base)) authChunkSets.set(base, new Map());
              authChunkSets.get(base)!.set(index, value);
              if (options?.path) authCookieOptions.path = options.path;
              if (typeof options?.maxAge === 'number') {
                authCookieOptions.maxAge = options.maxAge;
              }
              continue;
            }
            // Regular set / remove (includes code-verifier and chunk removals)
            document.cookie = value
              ? serializeCookie(name, value, options)
              : serializeCookie(name, '', { ...options, maxAge: 0 });
          }

          for (const [base, chunks] of authChunkSets) {
            // Reassemble the session from its ordered chunks
            const fullValue = [...chunks.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([, v]) => v)
              .join('');

            const cleaned = stripProviderTokens(fullValue) ?? fullValue;

            // Expire any existing chunks of this cookie (handles shrinking
            // chunk counts after stripping)
            const existing = Object.keys(parseDocumentCookies()).filter(
              (n) => n === base || n.startsWith(base + '.'),
            );
            for (const n of existing) {
              document.cookie = serializeCookie(n, '', { path: '/', maxAge: 0 });
            }

            // Re-chunk using the library's own chunker so sizes stay
            // compatible with @supabase/ssr readers (server + middleware)
            for (const { name: chunkName, value: chunkValue } of createChunks(
              base,
              cleaned,
            )) {
              document.cookie = serializeCookie(
                chunkName,
                chunkValue,
                authCookieOptions,
              );
            }
          }
        },
      },
    },
  );
};
