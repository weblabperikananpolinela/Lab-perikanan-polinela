/**
 * Sumber tunggal data laboratorium & teaching factory (v5.8.0).
 *
 * Sebelumnya tiap halaman punya `labMap` hardcode 18 lab; sekarang nama lab
 * dibaca dari tabel `laboratorium` sehingga Lab/TEFA baru otomatis muncul
 * di seluruh situs tanpa menyentuh kode.
 *
 * Aturan akses:
 * - Row publik (anon / authenticated non-system-admin) hanya melihat
 *   `is_active = true`; policy SELECT publik sudah memfilter di sisi DB.
 * - System admin (`is_system_admin()`) melihat semua lab termasuk
 *   nonaktif, dipakai grid "Semua Lab" di /admin/system.
 */

export type LabJenis = 'Laboratorium' | 'TEFA';
export type LabKategori = 'Lab Perikanan' | 'Lab Perikanan Tangkap';

export const KATEGORI_LAB: LabKategori[] = [
  'Lab Perikanan',
  'Lab Perikanan Tangkap',
];

export const JENIS_LAB: LabJenis[] = ['Laboratorium', 'TEFA'];

export interface LabRow {
  id: number;
  nama_lab: string;
  jenis: string;
  kategori: string;
  pj_nama: string | null;
  pj_email: string | null;
  pj_foto_url: string | null;
  is_active: boolean;
}

/** Kolom yang selalu diambil di mana pun (hemat egress). */
export const LAB_COLUMNS =
  'id, nama_lab, jenis, kategori, pj_nama, pj_email, pj_foto_url, is_active';

import { LAB_MAP } from '@/lib/lab-map';

type SupabaseLike = {
  from: (table: string) => any;
};

/**
 * Ambil daftar lab. RLS sudah menyembunyikan lab nonaktif untuk role biasa;
 * pemanggil sistem admin memakai `semua: true` untuk melihat nonaktif.
 */
export async function fetchLabs(
  supabase: SupabaseLike,
  { semua = false }: { semua?: boolean } = {},
): Promise<LabRow[]> {
  let query = supabase
    .from('laboratorium')
    .select(LAB_COLUMNS)
    .order('id', { ascending: true });

  if (!semua) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as LabRow[];
}

let cacheKey: string | null = null;
let cacheValue: LabRow[] | null = null;
let cachePromise: Promise<LabRow[]> | null = null;

/**
 * Fetch lab untuk komponen client dengan cache per-session (dibatalkan
 * saat halaman di-reload, sehingga disable/enable terasa langsung).
 */
export function fetchLabsCached(
  supabase: SupabaseLike,
  { semua = false }: { semua?: boolean } = {},
): Promise<LabRow[]> {
  const key = semua ? 'semua' : 'aktif';
  if (cacheKey === key && cacheValue) return Promise.resolve(cacheValue);
  if (cacheKey === key && cachePromise) return cachePromise;

  cacheKey = key;
  cachePromise = fetchLabs(supabase, { semua })
    .then((rows) => {
      cacheValue = rows;
      return rows;
    })
    .finally(() => {
      cachePromise = null;
    });
  return cachePromise;
}

/** Kosongkan cache (dipanggil setelah admin menambah/menonaktifkan lab). */
export function invalidateLabsCache(): void {
  cacheKey = null;
  cacheValue = null;
  cachePromise = null;
}

export function jenisLabel(jenis: string | null | undefined): 'TEFA' | 'LAB' {
  return jenis === 'TEFA' ? 'TEFA' : 'LAB';
}

export function displayLabName(
  lab: Pick<LabRow, 'id' | 'nama_lab'> | null | undefined,
): string {
  if (!lab) return '-';
  return lab.nama_lab || `Lab #${lab.id}`;
}

/**
 * Nama lab dari daftar aktif, dengan fallback ke peta statis 18 lab lama.
 *
 * Dipakai halaman publik yang menampilkan data lama: bila lab sudah
 * dinonaktifkan (RLS menyembunyikannya), nama lamanya tetap tampil alih-alih
 * berubah menjadi "Lab Tidak Diketahui".
 */
export function resolveLabName(
  labs: LabRow[],
  id: number | null | undefined,
): string {
  if (id == null) return '-';
  const found = labs.find((l) => l.id === id);
  if (found) return found.nama_lab;
  return LAB_MAP[id] ?? `Lab #${id}`;
}

// Peta nama 18 lab lama (data historis sebelum tabel jadi sumber tunggal) —
// diimpor dari lib/lab-map.ts agar tidak ada dua sumber terpisah.

