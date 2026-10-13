-- Migration: v5.9.0 — Session Idle Expiry (server-tracked)
-- Dibuat: 2026-10-13

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('system_admin', 'admin_lab', 'dosen', 'public')),
  idle_seconds integer not null check (idle_seconds in (3600, 14400)),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  ended_at timestamptz null,
  end_reason text null check (end_reason in ('logout', 'expired'))
);

-- Indexes
create index if not exists user_sessions_user_open_idx on public.user_sessions (user_id) where ended_at is null;
create index if not exists user_sessions_expires_idx on public.user_sessions (expires_at);

-- RLS Policies
alter table public.user_sessions enable row level security;
drop policy if exists "user_sessions_owner_all" on public.user_sessions;
create policy "user_sessions_owner_all" on public.user_sessions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "user_sessions_system_admin_all" on public.user_sessions;
create policy "user_sessions_system_admin_all" on public.user_sessions for all using (public.is_system_admin()) with check (public.is_system_admin());

-- Anti-tamper trigger
create or replace function public.lock_session_idle()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.idle_seconds is distinct from old.idle_seconds then
    raise exception 'idle_seconds tidak dapat diubah';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id tidak dapat diubah';
  end if;
  return new;
end $$;
drop trigger if exists trg_lock_session_idle on public.user_sessions;
create trigger trg_lock_session_idle before update on public.user_sessions for each row execute function public.lock_session_idle();
