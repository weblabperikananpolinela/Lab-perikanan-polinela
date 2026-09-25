// Edge-case: nama/email Google sangat panjang → pastikan tetap 1 chunk.
import { createChunks, stringToBase64URL, stringFromBase64URL } from '@supabase/ssr';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'tmp-slimedge');
fs.mkdirSync(OUT, { recursive: true });
const r = spawnSync('npx', ['tsc', 'lib/supabase/slim-session.ts', '--outDir', OUT, '--module', 'commonjs', '--target', 'es2020', '--moduleResolution', 'node', '--skipLibCheck', '--esModuleInterop'], { cwd: ROOT, encoding: 'utf8', shell: true });
if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
const require = createRequire(import.meta.url);
const { slimCookieWrites } = require(path.join(OUT, 'slim-session.js'));

const base = 'sb-dknnzawhsrqbtblnmoll-auth-token';
const LONG_NAME = 'Dolphin Perikanan Polinela Teknologi Akuakultur Budidaya Air Tawar Dan Laut Program Studi '.repeat(8);
const LONG_EMAIL = 'teknologi.akuakultur.budidaya.air.tawar.dan.laut.semester.lima.kelas.a.pagi.satu'.repeat(3) + '@polinela.ac.id';

function build(name, email) {
  const meta = { iss: 'https://accounts.google.com', sub: '109694026982840069955', name, email, picture: 'https://lh3.googleusercontent.com/a/x=s96-c', full_name: name, avatar_url: 'https://lh3.googleusercontent.com/a/x=s96-c', provider_id: '109694026982840069955', custom_claims: { hd: 'polinela.ac.id' }, email_verified: true, phone_verified: false };
  return {
    access_token: 'eyJhbGciOiJIUzI1NiJ9.' + 'A'.repeat(1369) + '.' + 'B'.repeat(43),
    token_type: 'bearer', expires_in: 3600, expires_at: 1790000000,
    refresh_token: 'v1.' + 'r'.repeat(44),
    provider_token: 'ya29.' + 'z'.repeat(1300),
    provider_refresh_token: 'ya29.refresh.' + 'w'.repeat(700),
    user: {
      id: '75e5441c-483c-4206-8a74-fb34f5848845', aud: 'authenticated', role: 'authenticated',
      email, email_confirmed_at: '2026-09-24T10:00:00Z', phone: '', confirmed_at: '2026-09-24T10:00:00Z',
      last_sign_in_at: '2026-09-25T06:21:47Z', app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: meta,
      identities: [{ identity_id: 'x', id: '109694026982840069955', user_id: 'x', identity_data: meta, provider: 'google', last_sign_in_at: 'x', created_at: 'x', updated_at: 'x', email }],
      created_at: '2026-09-24T10:00:00Z', updated_at: '2026-09-25T06:21:47Z', is_anonymous: false,
    },
  };
}

let fail = 0;
for (const [label, name, email] of [
  ['normal', 'Dolphin Perikanan Polinela', 'dolphinperikanan@polinela.ac.id'],
  ['nama panjang', LONG_NAME, 'dolphinperikanan@polinela.ac.id'],
  ['email panjang', 'Dolphin Perikanan Polinela', LONG_EMAIL],
  ['keduanya panjang', LONG_NAME, LONG_EMAIL],
]) {
  const raw = 'base64-' + stringToBase64URL(JSON.stringify(build(name, email)));
  const chunks = createChunks(base, raw);
  const writes = chunks.map((c) => ({ name: c.name, value: c.value, options: { path: '/' } }));
  const slimmed = slimCookieWrites(writes);
  const live = (slimmed ?? []).filter((c) => c.value);
  const joined = live.map((c) => c.value).join('');
  const after = createChunks(base, joined);
  const dec = joined ? JSON.parse(stringFromBase64URL(joined.slice(7))) : {};
  const nameAfter = dec.user?.user_metadata?.full_name || dec.user?.user_metadata?.name || '(dibuang → fallback email)';
  const ok = after.length === 1 && joined.length < 3180;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(16)} fat=${chunks.length}ch → slim=${after.length}ch  len=${joined.length}  email="${dec.user?.email}"  name="${String(nameAfter).slice(0, 40)}"`);
}
process.exit(fail ? 1 : 0);
