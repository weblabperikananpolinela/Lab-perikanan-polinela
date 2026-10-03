# Design — Pagination Status Publik + Master Lab/TEFA (`is_active`)

Tanggal: 2026-10-03 | Status: DRAFT (menunggu ACC PM)
Versi target: 5.8.0

## Ringkasan keputusan PM

| Topik | Keputusan |
|---|---|
| Halaman `/administrasi/status` | Tetap 20 per halaman + tombol halaman (Sebelumnya / Berikutnya) + total data |
| Lab/TEFA dinonaktifkan | **Disembunyikan sepenuhnya** dari halaman organisasi publik |
| Data lama (peminjaman, inventaris, riwayat) | Tetap bisa dibuka + di-export dari dashboard PJ |
| `whitelist_admin` saat disable | **Tidak disentuh** |
| Tambah Lab/TEFA | PJ diisi **manual** (nama + email, tanpa akun login otomatis) |
| Kategori lab baru | Tetap dua opsi: `Lab Perikanan` / `Lab Perikanan Tangkap` |
| Kolom baru | `laboratorium.is_active boolean NOT NULL DEFAULT true` |

## Klasifikasi

- Pagination status: **bounded** (pola `range` + `count` sudah ada di `RiwayatTab`).
- Master Lab/TEFA: **architectural** — `labMap` hardcode di ~12 file; tabel `laboratorium` sudah ada (18 rows) tapi belum jadi sumber tunggal untuk form pengajuan/jadwal/navbar.

## Bagian A — Pagination `/administrasi/status`

File: `app/administrasi/status/page.tsx` (client).

Perilaku sekarang: debounce 500 ms, `ilike` nama ≥ 3 huruf, `.limit(20)`, tanpa `count`, tanpa tombol halaman.

Perubahan:

1. State `page` (default 1) + `totalCount`.
2. Saat `searchQuery` berubah, `page` reset ke 1.
3. Query:
   ```ts
   .select('id, nama_lengkap, lab_id, tanggal, jam_mulai, jam_selesai, status, judul_kegiatan, kategori_pemohon, pesan_feedback, pesan_pembatalan', { count: 'exact' })
   .ilike('nama_lengkap', `%${keyword}%`)
   .order('created_at', { ascending: false })
   .range((page - 1) * 20, page * 20 - 1)
   ```
4. Footer: `Total Data: N | Halaman p dari ceil(N/20)` + tombol Sebelumnya/Berikutnya (pola sama `RiwayatTab`).
5. Nama lab di kartu: baca dari `lib/labs.ts` (bukan `labMap` lokal).

Aman untuk Supabase: 20 baris + `count head` per ketikan (≥3 huruf, debounce 500 ms). Index `peminjaman.nama_lengkap` tidak wajib di rilis ini (volume kecil); catat sebagai follow-up bila data membesar.

`RiwayatTab` dashboard **tidak diubah** (sudah 10/halaman).

## Bagian B — Master Lab/TEFA

### Skema

```sql
alter table public.laboratorium
  add column if not exists is_active boolean not null default true;

comment on column public.laboratorium.is_active is
  'false = lab disembunyikan dari publik & form pengajuan baru; data lama tetap ada.';

create unique index if not exists laboratorium_nama_lab_unique
  on public.laboratorium (lower(nama_lab));
```

Nilai `jenis` yang sudah ada: `Laboratorium` | `TEFA` (bukan `LAB`). Form tambah memakai nilai yang sama.

RLS sekarang:

- SELECT publik: `true` (semua row, termasuk nanti yang nonaktif).
- ALL authenticated: `is_system_admin()`.

Perubahan RLS:

- Publik: `USING (is_active = true)` — organisasi, form pengajuan, jadwal, inventaris publik tidak melihat lab nonaktif.
- System admin: tetap `is_system_admin()` tanpa filter `is_active` (grid "Semua Lab" menampilkan nonaktif dengan badge).
- Admin lab biasa: tidak butuh policy baru di `laboratorium`; mereka tidak CRUD tabel ini. Akses dashboard lab nonaktif tetap lewat `whitelist_admin` + `lab_id` (tidak berubah).

Setelah ubah RLS: `get_advisors(security)` + query verifikasi.

### Sumber nama lab (ganti hardcode)

File baru `lib/labs.ts`:

```ts
export type LabRow = {
  id: number;
  nama_lab: string;
  jenis: 'Laboratorium' | 'TEFA' | string;
  kategori: 'Lab Perikanan' | 'Lab Perikanan Tangkap' | string;
  pj_nama: string | null;
  pj_email: string | null;
  pj_foto_url: string | null;
  is_active: boolean;
};

export const KATEGORI_LAB = ['Lab Perikanan', 'Lab Perikanan Tangkap'] as const;
export const JENIS_LAB = ['Laboratorium', 'TEFA'] as const;
```

Fetch:

- Server (organisasi, layout): `createPublicClient().from('laboratorium').select(...).eq('is_active', true)` — otomatis karena RLS publik.
- Client (pengajuan, jadwal, inventaris, navbar profil): fetch sekali, cache modul singkat (jangan hardcode).
- System admin: fetch tanpa filter aktif (RLS system admin lolos semua).
- Fallback: `lib/lab-map.ts` tetap ada sebagai peta 18 lab lama **hanya** untuk export Excel nama file bila fetch gagal; tidak dipakai UI publik.

File yang dihapus `labMap` lokal (wajib diganti):

