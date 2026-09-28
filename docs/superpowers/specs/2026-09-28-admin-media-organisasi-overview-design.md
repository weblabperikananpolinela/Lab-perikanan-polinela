# Desain: Manajemen Media (Hero/Dokumentasi/Organisasi) + Panel Overview System Admin — v5.3.0

Tanggal: 2026-09-28
Status: SPEC (menunggu review PM) — disetujui lewat sesi brainstorming (Pendekatan A, Opsi A hero)
Target versi: `5.3.0` (feature bump)

---

## 1. Konteks & Tujuan

Saat ini seluruh foto publik bersifat **hard-code/hard-file**:

| Lokasi | Sumber saat ini | Masalah |
|---|---|---|
| Hero beranda (4 foto) | `public/banner/hero-*.webp` + array hardcode `hero-section.tsx` | Ganti foto = deploy ulang |
| Marquee dokumentasi (13 foto) | `public/dokumentasi/*.webp` dibaca `fs.readdirSync` | PJ lab tidak bisa menambah foto |
| Struktur organisasi (3 pimpinan + 18 PJ) | Hardcode `app/organisasi/page.tsx` (nama/role/foto) | Edit = ubah kode |
| Panel system admin | Hanya Manajemen Akun + daftar lab | Tidak ada overview operasional |

Tujuan v5.3.0:

1. **Hero** — hanya system admin yang upload/ganti/urutkan (maks 4, carousel).
2. **Dokumentasi** — PJ lab upload foto → langsung tampil; system admin bisa toggle `is_visible` (kurasi) + hapus.
3. **Organisasi** — tab khusus: 3 pimpinan (Kajur/2 Kalab: nama, email, foto) + 18 PJ per lab (nama, email, foto).
4. **Panel overview system admin** — pengunjung (first-party), status DB, kuota Cloudinary, antrian pengajuan, jumlah lab/admin, toggle maintenance.
5. **Hardening keamanan** — menutup 5 lubang temuan audit (lihat §8) agar aman dari pentest.

## 2. Non-Goals (diluar rilis ini)

- CMS foto program studi/kaprodi (`program-studi-section.tsx` tetap hardcode).
- Migrasi `labMap` 18 lab dari kode ke tabel (tetap hardcode, sudah sinkron dengan DB).
- Cloudflare Analytics API, Google Analytics.
- Approval workflow untuk dokumentasi (langsung tampil, sesuai keputusan PM).
- Migrasi DB dari Supabase ke hosting sendiri.

## 3. Keputusan Terverifikasi PM

| # | Keputusan | Sumber |
|---|---|---|
| 1 | Upload tetap via **Cloudinary** (unsigned preset) | Jawaban klarifikasi 1 |
| 2 | Organisasi 18 PJ = **kolom `laboratorium.pj_*`** (Opsi C, tanpa FK whitelist_admin) | Jawaban klarifikasi 2 |
| 3 | Hero = **hanya system admin** upload; dokumentasi = PJ upload langsung tampil, admin kurasi `is_visible` | Jawaban klarifikasi 3 |
| 4 | Metrik overview = rekomendasi saya + **statistik pengunjung first-party** | Jawaban klarifikasi 4 |
| 5 | Pendekatan **A** (tabel khusus + app_settings + Cloudinary) | ACC eksplisit |
| 6 | Hero dinamis via **Opsi A** (server component fetch + fallback file lokal) | ACC eksplisit |
| 7 | **Keamanan anti-pentest wajib** — hardening menyertahi lubang lama | Catatan PM |

## 4. Arsitektur

```
Publik                          Admin Lab (PJ)                System Admin
──────                          ───────────────                ────────────
hero-section (server comp)      /admin/dashboard?lab_id=N      /admin/system
  ↳ app_settings.hero_banners     tab Dokumentasi:               tab Hero & Organisasi
organisasi page                    upload/hapus sendiri           ↳ app_settings hero/pimpinan
  ↳ laboratorium.pj_* +            (RLS lab-scoped)              ↳ laboratorium.pj_* editor
    app_settings.pimpinan        (tab baru, pola KelolaJadwal)  tab Dokumentasi
dokumentasi-section                                             ↳ toggle is_visible, hapus semua
  ↳ dokumentasi_foto                                           tab Overview (kartu status)
(is_visible=true)                                              ↳ page_views, DB, Cloudinary, antrean
```

