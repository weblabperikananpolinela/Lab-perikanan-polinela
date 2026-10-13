# Design — Session Idle Expiry (server-tracked)

Tanggal: 2026-10-13 · Status: REV (menunggu ACC PM) · Target versi: **v5.9.0**

## Ringkasan

User *idle* (tanpa request) selama **4 jam** (admin lab / dosen / public) atau **1 jam**
(`system_admin`) dipaksa **login ulang**. Timer dikelola server-side via tabel `user_sessions`;
client hanya bawa cookie `dolphin_sid` (httpOnly, Secure, SameSite=Lax). Sesi **per-device**
(login di HP tidak menendang laptop) — tidak ada mekanisme supersede.

> **Catatan:** Sistem DOLPHIN tidak pakai `/auth/callback` — `signInWithOAuth({redirectTo: origin})`.
> Semua logika session harus langsung, tanpa titik masuk server yang dibuat.

## Keputusan PM

| Topik | Keputusan |
|---|---|
| Idle publik/dosen/admin | 4 jam (14400 dtk) |
| Idle system_admin | 1 jam (3600 dtk) |
| Expired saat aktif | redirect → login, kembali ke halaman asal lewat `?next=` (via sessionStorage, anti open-redirect) |
| Audit | tabel `user_sessions` juga log akhir sesi (`ended_at`, `end_reason`) |
| Login manual | tetap via OAuth Google di navbar + `/?login=expired` trigger Swal |

## Bagian A — Skema (Supabase)

```sql
-- hanya run sekali; gunakan execute_sql lalu db pull
create table if not exists public.user_sessions (
  id              uuid    primary key default gen_random_uuid(),
  user_id         uuid    not null references auth.users not null,
  email           text    not null,
  role            text    not null,            -- 'system_admin' | 'admin_lab' | 'dosen'
  idle_seconds    int     not null check (idle_seconds in (3600, 14400)),
  last_seen_at    timestamptz not null default now(),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now(),
  ended_at        timestamptz,                -- null = masih hidup
  end_reason      text check (end_reason in ('logout','expired'))
);

-- user hanya sentuh barisnya sendiri; trigger mengunci idle_seconds (anti-override client)
create unique index if not exists user_sessions_active_idx
  on public.user_sessions (user_id) where ended_at is null;
create index if not exists user_sessions_expires_idx on public.user_sessions (expires_at);

-- RLS
alter table public.user_sessions enable row level security;
create policy "User dapat CRUD sesi miliknya"
  on public.user_sessions for all
  using (auth.uid() = user_sessions.user_id)
  with check (auth.uid() = user_sessions.user_id);

-- anti-tamper: trigger tolak update pada idle_seconds
create or replace function public._lock_session_idle()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.idle_seconds is distinct from new.idle_seconds then
    raise exception 'idle_seconds tidak dapat diubah';
  end if;
  return new;
end $$;
create trigger trg_lock_session_idle
  before update on public.user_sessions
  for each row execute function public._lock_session_idle();
```

**get_advisors cek:** primary FK index, autovacuum.

## Bagian B — Client cookie `dolphin_sid`

Di server, `middleware.ts`:
- set cookie via `response.cookies.set('dolphin_sid', sid, {
   httpOnly: true, secure: true, sameSite: 'lax',
   maxAge: roleIdle }`
  ).
- **Tidak** dipakai `__session` chunk (Supabase auth tetap sendiri). `sid` berada di luar budget cookie chunk Supabase, jadi tidak memengaruhi 431 nginx.

## Bagian C — Middleware (`middleware.ts`)

Urutan (setelah `await supabase.auth.getUser()`):

