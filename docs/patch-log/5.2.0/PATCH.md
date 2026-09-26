# PATCH v5.2.0 — Dosen dapat Upload & Hapus File Materi

Tanggal: 2026-09-27 (WIB)
Status versi: `minor` bump dari `5.1.0`. Menambahkan kemampuan **dosen** untuk
mengunggah dan menghapus **file** materi pada halaman `/dosen/materi`
(dropdown login → "Akses Materi").

## Ringkasan

Permintaan PM (diklarifikasi):

| Pengguna | Halaman | Boleh apa |
|---|---|---|
| Mahasiswa / publik | `/materi` (navbar Dokumen → Materi Kuliah) | **Lihat saja** — tidak bisa upload/hapus (sudah benar sejak v5.1.0) |
| **Dosen `@polinela.ac.id`** | `/dosen/materi` (dropdown login → Akses Materi) | **Upload + hapus FILE** dalam kategori yang dibuka via PIN; **tidak bisa** membuat/menghapus kategori |
| Admin lab (whitelist) | Dashboard lab → MateriTab | Buat/hapus kategori + kelola semua file (semua kategori) |
| System admin | Dashboard lab mana pun | Semua di atas |

Sebelum v5.2.0, halaman `/dosen/materi` hanya bisa melihat/membuka file (QR,
salin tautan). Kemampuan upload/hapus dosen sebenarnya **sudah diizinkan RLS**
(`Dosen bisa mengunggah materi sendiri`, `Dosen hanya bisa menghapus materi
sendiri`) tetapi **tidak ada UI-nya** — kemampuan mati.

## Perubahan

### `app/dosen/materi/page.tsx` (satu file)

1. **Tombol Upload** pada tiap kategori terbuka → membuka modal
   (judul + pilih file). Upload ke Cloudinary memakai endpoint
   `/raw/upload` dengan unsigned preset yang sama seperti admin lab, lalu
   INSERT ke `materi_dosen` dengan:
   - `dosen_email` = `session.user.email` (wajib cocok dengan pemilik —
     dijaga RLS `WITH CHECK (auth.jwt()->>'email' = dosen_email)`)
   - `kategori_id` = kategori yang sedang dibuka
2. **Tombol Hapus** (ikon tempat sampah) hanya muncul untuk file yang
   `dosen_email`-nya **sama dengan email dosen yang login**. Hapus =
   `DELETE /api/delete-cloudinary` (best-effort) + `DELETE materi_dosen`.
   RLS memastikan dosen hanya bisa menghapus baris miliknya.
3. Setelah upload/hapus, daftar kategori di-refresh
   (`fetchUnlockedCategories`), sehingga isi accordion langsung ter-update.
4. Query relasi `materi_dosen` kini menyertakan `dosen_email` (dipakai untuk
   menampilkan tombol Hapus milik sendiri).

### Yang TIDAK diubah

- **Tidak ada perubahan DB / RLS / migrasi.** Policy yang ada sudah tepat:
  dosen INSERT/DELETE miliknya; admin lab ALL via whitelist; system admin ALL.
- **Tidak ada perubahan** pada `/materi` (halaman mahasiswa, read-only) dan
  `MateriTab` (admin lab, pembuat kategori).
- `/api/delete-cloudinary` tidak diubah — hanya dipakai ulang.

## Keamanan

- Judul file wajib diisi (validasi klien).
- Jenis file dibatasi lewat atribut `accept` (PDF, Office, gambar, arsip).
- `dosen_email` selalu diambil dari sesi, tidak dari input pengguna.
- Tombol Hapus berbasis kepemilikan (`file.dosen_email === session.user.email`),
  bukan hanya sembunyikan UI — RLS adalah penjaga sebenarnya.
- Tidak ada secret Cloudinary di klien (hanya cloud name + unsigned preset).

## Hasil verifikasi

```text
npx tsc --noEmit          PASS (EXIT:0)
npx next build --webpack  PASS (18 rute; /dosen/materi tetap prerendered)
```

## Checkpoint & status

| Checkpoint | Status | Bukti |
|---|---|---|
| LOCAL-READY | PASS | `npx tsc --noEmit` + `next build --webpack`; BUILD_ID `lCxcT0RdeMnOEGY1VPtzw` |
| GITHUB-BACKUP | PASS | Commit `82bb75f` di-push ke `origin/master` (27 Sep 2026) |
| DEPLOYED | PASS | 2026-09-26 18:00 UTC; BUILD_ID `lCxcT0RdeMnOEGY1VPtzw`; ZIP SHA-256 `238fcb6e…f433`; smoke origin 9/9 HTTP 200; footer `DOLPHIN System v5.2.0` |
| MANUAL-TEST (PM) | PENDING | dosen upload file, dosen hapus file sendiri, tombol hapus tidak muncul untuk file orang lain |

## Uji yang harus dilakukan PM

1. Login dosen `@polinela.ac.id` → navbar → **Akses Materi**.
2. Buka kategori dengan PIN → klik **Upload** → isi judul + pilih file →
   file muncul di daftar.
3. Klik ikon **Hapus** pada file yang baru diunggah → terhapus.
4. Buka kategori yang berisi file milik dosen lain → tombol Hapus **tidak
   muncul** pada file tersebut (hanya bisa lihat/salin/buka).
5. Pastikan dosen **tidak** menemukan cara membuat/menghapus kategori di
   halaman ini (hanya admin lab di dashboard).

## Risiko & rollback

- Risiko rendah: perubahan satu file klien, tanpa migrasi DB.
- Rollback: `httpdocs/*.old-<timestamp>` (v5.1.0, BUILD_ID
  `OiHQGwnXwmWLzbOd08haz`) lalu `touch tmp/restart.txt`.

## Referensi GitHub

- Repository: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Commit dasar: `dbbc23b`
