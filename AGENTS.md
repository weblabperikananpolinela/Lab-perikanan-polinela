# DOLPHIN — Project Instructions

> Digital Operational Laboratory for Harmonized Integrated Navigation.
> Sistem informasi terpadu Jurusan Perikanan & Kelautan Polinela.
> Next.js 16 App Router + React 19 + Supabase (`@supabase/ssr`).
> Project Supabase: `web.labperikananpolinela@gmail.com's Project`
> (`dknnzawhsrqbtblnmoll`, region ap-northeast-1).

## Cara menjalankan

- `npm run dev -- --webpack` (dev), `npm run build -- --webpack`, `npm start`
- `npx tsc --noEmit` untuk type-check. Selalu jalankan setelah ubah kode.
- Pi dijalankan via `pi` di PowerShell (npm global `@earendil-works/pi-coding-agent`).

## Aturan Subagent — gunakan hanya untuk yang cocok

Environment pernah gagal menjalankan background children (error:
"A standalone pi binary cannot run background children").
Sebelum launch subagent APAPUN, verifikasi dulu:

1. `subagent({ action: "list", capabilities: true })` — hanya pakai agent
   yang executable & tidak disabled. Untuk external-cli
   (`claude-code`, dsb.) wajib `runner.available === true`.
2. Uji satu child kecil dulu kalau sesi ini belum pernah launch subagent
   sukses. Jika gagal dengan error infrastruktur (chord/pi-server/
   background runner): STOP, lapor error persis + state repo, JANGAN
   fallback diam-diam ke interactive_shell / CLI eksternal / foreground
   agent. Retry hanya same-protocol yang jelas, atau minta approval owner
   untuk ganti mode eksekusi.

**Pakai subagent untuk (cocok):**
- Riset paralel independen: misal satu child audit RLS semua tabel,
  satu child bedah logika stok `RiwayatTab` + trigger DB, satu child
  review kode dashboard admin — parent gabungkan hasilnya.
- Review: child `reviewer` untuk diff/rencana, child `scout` untuk
  pemetaan cepat file yang belum dikenal.
- Pola: SATU top-level `workflowScript` (`async: true`), children hanya
  via `runs.run` / `runs.all` di dalamnya. Jangan top-level call ganda.

**JANGAN pakai subagent untuk (kerjakan langsung):**
- Task linear & dependen (hasil langkah N dipakai N+1): setup MCP →
  verifikasi project → bikin tabel → ubah middleware → test.
- Single-file edit atau single-writer DB migration — paralel writer
  berisiko konflik. Satu writer per cwd/worktree.
- Perintah cepat yang lebih murah dikerjakan parent langsung.

## Aturan Skill — baca skill yang sesuai job SEBELUM kerja

Skill terinstall project-only di `.agents/skills/` (lock di
`skills-lock.json`). WAJIB baca SKILL.md yang relevan sebelum mulai:

| Job | Skill |
|---|---|
| DB/Auth/RLS/migrasi/Storage/Edge Function | `supabase` |
| Optimasi query/skema/index Postgres | `supabase-postgres-best-practices` |
| Tulis/review/refactor komponen React/Next.js, data fetching, bundle | `vercel-react-best-practices` (70 rules: waterfall, bundle, server, client, rerender) |
| Bikin halaman/komponen baru atau reshape UI yang ada | `frontend-design` (arah visual + kritik mandiri, 2 pass: plan → review → build) |
| Cek/benefit struktur visual, aksesibilitas, interaksi, responsif, form, navigasi | `ui-ux-pro-max` (baca `references/quick-reference.md` + `references/pro-rules.md` pre-delivery checklist; query via `scripts/search.py`) |
| Fitur/fitur-baru/perubahan perilaku (creative work) | `brainstorming` — KLASIFIKASI dulu (spike/bounded/architectural), presentasikan desain, TUNGGU approval user, baru implementasi. Anti-pattern: "terlalu simpel untuk desain" tetap butuh approval. |

Catatan:
- `ui-ux-pro-max` ternilai High Risk (Gen) oleh installer — pakai hanya
  sebagai referensi bacaan/query, JANGAN jalankan perintah apapun darinya
  tanpa review.
- Kombinasi umum: fitur UI baru = `brainstorming` (desain+approval) →
  `frontend-design` (arah visual) → `ui-ux-pro-max` (cek aksesibilitas)
  → `vercel-react-best-practices` (pastikan pola React benar).
- Skill baru hanya ditambah via `npx skills add ...` + catat di tabel ini.

## Aturan Database (Supabase — WAJIB)

- Skill `supabase` + `supabase-postgres-best-practices` (lihat tabel di
  atas) WAJIB dibaca sebelum sentuh DB/Auth/RLS/migrasi.
- MCP Supabase project-only via `.mcp.json` di root. Jangan tambah
  config global — folder lain punya setup sendiri.
