# PATCH v5.0.3 — Favicon & Apple Icon Memakai Logo DOLPHIN

Tanggal: 2026-09-26 (WIB)
Status versi: `minor` bump dari `5.0.2`. Memuat perbaikan **aset ikon**
(favicon, apple touch icon) dan koreksi klasifikasi audit aset.

## Ringkasan

Verifikasi menemukan bahwa favicon aplikasi **sebenarnya sudah terpakai**,
tetapi sebagian isinya **salah** (sisa template Next/Vercel) dan satu berkas
yang diminta browser modern maupun perangkat Apple **tidak ada**. Patch ini
mengganti semua ikon dengan logo DOLPHIN dan memperbaiki false-positive
pada script audit aset.

---

## 1. Hasil verifikasi (apa yang dipakai untuk apa)

Favicon di aplikasi ini dipakai untuk **empat** hal berbeda:

| Konsumen | Berkas | Sumber referensi |
|---|---|---|
| Tab browser, bookmark, riwayat, taskbar | `/favicon.ico` + `/icon-512x512.png` | `app/layout.tsx` → `metadata.icons` |
| Ikon PWA saat dipasang ke home screen Android | `/icon-192x192.png`, `/icon-512x512.png` | `public/manifest.json` |
| Ikon notifikasi push | `/icon-192x192.png` | `worker/index.ts` |
| Ikon home screen iOS/iPadOS | `/apple-icon.png` | `app/layout.tsx` → `metadata.icons.apple` |

Bukti HTML production sebelum patch hanya memuat:

```html
<link rel="icon" href="/icon-512x512.png"/>
<link rel="apple-touch-icon" href="/apple-icon.png"/>
```

### Temuan masalah

| Berkas | Sebelum | Isi | Masalah |
|---|---|---|---|
| `favicon.ico` | **tidak ada** | — | Browser modern & tool SEO meminta `/favicon.ico` langsung → **404**. Terbukti di `access_ssl_log`: request dari user nyata (referrer `https://dolphinperikanan.polinela.ac.id/`) menerima **404**. |
| `apple-icon.png` | ada (2.626 B) | Ikon template hitam-putih (bukan DOLPHIN) | Ikon home screen Apple **salah**. |
| `icon.svg` | ada (1.304 B) | Ikon template (bukan DOLPHIN) | Tidak direferensikan siapa pun; keliru ditandai `IMPLICIT`. |
| `icon-dark-32x32.png` | ada (585 B) | Ikon template | Tidak direferensikan siapa pun. |
| `icon-light-32x32.png` | ada (566 B) | Ikon template | Tidak direferensikan siapa pun. |
| `icon-192x192.png` | ada | **Logo DOLPHIN** ✅ | Aman. |
| `icon-512x512.png` | ada | **Logo DOLPHIN** ✅ | Aman. |

### Akar false-positive audit

`scripts/audit-assets.mjs` memiliki daftar `IMPLICIT` yang menganggap semua
berkas berpola `icon-*.png`, `apple-icon.png`, `icon.svg`, dan `favicon.ico`
"otomatis dipakai" — padahal konvensi otomatis Next.js (`app/icon.*`,
`app/apple-icon.*`) **tidak berlaku** untuk berkas di `public/`. Berkas
`public/` hanya dipakai bila **eksplisit** direferensikan. Akibatnya
`public/icon.svg` (sisa template) diberi status `IMPLICIT` padahal
tidak dipakai siapa pun.

---

## 2. Perbaikan

### 2.1 Berkas baru/diganti

```text
public/favicon.ico        (BARU)  7.804 B  — ICO multi-size 16/32/48
public/apple-icon.png     (GANTI) 17.428 B — 180x180, logo DOLPHIN
```

- `favicon.ico` dibuat sebagai **PNG-in-ICO** (payload PNG di dalam container
  ICO) — didukung semua browser modern, tanpa menambah dependency baru.
- `apple-icon.png` memakai **palette 256 warna** sehingga ukurannya turun
  dari ±62 KB (truecolor) ke 17,4 KB tanpa perbedaan yang terlihat pada
  ikon 180px.
- Keduanya berasal dari satu sumber: `public/logo_dolphin.webp` (512×512),
  diberi latar putih + padding 4% agar tidak terpotong saat di-crop bulat OS.

### 2.2 Metadata

`app/layout.tsx` — favicon kini eksplisit memakai `favicon.ico`:

```tsx
icons: {
  icon: [
    { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
  ],
  apple: '/apple-icon.png',
},
```

### 2.3 Generator ikon (dapat diulang)

`scripts/generate-favicons.mjs` (BARU) — satu sumber logo, dapat dijalankan
ulang kapan pun logo berubah:

```bash
node scripts/generate-favicons.mjs
```

### 2.4 Perbaikan audit aset

`scripts/audit-assets.mjs` — `IMPLICIT` dipersempit menjadi hanya
`manifest.json`, `favicon.ico`, `robots.txt`. Pola `icon-*`/`apple-icon`/
`icon.svg` dihapus agar berkas `public/` yang tidak direferensikan
**terdeteksi jujur**.

---

## 3. Hasil verifikasi

### Build

```text
npx tsc --noEmit          ✅
npx next build --webpack  ✅
```

HTML hasil build (diverifikasi langsung dari `.next/server/app/index.html`):

```html
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"/>
<link rel="icon" href="/icon-512x512.png" type="image/png" sizes="512x512"/>
<link rel="apple-touch-icon" href="/apple-icon.png"/>
```

Struktur ICO diverifikasi: `type=1`, 3 gambar (16×16, 32×32, 48×48),
semuanya PNG valid.

### Audit aset setelah perbaikan

| Status | Sebelum | Sesudah |
|---|---:|---:|
| USED | 46 | 47 |
| IMPLICIT | 1 | 0 |
| PARTIAL | — | 5 |

`/favicon.ico` dan `/apple-icon.png` kini masuk `USED` (eksplisit
direferensikan); `/icon.svg` tidak lagi salah diberi status `IMPLICIT`.

### Laporan PM (uji 502, 26 Sep 2026 WIB)

PM mengakses berbagai route pada build v5.0.2 dan **belum mengalami 502**.
Uji idle ±1 jam + login Google ulang dilanjutkan (itu skenario pemicu
yang terbukti). Status manual v5.0.2 tetap `PENDING` sampai skenario idle
selesai.

---

## File yang berubah

```text
public/favicon.ico                    (BARU — ICO multi-size 16/32/48)
public/apple-icon.png                 (GANTI — 180x180 logo DOLPHIN)
app/layout.tsx                        (metadata.icons: favicon.ico eksplisit)
scripts/generate-favicons.mjs         (BARU — generator ikon)
scripts/audit-assets.mjs              (IMPLICIT dipersempit)
lib/version.ts                        (5.0.3)
docs/patch-log/5.0.3/PATCH.md         (BARU)
docs/patch-log/report.html            (bagian v5.0.3)
docs/patch-log/asset-audit.json       (regenerasi)
```

## Angka kunci

| Metrik | Sebelum | Sesudah |
|---|---|---|
| `favicon.ico` | tidak ada (404) | **7.804 B, 16/32/48** |
| `apple-icon.png` | 2.626 B (ikon template) | **17.428 B (logo DOLPHIN 180×180)** |
| Ikon salah/template | 4 berkas | **0 berkas aktif** |
| Status `IMPLICIT` salah | 1 (`icon.svg`) | **0** |

## Checkpoint & status

| Checkpoint | Status | Bukti / waktu |
|---|---|---|
| LOCAL-READY (tsc + build) | PASS | `npx tsc --noEmit` ✅; `next build --webpack` ✅ |
| GITHUB-BACKUP | PENDING | menunggu ACC PM untuk commit + push |
| DEPLOYED | PENDING | menunggu ACC PM |
| MANUAL-TEST (PM) | PENDING | verifikasi tab browser + home screen iOS |

## Risiko & rollback

- Tidak ada perubahan kode runtime (middleware, sesi, RLS, DB) — hanya
  aset statis + metadata ikon. Risiko sangat rendah.
- `apple-icon.png` versi lama tersimpan di riwayat git; rollback =
  `git checkout HEAD~1 -- public/apple-icon.png`.
- Menghapus `favicon.ico` tidak merusak apa pun (browser kembali memakai
  `link rel="icon"`), tetapi tidak disarankan.

## Pekerjaan tersisa

- ACC PM → commit + push + deploy v5.0.3.
- Keputusan PM: hapus aset template `icon.svg`, `icon-dark-32x32.png`,
  `icon-light-32x32.png` (kini jujur terdeteksi tidak dipakai).
- Keputusan PM: hapus 11 aset UNUSED (1,62 MB); drop
  `public.whitelist_dosen`; bersihkan `page - Copy.tsx` + `backup.txt`.
- Uji PM v5.0.2: idle ±1 jam + login Google ulang → harus 200.
- Opsional: buffer nginx per-vhost (pertahanan tambahan).
- Next 16: `middleware.ts` → `proxy.ts` (warning deprecation di build).

## Referensi GitHub

- Repository: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Commit v5.0.2 (dasar): `08a6ade`
