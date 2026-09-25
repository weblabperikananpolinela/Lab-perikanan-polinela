/**
 * Asset audit untuk DOLPHIN.
 *
 * Memindai setiap file di public/ dan mencari referensinya di source code,
 * lalu melaporkan mana yang terpakai, tidak terpakai, atau hanya terpakai
 * lewat manifest/PWA. Read-only: tidak mengubah file apa pun.
 *
 * Jalankan: node scripts/audit-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');

// docs/ sengaja tidak dipindai: dokumentasi bukan kode yang dieksekusi, dan
// output audit sebelumnya di docs/ dapat membuat semua aset tampak "terpakai".
const SOURCE_DIRS = ['app', 'components', 'lib', 'worker'];
const SOURCE_FILES = [
  'next.config.mjs',
  'package.json',
  'middleware.ts',
  path.join('public', 'manifest.json'),
];

// File yang di-generate build & tidak perlu diaudit sebagai "aset konten".
const GENERATED = [
  /^sw\.js$/,
  /^workbox-.*\.js$/,
  /^worker-.*\.js$/,
  /^fallback-.*\.js$/,
  /^swe-worker-.*\.js$/,
];

// Aset yang di-referensikan browser secara implisit (manifest, metadata,
// favicon otomatis). Tidak muncul sebagai string di source tapi tetap dipakai.
const IMPLICIT = [
  /^manifest\.json$/,
  /^apple-icon\.png$/,
  /^icon-\d+x\d+\.png$/,
  /^icon\.svg$/,
  /^favicon\.ico$/,
  /^robots\.txt$/,
];

// Folder yang dibaca secara dinamis saat runtime (fs.readdirSync), sehingga
// isinya dipakai walau tidak muncul sebagai string path di source.
const DYNAMIC_DIRS = ['dokumentasi/'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function collectSourceText() {
  const chunks = [];
  for (const dir of SOURCE_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      if (!/\.(ts|tsx|js|jsx|mjs|cjs|json|css|md|html)$/.test(file)) continue;
      try {
        chunks.push(fs.readFileSync(file, 'utf8'));
      } catch {
        /* ignore unreadable files */
      }
    }
  }
  for (const file of SOURCE_FILES) {
    const full = path.join(ROOT, file);
    if (fs.existsSync(full)) {
      try {
        chunks.push(fs.readFileSync(full, 'utf8'));
      } catch {
        /* ignore */
      }
    }
  }
  return chunks.join('\n');
}

const sourceText = collectSourceText();
const sourceTextDecoded = (() => {
  // Source bisa memuat URL ter-encode (mis. %20 untuk spasi pada nama SOP).
  try {
    return decodeURIComponent(sourceText);
  } catch {
    return sourceText;
  }
})();

const publicFiles = walk(PUBLIC_DIR).sort();

const rows = publicFiles.map((full) => {
  const rel = '/' + path.relative(PUBLIC_DIR, full).split(path.sep).join('/');
  const relInPublic = path.relative(PUBLIC_DIR, full).split(path.sep).join('/');
  const base = path.basename(full);
  const size = fs.statSync(full).size;

  const isGenerated = GENERATED.some((r) => r.test(base));
  const isImplicit = IMPLICIT.some((r) => r.test(base));
  const isDynamicDir = DYNAMIC_DIRS.some((d) => relInPublic.startsWith(d));
  // Dokumen halaman SOP membangun URL dengan prefix /dokumen/ saat runtime.
  // Karena source legacy menyimpan nama file tanpa prefix, tandai sebagai USED
  // hanya jika nama file tersebut memang berada di folder dokumen.
  const isReferencedDocument =
    relInPublic.startsWith('dokumen/') && sourceText.includes(base);

  // Referensi eksplisit: path lengkap muncul di source. Base filename juga
  // dicocokkan karena komponen legacy dapat membentuk folder URL di runtime.
  const referencedByPath =
    sourceText.includes(rel) || sourceTextDecoded.includes(rel);

  // Referensi via nama file saja (mis. import atau pembentukan path dinamis).
  const referencedByBase = sourceText.includes(base);

  let status;
  if (isGenerated) status = 'GENERATED';
  else if (referencedByPath || isReferencedDocument) status = 'USED';
  else if (isDynamicDir) status = 'DYNAMIC';
  else if (isImplicit) status = 'IMPLICIT';
  else if (referencedByBase) status = 'PARTIAL';
  else status = 'UNUSED';

  return { rel, base, size, status };
});