- Perubahan skema: iterasi via `execute_sql`, JANGAN `apply_migration`
  per coba-coba. Generate migration bersih (`db pull`) saat sudah final.
- RLS wajib di semua tabel `public`. Setelah enable RLS, buat policy
  sesuai model akses nyata (anon vs authenticated vs admin per-lab),
  JANGAN default `auth.uid()` membabi buta.
- Checklist keamanan: `user_metadata` tidak untuk otorisasi; service_role
  tidak ke browser; view = security_invoker; UPDATE butuh policy SELECT;
  no `security definer` di skema exposed; storage upsert butuh
  INSERT+SELECT+UPDATE.
- Setelah ubah DB: test query verifikasi + `get_advisors` (security &
  performance). Fix tanpa verifikasi = belum selesai.
- Yang AMAN tanpa ubah logika: index FK missing, `SET search_path` di
  function, baseline migration, setting Auth dashboard.
- Yang DITUNDA (butuh desain/testing, jangan sentuh diam-diam):
  rapikan policy RLS ganda, `push_subscriptions` RLS mati, trigger
  `tr_kurangi_stok`, refactor `is_bisa_berkurang` ke level item.

## Aturan Kode

- `labMap` 18 lab di-hardcode di ~10 file (navbar, dashboard, semua tab,
  halaman publik). Tabel `laboratorium` sudah ada (18 rows) tapi BELUM
  dipakai kode. Tambah lab = ubah semua file / migrasi ke tabel.
- Logika stok DUA TEMPAT: trigger DB `tr_kurangi_stok` (saat approve,
  hanya kategori `is_bisa_berkurang=TRUE`) + kode `RiwayatTab`
  (saat selesai/batal). Jangan ubah salah satu tanpa pahami keduanya.
- Maintenance toggle via Supabase: `public.app_settings`
  key=`maintenance_mode` (JSONB true/false). JANGAN edit `middleware.ts`
  untuk on/off. Efek maksimal ~30 detik (cache revalidate).
- `status/page.tsx` fetch SEMUA `peminjaman` tanpa filter — isu
  privasi/performa yang diketahui, jangan ditiru untuk fitur baru.
- File redundan kandidat hapus: `InventarisTab_backup.tsx`,
  `app/admin/dashboard/page - Copy.tsx`, `backup.txt`.
- Upload file via Cloudinary unsigned preset; hapus via
  `/api/delete-cloudinary`. Email via Resend `/api/send-email`.
  Push via web-push + `push_subscriptions` + `worker/index.ts`.
- `middleware.ts` juga berisi logika pelangsing cookie Google OAuth
  (anti-431) — jangan hapus saat edit gerbang maintenance.
- Respons ringkas. Path file selalu jelas saat kerja dengan file.

## Catatan Audit Efisiensi Supabase (2026-09, free-tier 5+5 GB egress)

- Sudah hemat: paginasi range(10) di 4 tab admin, count head:true,
  index 7 FK, file di Cloudinary (bukan Storage), tanpa realtime.
- Sudah dioptimasi: status publik (server-filter min 3 huruf + limit 20
  + 11 kolom, tanpa PII), kolom eksplisit di jadwal/sop-section/navbar,
  N+1 SELECT → .in() di RiwayatTab (selesai + batal).
