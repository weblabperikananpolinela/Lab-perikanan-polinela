# Spec Desain — SEO Kanonik Polinela + Konsolidasi Duplikat Vercel

Tanggal: 2026-10-01 (WIB)
Versi target: **v5.6.0**
Klasifikasi: **architectural** (subsistem SEO baru: metadata, canonical, sitemap/robots, Open Graph, JSON-LD, noindex Vercel)
Status: **disetujui PM 1 Okt 2026** (desain chat; spec ini untuk dikunci sebelum implementasi)

## Latar belakang

Pencarian Google untuk **"lab perikanan polinela"** (dan ringkasan AI) mengangkat
`https://lab-perikanan-polinela.vercel.app/` — domain demo Vercel — bukan
kanonik produksi `https://dolphinperikanan.polinela.ac.id/`.

Akar yang sudah diverifikasi 1 Okt 2026:

| # | Temuan | Bukti |
|---|---|---|
| 1 | Dua host menyajikan HTML identik tanpa `rel="canonical"` | `<title>` + `description` sama di kedua host |
| 2 | Vercel masih hidup & boleh diindeks | `lab-perikanan-polinela.vercel.app` HTTP 200, tanpa `X-Robots-Tag` |
| 3 | Tidak ada `robots.txt` / `sitemap.xml` | Production `/robots.txt` → 404; Vercel `/robots.txt` → 404 |
| 4 | Title tidak memuat kata kunci | `DOLPHIN \| Digital Operational Laboratory…` — frasa "lab perikanan polinela" tidak ada |
| 5 | Metadata hanya di `app/layout.tsx` | 15 halaman lain tanpa `generateMetadata` / OG / JSON-LD |
| 6 | WAF Cloudflare/ModSecurity memblokir sebagian crawler | Curl UA Googlebot via CF → 403; log Apache id `1200009` memblokir UA `openai.com` di `/robots.txt` |

Keputusan PM (1 Okt 2026):

- Vercel **tetap hidup** sebagai demo, tetapi **tidak boleh diindeks**.
- Tidak ada akses dashboard Cloudflare — desain harus tahan WAF (sinyal di HTML server-render).
- Kata kunci fokus: **lab perikanan polinela** + variasi (laboratorium perikanan polinela, lab perikanan dan kelautan polinela, SOP lab perikanan polinela). Bukan per-18-lab.
- Google Search Console **belum ada** — perlu dibuat dari nol.

## Tujuan sukses

1. `<link rel="canonical">` di **semua halaman publik** menunjuk `https://dolphinperikanan.polinela.ac.id{path}` — termasuk HTML yang disajikan dari Vercel.
2. Vercel: `X-Robots-Tag: noindex, nofollow` + `robots.txt` `Disallow: /`. Manusia tetap bisa membuka demo.
3. `/robots.txt` dan `/sitemap.xml` 200 di production, berisi URL Polinela saja.
4. Title/description halaman publik memuat frasa "Lab Perikanan Polinela".
5. Search Console: properti URL-prefix bisa diverifikasi via meta tag env; sitemap bisa di-submit.
6. Ringkasan AI (opsional, di luar kendali kode): instruksi PM untuk whitelist bot AI di ModSecurity — bukan blocker rilis.

Bukan tujuan rilis ini: peringkat #1 dalam N hari, halaman landing per-lab, blog, atau mengubah Cloudflare rule (tidak ada akses).

## Keputusan

| Topik | Keputusan |
|---|---|
| Host kanonik | `https://dolphinperikanan.polinela.ac.id` (tanpa trailing slash di origin, dengan path di canonical). Tidak ada `www`. |
| Vercel | Tetap hidup. Noindex runtime (Host `*.vercel.app`) + noindex build-time jika `VERCEL=1`. Canonical tetap Polinela. |
| Kata kunci | "Lab Perikanan Polinela" di depan title; brand DOLPHIN di belakang. |
| Sitemap | Hanya rute publik yang terhubung dari navbar. `/sop/[slug]` **tidak** masuk (viewer yatim, digantikan `/dokumen/*`). |
| robots | Allow publik; Disallow `/admin`, `/dosen`, `/administrasi`, `/maintenance`, `/api`. |
| Search Console | Meta tag `google-site-verification` dari env `NEXT_PUBLIC_GSC_VERIFICATION` (boleh kosong sampai PM isi). |
| OG image | Generate sekali `public/og-image.png` 1200×630 dari `logo_dolphin.webp` + teks. |
| JSON-LD | `Organization` + `WebSite` di root layout. Tidak ada JSON-LD dinamis per dokumen. |
| Cloudflare | Tidak disentuh. Catatan PM: verified bots + ModSecurity Detection Only untuk Googlebot/Bingbot/GPTBot — opsional. |

