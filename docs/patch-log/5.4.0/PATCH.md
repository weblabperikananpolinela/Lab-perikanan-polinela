# PATCH v5.4.0 — Media: hero 4–6, seleksi massal dokumentasi, modal unggah lab

Tanggal: 2026-09-29 (WIB)
Status versi: `minor` dari `5.3.0` (penyempurnaan UX media, tanpa perubahan RLS).
Spesifikasi: brainstorming bounded 29 Sep 2026 — tiga perubahan terpilih
(disetujui PM: 5.4.0, hero 4–6 dengan batas bawah 4, bulk hapus+tampil+sembunyi+pilih semua).

## Ringkasan

1. **Foto Beranda (hero): 4 → maks 6.** Tetap terisi 4 dari seed; admin bisa menambah hingga 6. Hapus dibatasi: tidak boleh turun di bawah 4.
2. **System Admin > Dokumentasi: seleksi massal.** Checkbox per kartu, Pilih semua/Batal pilih, toolbar sticky (Tampilkan · Sembunyikan · Hapus) dengan konfirmasi dan laporan kegagalan Cloudinary.
3. **Admin Lab > Dokumentasi: modal unggah.** Foto + Nama kegiatan (wajib) + Deskripsi (opsional). Validasi panjang sebelum upload.
4. **Skema:** `dokumentasi_foto.nama_kegiatan` + `deskripsi` (nullable, constraint panjang).

## Perubahan Database (migrasi `v540_dokumentasi_metadata`)

- `dokumentasi_foto.nama_kegiatan text` (nullable), `deskripsi text` (nullable).
- Constraint: `nama_kegiatan` 1–120 char (bila tidak null), `deskripsi` ≤500 char.
- Backfill 13 baris seed: `nama_kegiatan = 'Dokumentasi kegiatan laboratorium'` bila null.
- RLS tidak berubah.

## Perubahan Kode

| Area | Detail |
|---|---|
| `HeroOrganisasiTab.tsx` | `MAX_HERO` 4→6, tambah `MIN_HERO=4`; `removeHero` tolak bila ≤4; deskripsi kartu diperbarui. |
| `DokumentasiAdminTab.tsx` | Checkbox terpilih (ring ungu), pilih semua/batal, toolbar sticky dengan Tampilkan/Sembunyikan (`UPDATE … in(ids)`) dan Hapus massal (delete rows + best-effort delete Cloudinary). Aksi per-kartu tetap ada. |
| `DokumentasiTab.tsx` (lab) | Modal Dialog: preview foto (object URL, 5 MB guard via `isAllowedImage`), input Nama kegiatan* (120) + Deskripsi (500), tombol Unggah nonaktif sampai valid, insert `nama_kegiatan` + `deskripsi`. |
| `dokumentasi-section.tsx` | Ambil `nama_kegiatan` untuk `alt` gambar; fallback `'Dokumentasi kegiatan laboratorium'` bila kosong. |
| `MateriTab.tsx` | Hapus materi + hapus mata kuliah memakai dialog Swal (bukan `confirm()` browser) — seragam dengan seluruh aksi hapus lain. |
| `lib/version.ts` | `5.4.0`, tanggal `2026-09-29`. |

## Verifikasi

- `npx tsc --noEmit` → EXIT=0.
- `npm run build` → 18 rute, `/` & `/organisasi` static ISR 5m, BUILD_ID `XT0ksLsTZt2P1_jQGczSX`.

## Checkpoint & status

| Checkpoint | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | tsc + build webpack (BUILD_ID `XT0ksLsTZt2P1_jQGczSX`) |
| DB MIGRATION | PASS | `v540_dokumentasi_metadata` applied; advisors tetap 0 ERROR (hanya WARN anon SECURITY DEFINER yang disengaja) |
| GITHUB-BACKUP | PASS | commit `9dfeed1` di-push ke `origin/master` (29 Sep 2026) |
| DEPLOYED | PASS | 2026-09-29 ~16:56 UTC; ZIP `deploy-dolphin-XT0ksLsTZt2P1_jQGczSX.zip` (27,7 MB, SHA `83c9e097…5383e`); `httpdocs/.next/BUILD_ID = XT0ksLsTZt2P1_jQGczSX`; smoke 9/10 (403 hanya `/api/admin/health` = proteksi auth, bukan error) |
| MANUAL-TEST (PM) | PASS | PM ACC 29 Sep 2026 + uji lanjut konten |

## Uji PM

1. System Admin > Beranda & Organisasi: tambah foto beranda hingga 6; hapus di bawah 4 harus ditolak; reorder tetap bekerja.
2. System Admin > Dokumentasi: pilih beberapa foto → Tampilkan/Sembunyikan/Hapus massal; Pilih semua/Batal pilih; konfirmasi hapus muncul.
3. Dashboard lab > Dokumentasi: buka modal, pilih foto, isi Nama kegiatan → Unggah; Nama wajib, Deskripsi opsional; cek nama muncul sebagai alt di marquee beranda.
4. System Admin > Dokumentasi: cek foto baru menampilkan Nama kegiatan + Deskripsi.
5. Setiap tombol hapus (hero, dokumentasi per-kartu, dokumentasi massal, materi, mata kuliah, inventaris, jadwal, layanan, riwayat, admin lab) harus memunculkan dialog konfirmasi Swal sebelum data dihapus.

## Bukti deploy (server)

- Upload ZIP: `scp` 27,7 MB, SHA-256 server cocok (`83c9e097…5383e`).
- Backup generasi aktif: `httpdocs.old-deploy-20260929-165452` (copy). Stray extract ke root (`app.js/.next/node_modules/public/package.json`) dikarantina ke `.trash/stray-20260929`.
- Extract ke `httpdocs/`, `chmod 644 app.js`, restart via `touch httpdocs/tmp/restart.txt`.
- HTML beranda tersaji `DOLPHIN System v5.4.0` + referensi BUILD_ID `XT0ksLsTZt2P1_jQGczSX`.
- Smoke: 9/10 HTTP 200; `/api/admin/health` 403 karena butuh auth.

## Rollback

- Kode/server: kembalikan `httpdocs.old-deploy-20260929-165452` lalu `touch httpdocs/tmp/restart.txt`; atau `git revert 9dfeed1`, build + deploy ulang.
- DB: `alter table public.dokumentasi_foto drop column nama_kegiatan; alter table ... drop column deskripsi;` (opsional; kolom nullable, aman dibiarkan).

## Referensi

- Repo: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
