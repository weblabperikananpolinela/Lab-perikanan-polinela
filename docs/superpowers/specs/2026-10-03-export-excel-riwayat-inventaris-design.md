# Design — Export Excel Riwayat & Inventaris per Lab (v5.7.0)

Tanggal: 2026-10-03 | Status: DRAFT (menunggu ACC PM)

## Ringkasan

PJ lab (role `admin` / `system_admin`) dapat mengunduh dua laporan Excel:

1. **Riwayat Peminjaman yang di-ACC** lab-nya (status sah: `Disetujui`, `Selesai`/`selesai`, `Dibatalkan` — sama dengan filter yang sudah dipakai tab Riwayat saat ini).
2. **Inventaris** lab-nya (semua kategori + item per lab).

Berlaku untuk semua 18 lab; `system_admin` bisa export lab mana pun lewat `?lab_id=` (dashboard lab via system admin).

## Keputusan Utama

| Aspek | Keputusan | Alasan |
|---|---|---|
| Library | **`write-excel-file` v4.1.1** | Aktif dirawat, tanpa advisory keamanan, API minimal, dukung Node (return Buffer) + multi-sheet styling dasar. SheetJS `xlsx@0.18.5` punya advisory CVE-2023-30533 (path parse) — kita hanya menulis, tapi hindari noise audit. |
| Tempat generate | **Server (API route)** | Pemeriksaan otorisasi lab terpusat; akses via `whitelist_admin` (bukan RLS doang yang `USING true`). |
| Auth | `createClient()` server (sesi user) + cek `whitelist_admin` | User harus login; lab_id export harus lab yang dia pegang (`role='admin'`) atau `is_system_admin()` untuk lab lain. |
| Format output | `.xlsx` asli (bukan CSV) | Requirement PM: "harus excel". |
| Bundle size | Tanpa beban client | Library hanya ditarik server-side di route handler — bundle browser tidak bertambah. |
| Data source | DB via Supabase (same session RLS view) | Tidak memperkenalkan service_role baru. |
| Nama lab | `lib/lab-map.ts` baru (18 lab, sumber tunggal) | Menghindari duplikasi labMap ke-11; refactor tab lain di luar scope. |

## Endpoint

### 1. `GET /api/export/riwayat?lab_id=N&filename=...`

- Ambil user sesi (`createClient` server). 401 bila tidak login.
- Baca `whitelist_admin` untuk `user.email`:
  - `role='system_admin'` → boleh export `lab_id` apa pun.
  - `role='admin'` & row punya `lab_id === N` → boleh.
  - Selainnya → 403.
- Query `peminjaman` filter `lab_id=N` + `status IN ('Disetujui','Selesai','selesai','Dibatalkan')`, order `created_at desc`, **loop halaman 1000** (defensif, hindari default limit).
- Query `peminjaman_item` utk semua `peminjaman_id` (satu `.in()`).
- Build workbook 2 sheet, stream sebagai attachment.

### 2. `GET /api/export/inventaris?lab_id=N&filename=...`

- Auth sama seperti di atas.
- Query `kategori_inventaris` per lab + `inventaris` per kategori (join di kode), urut kategori → jenis alat, loop 1000.
- 1 sheet data + `autoWidth` kolom.

> Kedua route: `export const dynamic = 'force-dynamic'` (jangan di-cache sebagai statis).

## Struktur Sheet Riwayat

**Sheet 1 — "Riwayat"** (satu baris per peminjaman):

| Kolom | Sumber |
|---|---|
| ID | `peminjaman.id` |
| Tanggal | `tanggal` (dd-mm-yyyy) |
| Hari | weekday `id-ID` |
| Jam Mulai | `jam_mulai` |
| Jam Selesai | `jam_selesai` |
| Nama Peminjam | `nama_lengkap` |
| Kategori Pemohon | `kategori_pemohon` |
| Judul Kegiatan | `judul_kegiatan` |
| Status | `status`; helper normalisasi (`selesai` → `Selesai`) |
| Total Biaya | `total_biaya` (Number, format `#,##0`) |
| Bukti Pembayaran | `bukti_pembayaran` (URL, String — aman dari injection) |
| Pesan Feedback | `pesan_feedback` |

