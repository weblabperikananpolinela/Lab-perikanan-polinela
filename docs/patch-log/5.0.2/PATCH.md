# PATCH v5.0.2 — Perbaikan Tuntas 502: Sesi Cookie Selalu 1 Chunk

Tanggal: 2026-09-26 (WIB)
Status versi: `minor` bump dari `5.0.1`. Memuat **perbaikan definitif**
untuk 502 yang masih muncul setelah hotfix v5.0.1.

## Ringkasan

Hotfix v5.0.1 (buang `identities`/`factors`/provider token) ternyata
**belum cukup**: sesi nyata user Google Polinela tetap **2 chunk** setelah
dilangsingkan. Patch ini memangkas berlapis sampai **dijamin muat 1 chunk**
(3180 char) untuk semua bentuk profil, plus regression check memakai data
user nyata.

---

## 1. Kenapa 502 masih muncul setelah v5.0.1

### Bukti log pasca-deploy v5.0.1 (read-only SSH, 25 Sep 2026)

Deploy v5.0.1 berjalan 07:33 UTC. Error 502 **baru** muncul di:

```text
10:38:12  GET /?code=0fe96ed8-…  (callback OAuth Google)
10:38:32  GET /?code=0fe96ed8-…
11:08:15  GET /?code=0fe96ed8-…  (reload ulang halaman callback)
11:08:24  GET /
11:34:47  GET /
```

- Semua pesan identik: `upstream sent too big header`.
- `access_ssl_log` mencatat **200** pada detik yang sama → Apache sehat;
  nginx-lah yang menolak header respons besar.
- Hash `middleware.js` lokal vs server **identik**
  (`2dc6b2c8…`) → fix v5.0.1 memang terdeploy.

### Request pemicu (jawaban atas pertanyaan PM)

502 terjadi pada request yang memicu **middleware** menulis ulang sesi:

1. **`GET /?code=…`** — callback login Google (PKCE). Middleware menukar
   kode → sesi baru **dengan `provider_token` + `identities`**.
2. **`GET /`** setelahnya — sesi hasil refresh masih gemuk.

### Yang "kedaluwarsa" (jawaban atas pertanyaan PM)

**`access_token` (JWT) Supabase — masa berlaku 3600 detik (1 jam).**
Alurnya:

```text
idle > 1 jam → access_token expired
→ request berikutnya masuk middleware → getUser()
→ SDK refresh token ke Supabase
→ menulis sesi baru lewat Set-Cookie (respons)
→ sesi memuat profil Google lengkap → cookie > 3180 char → dipecah 2 chunk
→ total header respons melewati buffer nginx → 502
```

Token **tidak bisa "dicegah kedaluwarsanya"** — itu perilaku OAuth yang
benar (access token harus pendek demi keamanan). Yang diperbaiki: hasil
refresh **tidak boleh menggemukkan cookie**.

### Pengukuran sesi NYATA (kunci diagnosis)

Probe sintetis gagal mereproduksi (refresh token palsu → refresh gagal →
hanya Set-Cookie expiry kecil). Maka sesi direkonstruksi dari data asli
`auth.users` (metadata Google `dolphinperikanan@polinela.ac.id`, 552 char):

| Skenario | Cookie mentah | Setelah slim v5.0.1 | Chunk |
|---|---:|---:|---:|
| OAuth exchange (token OAuth + identities) | 7245 | **3330** | **2** ❌ |
| Refresh setelah 1 jam (identities) | 4490 | **3330** | **2** ❌ |

**3330 > 3180** → slim v5.0.1 gagal muat 1 chunk. Penyebab: selain
`identities`, masih ada beban besar yang tidak disentuh v5.0.1 —

| Komponen | Ukuran | Dipakai app? |
|---|---:|---|
| `provider_token` + `provider_refresh_token` | ~2100 char | ❌ |
| `user.identities` (duplikat profil) | ~1000 char | ❌ |
| `user_metadata.picture` + `avatar_url` (URL foto Google, **ganda**) | ~180 char | ❌ |
| `user_metadata` lainnya (iss, sub, provider_id, custom_claims) | ~200 char | ❌ |
| timestamp user (created/updated/last_sign_in/confirmed) | ~250 char | ❌ |

Audit pemakaian kode (`rg`): aplikasi hanya membaca **`user.email`** dan
**`user_metadata.full_name`** (navbar). Tidak ada kode yang membaca
`picture`, `avatar_url`, `identities`, `user.id`, maupun timestamp.

---

## 2. Perbaikan: slim berlapis dengan jaminan 1 chunk

`lib/supabase/slim-session.ts` — `slimSessionValue()` kini memangkas
**berlapis**, lalu memverifikasi hasilnya:

| Lapis | Aksi | Field dibuang |
|---:|---|---|
| 1 | hapus token OAuth | `provider_token`, `provider_refresh_token` |
| 2 | hapus duplikat profil | `user.identities`, `user.factors` |
| 3 | allowlist `user` | timestamp, `phone`, `is_anonymous`, dll |
| 4 | allowlist metadata | `picture`, `avatar_url`, `iss`, `sub`, `provider_id`, `custom_claims`, `providers` |
| 5 | jaminan ≥3180 | `user_metadata.name` (duplikat `full_name`) |
| 6 | jaring terakhir | seluruh `user_metadata` (navbar fallback ke email) |

