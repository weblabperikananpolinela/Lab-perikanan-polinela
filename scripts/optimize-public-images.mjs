/**
 * Mengubah aset gambar publik ke WebP terkompresi untuk rilis v5.0.1.
 *
 * Script ini hanya menghasilkan file .webp baru, tidak pernah menimpa atau
 * menghapus file sumber. Penggantian referensi dan penghapusan sumber lama
 * dilakukan setelah hasil visual/build diverifikasi.
 *
 * Jalankan: node scripts/optimize-public-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');

const TASKS = [
  // Brand: cukup 512px untuk tampilan navbar/footer dan favicon metadata.
  { input: 'logo_dolphin.png', width: 512, quality: 82 },

  // Hero full-width: 1920px tetap tajam di desktop tanpa file asli besar.
  { input: 'banner/hero-1.jpg', width: 1920, quality: 80 },
  { input: 'banner/hero-2.jpg', width: 1920, quality: 80 },
  { input: 'banner/hero-3.jpg', width: 1920, quality: 80 },
  { input: 'banner/hero-4.jpg', width: 1920, quality: 80 },

  // Gallery/organisasi muncul maksimal sekitar 640px.
  { input: 'gallery-1.jpg', width: 960, quality: 78 },
  { input: 'gallery-2.jpg', width: 960, quality: 78 },
  { input: 'gallery-3.jpg', width: 960, quality: 78 },
  { input: 'gallery-4.jpg', width: 960, quality: 78 },
  { input: 'gallery-5.jpg', width: 960, quality: 78 },
  { input: 'gallery-6.jpg', width: 960, quality: 78 },

  { input: 'foto-organisasi/organisasi-1.jpg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-2.jpg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-3.jpg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-4.jpeg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-5.png', width: 800, quality: 80 },
  { input: 'foto-organisasi/org-6.jpeg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-7.png', width: 800, quality: 80 },
  { input: 'foto-organisasi/org-8.png', width: 800, quality: 80 },
  { input: 'foto-organisasi/org-9.png', width: 800, quality: 80 },
  { input: 'foto-organisasi/org-10.jpeg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-11.jpeg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-12.jpeg', width: 800, quality: 78 },
  { input: 'foto-organisasi/org-13.png', width: 800, quality: 80 },
  { input: 'foto-organisasi/org-14.jpeg', width: 800, quality: 78 },

  // Marquee dokumentasi: lebar render <= 320px; 800px aman untuk retina.
  ...Array.from({ length: 13 }, (_, i) => {
    const num = i + 1;
    const ext = [9, 10, 11, 12].includes(num) ? 'jpeg' : 'jpg';
    return { input: `dokumentasi/foto-${num}.${ext}`, width: 800, quality: 76 };
  }),
];

const bytes = (n) => `${(n / 1024).toFixed(0)} KB`;
let before = 0;
let after = 0;

for (const task of TASKS) {
  const input = path.join(PUBLIC_DIR, task.input);
  const output = input.replace(/\.(jpe?g|png)$/i, '.webp');
  if (!fs.existsSync(input)) {
    console.warn(`SKIP (tidak ada): ${task.input}`);
    continue;
  }

  const inputSize = fs.statSync(input).size;
  await sharp(input)
    .rotate()
    .resize({ width: task.width, withoutEnlargement: true })
    .webp({ quality: task.quality, effort: 6, smartSubsample: true })
    .toFile(output);

  const outputSize = fs.statSync(output).size;
  before += inputSize;
  after += outputSize;
  console.log(
    `${task.input} → ${path.relative(PUBLIC_DIR, output)}: ${bytes(inputSize)} → ${bytes(outputSize)}`,
  );
}

console.log('\n=== RINGKASAN WEBP ===');
console.log(`Sumber : ${bytes(before)}`);
console.log(`WebP   : ${bytes(after)}`);
console.log(`Hemat  : ${bytes(before - after)} (${((1 - after / before) * 100).toFixed(1)}%)`);