## Arsitektur

```
                    metadataBase + canonical (selalu Polinela)
                    ┌──────────────────────────────────────┐
  Browser/crawler → │  app/layout.tsx + lib/site-seo.ts    │
                    │  generateMetadata per halaman publik │
                    └──────────────┬───────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
  app/robots.ts              app/sitemap.ts             middleware.ts
  (Allow / Disallow          (8 URL publik              X-Robots-Tag
   + cabang Vercel)           Polinela absolut)          noindex jika
                                                         Host *.vercel.app
```

Sinyal kanonik **selalu** Polinela, terlepas dari host yang menyajikan HTML.
Sinyal "jangan indeks host ini" dipasang **hanya** ketika host = Vercel.

## Konstanta (`lib/site-seo.ts` — baru)

```ts
export const SITE_ORIGIN = 'https://dolphinperikanan.polinela.ac.id';
export const SITE_NAME = 'DOLPHIN — Lab Perikanan Polinela';
export const DEFAULT_TITLE =
  'Lab Perikanan Polinela | DOLPHIN — Sistem Informasi Laboratorium Jurusan Perikanan & Kelautan';
export const DEFAULT_DESCRIPTION =
  'Lab Perikanan Polinela (Jurusan Perikanan dan Kelautan, Politeknik Negeri Lampung). Jadwal, inventaris, SOP laboratorium, SK Lab, dan layanan peminjaman alat secara daring.';
```

Helper:

- `canonicalPath(path: string): string` → origin + path dinormalisasi (`/` tidak dobel).
- `isVercelHost(host: string | null): boolean` → `host.endsWith('.vercel.app')`.
- `pageTitle(page: string): string` → `{page} | Lab Perikanan Polinela`.
- Daftar `PUBLIC_ROUTES` untuk sitemap (satu sumber).

Jangan baca `window.location` / `headers().host` untuk membangun canonical.
Jangan pakai `VERCEL_URL`. Satu-satunya origin yang boleh muncul di canonical, sitemap, OG url, dan JSON-LD `url` adalah `SITE_ORIGIN`.

## Metadata (`app/layout.tsx`)

```ts
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | Lab Perikanan Polinela',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'lab perikanan polinela',
    'laboratorium perikanan polinela',
    'lab perikanan dan kelautan polinela',
    'SOP lab perikanan polinela',
    'DOLPHIN Polinela',
  ],
  authors: [{ name: 'Jurusan Perikanan dan Kelautan Polinela' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_ORIGIN,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Lab Perikanan Polinela — DOLPHIN' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: process.env.VERCEL === '1'
    ? { index: false, follow: false }
    : { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
  // icons + manifest yang sudah ada tetap.
};
```

`html lang='id'` sudah benar — jangan diubah.

Catatan build-time: ZIP production di-build **lokal** (`VERCEL` tidak set) → `robots.index=true`. Deploy Vercel di-build di Vercel (`VERCEL=1`) → `robots.index=false` tertanam. Lapisan middleware (di bawah) menutup celah jika artefak yang sama di-upload ke Vercel tanpa rebuild.

## Metadata per halaman publik

Setiap halaman publik mengekspor `metadata` atau `generateMetadata` dengan `title` unik + `alternates.canonical` ke path-nya. Deskripsi 1–2 kalimat memuat kata kunci halaman.

| Path | Title (sebelum template) |
|---|---|
| `/` | default layout (sudah memuat "Lab Perikanan Polinela") |
| `/organisasi` | Organisasi Lab Perikanan Polinela |
| `/jadwal` | Jadwal Laboratorium Perikanan Polinela |
| `/inventaris` | Inventaris Lab Perikanan Polinela |
| `/dokumen/sop-perikanan` | SOP Lab Perikanan Polinela |
| `/dokumen/sop-tangkap` | SOP Lab Perikanan Tangkap Polinela |
| `/dokumen/sk-lab` | SK Lab Perikanan Polinela |
| `/materi` | Materi Kuliah Lab Perikanan Polinela |