- Semua foto tersimpan di Cloudinary (URL `secure_url` di DB), pola persis `jadwal_lab`/`materi_dosen`.
- Hero beranda: `app/page.tsx` → server component membaca `app_settings.hero_banners` → pass prop ke `HeroSection` (client, carousel tetap). Fallback: 4 file `public/banner/hero-*.webp` saat key kosong/fetch gagal.
- Dokumentasi: `DokumentasiSection` berubah dari `fs.readdirSync` → query `dokumentasi_foto` (server-side) `is_visible=true`. Fallback: 2 foto default lama.
- Organisasi: 3 pimpinan dari `app_settings.organisasi_pimpinan`; 18 PJ dari `laboratorium.pj_*`. Fallback: data hardcode lama.

## 5. Skema DB & RLS (final)

### 5.1 Tabel baru `dokumentasi_foto`

```sql
create table public.dokumentasi_foto (
  id          serial primary key,
  lab_id      integer references public.laboratorium(id) on delete cascade,
  file_url    text not null,
  file_type   varchar(10),
  is_visible  boolean not null default true,
  uploaded_by varchar(254) not null,
  created_at  timestamptz not null default now()
);
create index dokumentasi_foto_visible_idx on public.dokumentasi_foto (is_visible, created_at desc);
alter table public.dokumentasi_foto enable row level security;
```

Policies (pola EXISTS whitelist_admin yang sudah terbukti):

| Policy | Role | Rule |
|---|---|---|
| Publik lihat foto tampil | anon | `SELECT` where `is_visible = true` |
| Admin lab kelola foto lab-nya | authenticated | `ALL` where `EXISTS (whitelist_admin.email = auth.jwt()->>'email' AND whitelist_admin.lab_id = dokumentasi_foto.lab_id)` |
| System admin full | authenticated | `ALL` where `email = 'dolphinperikanan@polinela.ac.id'` (pola hardcode anti-recursion) |
| Uploader hapus/ubah miliknya | authenticated | `UPDATE/DELETE` where `uploaded_by = auth.jwt()->>'email'` (beririsan; OR) |

Catatan: `lab_id` nullable hanya untuk upload oleh system admin tanpa lab; policy admin-lab otomatis tidak cocok untuk null, system admin policy yang menangkap.

### 5.2 Kolom baru `laboratorium` (18 PJ)

```sql
alter table public.laboratorium
  add column if not exists pj_nama text,
  add column if not exists pj_email text,
  add column if not exists pj_foto_url text;
```

RLS: tidak berubah — SELECT public (sudah ada), UPDATE hanya system admin (sudah ada). Seeding awal: isi `pj_nama` dari hardcode `app/organisasi/page.tsx` (data sama, migrasi data, bukan data baru).

### 5.3 Kunci `app_settings` baru

| key | value (jsonb) | Contoh |
|---|---|---|
| `hero_banners` | array `[{url, alt}]`, maks 4, urutan = urutan carousel | `[{"url":"https://res.cloudinary.com/.../hero-a.jpg","alt":"Lab Budidaya"}]` |
| `organisasi_pimpinan` | array 3 `[{jabatan, nama, email, foto_url}]` | Kajur, Kalab Perikanan, Kalab Tangkap |

### 5.4 Tabel `page_views` + RPC (pengunjung first-party)

```sql
create table public.page_views (
  day      date not null,
  path     text not null,
  views    integer not null default 0,
  visitors integer not null default 0,
  primary key (day, path)
);
alter table public.page_views enable row level security;
-- Tidak ada policy SELECT untuk anon/authenticated → hanya owner/service
-- Policy SELECT utk system_admin via email hardcode; INSERT/UPDATE tidak
-- diberikan lewat REST sama sekali (hanya lewat RPC di bawah).
```

