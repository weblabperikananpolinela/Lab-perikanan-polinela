import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient, hasServiceRoleKey } from '@/lib/supabase/service';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Otorisasi via whitelist_admin (bukan hardcode email), agar admin tambahan
// tidak perlu ubah kode. Role system_admin = akses penuh.
const SYSTEM_ADMIN_ROLE = 'system_admin';

// Kapasitas referensi (bukan hard limit): Postgres project Supabase free tier
// ±500 MB. Dipakai hanya untuk menampilkan persentase pemakaian. Ubah bila
// project di-upgrade.
const DB_CAPACITY_BYTES = 500 * 1024 * 1024;

/**
 * Ringkasan kesehatan untuk panel Overview system admin (v5.3.0).
 * Hanya menampilkan status tingkat tinggi; kredensial tidak pernah keluar
 * dari server.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data: adminRow } = await supabase
      .from('whitelist_admin')
      .select('role')
      .eq('email', user.email)
      .eq('role', SYSTEM_ADMIN_ROLE)
      .maybeSingle();
    if (!adminRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // --- Database: sehat + ukuran -------------------------------------
    const dbStarted = Date.now();
    let dbHealthy = true;
    let dbSizeBytes: number | null = null;

    const { error: dbError } = await supabase
      .from('laboratorium')
      .select('id', { count: 'exact', head: true });
    if (dbError) dbHealthy = false;

    // Ukuran Postgres butuh hak istimewa; hanya tersedia bila service key ada.
    if (hasServiceRoleKey()) {
      try {
        const service = createServiceClient();
        const { data } = await service.rpc('get_db_size');
        if (typeof data === 'number') dbSizeBytes = data;
      } catch (err) {
        console.error('DB size lookup failed:', err);
      }
    }

    const latencyMs = Date.now() - dbStarted;
    if (latencyMs > 3000) dbHealthy = false;

    const dbSizePercent =
      dbSizeBytes != null ? (dbSizeBytes / DB_CAPACITY_BYTES) * 100 : null;

    // --- Penyimpanan (Cloudinary) -------------------------------------
    let storage: { healthy: boolean; usedPercent: number } | null = null;
    try {
      const usage = await cloudinary.api.usage();
      const usedPercent = Number(usage.credits?.used_percent ?? 0);
      storage = { healthy: usedPercent < 80, usedPercent };
    } catch (err) {
      console.error('Cloudinary usage lookup failed:', err);
      storage = null;
    }

    // --- Info umum ----------------------------------------------------
    const { count: waiting } = await supabase
      .from('peminjaman')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Menunggu validasi');

    const { count: adminCount } = await supabase
      .from('whitelist_admin')
      .select('email', { count: 'exact', head: true });

    const { data: maintenance } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    return NextResponse.json({
      ok: dbHealthy,
      db: { healthy: dbHealthy, sizePercent: dbSizePercent },
      storage,
      pengajuanMenunggu: waiting ?? 0,
      adminCount: adminCount ?? 0,
      maintenanceMode: maintenance?.value === true,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
