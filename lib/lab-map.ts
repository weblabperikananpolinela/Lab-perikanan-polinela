/**
 * Sumber tunggal nama 18 lab — dipakai export Excel (v5.7.0) agar tidak
 * menambah duplikasi labMap ke-11. Refactor semua file yang masih punya
 * labMap sendiri akan menyusul (di luar scope v5.7.0).
 */
export const LAB_MAP: Record<number, string> = {
  1: 'Lab. Kesehatan Ikan',
  2: 'Lab. Kualitas Air',
  3: 'Lab. Pengolahan',
  4: 'Bangsal Pakan Alami',
  5: 'Lab. Perikanan (SFS)',
  6: 'Lab. Pembenihan',
  7: 'Lab. Ikan Hias',
  8: 'Lab. Nutrisi',
  9: 'Polyfeed',
  10: 'Politeknik Ornamental Fish Farm (POFA)',
  11: 'Galangan Kapal',
  12: 'Alat Tangkap Ikan',
  13: 'KJA',
  14: 'FISHTECH',
  15: 'FISH MARKET',
  16: 'Polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

/** Nama lab dari id, dengan fallback aman bila id tidak dikenal. */
export function labName(labId: number | null | undefined): string {
  if (labId == null) return '-';
  return LAB_MAP[labId] ?? `Lab #${labId}`;
}

/** Nama lab untuk nama file: tanpa spasi/karakter berbahaya. */
export function labSlug(labId: number): string {
  return (LAB_MAP[labId] ?? `Lab-${labId}`)
    .replace(/^Lab\.\s*/i, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
