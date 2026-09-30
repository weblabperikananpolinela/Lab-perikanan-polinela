/**
 * Tipe & fallback dokumen publik (SOP + SK LAB).
 *
 * Dipakai halaman publik dan panel System Admin. Data sebenarnya ada di tabel
 * `public.dokumen`; fallback di sini menjaga halaman tetap terisi bila
 * database tidak terbaca atau kategori masih kosong.
 */

export const KATEGORI_DOKUMEN = ['sop-perikanan', 'sop-tangkap', 'sk-lab'] as const;

export type KategoriDokumen = (typeof KATEGORI_DOKUMEN)[number];

export type DokumenRow = {
  id: number;
  kategori: KategoriDokumen;
  judul: string;
  nomor: string | null;
  tanggal: string | null;
  deskripsi: string | null;
  file_url: string;
  file_type: string | null;
  is_visible: boolean;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
};

export const KATEGORI_LABEL: Record<KategoriDokumen, string> = {
  'sop-perikanan': 'SOP Lab. Perikanan',
  'sop-tangkap': 'SOP Lab. Perikanan Tangkap',
  'sk-lab': 'SK Lab',
};

/** Judul, ukuran file, dan tautan untuk berkas seed di `public/dokumen/`. */
type SeedItem = { judul: string; size: string; href: string };

export const FALLBACK_SOP_PERIKANAN: SeedItem[] = [
  {
    judul: 'SOP Pemeliharaan dan Perbaikan Alat-Alat Laboratorium Perikanan',
    size: 'PDF Document',
    href: '/dokumen/SOP Pemeliharaan dan Perbaikan Alat-Alat Laboratorium Perikanan.pdf',
  },
  {
    judul: 'SOP Peminjaman Alat dan Penggunaan Bahan untuk Penelitian',
    size: 'PDF Document',
    href: '/dokumen/SOP Peminjaman Alat dan Penggunaan Bahan untuk Penelitian.pdf',
  },
  {
    judul: 'SOP Penanganan Limbah Laboratorium Perikanan',
    size: 'PDF Document',
    href: '/dokumen/SOP Penanganan Limbah Laboratorium Perikanan .pdf',
  },
  {
    judul: 'STANDAR OPERASIONAL PROSEDUR (Umum)',
    size: 'PDF Document',
    href: '/dokumen/STANDAR OPERASIONAL PROSEDUR OK.pdf',
  },
];

export const FALLBACK_SOP_TANGKAP: SeedItem[] = [
  {
    judul: 'SOP Manajemen Laboratorium',
    size: '324 KB',
    href: '/dokumen/SOP MANAJEMEN LABORATORIUM.pdf',
  },
  {
    judul: 'SOP Pengelolaan Limbah',
    size: '325 KB',
    href: '/dokumen/SOP PENGELOLAAN LIMBAH.pdf',
  },
  {
    judul: 'SOP Penggunaan Lab untuk Praktikum',
    size: '337 KB',
    href: '/dokumen/SOP PENGGUNAAN LAB UNTUK PRAKTIKUM.pdf',
  },
  {
    judul: 'SOP Penggunaan Lab untuk Penelitian',
    size: '338 KB',
    href: '/dokumen/SOP PENGGUNAAN LAB UNTUK PENELITIAN.pdf',
  },
  {
    judul: 'SOP Pengusulan Pengadaan Alat & Bahan',
    size: '297 KB',
    href: '/dokumen/SOP PENGUSULAN PENGADAAN ALAT DAN BAHAN LABORATORIUM.pdf',
  },
  {
    judul: 'SOP Pemeliharaan, Perbaikan & Kalibrasi Alat',
    size: '280 KB',
    href: '/dokumen/SOP PEMELIHARAAN, PERBAIKAN, DAN KALIBRASI ALAT.pdf',
  },
  {
    judul: 'SOP Evaluasi Kepuasan Pengguna',
    size: '323 KB',
    href: '/dokumen/SOP EVALUASI KEPUASAN PENGGUNA.pdf',
  },
  {
    judul: 'SOP Jadwal Pemeliharaan dan Perawatan',
    size: '314 KB',
    href: '/dokumen/SOP JADWAL PEMELIHARAAN DAN PERAWATAN.pdf',
  },
  {
    judul: 'SOP Peminjaman dan Pengembalian Alat',
    size: '310 KB',
    href: '/dokumen/SOP Peminjaman dan Pengembalian alat.pdf',
  },
];

export type PublicDocItem = {
  id: string | number;
  judul: string;
  sub: string | null;
  deskripsi: string | null;
  href: string;
};

export function dokumenToItem(row: DokumenRow): PublicDocItem {
  const bagian: string[] = [];
  if (row.nomor) bagian.push(`Nomor ${row.nomor}`);
  if (row.tanggal) {
    try {
      bagian.push(
        new Date(row.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      );
    } catch {
      bagian.push(row.tanggal);
    }
  }
  return {
    id: row.id,
    judul: row.judul,
    sub: bagian.length > 0 ? bagian.join(' · ') : 'PDF Document',
    deskripsi: row.deskripsi,
    href: row.file_url,
  };
}

export const FALLBACK_BY_KATEGORI: Record<KategoriDokumen, SeedItem[]> = {
  'sop-perikanan': FALLBACK_SOP_PERIKANAN,
  'sop-tangkap': FALLBACK_SOP_TANGKAP,
  'sk-lab': [],
};

/**
 * Ambil dokumen publik satu kategori. Mengembalikan daftar kosong bila
 * query gagal — pemanggil yang memutuskan memakai fallback statis.
 */
export async function fetchDokumenPublik(
  supabase: {
    from: (table: string) => any;
  },
  kategori: KategoriDokumen,
): Promise<DokumenRow[]> {
  const { data, error } = await supabase
    .from('dokumen')
    .select(
      'id, kategori, judul, nomor, tanggal, deskripsi, file_url, file_type, is_visible, sort_order, uploaded_by, created_at',
    )
    .eq('kategori', kategori)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []) as DokumenRow[];
}