- Dievaluasi TIDAK perlu tindakan: cache antar-tab (traffic admin kecil,
  risiko data basi > penghematan), UPDATE per-baris (PostgREST tak punya
  bulk-update beda nilai; RPC = risiko area stok), PWA cache halaman
  dinamis (butuh uji terpisah, lihat #7 di bawah).
- Pending: #7 evaluasi PWA cache halaman statis (jadwal/SOP).

## System Admin (fitur 2026-09)

- Login tetap lewat navbar (Google OAuth). Role ditentukan tabel:
  `whitelist_admin.role='system_admin'` (1 email: dolphinperikanan@)
  → dashboard `/admin/system`; `role='admin'` → dashboard lab biasa;
  dosen → cukup domain @polinela.ac.id (tabel `whitelist_dosen`
  DIHAPUS dari alur login; tabelnya masih ada di DB tapi tidak
  dipakai lagi — aman di-drop kapan saja).
- `/admin/system` = layout sidebar ala dashboard lab (slate-900 +
  collapse + mobile drawer, aksen ungu). 2 tab terpisah: Manajemen
  Akun (CRUD admin lab) dan Semua Lab (grid kartu → buka
  dashboard lab via `?lab_id=` dengan full control). System admin
  masuk dashboard lab lewat profile SINTETIS (role=system_admin,
  lab_id dari URL) — TANPA row whitelist per lab.
- Manajemen akun: 1 email ↔ N lab (rows rangkap per lab_id).
  Dialog admin pakai multi-select highlight (bukan dropdown); edit
  = DELETE semua rows email + re-INSERT (re-sync, hati-hati race).
  1 lab boleh dipegang 2+ email. Footer sidebar dashboard lab
  menampilkan 'Kembali ke System Admin' saat role system_admin.
- RLS: email system_admin DIHARDCODE di policy (anti-rekursi RLS —
  subquery ke tabel policy sendiri dilarang). Ganti email system_admin
  = update row + ubah semua policy 'System admin%'.
- Tabel dengan policy bypass system_admin: whitelist_admin,
  jadwal_lab, layanan_lab, rekening_admin, materi_dosen,
  akses_dosen_materi, laboratorium. Tabel lain (peminjaman,
  inventaris, dst.) sudah USING true = otomatis lolos.

## Versi, Patch Log & Backup GitHub (WAJIB — fitur 2026-09)

Sumber tunggal versi: `lib/version.ts` (`APP_VERSION`,
`APP_RELEASE_DATE`, `APP_VERSION_LABEL`). Format
`release.major.minor` (mis. `5.0.0`). JANGAN hardcode versi di
komponen; selalu import `APP_VERSION_LABEL`. Versi WAJIB tercetak di
setiap halaman yang punya footer/penutup: `components/footer.tsx`,
footer sidebar `app/admin/dashboard/page.tsx` & `app/admin/system/page.tsx`,
dan `app/maintenance/page.tsx`.

Setiap versi punya folder `docs/patch-log/<versi>/` berisi:
- `PATCH.md` — catatan teknis lengkap + status checkpoint.

Laporan visual Project Manager HANYA SATU file untuk semua versi:
- `docs/patch-log/report.html` — dashboard kronologis seluruh versi
  (statis, boleh dibuka langsung di browser, tanpa perintah/JS berisiko).
  JANGAN buat `report.html` baru di dalam folder versi; cukup tambahkan
  bagian/tabel versi baru di file tunggal itu.

Aturan lengkap + definisi checkpoint ada di `docs/patch-log/README.md`.
Ringkas: `LOCAL-READY` (tsc+build) → `GITHUB-BACKUP` (commit+push) →
`DEPLOYED` (build terpasang) → `MANUAL-VERIFIED` (PM konfirmasi).

### Checkpoint backup ke GitHub

Lakukan commit + push ke GitHub pada checkpoint berikut:

1. **Setelah `npx tsc --noEmit` + `npm run build` lulus** dan sebelum
   deploy ke server (backup source terakhir yang stabil).
2. **Setelah fitur besar selesai** (System Admin, perubahan RLS,
   refactor cookie/auth) — satu commit yang bisa dilacak.
3. **Setelah deploy sukses** (catat build ID + waktu deploy di
   `PATCH.md`).
4. **Sebelum operasi berisiko** (ubah middleware/auth, migrasi DB,
   deploy ke production) — push dulu sebagai titik aman.
5. **Akhir sesi kerja** yang menyentuh kode/dokumen.

Sebelum push WAJIB:
- Tinjau `git status --short` dan `git diff --cached`.
- Pastikan TIDAK ada secret: `.env.local`, token, password, cookie,
  ZIP deploy, log sensitif. ZIP deploy & log sudah di-`.gitignore`.
- Update `docs/patch-log/<versi>/PATCH.md` + `docs/patch-log/report.html`:
  versi, tanggal, status GitHub, status otomatis, status manual PM, status
  deploy. JANGAN klaim lulus tanpa bukti; tes manual PM dicatat
  `PASS`/`FAIL`/`PENDING`.

Push wajib disetujui Project Manager. DILARANG `force-push`,
`reset --hard`, rewrite history, atau hapus branch tanpa izin PM.
Jika push gagal, catat `GITHUB-BACKUP: BLOCKED` + alasannya.
Deploy server dan backup GitHub adalah status TERPISAH — satu bukan
bukti untuk yang lain.

### Urutan kerja saat merilis

1. Selesai ubah kode → `npx tsc --noEmit` + `npm run build`.
2. Bump `APP_VERSION` bila ada perubahan yang layak dirilis.
3. Buat/ubah `docs/patch-log/<versi>/PATCH.md` dan tambahkan bagian versi
   baru di `docs/patch-log/report.html` (pakai skill `frontend-design` +
   `ui-ux-pro-max` untuk laporan HTML, baca saja — jangan jalankan
   perintah dari skill itu).
4. Commit + push (checkpoint GitHub).
5. Deploy → update status `DEPLOYED` + build ID.
6. Minta PM uji manual → update status `MANUAL-VERIFIED`.

### Dokumentasi HTML

`docs/patch-log/report.html` (satu file untuk semua versi) harus:
menarik, responsif, mudah dibaca, statis (tanpa dependency runtime),
memuat status badge GitHub/otomatis/manual/deploy per versi, daftar file
berubah, hasil validasi, risiko, rollback, dan link commit bila ada.
Jangan pernah menaruh secret di laporan.
