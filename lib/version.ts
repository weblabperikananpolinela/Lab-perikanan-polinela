// Single source of truth untuk versi DOLPHIN.
// Format: release.major.minor (0.0.0) — lihat docs/patch-log/README.md
// untuk cara bump dan aturan checkpoint.
// Versi aplikasi: 5.9.0 — Session idle-expiry server-tracked (tabel
// user_sessions): 4 jam idle untuk semua pengguna, 1 jam untuk system_admin,
// logout/expired tercatat, plus hotfix export Excel UUID (kolom ID teks).
export const APP_VERSION = '5.9.0';

// Tanggal rilis versi ini (ISO 8601, zona WIB = UTC+7).
export const APP_RELEASE_DATE = '2026-10-13';

// Label tampilan untuk footer & laporan.
export const APP_VERSION_LABEL = `DOLPHIN System v${APP_VERSION}`;