Halaman auth/internal (`/admin/*`, `/dosen/*`, `/administrasi/*`, `/maintenance`):

```ts
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
```

Tidak perlu title SEO. `/sop/[slug]` (client component yatim) **tidak** diubah di rilis ini; tidak masuk sitemap; cukup dilindungi `robots.txt` `Allow` (kalau ter-crawl, canonical layout tetap Polinela — risiko rendah).

## Open Graph image

Script baru `scripts/generate-og-image.mjs` (sharp, pola sama `scripts/generate-favicons.mjs` / `optimize-public-images.mjs`):

- Kanvas 1200×630, latar `#102a43` (ink patch-log), aksen cyan.
- Logo `public/logo_dolphin.webp` di kiri/tengah.
- Teks "Lab Perikanan Polinela" + "Jurusan Perikanan & Kelautan · Politeknik Negeri Lampung".
- Output `public/og-image.png` (bukan WebP — crawler OG lebih andal dengan PNG), target ≤200 KB.
- Dijalankan sekali saat implementasi, hasil di-commit. Bukan langkah deploy rutin.

## JSON-LD

Komponen server `components/json-ld.tsx` di-render sekali di `app/layout.tsx` (dalam `<body>`, sebelum children):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://dolphinperikanan.polinela.ac.id/#org",
      "name": "Lab Perikanan Polinela",
      "alternateName": ["DOLPHIN", "Laboratorium Jurusan Perikanan dan Kelautan Polinela"],
      "url": "https://dolphinperikanan.polinela.ac.id/",
      "logo": "https://dolphinperikanan.polinela.ac.id/logo_dolphin.webp",
      "parentOrganization": {
        "@type": "CollegeOrUniversity",
        "name": "Politeknik Negeri Lampung",
        "url": "https://polinela.ac.id"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Jl. Soekarno-Hatta No. 10, Rajabasa",
        "addressLocality": "Bandar Lampung",
        "addressRegion": "Lampung",
        "postalCode": "35144",
        "addressCountry": "ID"
      },
      "email": "jurusanperikanandankelautan@polinela.ac.id",
      "sameAs": [
        "https://polinela.ac.id",
        "https://jpk.polinela.ac.id"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://dolphinperikanan.polinela.ac.id/#website",
      "url": "https://dolphinperikanan.polinela.ac.id/",
      "name": "DOLPHIN — Lab Perikanan Polinela",
      "inLanguage": "id-ID",
      "publisher": { "@id": "https://dolphinperikanan.polinela.ac.id/#org" }
    }
  ]
}
```

Tidak ada `SearchAction` (situs tidak punya pencarian publik). Tidak ada `LocalBusiness` / `openingHours` (bukan toko).

## robots.txt — `app/robots.ts`

```ts
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL === '1') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dosen', '/administrasi', '/maintenance', '/api'],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
```

Jangan taruh file statis `public/robots.txt` — Apache Plesk menyajikan `public/` **sebelum** Next, jadi file statis akan menimpa route handler dan sulit di-cabangkan per-host.

Matcher middleware saat ini **tidak** mengecualikan `robots.txt` / `sitemap.xml`. Itu aman: middleware hanya slim cookie + gerbang maintenance. Keduanya harus tetap lolos (bukan halaman HTML). **Jangan** menambah `robots.txt` ke pengecualian kecuali terbukti merusak header.

## sitemap.xml — `app/sitemap.ts`

Sumber tunggal `PUBLIC_ROUTES` di `lib/site-seo.ts`:

```
/
/organisasi
/jadwal
/inventaris
/dokumen/sop-perikanan
/dokumen/sop-tangkap
/dokumen/sk-lab
/materi
```

Setiap entri: `url: SITE_ORIGIN + path`, `changeFrequency: 'weekly'`, `priority`: home `1.0`, dokumen/organisasi `0.8`, sisanya `0.6`. `lastModified`: tanggal rilis (`APP_RELEASE_DATE`) — jangan query DB (sitemap harus murah, tanpa cookie, tahan WAF).

Tidak masuk: `/admin*`, `/dosen*`, `/administrasi*`, `/maintenance`, `/sop/[slug]`, `/api*`.

## Middleware — noindex runtime Vercel + gerbang maintenance

### a. Bypass maintenance untuk berkas SEO (WAJIB)

Gerbang maintenance saat ini me-redirect **semua** path selain `/maintenance`:

```ts
if (request.nextUrl.pathname !== '/maintenance') {
  if (await isMaintenanceModeEnabled()) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
}
```

Matcher middleware **tidak** mengecualikan `robots.txt` / `sitemap.xml`, jadi saat
maintenance ON kedua berkas itu 307 → `/maintenance`. Google membaca itu sebagai
robots.txt tidak tersedia (dan `sitemap.xml` gagal) tepat ketika situs sedang
tidak stabil. Ubah menjadi:

```ts
const SEO_FILES = new Set(['/robots.txt', '/sitemap.xml']);
if (!SEO_FILES.has(request.nextUrl.pathname) &&
    request.nextUrl.pathname !== '/maintenance') {
  if (await isMaintenanceModeEnabled()) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
}
```

Berkas SEO tetap disajikan walau situs maintenance. Halaman publik tetap
ter-redirect seperti sekarang — perilaku yang terlihat pengguna tidak berubah.

### b. `X-Robots-Tag` untuk host Vercel

Setelah `response` final dibuat, sebelum `return response`:

```ts
const host = request.headers.get('host') || '';
if (host.endsWith('.vercel.app')) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
}
```

Tidak mengubah logika maintenance / slim cookie. Tidak noindex berdasarkan IP.
Host production `dolphinperikanan.polinela.ac.id` **tidak** kena rule ini.

### c. Matcher

Jangan tambah `robots.txt` / `sitemap.xml` ke pengecualian matcher. Cookie
slimming tidak merugikan request tanpa cookie, dan mengecualikannya justru
mematikan bypass maintenance di atas serta `X-Robots-Tag` Vercel.

## Env

| Key | Wajib? | Nilai |
|---|---|---|
| `NEXT_PUBLIC_GSC_VERIFICATION` | tidak | Token meta tag Search Console. Kosong = tidak emit tag. |
| `VERCEL` | otomatis di Vercel | Cabang noindex build-time + robots Disallow. Jangan set di Plesk. |

Tidak perlu `NEXT_PUBLIC_SITE_URL` — origin di-hardcode di `lib/site-seo.ts` agar tidak salah isi env Plesk (risiko canonical mengarah localhost / Vercel). Satu sumber, tidak bisa salah konfigurasi.

## Search Console (langkah PM, bukan kode)

Setelah deploy v5.6.0:

1. Buka [Google Search Console](https://search.google.com/search-console) → tambah properti **URL prefix** `https://dolphinperikanan.polinela.ac.id/`.
2. Pilih verifikasi **HTML tag**. Salin token ke Plesk env `NEXT_PUBLIC_GSC_VERIFICATION`, rebuild + deploy (karena `NEXT_PUBLIC_*` di-inline saat build). Alternatif lebih cepat: verifikasi **DNS TXT** di zona `polinela.ac.id` (butuh admin DNS Polinela) — tidak perlu rebuild.
3. Submit sitemap `https://dolphinperikanan.polinela.ac.id/sitemap.xml`.
4. Removals → `https://lab-perikanan-polinela.vercel.app/` (temporary) **setelah** noindex Vercel terpasang. Temporary removal mempercepat hilangnya cuplikan; noindex yang menahan agar tidak kembali.
5. Opsional: properti Domain `dolphinperikanan.polinela.ac.id` via DNS TXT.