// Deteksi referensi rusak: path di source yang menunjuk ke public/ tetapi
// filenya tidak ada (mis. "/SOP ...pdf" tanpa prefix /dokumen).
const REF_REGEX =
  /["'`](\/[A-Za-z0-9 _.,()&%-]+\.(?:pdf|jpg|jpeg|png|svg|webp|ico|json|woff2?))["'`]/g;
const brokenRefs = new Map();
for (const match of sourceTextDecoded.matchAll(REF_REGEX)) {
  const ref = match[1];
  // Lewati path Next.js internal, API, placeholder JSX input, dan path
  // yang memang dibentuk sebagai fallback URL tidak valid oleh komponen lama.
  if (
    ref.startsWith('/_next/') ||
    ref.startsWith('/api/') ||
    ref === '/SOP ...pdf'
  ) continue;
  const exists = publicFiles.some((f) => {
    const r = '/' + path.relative(PUBLIC_DIR, f).split(path.sep).join('/');
    // URL SOP lama tanpa /dokumen/ juga dianggap valid untuk kompatibilitas
    // dengan source legacy; page viewer kini sudah memakai URL yang benar.
    return r === ref || (ref.startsWith('/SOP ') && r === `/dokumen${ref}`);
  });
  if (!exists) {
    const count = brokenRefs.get(ref) ?? 0;
    brokenRefs.set(ref, count + 1);
  }
}

const byStatus = rows.reduce((acc, r) => {
  (acc[r.status] ??= []).push(r);
  return acc;
}, {});

const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

console.log('=== ASSET AUDIT DOLPHIN ===\n');
console.log(`Total file public/: ${rows.length}`);
console.log(`Total ukuran: ${mb(rows.reduce((a, r) => a + r.size, 0))}\n`);

for (const status of [
  'USED',
  'DYNAMIC',
  'IMPLICIT',
  'PARTIAL',
  'UNUSED',
  'GENERATED',
]) {
  const list = byStatus[status] ?? [];
  if (list.length === 0) continue;
  const total = list.reduce((a, r) => a + r.size, 0);
  console.log(`--- ${status} (${list.length} file, ${mb(total)}) ---`);
  for (const r of list.sort((a, b) => b.size - a.size)) {
    console.log(`  ${kb(r.size).padStart(8)}  ${r.rel}`);
  }
  console.log();
}

if (brokenRefs.size > 0) {
  console.log(
    `--- BROKEN REFERENCES (${brokenRefs.size} path direferensikan tapi tidak ada) ---`,
  );
  for (const [ref, count] of [...brokenRefs.entries()].sort()) {
    console.log(`  ${String(count).padStart(3)}x  ${ref}`);
  }
  console.log();
}

const unusedTotal = (byStatus.UNUSED ?? []).reduce((a, r) => a + r.size, 0);
console.log(`Kandidat hapus (UNUSED): ${mb(unusedTotal)}`);

// --- Analisis precache PWA ---
// Pola ini harus SAMA dengan `publicExcludes` di next.config.mjs. Aset yang
// cocok TIDAK akan masuk precache Workbox (hanya diambil saat dibutuhkan),
// sehingga tidak membebani Cache Storage browser.
const PRECACHE_EXCLUDED = [
  /^\/dokumen\//,
  /^\/banner\//,
  /^\/dokumentasi\//,
  /^\/foto-organisasi\//,
  /^\/jadwal\//,
  /^\/gallery-/,
  /^\/hero-lab-/,
  /^\/logo_dolphin\.png$/,
];

const precacheCandidates = rows.filter(
  (r) =>
    ['USED', 'DYNAMIC', 'IMPLICIT'].includes(r.status) &&
    !PRECACHE_EXCLUDED.some((re) => re.test(r.rel)),
);
const precacheBytes = precacheCandidates.reduce((a, r) => a + r.size, 0);
const excludedBytes = rows
  .filter(
    (r) =>
      ['USED', 'DYNAMIC', 'IMPLICIT'].includes(r.status) &&
      PRECACHE_EXCLUDED.some((re) => re.test(r.rel)),
  )
  .reduce((a, r) => a + r.size, 0);

console.log(`\n--- ESTIMASI PRECACHE PWA ---`);
console.log(`Masuk precache  : ${precacheCandidates.length} file, ${mb(precacheBytes)}`);
console.log(`Dikecualikan    : ${mb(excludedBytes)} (diambil on-demand)`);
console.log('\nFile yang dikecualikan dari precache (hanya yang masih dipakai):');
for (const r of rows
  .filter(
    (r) =>
      PRECACHE_EXCLUDED.some((re) => re.test(r.rel)) &&
      ['USED', 'DYNAMIC', 'IMPLICIT'].includes(r.status),
  )
  .sort((a, b) => b.size - a.size)) {
  console.log(`  ${kb(r.size).padStart(8)}  ${r.rel}`);
}

// Output JSON untuk dipakai laporan HTML.
const json = {
  generatedAt: new Date().toISOString(),
  totalFiles: rows.length,
  totalBytes: rows.reduce((a, r) => a + r.size, 0),
  brokenRefs: [...brokenRefs.entries()]
    .sort()
    .map(([ref, count]) => ({ ref, count })),
  precache: {
    includedFiles: precacheCandidates.length,
    includedBytes: precacheBytes,
    excludedBytes,
  },
  groups: Object.fromEntries(
    Object.entries(byStatus).map(([k, v]) => [
      k,
      {
        count: v.length,
        bytes: v.reduce((a, r) => a + r.size, 0),
        files: v
          .sort((a, b) => b.size - a.size)
          .map((r) => ({ path: r.rel, bytes: r.size })),
      },
    ]),
  ),
};
fs.writeFileSync(
  path.join(ROOT, 'docs', 'patch-log', 'asset-audit.json'),
  JSON.stringify(json, null, 2),
);
console.log('\nJSON ditulis ke docs/patch-log/asset-audit.json');
