# v5.8.0 — Master Lab/TEFA Dinamis + CRUD System Admin

## Ringkasan

Lab/TEFA bukan lagi hardcode di kode. `labMap` (18 lab) dihapus dari 10+ file
dan diganti sumber dinamis dari tabel `laboratorium`, dengan kolom baru
`is_active` untuk nonaktifkan (disable, bukan hapus). System Admin dapat
tambah/edit/nonaktifkan lab dari tab **Semua Lab** di `/admin/system`.

## Fitur

### Pagination Cek Status (publik)

- `/administrasi/status` sekarang menampilkan **20 peminjaman/halaman** (sebelumnya
  sebelumnya tanpa limit), dengan tombol Sebelumnya/Berikutnya dan count
  exact. Reset page otomatis saat keyword filter berubah.

### Master Lab/TEFA dari DB

- `lib/labs.ts` = sumber tunggal: `LabRow`, `fetchLabs` / `fetchLabsCached`,
  `KATEGORI_LAB`, `JENIS_LAB`, `resolveLabName` + fallback `LAB_MAP`.
- File yang diganti (labMap hardcode → `fetchLabs` / `LAB_MAP`):
  - `components/navbar.tsx`, `app/admin/dashboard/page.tsx` (+ tabs
    Pengajuan/Riwayat/Inventaris), `app/jadwal/page.tsx` (grid jadwal dari
    lab aktif), `app/inventaris/page.tsx` (dropdown dinamis + default lab
    pertama aktif), `app/organisasi/page.tsx` (`.eq('is_active', true)`).
  - `app/administrasi/pengajuan/page.tsx`: dropdown dinamis per kategori,
    `labIdByName` tanpa fallback `|| 1` — lab nonaktif tidak bisa submit.
- `App_server`/`LAB_MAP` tetap di `lib/lab-map.ts` sebagai fallback legacy.

### Kolom `is_active` + RLS

- Migration `v580_laboratorium_is_active`: kolom `is_active boolean NOT NULL
  DEFAULT true` (18 lab sudden = true); unique index
  `laboratorium_nama_lab_unique` atas `lower(nama_lab)`.
- Policy publik `laboratorium` sekarang `USING (is_active = true)`; system
  admin (via `public.is_system_admin()`) tetap melihat semua lab.
- `get_advisors(security)`: tidak ada temuan baru; DEFENDER param tetap.

### CRUD Lab/TEFA — System Admin

- Tab **Semua Lab** di `/admin/system` dibangun ulang dengan `LabAdminTab`:
  - Grid kartu semua lab (aktif + nonaktif), badge Nonaktif, edit (Pencil),
    power toggle.
  - **Tambah Lab/TEFA**: modal nama + jenis (Laboratorium/TEFA) + kategori
    (Lab Perikanan / Lab Perikanan Tangkap) + PJ nama/email (manual, tanpa
    insert `whitelist_admin`).
  - **Nonaktifkan**: konfirmasi Swal yang menampilkan data terkait (count
    peminjaman, kategori inventaris, item, akun) + efek; data lama tetap,
    tidak ada hapus permanen.
  - **Aktifkan kembali**: restore (data tetap).
  - Tombol **Buka Dashboard** (openLab) di kartu tetap — system admin masuk
    dashboard lab via profile sintetis.

## Verifikasi lokal

- Migration `v580_laboratorium_is_active` diterapkan; 18 lab `is_active=true`.
- TypeScript: PASS (`node node_modules/typescript/bin/tsc --noEmit`).
- Production build webpack: PASS (BUILD_ID `OAIJEx_T68C5ANlHPvIKX`).
- Smoke runtime standalone (port 3112): `/`, `/jadwal`, `/inventaris`,
  `/organisasi`, `/administrasi/status`, `/administrasi/pengajuan`,
  `/dokumen/sop-perikanan` → 7/7 HTTP 200; footer `DOLPHIN System v5.8.0`.

## Status checkpoint

| Tahap | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | tsc EXIT=0 + build webpack lulus; smoke 7/7 halaman 200; footer v5.8.0. |
| GITHUB-BACKUP | PASS | commit `0ecfbb2` di-push origin/master (4 Okt 2026). |
| DEPLOYED | PASS | 4 Okt 2026; BUILD_ID `OAIJEx_T68C5ANlHPvIKX`; SHA-256 `d5035539b2b9c32bda349ec2c063c6c61d882caa323af171d4105cbef7ed786a`; ZIP 28.0 MB; smoke origin 200 + footer v5.8.0. Backup server `httpdocs.old-deploy-20261003-185310`. |
| MANUAL-TEST | PENDING | Uji PM: tambah/edit/nonaktifkan lab, dropdown dinamis, pagination 20, RLS publik. |

## Risiko & rollback

- **Disable lab bukan destruktif**: hanya `is_active=false`; peminjaman,
  inventaris, riwayat, whitelist_admin tetap. Rollback = set `is_active=true`.
- Re-deploy v5.7.0 ZIP boleh mengehang sebagian skema (kolom `is_active`
  tetap di DB); rollback safety via backup `httpdocs.old-deploy-*`.

## Manual test PM

1. Login System Admin → **Semua Lab**: tambah lab test → tampil di Organisasi
   + dropdown pengajuan; edit nama; nonaktifkan → tidak tampil publik tetapi
   data dashboard tetap; aktifkan kembali.
2. `/administrasi/status` (publik): pastikan 20/halaman + nav; pagination
   reset saat search.
3. `/inventaris` publik: dropdown dinamis, default lab pertama aktif.
4. `/jadwal` publik: grid dari lab aktif.
5. RLS: anon tidak bisa lihat lab nonaktif via PostgREST query.