Yang dipertahankan: `access_token`, `refresh_token`, `expires_at`,
`user.id`, `user.role`, `user.email`, `user_metadata.full_name`.
`user_metadata.name` di-copy ke `full_name` bila `full_name` tidak ada.

### Hasil (data nyata, script `check-session-cookie.mjs`)

```text
Sesi gemuk        : 5493 char JSON → 3 chunk
Setelah dilangsing: 2481 char → 1 chunk   (margin 699 char)
Ukuran Set-Cookie : 2.51 KB
PASS
```

| Skenario | v5.0.1 | v5.0.2 |
|---|---|---|
| Cookie sesi (data nyata) | 3330 / **2 chunk** | **2481 / 1 chunk** |
| Set-Cookie | ~3.5 KB | **2.51 KB** |
| OAuth exchange | 2 chunk ❌ | 1 chunk ✅ |
| Refresh 1 jam | 2 chunk ❌ | 1 chunk ✅ |

### Regression check diperkuat

- `scripts/check-session-cookie.mjs` — kini memakai **data user nyata**
  (metadata Google asli + access token 1369 char, sesi 5493 char → 3 chunk),
  bukan sesi sintetis minimal. Gagal (exit 1) bila >1 chunk atau field
  berat kembali.
- `scripts/check-slim-edge.mjs` (BARU) — edge case profil ekstrem:
  nama 8× lipat, email 3× lipat, keduanya. Semua **PASS 1 chunk**.
  Bila terpaksa membuang metadata, navbar otomatis fallback ke email.

---

## 3. Perubahan perilaku yang disadari user

- Nama tampilan navbar tetap benar (`full_name` dipertahankan).
- Bila profil Google ekstrem (nama sangat panjang), navbar menampilkan
  email — fallback yang memang sudah ada di kode.
- Tidak ada perubahan pada login flow, RLS, maupun halaman lain.
- `user_metadata.picture`/`avatar_url` tidak lagi tersimpan di cookie —
  kode tidak pernah membacanya (avatar UI memakai inisial).

## File yang berubah

```text
lib/supabase/slim-session.ts          (slim berlapis + jaminan 1 chunk)
lib/version.ts                        (5.0.2)
scripts/check-session-cookie.mjs      (data user nyata + cek ketat)
scripts/check-slim-edge.mjs           (BARU — edge case profil panjang)
docs/patch-log/5.0.2/PATCH.md         (BARU)
docs/patch-log/report.html            (bagian v5.0.2)
```

## Angka kunci

| Metrik | v5.0.1 | v5.0.2 |
|---|---|---|
| Cookie sesi data nyata | 3330 char / 2 chunk | **2481 char / 1 chunk** |
| Set-Cookie hasil refresh | ~3.5 KB | **2.51 KB** |
| 502 setelah idle 1 jam | masih terjadi (10:38, 11:08, 11:34 UTC) | ditutup oleh jaminan 1 chunk |
| 502 callback OAuth `/?code=` | masih terjadi | ditutup (lapis 1 membuang token OAuth) |
| Field metadata tersimpan | seluruh `user_metadata` | `full_name` (+`name` cadangan) |

## Checkpoint & status

| Checkpoint | Status | Bukti / waktu |
|---|---|---|
| LOCAL-READY (tsc + build) | PASS | `npx tsc --noEmit` ✅; `next build --webpack` ✅ (BUILD_ID `xs8ATU0djm6ntGl10t7w_`) |
| SESSION-CHECK (regression) | PASS | `check-session-cookie.mjs` → 2481 char, 1 chunk |
| EDGE-CHECK | PASS | `check-slim-edge.mjs` → 4/4 PASS (nama/email panjang) |
| GITHUB-BACKUP | PENDING | menunggu persetujuan PM |
| DEPLOYED | PENDING | menunggu persetujuan PM |
| MANUAL-TEST (PM) | PENDING | uji idle ±1 jam → harus 200 |

## Risiko & rollback

- Field yang dibuang diverifikasi **tidak dibaca kode mana pun**
  (`rg` atas `picture`, `avatar_url`, `identities`, `user.id`, timestamp).
- `user_metadata.full_name` dipertahankan; fallback email sudah ada di
  navbar untuk kasus ekstrem (lapis 6).
- Rollback = deploy ulang build v5.0.1 (`httpdocs/*.old-*`), atau
  `git revert` commit ini.
- Bukan perubahan DB/RLS — tidak ada risiko data.

## Pekerjaan tersisa (tidak berubah dari v5.0.1)

- Uji PM: idle ±1 jam lalu buka DOLPHIN + login ulang Google (dua skenario
  502: `/?code=` dan refresh).
- Keputusan PM: hapus aset UNUSED; drop `whitelist_dosen`; bersihkan
  `page - Copy.tsx`, `backup.txt`, ZIP lama.
- Opsional: buffer nginx per-vhost (pertahanan tambahan).
- Next 16: `middleware.ts` → `proxy.ts` (warning deprecation di build).

## Referensi GitHub

- Repository: https://github.com/weblabperikananpolinela/Lab-perikanan-polinela
- Branch: `master`
- Commit v5.0.2: (diisi setelah commit)
- Commit v5.0.1 (dasar): `473c9b4`
