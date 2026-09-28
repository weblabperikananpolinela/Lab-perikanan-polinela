# PATCH v5.3.0 — Media Kelola Admin, Panel Overview & Hardening API

Tanggal: 2026-09-28 (WIB)
Status versi: `major` dari `5.2.1` (rilis fitur besar + hardening keamanan).
Spesifikasi: `docs/superpowers/specs/2026-09-28-admin-media-organisasi-overview-design.md`
(disetujui PM 2026-09-28).

## Ringkasan

1. **Foto hero beranda, dokumentasi, & organisasi kini dikelola lewat DB + Cloudinary**
   (sebelumnya file statis hardcode di `public/`).
2. **Panel Overview System Admin** — kesehatan DB, pemakaian Cloudinary, antrian
   pengajuan, maintenance mode dalam satu layar.
3. **Hardening API & RLS** hasil audit pentest 2026-09-28:
   - K1: `/api/delete-cloudinary` kini wajib login.
   - K2: fitur email (Resend) **dihapus total** sesuai kesepakatan klien.
   - K3: `/api/send-notification` dipindah ke service_role + RPC aman.
   - K4: RLS `push_subscriptions` diaktifkan; akses via RPC bersandi.
   - K5/K6: `app_settings` hanya system_admin yang menulis;
     `rls_auto_enable()` dicabut dari anon/authenticated.

## Perubahan Database (migrasi `v530_media_organisasi_overview`)

- **Tabel baru `dokumentasi_foto`** (lab_id nullable, file_url, is_visible,
  uploaded_by, created_at) + RLS:
  - Publik: SELECT hanya `is_visible = true`.
  - Admin lab: ALL untuk foto lab-nya; uploader: ALL foto miliknya;
    system admin: ALL seluruh foto.
- **`laboratorium` + 3 kolom PJ**: `pj_nama`, `pj_email`, `pj_foto_url`.
- **Tabel `page_views`** (path, tanggal, hit) + RPC `record_pageview`
  (SECURITY DEFINER, `search_path=''`, hanya path publik anonim, tanpa PII).
- **`app_settings`**: write berubah jadi system_admin-only (SELECT tetap publik
  karena middleware maintenance).
- **RPC push**: `register_push_subscription` (anon upsert by endpoint, role
  allowlist admin/dosen/mahasiswa), `get_push_targets` + `delete_push_subscription`
  (khusus service_role — anon tidak boleh membocorkan endpoint+keys).
- Revoke `rls_auto_enable()` dari anon/authenticated.
- Seed: 18 `laboratorium.pj_*` (nama+email `@polinela.ac.id`, foto lokal
  `/foto-organisasi/*.webp` sebagai placeholder), `app_settings.hero_banners`
  (4 banner lokal), `app_settings.organisasi_pimpinan` (3 pimpinan),
  13 foto `dokumentasi_foto` (foto lokal, lab_id null, uploaded_by 'seed').

## Perubahan Kode

| Area | Detail |
|---|---|
| `/api/send-notification` | `createServiceClient()` + RPC `get_push_targets`/`delete_push_subscription`; validasi payload (max 200 char, URL internal-safe, role allowlist, range lab 1–18); hapus subcription 404/410. |
| `lib/push-utils.ts` | `subscribeToPushNotifications` panggil RPC `register_push_subscription` (RLS sekarang memblokir SELECT langsung). |
| `lib/supabase/service.ts` (baru) | `createServiceClient()` service_role, server-only, butuh `SUPABASE_SERVICE_ROLE_KEY`. |
| `lib/supabase/public.ts` (baru) | anon client tanpa cookie untuk render publik static/ISR. |
| `lib/cloudinary-upload.ts` (baru) | helper upload per-folder (preset hero/dokumentasi/organisasi), validasi 5 MB & ekstensi, hapus via `/api/delete-cloudinary`. |
| `lib/site-media.ts` (baru) | tipe + fallback hero/dokumentasi/pimpinan (file lokal agar tidak 404 sebelum admin unggah). |
| `app/api/admin/health` (baru) | endpoint overview: count per tabel (service_role), usage Cloudinary, antrian pengajuan, maintenance mode; hanya system admin. |
| `components/pageview-beacon.tsx` (baru) | beacon first-party ke `record_pageview` (1×/hari/path via sessionStorage; skip admin/api). |
| `app/page.tsx` | server fetch `hero_banners` (revalidate 5m), fallback lokal. |
| `components/hero-section.tsx` | terima prop `banners` (url+alt). |
| `components/dokumentasi-section.tsx` | baca `dokumentasi_foto` (is_visible=true, limit 40) bukan fs. |
| `app/organisasi/page.tsx` | fetch `pj_*` dari `laboratorium` + `organisasi_pimpinan`; fallback data lama; tetap static 5m. |
| `/admin/system` + 3 tab baru | `OverviewTab`, `HeroOrganisasiTab` (hero max 4 + urutan, 3 pimpinan, 18 PJ lab), `DokumentasiAdminTab` (toggle is_visible + hapus). |
| `/admin/dashboard` + tab `DokumentasiTab` | PJ/admin lab unggah foto → tampil langsung di beranda; hapus foto milik lab-nya. |
| `app/api/delete-cloudinary` | +`requireAuth()` (401), validasi host cloud_name (403), resource_type image/raw fallback. |
| Email Resend | `app/api/send-email` + caller dihapus (`git rm -r`); `resend` dibuang dari `package.json`/lock. |

