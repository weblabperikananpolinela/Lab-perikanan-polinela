# v5.9.0 — Session Idle Expiry (server-tracked) + Hotfix Export Excel UUID

## Ringkasan

Sesi login sekarang punya batas **idle** yang dilacak server di tabel `user_sessions`.
Pengguna yang tidak aktif selama **4 jam** (admin lab / dosen / publik) atau **1 jam**
(`system_admin`) dipaksa login ulang. Rilis ini juga memuat hotfix export Excel
yang gagal saat kolom ID peminjaman bertipe UUID.

## Fitur

### Session idle-expiry

- Tabel baru `public.user_sessions` (migration `20261013050000_v590_user_sessions.sql`):
  `user_id`, `email`, `role`, `idle_seconds` (3600 atau 14400), `last_seen_at`,
  `expires_at`, `ended_at`, `end_reason` (`logout` | `expired`). RLS aktif:
  pemilik hanya menyentuh barisnya sendiri (`(select auth.uid()) = user_id`) +
  policy system admin via `is_system_admin()`. Trigger `trg_lock_session_idle`
  menolak perubahan `idle_seconds`/`user_id` (anti-perpanjangan jendela dari client).
- `lib/supabase/session-gate.ts` — helper `checkSession`: adopsi baris terbuka bila
  cookie `dolphin_sid` hilang, buat baris baru saat login pertama pasca-fitur,
  heartbeat throttled 60 detik, dan tandai `expired` bila melewati `expires_at`.
- `middleware.ts` — setelah `getUser()`, user login wajib lolos gate. Gagal/expired
  → `signOut` + redirect `/?login=expired|required&next=<path>` (path relatif saja,
  anti open-redirect). Cookie `dolphin_sid` httpOnly + SameSite=Lax, di luar chunk
  auth Supabase (tidak memengaruhi budget 3180-char).
- `components/session-expired-handler.tsx` — di homepage menampilkan toast dan
  menyimpan tujuan kembali ke `sessionStorage`; `components/navbar.tsx` memakai
  `consumeStoredNext()` untuk `redirectTo` OAuth Google.
- `app/api/auth/logout/route.ts` — menandai semua baris terbuka milik user
  `end_reason='logout'` (dipanggil navbar sebelum `signOut`).
- Gate juga di API yang tidak tercakup matcher middleware: `app/api/export/riwayat`,
  `app/api/export/inventaris`, `app/api/delete-cloudinary`. Respons 401
  `code: 'SESSION_EXPIRED'` membuat tombol export mengarahkan ke login.

### Hotfix export Excel UUID

- `peminjaman.id` dan `peminjaman_item.peminjaman_id` bertipe `uuid`, tetapi
  builder v5.7.0 menulisnya sebagai sel `Number` → error
  `Invalid cell value: <uuid>. Expected a number`.
- `lib/export-excel.ts`: kolom ID dan ID Peminjaman sekarang sel teks (lebar 38).

## Verifikasi lokal

- TypeScript: PASS (`tsc --noEmit`, EXIT=0).
- Production build webpack: PASS (BUILD_ID `AiYrIKA7KJGjlvKbeYTvT`).
- `get_advisors(security)`: tidak ada temuan baru pada `user_sessions`.
- `get_advisors(performance)`: warning `auth_rls_initplan` pada policy owner
  sudah diperbaiki ke `(select auth.uid())`. Sisa warning (multiple permissive
  policies, unused index) adalah pola proyek yang sudah ada / tabel baru belum
  dipakai — bukan regresi fitur ini.

## Status checkpoint

| Tahap | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | tsc EXIT=0 + build webpack lulus (BUILD_ID `AiYrIKA7KJGjlvKbeYTvT`). |
| GITHUB-BACKUP | PASS | commit `c2920fc` (kode) + commit bump versi/dokumen di-push origin/master. |
| DEPLOYED | PASS | 13 Okt 2026; BUILD_ID `AiYrIKA7KJGjlvKbeYTvT`; SHA-256 `242ce23cf747455a4fe0caff3e5cd15a0fb3ce2551bfcfe2008abda6896da37e`; ZIP 28,1 MB; smoke origin: `/` 200, robots/sitemap 200, export tanpa login 401, `/api/auth/logout` GET 405. Backup server `httpdocs.old-deploy-20261013-101927`. |
| MANUAL-TEST | PENDING | Uji PM: login lalu paksa `expires_at` ke masa lalu via SQL → reload harus redirect `/?login=expired&next=...`; unduh Excel riwayat lab yang punya UUID. |

## Risiko & rollback

- Gate bersifat **fail-closed**: bila baris sesi tidak bisa dibuat/dibaca, user
  diarahkan login ulang (bukan dibiarkan lewat). Risiko: bila tabel/RLS bermasalah,
  semua user login terkena redirect berulang — rollback = redeploy ZIP v5.8.0
  (`httpdocs.old-deploy-20261003-185310` atau ZIP sebelumnya).
- Tabel `user_sessions` tidak disentuh rollback kode; aman dibiarkan (kosong bila
  tidak dipakai) atau di-`DROP` manual.
- Cookie `dolphin_sid` tidak memengaruhi chunk auth Supabase.

## Manual test PM

1. Login (admin lab atau dosen) → cek baris baru di `user_sessions` (role + idle_seconds benar).
2. `UPDATE public.user_sessions SET expires_at = now() - interval '1 second' WHERE user_id = '<uuid>' AND ended_at IS NULL;` lalu reload halaman → harus ke `/?login=expired&next=...` dan baris bertanda `end_reason='expired'`.
3. Login ulang → harus kembali ke halaman asal (bukan homepage).
4. Logout manual → baris bertanda `end_reason='logout'`.
5. Unduh Excel Riwayat dari dashboard → file terbuka normal (kolom ID berisi UUID).
