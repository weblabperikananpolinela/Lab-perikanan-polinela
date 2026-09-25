# PATCH v5.0.1 — Audit Aset, Optimasi PWA, dan Hotfix 502 Set-Cookie

Tanggal: 2026-09-26 (WIB)
Status versi: `minor` bump dari `5.0.0`. Memuat **hotfix production** untuk 502
yang ditemukan PM pada rilis 5.0.0.

## Ringkasan

Empat kelompok perubahan:

1. **Hotfix 502 setelah idle** — sesi Supabase dipaksa muat dalam satu cookie
   chunk (buang `identities`/`factors`/provider token) agar `Set-Cookie` hasil
   refresh JWT tidak melebihi buffer nginx.
2. **Audit & trace aset** — setiap file `public/` ditandai status pemakaian
   (USED / DYNAMIC / IMPLICIT / PARTIAL / UNUSED / GENERATED) plus deteksi
   referensi rusak. Dua bug visual nyata ditemukan dan diperbaiki.
3. **Optimasi aset (Tahap C)** — 38 gambar dikonversi ke WebP terkompresi
   (70% lebih kecil); sumber lama yang sudah digantikan dihapus.
4. **Pelangsing PWA (Tahap A+B)** — precache 126 → 77 entri, halaman dinamis
   `NetworkOnly`, namespace cache baru + cleanup cache lama saat aktivasi SW.

---

## 1. Hotfix 502 — `upstream sent too big header`

### Gejala yang dilaporkan PM

> Setelah menutup Chrome dan mematikan laptop ±1 jam, membuka DOLPHIN lagi
> menghasilkan **error 502**. Padahal tepat setelah publish, reload dan
> navigasi berkali-kali tidak memunculkan 502 sama sekali.

### Bukti dari server (read-only SSH, 2026-09-25 06:32 UTC)

Proses aplikasi hidup normal; **bukan** Passenger mati atau Node crash:

```text
$ ps -u … | grep next-server
3659205 Fri Sep 25 02:31:11 2026  04:01:13  next-server (v16.2.0)
```

`next-server` sudah jalan 4 jam. Yang muncul di
`~/logs/proxy_error_log` (log nginx) justru:

```text
2026/09/25 06:21:47 [error] … upstream sent too big header while reading
  response header from upstream, request: "GET /jadwal HTTP/2.0"
2026/09/25 06:21:53 [error] … request: "GET /sw.js HTTP/2.0"
2026/09/25 06:22:37 [error] … request: "GET / HTTP/2.0"
2026/09/25 06:22:42 [error] … request: "GET /sw.js HTTP/2.0"
```

Pola jumlah error per hari:

| Tanggal | Jumlah | Catatan |
|---|---:|---|
| 2026/09/21 | 40 | sebelum deploy v5.0.0 |
| 2026/09/24 | 16 | 15× pada 17:59–18:00, sebelum deploy 18:40 |
| 2026/09/25 | 4 | **setelah** deploy — kasus idle refresh |

Semua pesan identik: `upstream sent too big header`. Tidak ada
`upstream timed out` pada rentang itu (hanya 3× pada Juli).

### Bukti silang yang mengunci diagnosis

`access_ssl_log` (log Apache) **tidak memuat satu pun status 502**, dan pada
detik yang sama mencatat sukses:

```text
172.68.164.68 … [25/Sep/2026:06:21:45] "GET /jadwal HTTP/1.1" 200 15709
172.68.164.68 … [25/Sep/2026:06:22:37] "GET / HTTP/1.1"      200 31597
```

Artinya: request yang sama diproksikan nginx → Apache, Apache membalas
**200 dengan header respons terlalu besar**, lalu nginx menolaknya dan
mengirim 502 ke browser. Karena nginx menolak sebelum meneruskan, Apache
tetap mencatat 200 — sehingga log akses Apache bersih dari 502.

### Akar masalah

1. Middleware memanggil `supabase.auth.getUser()`. Setelah idle ±1 jam,
   access token hampir/sudah kedaluwarsa → SDK melakukan **refresh JWT**.
2. Refresh mengembalikan `user` lengkap dari server, termasuk
   `user.identities` (duplikat profil Google: `identity_data`, `picture`,
   `name`, dst.) dan token OAuth.
3. SDK memanggil `setAll()` → menulis session hasil refresh ke
   `Set-Cookie`. Di v5.0.0, `slimAuthCookies()` membaca **cookie request**
   (yang sudah ramping), sehingga tidak menyentuh cookie baru dari `setAll`.
