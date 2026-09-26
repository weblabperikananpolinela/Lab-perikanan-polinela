# PATCH v5.1.0 — Perbaikan MateriTab + Halaman Publik /materi

Tanggal: 2026-09-26 (WIB)
Status versi: `major` bump dari `5.0.3`. Memuat perbaikan regresi **MateriTab**
di dashboard admin lab dan satu halaman publik baru **/materi** (PIN, tanpa
login), diakses dari navbar Dokumen.

## Ringkasan

Laporan PM:

1. Pada deployment terbaru, **tombol Tambah Kelas** di MateriTab **tidak
   berfungsi** ketika login dengan email uji coba `@gmail` (whitelist,
   bukan admin lab `@polinela.ac.id`). Login sebagai `system_admin`
   (`dolphinperikanan@polinela.ac.id`) **masih bisa**.
2. Pada **deployment lama** (Vercel preview 686bff9 "refactor untuk plesk",
   10 Juni — diakses via tautan history Vercel), kedua email bisa membuat
   kelas.
3. Kelas yang dibuat oleh admin A **tidak muncul** di dashboard admin B
   (bahkan di lab yang sama), begitu pula sebaliknya. PM minta **siapapun
   yang membuat tetap muncul**.
4. PM ACC untuk halaman **Materi Kuliah di navbar Dokumen** (di bawah SOP)
   agar mahasiswa dapat melihat materi (diputuskan: publik + PIN, simpan
   unlock di perangkat — bukan tabel `akses_dosen_materi`).

---

## 1. Akar bug yang terbukti

### Bug #1 — `activeProfile.email` hilang

- `MateriTab` memakai `adminProfile.email` di 5 tempat (fetch,
  `handleCreateCategory`, `handleUpload`, simpan `created_by`/`dosen_email`).
- Sejak **v5.0.0**, `app/admin/dashboard/page.tsx` mempersempit SELECT
  whitelist menjadi `role, lab_id` (hemat kolom). Objek `activeProfile`
  **tidak lagi memiliki `email`**.
- Di `MateriTab`:

  ```ts
  if (!newCategoryName.trim() || !adminProfile.email) return;
  ```

  Bernilai `undefined` → fungsi **return diam-diam** tanpa INSERT, tanpa
  error, tanpa toast. UI tampak "tombol tidak berfungsi".

- **Kenapa system admin tetap bisa:** profil sintetis system admin saat
  `?lab_id=` sengaja diisi `email: session.user.email`, sehingga
  `email` tetap terisi.

### Bug #2 — filter `created_by` menyembunyikan kelas orang lain

```sql
select * from kategori_materi where created_by = adminProfile.email
```

`kategori_materi` **tidak punya** `lab_id` (konstruk DB, bukan kesalahan),
jadi materi bersifat global. Filter di atas membuat setiap admin hanya
melihat kelas buatannya sendiri. Bukan regresi v5.0.3 — sudah ada sejak
depan. PM minta **semua admin melihat semua kelas**.

---

## 2. Perbaikan

### 2.1 Dashboard admin lab (`app/admin/dashboard/page.tsx`)

- SELECT whitelist diperluas menjadi `id, role, lab_id, email, nama_dosen`
  (kolom eksplisit, tetap tanpa `*`).
- Jaring terakhir: setiap baris `labRows` dilapisi `email ?? session.user.email`
  via `withEmail()` sebelum disimpan ke `activeProfile`. Bahkan jika SELECT
  menyempit lagi, tombol tidak akan diam.

### 2.2 MateriTab (`app/admin/dashboard/_components/MateriTab.tsx`)

- Hapus filter `.eq('created_by', adminProfile.email)`.
- Ganti SELECT `*` menjadi kolom eksplisit:

  ```sql
  id, nama_kategori, pin_akses, created_by, created_at,
  materi_dosen(count)
  ```

- Semua admin lab + system admin melihat **kelas yang sama**.
- Setiap kartu menampilkan `Dibuat oleh <email>` (transparansi).
- Remote API tetap di-`adminProfile.email` saat INSERT — sesuai email login.

### 2.3 RLS `materi_dosen` (DB, via `execute_sql`)

Policy baru:

```sql
CREATE POLICY "Admin lab bisa kelola semua materi"
ON public.materi_dosen
FOR ALL TO authenticated
USING  (EXISTS (SELECT 1 FROM public.whitelist_admin
                WHERE whitelist_admin.email = (auth.jwt() ->> 'email')))
WITH CHECK (EXISTS (SELECT 1 FROM public.whitelist_admin
                   WHERE whitelist_admin.email = (auth.jwt() ->> 'email')));
```

Mengizinkan admin lab menghapus/memperbarui file `materi_dosen` **orang lain**
(diperlukan setelah shared view). Tanpa ini, `deleteMateri` akan
0-row di akun B. Bukan `USING true`.

### 2.4 Halaman publik `/materi`

- Route: `app/materi/page.tsx` — dapat dibuka **tanpa login**.
- Setiap kategori tetap **terkunci PIN 6 digit** (`pin_akses`). PIN dibagikan
  pengajar/admin seperti sebelumnya.
