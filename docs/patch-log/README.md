# DOLPHIN Patch & Release Workflow

Folder ini adalah sumber laporan perubahan yang dapat dibaca manusia dan dapat
langsung dibuka di browser. Satu laporan HTML menggabungkan semua versi, sedangkan
catatan teknis tetap dipisah per versi:

```text
docs/patch-log/report.html       # satu dashboard semua versi

docs/patch-log/0.0.0/
  PATCH.md                       # catatan teknis versi tersebut
```

## Format versi

Gunakan format `release.major.minor`:

- **release**: perubahan besar, migrasi, atau rilis production yang tidak
  kompatibel.
- **major**: fitur/perubahan perilaku penting yang masih kompatibel.
- **minor**: perbaikan kecil, bugfix, dokumentasi, atau penyempurnaan.

Versi aplikasi disimpan di `lib/version.ts` sebagai satu-satunya sumber label
versi. Footer publik dan footer dashboard wajib mengambil label dari file itu;
jangan menulis versi dengan string hardcode.

## Checkpoint wajib

Sebelum checkpoint:

1. Periksa `git status`, diff, dan secret leakage. Jangan pernah commit
   `.env.local`, token, password, cookie, ZIP deployment, atau log sensitif.
2. Jalankan `npx tsc --noEmit` dan `npm run build`.
3. Catat hasil tes otomatis di `docs/patch-log/<version>/PATCH.md` dan
   `report.html`.
4. Catat tes manual Project Manager secara eksplisit sebagai `PASS`, `FAIL`,
   atau `PENDING`; jangan klaim lulus tanpa konfirmasi user.
5. Commit perubahan ke Git dengan pesan yang memuat versi.
6. Push ke GitHub hanya pada checkpoint yang disetujui Project Manager.
7. Catat URL commit/branch GitHub dan status deploy (environment, waktu,
   build ID, status verifikasi).
8. Setelah deploy, lakukan smoke test dan update log lagi. Deployment dianggap
   selesai hanya jika status GitHub, otomatis, manual, dan deploy semuanya
   tercatat.

Checkpoint minimum yang digunakan:

- **LOCAL-READY**: type-check dan production build lulus.
- **GITHUB-BACKUP**: commit sudah dibuat dan push GitHub berhasil.
- **DEPLOYED**: build sudah dipasang pada environment target.
- **MANUAL-VERIFIED**: Project Manager sudah menguji dan mengonfirmasi.

## Aturan backup GitHub

- GitHub adalah backup checkpoint, bukan tempat menyimpan secret.
- Sebelum push, tinjau `git diff --cached` dan `git status --short`.
- Satu checkpoint harus menghasilkan commit yang dapat dilacak.
- Jangan force-push, reset hard, rewrite history, atau menghapus branch tanpa
  persetujuan Project Manager.
- Jika push gagal, catat `GITHUB-BACKUP: BLOCKED` beserta alasannya.
- Deployment server dan backup GitHub adalah status terpisah; satu tidak boleh
  dianggap sebagai bukti yang lain.

## Laporan HTML

`docs/patch-log/report.html` harus memuat riwayat semua versi yang sudah
dibuat, dengan satu bagian/tabel per versi:

- versi, tanggal, dan ringkasan perubahan;
- status badge GitHub, tes otomatis, tes manual Project Manager, dan deploy;
- daftar file/area yang berubah;
- hasil validasi dengan waktu dan perintah (tanpa secret);
- risiko, rollback reference, dan pekerjaan tersisa;
- link ke commit GitHub jika tersedia.

Jangan membuat `report.html` baru di dalam folder versi. File per versi hanya
`PATCH.md`; dashboard HTML utama diperbarui setiap kali status atau versi baru
bertambah.

Gunakan HTML/CSS mandiri yang menarik, responsif, mudah dibaca, dan tidak
bergantung pada runtime aplikasi. Laporan ini hanya dokumentasi statis dan
tidak boleh mengeksekusi perintah, script deploy, atau JavaScript berisiko.

## Status saat ini

- Versi aplikasi: `5.0.0`.
- Perbaikan cookie OAuth anti-431 sudah diuji dengan type-check dan production
  build lokal.
- Build `s3sqnMmsD7Ca48sM0-5em` sudah terdeploy ke production Polinela.
- Smoke test server untuk `/`, `/jadwal`, `/inventaris`, `/organisasi`,
  `/admin/dashboard`, `/admin/system`, dan `/sw.js` mengembalikan HTTP 200.
- Tes manual login/navigasi dari Project Manager masih harus dicatat setelah
  user melakukan verifikasi browser.