- `components/navbar.tsx` (hanya label profil — baca `laboratorium` atau terima nama dari profil)
- `app/jadwal/page.tsx` (loop 18 lab hardcoded → loop hasil fetch aktif)
- `app/administrasi/status/page.tsx`
- `app/administrasi/pengajuan/page.tsx` (`labMap` nama→id + `labKategoriData`)
- `app/admin/dashboard/page.tsx`
- `app/admin/dashboard/_components/{PengajuanTab,RiwayatTab,InventarisTab}.tsx`
- `app/admin/system/_components/DokumentasiAdminTab.tsx`
- `app/inventaris/page.tsx` (bila masih hardcode)

`app/admin/system/page.tsx` sudah fetch `laboratorium` — tambah kolom `is_active`, `kategori`, tombol CRUD.

`app/organisasi/page.tsx` sudah fetch `laboratorium` — RLS publik otomatis menyembunyikan nonaktif. Tambah `.eq('is_active', true)` eksplisit sebagai defense in depth.

### UI System Admin

Tab **Semua Lab** (sudah ada) diperluas, bukan tab baru:

- Kartu lab aktif: seperti sekarang + menu ⋮ (Edit / Nonaktifkan).
- Kartu lab nonaktif: opacity rendah, badge **Nonaktif**, aksi **Aktifkan kembali**.
- Tombol **Tambah Lab / TEFA** di header grid.

Form tambah/edit:

| Field | Wajib | Catatan |
|---|---|---|
| Nama | ya | unik (case-insensitive) |
| Jenis | ya | `Laboratorium` / `TEFA` |
| Kategori | ya | `Lab Perikanan` / `Lab Perikanan Tangkap` |
| Nama PJ | tidak | tampil di organisasi bila terisi |
| Email PJ | tidak | tampilan saja; **tidak** insert `whitelist_admin` |
| Foto PJ | tidak | Cloudinary existing flow di `HeroOrganisasiTab` — edit PJ foto tetap di tab Organisasi |

Disable: Swal konfirmasi (bukan klaim "data hilang"):

> Lab **FISHTECH** akan dinonaktifkan.
>
> Yang terjadi:
> - Tidak muncul di halaman Organisasi
> - Tidak bisa dipilih di form pengajuan baru
> - Tidak muncul di jadwal/inventaris publik
>
> Yang **tidak** terjadi:
> - Peminjaman, inventaris, riwayat **tidak dihapus**
> - Akun PJ di Manajemen Akun **tetap ada**
> - Dashboard lab masih bisa dibuka (system admin / PJ yang sudah di-assign)
>
> Ringkasan: N peminjaman · N kategori inventaris · N item · M akun admin terhubung.

Aktifkan kembali: Swal singkat, set `is_active = true`.

Tidak ada tombol hapus permanen di UI.

### Efek per permukaan

| Permukaan | Lab nonaktif |
|---|---|
| `/organisasi` | tidak tampil |
| Form `/administrasi/pengajuan` | tidak di dropdown |
| `/jadwal` | tidak tampil kartu jadwal lab itu |
| `/inventaris` publik | tidak tampil |
| Navbar label profil | tetap tampil nama lab bila user login ke lab itu |
| Dashboard `/admin/dashboard?lab_id=` | tetap bisa (system admin + PJ assigned) |
| Export Excel | tetap jalan |
| Manajemen Akun | lab nonaktif tetap bisa di-assign (agar PJ lama tidak kehilangan akses) — tampil dengan suffix `(nonaktif)` |

### Nama file export

`labSlug()` baca `nama_lab` dari row DB bila ada; fallback `lib/lab-map.ts`.

## Risiko

| Risiko | Mitigasi |
|---|---|
| Form pengajuan masih hardcode → lab baru tidak muncul | Wajib ganti `labKategoriData` ke fetch DB di rilis yang sama |
| RLS publik `is_active` merusak system admin grid | System admin pakai policy ALL `is_system_admin()` (bypass filter publik) |
| Unique nama menabrak lab nonaktif yang diaktifkan ulang | Unique by `lower(nama_lab)`; edit nama dulu jika bentrok |
| Cache ISR organisasi 300 dtk | `revalidatePath('/organisasi')` setelah mutate (server action) atau biarkan 5 menit — pilih revalidatePath |
| `lab_id` baru belum punya kategori inventaris | Normal; PJ isi nanti. Form pengajuan lab baru = daftar alat kosong |
| Navbar masih hardcode 18 | Hanya label profil; fetch `laboratorium` sekali di dashboard sudah cukup, navbar terima `nama_lab` opsional di profile |

## Files (perkiraan)

- Migrasi via `execute_sql` lalu `db pull` saat final: `is_active` + unique index + policy SELECT publik
- `lib/labs.ts` (baru)
- `lib/lab-map.ts` (fallback saja)
- `app/administrasi/status/page.tsx` (pagination 20)
- `app/administrasi/pengajuan/page.tsx` (dropdown dinamis)
- `app/jadwal/page.tsx`, `app/inventaris/page.tsx`, `app/organisasi/page.tsx`
- `app/admin/system/page.tsx` + komponen kartu lab (CRUD)
- Tab dashboard yang masih `labMap` lokal
- `lib/version.ts` → 5.8.0
- `docs/patch-log/5.8.0/PATCH.md` + `report.html`

## Verifikasi

1. `npx tsc --noEmit` + `npm run build -- --webpack`
2. Status: ketik ≥3 huruf → 20 hasil + tombol halaman; ganti kata → reset page 1
3. Disable FISHTECH (staging/dev): organisasi tanpa FISHTECH; pengajuan tanpa FISHTECH; dashboard `?lab_id=14` masih buka; export masih jalan; `whitelist_admin` row tidak berubah
4. Tambah lab uji → muncul di organisasi (jika PJ terisi) + dropdown pengajuan; hapus uji dengan disable (bukan delete)
5. `get_advisors(security)` bersih untuk `laboratorium`
6. Aktifkan kembali → muncul lagi di publik
