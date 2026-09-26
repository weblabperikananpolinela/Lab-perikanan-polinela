# PATCH v5.2.1 — Favicon & Apple Icon Berlatar Transparan

Tanggal: 2026-09-27 (WIB)
Status versi: `patch` dari `5.2.0`. Memperbaiki latar ikon yang sebelumnya
**putih solid** menjadi **transparan**, sesuai permintaan PM: *"aku mau semua
logo dolphin itu latarnya transparan"*.

## Masalah

Setelah v5.0.3 (favicon & apple-icon dibuat dari `logo_dolphin.webp`),
ikon yang dihasilkan **berlatar putih solid**, sedangkan logo sumber
(`public/logo_dolphin.webp`) transparan. Akibatnya di tab browser (di
samping judul halaman) logo tampak sebagai kotak putih.

Bukti piksel:

| File | Sebelum (v5.2.0) | Sesudah (v5.2.1) |
|---|---|---|
| `favicon.ico` (16/32/48) | TL `255,255,255,255` — opaque white **41%** | TL `0,0,0,0` — transparan **37–41%** |
| `apple-icon.png` (180) | TL `255,255,255,255` — opaque white **41%** | TL `76,105,113,0` — transparan **42%** |

Akar penyebab: `scripts/generate-favicons.mjs` sengaja menempel logo di atas
kanvas `{ r: 255, g: 255, b: 255, alpha: 1 }`.

## Perubahan

Hanya `scripts/generate-favicons.mjs` (tidak ada kode aplikasi yang berubah):

1. Kanvas ikon diganti menjadi transparan: `ICON_BG = { r: 0, g: 0, b: 0, alpha: 0 }`.
2. Komentar script diperbarui + catatan bahwa iOS menampilkan area transparan
   sebagai **hitam** di home screen (keterbatasan Apple; PM sudah menyetujui).
3. `apple-icon.png` tetap memakai palette 256 warna **dengan kanal alpha
   dipertahankan** — ukuran tetap kecil (±17 KB), bukan ±60 KB.

Regenerasi: `node scripts/generate-favicons.mjs`.

## Hasil

| File | Ukuran | Isi |
|---|---|---|
| `public/favicon.ico` | 8.255 B | PNG-in-ICO 16/32/48, semua transparan |
| `public/apple-icon.png` | 17.068 B | 180×180, transparan 42% |

Verifikasi alpha per entri ICO:

```text
16x16  transparent 40.6%  TL=[0,0,0,0]
32x32  transparent 36.8%  TL=[0,0,0,0]
48x48  transparent 40.8%  TL=[0,0,0,0]
apple 180x180 transparent 42.0%  TL=[76,105,113,0]
```

Catatan: `icon-192x192.png` & `icon-512x512.png` (PWA/Android) **sudah
transparan** sejak awal — tidak disentuh.

## Yang TIDAK berubah

- `app/layout.tsx` metadata ikon — tetap menunjuk `favicon.ico`,
  `icon-512x512.png`, dan `apple-icon.png`.
- `public/manifest.json` — sama.
- Navbar / footer logo — memakai `logo_dolphin.webp` yang sudah transparan.

## Pemeriksaan tambahan (bukan bug)

Logo navbar lewat `/_next/image` bisa tampak **hitam** bila diminta tanpa
header `Accept: image/webp` (curl) karena optimizer merender JPEG tanpa alpha.
Browser modern mengirim `Accept: image/webp` sehingga hasilnya tetap WebP
transparan (terverifikasi: transparan 32%). Jadi tidak perlu perubahan.

## Checkpoint & status

| Checkpoint | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | `node scripts/generate-favicons.mjs`; alpha terverifikasi per entri; `npx tsc --noEmit` + `next build --webpack` |
| GITHUB-BACKUP | PENDING | menunggu komit + push |
| DEPLOYED | PENDING | menunggu deploy Plesk |
| MANUAL-TEST (PM) | PENDING | tab browser + home screen |

## Uji yang harus dilakukan PM

1. Buka situs → tab browser: ikon logo DOLPHIN **tanpa kotak putih**
   (hard refresh Ctrl+Shift+R; favicon di-cache lama).
2. iOS/iPadOS: Add to Home Screen → ikon logo transparan (area transparan
   tampil hitam — perilaku normal Apple).
3. Android: ikon PWA tetap seperti sebelumnya (tidak berubah).

## Rollback

Kembalikan `PAD_RATIO`/kanvas di script atau `git checkout HEAD~1 --
public/favicon.ico public/apple-icon.png scripts/generate-favicons.mjs`,
lalu `node scripts/generate-favicons.mjs`. Deploy: `httpdocs/*.old-<timestamp>`
(v5.2.0) + `touch tmp/restart.txt`.

## Referensi GitHub

- Repository: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Commit dasar: `684f663`