4. Session hasil refresh melewati batas chunk 3180 char → **2 chunk** →
   `Set-Cookie` ±3.5 KB + header lain melebihi buffer nginx
   (`proxy_buffer_size`, default 4k/8k) → `502`.

Ini menjelaskan kenapa 502 hanya muncul **setelah idle**: saat sesi masih
segar tidak ada refresh, jadi tidak ada `Set-Cookie` baru sama sekali.

### Pengukuran (script `scripts/check-session-cookie.mjs`)

| Bentuk sesi | JSON | base64 | Chunk | Set-Cookie |
|---|---:|---:|---:|---:|
| `user-and-tokens` (v5.0.0) | 2600 | 3250 | **2** | **≈3.5 KB** |
| tanpa `identities`/`factors` | 1571 | 1571 | **1** | **≈1.6 KB** |
| `tokens-only` | 870 | 1167 | 1 | ≈1.2 KB |

Membuang `identities`/`factors` sudah cukup — **tanpa** perlu berpindah ke
`encode: 'tokens-only'` (yang berisiko karena `getSession().user` hilang di
sisi server; dipakai `app/admin/system/page.tsx`).

### Perbaikan

- **Baru** `lib/supabase/slim-session.ts` — satu sumber logika pelangsing:
  - `slimSessionValue()` membuang `provider_token`,
    `provider_refresh_token`, `user.identities`, `user.factors`.
    `user.email` dan `user_metadata` (dipakai navbar) **tetap utuh**.
  - `slimCookieWrites()` merakit ulang chunk dan mengembalikan daftar
    penulisan cookie yang sudah ramping.
  - `staleAuthCookieNames()` mengekspansi sisa chunk lama
    (`base`, `base.0`, `base.1`, …) yang tidak lagi dipakai.
- `middleware.ts` — `setAll()` kini melewati `slimCookieWrites()` **sebelum**
  menulis ke respons, jadi cookie hasil refresh tidak pernah gemuk.
  `slimAuthCookies()` tetap jalan setelah `getUser()` sebagai jaring kedua
  dan membersihkan sisa chunk era lama.
- `lib/supabase/server.ts` — `setAll()` juga memakai `slimCookieWrites()`
  (jalur Server Component / Route Handler).
- `lib/supabase/client.ts` — memakai helper yang sama (menggantikan
  `stripProviderTokens` versi lama yang hanya membuang provider token).
- **Matcher middleware** kini melewati `sw.js`, `manifest.json`,
  `workbox-*.js`, `worker-*.js`. Sebelumnya `/sw.js` ikut menjalankan
  refresh sesi — itulah kenapa error 502 juga muncul di `GET /sw.js`.
- `scripts/check-session-cookie.mjs` — regression check: gagal (exit 1)
  bila sesi kembali memakai >1 chunk atau field berat muncul lagi.

### Hasil verifikasi lokal

```text
=== CHECK SESSION COOKIE DOLPHIN ===
Sesi gemuk        : 2600 char JSON → 2 chunk
Setelah dilangsing: 1571 char → 1 chunk
Chunk basi expired: …-auth-token.0, …-auth-token.1, …-auth-token.2
Ukuran Set-Cookie : 1.63 KB
PASS: sesi muat dalam 1 chunk, email utuh, field berat dibuang.
```

### Catatan penting

Perbaikan ini menurunkan `Set-Cookie` jauh di bawah batas buffer nginx,
sehingga **tidak lagi bergantung** pada perubahan konfigurasi nginx.
Permintaan penambahan `proxy_buffer_size` ke admin hosting tetap berguna
sebagai pertahanan tambahan, tetapi bukan lagi prasyarat.

---

## 2. Audit aset (script baru, read-only)

- `scripts/audit-assets.mjs` — memindai `public/` vs source (`app`,
  `components`, `lib`, `worker`, `next.config.mjs`, `manifest.json`).
  Status: `USED`, `DYNAMIC` (folder dibaca `fs.readdirSync`), `IMPLICIT`
  (ikon/manifest), `PARTIAL`, `UNUSED`, `GENERATED`, plus deteksi
  **BROKEN REFERENCES** dan estimasi precache.
- Hasil tersimpan di `docs/patch-log/asset-audit.json`.

Temuan & perbaikan (bug nyata di production v5.0.0):

