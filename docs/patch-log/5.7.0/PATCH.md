# v5.7.0 — Export Excel per Laboratorium

## Ringkasan

PJ/admin setiap lab dapat mengunduh data milik labnya dalam format Excel asli
(`.xlsx`) dari dashboard:

- **Unduh Riwayat (Excel)**: peminjaman dengan status `Disetujui`, `Selesai`,
  `selesai`, atau `Dibatalkan`, terdiri dari sheet `Riwayat` dan `Detail Barang`.
- **Unduh Inventaris (Excel)**: seluruh kategori dan item inventaris lab dalam
  sheet `Inventaris`.

## Implementasi

- Library server-side `write-excel-file@4.1.1`; tidak menambah beban bundle browser.
- Endpoint dinamis:
  - `GET /api/export/riwayat?lab_id=<id>`
  - `GET /api/export/inventaris?lab_id=<id>`
- Endpoint memakai sesi login server (`supabase.auth.getUser()`) dan memeriksa
  `whitelist_admin`. Admin lab hanya boleh mengunduh lab yang ditugaskan;
  `system_admin` boleh memilih lab lain.
- Query menggunakan paging 1.000 baris agar tidak terpotong oleh default limit.
- Sel teks diamankan dari formula injection Excel (`=`, `+`, `-`, `@`).
- Nama file menyertakan nama lab dan tanggal unduh.
- Tombol tersedia di `RiwayatTab` dan `InventarisTab`, dengan state loading,
  download blob, dan error toast Swal.

## Data laporan

### Riwayat

Sheet `Riwayat` memuat identitas peminjaman, tanggal/jam, peminjam, kategori,
judul kegiatan, status, biaya, bukti pembayaran, dan feedback. Sheet `Detail
Barang` memuat alat/bahan, jumlah dipinjam, kondisi pengembalian, serta catatan.

### Inventaris

Memuat kategori, jenis alat/bahan, spesifikasi, jumlah baik, rusak ringan, rusak
berat, dan keterangan.

## Verifikasi lokal

- TypeScript: PASS (`node node_modules/typescript/bin/tsc --noEmit`)
- Production build webpack: PASS
- Route table: kedua endpoint tampil sebagai dynamic (`ƒ`)
- Smoke unauthenticated: riwayat `401`, inventaris `401`
- Smoke invalid parameter: `400`
- Builder workbook: PASS, menghasilkan ZIP XLSX valid (signature `PK`, 3.752 byte
  pada fixture dua sheet)

## Status checkpoint

| Tahap | Status | Bukti |
|---|---|---|
| SPEC | PASS | Spec disetujui PM pada 3 Okt 2026. |
| LOCAL-READY | PASS | TypeScript + production build webpack lulus; route dynamic; smoke 401/400; fixture XLSX valid. |
| GITHUB-BACKUP | PASS | commit `b2b5cfc` di-push ke `origin/master` (3 Okt 2026). |
| DEPLOYED | PASS | 3 Okt 2026 14:41 UTC; BUILD_ID `e80DDU6GRjd7OBEzBdSIB`; SHA-256 `086649d1ecafa89c9105b894b56ce8d60a17a1486d3cac2d18755e254139fe27`; smoke origin 4/4 HTTP 200. |
| MANUAL-TEST | PASS | Smoke origin: `/` 200 (footer `DOLPHIN System v5.7.0`), file GSC 53 byte 200, kedua route export 401 tanpa login. Uji download dengan akun login menunggu PM. |

## Catatan deploy

Deploy production selesai. BUILD_ID aktif `e80DDU6GRjd7OBEzBdSIB`; deploy pertama (`ZqV5i3FwufQNt-UQs4ajM`)
diganti karena build itu dibuat sebelum bump versi. Backup server dibuat sebelum
replace.

## Manual test PM

1. Login sebagai PJ Lab A dan buka Dashboard → Riwayat; klik **Unduh Riwayat
   (Excel)**; pastikan hanya data Lab A dan dua sheet muncul.
2. Buka tab Inventaris; klik **Unduh Inventaris (Excel)**; buka di Excel dan
   periksa kategori/stok/keterangan.
3. Uji sebagai admin lab lain; pastikan tidak bisa mengunduh `lab_id` lab lain.
4. Uji sebagai system admin dengan `?lab_id=`; pastikan lab yang dipilih dapat
   diekspor.
5. Verifikasi status, tanggal, jumlah, dan file URL tidak dievaluasi sebagai
   formula.