- Unlock di halaman publik **disimpan di perangkat** (`localStorage`), bukan
  di `akses_dosen_materi`. Halaman dosen `/dosen/materi` tetap memakai tabel
  itu (untuk akses per-email).
- **PIN tidak bisa dilihat publik.** Verifikasi lewat RPC server-side:

  ```sql
  CREATE FUNCTION public.materi_public_by_pin(pin_input text)
  RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
  AS SELECT jsonb_build_object(..., materi_dosen jsonb_agg(...))
     FROM kategori_materi WHERE pin_akses = pin_input LIMIT 1
  GRANT EXECUTE TO anon, authenticated;
  ```

  Client anonim **tidak pernah SELECT `kategori_materi` langsung** — bila
  melakukannya, kolom `pin_akses` akan bocor. RPC hanya mengembalikan
  `{id, nama_kategori, created_by, materi_dosen[]}` (tanpa PIN).

### 2.5 Navbar Dokumen (`components/navbar.tsx`)

- Tambah entry **Materi Kuliah** di dropdown Dokumen (desktop), setelah
  *SOP Lab. Perikanan Tangkap*, ikon `BookOpen`.
- Tambah tautan serupa di menu mobile (accordion Dokumen).
- `/dosen/materi` (untuk dosen `@polinela.ac.id` yang login) **tidak diubah**.

---

## 3. Hasil verifikasi

### Type-check & build

```text
npx tsc --noEmit          PASS (EXIT:0)
npx next build --webpack  PASS (18 routes, termasuk /materi)
```

Route baru `/materi` terdeteksi sebagai prerendered statis — sama seperti
`/dokumen/sop-*`.

### DB advisors

```text
supabase_get_advisors (security)  WARN yang diharapkan:
  public.materi_public_by_pin — SECURITY DEFINER executable by anon/authenticated
  (disengaja — anon harus bisa verify PIN)
  public.rls_auto_enable — sudah ada sebelumnya
  push_subscriptions RLS disabled — sudah tercatat ditunda (AGENTS.md)
```

### Uji yang harus dilakukan PM

1. Login `afnanimadurrosyad911@gmail.com` → Dashboard lab → Materi →
   **Tambah Kelas** → kartu muncul + pin terbit + `Dibuat oleh <email>`.
2. Login system admin (lab sama) → materi **terlihat semua kelas**, termasuk
   yang dibuat akun Gmail — begitu pula sebaliknya.
3. Navbar Dokumen → **Materi Kuliah** (desktop + mobile) → halaman
   `/materi` → masukkan PIN → file terbuka tanpa login.
4. Cek `access_ssl_log` tidak ada 404 `/materi`.

---

## File yang berubah

```text
app/admin/dashboard/page.tsx                  (SELECT whitelist + tempel email)
app/admin/dashboard/_components/MateriTab.tsx (fetch semua kelas + created_by eksplisit)
components/navbar.tsx                         (entry Materi Kuliah, desktop + mobile)
app/materi/page.tsx                           (BARU — halaman publik PIN + RPC)
lib/version.ts                                (5.1.0)
+ 1 policy RLS public.materi_dosen (Admin lab bisa kelola semua materi)
+ 1 RPC public.materi_public_by_pin(pin_input text) → jsonb
```

## Angka kunci

| Metrik | Sebelum | Sesudah |
|---|---|---|
| Tambah Kelas dengan akun `@gmail` whitelisted | tombol diam (no INSERT) | **berfungsi** (email ditempel dari sesi) |
| Kelas admin A terlihat oleh admin B (lab sama) | tidak (filter `created_by`) | **terlihat semua**, dengan label `Dibuat oleh` |
| Route publik `/materi` | tidak ada | **/materi** via navbar Dokumen, PIN via RPC, tanpa login |
| RLS | anon bisa melihat pin jika SELECT langsung | **RPC `materi_public_by_pin`** mengembalikan materi tanpa PIN |

## Checkpoint & status

| Checkpoint | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | `npx tsc --noEmit`, `next build --webpack` (18 routes inc. /materi) |
| GITHUB-BACKUP | PENDING | menunggu ACC/komit+push |
| DEPLOYED | PENDING | menunggu deploy Plesk |
| MANUAL-TEST (PM) | PENDING | 4 skenario di atas |

## Pekerjaan tersisa

- GITHUB-BACKUP + DEPLOYED v5.1.0 (smoke 8 rute inc. `/materi`, verifikasi
  `favicon.ico`/`apple-icon.png` tetap 200).
- Keputusan PM yang masih tertunda: hapus 11 aset UNUSED (1,62 MB), drop
  `whitelist_dosen`, bersihkan `page - Copy.tsx` + `backup.txt`, buffer
  nginx, `middleware.ts` → `proxy.ts`.

## Referensi GitHub

- Repository: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Commit dasar: `8e08102`
- Deployment yang masih berfungsi (Vercel preview history): `686bff9` — 10 Juni 2026
