export type HeroBanner = { url: string; alt: string };
export type Pimpinan = {
  jabatan: string;
  nama: string;
  email: string;
  foto_url: string;
};
export type LabPj = {
  id: number;
  nama_lab: string;
  jenis: string | null;
  kategori: string | null;
  pj_nama: string | null;
  pj_email: string | null;
  pj_foto_url: string | null;
};

export const FALLBACK_HERO: HeroBanner[] = [
  { url: '/banner/hero-1.webp', alt: 'Laboratorium 1' },
  { url: '/banner/hero-2.webp', alt: 'Laboratorium 2' },
  { url: '/banner/hero-3.webp', alt: 'Laboratorium 3' },
  { url: '/banner/hero-4.webp', alt: 'Laboratorium 4' },
];

export const FALLBACK_PIMPINAN: Pimpinan[] = [
  {
    jabatan: 'Ketua Jurusan',
    nama: 'Pindo Witoko, S.Pi., M.P',
    email: 'pindo@polinela.ac.id',
    foto_url: '/foto-organisasi/organisasi-1.webp',
  },
  {
    jabatan: 'Kepala Lab. Perikanan',
    nama: 'Rahmadi Azis, S.Pi., M.Si',
    email: 'rahmadi@polinela.ac.id',
    foto_url: '/foto-organisasi/org-2.webp',
  },
  {
    jabatan: 'Kepala Lab. Perikanan Tangkap',
    nama: 'Dona Setya, S.Tr.Pi., M.Si',
    email: 'dona@polinela.ac.id',
    foto_url: '/foto-organisasi/org-4.webp',
  },
];

export const FALLBACK_DOKUMENTASI = [
  '/dokumentasi/foto-1.webp',
  '/dokumentasi/foto-2.webp',
];

export function parseHeroBanners(value: unknown): HeroBanner[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const url = typeof row.url === 'string' ? row.url : '';
      if (!url) return null;
      const alt = typeof row.alt === 'string' ? row.alt.slice(0, 120) : 'Banner DOLPHIN';
      return { url, alt };
    })
    .filter((row): row is HeroBanner => Boolean(row))
    .slice(0, 6);
}

export function parsePimpinan(value: unknown): Pimpinan[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const jabatan = typeof row.jabatan === 'string' ? row.jabatan : '';
      const nama = typeof row.nama === 'string' ? row.nama : '';
      if (!jabatan || !nama) return null;
      return {
        jabatan,
        nama,
        email: typeof row.email === 'string' ? row.email : '',
        foto_url: typeof row.foto_url === 'string' ? row.foto_url : '',
      };
    })
    .filter((row): row is Pimpinan => Boolean(row))
    .slice(0, 3);
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