```ts
//  helper (lib/supabase/session-gate.ts)
export async function enforceSession(supabase, request, response) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { ok: false };              // belum login → biarkan; route client tentukan redirect

  const now = new Date();
  const { data: sess, error } = await supabase
    ..from('user_sessions')
    .select('id, user_id, role, idle_seconds, last_seen_at, expires_at')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  if (error || !sess) {
    // belum ada baris (login lama Pra-fitur) → adopsi otomatis
    const idle = await resolveIdle(user.email, supabase);
    const exp = new Date(now.getTime() + idle * 1000);
    const { data: created } = await supabase.from('user_sessions')
      .insert({ user_id: user.id, email: user.email, role, idle_seconds: idle,
                last_seen_at: now, expires_at: exp })
      .select('id').single();
    response.cookies.set('dolphin_sid', created.id, { httpOnly:true, secure:true, sameSite:'lax', maxAge: idle });
    return { ok: true };
  }

  // 1. expired?
  if (now >= new Date(sess.expires_at)) {
    await supabase.from('user_sessions').update(
      { ended_at: now, end_reason: 'expired' }).eq('id', sess.id);
    await supabase.auth.signOut();        // jaga-jaga client state
    response.cookies.set('dolphin_sid', '', { maxAge: 0 });
    return { ok: false, expired: true };  // caller redirect ke /?login=expired&next=<path>
  }

  // 2. heartbeat (throttled 60s)
  const last = new Date(sess.last_seen_at);
  if (now.getTime() - last.getTime() > 60_000) {
    const exp = new Date(now.getTime() + sess.idle_seconds * 1000);
    await supabase.from('user_sessions').update({
      last_seen_at: now, expires_at: exp }).eq('id', sess.id);
    response.cookies.set('dolphin_sid', sess.id, { ...same options, maxAge: sess.idle_seconds });
  }
  return { ok: true };
}
```

- `lib/supabase/session-gate.ts`: helper reusable (bisa dipanggil dari API handler).
- Resolve role/idle: `is_system_admin()` true → 3600, else 14400.

## Bagian D — API guard / route sensitif

Tanpa `/auth/callback`, API (`/api/export/*`, `/api/delete-cloudinary`) bebas middleware.
Jadi guard manual di entry point masing-masing:

```ts
import { enforceSession } from '@/lib/supabase/session-gate';
// di dalam handler GET/POST (setelah createClient server)
const { ok, expired } = await enforceSession(supabase, req, new NextResponse());
if (expired) return NextResponse.json({ error:'Session expired', code:'SESSION_EXPIRED' }, { status: 401 });
if (!ok)     return NextResponse.json({ error:'Login required' }, { status: 401 });
```

Komponen di frontend tanggapi 401 `SESSION_EXPIRED` dengan `window.location.href = '/?login=expired&next=' + encodeURIComponent(window.location.pathname)`.

> Scope rilis v5.9.0: **export riwayat + inventaris + delete-cloudinary only.** API lain follow-up (issue terpisah).

## Bagian E — Client UX (`/`)

- `?login=expired` → efek `useEffect` di layout/page utama: Swal “Sesi Anda berakhir karena tidak aktif 4 jam. Silakan login kembali.”
- Login → setelah OAuth sukses (di navbar `onAuthStateChange`), baca `sessionStorage.getItem('dolphin_next')`, `router.replace(next)` bila valid + berupa `/^\/(?!\/)/`.
- `?next=` divalidasi di client maupun server (anti open-redirect → hanya path relatif).

## F — Test & rollback

Tanpa menunggu 4 jam:
```sql
UPDATE public.user_sessions SET expires_at = now() - interval '1 second'
 WHERE user_id = '<uuid>' AND ended_at IS NULL;
```
reload salah satu tab → harus redirect `/?login=expired&next=/...`. Cek kolom `ended_at='expired'`.

Rollback: revert `middleware.ts` + hapus `lib/supabase/session-gate.ts`; DROP table+policy+trigger (idempoten karena `if not exists`).

## Catatan penting
- `idle_seconds` hanya 3600/14400 (hard-coded) — tidak boleh diubah user karena trigger.
- Cookie `sid` hanya 36 char UUID → tidak memengaruhi budget 3180-char chunk.
- Session publik *tanpa* cookie sid (visitor anon) tidak ada baris `user_sessions` — hemat resource.