Kode menyediakan slot verifikasi; PM yang menjalankan langkah 1–4.

## Sisi Vercel (akses PM ada, demo tetap hidup)

Setelah kode v5.6.0 di `origin/master`:

1. Trigger redeploy project `lab-perikanan-polinela` di dashboard Vercel (build di Vercel → `VERCEL=1` → robots Disallow + metadata noindex).
2. Verifikasi: `curl -sI https://lab-perikanan-polinela.vercel.app/` memuat `x-robots-tag: noindex, nofollow`; `curl https://…/robots.txt` memuat `Disallow: /`; HTML tetap punya `rel="canonical" href="https://dolphinperikanan.polinela.ac.id/"`.
3. Jangan hapus project, jangan ganti domain, jangan matikan deployment — sesuai keputusan "Vercel harus tetap hidup".

## Cloudflare / ModSecurity (di luar kode, catatan PM)

Tanpa akses dashboard, rilis **tidak menunggu** perubahan WAF.

Fakta: Cloudflare biasanya **loloskan Googlebot asli** (IP Google terverifikasi). 403 yang kita ukur adalah curl dengan UA palsu — Cloudflare benar menantangnya. Risiko nyata lebih ke **bot AI** (GPTBot dll.) yang di-blokir ModSecurity id `1200009` — itu sebab ringkasan AI mengutip Vercel (tanpa WAF).

