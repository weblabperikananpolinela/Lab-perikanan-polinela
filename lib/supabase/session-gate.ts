/**
 * Session idle-expiry gate (v5.9.0) — server-tracked via `public.user_sessions`.
 *
 * Aturan: idle 4 jam (14400 dtk) untuk semua pengguna, 1 jam (3600 dtk)
 * untuk `system_admin`. Dipakai `middleware.ts` (halaman) dan route API
 * sensitif (export Excel, delete-cloudinary) karena matcher middleware
 * tidak mencakup `/api`.
 *
 * Sesi bersifat per-device (multi-baris per user diizinkan); login di
 * perangkat baru tidak menendang perangkat lama. `idle_seconds` dikunci
 * trigger DB (`trg_lock_session_idle`) sehingga client tidak bisa
 * memperpanjang jendelanya sendiri.
 */
import type { NextResponse } from 'next/server';

/** Nama cookie penanda baris sesi (di luar chunk auth Supabase). */
export const SESSION_SID_COOKIE = 'dolphin_sid';

/** Jendela idle (detik): publik/dosen/admin_lab. */
export const SESSION_IDLE_DEFAULT = 14400;

/** Jendela idle (detik): system_admin (lebih ketat). */
export const SESSION_IDLE_SYSTEM_ADMIN = 3600;

/** Heartbeat DB ditulis ulang hanya bila last_seen lebih tua dari ini. */
export const SESSION_HEARTBEAT_SECONDS = 60;

export const SESSION_SID_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export type SessionRole = 'system_admin' | 'admin_lab' | 'dosen' | 'public';

export type SessionCheckResult =
  | { ok: true; sid: string; fresh: boolean; idleSeconds: number }
  | { ok: false; expired: boolean };

type SessionUser = { id: string; email?: string | null } | null | undefined;

interface SessionRow {
  id: string;
  idle_seconds: number;
  last_seen_at: string;
  expires_at: string;
}

/** Tentukan role + jendela idle dari `whitelist_admin` (cermin logika navbar). */
async function resolveRoleIdle(
  supabase: any,
  email: string,
): Promise<{ role: SessionRole; idle: number }> {
  try {
    const { data } = await supabase
      .from('whitelist_admin')
      .select('role')
      .eq('email', email);
    if (data && data.length > 0) {
      if (data.some((r: any) => r.role === 'system_admin')) {
        return { role: 'system_admin', idle: SESSION_IDLE_SYSTEM_ADMIN };
      }
      return { role: 'admin_lab', idle: SESSION_IDLE_DEFAULT };
    }
  } catch {
    /* abaikan — fallback domain di bawah */
  }
  if (email.toLowerCase().endsWith('@polinela.ac.id')) {
    return { role: 'dosen', idle: SESSION_IDLE_DEFAULT };
  }
  return { role: 'public', idle: SESSION_IDLE_DEFAULT };
}

/** Tulis ulang heartbeat hanya bila sudah basi (hemat write ke DB). */
async function heartbeat(supabase: any, row: SessionRow, now: Date) {
  const last = new Date(row.last_seen_at).getTime();
  if (Number.isFinite(last) && now.getTime() - last < SESSION_HEARTBEAT_SECONDS * 1000) {
    return;
  }
  const exp = new Date(now.getTime() + row.idle_seconds * 1000);
  await supabase
    .from('user_sessions')
    .update({ last_seen_at: now.toISOString(), expires_at: exp.toISOString() })
    .eq('id', row.id);
}

async function markExpired(supabase: any, id: string, now: Date) {
  await supabase
    .from('user_sessions')
    .update({ ended_at: now.toISOString(), end_reason: 'expired' })
    .eq('id', id);
}

/**
 * Cek/adopsi/buat baris sesi untuk user yang sudah login Supabase.
 * Selalu aman dipanggil tiap request (idempotent, heartbeat throttled).
 */
export async function checkSession(
  supabase: any,
  sid: string | null | undefined,
  user?: SessionUser,
): Promise<SessionCheckResult> {
  let u = user;
  if (u === undefined) {
    const { data } = await supabase.auth.getUser();
    u = data?.user ?? null;
  }
  if (!u?.id) return { ok: false, expired: false };

  const now = new Date();

  // 1. Baris via cookie sid (jalur utama).
  if (sid) {
    const { data: row } = await supabase
      .from('user_sessions')
      .select('id, user_id, idle_seconds, last_seen_at, expires_at, ended_at')
      .eq('id', sid)
      .maybeSingle();
    if (row && (row as any).user_id === u.id && !(row as any).ended_at) {
      const r = row as SessionRow & { ended_at: string | null };
      if (now >= new Date(r.expires_at)) {
        await markExpired(supabase, r.id, now);
        return { ok: false, expired: true };
      }
      await heartbeat(supabase, r, now);
      return { ok: true, sid: r.id, fresh: false, idleSeconds: r.idle_seconds };
    }
    // sid tidak valid / milik user lain / sudah ended → adopsi/buat baru.
  }

  // 2. Adopsi baris terbuka terbaru milik user (mis. cookie hilang).
  const { data: openRows } = await supabase
    .from('user_sessions')
    .select('id, idle_seconds, last_seen_at, expires_at')
    .eq('user_id', u.id)
    .is('ended_at', null)
    .order('last_seen_at', { ascending: false })
    .limit(1);
  const adopted = (openRows as (SessionRow[] | null))?.[0];
  if (adopted) {
    if (now >= new Date(adopted.expires_at)) {
      await markExpired(supabase, adopted.id, now);
      return { ok: false, expired: true };
    }
    await heartbeat(supabase, adopted, now);
    return { ok: true, sid: adopted.id, fresh: true, idleSeconds: adopted.idle_seconds };
  }

  // 3. Buat baris baru (login pertama pasca-fitur / device baru).
  const email = typeof u.email === 'string' ? u.email : '';
  const { role, idle } = await resolveRoleIdle(supabase, email);
  const exp = new Date(now.getTime() + idle * 1000);
  const { data: created, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: u.id,
      email,
      role,
      idle_seconds: idle,
      last_seen_at: now.toISOString(),
      expires_at: exp.toISOString(),
    })
    .select('id')
    .single();
  if (error || !created) return { ok: false, expired: false };
  return { ok: true, sid: (created as { id: string }).id, fresh: true, idleSeconds: idle };
}

/** Ambil nilai `dolphin_sid` dari header Cookie mentah (route handler). */
export function parseSidFromCookieHeader(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/(?:^|;\s*)dolphin_sid=([^;]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/** Tulis cookie sid ke response bila baris sesi baru/adopsi (route handler). */
export function applyFreshSid(res: NextResponse, sess: SessionCheckResult): NextResponse {
  if (sess.ok && sess.fresh) {
    res.cookies.set(SESSION_SID_COOKIE, sess.sid, {
      ...SESSION_SID_COOKIE_OPTIONS,
      maxAge: sess.idleSeconds,
    });
  }
  return res;
}
