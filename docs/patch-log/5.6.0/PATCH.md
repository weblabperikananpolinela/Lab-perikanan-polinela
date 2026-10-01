# PATCH v5.6.0 — SEO kanonik Polinela + noindex demo Vercel

Tanggal: 2026-10-01 (WIB)
Status versi: `minor` dari `5.5.0` (subsistem SEO baru; tanpa perubahan database).
Spesifikasi: `docs/superpowers/specs/2026-10-01-seo-kanonik-polikonsolidasi-design.md` —
disetujui PM 1 Okt 2026.

## Masalah yang diselesaikan

Pencarian Google (dan ringkasan AI) untuk **"lab perikanan polinela"** mengangkat
domain demo `https://lab-perikanan-polinela.vercel.app/`, bukan kanonik
`https://dolphinperikanan.polinela.ac.id/`.

Akar yang diverifikasi 1 Okt 2026:

1. Dua host menyajikan HTML identik **tanpa** `rel="canonical"`.
2. Vercel masih hidup & boleh diindeks (tanpa `X-Robots-Tag`).
3. `/robots.txt` dan `/sitemap.xml` **404** di kedua host.
4. `<title>` tidak memuat frasa "lab perikanan polinela".
5. Metadata hanya ada di `app/layout.tsx`; 15 halaman lain tanpa metadata.
6. WAF (Cloudflare + ModSecurity id `1200009`) memblokir sebagian crawler/bot AI.

## Ringkasan perubahan

1. **Canonical tunggal.** Semua halaman publik mengarah ke
   `https://dolphinperikanan.polinela.ac.id{path}` — termasuk HTML yang disajikan
   dari Vercel. Origin di-**hardcode** di `lib/site-seo.ts` (bukan env) supaya
   tidak bisa salah konfigurasi ke localhost/Vercel.
2. **Metadata kata kunci.** Title default memuat "Lab Perikanan Polinela";
   description menyebut laboratorium, jurusan, dan Polinela. Setiap halaman publik
   punya title unik + canonical sendiri.
3. **robots.txt + sitemap.xml** via route handler (bukan file statis `public/`,
   yang akan ditimpa Apache Plesk). Sitemap berisi 8 URL publik.
4. **Open Graph + Twitter Card** + `public/og-image.png` (1200×630, 137 KB)
   untuk cuplikan sosial & ringkasan AI.
5. **JSON-LD** `Organization` + `WebSite` (alamat, parentOrganization Polinela,
   `sameAs`) dirender di HTML awal (server component, tanpa JS).
6. **Noindex demo Vercel** dua lapis: build-time (`VERCEL=1` → `robots.index=false`
   + robots `Disallow: /`) dan runtime (`X-Robots-Tag: noindex, nofollow` untuk
   Host `*.vercel.app`). Demo tetap hidup untuk manusia.
7. **Perbaikan bug maintenance.** Gerbang maintenance me-redirect **semua** path
   (matcher tidak mengecualikan berkas SEO), sehingga saat maintenance ON
   `robots.txt`/`sitemap.xml` ikut 307 → `/maintenance`. Kini keduanya dikecualikan
   dan tetap 200.

## Perubahan Kode

| Area | Detail |
|---|---|
| `lib/site-seo.ts` (baru) | `SITE_ORIGIN` hardcode, `SITE_NAME`, `DEFAULT_TITLE/DESCRIPTION`, `SITE_KEYWORDS`, `OG_IMAGE`, `PUBLIC_ROUTES` (8 rute), `SEO_FILE_PATHS`, helper `canonicalUrl`, `isVercelHost`, `pageTitle`, `pageMetadata`. |
| `components/json-ld.tsx` (baru) | JSON-LD Organization + WebSite, server component. |
| `app/layout.tsx` | `metadataBase`, title template, keywords, `alternates.canonical`, Open Graph, Twitter, `robots` (cabang `VERCEL`), `verification` (GSC), `<JsonLd />`. |
| `app/robots.ts` (baru) | Allow `/` + Disallow internal; cabang Vercel `Disallow: /`; `sitemap` + `host`. |
| `app/sitemap.ts` (baru) | 8 URL absolut Polinela; `lastModified` dari `APP_RELEASE_DATE` (tanpa DB). |
| `middleware.ts` | Bypass maintenance untuk `/robots.txt` + `/sitemap.xml`; `X-Robots-Tag` bila Host `*.vercel.app`. |
| `app/jadwal/layout.tsx` (baru) | Metadata title + canonical `/jadwal`. |
| `app/inventaris/layout.tsx` (baru) | Metadata title + canonical `/inventaris`. |
| `app/materi/layout.tsx` (baru) | Metadata title + canonical `/materi`. |
| `app/admin/layout.tsx` (baru) | `robots: noindex, nofollow`. |
| `app/dosen/layout.tsx` (baru) | `robots: noindex, nofollow`. |
| `app/administrasi/layout.tsx` (baru) | `robots: noindex, nofollow`. |
| `app/maintenance/layout.tsx` (baru) | `robots: noindex, nofollow`. |
| `app/dokumen/{sop-perikanan,sop-tangkap,sk-lab}/page.tsx` | `export const metadata` (title kata kunci + canonical). |
| `app/organisasi/page.tsx` | `export const metadata` (title + canonical). |
| `scripts/generate-og-image.mjs` (baru) | Generator OG 1200×630 dari `logo_dolphin.webp` (sharp). |
| `public/og-image.png` (baru) | Hasil generate, 137 KB. |
| `lib/version.ts` | `5.6.0`, tanggal `2026-10-01`. |

