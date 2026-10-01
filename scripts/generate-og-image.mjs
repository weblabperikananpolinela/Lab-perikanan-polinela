import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const SOURCE = path.join(PUBLIC, 'logo_dolphin.webp');
const OUT = path.join(PUBLIC, 'og-image.png');

const W = 1200;
const H = 630;
const INK = '#102a43';
const CYAN = '#11a5a5';
const SOFT = '#b9d7e5';

/** Escape teks agar aman di dalam SVG. */
function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Logo tidak ditemukan: ${SOURCE}`);
  }

  // Logo transparan 200x200 untuk kanvas OG.
  const logo = await sharp(SOURCE)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const logoB64 = logo.toString('base64');

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${INK}"/>
      <stop offset="100%" stop-color="#0b3a56"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1080" cy="90" r="230" fill="none" stroke="${CYAN}" stroke-opacity="0.18" stroke-width="2"/>
  <circle cx="1080" cy="90" r="180" fill="none" stroke="${CYAN}" stroke-opacity="0.10" stroke-width="26"/>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${CYAN}"/>
  <image x="80" y="205" width="200" height="200" href="data:image/png;base64,${logoB64}"/>
  <text x="330" y="268" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#e6fffa">${esc('Lab Perikanan')}</text>
  <text x="330" y="342" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="${CYAN}">${esc('Polinela')}</text>
  <text x="332" y="404" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="27" fill="${SOFT}">${esc('Jurusan Perikanan dan Kelautan')}</text>
  <text x="332" y="442" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="27" fill="${SOFT}">${esc('Politeknik Negeri Lampung')}</text>
  <text x="332" y="512" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="#7fe7d6">${esc('DOLPHIN · dolphinperikanan.polinela.ac.id')}</text>
</svg>`;

  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);

  const { size } = fs.statSync(OUT);
  console.log(`og-image.png  : ${W}x${H} · ${(size / 1024).toFixed(1)} KB`);
  if (size > 300 * 1024) {
    console.warn('PERINGATAN: og-image > 300 KB — pertimbangkan kompresi lebih kuat.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
