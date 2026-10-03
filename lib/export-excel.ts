/**
 * Builder workbook Excel untuk export Riwayat & Inventaris per lab (v5.7.0).
 *
 * Murni transformasi data → Buffer xlsx. Fetch DB & otorisasi ada di route
 * handler `app/api/export/*`. Semua nilai ditulis dengan tipe eksplisit
 * (String/Number) sehingga tidak ada risiko formula injection Excel; nilai
 * teks yang diawali karakter berbahaya (`= + - @`) diberi prefix apostrof
 * sebagai lapisan pertahanan kedua (OWASP).
 */
import writeXlsxFile, {
  getSheetData,
  type Column,
  type Sheet,
} from 'write-excel-file/node';

import { labName } from '@/lib/lab-map';

// ---------------------------------------------------------------------------
// Tipe baris (dipakai route handler juga)
// ---------------------------------------------------------------------------

export interface RiwayatExportRow {
  id: number;
  nama_lengkap: string | null;
  kategori_pemohon: string | null;
  judul_kegiatan: string | null;
  lab_id: number | null;
  tanggal: string | null;
  jam_mulai: string | null;
  jam_selesai: string | null;
  status: string | null;
  total_biaya: number | null;
  bukti_pembayaran: string | null;
  pesan_feedback: string | null;
}

export interface DetailExportRow {
  peminjaman_id: number;
  nama_peminjam: string | null;
  nama_alat_bahan: string | null;
  jumlah: number | null;
  jumlah_kembali_baik: number | null;
  jumlah_kembali_rusak_ringan: number | null;
  jumlah_kembali_rusak_berat: number | null;
  catatan_pengembalian: string | null;
}

export interface InventarisExportRow {
  nama_kategori: string | null;
  jenis_alat: string | null;
  spesifikasi: string | null;
  jumlah_baik: number | null;
  jumlah_rusak_ringan: number | null;
  jumlah_rusak_berat: number | null;
  keterangan: string | null;
}

// ---------------------------------------------------------------------------
// Helper cell
// ---------------------------------------------------------------------------

const DANGEROUS_CELL_START = /^[=+\-@]/;

/** Teks aman: null → '', nilai berbahaya diberi prefix apostrof. */
function safeText(value: string | number | null | undefined): string {
  if (value == null) return '';
  const v = String(value);
  return DANGEROUS_CELL_START.test(v) ? `'${v}` : v;
}

/** Cell teks (tidak pernah dievaluasi Excel sebagai formula). */
function text(value: string | number | null | undefined): string {
  return safeText(value);
}

/** Cell angka; null/NaN → string kosong. */
function num(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '';
  return { value, type: Number as NumberConstructor };
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const t = dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function weekdayOf(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const t = dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { weekday: 'long' });
}

/** Normalisasi status lama (`selesai`) → tampilan konsisten. */
function statusLabel(status: string | null): string {
  if (!status) return '';
  return status === 'selesai' ? 'Selesai' : status;
}

const HEADER_STYLE = {
  fontWeight: 'bold' as const,
  backgroundColor: '#1D4ED8',
  color: '#FFFFFF',
};

function header(value: string): { value: string; fontWeight: 'bold'; backgroundColor: string; color: string } {
  return { value, ...HEADER_STYLE };
}

// ---------------------------------------------------------------------------
// Sheet 1: Riwayat (satu baris per peminjaman)
// ---------------------------------------------------------------------------

const riwayatColumns: Column<RiwayatExportRow>[] = [
  { header: header('ID'), width: 8, cell: (r) => num(r.id) },
  { header: header('Tanggal'), width: 12, cell: (r) => text(fmtDate(r.tanggal)) },
  { header: header('Hari'), width: 12, cell: (r) => text(weekdayOf(r.tanggal)) },
  { header: header('Jam Mulai'), width: 11, cell: (r) => text(r.jam_mulai) },
  { header: header('Jam Selesai'), width: 11, cell: (r) => text(r.jam_selesai) },
  { header: header('Nama Peminjam'), width: 24, cell: (r) => text(r.nama_lengkap) },
  { header: header('Kategori Pemohon'), width: 18, cell: (r) => text(r.kategori_pemohon) },
  { header: header('Judul Kegiatan'), width: 34, cell: (r) => text(r.judul_kegiatan) },
  { header: header('Status'), width: 12, cell: (r) => text(statusLabel(r.status)) },
  {
    header: header('Total Biaya'),
    width: 14,
    cell: (r) =>
      r.total_biaya == null
        ? ''
        : { value: r.total_biaya, type: Number as NumberConstructor, format: '#,##0' },
  },
  { header: header('Bukti Pembayaran'), width: 30, cell: (r) => text(r.bukti_pembayaran) },
  { header: header('Pesan Feedback'), width: 30, cell: (r) => text(r.pesan_feedback) },
];