RPC (pola `materi_public_by_pin` — SECURITY DEFINER, `search_path=''`, nama fully-qualified):

```sql
create or replace function public.record_pageview(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Validasi: hanya path publik sederhana, tanpa query string
  if p_path !~ '^/[a-z0-9/_-]{1,80}$' or p_path like '/api/%' or p_path like '/admin/%' then
    return;
  end if;
  insert into public.page_views (day, path, views, visitors)
  values (current_date, p_path, 1, 1)
  on conflict (day, path)
  do update set views = public.page_views.views + 1;
end;
$$;
revoke all on function public.record_pageview(text) from authenticated;
grant execute on function public.record_pageview(text) to anon;
```

`visitors` di-increment hanya pada baris baru hari itu (approx); jika PM ingin unique-visitor lebih akurat nanti bisa ditingkatkan — dicatat sebagai keterbatasan v1. Tidak ada PII yang disimpan (tidak ada IP/hash di DB).

### 5.5 Revoke fungsi utilitas lama

```sql
revoke execute on function public.rls_auto_enable() from anon, authenticated;
```

(Menutup WARN advisor: utilitas SECURITY DEFINER lama terbuka untuk anon.)

## 6. UI / Komponen

### 6.1 `/admin/system` — sidebar +3 tab

| Tab | Komponen baru | Isi |
|---|---|---|
| Overview | `OverviewAdminTab.tsx` | 6 kartu (§7) |
| Hero & Organisasi | `HeroOrganisasiTab.tsx` | Grid hero (upload/ganti/hapus/urutkan maks 4) + editor 3 pimpinan + editor 18 PJ (nama/email/foto per lab) |
| Dokumentasi | `DokumentasiAdminTab.tsx` | Semua foto semua lab: toggle `is_visible`, hapus (juga hapus file Cloudinary) |

Struktur sidebar diubah: `'akun' | 'labs' | 'hero-org' | 'dokumentasi' | 'overview'`. Overview jadi tab default? Tidak — default tetap 'akun' (tidak mengubah kebiasaan lama); overview hanya baru dipilih.

### 6.2 `/admin/dashboard?lab_id=N` — tab Dokumentasi baru

Komponen `DokumentasiLabTab.tsx` (pola `KelolaJadwal`):
- Upload: 1 file (accept `image/jpeg,image/png,image/webp`, maks 5 MB di sisi klien) → Cloudinary preset `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_DOKUMENTASI` → INSERT `{lab_id, file_url, file_type, is_visible: true, uploaded_by: session.email}`.
- Grid foto milik lab: hapus hanya bila `uploaded_by === session.email` ATAU role admin lab (policy RLS yang memutuskan; UI menyembunyikan tombol untuk non-Owner non-admin).
- System admin membuka tab yang sama via `?lab_id=` (fitur lama) dan melihat semua + bisa hapus semua.

### 6.3 Hero & Organisasi editor

- Hero: tombol upload hanya aktif untuk system_admin (halaman ini sendiri sudah kunci system_admin via check `whitelist_admin.role = 'system_admin'`); upload → Cloudinary preset `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_HERO` → push URL ke array `hero_banners` (maks 4; tombol naik/turun untuk urutan; hapus = keluarkan dari array + best-effort destroy Cloudinary).
- Pimpinan: form 3 baris (jabatan readonly: Kajur, Kalab Perikanan, Kalab Tangkap; nama + email + foto editable; upload foto → Cloudinary → ganti `foto_url`).
- PJ: tabel 18 lab (dropdown pilih lab) → edit `pj_nama`, `pj_email`, `pj_foto_url` (upload foto sama seperti hero).

### 6.4 Halaman publik

- `components/hero-section.tsx`: menerima prop `images: {url, alt}[]`; fallback default `heroImages` lama bila prop kosong. `app/page.tsx` menjadi server component yang membaca `app_settings.hero_banners` (Supabase server client, `next: { revalidate: 300 }`).
- `components/dokumentasi-section.tsx`: ganti `fs.readdirSync` → query `dokumentasi_foto` `is_visible=true` order `created_at desc` (server-side); fallback 2 foto lama bila kosong/gagal.
- `app/organisasi/page.tsx`: ganti hardcode → fetch `laboratorium.pj_*` + `app_settings.organisasi_pimpinan`; fallback data hardcode lama.

