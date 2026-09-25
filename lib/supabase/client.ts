import { createBrowserClient, createChunks } from '@supabase/ssr';
import {
  AUTH_COOKIE_REGEX,
  slimSessionValue,
  staleAuthCookieNames,
} from '@/lib/supabase/slim-session';

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
          const authChunkSets = new Map<string, Map<number, string>>();
          const originalNames = new Map<string, Set<string>>();
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
              if (!originalNames.has(base)) originalNames.set(base, new Set());
              originalNames.get(base)!.add(name);
              if (options?.path) authCookieOptions.path = options.path;
              if (typeof options?.maxAge === 'number') {
                authCookieOptions.maxAge = options.maxAge;
              }
              continue;
            }
            document.cookie = value
              ? serializeCookie(name, value, options)
              : serializeCookie(name, '', { ...options, maxAge: 0 });
          }

          for (const [base, chunks] of authChunkSets) {
            const fullValue = [...chunks.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([, v]) => v)
              .join('');

            const cleaned = slimSessionValue(fullValue) ?? fullValue;
            const existing = Object.keys(parseDocumentCookies()).filter(
              (n) => n === base || n.startsWith(`${base}.`),
            );
            const newChunks = createChunks(base, cleaned);
            const keep = new Set(newChunks.map((c) => c.name));
            const maxIndex = Math.max(chunks.size, ...chunks.keys(), 0);
            for (const name of staleAuthCookieNames(
              base,
              [...existing, ...(originalNames.get(base) ?? [])],
              maxIndex,
              keep,
            )) {
              document.cookie = serializeCookie(name, '', {
                path: '/',
                maxAge: 0,
              });
            }
            for (const { name: chunkName, value: chunkValue } of newChunks) {
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