Layout segmen dipakai (bukan `page.tsx`) untuk halaman `'use client'` karena
App Router tidak mengizinkan `export const metadata` di client component.

## Verifikasi (lokal)

- `node node_modules/typescript/bin/tsc --noEmit` → EXIT=0.
- `npm run build` → `robots.txt` + `sitemap.xml` static; 3 rute dokumen ISR 5m.
- Server lokal (`node .next/standalone/server.js`, port 3099):

| Uji | Hasil |
|---|---|
| `<title>` home | `Lab Perikanan Polinela \| DOLPHIN — Sistem Informasi…` |
| `rel="canonical"` home | `https://dolphinperikanan.polinela.ac.id` |
| canonical `/dokumen/sk-lab` | `…/dokumen/sk-lab` + title `SK Lab Perikanan Polinela` |
| canonical `/jadwal` | `…/jadwal` + title `Jadwal Laboratorium Perikanan Polinela` |
| `og:image` | `https://dolphinperikanan.polinela.ac.id/og-image.png` |
| `twitter:card` | `summary_large_image` |
| JSON-LD | `@graph` Organization + CollegeOrUniversity + PostalAddress + WebSite |
| `/robots.txt` | Allow `/`, Disallow 5 path internal, Host + Sitemap Polinela |
| `/sitemap.xml` | 8 URL Polinela (priority 1.0/0.8/0.6) |
| `/admin/system` meta | `noindex, nofollow` |
| Host Vercel → header | `x-robots-tag: noindex, nofollow` |
| Host Polinela → header | **tidak ada** `x-robots-tag` |
| `/og-image.png` | 200 · 140.669 byte |
| Maintenance ON: `/` | 307 → `/maintenance` |
| Maintenance ON: `/robots.txt` | **200** (bypass bekerja) |
| Maintenance ON: `/sitemap.xml` | **200** (bypass bekerja) |

`maintenance_mode` dikembalikan ke `false` setelah uji.

## Checkpoint & status

| Checkpoint | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | tsc EXIT=0 + build; verifikasi curl 15/15 sesuai |
| GITHUB-BACKUP | PASS | commit `4a381e7` (lihat log) |
| DEPLOYED | PENDING | menunggu deploy ZIP |
| VERCEL-NOINDEX | PENDING | menunggu redeploy Vercel |
| MANUAL-TEST (PM) | PENDING | menunggu uji PM |

## Langkah PM setelah deploy

1. **Google Search Console** (belum ada properti):
   - Tambah properti URL-prefix `https://dolphinperikanan.polinela.ac.id/`.
   - Verifikasi via **HTML tag** → salin token ke Plesk env
     `NEXT_PUBLIC_GSC_VERIFICATION`, rebuild + deploy; **atau** verifikasi DNS TXT
     (tanpa rebuild, butuh admin DNS Polinela).
   - Submit sitemap `https://dolphinperikanan.polinela.ac.id/sitemap.xml`.
2. **Vercel**: trigger redeploy project `lab-perikanan-polinela` (build di Vercel
   → `VERCEL=1`). Verifikasi `curl -sI https://lab-perikanan-polinela.vercel.app/`
   memuat `x-robots-tag: noindex, nofollow` dan `/robots.txt` memuat `Disallow: /`.
3. **Search Console → Removals**: ajukan penghapusan URL Vercel (setelah noindex
   terpasang) untuk mempercepat hilangnya cuplikan.
4. **Opsional (hosting/Cloudflare)**: izinkan Verified Bots di Cloudflare dan
   jadikan ModSecurity rule `1200009` Detection Only / whitelist UA
   `Googlebot|Bingbot|GPTBot|ClaudeBot|PerplexityBot`. Bukan blocker.

Ekspektasi: Google memindahkan cuplikan dalam **1–4 minggu** setelah noindex +
removal + sitemap terpasang. Tidak instan.

## Rollback

- Kode: `git revert 4a381e7` + build/deploy ulang, atau kembalikan
  `httpdocs.old-deploy-*` lalu `touch httpdocs/tmp/restart.txt`.
- Vercel: redeploy dari commit sebelumnya.
- Tidak ada perubahan database / RLS / Cloudinary.

## Referensi

- Repo: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Spec: `docs/superpowers/specs/2026-10-01-seo-kanonik-polikonsolidasi-design.md`