## 7. Panel Overview (kartu status)

Kartu (client component, data via supabase client + 1 route handler):

1. **Pengunjung**: total hari ini + 7 hari + top-5 path (dari `page_views`, SELECT policy system_admin). Mini bar chart (recharts, sudah terpasang).
2. **Status DB**: route handler `/api/admin/health` — ping latency `select 1` + row count `peminjaman`, `materi_dosen`, `dokumentasi_foto` (head count). Hanya angka yang dikirim ke klien.
3. **Kuota Cloudinary**: route handler `/api/admin/health` memanggil `cloudinary.api.usage()` (api_secret server-side, tidak pernah ke browser) → kirim `{usedBytes, planLimitBytes, percent}`.
4. **Antrean pengajuan**: count `peminjaman` status `menunggu` semua lab (query existing OverviewTab, di-scope semua).
5. **Jumlah lab + admin**: count `laboratorium` + count `whitelist_admin`.
6. **Maintenance**: toggle baca/tulis `app_settings.maintenance_mode` (UI saja; mekanisme middleware sudah ada).

## 8. Keamanan & Anti-Pentest (wajib, temuan audit nyata)

### 8.1 Lubang yang ditemukan (kode saat ini) dan penutupannya

| # | Temuan | Severity | Perbaikan di v5.3.0 |
|---|---|---|---|
| K1 | `/api/delete-cloudinary` tanpa auth: siapa pun POST URL → file Cloudinary dihapus | **KRITIS** | Route memverifikasi sesi (server client) + verifikasi URL benar-benar milik row yang boleh dihapus user (dokumentasi_foto/jadwal_lab/materi_dosen sesuai RLS user) sebelum `destroy`. 403 bila tidak. |
| K2 | `/api/send-email` tanpa auth + HTML injection (`data.*` diinterpolasi mentah) | **KRITIS** (spam relay/XSS email) | Wajib sesi whitelist_admin; field `data` di-escape sebelum render HTML; rate-limit sederhana (log + max 20 email/jam/IP via tabel atau env in-memory). |
| K3 | `/api/send-notification` tanpa auth: broadcast push ke semua subscriber | **KRITIS** | Wajib sesi whitelist_admin (role admin/system_admin); payload divalidasi (title/message max 200 char). |
| K4 | RLS `push_subscriptions` **tidak di-enable** padahal policy ada (advisor ERROR) | **KRITIS** | `alter table public.push_subscriptions enable row level security;` → policy INSERT anon tetap, SELECT `false` tetap, tanpa policy UPDATE/DELETE (default deny). |
| K5 | `app_settings` UPDATE oleh SEMUA admin lab (maintenance/hero bisa diubah admin lab mana pun) | **HIGH** | Policy UPDATE/INSERT/DELETE hanya system_admin (email hardcode); SELECT public tetap (middleware perlu baca maintenance; konten hero/pimpinan memang publik). Aturan: **jangan pernah simpan rahasia di app_settings**. |
| K6 | `rls_auto_enable()` SECURITY DEFINER bisa dieksekusi anon | MEDIUM | `revoke execute from anon, authenticated` (§5.5). |
| K7 | Leaked password protection disabled (advisor WARN) | LOW | Aktifkan di dashboard Supabase (Auth settings) — item checklist PM. |

### 8.2 Keamanan fitur baru (by design)