Instruksi opsional PM/hosting:

- Cloudflare → Security → Bots: izinkan Verified Bots.
- Plesk ModSecurity: rule `1200009` Detection Only, atau whitelist UA `Googlebot|Bingbot|GPTBot|ClaudeBot|PerplexityBot` khusus vhost ini.
- Jangan matikan WAF global.

Ini **bukan** blocker v5.6.0.

## File yang berubah

| File | Aksi |
|---|---|
| `lib/site-seo.ts` | baru — konstanta + helper + `PUBLIC_ROUTES` |
| `app/layout.tsx` | metadata lengkap, JSON-LD, GSC slot |
| `app/robots.ts` | baru |
| `app/sitemap.ts` | baru |
| `components/json-ld.tsx` | baru |
| `middleware.ts` | `X-Robots-Tag` jika Host `*.vercel.app`; bypass maintenance untuk berkas SEO |
| `app/organisasi/page.tsx` | `export const metadata` |
| `app/jadwal/page.tsx` | `export const metadata` |
| `app/inventaris/page.tsx` | `export const metadata` |
| `app/dokumen/sop-perikanan/page.tsx` | `export const metadata` |
| `app/dokumen/sop-tangkap/page.tsx` | `export const metadata` |
| `app/dokumen/sk-lab/page.tsx` | `export const metadata` |
| `app/materi/layout.tsx` | baru — `export const metadata` |
| `app/admin/layout.tsx` | baru — `robots: noindex` |
| `app/dosen/layout.tsx` | baru — `robots: noindex` |
| `app/administrasi/layout.tsx` | baru — `robots: noindex` |
| `app/maintenance/layout.tsx` | baru — `robots: noindex` |
| `app/jadwal/layout.tsx` | baru — `export const metadata` |
| `app/inventaris/layout.tsx` | baru — `export const metadata` |
| `middleware.ts` | bypass maintenance untuk `/robots.txt` + `/sitemap.xml`; `X-Robots-Tag` jika Host `*.vercel.app` |
| `scripts/generate-og-image.mjs` | baru, jalankan sekali |
| `public/og-image.png` | hasil generate, di-commit |
| `lib/version.ts` | `5.6.0`, tanggal rilis |
| `docs/patch-log/5.6.0/PATCH.md` | baru |
| `docs/patch-log/report.html` | tambah bagian v5.6.0 |

Tidak diubah: PWA cache, cookie slim, RLS, Cloudinary, CMS dokumen v5.5.0, `next.config.mjs` (kecuali terbukti `robots.ts` tidak tersaji — jangan spekulasi).

Halaman `'use client'` yang mengekspor `metadata` **tidak sah** di App Router. Untuk file client (`jadwal`, `inventaris`, `materi`, admin, dosen, administrasi, maintenance): tambahkan `layout.tsx` **server** di segmen itu yang mengekspor `metadata`. Belum ada satu pun layout segmen di repo ini — semuanya baru. `page.tsx` tidak disentuh (tetap `'use client'`), sehingga diff minimal dan tidak ada pemindahan komponen.

Pola seragam untuk tujuh segmen (semua layout baru berisi satu `metadata` saja):

| Layout baru | Mengatur |
|---|---|
| `app/jadwal/layout.tsx` | title + canonical `/jadwal` |
| `app/inventaris/layout.tsx` | title + canonical `/inventaris` |
| `app/materi/layout.tsx` | title + canonical `/materi` |
| `app/admin/layout.tsx` | `robots: noindex, nofollow` untuk seluruh `/admin/*` |
| `app/dosen/layout.tsx` | `robots: noindex, nofollow` |
| `app/administrasi/layout.tsx` | `robots: noindex, nofollow` |
| `app/maintenance/layout.tsx` | `robots: noindex, nofollow` |