- `app/sop/[slug]/page.tsx` menyimpan `pdfPath` **tanpa** prefix `/dokumen/`
  → viewer menampilkan "Gagal memuat dokumen PDF" untuk keempat slug.
  Diperbaiki ke `/dokumen/...`.
- `components/program-studi-section.tsx` merender
  `/placeholder-kaprodi.jpg` yang **tidak ada** di `public/` (6 prodi)
  → broken image di homepage. Diperbaiki ke `/placeholder-user.jpg`.
- `app/layout.tsx` memakai `logo_dolphin.png` 1740 KB sebagai favicon
  → dialihkan ke `icon-512x512.png` + `apple-icon.png`.

---

## 3. Optimasi aset (Tahap C)

- `scripts/optimize-public-images.mjs` (sharp 0.34.5, one-shot) menghasilkan
  `.webp` baru tanpa menimpa sumber:
  - `logo_dolphin.png` 1740 KB → `logo_dolphin.webp` 74 KB (512px).
  - `banner/hero-*` 1920px q80; `gallery-*` 960px q78;
    `foto-organisasi/*` 800px; `dokumentasi/*` 800px q76.
  - Batch gambar: **7997 KB → 2383 KB (hemat 70.2%)**.
- 38 file sumber yang sudah digantikan WebP dihapus (tetap ada di git
  history; rollback = checkout dari v5.0.0).
- Referensi diperbarui di `navbar.tsx`, `footer.tsx`, `hero-section.tsx`,
  `program-studi-section.tsx`, `organisasi/page.tsx`.
- `dokumentasi-section.tsx`: prioritaskan WebP, fallback JPEG/PNG, sort
  numerik.
- `public/`: **14.48 MB (72 file) → 8.99 MB (72 file)**.

---

## 4. Pelangsing PWA (Tahap A+B)

`next.config.mjs`:

- `publicExcludes` diperluas: `dokumen`, `banner`, `dokumentasi`,
  `foto-organisasi`, `jadwal`, `gallery-*`, `hero-lab-*`, `logo_dolphin.*`,
  plus ikon/placeholder yang tidak terpakai → aset berat tidak diprecache.
- `maximumFileSizeToCacheInBytes: 2 MB`.
- `runtimeCaching` custom (menggantikan default):
  - `dolphin-next-image-v2` — SWR, 16 entri, 3 hari.
  - `dolphin-static-image-v2` — SWR, 24 entri, 3 hari.
  - `dolphin-next-static-js-v2` (CacheFirst, 64/7d),
    `dolphin-static-js-v2`, `dolphin-static-style-v2`,
    `dolphin-static-font-v2` (SWR, 7 hari).
  - `pages`, `pages-rsc`, `pages-rsc-prefetch`, `apis`, `cross-origin`
    → **NetworkOnly**.
- `worker/index.ts`: handler `activate` menghapus cache lama
  (`next-image`, `pages*`, `apis`, `static-*`, `google-fonts-*`).
  Push notification & `notificationclick` tidak berubah.
- Hasil build: precache **126 → 77 entri**, 0 aset berat, cache
  `dolphin-*-v2` + `start-url`, 5 rule NetworkOnly.

### Model offline (disetujui PM)

Aset statis (JS/CSS/font/gambar yang dilihat) di-cache terbatas untuk
kecepatan; halaman dinamis, RSC, prefetch, dan API selalu jaringan. Push
notification dan install PWA tetap berfungsi.

---

## Perubahan perilaku yang disadari user

- Sesi direfresh seperti biasa; `user.email` tetap tersedia untuk navbar dan
  dashboard. Yang dibuang hanya field yang tidak dipakai kode.
- Offline penuh halaman tidak tersedia (halaman butuh jaringan).
- Route SOP (`/sop/pemeliharaan-alat` dst.) dan kartu Program Studi kini
  menampilkan konten yang benar (sebelumnya rusak).
- Foto tetap setara secara visual (WebP q76–82).

## File yang berubah