| Area | Kontrol |
|---|---|
| Upload presets | Preset Cloudinary baru (`_HERO`, `_DOKUMENTASI`) dikonfigurasi: allowed formats jpg/png/webp, max 5 MB, folder dipin (`hero/`, `dokumentasi/`). Unsigned preset = risiko diterima (sama seperti materi/jadwal) dengan batasan format+ukuran. |
| URL foto di DB | Sebelum render/disimpan: validasi `startsWith('https://res.cloudinary.com/<cloud>/')` → mencegah `javascript:` URL masuk DOM walau DB bocor. |
| Alt text hero | Max 120 char, React escaping default (tidak `dangerouslySetInnerHTML` di jalur baru). |
| `record_pageview` | Path divalidasi regex (tanpa query/param), `/api/*` & `/admin/*` ditolak, anon-only, SECURITY DEFINER + `search_path=''` (pola `materi_public_by_pin`); tidak ada PII (IP tidak disimpan). |
| Row-bloat spam | 1 row per (day, path); path max 80 char; growth ~ terbatas jumlah route unik. Retensi: `delete from page_views where day < current_date - 90` via pg_cron (opsional, default: manual saat bersih-bersih). |
| Overview route | `/api/admin/health` memverifikasi sesi system_admin sebelum menjalankan usage/DB check; rahasia (api_secret) tidak pernah dikirim ke klien. |
| Storage | Hapus foto = destroy Cloudinary + DELETE row (best-effort destroy, row tetap dihapus — tidak ada foto yatim di UI). |
| XSS client | Semua data DB dirender lewat JSX (auto-escape); tidak ada `dangerouslySetInnerHTML` baru. |
| CSRF | Semua mutasi via Supabase client (bearer JWT dari cookie httpOnly SameSite=Lax) — pola yang sudah ada; API route baru memakai sesi server-side, bukan body trust. |

### 8.3 Item untuk pentest eksternal (checklist PM, di luar kode)

- Uji coba manual: kirim POST ke 3 API route tanpa sesi (harus 401/403); coba hapus URL Cloudinary milik orang lain (harus 403).
- Setelah deploy: jalankan `supabase_get_advisors` security → target 0 ERROR.
- Opsional: Cloudflare WAF rate-limiting untuk `/api/*`.

## 9. Error Handling

| Kasus | Penanganan |
|---|---|
| Preset ENV tidak ada | `Swal` error (pola KelolaJadwal); upload tidak jalan |
| Cloudinary gagal | `Swal` error; DB tidak ditulis (insert hanya setelah secure_url didapat) |
| Destroy Cloudinary gagal saat delete | `console.warn` + row DB tetap dihapus (pola materi) |
| `hero_banners` kosong/gagal fetch | Fallback 4 foto `public/banner/hero-*.webp` |
| `dokumentasi_foto` kosong/gagal | Fallback 2 foto default lama |
| `organisasi_pimpinan`/`pj_*` kosong | Fallback data hardcode lama |
| Beacon pageview gagal | Fire-and-forget (tidak di-await penuh; failure tidak mengganggu render) |
| Overview card gagal fetch | Kartu menampilkan "—" + tooltip error; tidak crash panel |

## 10. Testing

1. `npx tsc --noEmit` + `next build --webpack` (18+ routes; `/` kini dinamis — verifikasi tidak ada error prerender).
2. RLS verification via `execute_sql` impersonation: anon SELECT `dokumentasi_foto` hanya `is_visible=true`; anon INSERT ditolak; PJ lab A tidak bisa INSERT lab B; system admin bisa semua; anon tidak bisa SELECT `page_views`; `record_pageview('/api/x')` return tanpa insert.
3. `supabase_get_advisors` security & performance → 0 ERROR (K4 harus hilang).
4. API route pentest: curl tanpa cookie → 401/403 (K1–K3).
5. Skenario manual PM:
   - System admin upload hero → beranda carousel berubah (fallback saat dihapus).
   - PJ lab upload dokumentasi → langsung muncul di marquee publik.
   - System admin toggle off → foto hilang dari publik, tetap ada di tab admin.
   - Edit PJ (nama/email/foto) → halaman organisasi berubah.
   - Overview: angka pengunjung bertambah setelah buka halaman publik; maintenance toggle bekerja.
