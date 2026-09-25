# PATCH v5.0.0 — System Admin, Anti-431 Cookie, dan Sistem Versi

Tanggal: 2026-09-25 (WIB)
Status versi: `release` bump dari `4.6` (hardcode) ke `5.0.0` (terpusat).

## Ringkasan

Rilis besar dengan tiga kelompok perubahan:

1. **Fitur System Admin** — role `system_admin` dengan dashboard `/admin/system`
   untuk mengelola akun admin lab dan membuka dashboard semua lab.
2. **Perbaikan error 431/502 di hosting Polinela** — pelangsingan cookie OAuth
   Google (`provider_token`) di sisi klien dan middleware, chunk 3180 standar
   `@supabase/ssr`, serta cleanup chunk lama.
3. **Sistem versi & patch log** — versi terpusat di `lib/version.ts`,
   ditampilkan di footer, dan didokumentasikan di `docs/patch-log/`.

## Perubahan teknis

### Fitur System Admin

- `whitelist_admin.role` kini bisa `system_admin` (lab_id NULL) atau `admin`.
- RLS: policy bypass `System admin full *` dengan email system admin
  di-hardcode (anti-rekursi). Tabel terdampak: `whitelist_admin`,
  `jadwal_lab`, `layanan_lab`, `rekening_admin`, `materi_dosen`,
  `akses_dosen_materi`, `laboratorium`.
- Navbar: deteksi role `system_admin` → menu Dashboard System Admin
  (desktop dropdown + mobile sheet, ikon ShieldCheck).
- `/admin/system`: sidebar ala dashboard lab (slate-900, collapse, mobile
  drawer, aksen ungu). Tab: Manajemen Akun (CRUD admin, multi-select lab
  dengan highlight) dan Semua Lab (grid kartu → dashboard lab `?lab_id=`).
- `/admin/dashboard?lab_id=X`: system admin masuk dengan profile sintetis
  (tanpa row whitelist per lab); validasi `lab_id` integer > 0.
- `whitelist_dosen` dihapus dari alur login; dosen cukup domain
  `@polinela.ac.id`. Tabel DB masih ada, 0 baris, tidak direferensikan —
  aman di-drop kapan saja (menunggu keputusan PM).
- Navbar/Footer global disembunyikan di `/admin/system` dan
  `/admin/dashboard` (layout-wrapper).

### Anti-431 / 502 (hosting Polinela)

- `lib/supabase/client.ts`: `setAll` chunk-aware — gabungkan seluruh chunk
  sesi, hapus `provider_token`/`provider_refresh_token`, re-chunk 3180
  standar, expire chunk sisa. Bug lama: intersepsi per-chunk menghasilkan
  JSON terpotong.
- `middleware.ts`: urutan diperbaiki — refresh session dulu (`getUser()`),
  lalu `slimAuthCookies()` pada response final (mencegah Set-Cookie hilang
  karena `setAll` mereassign response). Reassembly chunk mengikuti semantik
  `combineChunks` (berhenti di gap); chunk stale di luar run kontigu
  di-expire. Cookie options standar ssr (`httpOnly: false`).
- `app/layout.tsx`: `Analytics`/`SpeedInsights` Vercel hanya aktif jika
  `process.env.VERCEL === '1'` (tidak jadi dependency eksternal di Plesk).
- Audit SSH read-only: 431 disebabkan request header Cookie terlalu besar
  (Apache `LimitRequestFieldSize` 8190), 502 oleh response header Node
  terlalu besar untuk buffer nginx. Kedua penyebab berkurang drastis dengan
  cookie ramping + build baru.

### Sistem versi & patch log

- `lib/version.ts`: `APP_VERSION = '5.0.0'`, `APP_RELEASE_DATE`,
  `APP_VERSION_LABEL` — sumber tunggal.
- `components/footer.tsx`: label versi dari `lib/version` (menggantikan
  hardcode `v.4.6`).
- Footer sidebar `/admin/dashboard` dan `/admin/system`: label versi kecil di
  bawah tombol kembali.
- `app/maintenance/page.tsx`: label versi di bawah teks maintenance.
- `docs/patch-log/README.md`: aturan workflow versi + checkpoint +
  `report.html` per versi.

