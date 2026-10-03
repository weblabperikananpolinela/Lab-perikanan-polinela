import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  buildRiwayatWorkbook,
  labName,
  labSlug,
  type DetailExportRow,
  type RiwayatExportRow,
} from '@/lib/export-excel';

export const dynamic = 'force-dynamic';

const SYSTEM_ADMIN_ROLE = 'system_admin';

/** Status sah yang ditampilkan di tab Riwayat (v5.7.0). */
const VALID_STATUSES = ['Disetujui', 'Selesai', 'selesai', 'Dibatalkan'];

/**
 * Otorisasi: user harus pemegang `whitelist_admin`; lab_id boleh diexport
 * bila user system_admin (lab mana pun) atau admin yang memegang lab tersebut.
 */
async function authorizeLabId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userEmail: string,
  labId: number,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { data: adminRows } = await supabase
    .from('whitelist_admin')
    .select('role, lab_id')
    .eq('email', userEmail);

  if (!adminRows || adminRows.length === 0) {
    return { ok: false, status: 403, message: 'Anda tidak punya akses.' };
  }

  const isSystemAdmin = adminRows.some((r: any) => r.role === SYSTEM_ADMIN_ROLE);
  if (isSystemAdmin) return { ok: true };

  const holdsLab = adminRows.some(
    (r: any) => r.role !== SYSTEM_ADMIN_ROLE && Number(r.lab_id) === labId,
  );
  if (holdsLab) return { ok: true };

  return { ok: false, status: 403, message: 'Anda tidak berhak mengunduh lab ini.' };
}

/** Ambil semua peminjaman lab (loop halaman, hindari default limit). */
async function fetchRiwayat(supabase: any, labId: number) {
  const rows: RiwayatExportRow[] = [];
  const PAGE = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('peminjaman')
      .select(
        'id, nama_lengkap, kategori_pemohon, judul_kegiatan, lab_id, tanggal, jam_mulai, jam_selesai, status, total_biaya, bukti_pembayaran, pesan_feedback',
      )
      .eq('lab_id', labId)
      .in('status', VALID_STATUSES)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data as RiwayatExportRow[]);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

/** Ambil detail item untuk semua peminjaman (satu query .in()). */
async function fetchDetail(
  supabase: any,
  riwayat: RiwayatExportRow[],
): Promise<{ detail: DetailExportRow[] }> {
  const ids = riwayat.map((r) => r.id);
  if (ids.length === 0) return { detail: [] };

  const byId = new Map(riwayat.map((r) => [r.id, r]));
  const detail: DetailExportRow[] = [];
  const PAGE = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('peminjaman_item')
      .select(
        'peminjaman_id, nama_alat_bahan, jumlah, jumlah_kembali_baik, jumlah_kembali_rusak_ringan, jumlah_kembali_rusak_berat, catatan_pengembalian',
      )
      .in('peminjaman_id', ids)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const it of data) {
      detail.push({
        peminjaman_id: it.peminjaman_id,
        nama_peminjam: byId.get(it.peminjaman_id)?.nama_lengkap ?? null,
        nama_alat_bahan: it.nama_alat_bahan,
        jumlah: it.jumlah,
        jumlah_kembali_baik: it.jumlah_kembali_baik,
        jumlah_kembali_rusak_ringan: it.jumlah_kembali_rusak_ringan,
        jumlah_kembali_rusak_berat: it.jumlah_kembali_rusak_berat,
        catatan_pengembalian: it.catatan_pengembalian,
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return { detail };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const labId = Number(url.searchParams.get('lab_id'));
    if (!Number.isInteger(labId) || labId <= 0) {
      return NextResponse.json({ error: 'lab_id tidak valid' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const auth = await authorizeLabId(supabase, user.email, labId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const riwayat = await fetchRiwayat(supabase, labId);
    const { detail } = await fetchDetail(supabase, riwayat);

    const buffer = await buildRiwayatWorkbook(riwayat, detail);

    const today = new Date().toISOString().slice(0, 10);
    const filename = `Riwayat-Peminjaman-${labSlug(labId)}-${today}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Lab-Name': encodeURIComponent(labName(labId)),
      },
    });
  } catch (error: any) {
    console.error('Export riwayat error:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan sistem' },
      { status: 500 },
    );
  }
}