6. Smoke origin 9/9 pasca-deploy (pola v5.2.x).

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| `/` tidak full-statis (hero server-fetch) | revalidate 300s; fallback file lokal; hanya 1 query kecil |
| Beban query publik bertambah (hero+dokumentasi+organisasi per request) | revalidate + query kecil ter-index; Free tier aman untuk skala lab |
| Unsigned preset disalahgunakan (orang luar upload ke folder kita) | Preset dibatasi format+ukuran+folder di dashboard Cloudinary; bukan vektor data (hanya storage) |
| `page_views` spam | Regex + anon-only RPC + 1 row/(day,path); retensi 90 hari |
| Perubahan RLS `app_settings` merusak fitur lama | Satu-satunya writer `app_settings` saat ini adalah maintenance toggle (system admin) → dikonfirmasi tidak ada writer admin-lab lain; smoke test pasca-migrasi |
| Hero upload salah ukuran (foto kecil di layar besar) | UI hint rasio 16:9; preset Cloudinary `crop: limit, width: 1920` (bentuk transform bawaan folder hero) |

## 12. Urutan Implementasi & Rollout

1. **DB** (execute_sql): `dokumentasi_foto` + RLS, `laboratorium.pj_*`, `page_views` + RPC, revoke `rls_auto_enable`, enable RLS `push_subscriptions` (K4), tighten `app_settings` (K5), seed `pj_*` + `hero_banners` + `organisasi_pimpinan` dari data hardcode.
2. **Hardening API** (K1–K3): auth + validasi di `delete-cloudinary`, `send-email`, `send-notification`.
3. **UI system admin**: 3 tab baru (Overview, Hero & Organisasi, Dokumentasi).
4. **UI PJ lab**: tab Dokumentasi.
5. **Publik**: hero prop + dokumentasi query + organisasi fetch (+ fallback).
6. **Beacon**: `record_pageview` dipanggil dari client component ringan di `LayoutWrapper` (bukan middleware — middleware matcher sudah mengecualikan banyak halaman dan menambah latensi; komponen client `PageviewBeacon` lebih sederhana, fire-and-forget di rute publik).
7. `tsc` + `build`, PATCH.md v5.3.0 + report.html, commit+push (ACC PM), deploy + smoke (ACC PM).

*(Catatan perubahan dari brainstorming: beacon dipindah dari middleware ke komponen client ringan — middleware menjalankan session refresh dan matcher-nya kompleks; komponen client menghindari risiko regresi cookie 502 yang sudah tertangani di v5.0.2.)*

## 13. File yang Disentuh (perkiraan)

```
BARU  app/admin/system/_components/OverviewAdminTab.tsx
BARU  app/admin/system/_components/HeroOrganisasiTab.tsx
BARU  app/admin/system/_components/DokumentasiAdminTab.tsx
BARU  app/admin/dashboard/_components/DokumentasiLabTab.tsx
BARU  app/api/admin/health/route.ts
BARU  components/pageview-beacon.tsx
UBAH  app/admin/system/page.tsx            (sidebar 5 tab)
UBAH  app/admin/dashboard/page.tsx         (tab Dokumentasi)
UBAH  app/page.tsx                         (server fetch hero)
UBAH  components/hero-section.tsx         (prop images + fallback)
UBAH  components/dokumentasi-section.tsx   (query DB + fallback)
UBAH  app/organisasi/page.tsx             (fetch + fallback)
UBAH  components/layout-wrapper.tsx       (mount PageviewBeacon)
UBAH  app/api/delete-cloudinary/route.ts  (K1 auth)
UBAH  app/api/send-email/route.ts         (K2 auth + escape)
UBAH  app/api/send-notification/route.ts  (K3 auth)
UBAH  lib/version.ts                      (5.3.0)
ENV   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_HERO, _DOKUMENTASI (Cloudinary dashboard: buat preset + set di Plesk)
```

## 14. Referensi

- Pendekatan disetujui: sesi brainstorming 2026-09-27/28 (Pendekatan A; Opsi A hero; model approval hero=admin-only, dokumentasi=l langsung tampil).
- Temuan keamanan: `supabase_get_advisors` (security) + audit manual API route, 2026-09-28.
- Pola upload: `KelolaJadwal.tsx`, `MateriTab.tsx`, `app/dosen/materi/page.tsx`.
- Pola RPC public: `materi_public_by_pin` (v5.1.0).
