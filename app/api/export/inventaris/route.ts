import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  buildInventarisWorkbook,
  labName,
  labSlug,
  type InventarisExportRow,
} from '@/lib/export-excel';

export const dynamic = 'force-dynamic';

const SYSTEM_ADMIN_ROLE = 'system_admin';

/**
 * Otorisasi sama dengan /api/export/riwayat: user harus pemegang
 * whitelist_admin; lab_id boleh diexport bila system_admin atau pemegang lab.
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

/** Kategori inventaris milik lab (semua, tanpa filter is_bisa_berkurang). */
async function fetchKategori(supabase: any, labId: number) {
  const rows: { id: number; nama_kategori: string | null }[] = [];
  const PAGE = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('kategori_inventaris')
      .select('id, nama_kategori')
      .eq('lab_id', labId)
      .order('nama_kategori', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...(data as any));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

/** Semua item inventaris untuk kategori-kategori lab tsb. */
async function fetchInventaris(supabase: any, kategoriIds: number[]) {
  const result: (any & { nama_kategori: string | null })[] = [];
  if (kategoriIds.length === 0) return result;

  const PAGE = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('inventaris')
      .select(
        'id, kategori_id, jenis_alat, spesifikasi, jumlah_baik, jumlah_rusak_ringan, jumlah_rusak_berat, keterangan',
      )
      .in('kategori_id', kategoriIds)
      .order('jenis_alat', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    result.push(...(data as any[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return result;
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

    const kategori = await fetchKategori(supabase, labId);
    const kategoriMap = new Map(kategori.map((k) => [k.id, k.nama_kategori]));

    const items = await fetchInventaris(supabase, kategori.map((k) => k.id));

    const rows = items.map((it) => ({
      nama_kategori: kategoriMap.get(it.kategori_id) ?? null,
      jenis_alat: it.jenis_alat,
      spesifikasi: it.spesifikasi,
      jumlah_baik: it.jumlah_baik,
      jumlah_rusak_ringan: it.jumlah_rusak_ringan,
      jumlah_rusak_berat: it.jumlah_rusak_berat,
      keterangan: it.keterangan,
    }));

    const buffer = await buildInventarisWorkbook(rows);

    const today = new Date().toISOString().slice(0, 10);
    const filename = `Inventaris-${labSlug(labId)}-${today}.xlsx`;

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
    console.error('Export inventaris error:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan sistem' },
      { status: 500 },
    );
  }
}
