// Generate favicon & apple touch icon dari logo DOLPHIN.
//
// Sumber tunggal: public/logo_dolphin.webp (512x512, transparan).
// Output:
//   public/favicon.ico      — multi-size (16/32/48) untuk tab browser & bookmark
//   public/apple-icon.png   — 180x180 untuk home screen iOS/iPadOS
//
// ICO dibuat manual dengan payload PNG (PNG-in-ICO). Format ini didukung
// semua browser modern; kita tidak menambah dependency baru.
//
// LATAR TRANSPARAN: sejak v5.2.1 semua ikon memakai alpha (sesuai permintaan
// PM — “semua logo dolphin latarnya transparan”). Catatan: iOS tidak
// mendukung alpha pada apple-icon; area transparan tampil HITAM di home screen.
//
// Jalankan: node scripts/generate-favicons.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const SOURCE = path.join(PUBLIC, 'logo_dolphin.webp');

// ICO_SIZES: favicon.ico multi-size untuk tab browser & bookmark.
// APPLE_SIZE: 180x180 sesuai panduan Apple untuk home screen iOS/iPadOS.
const ICO_SIZES = [16, 32, 48];
const APPLE_SIZE = 180;
// Logo asli punya ruang kosong di tepi; beri sedikit padding agar tidak
// terpotong saat di-crop bulat oleh OS.
const PAD_RATIO = 0.04;
// Latar ikon: TRANSPARAN (alpha 0). Sejak v5.2.1 semua logo DOLPHIN
// memakai latar transparan sesuai permintaan PM.
const ICON_BG = { r: 0, g: 0, b: 0, alpha: 0 };

/** Buat PNG persegi berisi logo, dengan latar transparan dan padding.
 *  `palette: true` memakai indexed-colour (256 warna) yang tetap menyimpan
 *  kanal alpha — ukuran turun dari ~60 KB ke ~17 KB tanpa beda terlihat. */
async function renderPng(size, { palette = false } = {}) {
  const pad = Math.round(size * PAD_RATIO);
  const inner = size - pad * 2;
  const logo = await sharp(SOURCE)
    .resize(inner, inner, { fit: 'contain', background: ICON_BG })
    .png()
    .toBuffer();

  const out = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: ICON_BG,
    },
  }).composite([{ input: logo, top: pad, left: pad }]);

  return out
    .png(
      palette
        ? { compressionLevel: 9, palette: true, colours: 256, dither: 1 }
        : { compressionLevel: 9 }
    )
    .toBuffer();
}

/** Rakit beberapa PNG menjadi satu file .ico (PNG-in-ICO). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;

  entries.forEach(({ size, data }, i) => {
    const at = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, at + 0); // width (0 = 256)
    dir.writeUInt8(size >= 256 ? 0 : size, at + 1); // height
    dir.writeUInt8(0, at + 2); // palette count
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // color planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(data.length, at + 8); // size of image data
    dir.writeUInt32LE(offset, at + 12); // offset of image data
    offset += data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Sumber tidak ditemukan: ${path.relative(ROOT, SOURCE)}`);
  }

  const entries = [];
  for (const size of ICO_SIZES) {
    entries.push({ size, data: await renderPng(size) });
  }

  const icoPath = path.join(PUBLIC, 'favicon.ico');
  fs.writeFileSync(icoPath, buildIco(entries));

  const applePath = path.join(PUBLIC, 'apple-icon.png');
  fs.writeFileSync(applePath, await renderPng(APPLE_SIZE, { palette: true }));

  for (const file of [icoPath, applePath]) {
    const stat = fs.statSync(file);
    console.log(`${path.relative(ROOT, file).replace(/\\/g, '/')}  ${stat.size} B`);
  }
  console.log(`favicon.ico berisi ukuran: ${ICO_SIZES.join(', ')}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
