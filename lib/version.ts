// Single source of truth untuk versi DOLPHIN.
// Format: release.major.minor (0.0.0) — lihat docs/patch-log/README.md
// untuk cara bump dan aturan checkpoint.
// Versi aplikasi: 5.8.0 — Master Lab/TEFA: kolom is_active, CRUD lab di
// System Admin (tambah / edit / nonaktifkan tanpa hapus), nama lab dibaca dari
// tabel laboratorium di semua halaman, dan pagination 20/baris di Cek Status.
export const APP_VERSION = '5.8.0';

// Tanggal rilis versi ini (ISO 8601, zona WIB = UTC+7).
export const APP_RELEASE_DATE = '2026-10-03';

// Label tampilan untuk footer & laporan.
export const APP_VERSION_LABEL = `DOLPHIN System v${APP_VERSION}`;