**Sheet 2 — "Detail Barang"** (satu baris per item, relasi lewat ID):

| Kolom | Sumber |
|---|---|
| ID Peminjaman | item.peminjaman_id (join) |
| Nama Peminjam | dari peminjaman (join di kode) |
| Nama Alat/Bahan | `nama_alat_bahan` |
| Jumlah Dipinjam | `jumlah` |
| Kembali Baik | `jumlah_kembali_baik` |
| Rusak Ringan | `jumlah_kembali_rusak_ringan` |
| Rusak Berat | `jumlah_kembali_rusak_berat` |
| Catatan Pengembalian | `catatan_pengembalian` |

## Struktur Sheet Inventaris

Satu sheet "Inventaris" (satu baris per item):

| Kolom | Sumber |
|---|---|
| Kategori | `kategori_inventaris.nama_kategori` |
| Jenis Alat/Bahan | `jenis_alat` |
| Spesifikasi | `spesifikasi` |
| Jumlah Baik | `jumlah_baik` |
| Rusak Ringan | `jumlah_rusak_ringan` |
| Rusak Berat | `jumlah_rusak_berat` |
| Keterangan | `keterangan` |

## Pengamanan Cell (Anti Formula Injection)

- Semua nilai ditulis dengan tipe eksplisit: `StringType` untuk teks, `NumberType` untuk angka — sehingga nilai diawali `=`, `+`, `-`, `@` tidak dievaluasi Excel sebagai formula (library menulis sebagai string).
- `Content-Disposition: attachment` + nama file di-`encodeURIComponent` / disanitasi dari path traversal (hapus `../`, `/`, `\`).
- Tidak ada secret dalam file.

## UX / UI

- **RiwayatTab**: tombol `Unduh Riwayat (Excel)` di kanan CardHeader (sebelah Tombol "Tambah Riwayat Manual"), ikon `FileSpreadsheet` (lucide — sudah ada? cek import; kalau belum, tambah).
- **InventarisTab**: tombol `Unduh Inventaris (Excel)` di kanan CardHeader.
- Saat klik: fetch `/api/export/...`, baca blob, `URL.createObjectURL` + `<a download>`; loading state tombol (`spinner` + teks "Menyiapkan..."), error → `Swal` toast (pola konsisten).
- Nama file: `Riwayat-Peminjaman-<NamaLab>-<YYYY-MM-DD>.xlsx` dan `Inventaris-<NamaLab>-<YYYY-MM-DD>.xlsx` (NamaLab tanpa spasi/karakter berbahaya).

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Otorisasi lab bocor (RLS `USING true`) | Cek `whitelist_admin` di route handler — lab_id harus milik user |
| Data > 1000 baris truncated | Loop `.range(0,999)` dst. per query |
| Download berat di free-tier egress | Volume admin kecil; file hanya dibangkitkan on-demand |
| Nama lab duplikasi (debt labMap lama) | `lib/lab-map.ts` baru; refactor file lain ditunda (di luar scope) |
| `write-excel-file` API berubah | Pin v4.1.1; fallback `xlsx` (CDN SheetJS) jika API multi-sheet berbeda — diverifikasi saat implementasi |

## Files

- `npm i write-excel-file@4.1.1`
- `lib/lab-map.ts` (baru)
- `lib/export-riwayat.ts` + `lib/export-inventaris.ts` (builder workbook, testable)
- `app/api/export/riwayat/route.ts` (baru)
- `app/api/export/inventaris/route.ts` (baru)
- `app/admin/dashboard/_components/RiwayatTab.tsx` (tambah tombol + handler)
- `app/admin/dashboard/_components/InventarisTab.tsx` (tambah tombol + handler)
- `lib/version.ts` → `5.7.0`
- `docs/patch-log/5.7.0/PATCH.md` + entri `report.html`

## Verifikasi

1. `npx tsc --noEmit` + `npm run build -- --webpack`.
2. Dev run lokal: login admin lab uji → klik tombol → file terunduh & terbuka di Excel (2 sheet utk riwayat).
3. Cek header `content-type` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
4. Uji 401 (belum login) & 403 (lab_id bukan milik user).