```text
app/layout.tsx                        (metadata icon)
app/organisasi/page.tsx               (ref webp)
app/sop/[slug]/page.tsx               (bugfix pdfPath)
components/dokumentasi-section.tsx    (prioritas webp + sort)
components/footer.tsx                 (logo webp)
components/hero-section.tsx           (banner webp)
components/navbar.tsx                 (logo webp)
components/program-studi-section.tsx  (gallery webp + bugfix kaprodi)
lib/supabase/client.ts                (helper pelangsing bersama)
lib/supabase/server.ts                (helper pelangsing bersama)
lib/supabase/slim-session.ts          (BARU — inti hotfix 502)
lib/version.ts                        (5.0.1)
middleware.ts                         (slim di setAll + matcher sw.js)
next.config.mjs                       (publicExcludes + runtimeCaching)
worker/index.ts                       (activate cleanup cache lama)
scripts/audit-assets.mjs              (BARU)
scripts/optimize-public-images.mjs    (BARU)
scripts/check-session-cookie.mjs      (BARU — regression check 502)
docs/patch-log/asset-audit.json       (BARU)
docs/patch-log/5.0.1/PATCH.md         (BARU)
docs/patch-log/report.html            (bagian v5.0.1)
public/**                             (38 webp baru; 38 sumber lama dihapus)
.gitignore                            (tmp-slimtest/)
AGENTS.md                             (aturan aset + sesi)
```

## Angka kunci

| Metrik | v5.0.0 | v5.0.1 |
|---|---|---|
| `public/` total | 14.48 MB | 8.99 MB |
| Entri precache SW | 126 | 77 |
| Aset berat di precache | 12.45 MB | 0 |
| Cookie sesi (kasus 502) | 2 chunk / ±3.5 KB | **1 chunk / 1.63 KB** |
| Cache runtime gambar | 64 entri | ≤24 entri |
| Halaman dinamis/RSC/API | NetworkFirst | **NetworkOnly** |
| Gambar homepage | JPEG/PNG 7.99 MB | WebP 2.38 MB (−70%) |

## Checkpoint & status

| Checkpoint | Status | Bukti / waktu |
|---|---|---|
| LOCAL-READY (tsc + build) | PASS | `npx tsc --noEmit` ✅; `next build --webpack` ✅ (BUILD_ID `WuZKDyFdUpIQPJ9nhi8Zq`) |
| SESSION-CHECK (regression) | PASS | `node scripts/check-session-cookie.mjs` → 1 chunk |
| ASSET-AUDIT | PASS | `node scripts/audit-assets.mjs` → 0 broken reference, 11 UNUSED tercatat |
| GITHUB-BACKUP | PENDING | menunggu ACC PM |
| DEPLOYED | PENDING | menunggu ACC PM |
| MANUAL-TEST (PM) | PENDING | uji idle ±1 jam + ukur Cache Storage |

## Aset UNUSED (kandidat hapus — menunggu keputusan PM)

1.62 MB, **tidak** dihapus pada rilis ini:

- `jadwal/jadwal-tangkap.jpg` (772 KB), `jadwal/jadwal-perikanan.jpg`
  (106 KB) — sisa jadwal statis; halaman jadwal kini pakai Cloudinary.
- `hero-lab-1..4.jpg` (767 KB) — tidak direferensikan kode mana pun
  (meski sempat ikut precache pada v5.0.0).
- `placeholder.svg`, `placeholder-logo.svg`, `placeholder.jpg`,
  `icon-dark-32x32.png`, `icon-light-32x32.png` (kecil).

## Risiko & rollback

- `user.identities` dihapus dari cookie. Kode tidak memakainya (`rg
  identities` bersih); `getUser()` tetap memvalidasi ke server bila
  identitas/klaim dibutuhkan.
- Browser tanpa dukungan WebP sangat tua tidak menampilkan gambar
  (didukung semua browser modern sejak 2020).
- Rollback: `git checkout 0be3391 -- .` atau pasang ulang artefak
  `*.old-<ts>` di server.
- Offline halaman dinamis sengaja tidak tersedia.

## Pekerjaan tersisa

- Uji PM: biarkan idle ±1 jam lalu buka DOLPHIN (skenario 502) — harus 200.
- Ukur `caches.keys()` di browser (target total < 8 MB).
- Pastikan push notification + install PWA tetap berjalan.
- Keputusan PM: hapus aset UNUSED; drop `whitelist_dosen`; bersihkan
  `page - Copy.tsx`, `backup.txt`, ZIP lama di server.
- Opsional: minta admin hosting menambahkan buffer nginx per-vhost
  (pertahanan tambahan, bukan lagi prasyarat).

## Referensi GitHub

- Repository: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Commit v5.0.1: (diisi setelah commit)
- Commit v5.0.0 (dasar): `0be3391`