### Perbaikan lain

- `RiwayatTab.tsx`: type inference `Map` diperbaiki (blokir build
  production).
- Cleanup: file `page - Copy.tsx` / backup tetap ada, belum dihapus
  (kandidat, menunggu keputusan PM).

## File yang berubah

```text
app/admin/dashboard/page.tsx
app/admin/dashboard/_components/{InventarisTab,OverviewTab,PengajuanTab,RiwayatTab}.tsx
app/admin/system/page.tsx            (baru)
app/admin/system/_components/KelolaUserTab.tsx (baru)
app/administrasi/pengajuan/page.tsx
app/administrasi/status/page.tsx
app/api/send-email/route.ts
app/api/send-notification/route.ts (env var)
app/dosen/materi/page.tsx
app/jadwal/page.tsx
app/layout.tsx
app/maintenance/page.tsx
components/footer.tsx
components/layout-wrapper.tsx
components/navbar.tsx
components/sop-section.tsx
lib/supabase/client.ts
lib/supabase/server.ts
lib/version.ts                      (baru)
middleware.ts
docs/patch-log/README.md            (baru)
docs/patch-log/report.html          (baru — dashboard semua versi)
docs/patch-log/5.0.0/PATCH.md       (baru)
AGENTS.md
```

## Checkpoint & status

| Checkpoint | Status | Bukti / waktu |
|---|---|---|
| LOCAL-READY (tsc + build) | PASS | `npx tsc --noEmit` ✅; `next build --webpack` ✅ (BUILD_ID `s3sqnMmsD7Ca48sM0-5em`) |
| AUTO-TEST (agent) | PASS | tsc, production build, smoke test curl 7 route dari server, verifikasi BUILD_ID aktif |
| DEPLOYED (Polinela production) | PASS | 2026-09-24 ~18:40 UTC; semua route uji HTTP 200; backup server `~/backup-deploy-20260924-183606`; rollback: `*.old-20260924-183606` |
| GITHUB-BACKUP (commit+push) | PASS | Commit `0be3391` di-push ke `origin/master` (2026-09-25). Lihat https://github.com/weblabperikananpolinela/Lab-perikanan-polinela/commit/0be3391 |
| MANUAL-TEST (PM) | PASS | Project Manager menguji langsung dan memberi ACC (2026-09-25) |

## Catatan deploy

- ZIP deploy 34MB, SHA-256 `e2dbac7b...f45b`, diverifikasi identik di server.
- Restart aplikasi via `touch tmp/restart.txt` (Passenger) — tanpa sudo,
  tanpa restart service global, tenant lain tidak tersentuh.
- Limit nginx (`proxy_buffer_size` dll.) belum diubah (butuh admin Plesk);
  error "too big header" sudah tidak muncul pada smoke test post-deploy,
  tetapi monitoring lanjutan disarankan.

## Risiko & catatan

- Token Google tetap dikirim ke browser saat login pertama (sesuai perilaku
  Supabase), tetapi tidak lagi dipertahankan di cookie — client kita strip
  sebelum persist.
- Old chunks >= index kontigu di-expire otomatis oleh middleware; browser
  lama dengan sesi gemuk akan mengecil pada request pertama yang lolos.
- `encode: 'tokens-only'` di-evaluasi tapi TIDAK dipakai (butuh getAll/
  setAll dan memindahkan user object ke localStorage — berisiko untuk
  halaman yang memakai `session.user.email`).

## Pekerjaan tersisa

- Keputusan PM: drop table `whitelist_dosen`; hapus file redundan
  (`page - Copy.tsx`, backup, ZIP deploy lama).
- Permintaan ke admin hosting: buffer nginx per-vhost (opsional, proteksi
  tambahan).
- Evaluasi PWA cache halaman statis (todo lama #7).

## Riwayat versi

Laporan visual semua versi: `docs/patch-log/report.html` (satu file untuk
seluruh riwayat). File per versi hanya `PATCH.md`.

## Referensi GitHub

- Repository: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Commit rilis v5.0.0: `0be3391`
- Commit sebelumnya: `686bff9` (refactor untuk plesk)