## Catatan environment server (wajib sebelum fitur upload aktif)

Belum di-set di Plesk (menunggu PM):
- `SUPABASE_SERVICE_ROLE_KEY` — dipakai `/api/send-notification` &
  `/api/admin/health`. Tanpa ini: push broadcast gagal 503 + health count null.
- Upload preset Cloudinary (unsigned) di dashboard Cloudinary:
  `dolphin_hero`, `dolphin_dokumentasi`, `dolphin_organisasi` —
  masing-masing di-pin folder, JPG/PNG/WebP, maks 5–10 MB.
  Lalu env:
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_HERO`
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_DOKUMENTASI`
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORGANISASI`

Tanpa preset: UI upload menampilkan pesan error konfigurasi; tampilan publik
tetap memakai fallback lokal (hero/dokumentasi/pimpinan tidak berubah).

## Verifikasi keamanan (advisors)

- `get_advisors` → **0 ERROR** security. WARN tersisa = RPC anon SECURITY DEFINER
  yang disengaja: `materi_public_by_pin`, `record_pageview`,
  `register_push_subscription` (semua sudah punya validasi + `search_path=''`).
- RLS `dokumentasi_foto` & `app_settings` diverifikasi via `pg_policies`.
- GRANT RPC: `register_push_subscription` & `record_pageview` → anon
  (dibutuhkan flow public); `get_push_targets`/`delete_push_subscription` →
  hanya service_role.

## Checkpoint & status

| Checkpoint | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | `npx tsc --noEmit` (0 error) + `next build --webpack` (18 rute; `/` & `/organisasi` static 5m ISR) |
| DB MIGRATION | PASS | migrasi `v530_media_organisasi_overview` applied; advisors 0 ERROR; set RLS/GRANT diverifikasi |
| GITHUB-BACKUP | PASS | commit `3461c7d` di-push ke `origin/master` (28 Sep 2026) |
| DEPLOYED | BELUM | butuh env server (service key + preset) |
| MANUAL-TEST (PM) | PENDING | lihat daftar uji di bawah |

## Uji yang harus dilakukan PM

1. `/admin/system > Hero & Organisasi`: unggah hero (max 4, urutan geser),
   ganti foto/teks 3 pimpinan, ubah nama/email/foto PJ lab → simpan.
2. `/admin/system > Dokumentasi`: toggle tampil/sembunyi, hapus foto.
3. Dashboard lab (PJ/admin): tab Dokumentasi → unggah foto → cek beranda
   marquee muncul.
4. `/admin/system > Overview`: angka DB/pengajuan/Cloudinary/maintenance
   terisi (perlu `SUPABASE_SERVICE_ROLE_KEY`).
5. Keamanan: tanpa login, `POST /api/delete-cloudinary` → 401; anon memanggil
   `get_push_targets` → ditolak; anon tulis `app_settings` → ditolak RLS.
6. Push notification pengajuan (broadcast admin + direct) masih berfungsi.
7. Beranda & `/organisasi` tetap tampil benar memakai fallback lokal hingga
   foto kustom diunggah.

## Rollback

- Kode: `git revert` commit rilis; build & deploy ulang.
- DB: migrasi bersifat additif (tabel/kolom baru + RLS pengaman) — tidak perlu
  drop untuk rollback fungsional; foto seed bisa disembunyikan
  (`is_visible=false`) bila ingin menonaktifkan dampak visual.
- Cloudinary: preset unsigned bisa dicabut di dashboard; foto yang diunggah
  admin tetap tersimpan sebagai aset Cloudinary.

## Referensi

- Spesifikasi: `docs/superpowers/specs/2026-09-28-admin-media-organisasi-overview-design.md`
- Repo: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`