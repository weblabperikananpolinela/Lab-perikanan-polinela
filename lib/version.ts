// Single source of truth untuk versi DOLPHIN.
// Format: release.major.minor (0.0.0) — lihat docs/patch-log/README.md
// untuk cara bump dan aturan checkpoint.
// Versi aplikasi: 5.7.0 — export Excel per lab: riwayat peminjaman yang di-ACC
// (2 sheet: Riwayat + Detail Barang) dan inventaris, unduh .xlsx dari dashboard
// admin lab. Dibangkitkan server via write-excel-file.
export const APP_VERSION = '5.7.0';

// Tanggal rilis versi ini (ISO 8601, zona WIB = UTC+7).
export const APP_RELEASE_DATE = '2026-10-03';

// Label tampilan untuk footer & laporan.
export const APP_VERSION_LABEL = `DOLPHIN System v${APP_VERSION}`;