// ---------------------------------------------------------------------------
// Sheet 2: Detail Barang (satu baris per item peminjaman)
// ---------------------------------------------------------------------------

const detailColumns: Column<DetailExportRow>[] = [
  { header: header('ID Peminjaman'), width: 12, cell: (r) => num(r.peminjaman_id) },
  { header: header('Nama Peminjam'), width: 24, cell: (r) => text(r.nama_peminjam) },
  { header: header('Nama Alat/Bahan'), width: 26, cell: (r) => text(r.nama_alat_bahan) },
  { header: header('Jumlah Dipinjam'), width: 13, cell: (r) => num(r.jumlah) },
  { header: header('Kembali Baik'), width: 12, cell: (r) => num(r.jumlah_kembali_baik) },
  { header: header('Rusak Ringan'), width: 11, cell: (r) => num(r.jumlah_kembali_rusak_ringan) },
  { header: header('Rusak Berat'), width: 11, cell: (r) => num(r.jumlah_kembali_rusak_berat) },
  { header: header('Catatan Pengembalian'), width: 30, cell: (r) => text(r.catatan_pengembalian) },
];

// ---------------------------------------------------------------------------
// Sheet Inventaris (satu baris per item)
// ---------------------------------------------------------------------------

const inventarisColumns: Column<InventarisExportRow>[] = [
  { header: header('Kategori'), width: 24, cell: (r) => text(r.nama_kategori) },
  { header: header('Jenis Alat/Bahan'), width: 26, cell: (r) => text(r.jenis_alat) },
  { header: header('Spesifikasi'), width: 30, cell: (r) => text(r.spesifikasi) },
  { header: header('Jumlah Baik'), width: 12, cell: (r) => num(r.jumlah_baik) },
  { header: header('Rusak Ringan'), width: 12, cell: (r) => num(r.jumlah_rusak_ringan) },
  { header: header('Rusak Berat'), width: 12, cell: (r) => num(r.jumlah_rusak_berat) },
  { header: header('Keterangan'), width: 30, cell: (r) => text(r.keterangan) },
];

// ---------------------------------------------------------------------------
// Builder (murni, tanpa I/O)
// ---------------------------------------------------------------------------

/**
 * Workbook Riwayat: sheet "Riwayat" + sheet "Detail Barang".
 * `namaLab` hanya untuk konteks (tidak dipakai kolom).
 */
export async function buildRiwayatWorkbook(
  riwayat: RiwayatExportRow[],
  detail: DetailExportRow[],
): Promise<Buffer> {
  const sheets = [
    {
      sheet: 'Riwayat',
      columns: riwayatColumns,
      data: getSheetData(riwayat, riwayatColumns),
    },
    {
      sheet: 'Detail Barang',
      columns: detailColumns,
      data: getSheetData(detail, detailColumns),
    },
  ] as Sheet<any>[];
  const file = writeXlsxFile(sheets);
  return file.toBuffer();
}

/** Workbook Inventaris: sheet "Inventaris". */
export async function buildInventarisWorkbook(
  rows: InventarisExportRow[],
): Promise<Buffer> {
  const sheets = [
    {
      sheet: 'Inventaris',
      columns: inventarisColumns,
      data: getSheetData(rows, inventarisColumns),
    },
  ] as Sheet<any>[];
  const file = writeXlsxFile(sheets);
  return file.toBuffer();
}

/** Nama lab untuk nama file (aman dari path traversal). */
export { labName, labSlug } from '@/lib/lab-map';