Halaman dokumen dan organisasi (sudah Server Component) cukup `export const metadata` di `page.tsx` — tidak perlu layout baru.

Tidak ada halaman di rilis ini yang mempertahankan `page.tsx` client + `generateMetadata`; jangan pindahkan `'use client'` ke layout (itu akan membuat seluruh route jadi client-rendered).

## Verifikasi (lokal, sebelum deploy)

```
curl -s http://localhost:3000/ | grep -E 'canonical|og:title|application/ld\+json|google-site-verification'
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml
```

Syarat lulus:

- `rel="canonical" href="https://dolphinperikanan.polinela.ac.id/"` (bukan localhost).
- `<title>` memuat "Lab Perikanan Polinela".
- `og:image` mengarah ke origin Polinela + `/og-image.png`.
- JSON-LD parseable (`@graph` Organization + WebSite).
- `robots.txt` Allow `/`, Disallow admin/dosen/administrasi/maintenance/api, Sitemap URL Polinela.
- `sitemap.xml` tepat 8 URL, semua origin Polinela, tidak ada `/admin` atau `/sop/`.

Uji maintenance (khusus perubahan middleware): set `maintenance_mode = true` di
`app_settings`, tunggu ≤30 detik cache, lalu pastikan `/` → 307 `/maintenance`
tetapi `/robots.txt` dan `/sitemap.xml` tetap **200**. Kembalikan ke `false`
setelah uji.

Setelah deploy production (origin bypass CF, pola v5.5.0):

- `/` 200, footer `DOLPHIN System v5.6.0`.
- `/robots.txt` 200, `/sitemap.xml` 200.
- Setelah redeploy Vercel: header `x-robots-tag: noindex, nofollow` + robots `Disallow: /`.

## Risiko & rollback

| Risiko | Mitigasi |
|---|---|
| Canonical salah arah ke localhost karena env | Origin di-hardcode, bukan env |
| `public/robots.txt` menimpa route | Tidak membuat file statis |
| Halaman client tidak bisa `export const metadata` | Pakai `layout.tsx` segmen |
| Google butuh minggu untuk pindah cuplikan | Noindex Vercel + Removals Search Console; ekspektasi 1–4 minggu, bukan instan |
| WAF blokir Googlebot palsu kita saat uji | Uji origin langsung (Host header ke IP), bukan via CF dengan UA palsu |
| Maintenance ON membuat `robots.txt` ter-redirect | Bypass eksplisit `/robots.txt` + `/sitemap.xml` di gerbang maintenance (diuji saat maintenance ON) |
| `NEXT_PUBLIC_GSC_VERIFICATION` kosong saat rilis | Sah; tag tidak ter-emit sampai PM isi + rebuild |
| Middleware `X-Robots-Tag` mengenai production | Hanya jika Host `*.vercel.app` — production host tidak match |

Rollback kode: `git revert` commit v5.6.0 + deploy ZIP sebelumnya (`httpdocs.old-deploy-*`). Tidak ada migrasi DB.

## Di luar cakupan

- Menghapus atau mem-pause project Vercel.
- Mengubah rule Cloudflare / ModSecurity (tidak ada akses).
- Halaman SEO per-18-lab.
- Blog / artikel.
- `hreflang` (hanya `id`).
- Google Analytics / Tag Manager (Analytics Vercel tetap hanya jika `VERCEL=1`).
- Mengubah `/sop/[slug]` atau menghapusnya.

## Urutan implementasi (setelah spec di-ACC)

1. `lib/site-seo.ts` + `scripts/generate-og-image.mjs` → `public/og-image.png`.
2. `app/layout.tsx` metadata + `components/json-ld.tsx`.
3. `app/robots.ts` + `app/sitemap.ts`.
4. Layout metadata segmen publik + layout `noindex` segmen internal.
5. Middleware: bypass maintenance berkas SEO + `X-Robots-Tag` Vercel.
6. `lib/version.ts` 5.6.0 + PATCH + report.html.
7. `tsc --noEmit` + `npm run build` + curl lokal (termasuk uji maintenance).
8. Commit / push / deploy Polinela (butuh ACC PM, pola v5.5.0).
9. Redeploy Vercel + checklist noindex.
10. PM: Search Console + submit sitemap.

Tidak ada perubahan skema Supabase. Skill `supabase` tidak dipicu.
