/**
 * Regression check: pastikan sesi Supabase selalu muat dalam SATU cookie chunk.
 *
 * Latar belakang: setelah idle ~1 jam, refresh JWT menulis session baru yang
 * memuat `user.identities` (duplikat profil Google). Session itu lewat batas
 * 3180 char → 2 Set-Cookie → melebihi buffer nginx → HTTP 502
 * ("upstream sent too big header"). Helper `slimSessionValue()` membuang
 * field berat itu sehingga cookie kembali ke 1 chunk.
 *
 * Jalankan: node scripts/check-session-cookie.mjs
 * Exit code 1 bila regresi terdeteksi.
 */
import { createChunks, stringFromBase64URL, stringToBase64URL } from '@supabase/ssr';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'tmp-slimtest');
const MAX_CHUNK_SIZE = 3180;

function compileHelper() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const result = spawnSync(
    'npx',
    [
      'tsc',
      'lib/supabase/slim-session.ts',
      '--outDir',
      OUT,
      '--module',
      'commonjs',
      '--target',
      'es2020',
      '--moduleResolution',
      'node',
      '--skipLibCheck',
      '--esModuleInterop',
    ],
    { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) {
    console.error('Gagal meng-compile slim-session.ts');
    console.error(result.stdout, result.stderr);
    process.exit(1);
  }
  return path.join(OUT, 'slim-session.js');
}

const require = createRequire(import.meta.url);
const helperPath = compileHelper();
const { slimCookieWrites } = require(helperPath);

const base = 'sb-dknnzawhsrqbtblnmoll-auth-token';

/**
 * Metadata NYATA dari auth.users (dolphinperikanan@polinela.ac.id).
 * Inilah yang membuat sesi tetap 2 chunk setelah slim v5.0.1: URL foto
 * Google ganda (picture + avatar_url), iss, sub, provider_id, custom_claims.
 */
const realUserMetadata = {
  iss: 'https://accounts.google.com',
  sub: '109694026982840069955',
  name: 'Dolphin Perikanan Polinela',
  email: 'dolphinperikanan@polinela.ac.id',
  picture:
    'https://lh3.googleusercontent.com/a/ACg8ocKutoiYB6QC2CeKbF9B2c2Mkm40g6A1yBVKrLAQiJa6WuC4iw=s96-c',
  full_name: 'Dolphin Perikanan Polinela',
  avatar_url:
    'https://lh3.googleusercontent.com/a/ACg8ocKutoiYB6QC2CeKbF9B2c2Mkm40g6A1yBVKrLAQiJa6WuC4iw=s96-c',
  provider_id: '109694026982840069955',
  custom_claims: { hd: 'polinela.ac.id' },
  email_verified: true,
  phone_verified: false,
};

const realUserId = '75e5441c-483c-4206-8a74-fb34f5848845';

// Access token JWT sepanjang nyata (payload memuat user_metadata).
const realAccessToken =
  'eyJhbGciOiJIUzI1NiJ9.' + 'A'.repeat(1369) + '.' + 'B'.repeat(43);

// Sesi seperti hasil `getUser()` refresh setelah idle ~1 jam.
const fatSession = {
  access_token: realAccessToken,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 1790000000,
  refresh_token: 'v1.' + 'r'.repeat(44),
  provider_token: 'ya29.' + 'z'.repeat(1300),
  provider_refresh_token: 'ya29.refresh.' + 'w'.repeat(700),
  user: {
    id: realUserId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'dolphinperikanan@polinela.ac.id',
    email_confirmed_at: '2026-09-24T10:00:00Z',
    phone: '',
    confirmed_at: '2026-09-24T10:00:00Z',
    last_sign_in_at: '2026-09-25T06:21:47Z',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: realUserMetadata,
    identities: [
      {
        identity_id: 'f0e1d2c3-b4a5-4687-9789-0123456789ab',
        id: '109694026982840069955',
        user_id: realUserId,
        identity_data: realUserMetadata,
        provider: 'google',
        last_sign_in_at: '2026-09-25T06:21:47Z',
        created_at: '2026-09-24T10:00:00Z',
        updated_at: '2026-09-25T06:21:47Z',
        email: 'dolphinperikanan@polinela.ac.id',
      },
    ],
    created_at: '2026-09-24T10:00:00Z',
    updated_at: '2026-09-25T06:21:47Z',
    is_anonymous: false,
  },
};

const fatEncoded = 'base64-' + stringToBase64URL(JSON.stringify(fatSession));
const fatChunks = createChunks(base, fatEncoded);

const writes = fatChunks.map((chunk) => ({
  name: chunk.name,
  value: chunk.value,
  options: { path: '/' },
}));

const slimmed = slimCookieWrites(writes);
const failures = [];

if (!slimmed) {
  failures.push('slimCookieWrites() mengembalikan null untuk sesi gemuk');
}

const liveCookies = (slimmed ?? []).filter((cookie) => cookie.value);
const joined = liveCookies
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  .map((cookie) => cookie.value)
  .join('');

const afterChunks = joined ? createChunks(base, joined) : [];
const session = joined ? JSON.parse(stringFromBase64URL(joined.slice('base64-'.length))) : {};

if (afterChunks.length !== 1) {
  failures.push(`sesi masih memakai ${afterChunks.length} chunk (harus 1)`);
}
if (joined.length >= MAX_CHUNK_SIZE) {
  failures.push(`nilai sesi ${joined.length} char melebihi MAX_CHUNK_SIZE ${MAX_CHUNK_SIZE}`);
}
if (session.user?.email !== 'dolphinperikanan@polinela.ac.id') {
  failures.push('user.email hilang setelah dilangsingkan');
}
if (session.provider_token) {
  failures.push('provider_token masih tersimpan di cookie');
}
if (session.user?.identities) {
  failures.push('user.identities masih tersimpan di cookie');
}
if (session.user?.user_metadata?.picture || session.user?.user_metadata?.avatar_url) {
  failures.push('URL foto Google masih tersimpan di cookie');
}
if (session.user?.created_at || session.user?.updated_at || session.user?.last_sign_in_at) {
  failures.push('timestamp user masih tersimpan di cookie');
}
if (session.user?.user_metadata?.full_name !== 'Dolphin Perikanan Polinela') {
  failures.push('user_metadata.full_name hilang setelah dilangsingkan');
}

const expiredNames = (slimmed ?? [])
  .filter((cookie) => !cookie.value)
  .map((cookie) => cookie.name)
  .sort();

console.log('=== CHECK SESSION COOKIE DOLPHIN ===\n');
console.log(`Sesi gemuk        : ${JSON.stringify(fatSession).length} char JSON → ${fatChunks.length} chunk`);
console.log(`Setelah dilangsing: ${joined.length} char → ${afterChunks.length} chunk`);
console.log(`Chunk basi expired: ${expiredNames.join(', ') || '(tidak ada)'}`);
console.log(
  `Ukuran Set-Cookie : ${(liveCookies.reduce((sum, c) => sum + String(c.value).length + c.name.length + 60, 0) / 1024).toFixed(2)} KB`,
);

if (failures.length > 0) {
  console.error('\nFAIL:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('\nPASS: sesi muat dalam 1 chunk, email utuh, field berat dibuang.');
